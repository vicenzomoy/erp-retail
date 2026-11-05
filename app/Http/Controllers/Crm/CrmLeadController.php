<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\ContactCustomer;
use App\Models\Master\Product;
use App\Models\User;
use App\Services\Crm\CrmLeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmLeadController extends Controller
{
    public function __construct(
        protected CrmLeadService $service
    ) {}

    // -------------------------------------------------------------------------
    // Pipeline / Kanban View (Main Odoo CRM Entry)
    // -------------------------------------------------------------------------

    public function pipeline(Request $request): Response
    {
        $filters = [
            'search'           => $request->query('search'),
            'type'             => $request->query('type', 'all'),
            'customer_id'      => $request->query('customer_id', 'all'),
            'assigned_user_id' => $request->query('assigned_user_id', 'all'),
        ];

        $pipelineData = $this->service->getPipelineData($filters);

        $customers = ContactCustomer::orderBy('name')->get(['id', 'name']);
        $products  = Product::orderBy('name')->get(['variant_sku', 'name', 'sales_price']);
        $users     = User::whereIn('role_id', ['sales', 'owner'])
            ->orderBy('name')
            ->get(['id', 'name', 'role_id']);

        return Inertia::render('Crm/Pipeline/Index', [
            'pipeline'  => $pipelineData['stages'],
            'summary'   => $pipelineData['summary'],
            'filters'   => $filters,
            'customers' => $customers,
            'products'  => $products,
            'users'     => $users,
        ]);
    }

    // -------------------------------------------------------------------------
    // List View (Table View)
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $filters = [
            'search'      => $request->query('search'),
            'stage'       => $request->query('stage', 'all'),
            'type'        => $request->query('type', 'all'),
            'customer_id' => $request->query('customer_id', 'all'),
        ];

        $leads     = $this->service->getLeadsList($filters, 15);
        $customers = ContactCustomer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Crm/Leads/Index', [
            'leads'     => $leads,
            'filters'   => $filters,
            'customers' => $customers,
        ]);
    }

    // -------------------------------------------------------------------------
    // Create Form
    // -------------------------------------------------------------------------

    public function create(): Response
    {
        $customers = ContactCustomer::orderBy('name')->get(['id', 'name', 'payment_terms']);
        $products  = Product::orderBy('name')->get(['variant_sku', 'name', 'sales_price']);
        $users     = User::whereIn('role_id', ['sales', 'owner'])
            ->orderBy('name')
            ->get(['id', 'name', 'role_id']);

        return Inertia::render('Crm/Leads/Create', [
            'customers' => $customers,
            'products'  => $products,
            'users'     => $users,
        ]);
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'      => ['required', 'string', 'exists:contacts_customers,id'],
            'contact_name'     => ['nullable', 'string', 'max:100'],
            'stage'            => ['nullable', 'string'],
            'type'             => ['nullable', 'string', 'in:lead,opportunity'],
            'variant_sku'      => ['nullable', 'string', 'exists:products,variant_sku'],
            'qty_interest'     => ['nullable', 'numeric', 'min:1'],
            'expected_revenue' => ['nullable', 'numeric', 'min:0'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        $lead = $this->service->createLead($validated, $request->user());

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Prospek {$lead->id} berhasil dibuat.");
    }

    // -------------------------------------------------------------------------
    // Show / Form View
    // -------------------------------------------------------------------------

    public function show(string $id): Response
    {
        $lead = $this->service->getLeadForShow($id);

        $customers = ContactCustomer::orderBy('name')->get(['id', 'name']);
        $products  = Product::orderBy('name')->get(['variant_sku', 'name', 'sales_price']);
        $users     = User::whereIn('role_id', ['sales', 'owner'])->get(['id', 'name']);

        // Collect audit logs
        $relatedDocIds = [$lead->id];
        foreach ($lead->quotationLinks as $link) {
            $relatedDocIds[] = $link->sales_order_id;
        }

        $auditLogs = AuditLog::whereIn('document_id', $relatedDocIds)
            ->orderByDesc('created_at')
            ->take(20)
            ->get();

        return Inertia::render('Crm/Leads/Show', [
            'lead'      => [
                'id'               => $lead->id,
                'source_doc_no'    => $lead->source_doc_no,
                'customer_id'      => $lead->customer_id,
                'customer_name'    => $lead->customer?->name,
                'customer_phone'   => $lead->customer?->phone,
                'customer_email'   => $lead->customer?->email,
                'contact_name'     => $lead->contact_name,
                'stage'            => $lead->stage,
                'type'             => $lead->type,
                'expected_revenue' => (float) $lead->expected_revenue,
                'variant_sku'      => $lead->variant_sku,
                'product_name'     => $lead->product?->name ?? $lead->variant_sku,
                'product_price'    => (float) ($lead->product?->sales_price ?? 0),
                'qty_interest'     => $lead->qty_interest,
                'assigned_user_id' => $lead->assigned_user_id,
                'assigned_name'    => $lead->assignedUser?->name ?? 'Belum Ditugaskan',
                'created_by_name'  => $lead->creator?->name ?? '—',
                'created_at'       => $lead->created_at?->format('d/m/Y H:i'),
                'converted_at'     => $lead->converted_at?->format('d/m/Y H:i'),
                'won_at'           => $lead->won_at?->format('d/m/Y H:i'),
                'lost_at'          => $lead->lost_at?->format('d/m/Y H:i'),
                'quotations'       => $lead->quotationLinks->map(function ($link) {
                    $so = $link->salesOrder;
                    return [
                        'id'          => $so->id,
                        'status'      => $so->status,
                        'grand_total' => (float) $so->grand_total,
                        'created_at'  => $so->created_at?->format('d/m/Y H:i'),
                        'link_date'   => $link->created_at?->format('d/m/Y H:i'),
                    ];
                }),
            ],
            'customers' => $customers,
            'products'  => $products,
            'users'     => $users,
            'auditLogs' => $auditLogs,
        ]);
    }

    // -------------------------------------------------------------------------
    // Update Lead Details
    // -------------------------------------------------------------------------

    public function update(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id'      => ['nullable', 'string', 'exists:contacts_customers,id'],
            'contact_name'     => ['nullable', 'string', 'max:100'],
            'variant_sku'      => ['nullable', 'string', 'exists:products,variant_sku'],
            'qty_interest'     => ['nullable', 'numeric', 'min:1'],
            'expected_revenue' => ['nullable', 'numeric', 'min:0'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $this->service->updateLead($id, $validated, $request->user());

        return redirect()
            ->route('crm.leads.show', $id)
            ->with('success', "Prospek {$id} berhasil diperbarui.");
    }

    // -------------------------------------------------------------------------
    // Update Stage (Drag & Drop in Pipeline)
    // -------------------------------------------------------------------------

    public function updateStage(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'stage' => ['required', 'string'],
        ]);

        $lead = $this->service->updateStage($id, $validated['stage'], $request->user());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'lead'    => $lead,
                'message' => "Tahap {$id} berhasil dipindahkan ke {$lead->stage}.",
            ]);
        }

        return redirect()->back()->with('success', "Tahap {$id} berhasil diperbarui menjadi {$lead->stage}.");
    }

    // -------------------------------------------------------------------------
    // Convert to Opportunity (T-09)
    // -------------------------------------------------------------------------

    public function convert(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'expected_revenue' => ['nullable', 'numeric', 'min:0'],
            'variant_sku'      => ['nullable', 'string', 'exists:products,variant_sku'],
            'qty_interest'     => ['nullable', 'numeric', 'min:1'],
            'stage'            => ['nullable', 'string'],
        ]);

        $lead = $this->service->convertToOpportunity($id, $validated, $request->user());

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Lead {$lead->id} berhasil dikonversi menjadi Opportunity bernilai Rp" . number_format((float) $lead->expected_revenue, 0, ',', '.') . ".");
    }

    // -------------------------------------------------------------------------
    // Create Quotation (T-10 / Idempotent)
    // -------------------------------------------------------------------------

    public function createQuotation(Request $request, string $id): RedirectResponse
    {
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $salesOrder = $this->service->createQuotation($id, $idempotencyKey, $request->user());

        return redirect()
            ->route('sales.orders.show', $salesOrder->id)
            ->with('success', "Quotation {$salesOrder->id} berhasil dibuat/ditautkan untuk Lead {$id}.");
    }

    // -------------------------------------------------------------------------
    // Mark Won / Mark Lost
    // -------------------------------------------------------------------------

    public function markWon(Request $request, string $id): RedirectResponse
    {
        $lead = $this->service->markWon($id, $request->user());

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Opportunity {$lead->id} berhasil ditandai sebagai MENANG (Won).");
    }

    public function markLost(Request $request, string $id): RedirectResponse
    {
        $reason = $request->input('reason');
        $lead   = $this->service->markLost($id, $reason, $request->user());

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Prospek {$lead->id} ditandai sebagai KALAH (Lost).");
    }
}

