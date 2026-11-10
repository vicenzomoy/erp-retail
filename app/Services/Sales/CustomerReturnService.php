<?php

namespace App\Services\Sales;

use App\Models\AuditLog;
use App\Models\CreditNote;
use App\Models\CreditNoteLine;
use App\Models\CustomerInvoice;
use App\Models\CustomerInvoiceLine;
use App\Models\CustomerReturn;
use App\Models\CustomerReturnLine;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\ContactCustomer;
use App\Models\Master\Product;
use App\Models\StockLedger;
use App\Models\StockMove;
use App\Models\User;
use App\Services\Accounting\TaxCalculationService;
use App\Services\Inventory\StockService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerReturnService
{
    public function __construct(
        protected TaxCalculationService $taxService,
        protected StockService $stockService
    ) {}

    /**
     * Generate ID Customer Return unik berformat RET-0001.
     */
    public function generateReturnId(): string
    {
        $ids = DB::table('customer_returns')
            ->where('id', 'LIKE', 'RET-%')
            ->pluck('id');

        $maxNumeric = 0;
        foreach ($ids as $id) {
            if (preg_match('/^RET-(\d+)$/', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNumeric) {
                    $maxNumeric = $num;
                }
            }
        }

        return sprintf('RET-%04d', $maxNumeric + 1);
    }

    /**
     * Generate ID Credit Note unik berformat CN-0001.
     */
    public function generateCreditNoteId(): string
    {
        $ids = DB::table('credit_notes')
            ->where('id', 'LIKE', 'CN-%')
            ->pluck('id');

        $maxNumeric = 0;
        foreach ($ids as $id) {
            if (preg_match('/^CN-(\d+)$/', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNumeric) {
                    $maxNumeric = $num;
                }
            }
        }

        return sprintf('CN-%04d', $maxNumeric + 1);
    }

    /**
     * Ambil daftar Faktur Pelanggan yang dapat diajukan retur beserta kalkulasi hari.
     */
    public function getEligibleInvoices(): array
    {
        $invoices = CustomerInvoice::with(['customer', 'lines.product', 'salesOrder'])
            ->whereIn('status', ['posted', 'paid'])
            ->orderByDesc('created_at')
            ->get();

        return $invoices->map(function (CustomerInvoice $inv) {
            $invDate = Carbon::parse($inv->invoice_date ?: $inv->created_at);
            $daysSince = (int) $invDate->diffInDays(now());
            $isEligible = $daysSince <= 14;

            return [
                'id'                  => $inv->id,
                'customer_id'         => $inv->customer_id,
                'customer_name'       => $inv->customer?->name,
                'sales_order_id'      => $inv->sales_order_id,
                'invoice_date'        => $invDate->format('d/m/Y'),
                'days_since_invoice'  => $daysSince,
                'is_eligible_14_days' => $isEligible,
                'grand_total'         => (float) $inv->grand_total,
                'amount_residual'     => (float) $inv->amount_residual,
                'status'              => $inv->status,
                'lines'               => $inv->lines->map(fn (CustomerInvoiceLine $l) => [
                    'id'                  => $l->id,
                    'variant_sku'         => $l->variant_sku,
                    'product_name'        => $l->product?->name ?? $l->variant_sku,
                    'qty_invoiced'        => (float) $l->qty_invoiced,
                    'unit_price'          => (float) $l->unit_price,
                    'subtotal_before_tax' => (float) $l->subtotal_before_tax,
                ]),
            ];
        })->toArray();
    }

    /**
     * Langkah 1: Sales mengajukan Permintaan Retur Pelanggan (Maksimal 14 Hari).
     */
    public function createReturnRequest(array $data, User $actor): CustomerReturn
    {
        return DB::transaction(function () use ($data, $actor) {
            $invoice = CustomerInvoice::with(['lines.product', 'customer'])->findOrFail($data['customer_invoice_id']);

            // 1. Validasi Batas Waktu 14 Hari:
            $invoiceDate = Carbon::parse($invoice->invoice_date ?: $invoice->created_at);
            $daysSince = (int) $invoiceDate->diffInDays(now());

            if ($daysSince > 14) {
                AuditLog::record(
                    action: 'sales.customer_return.rejected_policy',
                    status: 'REJECTED',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'sales',
                    documentType: 'customer_return',
                    documentId: $invoice->id,
                    newValue: ['days_since_invoice' => $daysSince],
                    notes: "Pengajuan retur ditolak: Transaksi pada faktur {$invoice->id} telah melewati batas waktu 14 hari ({$daysSince} hari)."
                );

                throw ValidationException::withMessages([
                    'customer_invoice_id' => "Pengajuan retur ditolak: Transaksi telah melewati batas waktu maksimal 14 hari kalender sejak faktur/pengiriman (faktur {$invoice->id} diterbitkan {$daysSince} hari yang lalu).",
                ]);
            }

            $returnId = $this->generateReturnId();

            $customerReturn = CustomerReturn::create([
                'id'                  => $returnId,
                'sales_order_id'      => $invoice->sales_order_id,
                'customer_invoice_id' => $invoice->id,
                'customer_id'         => $invoice->customer_id,
                'return_date'         => now()->toDateString(),
                'days_since_invoice'  => $daysSince,
                'status'              => 'pending_inspection',
                'reason'              => $data['reason'] ?? 'Retur barang oleh pelanggan',
                'sales_user_id'       => $actor->id,
                'created_by'          => $actor->id,
            ]);

            foreach ($data['lines'] as $lineData) {
                $qtyReq = (float) $lineData['qty_requested'];
                if ($qtyReq <= 0) {
                    continue;
                }

                $invLine = CustomerInvoiceLine::find($lineData['customer_invoice_line_id'] ?? null);
                $unitPrice = $invLine ? (float) $invLine->unit_price : (float) ($lineData['unit_price'] ?? 0);

                CustomerReturnLine::create([
                    'customer_return_id'       => $returnId,
                    'customer_invoice_line_id' => $invLine?->id,
                    'variant_sku'              => $lineData['variant_sku'],
                    'qty_requested'            => $qtyReq,
                    'qty_inspected'            => 0,
                    'qty_accepted'             => 0,
                    'qty_damaged'              => 0,
                    'unit_price'               => $unitPrice,
                    'condition'                => 'saleable',
                    'notes'                    => $lineData['notes'] ?? null,
                ]);
            }

            AuditLog::record(
                action: 'sales.customer_return.created',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'customer_return',
                documentId: $returnId,
                newValue: [
                    'return_id'           => $returnId,
                    'customer_invoice_id' => $invoice->id,
                    'days_since_invoice'  => $daysSince,
                    'status'              => 'pending_inspection',
                ],
                notes: "Sales berhasil mengajukan retur pelanggan {$returnId} (dalam batas aman 14 hari)."
            );

            return $customerReturn->fresh(['lines.product', 'customer', 'customerInvoice']);
        });
    }

    /**
     * Langkah 2: Warehouse melakukan Inspeksi Barang (Return Inspection) dan validasi stok.
     */
    public function validateWarehouseInspection(CustomerReturn $return, array $data, User $actor): CustomerReturn
    {
        return DB::transaction(function () use ($return, $data, $actor) {
            if ($return->status !== 'pending_inspection') {
                throw ValidationException::withMessages([
                    'status' => "Status retur {$return->id} tidak valid untuk dilakukan inspeksi gudang.",
                ]);
            }

            $locationTo = 'WH-PKU'; // Gudang utama Pekanbaru
            $linesData = collect($data['lines'] ?? [])->keyBy('id');

            foreach ($return->lines as $line) {
                $input = $linesData->get($line->id, []);
                $qtyInspected = isset($input['qty_inspected']) ? (float) $input['qty_inspected'] : (float) $line->qty_requested;
                $qtyAccepted  = isset($input['qty_accepted']) ? (float) $input['qty_accepted'] : $qtyInspected;
                $qtyDamaged   = isset($input['qty_damaged']) ? (float) $input['qty_damaged'] : max(0.0, $qtyInspected - $qtyAccepted);
                $condition    = $input['condition'] ?? ($qtyDamaged > 0 ? 'damaged' : 'saleable');

                $line->update([
                    'qty_inspected' => $qtyInspected,
                    'qty_accepted'  => $qtyAccepted,
                    'qty_damaged'   => $qtyDamaged,
                    'condition'     => $condition,
                    'notes'         => $input['notes'] ?? $line->notes,
                ]);

                // Mutasi stok fisik ke gudang untuk barang yang diterima / layak jual (accepted)
                if ($qtyAccepted > 0) {
                    $product = Product::where('variant_sku', $line->variant_sku)->first();
                    $unitCost = $product ? (float) $product->cost : (float) $line->unit_price;
                    $acceptedVal = bcmul((string) $qtyAccepted, (string) $unitCost, 2);

                    $currentOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $locationTo);
                    $newOnHand = bcadd((string) $currentOnHand, (string) $qtyAccepted, 3);

                    StockLedger::create([
                        'variant_sku'          => $line->variant_sku,
                        'location_code'        => $locationTo,
                        'move_type'            => 'in_return',
                        'qty_change'           => $qtyAccepted,
                        'qty_on_hand_after'    => $newOnHand,
                        'unit_cost'            => $unitCost,
                        'total_value_change'   => $acceptedVal,
                        'source_document_type' => 'customer_return',
                        'source_document_id'   => $return->id,
                        'moved_by'             => $actor->id,
                        'created_at'           => now(),
                    ]);

                    StockMove::create([
                        'source_document_type' => 'customer_return',
                        'source_document_id'   => $return->id,
                        'variant_sku'          => $line->variant_sku,
                        'location_from'        => 'CUSTOMER',
                        'location_to'          => $locationTo,
                        'qty_done'             => $qtyAccepted,
                        'unit_cost'            => $unitCost,
                        'total_value'          => $acceptedVal,
                        'state'                => 'done',
                        'done_at'              => now(),
                        'done_by'              => $actor->id,
                    ]);
                }
            }

            $return->update([
                'status'           => 'inspected',
                'inspected_by'     => $actor->id,
                'inspected_at'     => now(),
                'inspection_notes' => $data['inspection_notes'] ?? 'Inspeksi barang retur selesai divalidasi oleh gudang',
            ]);

            AuditLog::record(
                action: 'inventory.return_inspection.validated',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'warehouse',
                documentType: 'customer_return',
                documentId: $return->id,
                newValue: [
                    'return_id'    => $return->id,
                    'status'       => 'inspected',
                    'inspected_by' => $actor->name,
                ],
                notes: "Warehouse menyelesaikan Return Inspection dan memvalidasi penambahan stok masuk untuk retur {$return->id}."
            );

            return $return->fresh(['lines.product', 'customer', 'customerInvoice', 'inspectedBy']);
        });
    }

    /**
     * Langkah 3 & 4: Finance memproses Nota Kredit & AR Adjustments di Akuntansi.
     */
    public function processCreditNoteAndArAdjustment(CustomerReturn $return, array $data, User $actor): CreditNote
    {
        return DB::transaction(function () use ($return, $data, $actor) {
            if ($return->status !== 'inspected') {
                throw ValidationException::withMessages([
                    'status' => "Retur {$return->id} belum divalidasi oleh gudang (Return Inspection) atau sudah selesai diproses.",
                ]);
            }

            $invoice = $return->customerInvoice()->lockForUpdate()->first();
            $creditNoteId = $this->generateCreditNoteId();

            $subtotalBeforeTax = '0.00';
            $totalTax = '0.00';
            $grandTotal = '0.00';
            $totalCogsReversal = '0.00';

            $creditNote = CreditNote::create([
                'id'                  => $creditNoteId,
                'original_invoice_id' => $invoice->id,
                'customer_return_id'  => $return->id,
                'customer_id'         => $return->customer_id,
                'status'              => 'draft',
                'return_date'         => now()->toDateString(),
                'days_since_invoice'  => $return->days_since_invoice,
                'authorized_by'       => $actor->id,
                'subtotal_before_tax' => 0,
                'total_tax'           => 0,
                'grand_total'         => 0,
                'notes'               => $data['notes'] ?? "Nota Kredit dari Retur {$return->id}",
                'created_by'          => $actor->id,
            ]);

            foreach ($return->lines as $retLine) {
                $qtyAccepted = (float) $retLine->qty_accepted;
                if ($qtyAccepted <= 0) {
                    continue;
                }

                $calc = $this->taxService->calculateLine($qtyAccepted, (string) $retLine->unit_price);
                $product = Product::where('variant_sku', $retLine->variant_sku)->first();
                $cogsUnit = $product ? (float) $product->cost : 0.0;
                $cogsReversal = bcmul((string) $qtyAccepted, (string) $cogsUnit, 2);

                CreditNoteLine::create([
                    'credit_note_id'           => $creditNoteId,
                    'original_invoice_line_id' => $retLine->customer_invoice_line_id ?? $invoice->lines->first()?->id ?? 1,
                    'variant_sku'              => $retLine->variant_sku,
                    'condition'                => $retLine->condition,
                    'qty_returned'             => $qtyAccepted,
                    'unit_price'               => $retLine->unit_price,
                    'tax_id'                   => TaxCalculationService::DEFAULT_TAX_ID,
                    'subtotal_before_tax'      => $calc['subtotal_before_tax'],
                    'tax_amount'               => $calc['tax_amount'],
                    'line_total'               => $calc['line_total'],
                    'cogs_reversal'            => $cogsReversal,
                ]);

                $subtotalBeforeTax = bcadd($subtotalBeforeTax, $calc['subtotal_before_tax'], 2);
                $totalTax          = bcadd($totalTax, $calc['tax_amount'], 2);
                $grandTotal        = bcadd($grandTotal, $calc['line_total'], 2);
                $totalCogsReversal = bcadd($totalCogsReversal, $cogsReversal, 2);
            }

            // 5. Buat Journal Entry untuk Nota Kredit (credit_note):
            // Debit: 4000 Penjualan Grosir (Retur Penjualan)
            // Debit: 2200 PPN Keluaran
            // Credit: 1100 Piutang Usaha
            $jeCount = JournalEntry::count() + 1;
            $jeNo = sprintf('JE/CN/%04d', $jeCount);

            $journalEntry = JournalEntry::create([
                'entry_no'             => $jeNo,
                'entry_type'           => 'credit_note',
                'source_document_type' => 'credit_note',
                'source_document_id'   => $creditNoteId,
                'entry_date'           => now()->toDateString(),
                'description'          => "Nota Kredit {$creditNoteId} atas Retur {$return->id} (Faktur {$invoice->id})",
                'status'               => 'posted',
                'is_balanced'          => true,
                'total_debit'          => $grandTotal,
                'total_credit'         => $grandTotal,
                'posted_at'            => now(),
                'posted_by'            => $actor->id,
                'created_by'           => $actor->id,
            ]);

            // Debit: Retur Penjualan / Revenue (4000)
            JournalLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_code'     => '4000',
                'description'      => "Pembalikan Pendapatan Penjualan - {$creditNoteId}",
                'debit'            => $subtotalBeforeTax,
                'credit'           => 0,
                'created_at'       => now(),
            ]);

            // Debit: PPN Keluaran (2200)
            if (bccomp($totalTax, '0.00', 2) > 0) {
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code'     => '2200',
                    'description'      => "Pembalikan PPN Keluaran - {$creditNoteId}",
                    'debit'            => $totalTax,
                    'credit'           => 0,
                    'created_at'       => now(),
                ]);
            }

            // Credit: Piutang Usaha (1100) -> AR Adjustment
            JournalLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_code'     => '1100',
                'description'      => "Penyesuaian Piutang Pelanggan (AR Adjustment) - {$creditNoteId}",
                'debit'            => 0,
                'credit'           => $grandTotal,
                'created_at'       => now(),
            ]);

            // Jurnal Pembalikan COGS & Persediaan jika ada nilai pokok
            if (bccomp($totalCogsReversal, '0.00', 2) > 0) {
                // Debit: Persediaan (1200)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code'     => '1200',
                    'description'      => "Pemulihan Nilai Persediaan Retur - {$creditNoteId}",
                    'debit'            => $totalCogsReversal,
                    'credit'           => 0,
                    'created_at'       => now(),
                ]);

                // Credit: Beban Pokok Penjualan (5000)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code'     => '5000',
                    'description'      => "Pembalikan HPP Retur - {$creditNoteId}",
                    'debit'            => 0,
                    'credit'           => $totalCogsReversal,
                    'created_at'       => now(),
                ]);
            }

            // 6. Eksekusi AR Adjustment pada Faktur Pelanggan:
            // Potong saldo residual faktur asli
            $currentResidual = (string) $invoice->amount_residual;
            $newResidual = bcsub($currentResidual, $grandTotal, 2);
            if (bccomp($newResidual, '0.00', 2) < 0) {
                $newResidual = '0.00';
            }

            $currentPaid = (string) $invoice->amount_paid;
            $newPaid = bcadd($currentPaid, $grandTotal, 2);

            $invoiceStatus = bccomp($newResidual, '0.00', 2) <= 0 ? 'paid' : 'posted';

            $invoice->update([
                'amount_residual' => $newResidual,
                'amount_paid'     => $newPaid,
                'status'          => $invoiceStatus,
            ]);

            // Saldo residual dan amount_paid pada faktur sudah terpotong otomatis di atas.
            // Open AR pelanggan terhitung dinamis melalui accessor ContactCustomer::open_ar
            // berdasarkan agregat saldo residual faktur berstatus posted.

            // Update status Credit Note & Customer Return
            $creditNote->update([
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax'           => $totalTax,
                'grand_total'         => $grandTotal,
                'status'              => 'applied',
                'posted_at'           => now(),
                'posted_by'           => $actor->id,
                'journal_entry_id'    => $journalEntry->id,
            ]);

            $return->update([
                'credit_note_id' => $creditNoteId,
                'status'         => 'completed',
            ]);

            AuditLog::record(
                action: 'accounting.credit_note.applied_ar_adjustment',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'credit_note',
                documentId: $creditNoteId,
                newValue: [
                    'credit_note_id' => $creditNoteId,
                    'grand_total'    => $grandTotal,
                    'invoice_id'     => $invoice->id,
                    'new_residual'   => $newResidual,
                    'status'         => 'applied',
                ],
                notes: "Finance menerbitkan Nota Kredit {$creditNoteId} dan menyelesaikan AR Adjustment pada Faktur {$invoice->id}."
            );

            return $creditNote->fresh(['lines.product', 'customer', 'originalInvoice', 'journalEntry.lines']);
        });
    }
}

