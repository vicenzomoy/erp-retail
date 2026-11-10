<?php

namespace App\Services\Owner;

use App\Models\CustomerInvoice;
use App\Models\JournalLine;
use App\Models\Master\ContactCustomer;
use App\Models\Master\ContactVendor;
use App\Models\Master\Product;
use App\Models\PosOrder;
use App\Models\PosOrderLine;
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
}

