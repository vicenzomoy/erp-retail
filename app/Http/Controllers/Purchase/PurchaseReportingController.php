<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Master\ContactVendor;
use App\Models\Master\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseReportingController extends Controller
{
    public function index(Request $request): Response
    {
        $vendorBreakdown = DB::table('purchase_orders')
            ->join('contacts_vendors', 'purchase_orders.vendor_id', '=', 'contacts_vendors.id')
            ->whereIn('purchase_orders.status', ['confirmed', 'done'])
            ->groupBy('contacts_vendors.id', 'contacts_vendors.name', 'contacts_vendors.city')
            ->select(
                'contacts_vendors.id',
                'contacts_vendors.name',
                'contacts_vendors.city',
                DB::raw('COUNT(purchase_orders.id) as orders_count'),
                DB::raw('SUM(purchase_orders.subtotal_before_tax) as total_dpp'),
                DB::raw('SUM(purchase_orders.total_tax) as total_tax'),
                DB::raw('SUM(purchase_orders.grand_total) as grand_total')
            )
            ->orderByDesc('grand_total')
            ->get();

        $productBreakdown = DB::table('purchase_order_lines')
            ->join('purchase_orders', 'purchase_order_lines.purchase_order_id', '=', 'purchase_orders.id')
            ->join('products', 'purchase_order_lines.variant_sku', '=', 'products.variant_sku')
            ->whereIn('purchase_orders.status', ['confirmed', 'done'])
            ->groupBy('products.variant_sku', 'products.name', 'products.size', 'products.color', 'products.unit')
            ->select(
                'products.variant_sku',
                'products.name',
                'products.size',
                'products.color',
                'products.unit',
                DB::raw('SUM(purchase_order_lines.qty_ordered) as total_ordered'),
                DB::raw('SUM(purchase_order_lines.qty_received) as total_received'),
                DB::raw('SUM(purchase_order_lines.qty_billed) as total_billed'),
                DB::raw('SUM(purchase_order_lines.line_total) as total_value')
            )
            ->orderByDesc('total_value')
            ->get();

        $statusSummary = [
            'rfq' => PurchaseOrder::where('status', 'rfq')->count(),
            'confirmed' => PurchaseOrder::where('status', 'confirmed')->count(),
            'done' => PurchaseOrder::where('status', 'done')->count(),
            'cancelled' => PurchaseOrder::where('status', 'cancelled')->count(),
        ];

        $totals = [
            'total_po_value' => (float) PurchaseOrder::whereIn('status', ['confirmed', 'done'])->sum('grand_total'),
            'total_po_count' => PurchaseOrder::whereIn('status', ['confirmed', 'done'])->count(),
            'total_ordered_qty' => (float) PurchaseOrderLine::whereHas('purchaseOrder', fn ($q) => $q->whereIn('status', ['confirmed', 'done']))->sum('qty_ordered'),
            'total_received_qty' => (float) PurchaseOrderLine::whereHas('purchaseOrder', fn ($q) => $q->whereIn('status', ['confirmed', 'done']))->sum('qty_received'),
        ];

        return Inertia::render('Purchase/Reporting/Index', [
            'vendorBreakdown' => $vendorBreakdown,
            'productBreakdown' => $productBreakdown,
            'statusSummary' => $statusSummary,
            'totals' => $totals,
        ]);
    }
}

