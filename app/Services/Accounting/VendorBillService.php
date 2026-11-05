<?php

namespace App\Services\Accounting;

use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\PaymentTerm;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\Receipt;
use App\Models\ReceiptLine;
use App\Models\User;
use App\Models\VendorBill;
use App\Models\VendorBillLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Layanan Vendor Bill dengan validasi Three-Way Match (F-14, F-23, SR-05, SR-06, SR-13, T-20, T-23, T-24).
 */
class VendorBillService
{
    public function __construct(
        protected TaxCalculationService $taxService
    ) {}

    /**
     * Generate ID Vendor Bill berformat BILL-0001 (mengabaikan BILL-OPEN01).
     */
    public function generateBillId(): string
    {
        $ids = DB::table('vendor_bills')
            ->where('id', 'LIKE', 'BILL-%')
            ->pluck('id');

        $maxNumeric = 0;
        foreach ($ids as $id) {
            if (preg_match('/^BILL-(\d+)$/', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNumeric) {
                    $maxNumeric = $num;
                }
            }
        }

        return sprintf('BILL-%04d', $maxNumeric + 1);
    }

    /**
     * Ambil matriks perbandingan Three-Way Match (PO vs Accepted Receipt vs Already Billed)
     * untuk suatu Purchase Order.
     */
    public function getThreeWayMatchForPo(PurchaseOrder $po, ?string $excludeBillId = null): array
    {
        $po->loadMissing(['vendor', 'lines.product', 'receipts.lines']);

        $validatedReceipts = $po->receipts->where('status', 'validated')->values();
        $validatedReceiptIds = $validatedReceipts->pluck('id')->all();

        $lines = [];
        foreach ($po->lines as $poLine) {
            // Hitung qty_accepted dan qty_rejected dari seluruh Receipt yang berstatus validated
            $rcpLines = ReceiptLine::whereIn('receipt_id', $validatedReceiptIds)
                ->where(function ($q) use ($poLine) {
                    $q->where('po_line_id', $poLine->id)
                      ->orWhere('variant_sku', $poLine->variant_sku);
                })
                ->get();

            $qtyAccepted = (float) $rcpLines->sum('qty_accepted');
            $qtyRejected = (float) $rcpLines->sum('qty_rejected');

            // Jika belum ada receipt_lines tetapi qty_received pada po_line terisi
            if ($qtyAccepted <= 0 && (float) $poLine->qty_received > 0 && count($validatedReceiptIds) > 0) {
                $qtyAccepted = (float) $poLine->qty_received;
            }

            // Hitung qty yang sudah ditagihkan pada Vendor Bill aktif (draft/posted/paid) selain bill ini
            $alreadyBilledQuery = VendorBillLine::whereHas('vendorBill', function ($q) use ($po, $excludeBillId) {
                $q->where('purchase_order_id', $po->id)
                  ->whereIn('status', ['posted', 'paid']);
                if ($excludeBillId) {
                    $q->where('id', '!=', $excludeBillId);
                }
            })->where(function ($q) use ($poLine) {
                $q->where('po_line_id', $poLine->id)
                  ->orWhere('variant_sku', $poLine->variant_sku);
            });

            $qtyAlreadyBilled = (float) $alreadyBilledQuery->sum('qty_billed');
            $maxBillableQty   = max(0.0, $qtyAccepted - $qtyAlreadyBilled);

            $latestRcpLine = $rcpLines->last();

            $calc = $this->taxService->calculateLine($maxBillableQty, (string) $poLine->unit_price);

            $lines[] = [
                'po_line_id'          => $poLine->id,
                'receipt_line_id'     => $latestRcpLine?->id,
                'variant_sku'         => $poLine->variant_sku,
                'product_name'        => $poLine->product?->name ?? $poLine->variant_sku,
                'size'                => $poLine->product?->size,
                'color'               => $poLine->product?->color,
                'unit'                => $poLine->product?->unit ?? 'pcs',
                'unit_price'          => (float) $poLine->unit_price,
                'tax_id'              => $poLine->tax_id ?: TaxCalculationService::DEFAULT_TAX_ID,
                'qty_ordered'         => (float) $poLine->qty_ordered,
                'qty_accepted'        => $qtyAccepted,
                'qty_rejected'        => $qtyRejected,
                'qty_already_billed'  => $qtyAlreadyBilled,
                'max_billable_qty'    => $maxBillableQty,
                'default_subtotal'    => (float) $calc['subtotal_before_tax'],
                'default_tax'         => (float) $calc['tax_amount'],
                'default_line_total'  => (float) $calc['line_total'],
            ];
        }

        return [
            'purchase_order_id'      => $po->id,
            'vendor_id'              => $po->vendor_id,
            'vendor_name'            => $po->vendor?->name,
            'payment_terms'          => $po->payment_terms,
            'has_validated_receipt'  => $validatedReceipts->isNotEmpty(),
            'primary_receipt_id'     => $validatedReceipts->first()?->id,
            'validated_receipts'     => $validatedReceipts->map(fn (Receipt $r) => [
                'id'           => $r->id,
                'receipt_date' => $r->receipt_date?->format('Y-m-d'),
                'validated_at' => $r->validated_at?->format('d/m/Y H:i'),
                'location_to'  => $r->location_to,
            ])->all(),
            'lines'                  => $lines,
        ];
    }

    /**
     * Buat Vendor Bill (dan opsional langsung Post) setelah lolos validasi Three-Way Match.
     *
     * @param array{
     *   purchase_order_id: string,
     *   receipt_id?: string|null,
     *   bill_date?: string|null,
     *   notes?: string|null,
     *   idempotency_key?: string|null,
     *   auto_post?: bool,
     *   lines: array<int, array{
     *     po_line_id?: int|null,
     *     receipt_line_id?: int|null,
     *     variant_sku: string,
     *     qty_billed: float|int|string,
     *     unit_price?: float|int|string
     *   }>
     * } $data
     */
    public function createBill(array $data, User $actor, bool $autoPost = false): array
    {
        if (! empty($data['idempotency_key'])) {
            $existing = VendorBill::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                AuditLog::record(
                    action: 'ATTEMPT_DUPLICATE_VENDOR_BILL',
                    status: 'DUPLICATE',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'finance',
                    documentType: 'vendor_bill',
                    documentId: $existing->id,
                    notes: "Permintaan pembuatan Vendor Bill dengan idempotency_key yang sama diabaikan (Idempotent)."
                );

                return [
                    'bill'           => $existing->fresh(['lines.product', 'vendor', 'purchaseOrder', 'receipt', 'journalEntry.lines']),
                    'already_posted' => $existing->isPosted() || $existing->isPaid(),
                ];
            }
        }

        $po = PurchaseOrder::with(['vendor', 'lines.product', 'receipts.lines'])
            ->findOrFail($data['purchase_order_id']);

        // Validasi Three-Way Match SEBELUM membuka transaksi tulis (agar log penolakan tetap tersimpan di DB!)
        $matchMatrix = $this->getThreeWayMatchForPo($po);
        $this->assertThreeWayMatch($po, $matchMatrix, $data['lines'] ?? [], $actor, null);

        return DB::transaction(function () use ($data, $po, $matchMatrix, $actor, $autoPost) {
            $billId       = $this->generateBillId();
            $billDate     = $data['bill_date'] ?? now()->toDateString();
            $paymentTerms = $po->payment_terms ?: ($po->vendor?->payment_terms ?? 'NET30');
            $term         = PaymentTerm::find($paymentTerms);
            $dueDays      = $term?->due_days ?? 30;
            $dueDate      = now()->parse($billDate)->addDays($dueDays)->toDateString();

            $matchLinesBySku = collect($matchMatrix['lines'])->keyBy('variant_sku');

            $subtotalBeforeTax = '0.00';
            $totalTax          = '0.00';
            $grandTotal        = '0.00';
            $preparedLines     = [];

            foreach ($data['lines'] as $inputLine) {
                $sku       = $inputLine['variant_sku'];
                $qtyBilled = (float) $inputLine['qty_billed'];
                if ($qtyBilled <= 0) {
                    continue;
                }

                $mLine     = $matchLinesBySku[$sku] ?? null;
                $unitPrice = isset($inputLine['unit_price'])
                    ? (string) $inputLine['unit_price']
                    : (string) ($mLine['unit_price'] ?? '0');
                $taxId     = $mLine['tax_id'] ?? TaxCalculationService::DEFAULT_TAX_ID;

                $calc = $this->taxService->calculateLine($qtyBilled, $unitPrice);

                $subtotalBeforeTax = bcadd($subtotalBeforeTax, $calc['subtotal_before_tax'], 2);
                $totalTax          = bcadd($totalTax, $calc['tax_amount'], 2);
                $grandTotal        = bcadd($grandTotal, $calc['line_total'], 2);

                $preparedLines[] = [
                    'vendor_bill_id'      => $billId,
                    'receipt_line_id'     => $inputLine['receipt_line_id'] ?? $mLine['receipt_line_id'] ?? null,
                    'po_line_id'          => $inputLine['po_line_id'] ?? $mLine['po_line_id'] ?? null,
                    'variant_sku'         => $sku,
                    'qty_billed'          => number_format($qtyBilled, 3, '.', ''),
                    'unit_price'          => number_format((float) $unitPrice, 2, '.', ''),
                    'tax_id'              => $taxId,
                    'subtotal_before_tax' => $calc['subtotal_before_tax'],
                    'tax_amount'          => $calc['tax_amount'],
                    'line_total'          => $calc['line_total'],
                ];
            }

            if (empty($preparedLines)) {
                throw ValidationException::withMessages([
                    'lines' => 'Minimal satu baris barang dengan kuantitas > 0 wajib diisi.',
                ]);
            }

            $bill = VendorBill::create([
                'id'                  => $billId,
                'source_doc_no'       => $po->source_doc_no,
                'purchase_order_id'   => $po->id,
                'receipt_id'          => $data['receipt_id'] ?? $matchMatrix['primary_receipt_id'],
                'vendor_id'           => $po->vendor_id,
                'status'              => 'draft',
                'bill_date'           => $billDate,
                'due_date'            => $dueDate,
                'payment_terms'       => $paymentTerms,
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax'           => $totalTax,
                'grand_total'         => $grandTotal,
                'amount_paid'         => '0.00',
                'amount_residual'     => $grandTotal,
                'idempotency_key'     => $data['idempotency_key'] ?? null,
                'notes'               => $data['notes'] ?? "Vendor Bill atas PO {$po->id}",
                'created_by'          => $actor->id,
            ]);

            foreach ($preparedLines as $pl) {
                VendorBillLine::create($pl);
            }

            AuditLog::record(
                action: 'CREATE_VENDOR_BILL',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'vendor_bill',
                documentId: $bill->id,
                newValue: [
                    'purchase_order_id'   => $po->id,
                    'receipt_id'          => $bill->receipt_id,
                    'subtotal_before_tax' => $subtotalBeforeTax,
                    'total_tax'           => $totalTax,
                    'grand_total'         => $grandTotal,
                ],
                notes: "Draft Vendor Bill {$bill->id} dibuat untuk PO {$po->id} (Total Rp " . number_format((float) $grandTotal, 0, ',', '.') . ")."
            );

            if ($autoPost) {
                return $this->postBill($bill, $actor, $data['idempotency_key'] ?? null);
            }

            return [
                'bill'           => $bill->fresh(['lines.product', 'vendor', 'purchaseOrder', 'receipt']),
                'already_posted' => false,
                'journal_entry'  => null,
            ];
        });
    }

    /**
     * Post Vendor Bill (dengan validasi ulang Three-Way Match, pembentukan Jurnal GR/IR + PPN Masukan -> AP,
     * serta proteksi Idempotency SR-17).
     *
     * @param array<int, array{id?: int, variant_sku: string, qty_billed: float|int|string}>|null $overrideLines
     */
    public function postBill(VendorBill $bill, User $actor, ?string $idempotencyKey = null, ?array $overrideLines = null): array
    {
        // 1. Idempotency Guard: jika sudah Posted atau Paid, abaikan tanpa menduplikasi jurnal
        if ($bill->isPosted() || $bill->isPaid()) {
            AuditLog::record(
                action: 'POST_VENDOR_BILL',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'vendor_bill',
                documentId: $bill->id,
                notes: "Instruksi Post ulang pada Vendor Bill {$bill->id} yang sudah berstatus " . strtoupper($bill->status) . " diabaikan secara idempotent (SR-17). Jurnal tidak mengganda."
            );

            return [
                'bill'           => $bill->fresh(['lines.product', 'vendor', 'purchaseOrder', 'receipt', 'journalEntry.lines']),
                'already_posted' => true,
                'journal_entry'  => $bill->journalEntry,
            ];
        }

        if ($bill->status === 'cancelled') {
            throw ValidationException::withMessages([
                'status' => "Vendor Bill {$bill->id} berstatus Dibatalkan dan tidak dapat diposting.",
            ]);
        }

        // 2. Validasi Three-Way Match sebelum mutasi database (agar AuditLog REJECTED tersimpan meskipun throw ValidationException)
        if ($bill->purchase_order_id) {
            $po = PurchaseOrder::with(['vendor', 'lines.product', 'receipts.lines'])
                ->findOrFail($bill->purchase_order_id);
            $matchMatrix = $this->getThreeWayMatchForPo($po, $bill->id);

            $linesToValidate = $overrideLines ?? $bill->lines->map(fn ($l) => [
                'po_line_id'  => $l->po_line_id,
                'variant_sku' => $l->variant_sku,
                'qty_billed'  => (float) $l->qty_billed,
                'unit_price'  => (float) $l->unit_price,
            ])->all();

            $this->assertThreeWayMatch($po, $matchMatrix, $linesToValidate, $actor, $bill->id);
        }

        return DB::transaction(function () use ($bill, $actor, $idempotencyKey, $overrideLines) {
            /** @var VendorBill $lockedBill */
            $lockedBill = VendorBill::lockForUpdate()->with(['lines.product', 'vendor'])->findOrFail($bill->id);

            if ($lockedBill->isPosted() || $lockedBill->isPaid()) {
                return [
                    'bill'           => $lockedBill,
                    'already_posted' => true,
                    'journal_entry'  => $lockedBill->journalEntry,
                ];
            }

            // Jika ada pembaruan kuantitas baris pada saat draft akan diposting, rekalkulasi per baris (F-23)
            if ($overrideLines !== null) {
                $overrideBySku = collect($overrideLines)->keyBy('variant_sku');
                $subTotal = '0.00';
                $taxTotal = '0.00';
                $grdTotal = '0.00';

                foreach ($lockedBill->lines as $bLine) {
                    if (isset($overrideBySku[$bLine->variant_sku])) {
                        $newQty = (float) $overrideBySku[$bLine->variant_sku]['qty_billed'];
                        $calc   = $this->taxService->calculateLine($newQty, (string) $bLine->unit_price);
                        $bLine->update([
                            'qty_billed'          => number_format($newQty, 3, '.', ''),
                            'subtotal_before_tax' => $calc['subtotal_before_tax'],
                            'tax_amount'          => $calc['tax_amount'],
                            'line_total'          => $calc['line_total'],
                        ]);
                    }
                    $subTotal = bcadd($subTotal, (string) $bLine->subtotal_before_tax, 2);
                    $taxTotal = bcadd($taxTotal, (string) $bLine->tax_amount, 2);
                    $grdTotal = bcadd($grdTotal, (string) $bLine->line_total, 2);
                }

                $lockedBill->update([
                    'subtotal_before_tax' => $subTotal,
                    'total_tax'           => $taxTotal,
                    'grand_total'         => $grdTotal,
                    'amount_residual'     => $grdTotal,
                ]);
                $lockedBill->refresh();
            }

            // Update qty_billed pada PurchaseOrderLine
            foreach ($lockedBill->lines as $bLine) {
                if ($bLine->po_line_id) {
                    $poLine = PurchaseOrderLine::lockForUpdate()->find($bLine->po_line_id);
                    if ($poLine) {
                        $poLine->update([
                            'qty_billed' => bcadd((string) $poLine->qty_billed, (string) $bLine->qty_billed, 3),
                        ]);
                    }
                }
            }

            // Buat Jurnal Akuntansi Seimbang (F-16):
            // Debit 1400 (Stock Interim Received) = DPP
            // Debit 1300 (PPN Masukan)            = PPN
            // Kredit 2100 (Utang Usaha / AP)      = Grand Total
            $entryNo = $this->taxService->nextJournalEntryNo('BILL');
            $vendorName = $lockedBill->vendor?->name ?? $lockedBill->vendor_id;

            $je = JournalEntry::create([
                'entry_no'             => $entryNo,
                'entry_type'           => 'vendor_bill',
                'source_document_type' => 'vendor_bill',
                'source_document_id'   => $lockedBill->id,
                'entry_date'           => $lockedBill->bill_date?->toDateString() ?? now()->toDateString(),
                'description'          => "Faktur Pemasok {$lockedBill->id} - {$vendorName}" . ($lockedBill->purchase_order_id ? " (PO {$lockedBill->purchase_order_id})" : ''),
                'status'               => 'posted',
                'is_balanced'          => true,
                'total_debit'          => $lockedBill->grand_total,
                'total_credit'         => $lockedBill->grand_total,
                'posted_at'            => now(),
                'posted_by'            => $actor->id,
                'created_by'           => $actor->id,
            ]);

            // Line 1: Debit 1400 Stock Interim Received (DPP)
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '1400',
                'description'      => "Penyelesaian Penerimaan Sementara (GR/IR) - {$lockedBill->id}",
                'debit'            => $lockedBill->subtotal_before_tax,
                'credit'           => '0.00',
                'variant_sku'      => $lockedBill->lines->first()?->variant_sku,
                'created_at'       => now(),
            ]);

            // Line 2: Debit 1300 PPN Masukan (Total Tax)
            if (bccomp((string) $lockedBill->total_tax, '0.00', 2) > 0) {
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => '1300',
                    'description'      => "PPN Masukan 11% - {$lockedBill->id}",
                    'debit'            => $lockedBill->total_tax,
                    'credit'           => '0.00',
                    'created_at'       => now(),
                ]);
            }

            // Line 3: Credit 2100 Utang Usaha (Grand Total)
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '2100',
                'description'      => "Utang Usaha {$vendorName} - {$lockedBill->id}",
                'debit'            => '0.00',
                'credit'           => $lockedBill->grand_total,
                'created_at'       => now(),
            ]);

            $lockedBill->update([
                'status'           => 'posted',
                'amount_paid'      => '0.00',
                'amount_residual'  => $lockedBill->grand_total,
                'posted_at'        => now(),
                'posted_by'        => $actor->id,
                'journal_entry_id' => $je->id,
                'idempotency_key'  => $idempotencyKey ?? $lockedBill->idempotency_key ?? uniqid('bill_post_'),
            ]);

            AuditLog::record(
                action: 'POST_VENDOR_BILL',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'vendor_bill',
                documentId: $lockedBill->id,
                newValue: [
                    'status'              => 'posted',
                    'journal_entry_no'    => $je->entry_no,
                    'subtotal_before_tax' => (string) $lockedBill->subtotal_before_tax,
                    'total_tax'           => (string) $lockedBill->total_tax,
                    'grand_total'         => (string) $lockedBill->grand_total,
                ],
                notes: "Vendor Bill {$lockedBill->id} berhasil diposting (Three-Way Match Valid). DPP Rp " .
                       number_format((float) $lockedBill->subtotal_before_tax, 0, ',', '.') .
                       ", PPN Rp " . number_format((float) $lockedBill->total_tax, 0, ',', '.') .
                       ", Total AP Rp " . number_format((float) $lockedBill->grand_total, 0, ',', '.') .
                       " (Jurnal {$je->entry_no})."
            );

            return [
                'bill'           => $lockedBill->fresh(['lines.product', 'vendor', 'purchaseOrder', 'receipt', 'journalEntry.lines']),
                'already_posted' => false,
                'journal_entry'  => $je,
            ];
        });
    }

    /**
     * Validasi ketat Three-Way Match (SR-05, SR-06, SR-13, T-20, T-23, T-24).
     * Menolak pembuatan/posting tagihan jika belum ada Accepted Receipt atau jika qty_billed > max_billable_qty.
     */
    protected function assertThreeWayMatch(
        PurchaseOrder $po,
        array $matchMatrix,
        array $requestedLines,
        User $actor,
        ?string $billId = null
    ): void {
        $docIdForAudit = $billId ?? $po->id;

        // 1. Cek apakah PO sudah memiliki Receipt yang tervalidasi (T-20 / SR-05 / SR-06)
        if (! $matchMatrix['has_validated_receipt']) {
            $mismatchReport = [
                'status'            => 'BLOCKED_NO_RECEIPT',
                'purchase_order_id' => $po->id,
                'receipt_id'        => null,
                'reason'            => "Purchase Order {$po->id} belum memiliki dokumen Penerimaan Barang (Receipt) yang tervalidasi QC.",
                'items'             => collect($matchMatrix['lines'])->map(fn ($l) => [
                    'variant_sku'        => $l['variant_sku'],
                    'product_name'       => $l['product_name'],
                    'po_ordered_qty'     => $l['qty_ordered'],
                    'receipt_accepted'   => 0,
                    'receipt_rejected'   => 0,
                    'already_billed_qty' => $l['qty_already_billed'],
                    'max_billable_qty'   => 0,
                    'requested_bill_qty' => (float) (collect($requestedLines)->firstWhere('variant_sku', $l['variant_sku'])['qty_billed'] ?? $l['qty_ordered']),
                    'excess_qty'         => (float) (collect($requestedLines)->firstWhere('variant_sku', $l['variant_sku'])['qty_billed'] ?? $l['qty_ordered']),
                ])->all(),
            ];

            session()->flash('mismatch_report', $mismatchReport);

            AuditLog::record(
                action: 'REJECTED_BILL_NO_RECEIPT',
                status: 'REJECTED',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'vendor_bill',
                documentId: $docIdForAudit,
                oldValue: ['purchase_order_id' => $po->id, 'validated_receipts_count' => 0],
                newValue: $mismatchReport,
                notes: "Penolakan Three-Way Match (SR-05/SR-06): PO {$po->id} belum memiliki Accepted Receipt yang tervalidasi."
            );

            throw ValidationException::withMessages([
                'three_way_match' => "Three-Way Match Diblokir (SR-05 & SR-06): Purchase Order {$po->id} belum memiliki Penerimaan Barang (Accepted Receipt) yang tervalidasi. Tagihan pemasok atau pembayaran tidak dapat diproses.",
            ]);
        }

        // 2. Cek kuantitas per baris terhadap Accepted Qty pada Receipt (T-24 / SR-06 / SR-13)
        $matchBySku = collect($matchMatrix['lines'])->keyBy('variant_sku');
        $mismatches = [];

        foreach ($requestedLines as $reqLine) {
            $sku          = $reqLine['variant_sku'] ?? '';
            $requestedQty = (float) ($reqLine['qty_billed'] ?? 0);

            if (! isset($matchBySku[$sku])) {
                throw ValidationException::withMessages([
                    'three_way_match' => "Produk SKU {$sku} tidak ditemukan pada Purchase Order {$po->id}.",
                ]);
            }

            if ($requestedQty < 0) {
                throw ValidationException::withMessages([
                    'three_way_match' => "Kuantitas tagihan untuk SKU {$sku} tidak boleh bernilai negatif.",
                ]);
            }

            $mLine          = $matchBySku[$sku];
            $maxBillableQty = (float) $mLine['max_billable_qty'];

            if (bccomp((string) $requestedQty, (string) $maxBillableQty, 3) > 0) {
                $excessQty = (float) bcsub((string) $requestedQty, (string) $maxBillableQty, 3);
                $mismatches[] = [
                    'variant_sku'        => $sku,
                    'product_name'       => $mLine['product_name'],
                    'po_ordered_qty'     => $mLine['qty_ordered'],
                    'receipt_accepted'   => $mLine['qty_accepted'],
                    'receipt_rejected'   => $mLine['qty_rejected'],
                    'already_billed_qty' => $mLine['qty_already_billed'],
                    'max_billable_qty'   => $maxBillableQty,
                    'requested_bill_qty' => $requestedQty,
                    'excess_qty'         => $excessQty,
                ];
            }
        }

        if (! empty($mismatches)) {
            $first = $mismatches[0];
            $mismatchReport = [
                'status'            => 'BLOCKED_QUANTITY_MISMATCH',
                'purchase_order_id' => $po->id,
                'receipt_id'        => $matchMatrix['primary_receipt_id'],
                'reason'            => sprintf(
                    'Ketidakcocokan Three-Way Match pada SKU %s: Kuantitas ditagih (%s unit) melebihi kuantitas diterima baik / Accepted QC (%s unit dari PO %s unit; Rejected %s unit). Kelebihan %s unit diblokir.',
                    $first['variant_sku'],
                    number_format($first['requested_bill_qty'], 0, ',', '.'),
                    number_format($first['receipt_accepted'], 0, ',', '.'),
                    number_format($first['po_ordered_qty'], 0, ',', '.'),
                    number_format($first['receipt_rejected'], 0, ',', '.'),
                    number_format($first['excess_qty'], 0, ',', '.')
                ),
                'items'             => $mismatches,
            ];

            session()->flash('mismatch_report', $mismatchReport);

            AuditLog::record(
                action: 'THREE_WAY_MATCH_REJECTED',
                status: 'REJECTED',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'vendor_bill',
                documentId: $docIdForAudit,
                oldValue: [
                    'purchase_order_id' => $po->id,
                    'receipt_id'        => $matchMatrix['primary_receipt_id'],
                    'po_ordered_qty'    => $first['po_ordered_qty'],
                    'receipt_accepted'  => $first['receipt_accepted'],
                    'receipt_rejected'  => $first['receipt_rejected'],
                    'max_billable_qty'  => $first['max_billable_qty'],
                ],
                newValue: [
                    'requested_bill_qty' => $first['requested_bill_qty'],
                    'excess_qty'         => $first['excess_qty'],
                    'mismatches'         => $mismatches,
                ],
                notes: $mismatchReport['reason']
            );

            throw ValidationException::withMessages([
                'three_way_match' => $mismatchReport['reason'] . ' Sesuai aturan SR-06 dan SR-13, tagihan pemasok diblokir sebelum posting.',
            ]);
        }
    }
}

