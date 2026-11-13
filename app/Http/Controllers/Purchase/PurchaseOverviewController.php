<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Master\ContactVendor;
use App\Models\PurchaseOrder;
use App\Services\Purchase\PurchaseOrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOverviewController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service
    ) {}

    public function index(Request $request): Response
    {
        $kpis = $this->service->getKpis();

        $recentOrders = PurchaseOrder::with(['vendor', 'lines'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'source_doc_no' => $po->source_doc_no,
                'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                'vendor_city' => $po->vendor?->city,
                'status' => $po->status,
                'grand_total' => (float) $po->grand_total,
                'created_at' => $po->created_at?->format('d/m/Y H:i'),
                'total_ordered' => (float) $po->lines->sum('qty_ordered'),
                'total_received' => (float) $po->lines->sum('qty_received'),
            ]);

        $topVendors = ContactVendor::withCount('purchaseOrders')
            ->withSum('purchaseOrders', 'grand_total')
            ->get()
            ->map(fn (ContactVendor $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'city' => $v->city,
                'payment_terms' => $v->payment_terms,
                'orders_count' => (int) $v->purchase_orders_count,
                'total_spent' => (float) ($v->purchase_orders_sum_grand_total ?? 0),
            ])
            ->sortBy([
                ['total_spent', 'desc'],
                ['orders_count', 'desc'],
            ])
            ->take(5)
            ->values();

        return Inertia::render('Purchase/Overview', [
            'kpis' => $kpis,
            'recentOrders' => $recentOrders,
            'topVendors' => $topVendors,
        ]);
    }
}

