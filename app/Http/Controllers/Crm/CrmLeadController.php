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
            'pipeline'    => $pipelineData['stages'],
            'summary'     => $pipelineData['summary'],
            'filters'     => $filters,
            'customers'   => $customers,
            'products'    => $products,
            'users'       => $users,
            'initialView' => $request->query('view', 'kanban'),
        ]);
    }

    // -------------------------------------------------------------------------
    // List View (Redirects to Unified Pipeline Page in List Mode)
    // -------------------------------------------------------------------------

    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('crm.pipeline', array_merge($request->query(), ['view' => 'list']));
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
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes'            => ['nullable', 'string', 'max:500'],
            // Multi-item interest lines (tidak boleh ada produk duplikat)
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.variant_sku'   => ['required', 'string', 'distinct', 'exists:products,variant_sku'],
            'items.*.qty_interest'  => ['required', 'integer', 'min:1'],
        ], [
            'customer_id.required'          => 'Silakan pilih pelanggan terlebih dahulu.',
            'items.required'                => 'Daftar produk yang diminati wajib diisi minimal 1 produk.',
            'items.min'                     => 'Daftar produk yang diminati wajib diisi minimal 1 produk.',
            'items.*.variant_sku.required'  => 'Silakan pilih produk pada setiap baris.',
            'items.*.variant_sku.distinct'  => 'Produk ini sudah dipilih di baris lain. Untuk menambah jumlah, silakan ubah kuantitas pada baris produk yang sama.',
            'items.*.variant_sku.exists'    => 'Produk yang dipilih tidak ditemukan dalam katalog.',
            'items.*.qty_interest.required' => 'Kuantitas peminatan wajib diisi.',
            'items.*.qty_interest.integer'  => 'Kuantitas peminatan harus berupa bilangan bulat.',
            'items.*.qty_interest.min'      => 'Kuantitas peminatan minimal 1 unit.',
        ]);

        // Hitung expected_revenue dari semua item (qty × harga jual)
        $items = $validated['items'];
        $skus  = collect($items)->pluck('variant_sku')->unique()->toArray();
        $priceMap = \App\Models\Master\Product::whereIn('variant_sku', $skus)
            ->pluck('sales_price', 'variant_sku');

        $totalRevenue = 0;
        $interestItems = [];
        foreach ($items as $item) {
            $price = (float) ($priceMap[$item['variant_sku']] ?? 0);
            $qty   = (int) $item['qty_interest'];
            $totalRevenue += $price * $qty;
            $interestItems[] = [
                'variant_sku'  => $item['variant_sku'],
                'qty_interest' => $qty,
                'unit_price'   => $price,
            ];
        }

        // Simpan lead: variant_sku + qty_interest = item pertama (backward compat)
        // Sales Person Ditugaskan otomatis menjadi user yang menginput
        $firstItem = $interestItems[0];
        $payload = [
            'customer_id'      => $validated['customer_id'],
            'contact_name'     => null,
            'assigned_user_id' => $request->user()->id,
            'stage'            => 'new',
            'type'             => 'lead',
            'expected_revenue' => $totalRevenue,
            'variant_sku'      => $firstItem['variant_sku'],
            'qty_interest'     => $firstItem['qty_interest'],
            'interest_items'   => $interestItems,
        ];

        $lead = $this->service->createLead($payload, $request->user());

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Prospek {$lead->id} berhasil dibuat dengan " . count($interestItems) . " jenis produk peminatan.");
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

        // Enrich interest items
        $interestItems = $lead->interest_items ?? [];
        if (empty($interestItems) && $lead->variant_sku) {
            $interestItems = [
                [
                    'variant_sku'  => $lead->variant_sku,
                    'qty_interest' => $lead->qty_interest ?? 1,
                    'unit_price'   => (float) ($lead->product?->sales_price ?? 0),
                    'product_name' => $lead->product?->name ?? $lead->variant_sku,
                ],
            ];
        } else {
            $productsBySku = $products->keyBy('variant_sku');
            $interestItems = array_map(function ($item) use ($productsBySku) {
                $sku = $item['variant_sku'] ?? '';
                $p = $productsBySku[$sku] ?? null;
                return [
                    'variant_sku'  => $sku,
                    'qty_interest' => (int) ($item['qty_interest'] ?? 1),
                    'unit_price'   => (float) ($item['unit_price'] ?? ($p?->sales_price ?? 0)),
                    'product_name' => $p?->name ?? $sku,
                ];
            }, $interestItems);
        }

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
                'interest_items'   => $interestItems,
                'assigned_user_id' => $lead->assigned_user_id,
                'assigned_name'    => $lead->assignedUser?->name ?? 'Belum Ditugaskan',
                'created_by_name'  => $lead->creator?->name ?? '—',
                'created_at'       => $lead->created_at?->format('d/m/Y H:i'),
                'converted_at'     => $lead->converted_at?->format('d/m/Y H:i'),
                'won_at'           => $lead->won_at?->format('d/m/Y H:i'),
                'lost_at'          => $lead->lost_at?->format('d/m/Y H:i'),
                'lost_reason'      => $lead->lost_reason,
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
            'customer_id'           => ['required', 'string', 'exists:contacts_customers,id'],
            'contact_name'          => ['nullable', 'string', 'max:100'],
            'assigned_user_id'      => ['nullable', 'integer', 'exists:users,id'],
            'notes'                 => ['nullable', 'string', 'max:500'],
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.variant_sku'   => ['required', 'string', 'distinct', 'exists:products,variant_sku'],
            'items.*.qty_interest'  => ['required', 'integer', 'min:1'],
        ], [
            'customer_id.required'          => 'Silakan pilih pelanggan terlebih dahulu.',
            'items.required'                => 'Daftar produk yang diminati wajib diisi minimal 1 produk.',
            'items.min'                     => 'Daftar produk yang diminati wajib diisi minimal 1 produk.',
            'items.*.variant_sku.required'  => 'Silakan pilih produk pada setiap baris.',
            'items.*.variant_sku.distinct'  => 'Produk ini sudah dipilih di baris lain. Untuk menambah jumlah, silakan ubah kuantitas pada baris produk yang sama.',
            'items.*.variant_sku.exists'    => 'Produk yang dipilih tidak ditemukan dalam katalog.',
            'items.*.qty_interest.required' => 'Kuantitas peminatan wajib diisi.',
            'items.*.qty_interest.integer'  => 'Kuantitas peminatan harus berupa bilangan bulat.',
            'items.*.qty_interest.min'      => 'Kuantitas peminatan minimal 1 unit.',
        ]);

        $items = $validated['items'];
        $skus  = collect($items)->pluck('variant_sku')->unique()->toArray();
        $priceMap = \App\Models\Master\Product::whereIn('variant_sku', $skus)
            ->pluck('sales_price', 'variant_sku');

        $totalRevenue = 0;
        $interestItems = [];
        foreach ($items as $item) {
            $price = (float) ($priceMap[$item['variant_sku']] ?? 0);
            $qty   = (int) $item['qty_interest'];
            $totalRevenue += $price * $qty;
            $interestItems[] = [
                'variant_sku'  => $item['variant_sku'],
                'qty_interest' => $qty,
                'unit_price'   => $price,
            ];
        }

        $payload = [
            'customer_id'      => $validated['customer_id'],
            'contact_name'     => $validated['contact_name'] ?? null,
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
            'expected_revenue' => $totalRevenue,
            'interest_items'   => $interestItems,
        ];

        $this->service->updateLead($id, $payload, $request->user());

        return redirect()
            ->route('crm.leads.show', $id)
            ->with('success', "Data prospek {$id} berhasil diperbarui.");
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

        $validated = $request->validate([
            'variant_sku'    => ['nullable', 'string', 'exists:products,variant_sku'],
            'qty_ordered'    => ['nullable', 'numeric', 'min:1'],
            'payment_terms'  => ['nullable', 'string', 'max:50'],
            'notes'          => ['nullable', 'string', 'max:500'],
            'redirect_to'    => ['nullable', 'string'],
        ]);

        $salesOrder = $this->service->createQuotation($id, $idempotencyKey, $request->user(), $validated);

        if ($request->input('redirect_to') === 'pipeline' || $request->header('X-Inertia')) {
            return redirect()
                ->route('crm.pipeline')
                ->with('success', "Quotation {$salesOrder->id} berhasil dibuat. Prospek dipindahkan ke Qualified.");
        }

        return redirect()
            ->route('sales.orders.show', $salesOrder->id)
            ->with('success', "Quotation {$salesOrder->id} berhasil dibuat/ditautkan untuk Lead {$id}.");
    }

    // -------------------------------------------------------------------------
    // Confirm Sales Order (Won from Qualified)
    // -------------------------------------------------------------------------

    public function confirmSalesOrder(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'sales_order_id' => ['nullable', 'string', 'max:50'],
            'variant_sku'   => ['nullable', 'string', 'exists:products,variant_sku'],
            'qty_ordered'   => ['nullable', 'numeric', 'min:1'],
            'payment_terms' => ['nullable', 'string', 'max:50'],
            'notes'         => ['nullable', 'string', 'max:500'],
            'redirect_to'   => ['nullable', 'string'],
        ]);

        $salesOrder = $this->service->createOrConfirmSalesOrder($id, $validated, $request->user());

        if ($request->input('redirect_to') === 'pipeline' || $request->header('X-Inertia')) {
            return redirect()
                ->route('crm.pipeline')
                ->with('success', "Sales Order {$salesOrder->id} berhasil dikonfirmasi. Prospek ditandai sebagai MENANG (Won).");
        }

        return redirect()
            ->route('sales.orders.show', $salesOrder->id)
            ->with('success', "Sales Order {$salesOrder->id} berhasil dikonfirmasi (Won).");
    }

    // -------------------------------------------------------------------------
    // Mark Won / Mark Lost
    // -------------------------------------------------------------------------

    public function markWon(Request $request, string $id): RedirectResponse
    {
        $lead = $this->service->markWon($id, $request->user());

        if ($request->input('redirect_to') === 'pipeline' || $request->header('X-Inertia')) {
            return redirect()
                ->route('crm.pipeline')
                ->with('success', "Opportunity {$lead->id} berhasil ditandai sebagai MENANG (Won).");
        }

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Opportunity {$lead->id} berhasil ditandai sebagai MENANG (Won).");
    }

    public function markLost(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'reason'      => ['required', 'string', 'max:500'],
            'redirect_to' => ['nullable', 'string'],
        ]);

        $lead = $this->service->markLost($id, $validated['reason'], $request->user());

        if ($request->input('redirect_to') === 'pipeline' || $request->header('X-Inertia')) {
            return redirect()
                ->route('crm.pipeline')
                ->with('success', "Prospek {$lead->id} ditandai sebagai KALAH (Lost). Alasan: {$validated['reason']}.");
        }

        return redirect()
            ->route('crm.leads.show', $lead->id)
            ->with('success', "Prospek {$lead->id} ditandai sebagai KALAH (Lost).");
    }
}

