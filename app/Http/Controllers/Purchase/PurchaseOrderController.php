<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\VendorBill;
use App\Services\Purchase\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service
    ) {}

    public function index(Request $request): Response
    {
        $filters = [
            'status' => $request->query('status', 'all'),
            'vendor_id' => $request->query('vendor_id', ''),
            'search' => $request->query('search', ''),
        ];

        $orders = $this->service->getOrdersForList($filters);
        $counts = $this->service->getCounts();
        $vendors = $this->service->getVendorsForSelect();

        return Inertia::render('Purchase/Orders/Index', [
            'orders' => $orders,
            'filters' => $filters,
            'counts' => $counts,
            'vendors' => $vendors,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Purchase/Orders/Create', [
            'nextId' => $this->service->generatePoId(),
            'vendors' => $this->service->getVendorsForSelect(),
            'products' => $this->service->getProductsForSelect(),
            'paymentTerms' => $this->service->getPaymentTermsForSelect(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|string|max:20|unique:purchase_orders,id',
            'vendor_id' => 'required|string|exists:contacts_vendors,id',
            'payment_terms' => 'nullable|string|exists:payment_terms,term_id',
            'source_doc_no' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:1000',
            'auto_confirm' => 'nullable|boolean',
            'lines' => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|string|exists:products,variant_sku',
            'lines.*.qty_ordered' => 'required|numeric|min:0.001',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.tax_id' => 'nullable|string|exists:tax_rates,tax_id',
        ]);

        $po = $this->service->createRfq($validated, $request->user());

        $msg = $po->status === 'confirmed'
            ? "Pesanan Pembelian {$po->id} berhasil dibuat dan dikonfirmasi."
            : "Permintaan Penawaran (RFQ) {$po->id} berhasil disimpan sebagai Draft.";

        return redirect()->route('purchase.orders.show', $po->id)->with('success', $msg);
    }

    public function show(string $id): Response
    {
        $po = PurchaseOrder::with([
            'vendor',
            'paymentTerm',
            'lines.product',
            'receipts.lines',
            'vendorBills.lines',
            'creator',
            'confirmedBy',
        ])->findOrFail($id);

        $lines = $po->lines->map(function ($line) use ($po) {
            // Hitung aktual received dari receipts yang berstatus validated
            $acceptedQty = 0.0;
            $rejectedQty = 0.0;
            foreach ($po->receipts->where('status', 'validated') as $rcp) {
                foreach ($rcp->lines->where('po_line_id', $line->id) as $rl) {
                    $acceptedQty += (float) $rl->qty_accepted;
                    $rejectedQty += (float) $rl->qty_rejected;
                }
            }

            // Hitung billed dari vendor bills aktif
            $billedQty = 0.0;
            foreach ($po->vendorBills->whereIn('status', ['draft', 'posted', 'paid']) as $bill) {
                foreach ($bill->lines->where('po_line_id', $line->id) as $bl) {
                    $billedQty += (float) $bl->qty_billed;
                }
            }

            return [
                'id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'product_name' => $line->product?->name ?? $line->variant_sku,
                'size' => $line->product?->size,
                'color' => $line->product?->color,
                'unit' => $line->product?->unit ?? 'pcs',
                'qty_ordered' => (float) $line->qty_ordered,
                'qty_received' => $acceptedQty > 0 ? $acceptedQty : (float) $line->qty_received,
                'qty_rejected' => $rejectedQty,
                'qty_billed' => $billedQty > 0 ? $billedQty : (float) $line->qty_billed,
                'unit_price' => (float) $line->unit_price,
                'tax_id' => $line->tax_id,
                'subtotal_before_tax' => (float) $line->subtotal_before_tax,
                'tax_amount' => (float) $line->tax_amount,
                'line_total' => (float) $line->line_total,
            ];
        });

        // Related Docs untuk tab Chatter Footer
        $relatedDocs = [];

        // 1. Dokumen Vendor
        if ($po->vendor) {
            $relatedDocs[] = [
                'type' => 'Pemasok (Vendor)',
                'id' => $po->vendor->id,
                'title' => $po->vendor->name,
                'status' => 'active',
                'url' => route('purchase.vendors.show', $po->vendor->id),
                'info' => "Kota: {$po->vendor->city} | Termin: {$po->payment_terms}",
            ];
        }

        // 2. Dokumen Penerimaan Gudang (Receipts)
        foreach ($po->receipts as $rcp) {
            $acceptedCount = $rcp->lines->sum('qty_accepted');
            $rejectedCount = $rcp->lines->sum('qty_rejected');
            $relatedDocs[] = [
                'type' => 'Penerimaan Barang (Receipt)',
                'id' => $rcp->id,
                'title' => "Penerimaan Gudang {$rcp->id}",
                'status' => $rcp->status,
                'url' => route('inventory.receipts.show', $rcp->id),
                'info' => "Lokasi: {$rcp->location_to} | Diterima: {$acceptedCount} pcs, Ditolak QC: {$rejectedCount} pcs",
            ];
        }

        // 3. Dokumen Tagihan Vendor (Vendor Bills)
        foreach ($po->vendorBills as $bill) {
            $relatedDocs[] = [
                'type' => 'Tagihan Vendor (Bill)',
                'id' => $bill->id,
                'title' => "Faktur Tagihan {$bill->id}",
                'status' => $bill->status,
                'url' => route('accounting.bills.show', $bill->id),
                'info' => "Total: Rp " . number_format($bill->grand_total, 0, ',', '.') . " | Sisa: Rp " . number_format($bill->amount_residual, 0, ',', '.'),
            ];
        }

        // 4. Jurnal Akuntansi GRIR / Persediaan yang terhubung
        $grirJournals = JournalEntry::where('source_document_type', 'receipt')
            ->whereIn('source_document_id', $po->receipts->pluck('id'))
            ->get();

        foreach ($grirJournals as $je) {
            $relatedDocs[] = [
                'type' => 'Jurnal Akuntansi (GRIR)',
                'id' => $je->entry_no,
                'title' => "Jurnal Penerimaan {$je->entry_no}",
                'status' => $je->status,
                'info' => "Debit 1200 Persediaan / Kredit 1400 Stock Interim: Rp " . number_format($je->total_debit, 0, ',', '.'),
            ];
        }

        // Audit Logs jejak rekam
        $auditLogs = AuditLog::where(function ($q) use ($po) {
            $q->where('document_type', 'purchase_order')->where('document_id', $po->id);
        })
        ->orderByDesc('id')
        ->get()
        ->map(fn ($log) => [
            'id' => $log->id,
            'action' => $log->action,
            'status' => $log->status,
            'actor_username' => $log->actor_username,
            'actor_role' => $log->actor_role,
            'notes' => $log->notes,
            'old_value' => $log->old_value,
            'new_value' => $log->new_value,
            'created_at' => $log->created_at?->format('d/m/Y H:i:s'),
            'time_ago' => $log->created_at?->diffForHumans(),
        ]);

        return Inertia::render('Purchase/Orders/Show', [
            'order' => [
                'id' => $po->id,
                'source_doc_no' => $po->source_doc_no,
                'vendor_id' => $po->vendor_id,
                'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                'vendor_city' => $po->vendor?->city,
                'status' => $po->status,
                'payment_terms' => $po->payment_terms,
                'payment_term_desc' => $po->paymentTerm?->description,
                'subtotal_before_tax' => (float) $po->subtotal_before_tax,
                'total_tax' => (float) $po->total_tax,
                'grand_total' => (float) $po->grand_total,
                'confirmed_at' => $po->confirmed_at?->format('d/m/Y H:i'),
                'confirmed_by' => $po->confirmedBy?->name,
                'created_by' => $po->creator?->name,
                'created_at' => $po->created_at?->format('d/m/Y H:i'),
                'notes' => $po->notes,
                'lines' => $lines,
            ],
            'receipts' => $po->receipts->map(fn (Receipt $r) => [
                'id' => $r->id,
                'status' => $r->status,
                'location_to' => $r->location_to,
                'receipt_date' => $r->receipt_date?->format('d/m/Y'),
            ]),
            'vendorBills' => $po->vendorBills->map(fn (VendorBill $b) => [
                'id' => $b->id,
                'status' => $b->status,
                'grand_total' => (float) $b->grand_total,
                'amount_residual' => (float) $b->amount_residual,
            ]),
            'relatedDocs' => $relatedDocs,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function confirm(Request $request, string $id): RedirectResponse
    {
        $po = PurchaseOrder::findOrFail($id);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $this->service->confirmOrder($po, $request->user(), $idempotencyKey);

        return redirect()->route('purchase.orders.show', $po->id)
            ->with('success', "Purchase Order {$po->id} berhasil dikonfirmasi. Dokumen Penerimaan Gudang telah disiapkan.");
    }

    public function cancel(Request $request, string $id): RedirectResponse
    {
        $po = PurchaseOrder::findOrFail($id);
        $reason = $request->input('reason', 'Dibatalkan oleh staf pengadaan');

        $this->service->cancelOrder($po, $request->user(), $reason);

        return redirect()->route('purchase.orders.show', $po->id)
            ->with('info', "Purchase Order {$po->id} telah dibatalkan.");
    }

    /**
     * Aksi 'Buat Tagihan' dari Form View PO dengan validasi Three-Way Matching (F-14, SR-05, SR-06, T-20).
     */
    public function createBill(string $id): RedirectResponse
    {
        $po = PurchaseOrder::findOrFail($id);

        try {
            $this->service->checkBillingEligibility($po);
            return redirect()->route('accounting.bills.create', ['purchase_order_id' => $po->id]);
        } catch (ValidationException $e) {
            return redirect()->route('purchase.orders.show', $po->id)
                ->withErrors($e->errors())
                ->with('error', $e->getMessage());
        }
    }
}

