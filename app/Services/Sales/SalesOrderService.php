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
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesOrderService
{
    // -------------------------------------------------------------------------
    // ID Generation
    // -------------------------------------------------------------------------

    /**
     * Generate the next SO ID in format SO-XXXX (zero-padded 4 digits).
     * Queries MAX(id) for safety even if rows are sparse.
     */
    public function generateOrderId(): string
    {
        $max = DB::table('sales_orders')
            ->where('id', 'LIKE', 'SO-%')
            ->max('id');

        if ($max === null) {
            return 'SO-0001';
        }

        // Parse numeric suffix after "SO-"
        $numeric = (int) ltrim(substr($max, 3), '0');
        $next    = $numeric + 1;

        return 'SO-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
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
        return DB::transaction(function () use ($data, $actor) {

            // --- Customer validation ---
            /** @var ContactCustomer $customer */
            $customer = ContactCustomer::findOrFail($data['customer_id']);

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

            // --- Persist SO ---
            $so = SalesOrder::create([
                'id'                  => $soId,
                'source_doc_no'       => $data['source_doc_no'] ?? null,
                'customer_id'         => $customer->id,
                'status'              => 'draft',
                'credit_hold'         => false,
                'discount_hold'       => false,
                'discount_pct'        => (string) ($data['discount_pct'] ?? '0'),
                'payment_terms'       => $paymentTerms,
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax'           => $totalTax,
                'grand_total'         => $grandTotal,
                'notes'               => $data['notes'] ?? null,
                'idempotency_key'     => $data['idempotency_key'] ?? null,
                'created_by'          => $actor->id,
            ]);

            // --- Persist lines ---
            foreach ($linesData as $line) {
                $so->lines()->create($line);
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
        // DISCOUNT CHECK — SO-level discount > 10% requires approval
        // ----------------------------------------------------------------
        $discountPct = (string) $so->discount_pct;
        if (bccomp($discountPct, '10', 2) > 0 && $so->discount_approved_by === null) {
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
                    'discount_pct' => $discountPct,
                ],
                notes: "Diskon {$discountPct}% melebihi batas 10% dan belum disetujui.",
            );

            throw ValidationException::withMessages([
                'discount_pct' => sprintf(
                    'Sales Order %s ditahan karena diskon %.2f%% melebihi batas 10%% dan belum mendapat persetujuan.',
                    $soId,
                    (float) $discountPct
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
        return SalesOrder::with([
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
