<?php

namespace App\Services\Inventory;

use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\PurchaseOrderLine;
use App\Models\Receipt;
use App\Models\ReceiptLine;
use App\Models\StockLedger;
use App\Models\StockMove;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReceiptService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Generate the next Receipt ID (e.g. WH-PKU/IN/0001).
     */
    public function generateReceiptId(?string $locationCode = 'WH-PKU'): string
    {
        $prefix = sprintf('%s/IN/', $locationCode ?: 'WH-PKU');
        $maxNum = 0;
        $receipts = DB::table('receipts')->pluck('id');

        foreach ($receipts as $id) {
            if (preg_match('/(?:WH-PKU|WH)\/IN\/(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $next = $maxNum + 1;
        return sprintf('%s%04d', $prefix, $next);
    }

    /**
     * Validate a Receipt from PO with QC acceptance/rejection (F-13, SR-12).
     *
     * @param Receipt $receipt
     * @param array $linesData Array of ['id' => line_id, 'qty_accepted' => float, 'qty_rejected' => float, 'rejection_reason' => ?string]
     * @param User|null $actor
     * @param string|null $idempotencyKey
     * @return array
     * @throws ValidationException|Exception
     */
    public function validateReceipt(Receipt $receipt, array $linesData, ?User $actor = null, ?string $idempotencyKey = null): array
    {
        // 1. Idempotency Check: if already validated, return safely without duplicate moves (T-28, T-40)
        if ($receipt->isValidated()) {
            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_RECEIPT_VALIDATE',
                status: 'DUPLICATE',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'system',
                actorRole: $actor?->role_id ?? 'system',
                documentType: 'receipt',
                documentId: $receipt->id,
                notes: 'Permintaan validasi ulang pada Receipt yang sudah berstatus Validated diabaikan secara idempotent'
            );

            return [
                'receipt' => $receipt->fresh(['lines.product', 'purchaseOrder.vendor']),
                'journal_entry' => null,
                'already_done' => true,
            ];
        }

        return DB::transaction(function () use ($receipt, $linesData, $actor, $idempotencyKey) {
            $actorId = $actor?->id ?? User::first()->id;
            $locationTo = $receipt->location_to;

            $linesMap = collect($linesData)->keyBy('id');
            $receiptLines = $receipt->lines()->get();

            $totalAcceptedValue = '0.00';

            // 2. Strict QC validation: accepted + rejected must NOT exceed expected (T-22 / SR-12)
            foreach ($receiptLines as $line) {
                $itemInput = $linesMap[$line->id] ?? null;

                $accepted = $itemInput ? (float) $itemInput['qty_accepted'] : (float) $line->qty_accepted;
                $rejected = $itemInput ? (float) $itemInput['qty_rejected'] : (float) $line->qty_rejected;
                $reason = $itemInput['rejection_reason'] ?? $line->rejection_reason;

                if ($accepted < 0 || $rejected < 0) {
                    throw ValidationException::withMessages([
                        'quantity' => "Kuantitas diterima atau ditolak untuk SKU {$line->variant_sku} tidak boleh bernilai negatif.",
                    ]);
                }

                $sumTotal = bcadd((string) $accepted, (string) $rejected, 3);
                $expected = (string) $line->qty_expected;

                // T-22 check: if accepted + rejected > expected
                if (bccomp($sumTotal, $expected, 3) > 0) {
                    AuditLog::record(
                        action: 'REJECTED_RECEIPT_QUANTITY_OVERFLOW',
                        status: 'REJECTED',
                        actorUserId: $actorId,
                        actorUsername: $actor?->name ?? 'warehouse.demo',
                        actorRole: $actor?->role_id ?? 'warehouse',
                        documentType: 'receipt',
                        documentId: $receipt->id,
                        notes: "Penerimaan ditolak: Total fisik diterima ({$accepted} + {$rejected} = {$sumTotal}) melebihi kuantitas PO ({$expected}) untuk {$line->variant_sku} (Aturan SR-12)"
                    );

                    throw ValidationException::withMessages([
                        'quantity' => "Total kuantitas diterima ({$accepted}) dan ditolak ({$rejected}) sebesar {$sumTotal} unit melebihi kuantitas yang dipesan ({$expected} unit) untuk produk {$line->variant_sku}. Transaksi dibatalkan (SR-12).",
                    ]);
                }

                $unitCost = (string) $line->unit_cost;
                $acceptedVal = bcmul((string) $accepted, $unitCost, 2);
                $totalAcceptedValue = bcadd($totalAcceptedValue, $acceptedVal, 2);

                // Update line record
                $line->update([
                    'qty_accepted' => $accepted,
                    'qty_rejected' => $rejected,
                    'rejection_reason' => $reason,
                    'accepted_value' => $acceptedVal,
                ]);

                // Update PO line received qty
                if ($line->po_line_id) {
                    $poLine = PurchaseOrderLine::find($line->po_line_id);
                    if ($poLine) {
                        $newReceived = bcadd((string) $poLine->qty_received, (string) $accepted, 3);
                        $poLine->update(['qty_received' => $newReceived]);
                    }
                }

                // 3. Mutasi stok fisik HANYA untuk barang yang lolos QC (accepted) (T-21)
                if ($accepted > 0) {
                    $currentOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $locationTo);
                    $newOnHand = bcadd((string) $currentOnHand, (string) $accepted, 3);

                    StockLedger::create([
                        'variant_sku' => $line->variant_sku,
                        'location_code' => $locationTo,
                        'move_type' => 'in_receipt',
                        'qty_change' => $accepted,
                        'qty_on_hand_after' => $newOnHand,
                        'unit_cost' => $unitCost,
                        'total_value_change' => $acceptedVal,
                        'source_document_type' => 'receipt',
                        'source_document_id' => $receipt->id,
                        'moved_by' => $actorId,
                        'created_at' => now(),
                    ]);

                    StockMove::create([
                        'source_document_type' => 'receipt',
                        'source_document_id' => $receipt->id,
                        'variant_sku' => $line->variant_sku,
                        'location_from' => 'VENDOR',
                        'location_to' => $locationTo,
                        'qty_done' => $accepted,
                        'unit_cost' => $unitCost,
                        'total_value' => $acceptedVal,
                        'state' => 'done',
                        'done_at' => now(),
                        'done_by' => $actorId,
                    ]);
                }
            }

            // 4. Accounting Journal Entry for Received Stock (Interim Received):
            // Debit: 1200 (Persediaan)
            // Credit: 1400 (Stock Interim Received)
            $journalEntry = null;
            if (bccomp($totalAcceptedValue, '0.00', 2) > 0) {
                $jeCount = JournalEntry::count() + 1;
                $jeNo = sprintf('JE/RCP/%04d', $jeCount);

                $journalEntry = JournalEntry::create([
                    'entry_no' => $jeNo,
                    'entry_type' => 'stock_transfer',
                    'source_document_type' => 'receipt',
                    'source_document_id' => $receipt->id,
                    'entry_date' => now()->toDateString(),
                    'description' => "Penerimaan Barang {$receipt->id} atas PO {$receipt->purchase_order_id}",
                    'status' => 'posted',
                    'is_balanced' => true,
                    'total_debit' => $totalAcceptedValue,
                    'total_credit' => $totalAcceptedValue,
                    'posted_at' => now(),
                    'posted_by' => $actorId,
                    'created_by' => $actorId,
                ]);

                // Debit: Persediaan (1200)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code' => '1200',
                    'description' => "Penambahan Persediaan - {$receipt->id}",
                    'debit' => $totalAcceptedValue,
                    'credit' => 0,
                    'created_at' => now(),
                ]);

                // Credit: Stock Interim Received (1400)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code' => '1400',
                    'description' => "Hutang Penerimaan Barang Sementara - {$receipt->id}",
                    'debit' => 0,
                    'credit' => $totalAcceptedValue,
                    'created_at' => now(),
                ]);
            }

            // 5. Update Receipt status to validated
            $receipt->update([
                'status' => 'validated',
                'validated_at' => now(),
                'validated_by' => $actorId,
                'idempotency_key' => $idempotencyKey ?? $receipt->idempotency_key ?? uniqid('rcp_val_'),
            ]);

            // Audit Trail
            AuditLog::record(
                action: 'VALIDATE_RECEIPT',
                status: 'SUCCESS',
                actorUserId: $actorId,
                actorUsername: $actor?->name ?? 'warehouse.demo',
                actorRole: $actor?->role_id ?? 'warehouse',
                documentType: 'receipt',
                documentId: $receipt->id,
                notes: "Validasi penerimaan {$receipt->id} berhasil. Nilai persediaan masuk Rp " . number_format((float) $totalAcceptedValue, 0, ',', '.')
            );

            return [
                'receipt' => $receipt->fresh(['lines.product', 'purchaseOrder.vendor']),
                'journal_entry' => $journalEntry,
                'already_done' => false,
            ];
        });
    }
}

