<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\VendorBill;
use App\Services\Accounting\GeneralLedgerService;
use App\Services\Accounting\VendorBillService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller S-12: Vendor Bill dengan validasi Three-Way Match (F-14, F-23, T-23, T-24).
 */
class VendorBillController extends Controller
{
    public function __construct(
        protected VendorBillService $billService,
        protected GeneralLedgerService $glService
    ) {}

    /**
     * Daftar seluruh Vendor Bill (S-12 List View).
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = VendorBill::with(['vendor', 'purchaseOrder', 'receipt', 'journalEntry'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('purchase_order_id', 'ilike', "%{$search}%")
                  ->orWhere('receipt_id', 'ilike', "%{$search}%")
                  ->orWhereHas('vendor', function ($vq) use ($search) {
                      $vq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        $bills = $query->paginate(15)->through(fn (VendorBill $b) => [
            'id'                  => $b->id,
            'purchase_order_id'   => $b->purchase_order_id,
            'receipt_id'          => $b->receipt_id,
            'vendor_id'           => $b->vendor_id,
            'vendor_name'         => $b->vendor?->name ?? $b->vendor_id,
            'status'              => $b->status,
            'bill_date'           => $b->bill_date?->format('d/m/Y'),
            'due_date'            => $b->due_date?->format('d/m/Y'),
            'payment_terms'       => $b->payment_terms,
            'subtotal_before_tax' => (float) $b->subtotal_before_tax,
            'total_tax'           => (float) $b->total_tax,
            'grand_total'         => (float) $b->grand_total,
            'amount_paid'         => (float) $b->amount_paid,
            'amount_residual'     => (float) $b->amount_residual,
            'journal_entry_no'    => $b->journalEntry?->entry_no,
        ])->withQueryString();

        $apLedger = $this->glService->getAccountLedger('2100');

        return Inertia::render('Accounting/Bills/Index', [
            'bills'   => $bills,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts'  => [
                'all'        => VendorBill::count(),
                'draft'      => VendorBill::where('status', 'draft')->count(),
                'posted'     => VendorBill::where('status', 'posted')->count(),
                'paid'       => VendorBill::where('status', 'paid')->count(),
                'open_ap'    => (float) VendorBill::where('status', 'posted')->sum('amount_residual'),
                'gl_ap_bal'  => (float) ($apLedger['selected_account']['balance'] ?? 0),
            ],
        ]);
    }

    /**
     * Form pembuatan Vendor Bill berbasis Purchase Order & Receipt (Three-Way Match).
     */
    public function create(Request $request): Response
    {
        $selectedPoId = $request->query('purchase_order_id', 'PO0008');

        $purchaseOrders = PurchaseOrder::with(['vendor', 'lines.product', 'receipts.lines'])
            ->whereIn('status', ['confirmed', 'done'])
            ->orderByDesc('id')
            ->get();

        $poMatrices = [];
        foreach ($purchaseOrders as $po) {
            $poMatrices[$po->id] = $this->billService->getThreeWayMatchForPo($po);
        }

        // Ambil riwayat penolakan Three-Way Match terbaru (untuk bukti T-24 bila baru saja ditolak)
        $recentRejections = AuditLog::where('document_type', 'vendor_bill')
            ->where('status', 'REJECTED')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'document_id'    => $log->document_id,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'notes'          => $log->notes,
                'old_value'      => $log->old_value,
                'new_value'      => $log->new_value,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
            ]);

        return Inertia::render('Accounting/Bills/Create', [
            'selectedPoId'     => isset($poMatrices[$selectedPoId]) ? $selectedPoId : ($purchaseOrders->first()?->id ?? ''),
            'poMatrices'       => $poMatrices,
            'mismatchReport'   => session('mismatch_report'),
            'recentRejections' => $recentRejections,
        ]);
    }

    /**
     * Simpan (dan opsional langsung Post) Vendor Bill baru dengan validasi Three-Way Match.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'purchase_order_id'       => 'required|exists:purchase_orders,id',
            'receipt_id'              => 'nullable|string',
            'bill_date'               => 'nullable|date',
            'notes'                   => 'nullable|string|max:1000',
            'idempotency_key'         => 'nullable|string|max:64',
            'auto_post'               => 'nullable|boolean',
            'lines'                   => 'required|array|min:1',
            'lines.*.po_line_id'      => 'nullable|integer',
            'lines.*.receipt_line_id' => 'nullable|integer',
            'lines.*.variant_sku'     => 'required|string|exists:products,variant_sku',
            'lines.*.qty_billed'      => 'required|numeric|min:0.001',
            'lines.*.unit_price'      => 'nullable|numeric|min:0',
        ]);

        $autoPost = $request->boolean('auto_post', true);
        $result   = $this->billService->createBill($validated, $request->user(), $autoPost);
        $bill     = $result['bill'];

        if ($result['already_posted']) {
            return redirect()->route('accounting.bills.show', $bill->id)
                ->with('info', "Vendor Bill {$bill->id} sudah pernah dibuat/diposting sebelumnya (Idempotent).");
        }

        $msg = $bill->isPosted()
            ? "Vendor Bill {$bill->id} berhasil divalidasi (Three-Way Match) dan diposting ke Buku Besar AP."
            : "Draft Vendor Bill {$bill->id} berhasil disimpan.";

        return redirect()->route('accounting.bills.show', $bill->id)
            ->with('success', $msg);
    }

    /**
     * Detail Form View Vendor Bill (S-12), lengkap dengan Three-Way Match Matrix, Ledger AP, Related Docs & Audit Trail.
     */
    public function show(string $id): Response
    {
        $bill = VendorBill::with([
            'vendor',
            'purchaseOrder.lines.product',
            'purchaseOrder.receipts.lines',
            'receipt.lines.product',
            'lines.product',
            'journalEntry.lines.account',
            'payments.payment.journalEntry',
            'postedBy',
            'creator',
        ])->findOrFail($id);

        $matchMatrix = $bill->purchaseOrder
            ? $this->billService->getThreeWayMatchForPo($bill->purchaseOrder, $bill->id)
            : null;

        $lines = $bill->lines->map(function ($l) use ($matchMatrix) {
            $mLine = collect($matchMatrix['lines'] ?? [])->firstWhere('variant_sku', $l->variant_sku);

            return [
                'id'                  => $l->id,
                'po_line_id'          => $l->po_line_id,
                'receipt_line_id'     => $l->receipt_line_id,
                'variant_sku'         => $l->variant_sku,
                'product_name'        => $l->product?->name ?? $l->variant_sku,
                'size'                => $l->product?->size,
                'color'               => $l->product?->color,
                'unit'                => $l->product?->unit ?? 'pcs',
                'qty_ordered'         => $mLine['qty_ordered'] ?? (float) $l->qty_billed,
                'qty_accepted'        => $mLine['qty_accepted'] ?? (float) $l->qty_billed,
                'qty_rejected'        => $mLine['qty_rejected'] ?? 0,
                'qty_billed'          => (float) $l->qty_billed,
                'unit_price'          => (float) $l->unit_price,
                'tax_id'              => $l->tax_id,
                'subtotal_before_tax' => (float) $l->subtotal_before_tax,
                'tax_amount'          => (float) $l->tax_amount,
                'line_total'          => (float) $l->line_total,
            ];
        });

        // Related Documents untuk Smart Buttons & Chatter Footer
        $relatedDocs = [];

        if ($bill->purchase_order_id) {
            $relatedDocs[] = [
                'type'   => 'Purchase Order',
                'id'     => $bill->purchase_order_id,
                'title'  => "Pesanan Pembelian {$bill->purchase_order_id}",
                'status' => $bill->purchaseOrder?->status ?? 'confirmed',
                'info'   => "Vendor: {$bill->vendor?->name}",
                'url'    => '#',
            ];
        }

        if ($bill->receipt_id) {
            $relatedDocs[] = [
                'type'   => 'Receipt (QC Gudang)',
                'id'     => $bill->receipt_id,
                'title'  => "Bukti Penerimaan {$bill->receipt_id}",
                'status' => $bill->receipt?->status ?? 'validated',
                'info'   => 'Diterima di lokasi ' . ($bill->receipt?->location_to ?? 'WH-PKU'),
                'url'    => route('inventory.receipts.show', $bill->receipt_id),
            ];
        }

        if ($bill->journalEntry) {
            $relatedDocs[] = [
                'type'   => 'Journal Entry (AP)',
                'id'     => $bill->journalEntry->entry_no,
                'title'  => "Jurnal Tagihan {$bill->journalEntry->entry_no}",
                'status' => $bill->journalEntry->status,
                'info'   => 'Debit 1400 & 1300 / Kredit 2100: Rp ' . number_format((float) $bill->journalEntry->total_credit, 0, ',', '.'),
                'url'    => route('accounting.journals.show', $bill->journalEntry->id),
            ];
        }

        foreach ($bill->payments as $alloc) {
            if ($alloc->payment) {
                $relatedDocs[] = [
                    'type'   => 'Vendor Payment',
                    'id'     => $alloc->payment->id,
                    'title'  => "Pembayaran {$alloc->payment->id}",
                    'status' => $alloc->payment->status,
                    'info'   => 'Dialokasikan: Rp ' . number_format((float) $alloc->amount_allocated, 0, ',', '.'),
                    'url'    => route('accounting.payments.show', $alloc->payment->id),
                ];
            }
        }

        // Ambil Audit Logs baik atas bill->id maupun atas purchase_order_id (agar log penolakan T-24 ikut tampil!)
        $docIds = array_values(array_filter([$bill->id, $bill->purchase_order_id]));
        $auditLogs = AuditLog::where('document_type', 'vendor_bill')
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

        // Ambil mutasi Ledger AP (2100) untuk bukti wajib T-23 ("Dokumen Vendor Bill, tautan dokumen receipt, dan Ledger AP")
        $apLedger = $this->glService->getAccountLedger('2100');

        return Inertia::render('Accounting/Bills/Show', [
            'bill' => [
                'id'                  => $bill->id,
                'purchase_order_id'   => $bill->purchase_order_id,
                'receipt_id'          => $bill->receipt_id,
                'vendor_id'           => $bill->vendor_id,
                'vendor_name'         => $bill->vendor?->name ?? $bill->vendor_id,
                'vendor_city'         => $bill->vendor?->city,
                'status'              => $bill->status,
                'bill_date'           => $bill->bill_date?->format('Y-m-d'),
                'due_date'            => $bill->due_date?->format('Y-m-d'),
                'payment_terms'       => $bill->payment_terms,
                'subtotal_before_tax' => (float) $bill->subtotal_before_tax,
                'total_tax'           => (float) $bill->total_tax,
                'grand_total'         => (float) $bill->grand_total,
                'amount_paid'         => (float) $bill->amount_paid,
                'amount_residual'     => (float) $bill->amount_residual,
                'posted_at'           => $bill->posted_at?->format('d/m/Y H:i'),
                'posted_by'           => $bill->postedBy?->name,
                'journal_entry_id'    => $bill->journal_entry_id,
                'journal_entry_no'    => $bill->journalEntry?->entry_no,
                'notes'               => $bill->notes,
                'lines'               => $lines,
                'payments'            => $bill->payments->map(fn ($a) => [
                    'id'               => $a->id,
                    'payment_id'       => $a->payment_id,
                    'amount_allocated' => (float) $a->amount_allocated,
                    'payment_date'     => $a->payment?->payment_date?->format('d/m/Y'),
                    'payment_method'   => $a->payment?->payment_method,
                    'bank_account'     => $a->payment?->bank_account_code,
                    'journal_entry_no' => $a->payment?->journalEntry?->entry_no,
                ]),
            ],
            'matchMatrix'    => $matchMatrix,
            'mismatchReport' => session('mismatch_report'),
            'apLedger'       => [
                'balance' => (float) ($apLedger['selected_account']['balance'] ?? 0),
                'rows'    => array_slice(array_reverse($apLedger['ledger_rows']), 0, 10),
            ],
            'relatedDocs'    => $relatedDocs,
            'auditLogs'      => $auditLogs,
        ]);
    }

    /**
     * Post Vendor Bill (dengan validasi Three-Way Match & proteksi Idempotency).
     */
    public function post(Request $request, string $id): RedirectResponse
    {
        $bill = VendorBill::with(['lines.product', 'vendor', 'purchaseOrder'])->findOrFail($id);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');
        $overrideLines  = $request->input('lines');

        $result = $this->billService->postBill($bill, $request->user(), $idempotencyKey, $overrideLines);

        if ($result['already_posted']) {
            return redirect()->route('accounting.bills.show', $bill->id)
                ->with('info', "Vendor Bill {$bill->id} sudah berstatus Posted sebelumnya (Idempotent — SR-17). Jurnal tidak digandakan.");
        }

        return redirect()->route('accounting.bills.show', $bill->id)
            ->with('success', "Vendor Bill {$bill->id} berhasil diposting. Utang Usaha (AP) telah dicatat pada Buku Besar.");
    }
}

