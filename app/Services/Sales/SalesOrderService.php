<?php

namespace App\Services\Sales;

use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\Master\ContactCustomer;
use App\Models\Master\PaymentTerm;
use App\Models\Master\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderLine;
use App\Models\StockReservation;
use App\Models\User;
use App\Services\Inventory\DeliveryOrderService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesOrderService
{
    public function __construct(
        protected DeliveryOrderService $deliveryOrderService,
    ) {}
    // -------------------------------------------------------------------------
    // ID Generation
    // -------------------------------------------------------------------------

    /**
     * Generate the next SO ID in format SO000X (zero-padded 4 digits).
     * Baseline SO is SO0008, so new SO continues from SO0009.
     */
    public function generateOrderId(): string
    {
        $maxNum = 8;
        $orders = DB::table('sales_orders')->pluck('id');

        foreach ($orders as $id) {
            if (preg_match('/^S(?:O)?-?(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $next = $maxNum + 1;
        return sprintf('SO%04d', $next);
    }

    // -------------------------------------------------------------------------
    // Create Draft
    // -------------------------------------------------------------------------

    /**
     * Create a Sales Order in draft status.
     *
     * @param  array{
     *   customer_id: string,
     *   payment_terms?: string|null,
     *   discount_pct?: string|numeric,
     *   source_doc_no?: string|null,
     *   notes?: string|null,
     *   idempotency_key?: string|null,
     *   lines: array<int, array{
     *     variant_sku: string,
     *     qty_ordered: string|numeric,
     *     discount_pct?: string|numeric,
     *     tax_id?: string|null
     *   }>
     * } $data
     */
    public function createDraft(array $data, User $actor): SalesOrder
    {
        // --- Idempotency guard: return existing SO if same idempotency_key already committed ---
        if (!empty($data['idempotency_key'])) {
            $existing = SalesOrder::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                return $existing->load(['lines', 'customer']);
            }
        }

        return DB::transaction(function () use ($data, $actor) {

            // --- Kunci baris pelanggan terlebih dahulu untuk menserialisasi request paralel (mencegah race condition saat koneksi lambat / double submit) ---
            /** @var ContactCustomer $customer */
            $customer = ContactCustomer::where('id', $data['customer_id'])->lockForUpdate()->firstOrFail();

            // --- Idempotency double-check inside transaction setelah lock diperoleh ---
            if (!empty($data['idempotency_key'])) {
                $existing = SalesOrder::where('idempotency_key', $data['idempotency_key'])->lockForUpdate()->first();
                if ($existing) {
                    return $existing->load(['lines', 'customer']);
                }
            }

            if (bccomp((string) $customer->credit_limit, '0', 2) < 0) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Pelanggan memiliki credit limit tidak valid (negatif).',
                ]);
            }

            // --- Auto-fill payment terms from customer ---
            $paymentTerms = $data['payment_terms'] ?? $customer->payment_terms ?? null;

            // --- Generate ID ---
            $soId = $this->generateOrderId();

            // --- Build lines ---
            $linesData = [];
            foreach ($data['lines'] ?? [] as $lineInput) {
                $product = Product::findOrFail($lineInput['variant_sku']);

                $lineData = [
                    'variant_sku'  => $lineInput['variant_sku'],
                    'qty_ordered'  => (string) ($lineInput['qty_ordered'] ?? '1'),
                    'qty_delivered'=> '0',
                    'qty_invoiced' => '0',
                    'unit_price'   => (string) $product->sales_price,
                    'discount_pct' => (string) ($lineInput['discount_pct'] ?? '0'),
                    'tax_id'       => $lineInput['tax_id'] ?? 'VAT-NONLUX',
                ];

                $this->calcLineTotals($lineData);
                $linesData[] = $lineData;
            }

            // --- SO totals from lines ---
            $subtotalBeforeTax = '0.00';
            $totalTax          = '0.00';
            $grandTotal        = '0.00';

            foreach ($linesData as $line) {
                $subtotalBeforeTax = bcadd($subtotalBeforeTax, $line['subtotal_before_tax'], 2);
                $totalTax          = bcadd($totalTax, $line['tax_amount'], 2);
                $grandTotal        = bcadd($grandTotal, $line['line_total'], 2);
            }

            // Check if order or any line has discount > 10%
            $maxDiscount = (string) ($data['discount_pct'] ?? '0');
            foreach ($linesData as $line) {
                if (bccomp((string) $line['discount_pct'], $maxDiscount, 2) > 0) {
                    $maxDiscount = (string) $line['discount_pct'];
                }
            }

            $discountHold = false;
            $discountApprovedBy = null;
            $discountApprovedAt = null;

            if (bccomp($maxDiscount, '10', 2) > 0) {
                if ($actor->role_id === 'owner') {
                    $discountHold = false;
                    $discountApprovedBy = $actor->id;
                    $discountApprovedAt = now();
                } else {
                    $discountHold = true;
                }
            }

            // --- Source doc safe check (mencegah foreign key constraint violation jika constraint lama masih aktif) ---
            $sourceDocNo = $data['source_doc_no'] ?? null;
            if ($sourceDocNo) {
                try {
                    $hasFk = DB::selectOne("
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'sales_orders_source_doc_no_foreign'
                    ");
                    if ($hasFk) {
                        $inExisting = DB::table('existing_documents')->where('document_no', $sourceDocNo)->exists();
                        if (!$inExisting) {
                            $sourceDocNo = null;
                        }
                    }
                } catch (\Throwable) {
                    // Fallback
                    try {
                        $inExisting = DB::table('existing_documents')->where('document_no', $sourceDocNo)->exists();
                        if (!$inExisting) {
                            $sourceDocNo = null;
                        }
                    } catch (\Throwable) {
                        $sourceDocNo = null;
                    }
                }
            }

            // --- Persist SO ---
            $so = SalesOrder::create([
                'id'                   => $soId,
                'source_doc_no'        => $sourceDocNo,
                'customer_id'          => $customer->id,
                'status'               => 'draft',
                'credit_hold'          => false,
                'discount_hold'        => $discountHold,
                'discount_approved_by' => $discountApprovedBy,
                'discount_approved_at' => $discountApprovedAt,
                'discount_pct'         => (string) ($data['discount_pct'] ?? '0'),
                'payment_terms'        => $paymentTerms,
                'subtotal_before_tax'  => $subtotalBeforeTax,
                'total_tax'            => $totalTax,
                'grand_total'          => $grandTotal,
                'notes'                => $data['notes'] ?? null,
                'idempotency_key'      => $data['idempotency_key'] ?? null,
                'created_by'           => $actor->id,
            ]);

            // --- Persist lines ---
            foreach ($linesData as $line) {
                $so->lines()->create($line);
            }

            if ($discountHold) {
                AuditLog::record(
                    action: 'SO_DISCOUNT_HOLD',
                    status: 'warning',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'user',
                    documentType: 'sales_order',
                    documentId: $soId,
                    newValue: [
                        'discount_pct' => $maxDiscount,
                    ],
                    notes: "Quotation {$soId} memiliki diskon {$maxDiscount}% (>10%) dan menunggu persetujuan Owner.",
                );
            }

            // --- Audit log ---
            AuditLog::record(
                action: 'SO_DRAFT_CREATED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $soId,
                newValue: [
                    'customer_id'  => $customer->id,
                    'grand_total'  => $grandTotal,
                    'lines_count'  => count($linesData),
                ],
            );

            return $so->fresh(['lines', 'customer']);
        });
    }

    // -------------------------------------------------------------------------
    // Confirm Order
    // -------------------------------------------------------------------------

    /**
     * Confirm a draft SO.
     * Applies credit limit check, discount hold check, then transitions to confirmed.
     */
    public function confirmOrder(string $soId, User $actor): SalesOrder
    {
        /** @var SalesOrder $so */
        $so = SalesOrder::with(['lines', 'customer'])
            ->findOrFail($soId);

        // --- Idempotency: already confirmed ---
        if ($so->isConfirmed()) {
            return $so;
        }

        if ($so->isDone() || $so->isCancelled()) {
            throw ValidationException::withMessages([
                'status' => "Sales Order {$soId} sudah dalam status '{$so->status}', tidak dapat dikonfirmasi.",
            ]);
        }

        /** @var ContactCustomer $customer */
        $customer = $so->customer;

        // ----------------------------------------------------------------
        // F-11 / SR-11 — CREDIT LIMIT CHECK
        // Exposure = open_ar (posted invoices residual)
        //           + grand_total of OTHER confirmed/non-done SOs
        //           + this SO's grand_total
        // ----------------------------------------------------------------
        $openAr = (string) CustomerInvoice::where('customer_id', $customer->id)
            ->where('status', 'posted')
            ->sum('amount_residual');

        $otherConfirmedSoTotal = (string) SalesOrder::where('customer_id', $customer->id)
            ->where('id', '!=', $soId)
            ->whereIn('status', ['confirmed'])
            ->sum('grand_total');

        $exposure = bcadd(
            bcadd($openAr, $otherConfirmedSoTotal, 2),
            (string) $so->grand_total,
            2
        );

        if (bccomp($exposure, (string) $customer->credit_limit, 2) > 0) {
            $so->update(['credit_hold' => true]);

            AuditLog::record(
                action: 'SO_CREDIT_HOLD',
                status: 'warning',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $soId,
                newValue: [
                    'open_ar'               => $openAr,
                    'other_confirmed_so'    => $otherConfirmedSoTotal,
                    'this_so_grand_total'   => (string) $so->grand_total,
                    'exposure'              => $exposure,
                    'credit_limit'          => (string) $customer->credit_limit,
                ],
                notes: "Credit limit terlampaui. Exposure: {$exposure}, Limit: {$customer->credit_limit}",
            );

            throw ValidationException::withMessages([
                'credit_limit' => sprintf(
                    'Sales Order %s ditahan karena melebihi credit limit pelanggan. '
                    . 'Eksposur: Rp %s, Limit: Rp %s.',
                    $soId,
                    number_format((float) $exposure, 0, ',', '.'),
                    number_format((float) $customer->credit_limit, 0, ',', '.')
                ),
            ]);
        }

        // ----------------------------------------------------------------
        // DISCOUNT CHECK — SO-level or line-level discount > 10% requires Owner approval
        // ----------------------------------------------------------------
        $maxDiscount = (string) ($so->discount_pct ?? '0');
        foreach ($so->lines as $line) {
            if (bccomp((string) $line->discount_pct, $maxDiscount, 2) > 0) {
                $maxDiscount = (string) $line->discount_pct;
            }
        }

        if (bccomp($maxDiscount, '10', 2) > 0 && $so->discount_approved_by === null) {
            if ($actor->role_id === 'owner') {
                $so->update([
                    'discount_hold'        => false,
                    'discount_approved_by' => $actor->id,
                    'discount_approved_at' => now(),
                ]);
            } else {
                $so->update(['discount_hold' => true]);

                AuditLog::record(
                    action: 'SO_DISCOUNT_HOLD',
                    status: 'warning',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'user',
                    documentType: 'sales_order',
                    documentId: $soId,
                    newValue: [
                        'discount_pct' => $maxDiscount,
                    ],
                    notes: "Diskon {$maxDiscount}% melebihi batas 10% dan belum disetujui Owner.",
                );

                throw ValidationException::withMessages([
                    'discount_pct' => sprintf(
                        'Sales Order %s tidak dapat dikonfirmasi karena diskon %s%% melebihi batas maksimal 10%% dan wajib mendapatkan persetujuan Owner.',
                        $soId,
                        rtrim(rtrim(number_format((float) $maxDiscount, 2, '.', ''), '0'), '.')
                    ),
                ]);
            }
        }

        if ($so->discount_hold && $actor->role_id !== 'owner') {
            throw ValidationException::withMessages([
                'discount_hold' => sprintf(
                    'Sales Order %s sedang ditahan menunggu persetujuan diskon oleh Owner.',
                    $soId
                ),
            ]);
        }

        // ----------------------------------------------------------------
        // All checks passed — confirm in atomic transaction
        // ----------------------------------------------------------------
        return DB::transaction(function () use ($so, $actor) {
            $now = now();

            $so->update([
                'status'        => 'confirmed',
                'confirmed_at'  => $now,
                'confirmed_by'  => $actor->id,
                'credit_hold'   => false,
                'discount_hold' => false,
            ]);

            // Lock prices on all lines
            $so->lines()->update(['price_locked_at' => $now]);

            // Otomatis generate Delivery Order ke warehouse
            $this->deliveryOrderService->createFromSalesOrder($so, $actor);

            // Otomatis pindahkan lead CRM yang tertaut ke tahap 'won' (Menang)
            $crmLinks = \App\Models\CrmLeadQuotationLink::where('sales_order_id', $so->id)->get();
            foreach ($crmLinks as $link) {
                $lead = $link->lead;
                if ($lead && $lead->stage !== 'won') {
                    $oldStage = $lead->stage;
                    $lead->stage = 'won';
                    $lead->won_at = $now;
                    $lead->lost_at = null;
                    $lead->save();

                    AuditLog::record(
                        action: 'CRM_STAGE_CHANGE',
                        status: 'SUCCESS',
                        actorUserId: $actor->id,
                        actorUsername: $actor->name,
                        actorRole: $actor->role_id ?? 'sales',
                        documentType: 'crm_lead',
                        documentId: $lead->id,
                        oldValue: ['stage' => $oldStage],
                        newValue: ['stage' => 'won'],
                        notes: "Quotation {$so->id} dikonfirmasi menjadi Sales Order. Prospek CRM {$lead->id} otomatis dipindahkan ke tahap Won (Menang)."
                    );
                }

                // Quotation lain milik prospek yang sama (masih draft) dibatalkan otomatis
                if ($lead) {
                    $siblingIds = \App\Models\CrmLeadQuotationLink::where('lead_id', $lead->id)
                        ->where('sales_order_id', '!=', $so->id)
                        ->pluck('sales_order_id');
                    $drafts = SalesOrder::whereIn('id', $siblingIds)->where('status', 'draft')->pluck('id');
                    foreach ($drafts as $draftId) {
                        $this->cancelOrder($draftId, $actor);
                    }
                }
            }

            AuditLog::record(
                action: 'SO_CONFIRMED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $so->id,
                newValue: [
                    'confirmed_at' => $now->toIso8601String(),
                    'grand_total'  => (string) $so->grand_total,
                ],
            );

            return $so->fresh(['lines', 'customer', 'confirmedBy']);
        });
    }

    // -------------------------------------------------------------------------
    // Cancel Order
    // -------------------------------------------------------------------------

    /**
     * Cancel a draft or held SO, releasing any active stock reservations.
     */
    public function cancelOrder(string $soId, User $actor): SalesOrder
    {
        return DB::transaction(function () use ($soId, $actor) {

            /** @var SalesOrder $so */
            $so = SalesOrder::lockForUpdate()->findOrFail($soId);

            if ($so->isDone() || $so->isCancelled()) {
                throw ValidationException::withMessages([
                    'status' => "Sales Order {$soId} sudah dalam status '{$so->status}', tidak dapat dibatalkan.",
                ]);
            }

            $oldStatus = $so->status;

            // Release all active stock reservations for this SO
            StockReservation::where('sales_order_id', $soId)
                ->where('status', 'active')
                ->update([
                    'status'      => 'released',
                    'released_at' => now(),
                ]);

            $so->update(['status' => 'cancelled']);

            // Pindahkan lead CRM ke 'lost' hanya jika tidak ada quotation lain yang masih aktif
            // dan prospek belum Menang (Won).
            $crmLinks = \App\Models\CrmLeadQuotationLink::where('sales_order_id', $soId)->get();
            foreach ($crmLinks as $link) {
                $lead = $link->lead;
                if (!$lead || in_array($lead->stage, ['lost', 'won'], true)) {
                    continue;
                }

                $hasOtherActive = \App\Models\CrmLeadQuotationLink::where('lead_id', $lead->id)
                    ->where('sales_order_id', '!=', $soId)
                    ->whereHas('salesOrder', fn ($q) => $q->where('status', '!=', 'cancelled'))
                    ->exists();
                if ($hasOtherActive) {
                    continue;
                }

                $oldStage = $lead->stage;
                $lead->stage = 'lost';
                $lead->lost_at = now();
                $lead->won_at = null;
                $lead->save();

                AuditLog::record(
                    action: 'CRM_STAGE_CHANGE',
                    status: 'SUCCESS',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id ?? 'sales',
                    documentType: 'crm_lead',
                    documentId: $lead->id,
                    oldValue: ['stage' => $oldStage],
                    newValue: ['stage' => 'lost'],
                    notes: "Seluruh quotation prospek {$lead->id} telah dibatalkan (terakhir {$soId}). Prospek otomatis dipindahkan ke tahap Lost (Kalah)."
                );
            }

            AuditLog::record(
                action: 'SO_CANCELLED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $soId,
                oldValue: ['status' => $oldStatus],
                newValue: ['status' => 'cancelled'],
            );

            return $so->fresh();
        });
    }

    // -------------------------------------------------------------------------
    // Line Management
    // -------------------------------------------------------------------------

    /**
     * Add a line to a draft SO and recalculate totals.
     *
     * @param  array{
     *   variant_sku: string,
     *   qty_ordered: string|numeric,
     *   discount_pct?: string|numeric,
     *   tax_id?: string|null
     * } $lineData
     */
    public function addLine(string $soId, array $lineData, User $actor): SalesOrderLine
    {
        return DB::transaction(function () use ($soId, $lineData, $actor) {

            /** @var SalesOrder $so */
            $so = SalesOrder::lockForUpdate()->findOrFail($soId);

            if (! $so->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => "Baris hanya dapat ditambahkan pada Sales Order berstatus draft. Status saat ini: {$so->status}.",
                ]);
            }

            $product = Product::findOrFail($lineData['variant_sku']);

            $line = [
                'sales_order_id' => $soId,
                'variant_sku'    => $lineData['variant_sku'],
                'qty_ordered'    => (string) ($lineData['qty_ordered'] ?? '1'),
                'qty_delivered'  => '0',
                'qty_invoiced'   => '0',
                'unit_price'     => (string) $product->sales_price,
                'discount_pct'   => (string) ($lineData['discount_pct'] ?? '0'),
                'tax_id'         => $lineData['tax_id'] ?? 'VAT-NONLUX',
            ];

            $this->calcLineTotals($line);

            $soLine = SalesOrderLine::create($line);

            $this->recalcTotals($so);
            $this->checkAndUpdateDiscountHold($so, $actor);

            AuditLog::record(
                action: 'SO_LINE_ADDED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $soId,
                newValue: [
                    'so_line_id'  => $soLine->id,
                    'variant_sku' => $soLine->variant_sku,
                    'qty_ordered' => $soLine->qty_ordered,
                    'line_total'  => $soLine->line_total,
                ],
            );

            return $soLine;
        });
    }

    /**
     * Remove a line from a draft SO and recalculate totals.
     */
    public function removeLine(int $lineId, User $actor): void
    {
        DB::transaction(function () use ($lineId, $actor) {

            /** @var SalesOrderLine $soLine */
            $soLine = SalesOrderLine::lockForUpdate()->findOrFail($lineId);

            /** @var SalesOrder $so */
            $so = SalesOrder::lockForUpdate()->findOrFail($soLine->sales_order_id);

            if (! $so->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => "Baris hanya dapat dihapus dari Sales Order berstatus draft. Status saat ini: {$so->status}.",
                ]);
            }

            $soLineId  = $soLine->id;
            $soId      = $soLine->sales_order_id;
            $variantSku = $soLine->variant_sku;

            $soLine->delete();

            $this->recalcTotals($so);
            $this->checkAndUpdateDiscountHold($so, $actor);

            AuditLog::record(
                action: 'SO_LINE_REMOVED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $soId,
                oldValue: [
                    'so_line_id'  => $soLineId,
                    'variant_sku' => $variantSku,
                ],
            );
        });
    }

    /**
     * Update qty/discount on a draft SO line.
     *
     * @param  array{qty_ordered?: string|numeric, discount_pct?: string|numeric} $data
     */
    public function updateLine(int $lineId, array $data, User $actor): SalesOrderLine
    {
        return DB::transaction(function () use ($lineId, $data, $actor) {

            /** @var SalesOrderLine $soLine */
            $soLine = SalesOrderLine::lockForUpdate()->findOrFail($lineId);

            /** @var SalesOrder $so */
            $so = SalesOrder::lockForUpdate()->findOrFail($soLine->sales_order_id);

            if (! $so->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => "Baris hanya dapat diubah pada Sales Order berstatus draft. Status saat ini: {$so->status}.",
                ]);
            }

            $lineData = [
                'variant_sku'  => $soLine->variant_sku,
                'qty_ordered'  => isset($data['qty_ordered'])  ? (string) $data['qty_ordered']  : (string) $soLine->qty_ordered,
                'unit_price'   => (string) $soLine->unit_price,
                'discount_pct' => isset($data['discount_pct']) ? (string) $data['discount_pct'] : (string) $soLine->discount_pct,
            ];

            $this->calcLineTotals($lineData);

            $oldValues = [
                'qty_ordered'  => (string) $soLine->qty_ordered,
                'discount_pct' => (string) $soLine->discount_pct,
                'line_total'   => (string) $soLine->line_total,
            ];

            $soLine->update([
                'qty_ordered'         => $lineData['qty_ordered'],
                'discount_pct'        => $lineData['discount_pct'],
                'subtotal_before_tax' => $lineData['subtotal_before_tax'],
                'tax_amount'          => $lineData['tax_amount'],
                'line_total'          => $lineData['line_total'],
            ]);

            $this->recalcTotals($so);
            $this->checkAndUpdateDiscountHold($so, $actor);

            AuditLog::record(
                action: 'SO_LINE_UPDATED',
                status: 'success',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'user',
                documentType: 'sales_order',
                documentId: $so->id,
                oldValue: $oldValues,
                newValue: [
                    'so_line_id'  => $soLine->id,
                    'qty_ordered' => $lineData['qty_ordered'],
                    'line_total'  => $lineData['line_total'],
                ],
            );

            return $soLine->fresh();
        });
    }

    // -------------------------------------------------------------------------
    // Query / List Methods
    // -------------------------------------------------------------------------

    /**
     * Return paginated SOs filterable by status, customer_id, search string.
     *
     * @param  array{status?: string, customer_id?: string, search?: string} $filters
     */
    public function getOrdersForList(array $filters = []): LengthAwarePaginator
    {
        $query = SalesOrder::with('customer')
            ->withCount('lines');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id', 'LIKE', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        return $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();
    }

    /**
     * Load a single SO with all its relations for the show view.
     */
    public function getOrderForShow(string $soId): SalesOrder
    {
        $so = SalesOrder::with([
            'customer',
            'lines.product',
            'lines.taxRate',
            'deliveryOrders',
            'customerInvoices',
            'reservations',
            'confirmedBy',
            'discountApprovedBy',
            'paymentTerm',
            'creator',
        ])->findOrFail($soId);

        // If the order is confirmed but has no delivery order yet (e.g. legacy/seed data), generate it automatically
        if ($so->isConfirmed() && $so->deliveryOrders->isEmpty()) {
            $actor = $so->confirmedBy ?? $so->creator ?? User::first();
            if ($actor) {
                $this->deliveryOrderService->createFromSalesOrder($so, $actor);
                $so->load('deliveryOrders');
            }
        }

        return $so;
    }

    /**
     * Return all customers as an array for form dropdowns.
     *
     * @return array<int, array{id: string, name: string, credit_limit: int, payment_terms: string|null, open_ar: string}>
     */
    public function getCustomersForSelect(): array
    {
        return ContactCustomer::all()
            ->map(fn($c) => [
                'id'            => $c->id,
                'name'          => $c->name,
                'credit_limit'  => $c->credit_limit,
                'payment_terms' => $c->payment_terms,
                'open_ar'       => $c->open_ar,
            ])
            ->values()
            ->all();
    }

    /**
     * Return all products as an array for line item selection.
     *
     * @return array<int, array{variant_sku: string, name: string, size: string, color: string, unit: string, sales_price: int}>
     */
    public function getProductsForSelect(): array
    {
        return Product::all()
            ->map(fn($p) => [
                'variant_sku' => $p->variant_sku,
                'name'        => $p->name,
                'size'        => $p->size,
                'color'       => $p->color,
                'unit'        => $p->unit,
                'sales_price' => $p->sales_price,
            ])
            ->values()
            ->all();
    }

    // -------------------------------------------------------------------------
    // Owner Discount Approvals
    // -------------------------------------------------------------------------

    /**
     * Owner approves a discount hold on a draft SO (Quotation).
     */
    public function approveDiscount(string $soId, ?string $notes, User $owner): SalesOrder
    {
        if ($owner->role_id !== 'owner') {
            throw ValidationException::withMessages([
                'authorization' => 'Hanya Owner yang berhak menyetujui diskon di atas 10%.',
            ]);
        }

        return DB::transaction(function () use ($soId, $notes, $owner) {
            /** @var SalesOrder $so */
            $so = SalesOrder::with(['lines', 'customer'])->lockForUpdate()->findOrFail($soId);

            if (! $so->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => "Persetujuan diskon hanya dapat dilakukan pada penawaran berstatus draft (Quotation). Status saat ini: {$so->status}.",
                ]);
            }

            $now = now();
            $updatedNotes = $so->notes;
            if ($notes) {
                $updatedNotes = $updatedNotes ? $updatedNotes . "\n[Approval Diskon Owner]: " . $notes : "[Approval Diskon Owner]: " . $notes;
            }

            $so->update([
                'discount_hold'        => false,
                'discount_approved_by' => $owner->id,
                'discount_approved_at' => $now,
                'notes'                => $updatedNotes,
            ]);

            AuditLog::record(
                action: 'SO_DISCOUNT_APPROVED',
                status: 'success',
                actorUserId: $owner->id,
                actorUsername: $owner->name,
                actorRole: $owner->role_id ?? 'owner',
                documentType: 'sales_order',
                documentId: $so->id,
                newValue: [
                    'discount_approved_by' => $owner->id,
                    'discount_approved_at' => $now->toIso8601String(),
                    'notes'                => $notes,
                ],
                notes: "Owner ({$owner->name}) menyetujui pengajuan diskon untuk {$so->id}."
            );

            return $so->fresh(['lines', 'customer', 'discountApprovedBy', 'creator']);
        });
    }

    /**
     * Owner rejects a discount request on a draft SO (Quotation).
     * Resets all line discounts and order discount that exceed cap (default 10%).
     */
    public function rejectDiscount(string $soId, ?string $reason, ?float $adjustedDiscount, User $owner): SalesOrder
    {
        if ($owner->role_id !== 'owner') {
            throw ValidationException::withMessages([
                'authorization' => 'Hanya Owner yang berhak menolak atau menyesuaikan diskon.',
            ]);
        }

        return DB::transaction(function () use ($soId, $reason, $adjustedDiscount, $owner) {
            /** @var SalesOrder $so */
            $so = SalesOrder::with(['lines', 'customer'])->lockForUpdate()->findOrFail($soId);

            if (! $so->isDraft()) {
                throw ValidationException::withMessages([
                    'status' => "Penolakan diskon hanya dapat dilakukan pada penawaran berstatus draft (Quotation). Status saat ini: {$so->status}.",
                ]);
            }

            $cap = $adjustedDiscount !== null ? min(10.0, max(0.0, (float) $adjustedDiscount)) : 10.0;
            $capStr = (string) $cap;

            if (bccomp((string) $so->discount_pct, $capStr, 2) > 0) {
                $so->discount_pct = $capStr;
            }

            foreach ($so->lines as $line) {
                if (bccomp((string) $line->discount_pct, $capStr, 2) > 0) {
                    $lineData = [
                        'qty_ordered'  => (string) $line->qty_ordered,
                        'unit_price'   => (string) $line->unit_price,
                        'discount_pct' => $capStr,
                    ];
                    $this->calcLineTotals($lineData);
                    $line->update([
                        'discount_pct'        => $capStr,
                        'subtotal_before_tax' => $lineData['subtotal_before_tax'],
                        'tax_amount'          => $lineData['tax_amount'],
                        'line_total'          => $lineData['line_total'],
                    ]);
                }
            }

            $updatedNotes = $so->notes;
            if ($reason) {
                $updatedNotes = $updatedNotes ? $updatedNotes . "\n[Penolakan Diskon Owner]: " . $reason : "[Penolakan Diskon Owner]: " . $reason;
            }

            $so->discount_hold = false;
            $so->discount_approved_by = null;
            $so->discount_approved_at = null;
            $so->notes = $updatedNotes;
            $so->save();

            $this->recalcTotals($so);

            AuditLog::record(
                action: 'SO_DISCOUNT_REJECTED',
                status: 'warning',
                actorUserId: $owner->id,
                actorUsername: $owner->name,
                actorRole: $owner->role_id ?? 'owner',
                documentType: 'sales_order',
                documentId: $so->id,
                newValue: [
                    'adjusted_to' => $cap,
                    'reason'      => $reason,
                ],
                notes: "Owner ({$owner->name}) menolak pengajuan diskon > 10% untuk {$so->id}. Diskon disesuaikan ke {$cap}%."
            );

            return $so->fresh(['lines', 'customer', 'creator']);
        });
    }

    /**
     * Check if SO or any lines exceed 10% discount and update discount_hold accordingly.
     */
    public function checkAndUpdateDiscountHold(SalesOrder $so, User $actor): void
    {
        $so->refresh();
        $maxDiscount = (string) ($so->discount_pct ?? '0');
        foreach ($so->lines as $line) {
            if (bccomp((string) $line->discount_pct, $maxDiscount, 2) > 0) {
                $maxDiscount = (string) $line->discount_pct;
            }
        }

        if (bccomp($maxDiscount, '10', 2) > 0) {
            if ($actor->role_id === 'owner') {
                $so->update([
                    'discount_hold'        => false,
                    'discount_approved_by' => $actor->id,
                    'discount_approved_at' => now(),
                ]);
            } else {
                // If not owner and discount was changed, require re-approval
                $so->update([
                    'discount_hold'        => true,
                    'discount_approved_by' => null,
                    'discount_approved_at' => null,
                ]);
            }
        } else {
            $so->update([
                'discount_hold' => false,
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    /**
     * Recalculate and persist SO-level totals by summing all lines.
     */
    private function recalcTotals(SalesOrder $so): void
    {
        $so->refresh();

        $subtotalBeforeTax = '0.00';
        $totalTax          = '0.00';
        $grandTotal        = '0.00';

        foreach ($so->lines as $line) {
            $subtotalBeforeTax = bcadd($subtotalBeforeTax, (string) $line->subtotal_before_tax, 2);
            $totalTax          = bcadd($totalTax, (string) $line->tax_amount, 2);
            $grandTotal        = bcadd($grandTotal, (string) $line->line_total, 2);
        }

        $so->update([
            'subtotal_before_tax' => $subtotalBeforeTax,
            'total_tax'           => $totalTax,
            'grand_total'         => $grandTotal,
        ]);

        foreach ($so->quotationLinks as $link) {
            if ($link->lead && $link->lead->stage !== 'lost') {
                $link->lead->update(['expected_revenue' => $grandTotal]);
            }
        }
    }

    /**
     * Calculate subtotal_before_tax, tax_amount (VAT 11%, rounded to integer Rupiah),
     * and line_total for a line data array (modified in-place via reference).
     *
     * Formula:
     *   subtotal_before_tax = qty * unit_price * (1 - discount_pct/100)
     *   tax_amount          = round(subtotal_before_tax * 11 / 100)   ← integer Rupiah
     *   line_total          = subtotal_before_tax + tax_amount
     *
     * @param  array{qty_ordered: string, unit_price: string, discount_pct: string, ...} $lineData
     */
    private function calcLineTotals(array &$lineData): void
    {
        $qty          = (string) ($lineData['qty_ordered'] ?? '0');
        $unitPrice    = (string) ($lineData['unit_price'] ?? '0');
        $discountPct  = (string) ($lineData['discount_pct'] ?? '0');

        // subtotal_before_tax = qty * unit_price * (1 - discount_pct / 100)
        $discountFactor    = bcsub('1', bcdiv($discountPct, '100', 10), 10);
        $subtotalBeforeTax = bcmul(bcmul($qty, $unitPrice, 10), $discountFactor, 2);

        // tax_amount = round(subtotal_before_tax * 11 / 100) — integer Rupiah
        $taxRaw    = bcmul($subtotalBeforeTax, bcdiv('11', '100', 10), 10);
        $taxAmount = (string) (int) round((float) $taxRaw, 0); // integer Rupiah

        // line_total = subtotal_before_tax + tax_amount
        $lineTotal = bcadd($subtotalBeforeTax, $taxAmount, 2);

        $lineData['subtotal_before_tax'] = $subtotalBeforeTax;
        $lineData['tax_amount']          = $taxAmount;
        $lineData['line_total']          = $lineTotal;
    }
}
