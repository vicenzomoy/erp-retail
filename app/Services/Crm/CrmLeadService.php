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
        'new'         => ['key' => 'new', 'label' => 'Baru', 'badge' => 'bg-slate-100 text-slate-700 border-slate-300'],
        'qualified'   => ['key' => 'qualified', 'label' => 'Terkualifikasi', 'badge' => 'bg-sky-100 text-sky-800 border-sky-300'],
        'proposition' => ['key' => 'proposition', 'label' => 'Peluang / Negosiasi', 'badge' => 'bg-amber-100 text-amber-800 border-amber-300'],
        'won'         => ['key' => 'won', 'label' => 'Menang', 'badge' => 'bg-emerald-100 text-emerald-800 border-emerald-300'],
        'lost'        => ['key' => 'lost', 'label' => 'Kalah', 'badge' => 'bg-rose-100 text-rose-800 border-rose-300'],
    ];

    public function __construct(
        protected SalesOrderService $salesOrderService
    ) {}

    // -------------------------------------------------------------------------
    // ID Generator
    // -------------------------------------------------------------------------

    public function generateLeadId(): string
    {
        $max = DB::table('crm_leads')
            ->where('id', 'LIKE', 'L%')
            ->max('id');

        if ($max === null) {
            return 'L0001';
        }

        $numeric = (int) ltrim(substr($max, 1), '0');
        $next    = $numeric + 1;

        return 'L' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
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
        $query = CrmLead::with(['customer', 'product', 'assignedUser', 'quotationLinks'])
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
            // Match proposition and opportunity alias
            $stageLeads = $allLeads->filter(function ($lead) use ($stageKey) {
                if ($stageKey === 'proposition') {
                    return $lead->stage === 'proposition' || $lead->stage === 'opportunity';
                }
                return $lead->stage === $stageKey;
            })->values();

            $stageTotalRevenue = '0.00';
            $items = [];

            foreach ($stageLeads as $l) {
                $stageTotalRevenue = bcadd($stageTotalRevenue, (string) ($l->expected_revenue ?? '0'), 2);

                $items[] = [
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
                    'assigned_name'    => $l->assignedUser?->name ?? 'Belum Ditugaskan',
                    'quotations_count' => $l->quotationLinks->count(),
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
        $query = CrmLead::with(['customer', 'product', 'assignedUser', 'quotationLinks'])
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
            if ($filters['stage'] === 'proposition') {
                $query->whereIn('stage', ['proposition', 'opportunity']);
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
        return DB::transaction(function () use ($data, $actor) {
            $customer = ContactCustomer::findOrFail($data['customer_id']);

            $leadId = $data['id'] ?? $this->generateLeadId();
            $stage = $data['stage'] ?? 'new';
            $type = $data['type'] ?? ($stage === 'new' ? 'lead' : 'opportunity');

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
                'contact_name'     => $data['contact_name'] ?? $customer->name,
                'stage'            => $stage,
                'type'             => $type,
                'expected_revenue' => $expectedRevenue,
                'variant_sku'      => $data['variant_sku'] ?? null,
                'qty_interest'     => $data['qty_interest'] ?? null,
                'assigned_user_id' => $data['assigned_user_id'] ?? $actor->id,
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
        return DB::transaction(function () use ($id, $data, $actor) {
            $lead = CrmLead::findOrFail($id);
            $oldValues = $lead->only(['customer_id', 'contact_name', 'stage', 'type', 'expected_revenue', 'variant_sku', 'qty_interest', 'assigned_user_id']);

            if (!empty($data['customer_id'])) {
                ContactCustomer::findOrFail($data['customer_id']);
                $lead->customer_id = $data['customer_id'];
            }

            if (isset($data['contact_name'])) {
                $lead->contact_name = $data['contact_name'];
            }

            if (isset($data['variant_sku'])) {
                $lead->variant_sku = $data['variant_sku'];
            }

            if (isset($data['qty_interest'])) {
                $lead->qty_interest = $data['qty_interest'];
            }

            if (isset($data['assigned_user_id'])) {
                $lead->assigned_user_id = $data['assigned_user_id'];
            }

            if (isset($data['expected_revenue']) && is_numeric($data['expected_revenue'])) {
                $lead->expected_revenue = (string) $data['expected_revenue'];
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

            // Normalize 'opportunity' alias to 'proposition' or keep valid key
            if ($newStage === 'opportunity') {
                $newStage = 'proposition';
            }

            if (!array_key_exists($newStage, self::STAGES)) {
                throw ValidationException::withMessages([
                    'stage' => "Tahap '{$newStage}' tidak valid dalam pipeline CRM.",
                ]);
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
            $lead->stage = $data['stage'] ?? ($lead->stage === 'new' ? 'proposition' : $lead->stage);
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
     * S-05 / T-10: Opportunity L0007 dipicu untuk membuat Quotation sebanyak dua kali (double click/request).
     * Sesuai SR-17 dan SR-19, sistem bersifat idempotent dan hanya menghasilkan satu Quotation serta satu tautan relasi.
     */
    public function createQuotation(string $id, ?string $idempotencyKey, User $actor): SalesOrder
    {
        // 1. Check if quotation link already exists for this lead
        $existingLink = CrmLeadQuotationLink::where('lead_id', $id)->first();
        if ($existingLink) {
            $existingSo = SalesOrder::find($existingLink->sales_order_id);
            if ($existingSo) {
                // Record idempotency audit log (SR-17)
                AuditLog::record(
                    action: 'CRM_CREATE_QUOTATION_IDEMPOTENT',
                    status: 'SUCCESS',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'sales',
                    documentType: 'crm_lead',
                    documentId: $id,
                    notes: "Aksi ganda dicegah (idempotent): Quotation {$existingSo->id} sudah tertaut dengan Opportunity {$id}."
                );

                return $existingSo;
            }
        }

        // 2. Perform transaction to create single Quotation & single Link
        return DB::transaction(function () use ($id, $idempotencyKey, $actor) {
            $lead = CrmLead::with(['customer', 'product'])->findOrFail($id);

            // Double check within transaction
            $existingLink = CrmLeadQuotationLink::where('lead_id', $id)->first();
            if ($existingLink) {
                return SalesOrder::findOrFail($existingLink->sales_order_id);
            }

            // Customer
            $customer = $lead->customer ?? ContactCustomer::findOrFail($lead->customer_id);

            // Variant SKU & Qty
            $sku = $lead->variant_sku ?? 'TSP-M-BLK';
            $qty = $lead->qty_interest ?: 1;

            // Build Quotation draft using SalesOrderService
            $salesOrder = $this->salesOrderService->createDraft([
                'customer_id'     => $customer->id,
                'payment_terms'   => $customer->payment_terms ?? 'NET30',
                'source_doc_no'   => $lead->id,
                'idempotency_key' => $idempotencyKey ?: ("CRM-QUO-{$lead->id}"),
                'notes'           => "Penawaran harga dibuat dari CRM Opportunity {$lead->id}",
                'lines'           => [
                    [
                        'variant_sku'  => $sku,
                        'qty_ordered'  => (string) $qty,
                        'discount_pct' => 0,
                    ],
                ],
            ], $actor);

            // Create single quotation link
            CrmLeadQuotationLink::create([
                'lead_id'        => $lead->id,
                'sales_order_id' => $salesOrder->id,
            ]);

            // If lead was still 'new' or 'qualified', advance to 'proposition'
            if (in_array($lead->stage, ['new', 'qualified'], true)) {
                $lead->stage = 'proposition';
                $lead->type  = 'opportunity';
                $lead->save();
            }

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
                notes: "Quotation {$salesOrder->id} berhasil dibuat dari CRM Opportunity {$lead->id} dan tertaut satu kali."
            );

            return $salesOrder;
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
        $lead = $this->updateStage($id, 'lost', $actor);

        if (!empty($reason)) {
            AuditLog::record(
                action: 'CRM_MARK_LOST_REASON',
                status: 'INFO',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'sales',
                documentType: 'crm_lead',
                documentId: $id,
                notes: "Alasan kehilangan prospek {$id}: {$reason}"
            );
        }

        return $lead;
    }
}

