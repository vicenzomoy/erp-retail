<?php

namespace App\Services\Owner;

use App\Models\CustomerInvoice;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\ContactCustomer;
use App\Models\Master\ContactVendor;
use App\Models\Master\Product;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PosOrder;
use App\Models\PosOrderLine;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\SalesOrder;
use App\Models\SalesOrderLine;
use App\Models\User;
use App\Models\VendorBill;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OwnerDashboardService
{
    /**
     * Get high-level executive KPIs for the Owner.
     *
     * @return array{
     *   today_revenue: string,
     *   mtd_revenue: string,
     *   last_month_revenue: string,
     *   growth_pct: float,
     *   cash_bank_balance: string,
     *   open_ar: string,
     *   open_ap: string,
     *   estimated_cogs: string,
     *   estimated_gross_profit: string,
     *   gross_margin_pct: float,
     *   pending_discounts_count: int
     * }
     */
    public function getExecutiveKpis(): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();
        $monthStart = Carbon::now()->startOfMonth();
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // 1. Today's Revenue (POS + Confirmed/Done SO)
        $posToday = (string) (PosOrder::where('status', 'paid')
            ->whereBetween('paid_at', [$todayStart, $todayEnd])
            ->sum('grand_total') ?: '0.00');

        $soToday = (string) (SalesOrder::whereIn('status', ['confirmed', 'done'])
            ->whereBetween('confirmed_at', [$todayStart, $todayEnd])
            ->sum('grand_total') ?: '0.00');

        $todayRevenue = bcadd($posToday, $soToday, 2);

        // 2. MTD Revenue
        $posMtd = (string) (PosOrder::where('status', 'paid')
            ->where('paid_at', '>=', $monthStart)
            ->sum('grand_total') ?: '0.00');

        $soMtd = (string) (SalesOrder::whereIn('status', ['confirmed', 'done'])
            ->where('confirmed_at', '>=', $monthStart)
            ->sum('grand_total') ?: '0.00');

        $mtdRevenue = bcadd($posMtd, $soMtd, 2);

        // 3. Last Month Revenue for Growth Comparison
        $posLastMonth = (string) (PosOrder::where('status', 'paid')
            ->whereBetween('paid_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('grand_total') ?: '0.00');

        $soLastMonth = (string) (SalesOrder::whereIn('status', ['confirmed', 'done'])
            ->whereBetween('confirmed_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('grand_total') ?: '0.00');

        $lastMonthRevenue = bcadd($posLastMonth, $soLastMonth, 2);

        $growthPct = 0.0;
        $lastMonthFloat = (float) $lastMonthRevenue;
        $mtdFloat = (float) $mtdRevenue;
        if ($lastMonthFloat > 0) {
            $growthPct = round((($mtdFloat - $lastMonthFloat) / $lastMonthFloat) * 100, 1);
        } elseif ($mtdFloat > 0) {
            $growthPct = 100.0;
        }

        // 4. Cash & Bank Liquid Balance (COA 1010 Kas & 1020 Bank: debit - credit)
        $cashBankBalance = (string) (JournalLine::whereIn('account_code', ['1010', '1020'])
            ->selectRaw('COALESCE(SUM(debit - credit), 0) as balance')
            ->value('balance') ?: '0.00');

        // 5. Open AR (Piutang) & Open AP (Utang)
        $openAr = (string) (CustomerInvoice::where('status', 'posted')->sum('amount_residual') ?: '0.00');
        $openAp = (string) (VendorBill::where('status', 'posted')->sum('amount_residual') ?: '0.00');

        // 6. Estimated COGS (HPP 5000: debit - credit) & Gross Profit
        $cogs = (string) (JournalLine::where('account_code', '5000')
            ->selectRaw('COALESCE(SUM(debit - credit), 0) as cogs')
            ->value('cogs') ?: '0.00');

        $cogsFloat = (float) $cogs;
        $grossProfitFloat = max(0.0, $mtdFloat - $cogsFloat);
        $grossMarginPct = $mtdFloat > 0 ? round(($grossProfitFloat / $mtdFloat) * 100, 1) : 0.0;

        // 7. Pending Discount Approvals Count
        $pendingDiscountsCount = SalesOrder::where('status', 'draft')
            ->where('discount_hold', true)
            ->count();

        return [
            'today_revenue'          => $todayRevenue,
            'mtd_revenue'            => $mtdRevenue,
            'last_month_revenue'     => $lastMonthRevenue,
            'growth_pct'             => $growthPct,
            'cash_bank_balance'      => $cashBankBalance,
            'open_ar'                => $openAr,
            'open_ap'                => $openAp,
            'estimated_cogs'         => (string) $cogsFloat,
            'estimated_gross_profit' => (string) $grossProfitFloat,
            'gross_margin_pct'       => $grossMarginPct,
            'pending_discounts_count'=> $pendingDiscountsCount,
        ];
    }

    /**
     * Get list of pending discount requests requiring Owner approval.
     *
     * @return array<int, array>
     */
    public function getPendingDiscountApprovals(): array
    {
        $orders = SalesOrder::with(['customer', 'creator', 'lines.product'])
            ->where('status', 'draft')
            ->where(function ($q) {
                $q->where('discount_hold', true)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('discount_approved_by')
                          ->where(function ($inner) {
                              $inner->where('discount_pct', '>', 10)
                                    ->orWhereHas('lines', function ($lq) {
                                        $lq->where('discount_pct', '>', 10);
                                    });
                          });
                  });
            })
            ->orderByDesc('created_at')
            ->get();

        return $orders->map(function (SalesOrder $so) {
            $maxDiscount = (float) ($so->discount_pct ?? 0);
            $totalUndiscounted = '0.00';
            $highDiscountLines = [];

            foreach ($so->lines as $line) {
                $lineDisc = (float) ($line->discount_pct ?? 0);
                if ($lineDisc > $maxDiscount) {
                    $maxDiscount = $lineDisc;
                }

                $undiscounted = bcmul((string) $line->qty_ordered, (string) $line->unit_price, 2);
                $totalUndiscounted = bcadd($totalUndiscounted, $undiscounted, 2);

                if ($lineDisc > 10) {
                    $highDiscountLines[] = [
                        'variant_sku'   => $line->variant_sku,
                        'product_name'  => $line->product?->name ?? $line->variant_sku,
                        'qty_ordered'   => (int) round((float) $line->qty_ordered),
                        'unit_price'    => (float) $line->unit_price,
                        'discount_pct'  => $lineDisc,
                        'line_total'    => (float) $line->line_total,
                    ];
                }
            }

            $discountSavings = bcsub($totalUndiscounted, (string) $so->subtotal_before_tax, 2);

            return [
                'id'                   => $so->id,
                'customer_id'          => $so->customer_id,
                'customer_name'        => $so->customer?->name ?? 'Pelanggan Umum',
                'customer_credit_limit'=> (float) ($so->customer?->credit_limit ?? 0),
                'customer_open_ar'     => (float) ($so->customer?->open_ar ?? 0),
                'salesperson_name'     => $so->creator?->name ?? 'Sales Staff',
                'max_discount_pct'     => $maxDiscount,
                'order_discount_pct'   => (float) $so->discount_pct,
                'total_undiscounted'   => (float) $totalUndiscounted,
                'discount_savings'     => (float) $discountSavings,
                'grand_total'          => (float) $so->grand_total,
                'notes'                => $so->notes,
                'created_at'           => $so->created_at?->toIso8601String(),
                'lines_count'          => $so->lines->count(),
                'high_discount_lines'  => $highDiscountLines,
            ];
        })->values()->all();
    }

    /**
     * Get history of recently approved / resolved discounts.
     *
     * @param int $limit
     * @return array<int, array>
     */
    public function getDiscountHistory(int $limit = 15): array
    {
        $orders = SalesOrder::with(['customer', 'creator', 'discountApprovedBy'])
            ->whereNotNull('discount_approved_by')
            ->orderByDesc('discount_approved_at')
            ->limit($limit)
            ->get();

        return $orders->map(fn($so) => [
            'id'                   => $so->id,
            'status'               => $so->status,
            'customer_name'        => $so->customer?->name ?? '-',
            'salesperson_name'     => $so->creator?->name ?? '-',
            'approved_by_name'     => $so->discountApprovedBy?->name ?? 'Owner',
            'approved_at'          => $so->discount_approved_at?->toIso8601String(),
            'discount_pct'         => (float) $so->discount_pct,
            'grand_total'          => (float) $so->grand_total,
        ])->values()->all();
    }

    /**
     * Get omnichannel sales channel breakdown (Retail POS vs B2B Wholesale).
     *
     * @return array{
     *   retail_pos: array{omset: float, orders_count: int, share_pct: float},
     *   wholesale_so: array{omset: float, orders_count: int, share_pct: float},
     *   total_omset: float
     * }
     */
    public function getSalesChannelBreakdown(): array
    {
        $monthStart = Carbon::now()->startOfMonth();

        $posOmset = (float) (PosOrder::where('status', 'paid')
            ->where('paid_at', '>=', $monthStart)
            ->sum('grand_total') ?: 0);
        $posCount = PosOrder::where('status', 'paid')
            ->where('paid_at', '>=', $monthStart)
            ->count();

        $soOmset = (float) (SalesOrder::whereIn('status', ['confirmed', 'done'])
            ->where('confirmed_at', '>=', $monthStart)
            ->sum('grand_total') ?: 0);
        $soCount = SalesOrder::whereIn('status', ['confirmed', 'done'])
            ->where('confirmed_at', '>=', $monthStart)
            ->count();

        $total = $posOmset + $soOmset;

        return [
            'retail_pos' => [
                'omset'        => $posOmset,
                'orders_count' => $posCount,
                'share_pct'    => $total > 0 ? round(($posOmset / $total) * 100, 1) : 0,
            ],
            'wholesale_so' => [
                'omset'        => $soOmset,
                'orders_count' => $soCount,
                'share_pct'    => $total > 0 ? round(($soOmset / $total) * 100, 1) : 0,
            ],
            'total_omset' => $total,
        ];
    }

    /**
     * Get top 5 best selling products.
     *
     * @return array<int, array{variant_sku: string, name: string, qty_sold: int, total_revenue: float}>
     */
    public function getTopProducts(int $limit = 5): array
    {
        $products = DB::table('sales_order_lines')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_lines.sales_order_id')
            ->join('products', 'products.variant_sku', '=', 'sales_order_lines.variant_sku')
            ->whereIn('sales_orders.status', ['confirmed', 'done'])
            ->groupBy('sales_order_lines.variant_sku', 'products.name')
            ->selectRaw('
                sales_order_lines.variant_sku,
                products.name,
                SUM(sales_order_lines.qty_ordered) as total_qty,
                SUM(sales_order_lines.line_total) as total_revenue
            ')
            ->orderByRaw('SUM(sales_order_lines.line_total) DESC')
            ->limit($limit)
            ->get();

        return $products->map(fn($p) => [
            'variant_sku'   => $p->variant_sku,
            'name'          => $p->name,
            'qty_sold'      => (int) round((float) $p->total_qty),
            'total_revenue' => (float) $p->total_revenue,
        ])->all();
    }

    /**
     * Get sales team performance & average discount analysis.
     *
     * @return array<int, array{name: string, orders_count: int, total_omset: float, avg_discount_pct: float}>
     */
    public function getSalesTeamPerformance(): array
    {
        $reps = DB::table('sales_orders')
            ->join('users', 'users.id', '=', 'sales_orders.created_by')
            ->whereIn('sales_orders.status', ['confirmed', 'done', 'draft'])
            ->groupBy('users.id', 'users.name')
            ->selectRaw('
                users.name,
                COUNT(sales_orders.id) as orders_count,
                SUM(CASE WHEN sales_orders.status IN (\'confirmed\', \'done\') THEN sales_orders.grand_total ELSE 0 END) as total_omset,
                AVG(sales_orders.discount_pct) as avg_discount_pct
            ')
            ->orderByRaw('SUM(CASE WHEN sales_orders.status IN (\'confirmed\', \'done\') THEN sales_orders.grand_total ELSE 0 END) DESC')
            ->get();

        return $reps->map(fn($r) => [
            'name'             => $r->name,
            'orders_count'     => (int) $r->orders_count,
            'total_omset'      => (float) $r->total_omset,
            'avg_discount_pct' => round((float) $r->avg_discount_pct, 1),
        ])->all();
    }

    /**
     * 1. OMSET HARI INI: Rincian total barang yang dijual hari ini,
     * nominal per barang, dan total barang serta nominal per PT pembeli.
     */
    public function getOmsetTodayDetails(): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        // 1. Sales Orders B2B hari ini
        $salesOrders = SalesOrder::with(['customer', 'lines.product'])
            ->whereIn('status', ['confirmed', 'done'])
            ->whereBetween('confirmed_at', [$todayStart, $todayEnd])
            ->get();

        // 2. POS Orders Retail hari ini
        $posOrders = PosOrder::with(['customer', 'lines.product', 'cashier'])
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$todayStart, $todayEnd])
            ->get();

        $productsMap = [];
        $customersMap = [];
        $ordersList = [];

        $totalOmset = 0.0;
        $totalQty = 0.0;
        $omsetB2b = 0.0;
        $omsetPos = 0.0;

        // Process Sales Orders
        foreach ($salesOrders as $so) {
            $totalOmset += (float) $so->grand_total;
            $omsetB2b += (float) $so->grand_total;
            $custId = $so->customer_id ?? 'CUST-UNKNOWN';
            $custName = $so->customer?->name ?? 'Pelanggan B2B';

            if (!isset($customersMap[$custId])) {
                $customersMap[$custId] = [
                    'customer_id'   => $custId,
                    'customer_name' => $custName,
                    'customer_type' => $so->customer?->type ?? 'B2B',
                    'city'          => $so->customer?->city ?? 'Pekanbaru',
                    'total_qty'     => 0.0,
                    'total_nominal' => 0.0,
                    'orders_count'  => 0,
                    'items'         => [],
                    'order_ids'     => [],
                ];
            }
            $customersMap[$custId]['total_nominal'] += (float) $so->grand_total;
            $customersMap[$custId]['orders_count'] += 1;
            $customersMap[$custId]['order_ids'][] = $so->id;

            $soItemCount = 0;
            foreach ($so->lines as $line) {
                $sku = $line->variant_sku;
                $qty = (float) $line->qty_ordered;
                $lineTotal = (float) $line->line_total;
                $soItemCount += $qty;
                $totalQty += $qty;

                // Add to product aggregation
                if (!isset($productsMap[$sku])) {
                    $productsMap[$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'size'          => $line->product?->size ?? '-',
                        'color'         => $line->product?->color ?? '-',
                        'unit'          => $line->product?->unit ?? 'pcs',
                        'qty_b2b'       => 0.0,
                        'qty_pos'       => 0.0,
                        'total_qty'     => 0.0,
                        'nominal_b2b'   => 0.0,
                        'nominal_pos'   => 0.0,
                        'total_nominal' => 0.0,
                        'cost_price'    => (float) ($line->product?->cost ?? 0),
                    ];
                }
                $productsMap[$sku]['qty_b2b'] += $qty;
                $productsMap[$sku]['total_qty'] += $qty;
                $productsMap[$sku]['nominal_b2b'] += $lineTotal;
                $productsMap[$sku]['total_nominal'] += $lineTotal;

                // Add to customer items breakdown
                if (!isset($customersMap[$custId]['items'][$sku])) {
                    $customersMap[$custId]['items'][$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'qty'           => 0.0,
                        'total_nominal' => 0.0,
                    ];
                }
                $customersMap[$custId]['items'][$sku]['qty'] += $qty;
                $customersMap[$custId]['items'][$sku]['total_nominal'] += $lineTotal;
                $customersMap[$custId]['total_qty'] += $qty;
            }

            $ordersList[] = [
                'doc_id'        => $so->id,
                'channel'       => 'B2B Sales Order',
                'time'          => $so->confirmed_at?->format('H:i') ?? '-',
                'customer_name' => $custName,
                'items_count'   => $soItemCount,
                'grand_total'   => (float) $so->grand_total,
                'status'        => $so->status,
                'view_url'      => route('sales.orders.show', $so->id),
            ];
        }

        // Process POS Orders
        foreach ($posOrders as $pos) {
            $totalOmset += (float) $pos->grand_total;
            $omsetPos += (float) $pos->grand_total;
            $custId = $pos->customer_id ?? 'POS-RETAIL';
            $custName = $pos->customer?->name ?? 'Pelanggan Toko Fisik (POS Retail)';

            if (!isset($customersMap[$custId])) {
                $customersMap[$custId] = [
                    'customer_id'   => $custId,
                    'customer_name' => $custName,
                    'customer_type' => $pos->customer ? ($pos->customer->type ?? 'Individu') : 'Retail',
                    'city'          => $pos->customer?->city ?? 'Gerai Toko',
                    'total_qty'     => 0.0,
                    'total_nominal' => 0.0,
                    'orders_count'  => 0,
                    'items'         => [],
                    'order_ids'     => [],
                ];
            }
            $customersMap[$custId]['total_nominal'] += (float) $pos->grand_total;
            $customersMap[$custId]['orders_count'] += 1;
            $customersMap[$custId]['order_ids'][] = $pos->id;

            $posItemCount = 0;
            foreach ($pos->lines as $line) {
                $sku = $line->variant_sku;
                $qty = (float) $line->qty;
                $lineTotal = (float) $line->line_total;
                $posItemCount += $qty;
                $totalQty += $qty;

                if (!isset($productsMap[$sku])) {
                    $productsMap[$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'size'          => $line->product?->size ?? '-',
                        'color'         => $line->product?->color ?? '-',
                        'unit'          => $line->product?->unit ?? 'pcs',
                        'qty_b2b'       => 0.0,
                        'qty_pos'       => 0.0,
                        'total_qty'     => 0.0,
                        'nominal_b2b'   => 0.0,
                        'nominal_pos'   => 0.0,
                        'total_nominal' => 0.0,
                        'cost_price'    => (float) ($line->product?->cost ?? 0),
                    ];
                }
                $productsMap[$sku]['qty_pos'] += $qty;
                $productsMap[$sku]['total_qty'] += $qty;
                $productsMap[$sku]['nominal_pos'] += $lineTotal;
                $productsMap[$sku]['total_nominal'] += $lineTotal;

                if (!isset($customersMap[$custId]['items'][$sku])) {
                    $customersMap[$custId]['items'][$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'qty'           => 0.0,
                        'total_nominal' => 0.0,
                    ];
                }
                $customersMap[$custId]['items'][$sku]['qty'] += $qty;
                $customersMap[$custId]['items'][$sku]['total_nominal'] += $lineTotal;
                $customersMap[$custId]['total_qty'] += $qty;
            }

            $ordersList[] = [
                'doc_id'        => $pos->id,
                'channel'       => 'POS Kasir Toko',
                'time'          => $pos->paid_at?->format('H:i') ?? '-',
                'customer_name' => $custName,
                'items_count'   => $posItemCount,
                'grand_total'   => (float) $pos->grand_total,
                'status'        => $pos->status,
                'view_url'      => route('pos.orders.show', $pos->id),
            ];
        }

        // Convert items associative arrays to indexed lists
        $customersList = array_values(array_map(function ($c) {
            $c['items'] = array_values($c['items']);
            return $c;
        }, $customersMap));

        usort($customersList, fn($a, $b) => $b['total_nominal'] <=> $a['total_nominal']);

        $productsList = array_values($productsMap);
        usort($productsList, fn($a, $b) => $b['total_nominal'] <=> $a['total_nominal']);

        return [
            'date_formatted'  => Carbon::today()->translatedFormat('d F Y'),
            'kpis' => [
                'total_omset'     => $totalOmset,
                'total_qty'       => (int) round($totalQty),
                'total_orders'    => count($ordersList),
                'total_customers' => count($customersList),
                'omset_b2b'       => $omsetB2b,
                'omset_pos'       => $omsetPos,
            ],
            'products'   => $productsList,
            'customers'  => $customersList,
            'orders'     => $ordersList,
        ];
    }

    /**
     * 2. OMSET BULAN INI: Sama seperti omset hari ini tapi dapat dikelompokkan
     * per bulan, rincian produk, dan rincian per PT pembeli.
     */
    public function getOmsetMonthDetails(?string $selectedMonth = null): array
    {
        $selectedMonth = $selectedMonth ?: Carbon::now()->format('Y-m');
        $dateObj = Carbon::createFromFormat('Y-m', $selectedMonth);
        $monthStart = $dateObj->copy()->startOfMonth();
        $monthEnd = $dateObj->copy()->endOfMonth();

        // 1. Sales Orders B2B pada bulan terpilih
        $salesOrders = SalesOrder::with(['customer', 'lines.product'])
            ->whereIn('status', ['confirmed', 'done'])
            ->whereBetween('confirmed_at', [$monthStart, $monthEnd])
            ->get();

        // 2. POS Orders Retail pada bulan terpilih
        $posOrders = PosOrder::with(['customer', 'lines.product', 'cashier'])
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$monthStart, $monthEnd])
            ->get();

        $productsMap = [];
        $customersMap = [];
        $ordersList = [];
        $dailyTrend = [];

        $totalOmset = 0.0;
        $totalQty = 0.0;
        $omsetB2b = 0.0;
        $omsetPos = 0.0;

        foreach ($salesOrders as $so) {
            $totalOmset += (float) $so->grand_total;
            $omsetB2b += (float) $so->grand_total;
            $custId = $so->customer_id ?? 'CUST-UNKNOWN';
            $custName = $so->customer?->name ?? 'Pelanggan B2B';
            $dayKey = $so->confirmed_at?->format('Y-m-d') ?? $monthStart->format('Y-m-d');

            if (!isset($dailyTrend[$dayKey])) {
                $dailyTrend[$dayKey] = ['date' => $dayKey, 'omset' => 0.0, 'orders' => 0];
            }
            $dailyTrend[$dayKey]['omset'] += (float) $so->grand_total;
            $dailyTrend[$dayKey]['orders'] += 1;

            if (!isset($customersMap[$custId])) {
                $customersMap[$custId] = [
                    'customer_id'   => $custId,
                    'customer_name' => $custName,
                    'customer_type' => $so->customer?->type ?? 'B2B',
                    'city'          => $so->customer?->city ?? 'Pekanbaru',
                    'total_qty'     => 0.0,
                    'total_nominal' => 0.0,
                    'orders_count'  => 0,
                    'items'         => [],
                    'order_ids'     => [],
                ];
            }
            $customersMap[$custId]['total_nominal'] += (float) $so->grand_total;
            $customersMap[$custId]['orders_count'] += 1;
            $customersMap[$custId]['order_ids'][] = $so->id;

            $soItemCount = 0;
            foreach ($so->lines as $line) {
                $sku = $line->variant_sku;
                $qty = (float) $line->qty_ordered;
                $lineTotal = (float) $line->line_total;
                $soItemCount += $qty;
                $totalQty += $qty;

                if (!isset($productsMap[$sku])) {
                    $productsMap[$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'size'          => $line->product?->size ?? '-',
                        'color'         => $line->product?->color ?? '-',
                        'unit'          => $line->product?->unit ?? 'pcs',
                        'qty_b2b'       => 0.0,
                        'qty_pos'       => 0.0,
                        'total_qty'     => 0.0,
                        'nominal_b2b'   => 0.0,
                        'nominal_pos'   => 0.0,
                        'total_nominal' => 0.0,
                        'cost_price'    => (float) ($line->product?->cost ?? 0),
                    ];
                }
                $productsMap[$sku]['qty_b2b'] += $qty;
                $productsMap[$sku]['total_qty'] += $qty;
                $productsMap[$sku]['nominal_b2b'] += $lineTotal;
                $productsMap[$sku]['total_nominal'] += $lineTotal;

                if (!isset($customersMap[$custId]['items'][$sku])) {
                    $customersMap[$custId]['items'][$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'qty'           => 0.0,
                        'total_nominal' => 0.0,
                    ];
                }
                $customersMap[$custId]['items'][$sku]['qty'] += $qty;
                $customersMap[$custId]['items'][$sku]['total_nominal'] += $lineTotal;
                $customersMap[$custId]['total_qty'] += $qty;
            }

            $ordersList[] = [
                'doc_id'        => $so->id,
                'channel'       => 'B2B Sales Order',
                'date'          => $so->confirmed_at?->format('d/m/Y') ?? '-',
                'time'          => $so->confirmed_at?->format('H:i') ?? '-',
                'customer_name' => $custName,
                'items_count'   => $soItemCount,
                'grand_total'   => (float) $so->grand_total,
                'status'        => $so->status,
                'view_url'      => route('sales.orders.show', $so->id),
            ];
        }

        foreach ($posOrders as $pos) {
            $totalOmset += (float) $pos->grand_total;
            $omsetPos += (float) $pos->grand_total;
            $custId = $pos->customer_id ?? 'POS-RETAIL';
            $custName = $pos->customer?->name ?? 'Pelanggan Toko Fisik (POS Retail)';
            $dayKey = $pos->paid_at?->format('Y-m-d') ?? $monthStart->format('Y-m-d');

            if (!isset($dailyTrend[$dayKey])) {
                $dailyTrend[$dayKey] = ['date' => $dayKey, 'omset' => 0.0, 'orders' => 0];
            }
            $dailyTrend[$dayKey]['omset'] += (float) $pos->grand_total;
            $dailyTrend[$dayKey]['orders'] += 1;

            if (!isset($customersMap[$custId])) {
                $customersMap[$custId] = [
                    'customer_id'   => $custId,
                    'customer_name' => $custName,
                    'customer_type' => $pos->customer ? ($pos->customer->type ?? 'Individu') : 'Retail',
                    'city'          => $pos->customer?->city ?? 'Gerai Toko',
                    'total_qty'     => 0.0,
                    'total_nominal' => 0.0,
                    'orders_count'  => 0,
                    'items'         => [],
                    'order_ids'     => [],
                ];
            }
            $customersMap[$custId]['total_nominal'] += (float) $pos->grand_total;
            $customersMap[$custId]['orders_count'] += 1;
            $customersMap[$custId]['order_ids'][] = $pos->id;

            $posItemCount = 0;
            foreach ($pos->lines as $line) {
                $sku = $line->variant_sku;
                $qty = (float) $line->qty;
                $lineTotal = (float) $line->line_total;
                $posItemCount += $qty;
                $totalQty += $qty;

                if (!isset($productsMap[$sku])) {
                    $productsMap[$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'size'          => $line->product?->size ?? '-',
                        'color'         => $line->product?->color ?? '-',
                        'unit'          => $line->product?->unit ?? 'pcs',
                        'qty_b2b'       => 0.0,
                        'qty_pos'       => 0.0,
                        'total_qty'     => 0.0,
                        'nominal_b2b'   => 0.0,
                        'nominal_pos'   => 0.0,
                        'total_nominal' => 0.0,
                        'cost_price'    => (float) ($line->product?->cost ?? 0),
                    ];
                }
                $productsMap[$sku]['qty_pos'] += $qty;
                $productsMap[$sku]['total_qty'] += $qty;
                $productsMap[$sku]['nominal_pos'] += $lineTotal;
                $productsMap[$sku]['total_nominal'] += $lineTotal;

                if (!isset($customersMap[$custId]['items'][$sku])) {
                    $customersMap[$custId]['items'][$sku] = [
                        'sku'           => $sku,
                        'name'          => $line->product?->name ?? $sku,
                        'qty'           => 0.0,
                        'total_nominal' => 0.0,
                    ];
                }
                $customersMap[$custId]['items'][$sku]['qty'] += $qty;
                $customersMap[$custId]['items'][$sku]['total_nominal'] += $lineTotal;
                $customersMap[$custId]['total_qty'] += $qty;
            }

            $ordersList[] = [
                'doc_id'        => $pos->id,
                'channel'       => 'POS Kasir Toko',
                'date'          => $pos->paid_at?->format('d/m/Y') ?? '-',
                'time'          => $pos->paid_at?->format('H:i') ?? '-',
                'customer_name' => $custName,
                'items_count'   => $posItemCount,
                'grand_total'   => (float) $pos->grand_total,
                'status'        => $pos->status,
                'view_url'      => route('pos.orders.show', $pos->id),
            ];
        }

        // Monthly comparison list (Last 6 months breakdown)
        $monthlyGrouping = [];
        for ($i = 0; $i < 6; $i++) {
            $m = Carbon::now()->subMonths($i);
            $mKey = $m->format('Y-m');
            $mStart = $m->copy()->startOfMonth();
            $mEnd = $m->copy()->endOfMonth();

            $soSum = (float) (SalesOrder::whereIn('status', ['confirmed', 'done'])
                ->whereBetween('confirmed_at', [$mStart, $mEnd])
                ->sum('grand_total') ?: 0);

            $posSum = (float) (PosOrder::where('status', 'paid')
                ->whereBetween('paid_at', [$mStart, $mEnd])
                ->sum('grand_total') ?: 0);

            $mTotal = $soSum + $posSum;

            $soCount = SalesOrder::whereIn('status', ['confirmed', 'done'])
                ->whereBetween('confirmed_at', [$mStart, $mEnd])
                ->count();
            $posCount = PosOrder::where('status', 'paid')
                ->whereBetween('paid_at', [$mStart, $mEnd])
                ->count();

            $monthlyGrouping[] = [
                'month_key'    => $mKey,
                'month_label'  => $m->translatedFormat('F Y'),
                'omset_b2b'    => $soSum,
                'omset_pos'    => $posSum,
                'total_omset'  => $mTotal,
                'total_orders' => $soCount + $posCount,
                'is_current'   => $mKey === $selectedMonth,
            ];
        }

        $customersList = array_values(array_map(function ($c) {
            $c['items'] = array_values($c['items']);
            return $c;
        }, $customersMap));
        usort($customersList, fn($a, $b) => $b['total_nominal'] <=> $a['total_nominal']);

        $productsList = array_values($productsMap);
        usort($productsList, fn($a, $b) => $b['total_nominal'] <=> $a['total_nominal']);

        ksort($dailyTrend);

        return [
            'selected_month'       => $selectedMonth,
            'selected_month_label' => $dateObj->translatedFormat('F Y'),
            'kpis' => [
                'total_omset'     => $totalOmset,
                'total_qty'       => (int) round($totalQty),
                'total_orders'    => count($ordersList),
                'total_customers' => count($customersList),
                'omset_b2b'       => $omsetB2b,
                'omset_pos'       => $omsetPos,
            ],
            'monthly_grouping' => $monthlyGrouping,
            'daily_trend'      => array_values($dailyTrend),
            'products'         => $productsList,
            'customers'        => $customersList,
            'orders'           => $ordersList,
        ];
    }

    /**
     * 3. LABA KOTOR: Rincian produk apa yang dijual, total penjualan,
     * harga pokok produksi (HPP inventory), dan selisih (harga jual - harga beli).
     */
    public function getGrossProfitDetails(?string $period = 'mtd'): array
    {
        $queryStart = null;
        $queryEnd = null;
        $periodLabel = 'Bulan Ini (MTD)';

        if ($period === 'today') {
            $queryStart = Carbon::today()->startOfDay();
            $queryEnd = Carbon::today()->endOfDay();
            $periodLabel = 'Hari Ini (' . Carbon::today()->translatedFormat('d F Y') . ')';
        } elseif ($period === 'all') {
            $periodLabel = 'Semua Periode';
        } else {
            // MTD
            $queryStart = Carbon::now()->startOfMonth();
            $queryEnd = Carbon::now()->endOfMonth();
            $periodLabel = 'Bulan Ini (' . Carbon::now()->translatedFormat('F Y') . ')';
        }

        // 1. Lines from Sales Orders
        $soQuery = SalesOrderLine::with(['salesOrder.customer', 'product'])
            ->whereHas('salesOrder', function ($q) use ($queryStart, $queryEnd) {
                $q->whereIn('status', ['confirmed', 'done']);
                if ($queryStart && $queryEnd) {
                    $q->whereBetween('confirmed_at', [$queryStart, $queryEnd]);
                }
            });
        $soLines = $soQuery->get();

        // 2. Lines from POS Orders
        $posQuery = PosOrderLine::with(['order.customer', 'product'])
            ->whereHas('order', function ($q) use ($queryStart, $queryEnd) {
                $q->where('status', 'paid');
                if ($queryStart && $queryEnd) {
                    $q->whereBetween('paid_at', [$queryStart, $queryEnd]);
                }
            });
        $posLines = $posQuery->get();

        $productsMap = [];
        $transactionsMap = [];

        $totalRevenue = 0.0;
        $totalCogs = 0.0;

        foreach ($soLines as $line) {
            $sku = $line->variant_sku;
            $qty = (float) $line->qty_ordered;
            $salesPrice = (float) $line->unit_price * (1 - ((float) $line->discount_pct / 100));
            $cogsUnit = (float) ($line->product?->cost ?? 0);
            $lineRevenue = $qty * $salesPrice;
            $lineCogs = $qty * $cogsUnit;
            $lineProfit = $lineRevenue - $lineCogs;

            $totalRevenue += $lineRevenue;
            $totalCogs += $lineCogs;

            if (!isset($productsMap[$sku])) {
                $productsMap[$sku] = [
                    'sku'             => $sku,
                    'name'            => $line->product?->name ?? $sku,
                    'size'            => $line->product?->size ?? '-',
                    'color'           => $line->product?->color ?? '-',
                    'unit'            => $line->product?->unit ?? 'pcs',
                    'qty_sold'        => 0.0,
                    'cost_price'      => $cogsUnit, // HPP dari modul inventory
                    'total_revenue'   => 0.0,
                    'total_cogs'      => 0.0,
                    'gross_profit'    => 0.0,
                    'inventory_url'   => route('inventory.products.show', $sku),
                ];
            }
            $productsMap[$sku]['qty_sold'] += $qty;
            $productsMap[$sku]['total_revenue'] += $lineRevenue;
            $productsMap[$sku]['total_cogs'] += $lineCogs;
            $productsMap[$sku]['gross_profit'] += $lineProfit;

            $transactionsMap[] = [
                'doc_id'        => $line->sales_order_id,
                'channel'       => 'B2B Sales Order',
                'date'          => $line->salesOrder?->confirmed_at?->format('d/m/Y') ?? '-',
                'customer_name' => $line->salesOrder?->customer?->name ?? 'Pelanggan B2B',
                'sku'           => $sku,
                'product_name'  => $line->product?->name ?? $sku,
                'qty'           => $qty,
                'sales_price'   => $salesPrice,
                'cost_price'    => $cogsUnit,
                'unit_margin'   => $salesPrice - $cogsUnit,
                'line_revenue'  => $lineRevenue,
                'line_cogs'     => $lineCogs,
                'line_profit'   => $lineProfit,
                'margin_pct'    => $lineRevenue > 0 ? round(($lineProfit / $lineRevenue) * 100, 1) : 0,
                'view_url'      => route('sales.orders.show', $line->sales_order_id),
            ];
        }

        foreach ($posLines as $line) {
            $sku = $line->variant_sku;
            $qty = (float) $line->qty;
            $salesPrice = (float) $line->unit_price;
            $cogsUnit = (float) ($line->cogs_per_unit ?: ($line->product?->cost ?? 0));
            $lineRevenue = (float) ($line->subtotal_before_tax ?: ($qty * $salesPrice));
            $lineCogs = (float) ($line->cogs_total ?: ($qty * $cogsUnit));
            $lineProfit = $lineRevenue - $lineCogs;

            $totalRevenue += $lineRevenue;
            $totalCogs += $lineCogs;

            if (!isset($productsMap[$sku])) {
                $productsMap[$sku] = [
                    'sku'             => $sku,
                    'name'            => $line->product?->name ?? $sku,
                    'size'            => $line->product?->size ?? '-',
                    'color'           => $line->product?->color ?? '-',
                    'unit'            => $line->product?->unit ?? 'pcs',
                    'qty_sold'        => 0.0,
                    'cost_price'      => $cogsUnit,
                    'total_revenue'   => 0.0,
                    'total_cogs'      => 0.0,
                    'gross_profit'    => 0.0,
                    'inventory_url'   => route('inventory.products.show', $sku),
                ];
            }
            $productsMap[$sku]['qty_sold'] += $qty;
            $productsMap[$sku]['total_revenue'] += $lineRevenue;
            $productsMap[$sku]['total_cogs'] += $lineCogs;
            $productsMap[$sku]['gross_profit'] += $lineProfit;

            $transactionsMap[] = [
                'doc_id'        => $line->pos_order_id,
                'channel'       => 'POS Kasir Toko',
                'date'          => $line->order?->paid_at?->format('d/m/Y') ?? '-',
                'customer_name' => $line->order?->customer?->name ?? 'Pelanggan Toko Fisik',
                'sku'           => $sku,
                'product_name'  => $line->product?->name ?? $sku,
                'qty'           => $qty,
                'sales_price'   => $salesPrice,
                'cost_price'    => $cogsUnit,
                'unit_margin'   => $salesPrice - $cogsUnit,
                'line_revenue'  => $lineRevenue,
                'line_cogs'     => $lineCogs,
                'line_profit'   => $lineProfit,
                'margin_pct'    => $lineRevenue > 0 ? round(($lineProfit / $lineRevenue) * 100, 1) : 0,
                'view_url'      => route('pos.orders.show', $line->pos_order_id),
            ];
        }

        // Finalize product list with average unit price, margin per unit and %
        $productsList = array_values(array_map(function ($p) {
            $avgSalesPrice = $p['qty_sold'] > 0 ? $p['total_revenue'] / $p['qty_sold'] : 0.0;
            $p['avg_sales_price'] = $avgSalesPrice;
            $p['unit_margin'] = $avgSalesPrice - $p['cost_price'];
            $p['margin_pct'] = $p['total_revenue'] > 0 ? round(($p['gross_profit'] / $p['total_revenue']) * 100, 1) : 0;
            return $p;
        }, $productsMap));

        usort($productsList, fn($a, $b) => $b['gross_profit'] <=> $a['gross_profit']);

        $totalProfit = $totalRevenue - $totalCogs;
        $overallMarginPct = $totalRevenue > 0 ? round(($totalProfit / $totalRevenue) * 100, 1) : 0.0;

        return [
            'period'               => $period,
            'period_label'         => $periodLabel,
            'kpis' => [
                'total_revenue'      => $totalRevenue,
                'total_cogs'         => $totalCogs,
                'gross_profit'       => $totalProfit,
                'overall_margin_pct' => $overallMarginPct,
                'products_count'     => count($productsList),
            ],
            'products'     => $productsList,
            'transactions' => $transactionsMap,
        ];
    }

    /**
     * 4. KAS & BANK: Rincian mutasi kas dan bank, uang masuk dari SO berapa,
     * uang keluar untuk PO berapa, serta mutasi penerimaan kas POS.
     */
    public function getCashBankDetails(): array
    {
        // 1. Saldo Akun 1010 (Kas) dan 1020 (Bank)
        $cash1010 = (float) (JournalLine::where('account_code', '1010')
            ->selectRaw('COALESCE(SUM(debit - credit), 0) as balance')
            ->value('balance') ?: 0);

        $bank1020 = (float) (JournalLine::where('account_code', '1020')
            ->selectRaw('COALESCE(SUM(debit - credit), 0) as balance')
            ->value('balance') ?: 0);

        $totalBalance = $cash1010 + $bank1020;

        // 2. Uang Masuk dari SO (Customer Payments Inbound)
        $inboundPayments = Payment::with(['journalEntry', 'bankAccount'])
            ->where('payment_type', 'inbound')
            ->where('status', 'posted')
            ->orderByDesc('payment_date')
            ->get();

        $inflowSoList = [];
        $totalInflowSo = 0.0;

        foreach ($inboundPayments as $p) {
            $amt = (float) $p->amount;
            $totalInflowSo += $amt;

            // Find linked invoice and SO
            $allocation = PaymentAllocation::where('payment_id', $p->id)->first();
            $invId = $allocation?->document_id ?? $p->reference;
            $invoice = CustomerInvoice::with('customer', 'salesOrder')->find($invId);
            $custName = $invoice?->customer?->name ?? ContactCustomer::find($p->party_id)?->name ?? 'Pelanggan';
            $soId = $invoice?->sales_order_id ?? '-';

            $inflowSoList[] = [
                'payment_id'      => $p->id,
                'date'            => $p->payment_date?->format('d/m/Y') ?? '-',
                'customer_name'   => $custName,
                'sales_order_id'  => $soId,
                'invoice_id'      => $invId,
                'account_name'    => $p->bankAccount?->account_name ?? 'Bank/Kas',
                'payment_method'  => $p->payment_method ?? 'Bank Transfer',
                'amount'          => $amt,
                'journal_entry_no'=> $p->journalEntry?->entry_no ?? '-',
                'view_url'        => route('accounting.payments.show', $p->id),
            ];
        }

        // 3. Uang Masuk dari Kasir POS
        $posPayments = PosOrder::with(['customer', 'cashier'])
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->limit(50)
            ->get();

        $inflowPosList = [];
        $totalInflowPos = 0.0;

        foreach ($posPayments as $pos) {
            $amt = (float) $pos->grand_total;
            $totalInflowPos += $amt;

            $inflowPosList[] = [
                'order_id'       => $pos->id,
                'date'           => $pos->paid_at?->format('d/m/Y H:i') ?? '-',
                'customer_name'  => $pos->customer?->name ?? 'Pelanggan Toko Fisik',
                'payment_method' => strtoupper($pos->payment_method),
                'cashier_name'   => $pos->cashier?->name ?? 'Kasir',
                'amount'         => $amt,
                'view_url'       => route('pos.orders.show', $pos->id),
            ];
        }

        // 4. Uang Keluar untuk PO (Vendor Payments Outbound)
        $outboundPayments = Payment::with(['journalEntry', 'bankAccount'])
            ->where('payment_type', 'outbound')
            ->where('status', 'posted')
            ->orderByDesc('payment_date')
            ->get();

        $outflowPoList = [];
        $totalOutflowPo = 0.0;

        foreach ($outboundPayments as $p) {
            $amt = (float) $p->amount;
            $totalOutflowPo += $amt;

            $allocation = PaymentAllocation::where('payment_id', $p->id)->first();
            $billId = $allocation?->document_id ?? $p->reference;
            $bill = VendorBill::with('vendor', 'purchaseOrder')->find($billId);
            $vendorName = $bill?->vendor?->name ?? ContactVendor::find($p->party_id)?->name ?? 'Vendor';
            $poId = $bill?->purchase_order_id ?? '-';

            $outflowPoList[] = [
                'payment_id'       => $p->id,
                'date'             => $p->payment_date?->format('d/m/Y') ?? '-',
                'vendor_name'      => $vendorName,
                'purchase_order_id'=> $poId,
                'bill_id'          => $billId,
                'account_name'     => $p->bankAccount?->account_name ?? 'Bank/Kas',
                'payment_method'   => $p->payment_method ?? 'Bank Transfer',
                'amount'           => $amt,
                'journal_entry_no' => $p->journalEntry?->entry_no ?? '-',
                'view_url'         => route('accounting.payments.show', $p->id),
            ];
        }

        // 5. Buku Mutasi Kas & Bank (Combined Journal Lines 1010 & 1020)
        $ledgerLines = JournalLine::with('journalEntry')
            ->whereIn('account_code', ['1010', '1020'])
            ->whereHas('journalEntry', fn($q) => $q->where('status', 'posted'))
            ->orderBy('id', 'desc')
            ->limit(40)
            ->get()
            ->map(function ($jl) {
                return [
                    'id'           => $jl->id,
                    'account_code' => $jl->account_code,
                    'account_name' => $jl->account_code === '1010' ? 'Kas' : 'Bank',
                    'date'         => $jl->journalEntry?->entry_date?->format('d/m/Y') ?? '-',
                    'entry_no'     => $jl->journalEntry?->entry_no ?? '-',
                    'description'  => $jl->description,
                    'source_doc'   => ($jl->journalEntry?->source_document_type ?? '') . ' #' . ($jl->journalEntry?->source_document_id ?? ''),
                    'debit'        => (float) $jl->debit,
                    'credit'       => (float) $jl->credit,
                ];
            })->all();

        return [
            'kpis' => [
                'cash_1010'        => $cash1010,
                'bank_1020'        => $bank1020,
                'total_balance'    => $totalBalance,
                'total_inflow_so'  => $totalInflowSo,
                'total_inflow_pos' => $totalInflowPos,
                'total_outflow_po' => $totalOutflowPo,
                'net_cash_flow'    => ($totalInflowSo + $totalInflowPos) - $totalOutflowPo,
            ],
            'inflows_so'   => $inflowSoList,
            'inflows_pos'  => $inflowPosList,
            'outflows_po'  => $outflowPoList,
            'ledger_lines' => $ledgerLines,
        ];
    }

    /**
     * 5. PIUTANG (AR): Menampilkan Sales Order yang sudah ada faktur,
     * PT apa yang membeli, berapa yang dibeli, produknya, diskonnya,
     * serta data penjualan kasir POS toko fisik.
     */
    public function getReceivablesDetails(): array
    {
        // 1. Sales Order B2B yang sudah ada Faktur (Customer Invoices)
        $invoices = CustomerInvoice::with(['customer', 'salesOrder.lines.product'])
            ->where('status', 'posted')
            ->orderByDesc('invoice_date')
            ->get();

        $invoicesList = [];
        $customersMap = [];
        $totalOpenAr = 0.0;
        $totalOverdueAr = 0.0;
        $totalInvoiced = 0.0;

        foreach ($invoices as $inv) {
            $grandTotal = (float) $inv->grand_total;
            $amountPaid = (float) $inv->amount_paid;
            $residual = (float) $inv->amount_residual;
            $isOverdue = $residual > 0 && $inv->due_date && $inv->due_date->isPast();

            $totalInvoiced += $grandTotal;
            $totalOpenAr += $residual;
            if ($isOverdue) {
                $totalOverdueAr += $residual;
            }

            $custId = $inv->customer_id;
            $custName = $inv->customer?->name ?? 'Pelanggan B2B';

            // Extract lines/items from Sales Order or Customer Invoice Lines
            $items = [];
            $totalQty = 0;
            if ($inv->salesOrder && $inv->salesOrder->lines) {
                foreach ($inv->salesOrder->lines as $line) {
                    $qty = (float) $line->qty_ordered;
                    $totalQty += $qty;
                    $items[] = [
                        'sku'          => $line->variant_sku,
                        'product_name' => $line->product?->name ?? $line->variant_sku,
                        'size'         => $line->product?->size ?? '-',
                        'color'        => $line->product?->color ?? '-',
                        'qty'          => $qty,
                        'unit_price'   => (float) $line->unit_price,
                        'discount_pct' => (float) $line->discount_pct,
                        'line_total'   => (float) $line->line_total,
                    ];
                }
            }

            // Customer aggregation
            if (!isset($customersMap[$custId])) {
                $customersMap[$custId] = [
                    'customer_id'     => $custId,
                    'customer_name'   => $custName,
                    'credit_limit'    => (float) ($inv->customer?->credit_limit ?? 0),
                    'payment_terms'   => $inv->customer?->payment_terms ?? $inv->payment_terms ?? 'NET14',
                    'total_invoiced'  => 0.0,
                    'total_paid'      => 0.0,
                    'total_residual'  => 0.0,
                    'overdue_residual'=> 0.0,
                    'invoices_count'  => 0,
                    'products'        => [],
                ];
            }
            $customersMap[$custId]['total_invoiced'] += $grandTotal;
            $customersMap[$custId]['total_paid'] += $amountPaid;
            $customersMap[$custId]['total_residual'] += $residual;
            if ($isOverdue) {
                $customersMap[$custId]['overdue_residual'] += $residual;
            }
            $customersMap[$custId]['invoices_count'] += 1;

            foreach ($items as $it) {
                $s = $it['sku'];
                if (!isset($customersMap[$custId]['products'][$s])) {
                    $customersMap[$custId]['products'][$s] = [
                        'sku'  => $s,
                        'name' => $it['product_name'],
                        'qty'  => 0,
                    ];
                }
                $customersMap[$custId]['products'][$s]['qty'] += $it['qty'];
            }

            $invoicesList[] = [
                'invoice_id'      => $inv->id,
                'sales_order_id'  => $inv->sales_order_id,
                'customer_id'     => $custId,
                'customer_name'   => $custName,
                'invoice_date'    => $inv->invoice_date?->format('d/m/Y') ?? '-',
                'due_date'        => $inv->due_date?->format('d/m/Y') ?? '-',
                'payment_terms'   => $inv->payment_terms ?? 'NET14',
                'grand_total'     => $grandTotal,
                'amount_paid'     => $amountPaid,
                'amount_residual' => $residual,
                'is_overdue'      => $isOverdue,
                'status'          => $residual <= 0 ? 'paid' : ($isOverdue ? 'overdue' : 'open'),
                'total_qty'       => $totalQty,
                'items'           => $items,
                'view_url'        => route('accounting.invoices.show', $inv->id),
                'so_view_url'     => $inv->sales_order_id ? route('sales.orders.show', $inv->sales_order_id) : null,
            ];
        }

        $customersList = array_values(array_map(function ($c) {
            $c['products'] = array_values($c['products']);
            return $c;
        }, $customersMap));
        usort($customersList, fn($a, $b) => $b['total_residual'] <=> $a['total_residual']);

        // 2. Penjualan dari POS (Toko Fisik / Tunai)
        $posOrders = PosOrder::with(['customer', 'lines.product', 'cashier'])
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->limit(50)
            ->get();

        $posList = [];
        $totalPosSales = 0.0;
        $totalPosItems = 0;

        foreach ($posOrders as $pos) {
            $amt = (float) $pos->grand_total;
            $totalPosSales += $amt;

            $items = [];
            $posQty = 0;
            foreach ($pos->lines as $line) {
                $q = (float) $line->qty;
                $posQty += $q;
                $totalPosItems += $q;
                $items[] = [
                    'sku'          => $line->variant_sku,
                    'product_name' => $line->product?->name ?? $line->variant_sku,
                    'size'         => $line->product?->size ?? '-',
                    'color'        => $line->product?->color ?? '-',
                    'qty'          => $q,
                    'unit_price'   => (float) $line->unit_price,
                    'line_total'   => (float) $line->line_total,
                ];
            }

            $posList[] = [
                'order_id'       => $pos->id,
                'session_id'     => $pos->pos_session_id,
                'date'           => $pos->paid_at?->format('d/m/Y H:i') ?? '-',
                'customer_name'  => $pos->customer?->name ?? 'Pelanggan Toko Fisik',
                'cashier_name'   => $pos->cashier?->name ?? 'Kasir',
                'payment_method' => strtoupper($pos->payment_method),
                'grand_total'    => $amt,
                'cash_tendered'  => (float) $pos->cash_tendered,
                'change_given'   => (float) $pos->change_given,
                'total_qty'      => $posQty,
                'payment_status' => 'Lunas Langsung (Tunai/QRIS)',
                'items'          => $items,
                'view_url'       => route('pos.orders.show', $pos->id),
            ];
        }

        return [
            'kpis' => [
                'total_open_ar'          => $totalOpenAr,
                'total_overdue_ar'       => $totalOverdueAr,
                'total_invoiced_b2b'     => $totalInvoiced,
                'total_pos_sales'        => $totalPosSales,
                'total_pos_items'        => (int) $totalPosItems,
                'customers_with_ar_count'=> count(array_filter($customersList, fn($c) => $c['total_residual'] > 0)),
            ],
            'customers' => $customersList,
            'invoices'  => $invoicesList,
            'pos_orders'=> $posList,
        ];
    }

    /**
     * 6. UTANG (AP): Menampilkan PO apa saja yang belum dibayar, dari PT apa saja,
     * serta rincian utang kita ke masing-masing PT vendor.
     */
    public function getPayablesDetails(): array
    {
        // 1. Tagihan Vendor (Vendor Bills) berdasarkan PO yang berstatus posted
        $bills = VendorBill::with(['vendor', 'purchaseOrder.lines.product', 'receipt'])
            ->where('status', 'posted')
            ->orderByDesc('bill_date')
            ->get();

        $billsList = [];
        $vendorsMap = [];
        $totalOpenAp = 0.0;
        $totalOverdueAp = 0.0;
        $totalBilled = 0.0;

        foreach ($bills as $bill) {
            $grandTotal = (float) $bill->grand_total;
            $amountPaid = (float) $bill->amount_paid;
            $residual = (float) $bill->amount_residual;
            $isOverdue = $residual > 0 && $bill->due_date && $bill->due_date->isPast();

            $totalBilled += $grandTotal;
            $totalOpenAp += $residual;
            if ($isOverdue) {
                $totalOverdueAp += $residual;
            }

            $vendorId = $bill->vendor_id;
            $vendorName = $bill->vendor?->name ?? 'Vendor';

            // Items from purchase order
            $items = [];
            $totalQty = 0;
            if ($bill->purchaseOrder && $bill->purchaseOrder->lines) {
                foreach ($bill->purchaseOrder->lines as $line) {
                    $qty = (float) $line->qty_ordered;
                    $totalQty += $qty;
                    $items[] = [
                        'sku'          => $line->variant_sku,
                        'product_name' => $line->product?->name ?? $line->variant_sku,
                        'size'         => $line->product?->size ?? '-',
                        'color'        => $line->product?->color ?? '-',
                        'qty'          => $qty,
                        'unit_price'   => (float) $line->unit_price,
                        'line_total'   => (float) $line->line_total,
                    ];
                }
            }

            // Vendor aggregation (Berapa kita berutang ke masing-masing PT)
            if (!isset($vendorsMap[$vendorId])) {
                $vendorsMap[$vendorId] = [
                    'vendor_id'       => $vendorId,
                    'vendor_name'     => $vendorName,
                    'city'            => $bill->vendor?->city ?? 'Indonesia',
                    'payment_terms'   => $bill->vendor?->payment_terms ?? $bill->payment_terms ?? 'NET30',
                    'total_billed'    => 0.0,
                    'total_paid'      => 0.0,
                    'total_residual'  => 0.0,
                    'overdue_residual'=> 0.0,
                    'bills_count'     => 0,
                    'unpaid_bills'    => 0,
                    'purchase_orders' => [],
                    'products'        => [],
                ];
            }
            $vendorsMap[$vendorId]['total_billed'] += $grandTotal;
            $vendorsMap[$vendorId]['total_paid'] += $amountPaid;
            $vendorsMap[$vendorId]['total_residual'] += $residual;
            if ($isOverdue) {
                $vendorsMap[$vendorId]['overdue_residual'] += $residual;
            }
            $vendorsMap[$vendorId]['bills_count'] += 1;
            if ($residual > 0) {
                $vendorsMap[$vendorId]['unpaid_bills'] += 1;
            }
            if ($bill->purchase_order_id && !in_array($bill->purchase_order_id, $vendorsMap[$vendorId]['purchase_orders'])) {
                $vendorsMap[$vendorId]['purchase_orders'][] = $bill->purchase_order_id;
            }

            foreach ($items as $it) {
                $s = $it['sku'];
                if (!isset($vendorsMap[$vendorId]['products'][$s])) {
                    $vendorsMap[$vendorId]['products'][$s] = [
                        'sku'  => $s,
                        'name' => $it['product_name'],
                        'qty'  => 0,
                    ];
                }
                $vendorsMap[$vendorId]['products'][$s]['qty'] += $it['qty'];
            }

            $billsList[] = [
                'bill_id'          => $bill->id,
                'purchase_order_id'=> $bill->purchase_order_id,
                'receipt_id'       => $bill->receipt_id,
                'vendor_id'        => $vendorId,
                'vendor_name'      => $vendorName,
                'bill_date'        => $bill->bill_date?->format('d/m/Y') ?? '-',
                'due_date'         => $bill->due_date?->format('d/m/Y') ?? '-',
                'payment_terms'    => $bill->payment_terms ?? 'NET30',
                'grand_total'      => $grandTotal,
                'amount_paid'      => $amountPaid,
                'amount_residual'  => $residual,
                'is_overdue'       => $isOverdue,
                'status'           => $residual <= 0 ? 'paid' : ($isOverdue ? 'overdue' : 'open'),
                'total_qty'        => $totalQty,
                'items'            => $items,
                'view_url'         => route('accounting.bills.show', $bill->id),
                'po_view_url'      => $bill->purchase_order_id ? route('purchase.orders.show', $bill->purchase_order_id) : null,
            ];
        }

        $vendorsList = array_values(array_map(function ($v) {
            $v['products'] = array_values($v['products']);
            return $v;
        }, $vendorsMap));
        usort($vendorsList, fn($a, $b) => $b['total_residual'] <=> $a['total_residual']);

        return [
            'kpis' => [
                'total_open_ap'          => $totalOpenAp,
                'total_overdue_ap'       => $totalOverdueAp,
                'total_billed'           => $totalBilled,
                'vendors_with_ap_count'  => count(array_filter($vendorsList, fn($v) => $v['total_residual'] > 0)),
                'unpaid_bills_count'     => count(array_filter($billsList, fn($b) => $b['amount_residual'] > 0)),
            ],
            'vendors' => $vendorsList,
            'bills'   => $billsList,
        ];
    }
}

