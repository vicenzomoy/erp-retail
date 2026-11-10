<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\JournalEntry;
use App\Models\SalesOrder;
use App\Services\Accounting\CustomerInvoiceService;
use App\Services\Accounting\GeneralLedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller Faktur Pelanggan (Customer Invoice — F-10, F-16, F-23, T-17, T-18, T-25, T-28).
 */
class CustomerInvoiceController extends Controller
{
    public function __construct(
        protected CustomerInvoiceService $invoiceService,
        protected GeneralLedgerService $glService
    ) {}

    /**
     * Daftar Customer Invoice.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = CustomerInvoice::with(['customer', 'salesOrder', 'journalEntry'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($status !== 'all' && $status !== 'to_invoice') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('sales_order_id', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        $invoices = $query->paginate(15)->through(fn (CustomerInvoice $inv) => [
            'id'                  => $inv->id,
            'sales_order_id'      => $inv->sales_order_id,
            'customer_id'         => $inv->customer_id,
            'customer_name'       => $inv->customer?->name ?? $inv->customer_id,
            'status'              => $inv->status,
            'invoice_date'        => $inv->invoice_date?->format('d/m/Y'),
            'due_date'            => $inv->due_date?->format('d/m/Y'),
            'payment_terms'       => $inv->payment_terms,
            'subtotal_before_tax' => (float) $inv->subtotal_before_tax,
            'total_tax'           => (float) $inv->total_tax,
            'grand_total'         => (float) $inv->grand_total,
            'amount_paid'         => (float) $inv->amount_paid,
            'amount_residual'     => (float) $inv->amount_residual,
            'journal_entry_no'    => $inv->journalEntry?->entry_no,
        ])->withQueryString();

        // Daftar Sales Order yang sudah dikirim gudang namun belum selesai difakturkan
        $pendingOrders = [];
        $confirmedSos = SalesOrder::with(['customer', 'lines.product', 'deliveryOrders.lines'])
            ->whereIn('status', ['confirmed', 'done'])
            ->orderByDesc('id')
            ->get();

        foreach ($confirmedSos as $so) {
            $matrix = $this->invoiceService->getBillableMatrixForSo($so);
            if ($matrix['has_done_delivery'] && (float) $matrix['total_invoiceable'] > 0) {
                $pendingOrders[] = $matrix;
            }
        }

        $arLedger = $this->glService->getAccountLedger('1100');

        return Inertia::render('Accounting/Invoices/Index', [
            'invoices'      => $invoices,
            'pendingOrders' => $pendingOrders,
            'filters'       => [
                'status' => $status,
                'search' => $search,
            ],
            'counts'        => [
                'all'        => CustomerInvoice::count(),
                'to_invoice' => count($pendingOrders),
                'draft'      => CustomerInvoice::where('status', 'draft')->count(),
                'posted'     => CustomerInvoice::where('status', 'posted')->count(),
                'paid'       => CustomerInvoice::where('status', 'paid')->count(),
                'open_ar'    => (float) CustomerInvoice::where('status', 'posted')->sum('amount_residual'),
                'gl_ar_bal'  => (float) ($arLedger['selected_account']['balance'] ?? 0),
            ],
        ]);
    }

    /**
     * Form pembuatan Customer Invoice berbasis pengiriman (Delivered-Based Policy).
     */
    public function create(Request $request): Response
    {
        $selectedSoId = $request->query('sales_order_id', '');

        $salesOrders = SalesOrder::with(['customer', 'lines.product', 'deliveryOrders.lines'])
            ->whereIn('status', ['confirmed', 'done'])
            ->orderByDesc('id')
            ->get();

        $soMatrices = [];
        $firstReadySoId = '';
        foreach ($salesOrders as $so) {
            $matrix = $this->invoiceService->getBillableMatrixForSo($so);
            $soMatrices[$so->id] = $matrix;
            if (! $firstReadySoId && $matrix['has_done_delivery'] && (float) $matrix['total_invoiceable'] > 0) {
                $firstReadySoId = $so->id;
            }
        }

        $defaultSoId = isset($soMatrices[$selectedSoId])
            ? $selectedSoId
            : ($firstReadySoId ?: ($salesOrders->first()?->id ?? ''));

        return Inertia::render('Accounting/Invoices/Create', [
            'selectedSoId' => $defaultSoId,
            'soMatrices'   => $soMatrices,
        ]);
    }

    /**
     * Simpan (dan opsional langsung Post) Customer Invoice baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sales_order_id'               => 'required|exists:sales_orders,id',
            'invoice_date'                 => 'nullable|date',
            'notes'                        => 'nullable|string|max:1000',
            'idempotency_key'              => 'nullable|string|max:64',
            'auto_post'                    => 'nullable|boolean',
            'lines'                        => 'required|array|min:1',
            'lines.*.so_line_id'           => 'nullable|integer',
            'lines.*.delivery_order_line_id' => 'nullable|integer',
            'lines.*.variant_sku'          => 'required|string|exists:products,variant_sku',
            'lines.*.qty_invoiced'         => 'required|numeric|min:0.001',
            'lines.*.unit_price'           => 'nullable|numeric|min:0',
            'lines.*.discount_pct'         => 'nullable|numeric|min:0|max:100',
        ]);

        $autoPost = $request->boolean('auto_post', true);
        $result   = $this->invoiceService->createInvoice($validated, $request->user(), $autoPost);
        $invoice  = $result['invoice'];

        if ($result['already_posted']) {
            return redirect()->route('accounting.invoices.show', $invoice->id)
                ->with('info', "Customer Invoice {$invoice->id} sudah pernah dibuat/diposting sebelumnya (Idempotent).");
        }

        $msg = $invoice->isPosted()
            ? "Customer Invoice {$invoice->id} berhasil diterbitkan dan diposting ke Buku Besar AR."
            : "Draft Customer Invoice {$invoice->id} berhasil disimpan.";

        return redirect()->route('accounting.invoices.show', $invoice->id)
            ->with('success', $msg);
    }

    /**
     * Detail Form View Customer Invoice (lengkap dengan rincian PPN per baris F-23, Jurnal & Idempotent Post T-28).
     */
    public function show(string $id): Response
    {
        $invoice = CustomerInvoice::with([
            'customer',
            'salesOrder.deliveryOrders',
            'lines.product',
            'journalEntry.lines.account',
            'payments.payment.journalEntry',
            'postedBy',
            'creator',
        ])->findOrFail($id);

        $lines = $invoice->lines->map(fn ($l) => [
            'id'                  => $l->id,
            'so_line_id'          => $l->so_line_id,
            'variant_sku'         => $l->variant_sku,
            'description'         => $l->description,
            'product_name'        => $l->product?->name ?? $l->variant_sku,
            'size'                => $l->product?->size,
            'color'               => $l->product?->color,
            'unit'                => $l->product?->unit ?? 'pcs',
            'qty_invoiced'        => (float) $l->qty_invoiced,
            'unit_price'          => (float) $l->unit_price,
            'discount_pct'        => (float) $l->discount_pct,
            'tax_id'              => $l->tax_id,
            'subtotal_before_tax' => (float) $l->subtotal_before_tax,
            'tax_amount'          => (float) $l->tax_amount,
            'line_total'          => (float) $l->line_total,
        ]);

        // Hitung jumlah entri jurnal untuk faktur ini (bukti wajib T-28: tidak ada jurnal ganda)
        $journalCountForInvoice = JournalEntry::where('source_document_type', 'customer_invoice')
            ->where('source_document_id', $invoice->id)
            ->count();

        $relatedDocs = [];

        if ($invoice->sales_order_id) {
            $relatedDocs[] = [
                'type'   => 'Sales Order',
                'id'     => $invoice->sales_order_id,
                'title'  => "Pesanan Penjualan {$invoice->sales_order_id}",
                'status' => $invoice->salesOrder?->status ?? 'confirmed',
                'info'   => "Pelanggan: {$invoice->customer?->name}",
                'url'    => route('sales.orders.show', $invoice->sales_order_id),
            ];

            foreach ($invoice->salesOrder?->deliveryOrders ?? [] as $do) {
                $relatedDocs[] = [
                    'type'   => 'Delivery Order',
                    'id'     => $do->id,
                    'title'  => "Pengiriman {$do->id}",
                    'status' => $do->status,
                    'info'   => "Lokasi: {$do->location_from}",
                    'url'    => route('inventory.deliveries.show', $do->id),
                ];
            }
        }

        if ($invoice->journalEntry) {
            $relatedDocs[] = [
                'type'   => 'Journal Entry (AR)',
                'id'     => $invoice->journalEntry->entry_no,
                'title'  => "Jurnal Faktur {$invoice->journalEntry->entry_no}",
                'status' => $invoice->journalEntry->status,
                'info'   => 'Debit 1100 / Kredit 4000 & 2200: Rp ' . number_format((float) $invoice->journalEntry->total_debit, 0, ',', '.'),
                'url'    => route('accounting.journals.show', $invoice->journalEntry->id),
            ];
        }

        foreach ($invoice->payments as $alloc) {
            if ($alloc->payment) {
                $relatedDocs[] = [
                    'type'   => 'Customer Payment',
                    'id'     => $alloc->payment->id,
                    'title'  => "Penerimaan {$alloc->payment->id}",
                    'status' => $alloc->payment->status,
                    'info'   => 'Dialokasikan: Rp ' . number_format((float) $alloc->amount_allocated, 0, ',', '.'),
                    'url'    => route('accounting.payments.show', $alloc->payment->id),
                ];
            }
        }

        $docIds = array_values(array_filter([$invoice->id, $invoice->sales_order_id]));
        $auditLogs = AuditLog::where('document_type', 'customer_invoice')
            ->whereIn('document_id', $docIds)
            ->orderByDesc('id')
            ->get()
            ->map(fn (AuditLog $log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'notes'          => $log->notes,
                'old_value'      => $log->old_value,
                'new_value'      => $log->new_value,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
                'time_ago'       => $log->created_at?->diffForHumans(),
            ]);

        $arLedger = $this->glService->getAccountLedger('1100');

        return Inertia::render('Accounting/Invoices/Show', [
            'invoice' => [
                'id'                      => $invoice->id,
                'sales_order_id'          => $invoice->sales_order_id,
                'customer_id'             => $invoice->customer_id,
                'customer_name'           => $invoice->customer?->name ?? $invoice->customer_id,
                'customer_city'           => $invoice->customer?->city,
                'status'                  => $invoice->status,
                'invoice_date'            => $invoice->invoice_date?->format('Y-m-d'),
                'due_date'                => $invoice->due_date?->format('Y-m-d'),
                'payment_terms'           => $invoice->payment_terms,
                'subtotal_before_tax'     => (float) $invoice->subtotal_before_tax,
                'total_tax'               => (float) $invoice->total_tax,
                'grand_total'             => (float) $invoice->grand_total,
                'amount_paid'             => (float) $invoice->amount_paid,
                'amount_residual'         => (float) $invoice->amount_residual,
                'posted_at'               => $invoice->posted_at?->format('d/m/Y H:i'),
                'posted_by'               => $invoice->postedBy?->name,
                'journal_entry_id'        => $invoice->journal_entry_id,
                'journal_entry_no'        => $invoice->journalEntry?->entry_no,
                'journal_entries_count'   => $journalCountForInvoice ?: ($invoice->journal_entry_id ? 1 : 0),
                'journal_lines'           => $invoice->journalEntry?->lines->map(fn ($jl) => [
                    'id'           => $jl->id,
                    'account_code' => $jl->account_code,
                    'account_name' => $jl->account?->account_name ?? $jl->account_code,
                    'description'  => $jl->description,
                    'debit'        => (float) $jl->debit,
                    'credit'       => (float) $jl->credit,
                ]) ?? [],
                'notes'                   => $invoice->notes,
                'lines'                   => $lines,
                'payments'                => $invoice->payments->map(fn ($a) => [
                    'id'               => $a->id,
                    'payment_id'       => $a->payment_id,
                    'amount_allocated' => (float) $a->amount_allocated,
                    'payment_date'     => $a->payment?->payment_date?->format('d/m/Y'),
                    'payment_method'   => $a->payment?->payment_method,
                    'bank_account'     => $a->payment?->bank_account_code,
                    'journal_entry_no' => $a->payment?->journalEntry?->entry_no,
                ]),
            ],
            'arLedger' => [
                'balance' => (float) ($arLedger['selected_account']['balance'] ?? 0),
                'rows'    => array_slice(array_reverse($arLedger['ledger_rows']), 0, 10),
            ],
            'relatedDocs' => $relatedDocs,
            'auditLogs'   => $auditLogs,
        ]);
    }

    /**
     * Post Customer Invoice (Idempotent untuk skenario T-28 & T-40).
     */
    public function post(Request $request, string $id): RedirectResponse
    {
        $invoice = CustomerInvoice::with(['lines.product', 'customer', 'salesOrder'])->findOrFail($id);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $result = $this->invoiceService->postInvoice($invoice, $request->user(), $idempotencyKey);

        if ($result['already_posted']) {
            return redirect()->route('accounting.invoices.show', $invoice->id)
                ->with('info', "Instruksi Post ulang pada Faktur {$invoice->id} diabaikan karena sudah pernah diposting. Jurnal akuntansi tidak mengganda dan Debit = Kredit tetap seimbang.");
        }

        return redirect()->route('accounting.invoices.show', $invoice->id)
            ->with('success', "Customer Invoice {$invoice->id} berhasil diposting ke Buku Besar AR.");
    }
}

