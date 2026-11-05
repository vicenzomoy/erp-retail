<?php

namespace App\Services\Accounting;

use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\CustomerInvoiceLine;
use App\Models\DeliveryOrderLine;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\PaymentTerm;
use App\Models\SalesOrder;
use App\Models\SalesOrderLine;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Layanan Customer Invoice berbasis pengiriman (F-10, F-16, F-23, SR-01, SR-02, SR-17, SR-22, T-17, T-18, T-25, T-28).
 */
class CustomerInvoiceService
{
    public function __construct(
        protected TaxCalculationService $taxService
    ) {}

    /**
     * Generate ID Customer Invoice berformat INV-0001 (mengabaikan INV-OPEN01).
     */
    public function generateInvoiceId(): string
    {
        $ids = DB::table('customer_invoices')
            ->where('id', 'LIKE', 'INV-%')
            ->pluck('id');

        $maxNumeric = 0;
        foreach ($ids as $id) {
            if (preg_match('/^INV-(\d+)$/', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNumeric) {
                    $maxNumeric = $num;
                }
            }
        }

        return sprintf('INV-%04d', $maxNumeric + 1);
    }

    /**
     * Ambil matriks kuantitas dapat ditagih (Delivered-Based Invoicing) untuk suatu Sales Order.
     */
    public function getBillableMatrixForSo(SalesOrder $so, ?string $excludeInvoiceId = null): array
    {
        $so->loadMissing(['customer', 'lines.product', 'deliveryOrders.lines']);

        $doneDeliveries = $so->deliveryOrders->where('status', 'done')->values();
        $doneDeliveryIds = $doneDeliveries->pluck('id')->all();

        $lines = [];
        foreach ($so->lines as $soLine) {
            // Hitung qty_delivered dari DeliveryOrderLine yang sudah Done (atau fallback ke so_line.qty_delivered)
            $doLines = DeliveryOrderLine::whereIn('delivery_order_id', $doneDeliveryIds)
                ->where(function ($q) use ($soLine) {
                    $q->where('so_line_id', $soLine->id)
                      ->orWhere('variant_sku', $soLine->variant_sku);
                })
                ->get();

            $qtyDelivered = (float) $doLines->sum('qty_done');
            if ($qtyDelivered <= 0 && (float) $soLine->qty_delivered > 0) {
                $qtyDelivered = (float) $soLine->qty_delivered;
            }

            // Hitung qty_invoiced pada invoice aktif (posted/paid) selain invoice ini
            $alreadyInvoicedQuery = CustomerInvoiceLine::whereHas('invoice', function ($q) use ($so, $excludeInvoiceId) {
                $q->where('sales_order_id', $so->id)
                  ->whereIn('status', ['posted', 'paid']);
                if ($excludeInvoiceId) {
                    $q->where('id', '!=', $excludeInvoiceId);
                }
            })->where(function ($q) use ($soLine) {
                $q->where('so_line_id', $soLine->id)
                  ->orWhere('variant_sku', $soLine->variant_sku);
            });

            $qtyAlreadyInvoiced = (float) $alreadyInvoicedQuery->sum('qty_invoiced');
            $maxInvoiceableQty  = max(0.0, $qtyDelivered - $qtyAlreadyInvoiced);

            $latestDoLine = $doLines->last();
            $calc = $this->taxService->calculateLine($maxInvoiceableQty, (string) $soLine->unit_price, (string) $soLine->discount_pct);

            $lines[] = [
                'so_line_id'             => $soLine->id,
                'delivery_order_line_id' => $latestDoLine?->id,
                'variant_sku'            => $soLine->variant_sku,
                'product_name'           => $soLine->product?->name ?? $soLine->variant_sku,
                'size'                   => $soLine->product?->size,
                'color'                  => $soLine->product?->color,
                'unit'                   => $soLine->product?->unit ?? 'pcs',
                'unit_price'             => (float) $soLine->unit_price,
                'discount_pct'           => (float) $soLine->discount_pct,
                'tax_id'                 => $soLine->tax_id ?: TaxCalculationService::DEFAULT_TAX_ID,
                'qty_ordered'            => (float) $soLine->qty_ordered,
                'qty_delivered'          => $qtyDelivered,
                'qty_already_invoiced'   => $qtyAlreadyInvoiced,
                'max_invoiceable_qty'    => $maxInvoiceableQty,
                'default_subtotal'       => (float) $calc['subtotal_before_tax'],
                'default_tax'            => (float) $calc['tax_amount'],
                'default_line_total'     => (float) $calc['line_total'],
            ];
        }

        $totalInvoiceable = collect($lines)->sum('max_invoiceable_qty');

        return [
            'sales_order_id'       => $so->id,
            'customer_id'          => $so->customer_id,
            'customer_name'        => $so->customer?->name,
            'payment_terms'        => $so->payment_terms,
            'has_done_delivery'    => $doneDeliveries->isNotEmpty() || $totalInvoiceable > 0,
            'total_invoiceable'    => $totalInvoiceable,
            'lines'                => $lines,
        ];
    }

    /**
     * Buat Customer Invoice berdasarkan Sales Order yang sudah dikirim (Delivered-Based Policy SR-01, SR-02).
     */
    public function createInvoice(array $data, User $actor, bool $autoPost = false): array
    {
        if (! empty($data['idempotency_key'])) {
            $existing = CustomerInvoice::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                AuditLog::record(
                    action: 'ATTEMPT_DUPLICATE_CUSTOMER_INVOICE',
                    status: 'DUPLICATE',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'finance',
                    documentType: 'customer_invoice',
                    documentId: $existing->id,
                    notes: "Permintaan pembuatan Customer Invoice dengan idempotency_key yang sama diabaikan (Idempotent)."
                );

                return [
                    'invoice'        => $existing->fresh(['lines.product', 'customer', 'salesOrder', 'journalEntry.lines']),
                    'already_posted' => $existing->isPosted() || $existing->isPaid(),
                ];
            }
        }

        $so = SalesOrder::with(['customer', 'lines.product', 'deliveryOrders.lines'])
            ->findOrFail($data['sales_order_id']);

        $matrix = $this->getBillableMatrixForSo($so);
        $this->assertDeliveredPolicy($so, $matrix, $data['lines'] ?? [], $actor, null);

        return DB::transaction(function () use ($data, $so, $matrix, $actor, $autoPost) {
            $invoiceId    = $this->generateInvoiceId();
            $invoiceDate  = $data['invoice_date'] ?? now()->toDateString();
            $paymentTerms = $so->payment_terms ?: ($so->customer?->payment_terms ?? 'NET14');
            $term         = PaymentTerm::find($paymentTerms);
            $dueDays      = $term?->due_days ?? 14;
            $dueDate      = now()->parse($invoiceDate)->addDays($dueDays)->toDateString();

            $matrixBySku = collect($matrix['lines'])->keyBy('variant_sku');

            $subtotalBeforeTax = '0.00';
            $totalTax          = '0.00';
            $grandTotal        = '0.00';
            $preparedLines     = [];

            foreach ($data['lines'] as $inputLine) {
                $sku         = $inputLine['variant_sku'];
                $qtyInvoiced = (float) $inputLine['qty_invoiced'];
                if ($qtyInvoiced <= 0) {
                    continue;
                }

                $mLine       = $matrixBySku[$sku] ?? null;
                $unitPrice   = isset($inputLine['unit_price'])
                    ? (string) $inputLine['unit_price']
                    : (string) ($mLine['unit_price'] ?? '0');
                $discountPct = isset($inputLine['discount_pct'])
                    ? (string) $inputLine['discount_pct']
                    : (string) ($mLine['discount_pct'] ?? '0');
                $taxId       = $mLine['tax_id'] ?? TaxCalculationService::DEFAULT_TAX_ID;

                $calc = $this->taxService->calculateLine($qtyInvoiced, $unitPrice, $discountPct);

                $subtotalBeforeTax = bcadd($subtotalBeforeTax, $calc['subtotal_before_tax'], 2);
                $totalTax          = bcadd($totalTax, $calc['tax_amount'], 2);
                $grandTotal        = bcadd($grandTotal, $calc['line_total'], 2);

                $preparedLines[] = [
                    'customer_invoice_id'    => $invoiceId,
                    'delivery_order_line_id' => $inputLine['delivery_order_line_id'] ?? $mLine['delivery_order_line_id'] ?? null,
                    'so_line_id'             => $inputLine['so_line_id'] ?? $mLine['so_line_id'] ?? null,
                    'variant_sku'            => $sku,
                    'description'            => ($mLine['product_name'] ?? $sku) . " ({$sku})",
                    'qty_invoiced'           => number_format($qtyInvoiced, 3, '.', ''),
                    'unit_price'             => number_format((float) $unitPrice, 2, '.', ''),
                    'discount_pct'           => number_format((float) $discountPct, 2, '.', ''),
                    'tax_id'                 => $taxId,
                    'subtotal_before_tax'    => $calc['subtotal_before_tax'],
                    'tax_amount'             => $calc['tax_amount'],
                    'line_total'             => $calc['line_total'],
                ];
            }

            if (empty($preparedLines)) {
                throw ValidationException::withMessages([
                    'delivery_policy' => 'Minimal satu baris barang dengan kuantitas terkirim > 0 wajib ditagih.',
                ]);
            }

            $invoice = CustomerInvoice::create([
                'id'                  => $invoiceId,
                'source_doc_no'       => $so->source_doc_no,
                'sales_order_id'      => $so->id,
                'customer_id'         => $so->customer_id,
                'status'              => 'draft',
                'invoice_date'        => $invoiceDate,
                'due_date'            => $dueDate,
                'payment_terms'       => $paymentTerms,
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax'           => $totalTax,
                'grand_total'         => $grandTotal,
                'amount_paid'         => '0.00',
                'amount_residual'     => $grandTotal,
                'idempotency_key'     => $data['idempotency_key'] ?? null,
                'notes'               => $data['notes'] ?? "Customer Invoice atas SO {$so->id}",
                'created_by'          => $actor->id,
            ]);

            foreach ($preparedLines as $pl) {
                CustomerInvoiceLine::create($pl);
            }

            AuditLog::record(
                action: 'CREATE_CUSTOMER_INVOICE',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'customer_invoice',
                documentId: $invoice->id,
                newValue: [
                    'sales_order_id'      => $so->id,
                    'customer_id'         => $so->customer_id,
                    'subtotal_before_tax' => $subtotalBeforeTax,
                    'total_tax'           => $totalTax,
                    'grand_total'         => $grandTotal,
                ],
                notes: "Draft Customer Invoice {$invoice->id} dibuat untuk SO {$so->id} (Total Rp " . number_format((float) $grandTotal, 0, ',', '.') . ")."
            );

            if ($autoPost) {
                return $this->postInvoice($invoice, $actor, $data['idempotency_key'] ?? null);
            }

            return [
                'invoice'        => $invoice->fresh(['lines.product', 'customer', 'salesOrder']),
                'already_posted' => false,
                'journal_entry'  => null,
            ];
        });
    }

    /**
     * Post Customer Invoice secara idempotent (F-16, F-22, SR-17, SR-22, T-17, T-28, T-40).
     * Membentuk jurnal seimbang: Debit 1100 (Piutang Usaha) / Kredit 4000 (Penjualan Grosir) + 2200 (PPN Keluaran).
     */
    public function postInvoice(CustomerInvoice $invoice, User $actor, ?string $idempotencyKey = null): array
    {
        // 1. Idempotency Guard (T-28, T-40, SR-17): jika sudah Posted atau Paid, JANGAN gandakan jurnal!
        if ($invoice->isPosted() || $invoice->isPaid()) {
            AuditLog::record(
                action: 'POST_CUSTOMER_INVOICE',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'customer_invoice',
                documentId: $invoice->id,
                oldValue: [
                    'status'           => $invoice->status,
                    'journal_entry_id' => $invoice->journal_entry_id,
                    'grand_total'      => (string) $invoice->grand_total,
                ],
                newValue: [
                    'attempt'          => 'REPOST_IGNORED',
                    'journal_entry_id' => $invoice->journal_entry_id,
                ],
                notes: "Instruksi Post ulang pada Customer Invoice {$invoice->id} yang sudah berstatus " . strtoupper($invoice->status) . " diabaikan secara idempotent (SR-17). Jurnal tidak mengganda dan Debit = Kredit tetap terjaga."
            );

            return [
                'invoice'        => $invoice->fresh(['lines.product', 'customer', 'salesOrder', 'journalEntry.lines']),
                'already_posted' => true,
                'journal_entry'  => $invoice->journalEntry,
            ];
        }

        if ($invoice->status === 'cancelled') {
            throw ValidationException::withMessages([
                'status' => "Customer Invoice {$invoice->id} berstatus Dibatalkan dan tidak dapat diposting.",
            ]);
        }

        if ($invoice->sales_order_id) {
            $so = SalesOrder::with(['customer', 'lines.product', 'deliveryOrders.lines'])
                ->findOrFail($invoice->sales_order_id);
            $matrix = $this->getBillableMatrixForSo($so, $invoice->id);
            $linesToCheck = $invoice->lines->map(fn ($l) => [
                'variant_sku'  => $l->variant_sku,
                'qty_invoiced' => (float) $l->qty_invoiced,
            ])->all();
            $this->assertDeliveredPolicy($so, $matrix, $linesToCheck, $actor, $invoice->id);
        }

        return DB::transaction(function () use ($invoice, $actor, $idempotencyKey) {
            /** @var CustomerInvoice $lockedInv */
            $lockedInv = CustomerInvoice::lockForUpdate()->with(['lines.product', 'customer'])->findOrFail($invoice->id);

            if ($lockedInv->isPosted() || $lockedInv->isPaid()) {
                return [
                    'invoice'        => $lockedInv,
                    'already_posted' => true,
                    'journal_entry'  => $lockedInv->journalEntry,
                ];
            }

            // Update qty_invoiced pada SalesOrderLine
            foreach ($lockedInv->lines as $iLine) {
                if ($iLine->so_line_id) {
                    $soLine = SalesOrderLine::lockForUpdate()->find($iLine->so_line_id);
                    if ($soLine) {
                        $soLine->update([
                            'qty_invoiced' => bcadd((string) $soLine->qty_invoiced, (string) $iLine->qty_invoiced, 3),
                        ]);
                    }
                }
            }

            // Buat Jurnal Akuntansi Seimbang (F-16):
            // Debit 1100 (Piutang Usaha / AR)   = Grand Total
            // Kredit 4000 (Penjualan Grosir)    = Subtotal Before Tax (DPP)
            // Kredit 2200 (PPN Keluaran)        = Total Tax (PPN)
            $entryNo = $this->taxService->nextJournalEntryNo('INV');
            $customerName = $lockedInv->customer?->name ?? $lockedInv->customer_id;

            $je = JournalEntry::create([
                'entry_no'             => $entryNo,
                'entry_type'           => 'sales_invoice',
                'source_document_type' => 'customer_invoice',
                'source_document_id'   => $lockedInv->id,
                'entry_date'           => $lockedInv->invoice_date?->toDateString() ?? now()->toDateString(),
                'description'          => "Faktur Pelanggan {$lockedInv->id} - {$customerName}" . ($lockedInv->sales_order_id ? " (SO {$lockedInv->sales_order_id})" : ''),
                'status'               => 'posted',
                'is_balanced'          => true,
                'total_debit'          => $lockedInv->grand_total,
                'total_credit'         => $lockedInv->grand_total,
                'posted_at'            => now(),
                'posted_by'            => $actor->id,
                'created_by'           => $actor->id,
            ]);

            // Line 1: Debit 1100 Piutang Usaha (AR)
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '1100',
                'description'      => "Piutang Usaha {$customerName} - {$lockedInv->id}",
                'debit'            => $lockedInv->grand_total,
                'credit'           => '0.00',
                'created_at'       => now(),
            ]);

            // Line 2: Credit 4000 Penjualan Grosir (DPP)
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '4000',
                'description'      => "Pendapatan Penjualan Grosir - {$lockedInv->id}",
                'debit'            => '0.00',
                'credit'           => $lockedInv->subtotal_before_tax,
                'variant_sku'      => $lockedInv->lines->first()?->variant_sku,
                'created_at'       => now(),
            ]);

            // Line 3: Credit 2200 PPN Keluaran
            if (bccomp((string) $lockedInv->total_tax, '0.00', 2) > 0) {
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => '2200',
                    'description'      => "PPN Keluaran 11% - {$lockedInv->id}",
                    'debit'            => '0.00',
                    'credit'           => $lockedInv->total_tax,
                    'created_at'       => now(),
                ]);
            }

            $lockedInv->update([
                'status'           => 'posted',
                'amount_paid'      => '0.00',
                'amount_residual'  => $lockedInv->grand_total,
                'posted_at'        => now(),
                'posted_by'        => $actor->id,
                'journal_entry_id' => $je->id,
                'idempotency_key'  => $idempotencyKey ?? $lockedInv->idempotency_key ?? uniqid('inv_post_'),
            ]);

            AuditLog::record(
                action: 'POST_CUSTOMER_INVOICE',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'customer_invoice',
                documentId: $lockedInv->id,
                newValue: [
                    'status'              => 'posted',
                    'journal_entry_no'    => $je->entry_no,
                    'subtotal_before_tax' => (string) $lockedInv->subtotal_before_tax,
                    'total_tax'           => (string) $lockedInv->total_tax,
                    'grand_total'         => (string) $lockedInv->grand_total,
                ],
                notes: "Customer Invoice {$lockedInv->id} berhasil diposting. DPP Rp " .
                       number_format((float) $lockedInv->subtotal_before_tax, 0, ',', '.') .
                       ", PPN Rp " . number_format((float) $lockedInv->total_tax, 0, ',', '.') .
                       ", Total AR Rp " . number_format((float) $lockedInv->grand_total, 0, ',', '.') .
                       " (Jurnal {$je->entry_no})."
            );

            return [
                'invoice'        => $lockedInv->fresh(['lines.product', 'customer', 'salesOrder', 'journalEntry.lines']),
                'already_posted' => false,
                'journal_entry'  => $je,
            ];
        });
    }

    /**
     * Validasi kebijakan penagihan berbasis kuantitas terkirim (Delivered-Based Policy SR-01, SR-02, T-18).
     */
    protected function assertDeliveredPolicy(
        SalesOrder $so,
        array $matrix,
        array $requestedLines,
        User $actor,
        ?string $invoiceId = null
    ): void {
        $docId = $invoiceId ?? $so->id;

        if (! $matrix['has_done_delivery'] || (float) $matrix['total_invoiceable'] <= 0) {
            AuditLog::record(
                action: 'REJECTED_INVOICE_NO_DELIVERY',
                status: 'REJECTED',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'customer_invoice',
                documentId: $docId,
                notes: "Penolakan pembuatan faktur SO {$so->id}: Delivered Qty = 0 (Kebijakan Delivered-Based SR-01 & SR-02)."
            );

            throw ValidationException::withMessages([
                'delivery_policy' => "Pembuatan faktur untuk Sales Order {$so->id} ditolak (Aturan SR-01 & SR-02): Kuantitas barang yang telah dikirim (Delivered Qty) masih 0 unit. Faktur hanya boleh diterbitkan berdasarkan barang yang sudah terkirim.",
            ]);
        }

        $matrixBySku = collect($matrix['lines'])->keyBy('variant_sku');
        foreach ($requestedLines as $reqLine) {
            $sku          = $reqLine['variant_sku'] ?? '';
            $requestedQty = (float) ($reqLine['qty_invoiced'] ?? 0);

            if (! isset($matrixBySku[$sku])) {
                throw ValidationException::withMessages([
                    'delivery_policy' => "SKU {$sku} tidak ditemukan pada Sales Order {$so->id}.",
                ]);
            }

            $mLine = $matrixBySku[$sku];
            $maxInvoiceable = (float) $mLine['max_invoiceable_qty'];

            if (bccomp((string) $requestedQty, (string) $maxInvoiceable, 3) > 0) {
                AuditLog::record(
                    action: 'REJECTED_INVOICE_QTY_EXCEEDS_DELIVERED',
                    status: 'REJECTED',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'finance',
                    documentType: 'customer_invoice',
                    documentId: $docId,
                    oldValue: [
                        'qty_ordered'          => $mLine['qty_ordered'],
                        'qty_delivered'        => $mLine['qty_delivered'],
                        'qty_already_invoiced' => $mLine['qty_already_invoiced'],
                        'max_invoiceable_qty'  => $maxInvoiceable,
                    ],
                    newValue: [
                        'requested_qty_invoiced' => $requestedQty,
                    ],
                    notes: "Penolakan faktur SKU {$sku}: diminta {$requestedQty} unit, melebihi kuantitas terkirim belum ditagih ({$maxInvoiceable} unit)."
                );

                throw ValidationException::withMessages([
                    'delivery_policy' => "Kuantitas ditagih untuk {$sku} ({$requestedQty} unit) melebihi kuantitas terkirim yang belum ditagih ({$maxInvoiceable} unit dari total terkirim {$mLine['qty_delivered']} unit). Kebijakan Delivered-Based (SR-01 & SR-02) memblokir kelebihan penagihan.",
                ]);
            }
        }
    }
}

