<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesOverviewController extends Controller
{
    /**
     * Sales Overview Dashboard — Odoo-style KPI cards.
     */
    public function index(): Response
    {
        // Aggregate counts in a single query for efficiency
        $counts = DB::table('sales_orders')
            ->selectRaw("
                COUNT(*) AS total_orders,
                SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END) AS draft_orders,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders,
                SUM(CASE WHEN status = 'done'      THEN 1 ELSE 0 END) AS done_orders,
                SUM(CASE WHEN credit_hold IS TRUE THEN 1 ELSE 0 END) AS credit_hold_orders,
                SUM(CASE WHEN status = 'confirmed' THEN grand_total ELSE 0 END) AS total_confirmed_value
            ")
            ->first();

        $recentOrders = SalesOrder::with('customer')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($so) => [
                'id'          => $so->id,
                'customer'    => $so->customer?->name,
                'status'      => $so->status,
                'grand_total' => (string) $so->grand_total,
                'created_at'  => $so->created_at?->toIso8601String(),
                'credit_hold' => $so->credit_hold,
            ]);

        return Inertia::render('Sales/Overview', [
            'kpis' => [
                'total_orders'          => (int) $counts->total_orders,
                'draft_orders'          => (int) $counts->draft_orders,
                'confirmed_orders'      => (int) $counts->confirmed_orders,
                'done_orders'           => (int) $counts->done_orders,
                'credit_hold_orders'    => (int) $counts->credit_hold_orders,
                'total_confirmed_value' => (string) ($counts->total_confirmed_value ?? '0'),
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
