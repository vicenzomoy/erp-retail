<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\CrmLead;
use App\Models\CrmLeadQuotationLink;
use App\Models\Master\ContactCustomer;
use App\Models\Master\PaymentTerm;
use App\Models\SalesOrder;
use App\Services\Sales\SalesOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SalesOrderController extends Controller
{
    public function __construct(
        private readonly SalesOrderService $service,
    ) {}

    // -------------------------------------------------------------------------
    // Index — List of Sales Orders
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $filters = [
            'status'      => $request->query('status'),
            'customer_id' => $request->query('customer_id'),
            'search'      => $request->query('search'),
        ];

        $orders = $this->service->getOrdersForList($filters);

        return Inertia::render('Sales/Orders/Index', [
            'orders'  => $orders,
            'filters' => $filters,
        ]);
    }

    // -------------------------------------------------------------------------
    // Create — New SO Form (harus diakses dari Lead/CRM)
    // -------------------------------------------------------------------------

    public function create(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $leadId = $request->query('lead_id');

        // ⚠ Quotation hanya bisa dibuat dari CRM Lead
        if (!$leadId) {
            return redirect()
                ->route('crm.pipeline')
                ->with('error', 'Quotation hanya bisa dibuat dari CRM Lead / Opportunity. Silakan buka prospek terlebih dahulu, lalu klik "Buat Penawaran".');
        }

        $lead = CrmLead::find($leadId);
        if (!$lead) {
            return redirect()
                ->route('crm.pipeline')
                ->with('error', "Lead {$leadId} tidak ditemukan.");
        }

        // Jika lead sudah Won/Lost, tidak bisa buat quotation baru
        if (in_array($lead->stage, ['won', 'lost'])) {
            return redirect()
                ->route('crm.leads.show', $leadId)
                ->with('error', "Lead {$leadId} sudah berstatus " . strtoupper($lead->stage) . ". Tidak bisa membuat penawaran baru.");
        }

        $paymentTerms = PaymentTerm::all(['term_id', 'description', 'due_days'])->toArray();

        // Ambil interest items dari lead untuk pre-populate baris SO
        $interestItems = $lead->interest_items ?? [];
        if (empty($interestItems) && $lead->variant_sku) {
            // Backward compat: lead lama hanya punya 1 produk
            $interestItems = [[
                'variant_sku'  => $lead->variant_sku,
                'qty_interest' => $lead->qty_interest ?? 1,
                'unit_price'   => 0,
            ]];
        }

        return Inertia::render('Sales/Orders/Create', [
            'customers'      => $this->service->getCustomersForSelect(),
            'products'       => $this->service->getProductsForSelect(),
            'payment_terms'  => $paymentTerms,
            'paymentTerms'   => $paymentTerms,
            'lead'           => [
                'id'           => $lead->id,
                'customer_id'  => $lead->customer_id,
                'customer_name'=> $lead->customer?->name,
                'stage'        => $lead->stage,
                'items'        => $interestItems,
            ],
            'prefill' => [
                'customer_id'   => $lead->customer_id,
                'lead_id'       => $lead->id,
                'source_doc_no' => $lead->id,
                'notes'         => "Penawaran harga dibuat dari CRM Lead {$lead->id}",
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Store — Persist Draft SO
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'   => ['required', 'string', 'exists:contacts_customers,id'],
            'payment_terms' => ['nullable', 'string', 'exists:payment_terms,term_id'],
            'notes'         => ['nullable', 'string'],
            'source_doc_no' => ['nullable', 'string', 'max:50'],
            'lead_id'       => ['nullable', 'string', 'max:50'],
            'discount_pct'  => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines'         => ['required', 'array', 'min:1'],
            'lines.*.variant_sku'   => ['required', 'string', 'exists:products,variant_sku'],
            'lines.*.qty_ordered'   => ['required', 'integer', 'min:1'],
            'lines.*.discount_pct'  => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $idempotencyKey = $request->header('X-Idempotency-Key');
        if ($idempotencyKey) {
            $existing = SalesOrder::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return redirect()->route('sales.orders.show', $existing->id);
            }
            $validated['idempotency_key'] = $idempotencyKey;
        }

        try {
            $so = $this->service->createDraft($validated, $request->user());

            // If created from CRM Lead, link lead and move to qualified
            $leadId = $validated['lead_id'] ?? $validated['source_doc_no'] ?? null;
            if ($leadId) {
                $lead = CrmLead::find($leadId);
                if ($lead) {
                    CrmLeadQuotationLink::firstOrCreate([
                        'lead_id'        => $lead->id,
                        'sales_order_id' => $so->id,
                    ]);
                    if ($lead->stage === 'new') {
                        $lead->stage = 'qualified';
                        $lead->type  = 'opportunity';
                    }
                    $lead->expected_revenue = (string) $so->grand_total;
                    if (! $lead->converted_at) {
                        $lead->converted_at = now();
                    }
                    $lead->save();
                }
            }

            return redirect()
                ->route('sales.orders.show', $so->id)
                ->with('success', "Quotation {$so->id} berhasil dibuat.");

        } catch (ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        }
    }

    // -------------------------------------------------------------------------
    // Show — Single SO Detail
    // -------------------------------------------------------------------------

    public function show(string $id): Response
    {
        $so = $this->service->getOrderForShow($id);

        return Inertia::render('Sales/Orders/Show', [
            'order'    => $so,
            'products' => $this->service->getProductsForSelect(),
        ]);
    }

    // -------------------------------------------------------------------------
    // Confirm — Transition draft → confirmed
    // -------------------------------------------------------------------------

    public function confirm(Request $request, string $id): RedirectResponse
    {
        $idempotencyKey = $request->header('X-Idempotency-Key');

        try {
            $so = $this->service->confirmOrder($id, $request->user());

            return redirect()
                ->route('sales.orders.show', $so->id)
                ->with('success', "Sales Order {$so->id} berhasil dikonfirmasi.");

        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    // -------------------------------------------------------------------------
    // Cancel
    // -------------------------------------------------------------------------

    public function cancel(Request $request, string $id): RedirectResponse
    {
        try {
            $so = $this->service->cancelOrder($id, $request->user());

            return redirect()
                ->route('sales.orders.show', $so->id)
                ->with('success', "Sales Order {$so->id} berhasil dibatalkan.");

        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    // -------------------------------------------------------------------------
    // Lines Manipulation (Draft SO only)
    // -------------------------------------------------------------------------

    public function addLine(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'variant_sku'  => ['required', 'string', 'exists:products,variant_sku'],
            'qty_ordered'  => ['required', 'numeric', 'min:1'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $validated['qty_ordered'] = (string) (int) round((float) $validated['qty_ordered']);

        try {
            $this->service->addLine($id, $validated, $request->user());

            return redirect()
                ->route('sales.orders.show', $id)
                ->with('success', 'Baris order berhasil ditambahkan.');

        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    public function removeLine(Request $request, string $id, int $lineId): RedirectResponse
    {
        try {
            $this->service->removeLine($lineId, $request->user());

            return redirect()
                ->route('sales.orders.show', $id)
                ->with('success', 'Baris berhasil dihapus.');

        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    public function updateLine(Request $request, string $id, int $lineId): RedirectResponse
    {
        $validated = $request->validate([
            'qty_ordered'  => ['nullable', 'numeric', 'min:1'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        if (isset($validated['qty_ordered'])) {
            $validated['qty_ordered'] = (string) (int) round((float) $validated['qty_ordered']);
        }

        try {
            $this->service->updateLine($lineId, $validated, $request->user());

            return redirect()
                ->route('sales.orders.show', $id)
                ->with('success', 'Baris berhasil diperbarui.');

        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    public function approveDiscount(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $so = $this->service->approveDiscount($id, $validated['notes'] ?? null, $request->user());

            return redirect()
                ->route('sales.orders.show', $id)
                ->with('success', "Diskon penawaran {$so->id} berhasil disetujui oleh Owner.");
        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    public function rejectDiscount(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'reason'            => ['nullable', 'string', 'max:500'],
            'adjusted_discount' => ['nullable', 'numeric', 'min:0', 'max:10'],
        ]);

        try {
            $so = $this->service->rejectDiscount(
                $id,
                $validated['reason'] ?? null,
                isset($validated['adjusted_discount']) ? (float) $validated['adjusted_discount'] : 10.0,
                $request->user()
            );

            return redirect()
                ->route('sales.orders.show', $id)
                ->with('success', "Pengajuan diskon > 10% untuk {$so->id} ditolak dan diskon disesuaikan kembali.");
        } catch (ValidationException $e) {
            return redirect()
                ->route('sales.orders.show', $id)
                ->with('error', collect($e->errors())->flatten()->first());
        }
    }

    // -------------------------------------------------------------------------
    // History — Order History & Reporting (Laporan Riwayat Order)
    // -------------------------------------------------------------------------

    public function history(Request $request): Response
    {
        $status     = $request->query('status', 'all');
        $customerId = $request->query('customer_id', 'all');
        $dateFrom   = $request->query('date_from');
        $dateTo     = $request->query('date_to');
        $search     = $request->query('search');

        $query = SalesOrder::with(['customer', 'lines.product'])
            ->orderByDesc('created_at');

        if ($status !== 'all' && !empty($status)) {
            $query->where('status', $status);
        }

        if ($customerId !== 'all' && !empty($customerId)) {
            $query->where('customer_id', $customerId);
        }

        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'LIKE', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Summary KPI calculations based on current filter (before pagination)
        $summaryQuery = clone $query;
        $allMatching = $summaryQuery->get();

        $totalOrders = $allMatching->count();
        $totalDpp = '0.00';
        $totalTax = '0.00';
        $totalGrand = '0.00';
        $totalQtyOrdered = 0;
        $totalQtyDelivered = 0;
        $totalQtyInvoiced = 0;

        foreach ($allMatching as $so) {
            $totalDpp = bcadd($totalDpp, (string) $so->subtotal_before_tax, 2);
            $totalTax = bcadd($totalTax, (string) $so->total_tax, 2);
            $totalGrand = bcadd($totalGrand, (string) $so->grand_total, 2);

            foreach ($so->lines as $line) {
                $totalQtyOrdered += (float) $line->qty_ordered;
                $totalQtyDelivered += (float) $line->qty_delivered;
                $totalQtyInvoiced += (float) $line->qty_invoiced;
            }
        }

        $orders = $query->paginate(15)->withQueryString()->through(function ($so) {
            return [
                'id'                  => $so->id,
                'created_at'          => $so->created_at?->format('d/m/Y H:i'),
                'confirmed_at'        => $so->confirmed_at?->format('d/m/Y H:i'),
                'customer_id'         => $so->customer_id,
                'customer_name'       => $so->customer?->name ?? '—',
                'status'              => $so->status,
                'credit_hold'         => $so->credit_hold,
                'payment_terms'       => $so->payment_terms,
                'subtotal_before_tax' => (float) $so->subtotal_before_tax,
                'total_tax'           => (float) $so->total_tax,
                'grand_total'         => (float) $so->grand_total,
                'lines_count'         => $so->lines->count(),
                'total_qty_ordered'   => (float) $so->lines->sum('qty_ordered'),
                'total_qty_delivered' => (float) $so->lines->sum('qty_delivered'),
                'total_qty_invoiced'  => (float) $so->lines->sum('qty_invoiced'),
                'items_summary'       => $so->lines->map(function ($l) {
                    return "{$l->qty_ordered}x {$l->variant_sku}";
                })->implode(', '),
            ];
        });

        $customers = ContactCustomer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Sales/Reporting/OrderHistory', [
            'orders'    => $orders,
            'customers' => $customers,
            'summary'   => [
                'total_orders'        => $totalOrders,
                'total_dpp'           => (float) $totalDpp,
                'total_tax'           => (float) $totalTax,
                'total_grand_total'   => (float) $totalGrand,
                'total_qty_ordered'   => $totalQtyOrdered,
                'total_qty_delivered' => $totalQtyDelivered,
                'total_qty_invoiced'  => $totalQtyInvoiced,
            ],
            'filters'   => [
                'status'      => $status,
                'customer_id' => $customerId,
                'date_from'   => $dateFrom,
                'date_to'     => $dateTo,
                'search'      => $search,
            ],
        ]);
    }
}
