<?php

namespace App\Services\Crm;

use App\Models\AuditLog;
use App\Models\CrmLead;
use App\Models\CrmLeadQuotationLink;
use App\Models\Master\ContactCustomer;
use App\Models\Master\Product;
use App\Models\SalesOrder;
use App\Models\User;
use App\Services\Sales\SalesOrderService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CrmLeadService
{
    public const STAGES = [
        'new'       => ['key' => 'new', 'label' => 'Baru', 'badge' => 'bg-slate-100 text-slate-700 border-slate-300'],
        'qualified' => ['key' => 'qualified', 'label' => 'Terkualifikasi', 'badge' => 'bg-sky-100 text-sky-800 border-sky-300'],
        'won'       => ['key' => 'won', 'label' => 'Menang', 'badge' => 'bg-emerald-100 text-emerald-800 border-emerald-300'],
        'lost'      => ['key' => 'lost', 'label' => 'Kalah', 'badge' => 'bg-rose-100 text-rose-800 border-rose-300'],
    ];

    protected static bool $schemaChecked = false;

    public function __construct(
        protected SalesOrderService $salesOrderService
    ) {}

    /**
     * Pastikan kolom baru pada tabel crm_leads tersedia di database
     * meskipun php artisan migrate belum dijalankan secara manual.
     */
    protected function ensureSchemaReady(): void
    {
        if (self::$schemaChecked) {
            return;
        }

        try {
            DB::statement('ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS interest_items jsonb NULL');
            DB::statement('ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lost_reason varchar(500) NULL');
            DB::statement('ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_source_doc_no_foreign');
            self::$schemaChecked = true;
        } catch (\Throwable $e) {
            // Abaikan jika gagal
        }
    }

    // -------------------------------------------------------------------------
    // ID Generator
    // -------------------------------------------------------------------------

    /**
     * Generate ID Lead CRM (format: L000X).
     * Baseline leads sampai L0007, sehingga lead baru dimulai dari L0008.
     */
    public function generateLeadId(): string
    {
        $maxNum = 7;
        $leads = DB::table('crm_leads')->pluck('id');

        foreach ($leads as $id) {
            if (preg_match('/^L-?(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $next = $maxNum + 1;
        return sprintf('L%04d', $next);
    }

    // -------------------------------------------------------------------------
    // Pipeline Data (Kanban View)
    // -------------------------------------------------------------------------

    /**
     * Get pipeline grouped by stage for Odoo-style Kanban board.
     *
     * @param array{
     *   search?: string|null,
     *   type?: string|null,
     *   customer_id?: string|null,
     *   assigned_user_id?: int|string|null,
     * } $filters
     */
    public function getPipelineData(array $filters = []): array
    {
        $this->ensureSchemaReady();

        $query = CrmLead::with(['customer', 'product', 'assignedUser', 'quotationLinks.salesOrder'])
            ->orderByDesc('created_at');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('id', 'ILIKE', "%{$s}%")
                  ->orWhere('contact_name', 'ILIKE', "%{$s}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ILIKE', "%{$s}%"))
                  ->orWhereHas('product', fn ($pq) => $pq->where('name', 'ILIKE', "%{$s}%")->orWhere('variant_sku', 'ILIKE', "%{$s}%"));
            });
        }

        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['customer_id']) && $filters['customer_id'] !== 'all') {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['assigned_user_id']) && $filters['assigned_user_id'] !== 'all') {
            $query->where('assigned_user_id', $filters['assigned_user_id']);
        }

        $allLeads = $query->get();

        $stagesOutput = [];
        $totalPipelineRevenue = '0.00';
        $totalWonRevenue = '0.00';
        $totalActiveCount = 0;
        $totalWonCount = 0;
        $totalLostCount = 0;

        foreach (self::STAGES as $stageKey => $meta) {
            $stageLeads = $allLeads->filter(function ($lead) use ($stageKey) {
                if ($stageKey === 'qualified') {
                    return in_array($lead->stage, ['qualified', 'proposition', 'opportunity'], true);
                }
                return $lead->stage === $stageKey;
            })->values();

            $stageTotalRevenue = '0.00';
            $items = [];

            foreach ($stageLeads as $l) {
                $stageTotalRevenue = bcadd($stageTotalRevenue, (string) ($l->expected_revenue ?? '0'), 2);

                $firstLink = $l->quotationLinks->first();

                $quotationList = $l->quotationLinks
                    ->filter(fn ($link) => $link->salesOrder)
                    ->map(fn ($link) => [
                        'id'          => $link->salesOrder->id,
                        'status'      => $link->salesOrder->status,
                        'grand_total' => (float) $link->salesOrder->grand_total,
                    ])
                    ->values()
                    ->all();

                // SO yang menang: prioritaskan yang sudah dikonfirmasi / selesai
                $wonOrder = $l->quotationLinks
                    ->map(fn ($link) => $link->salesOrder)
                    ->filter(fn ($so) => $so && in_array($so->status, ['confirmed', 'done'], true))
                    ->first();

                // Daftar item peminatan (multi-produk atau fallback 1 produk)
                $interestItems = [];
                if (!empty($l->interest_items) && is_array($l->interest_items)) {
                    foreach ($l->interest_items as $it) {
                        if (!empty($it['variant_sku'])) {
                            $interestItems[] = [
                                'variant_sku'  => $it['variant_sku'],
                                'qty_interest' => (int) ($it['qty_interest'] ?? 1),
                            ];
                        }
                    }
                }
                if (empty($interestItems) && $l->variant_sku) {
                    $interestItems[] = [
                        'variant_sku'  => $l->variant_sku,
                        'qty_interest' => (int) ($l->qty_interest ?: 1),
                    ];
                }

                $items[] = [
                    'id'               => $l->id,
                    'quotations'       => $quotationList,
                    'won_order_id'     => $wonOrder?->id ?? ($quotationList[0]['id'] ?? null),
                    'customer_id'      => $l->customer_id,
                    'customer_name'    => $l->customer?->name ?? '—',
                    'contact_name'     => $l->contact_name,
                    'stage'            => $l->stage,
                    'type'             => $l->type,
                    'expected_revenue' => (float) $l->expected_revenue,
                    'variant_sku'      => $l->variant_sku,
                    'product_name'     => $l->product?->name ?? $l->variant_sku,
                    'product_price'    => (float) ($l->product?->sales_price ?? 0),
                    'qty_interest'     => $l->qty_interest ?: 1,
                    'interest_items'   => $interestItems,
                    'assigned_user_id' => $l->assigned_user_id,
                    'assigned_name'    => $l->assignedUser?->name ?? 'Belum Ditugaskan',
                    'quotations_count' => $l->quotationLinks->count(),
                    'quotation_id'     => $firstLink?->sales_order_id,
                    'quotation_status' => $firstLink?->salesOrder?->status,
                    'quotation_total'  => (float) ($firstLink?->salesOrder?->grand_total ?? 0),
                    'lost_reason'      => $l->lost_reason,
                    'created_at'       => $l->created_at?->format('d/m/Y H:i'),
                ];
            }

            if ($stageKey === 'won') {
                $totalWonRevenue = bcadd($totalWonRevenue, $stageTotalRevenue, 2);
                $totalWonCount = $stageLeads->count();
            } elseif ($stageKey === 'lost') {
                $totalLostCount = $stageLeads->count();
            } else {
                $totalPipelineRevenue = bcadd($totalPipelineRevenue, $stageTotalRevenue, 2);
                $totalActiveCount += $stageLeads->count();
            }

            $stagesOutput[] = [
                'key'           => $stageKey,
                'label'         => $meta['label'],
                'badge'         => $meta['badge'],
                'items'         => $items,
                'count'         => $stageLeads->count(),
                'total_revenue' => (float) $stageTotalRevenue,
            ];
        }

        $totalClosed = $totalWonCount + $totalLostCount;
        $winRate = $totalClosed > 0 ? round(($totalWonCount / $totalClosed) * 100, 1) : 0;

        return [
            'stages'  => $stagesOutput,
            'summary' => [
                'total_leads'            => $allLeads->count(),
                'active_pipeline_count'  => $totalActiveCount,
                'total_pipeline_revenue' => (float) $totalPipelineRevenue,
                'total_won_revenue'      => (float) $totalWonRevenue,
                'won_count'              => $totalWonCount,
                'lost_count'             => $totalLostCount,
                'win_rate_pct'           => $winRate,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // List View (Table View)
    // -------------------------------------------------------------------------

    public function getLeadsList(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = CrmLead::with(['customer', 'product', 'assignedUser', 'quotationLinks.salesOrder'])
            ->orderByDesc('created_at');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('id', 'ILIKE', "%{$s}%")
                  ->orWhere('contact_name', 'ILIKE', "%{$s}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ILIKE', "%{$s}%"))
                  ->orWhereHas('product', fn ($pq) => $pq->where('name', 'ILIKE', "%{$s}%")->orWhere('variant_sku', 'ILIKE', "%{$s}%"));
            });
        }

        if (!empty($filters['stage']) && $filters['stage'] !== 'all') {
            if ($filters['stage'] === 'qualified') {
                $query->whereIn('stage', ['qualified', 'proposition', 'opportunity']);
            } else {
                $query->where('stage', $filters['stage']);
            }
        }

        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['customer_id']) && $filters['customer_id'] !== 'all') {
            $query->where('customer_id', $filters['customer_id']);
        }

        return $query->paginate($perPage)->withQueryString()->through(function ($l) {
            return [
                'id'               => $l->id,
                'customer_id'      => $l->customer_id,
                'customer_name'    => $l->customer?->name ?? '—',
                'contact_name'     => $l->contact_name,
                'stage'            => $l->stage,
                'type'             => $l->type,
                'expected_revenue' => (float) $l->expected_revenue,
                'variant_sku'      => $l->variant_sku,
                'product_name'     => $l->product?->name ?? $l->variant_sku,
                'qty_interest'     => $l->qty_interest,
                'assigned_user_id' => $l->assigned_user_id,
                'assigned_name'    => $l->assignedUser?->name ?? '—',
                'quotations_count' => $l->quotationLinks->count(),
                'created_at'       => $l->created_at?->format('d/m/Y H:i'),
                'converted_at'     => $l->converted_at?->format('d/m/Y H:i'),
            ];
        });
    }

    // -------------------------------------------------------------------------
    // Show / Detail
    // -------------------------------------------------------------------------

    public function getLeadForShow(string $id): CrmLead
    {
        $this->ensureSchemaReady();

        return CrmLead::with([
            'customer',
            'product',
            'assignedUser',
            'creator',
            'quotationLinks.salesOrder.lines.product',
        ])->findOrFail($id);
    }

    // -------------------------------------------------------------------------
    // Create Lead
    // -------------------------------------------------------------------------

    public function createLead(array $data, User $actor): CrmLead
    {
        $this->ensureSchemaReady();

        return DB::transaction(function () use ($data, $actor) {
            $customer = ContactCustomer::findOrFail($data['customer_id']);

            $leadId = $data['id'] ?? $this->generateLeadId();
            // Sales hanya bisa menambahkan lead di fase New
            $stage = 'new';
            $type = 'lead';

            $expectedRevenue = '0.00';
            if (isset($data['expected_revenue']) && is_numeric($data['expected_revenue'])) {
                $expectedRevenue = (string) $data['expected_revenue'];
            } elseif (!empty($data['variant_sku']) && !empty($data['qty_interest'])) {
                $product = Product::find($data['variant_sku']);
                if ($product) {
                    $expectedRevenue = bcmul((string) $product->sales_price, (string) $data['qty_interest'], 2);
                }
            }

            $lead = CrmLead::create([
                'id'               => $leadId,
                'source_doc_no'    => $data['source_doc_no'] ?? $leadId,
                'customer_id'      => $customer->id,
                'contact_name'     => $data['contact_name'] ?? null,
                'stage'            => $stage,
                'type'             => $type,
                'expected_revenue' => $expectedRevenue,
                'variant_sku'      => $data['variant_sku'] ?? null,
                'qty_interest'     => $data['qty_interest'] ?? null,
                'interest_items'   => $data['interest_items'] ?? null,
                'assigned_user_id' => $actor->id,
                'idempotency_key'  => $data['idempotency_key'] ?? null,
                'created_by'       => $actor->id,
            ]);

            AuditLog::record(
                action: 'CRM_CREATE_LEAD',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $lead->id,
                newValue: [
                    'stage' => $lead->stage,
                    'type'  => $lead->type,
                    'expected_revenue' => (float) $lead->expected_revenue,
                ],
                notes: "Prospek CRM {$lead->id} berhasil dibuat untuk pelanggan {$customer->name}."
            );

            return $lead;
        });
    }

    // -------------------------------------------------------------------------
    // Update Lead
    // -------------------------------------------------------------------------

    public function updateLead(string $id, array $data, User $actor): CrmLead
    {
        $this->ensureSchemaReady();

        return DB::transaction(function () use ($id, $data, $actor) {
            $lead = CrmLead::findOrFail($id);

            if ($lead->stage === 'won') {
                throw ValidationException::withMessages([
                    'stage' => 'Prospek yang sudah berada di tahap Menang (Won) telah dikunci dan tidak dapat diedit lagi.',
                ]);
            }

            $oldValues = $lead->only(['customer_id', 'contact_name', 'stage', 'type', 'expected_revenue', 'variant_sku', 'qty_interest', 'assigned_user_id']);

            $hasQuotations = CrmLeadQuotationLink::where('lead_id', $lead->id)->exists();

            // Pelanggan hanya dapat diubah jika belum ada Quotation sama sekali
            if (!empty($data['customer_id']) && !$hasQuotations) {
                ContactCustomer::findOrFail($data['customer_id']);
                $lead->customer_id = $data['customer_id'];
            }

            if (isset($data['contact_name'])) {
                $lead->contact_name = $data['contact_name'];
            }

            if (isset($data['interest_items']) && is_array($data['interest_items'])) {
                $lead->interest_items = $data['interest_items'];
                if (!empty($data['interest_items'])) {
                    $first = $data['interest_items'][0];
                    $lead->variant_sku = $first['variant_sku'] ?? null;
                    $lead->qty_interest = isset($first['qty_interest']) ? (int) $first['qty_interest'] : null;
                }
            } elseif (isset($data['variant_sku'])) {
                $lead->variant_sku = $data['variant_sku'];
                if (isset($data['qty_interest'])) {
                    $lead->qty_interest = (int) $data['qty_interest'];
                }
            }

            if (isset($data['assigned_user_id'])) {
                $lead->assigned_user_id = $data['assigned_user_id'];
            }

            if (isset($data['expected_revenue']) && is_numeric($data['expected_revenue'])) {
                $lead->expected_revenue = (string) $data['expected_revenue'];
            } elseif (!empty($lead->interest_items)) {
                $total = 0;
                $productsMap = Product::whereIn('variant_sku', collect($lead->interest_items)->pluck('variant_sku'))->pluck('sales_price', 'variant_sku');
                foreach ($lead->interest_items as $it) {
                    $price = (float) ($productsMap[$it['variant_sku']] ?? 0);
                    $total += $price * (int) ($it['qty_interest'] ?? 1);
                }
                $lead->expected_revenue = (string) $total;
            } elseif ($lead->variant_sku && $lead->qty_interest) {
                $product = Product::find($lead->variant_sku);
                if ($product) {
                    $lead->expected_revenue = bcmul((string) $product->sales_price, (string) $lead->qty_interest, 2);
                }
            }

            $lead->save();

            AuditLog::record(
                action: 'CRM_UPDATE_LEAD',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $lead->id,
                oldValue: $oldValues,
                newValue: $lead->only(array_keys($oldValues)),
                notes: "Prospek CRM {$lead->id} diperbarui."
            );

            return $lead;
        });
    }

    // -------------------------------------------------------------------------
    // Update Stage (Drag & Drop in Pipeline)
    // -------------------------------------------------------------------------

    public function updateStage(string $id, string $newStage, User $actor): CrmLead
    {
        return DB::transaction(function () use ($id, $newStage, $actor) {
            $lead = CrmLead::findOrFail($id);
            $oldStage = $lead->stage;
            $oldType  = $lead->type;

            // Normalize legacy alias to 'qualified'
            if (in_array($newStage, ['opportunity', 'proposition'], true)) {
                $newStage = 'qualified';
            }

            if (!array_key_exists($newStage, self::STAGES)) {
                throw ValidationException::withMessages([
                    'stage' => "Tahap '{$newStage}' tidak valid dalam pipeline CRM.",
                ]);
            }

            // Transition restrictions:
            // new -> qualified only
            if ($oldStage === 'new' && $newStage !== 'qualified') {
                throw ValidationException::withMessages([
                    'stage' => "Prospek tahap Baru hanya dapat dipindahkan ke tahap Terkualifikasi (Qualified).",
                ]);
            }

            // qualified -> won or lost only
            if ($oldStage === 'qualified' && !in_array($newStage, ['won', 'lost'], true)) {
                throw ValidationException::withMessages([
                    'stage' => "Prospek tahap Terkualifikasi hanya dapat dipindahkan ke tahap Menang (Won) atau Kalah (Lost).",
                ]);
            }

            // won or lost cannot be moved
            if (in_array($oldStage, ['won', 'lost'], true) && $oldStage !== $newStage) {
                throw ValidationException::withMessages([
                    'stage' => "Prospek yang sudah selesai (Menang/Kalah) tidak dapat dipindahkan lagi.",
                ]);
            }

            // Menang hanya bisa jika salah satu quotation sudah dikonfirmasi menjadi Sales Order
            if ($newStage === 'won' && $oldStage !== 'won') {
                $hasConfirmed = CrmLeadQuotationLink::where('lead_id', $id)
                    ->whereHas('salesOrder', fn ($q) => $q->whereIn('status', ['confirmed', 'done']))
                    ->exists();
                if (!$hasConfirmed) {
                    throw ValidationException::withMessages([
                        'stage' => 'Konfirmasi salah satu quotation terlebih dahulu agar prospek dapat dipindahkan ke tahap Menang.',
                    ]);
                }
            }

            $lead->stage = $newStage;

            // Auto transitions
            if ($newStage === 'won') {
                $lead->won_at = now();
                $lead->lost_at = null;
                $lead->type = 'opportunity';
            } elseif ($newStage === 'lost') {
                $lead->lost_at = now();
                $lead->won_at = null;
            } else {
                $lead->won_at = null;
                $lead->lost_at = null;
                if ($newStage !== 'new') {
                    $lead->type = 'opportunity';
                }
            }

            $lead->save();

            AuditLog::record(
                action: 'CRM_STAGE_CHANGE',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $lead->id,
                oldValue: ['stage' => $oldStage, 'type' => $oldType],
                newValue: ['stage' => $lead->stage, 'type' => $lead->type],
                notes: "Tahap CRM {$lead->id} dipindahkan dari '{$oldStage}' ke '{$newStage}' via Kanban Pipeline."
            );

            return $lead;
        });
    }

    // -------------------------------------------------------------------------
    // Convert Lead to Opportunity (T-09)
    // -------------------------------------------------------------------------

    /**
     * S-05 / T-09: Buka Lead L0007 lalu konversi menjadi Opportunity C002 bernilai 2 kaos.
     * Expected Revenue tercatat Rp318.000; belum membentuk tagihan AR maupun mutasi stok.
     */
    public function convertToOpportunity(string $id, ?array $data, User $actor): CrmLead
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $lead = CrmLead::with('customer')->findOrFail($id);

            $oldValues = [
                'stage'            => $lead->stage,
                'type'             => $lead->type,
                'expected_revenue' => (float) $lead->expected_revenue,
            ];

            // If customer or product overrides passed
            if (!empty($data['customer_id'])) {
                $lead->customer_id = $data['customer_id'];
            }
            if (!empty($data['variant_sku'])) {
                $lead->variant_sku = $data['variant_sku'];
            }
            if (!empty($data['qty_interest'])) {
                $lead->qty_interest = (int) $data['qty_interest'];
            }

            // Calculate expected revenue
            if (isset($data['expected_revenue']) && is_numeric($data['expected_revenue'])) {
                $lead->expected_revenue = (string) $data['expected_revenue'];
            } elseif ($lead->variant_sku && $lead->qty_interest) {
                $product = Product::find($lead->variant_sku);
                if ($product) {
                    $lead->expected_revenue = bcmul((string) $product->sales_price, (string) $lead->qty_interest, 2);
                }
            }

            $lead->type = 'opportunity';
            $lead->stage = 'qualified';
            $lead->converted_at = now();
            $lead->save();

            AuditLog::record(
                action: 'CRM_CONVERT_OPPORTUNITY',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $lead->id,
                oldValue: $oldValues,
                newValue: [
                    'stage'            => $lead->stage,
                    'type'             => $lead->type,
                    'expected_revenue' => (float) $lead->expected_revenue,
                    'converted_at'     => $lead->converted_at?->toISOString(),
                ],
                notes: "Lead {$lead->id} berhasil dikonversi menjadi Opportunity untuk pelanggan {$lead->customer_id} senilai Rp" . number_format((float) $lead->expected_revenue, 0, ',', '.') . " tanpa mutasi stok/AR."
            );

            return $lead;
        });
    }

    // -------------------------------------------------------------------------
    // Create Quotation (T-10 / Idempotency)
    // -------------------------------------------------------------------------

    /**
     * S-05 / T-10: Opportunity dipicu untuk membuat Quotation (Idempotent).
     */
    public function createQuotation(string $id, ?string $idempotencyKey, User $actor, array $customData = []): SalesOrder
    {
        // 1. Check if quotation link already exists for this lead
        $existingLink = CrmLeadQuotationLink::where('lead_id', $id)->first();
        if ($existingLink) {
            $existingSo = SalesOrder::find($existingLink->sales_order_id);
            if ($existingSo) {
                // Ensure lead stage is qualified
                $lead = CrmLead::find($id);
                if ($lead && $lead->stage === 'new') {
                    $lead->stage = 'qualified';
                    $lead->type  = 'opportunity';
                    $lead->save();
                }

                // Record idempotency audit log (SR-17)
                AuditLog::record(
                    action: 'CRM_CREATE_QUOTATION_IDEMPOTENT',
                    status: 'SUCCESS',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'sales',
                    documentType: 'crm_lead',
                    documentId: $id,
                    notes: "Aksi ganda dicegah (idempotent): Quotation {$existingSo->id} sudah tertaut dengan Lead {$id}."
                );

                return $existingSo;
            }
        }

        // 2. Perform transaction to create single Quotation & single Link
        return DB::transaction(function () use ($id, $idempotencyKey, $actor, $customData) {
            $lead = CrmLead::with(['customer', 'product'])->findOrFail($id);

            // Double check within transaction
            $existingLink = CrmLeadQuotationLink::where('lead_id', $id)->first();
            if ($existingLink) {
                return SalesOrder::findOrFail($existingLink->sales_order_id);
            }

            // Customer
            $customer = $lead->customer ?? ContactCustomer::findOrFail($lead->customer_id);

            // Payment terms & notes
            $paymentTerms = $customData['payment_terms'] ?? ($customer->payment_terms ?? 'NET30');
            $notes = $customData['notes'] ?? ("Penawaran harga dibuat dari CRM Lead {$lead->id}");

            // Lines: prioritas customData['lines'] -> lead->interest_items -> fallback single variant_sku
            $soLines = [];
            if (!empty($customData['lines']) && is_array($customData['lines'])) {
                foreach ($customData['lines'] as $line) {
                    $soLines[] = [
                        'variant_sku'  => $line['variant_sku'],
                        'qty_ordered'  => (string) max(1, (int) ($line['qty_ordered'] ?? 1)),
                        'discount_pct' => (float) ($line['discount_pct'] ?? 0),
                    ];
                }
            } elseif (!empty($lead->interest_items) && is_array($lead->interest_items)) {
                foreach ($lead->interest_items as $item) {
                    $soLines[] = [
                        'variant_sku'  => $item['variant_sku'],
                        'qty_ordered'  => (string) max(1, (int) ($item['qty_interest'] ?? 1)),
                        'discount_pct' => 0,
                    ];
                }
            } else {
                $sku = $customData['variant_sku'] ?? ($lead->variant_sku ?? 'TSP-M-BLK');
                $qty = !empty($customData['qty_ordered']) ? max(1, (int) $customData['qty_ordered']) : ($lead->qty_interest ? max(1, (int) $lead->qty_interest) : 1);
                $soLines[] = [
                    'variant_sku'  => $sku,
                    'qty_ordered'  => (string) $qty,
                    'discount_pct' => 0,
                ];
            }

            // Build Quotation draft using SalesOrderService
            $salesOrder = $this->salesOrderService->createDraft([
                'customer_id'     => $customer->id,
                'payment_terms'   => $paymentTerms,
                'source_doc_no'   => $lead->id,
                'idempotency_key' => $idempotencyKey ?: ("CRM-QUO-{$lead->id}"),
                'notes'           => $notes,
                'lines'           => $soLines,
            ], $actor);

            // Create single quotation link
            CrmLeadQuotationLink::create([
                'lead_id'        => $lead->id,
                'sales_order_id' => $salesOrder->id,
            ]);

            // Ketika user buat Quotation, lead otomatis dipindahkan ke tahap Qualified
            $lead->stage = 'qualified';
            $lead->type  = 'opportunity';
            $lead->variant_sku = $sku;
            $lead->qty_interest = (int) $qty;
            $lead->expected_revenue = (string) $salesOrder->grand_total;
            if (! $lead->converted_at) {
                $lead->converted_at = now();
            }
            $lead->save();

            AuditLog::record(
                action: 'CRM_CREATE_QUOTATION',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'sales_order',
                documentId: $salesOrder->id,
                newValue: [
                    'lead_id'        => $lead->id,
                    'sales_order_id' => $salesOrder->id,
                    'grand_total'    => (float) $salesOrder->grand_total,
                ],
                notes: "Quotation {$salesOrder->id} berhasil dibuat dari CRM Lead {$lead->id} dan kartu otomatis dipindahkan ke Qualified."
            );

            return $salesOrder;
        });
    }

    /**
     * Konfirmasi / Buat Sales Order langsung dari kartu tahap Qualified (Won).
     */
    public function createOrConfirmSalesOrder(string $id, array $data, User $actor): SalesOrder
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $lead = CrmLead::with(['quotationLinks.salesOrder', 'customer'])->findOrFail($id);

            // Quotation yang masih aktif (belum dibatalkan)
            $activeOrders = $lead->quotationLinks
                ->map(fn ($link) => $link->salesOrder)
                ->filter(fn ($so) => $so && $so->status !== 'cancelled')
                ->values();

            if ($activeOrders->isNotEmpty()) {
                $chosenId = $data['sales_order_id'] ?? null;

                if ($activeOrders->count() > 1 && !$chosenId) {
                    throw ValidationException::withMessages([
                        'sales_order_id' => 'Prospek ini memiliki lebih dari satu quotation. Pilih salah satu quotation untuk dikonfirmasi sebelum dipindahkan ke tahap Menang.',
                    ]);
                }

                $so = $chosenId
                    ? $activeOrders->firstWhere('id', $chosenId)
                    : $activeOrders->first();

                if (!$so) {
                    throw ValidationException::withMessages([
                        'sales_order_id' => 'Quotation yang dipilih tidak ditemukan atau sudah dibatalkan.',
                    ]);
                }

                if ($so->status === 'draft') {
                    // confirmOrder otomatis memindahkan lead ke Won & membatalkan quotation lainnya
                    $so = $this->salesOrderService->confirmOrder($so->id, $actor);
                }

                $lead->refresh();
                if ($lead->stage !== 'won') {
                    $lead->stage = 'won';
                    $lead->won_at = now();
                    $lead->lost_at = null;
                    $lead->save();
                }
                return $so;
            }

            // Jika belum ada quotation, buat quotation terlebih dahulu lalu konfirmasi
            $salesOrder = $this->createQuotation($id, null, $actor, $data);
            return $this->salesOrderService->confirmOrder($salesOrder->id, $actor);
        });
    }

    // -------------------------------------------------------------------------
    // Won / Lost
    // -------------------------------------------------------------------------

    public function markWon(string $id, User $actor): CrmLead
    {
        return $this->updateStage($id, 'won', $actor);
    }

    public function markLost(string $id, ?string $reason, User $actor): CrmLead
    {
        return DB::transaction(function () use ($id, $reason, $actor) {
            $lead = CrmLead::with('quotationLinks.salesOrder')->findOrFail($id);
            $oldStage = $lead->stage;
            $lead->stage = 'lost';
            $lead->lost_at = now();
            $lead->won_at = null;
            if ($reason) {
                $lead->lost_reason = $reason;
            }
            $lead->save();

            // Batalkan semua quotation yang masih draft milik prospek ini
            $cancelledIds = [];
            foreach ($lead->quotationLinks as $link) {
                $so = $link->salesOrder;
                if ($so && $so->status === 'draft') {
                    $this->salesOrderService->cancelOrder($so->id, $actor);
                    $cancelledIds[] = $so->id;
                }
            }

            $cancelNote = $cancelledIds
                ? ' Quotation yang dibatalkan otomatis: ' . implode(', ', $cancelledIds) . '.'
                : '';

            AuditLog::record(
                action: 'CRM_MARK_LOST',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $id,
                oldValue: ['stage' => $oldStage],
                newValue: ['stage' => 'lost', 'lost_reason' => $reason, 'cancelled_quotations' => $cancelledIds],
                notes: "Prospek CRM {$id} ditandai sebagai Kalah (Lost). Alasan: {$reason}.{$cancelNote}"
            );

            return $lead;
        });
    }
}

