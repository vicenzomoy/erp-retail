<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\SalesOrder;
use App\Models\StockMove;
use App\Services\Inventory\StockReservationService;
use App\Services\Inventory\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockReportingController extends Controller
{
    protected StockService $stockService;
    protected StockReservationService $reservationService;

    public function __construct(StockService $stockService, StockReservationService $reservationService)
    {
        $this->stockService = $stockService;
        $this->reservationService = $reservationService;
    }

    /**
     * Stock Forecast Report & ATP monitoring (F-08 / T-13, T-14).
     */
    public function stockForecast(Request $request): Response
    {
        $location = $request->query('location', 'WH-PKU');
        $report = $this->stockService->getStockForecastReport($location === 'all' ? null : $location);
        $locations = WarehouseLocation::all();
        $salesOrders = SalesOrder::where('status', 'confirmed')->with('lines.product', 'customer')->get();

        return Inertia::render('Inventory/Reporting/StockForecast', [
            'report' => $report,
            'selectedLocation' => $location,
            'locations' => $locations,
            'salesOrders' => $salesOrders->map(fn ($s) => [
                'id' => $s->id,
                'customer' => $s->customer?->name,
                'lines' => $s->lines->map(fn ($l) => [
                    'id' => $l->id,
                    'sku' => $l->variant_sku,
                    'product_name' => $l->product?->name,
                    'qty_ordered' => (float) $l->qty_ordered,
                    'qty_delivered' => (float) $l->qty_delivered,
                ]),
            ]),
        ]);
    }

    /**
     * Reserve Stock API / Form Submission (T-13, T-14).
     */
    public function reserveStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'so_line_id' => 'required|integer',
            'variant_sku' => 'required|exists:products,variant_sku',
            'location_code' => 'required|exists:warehouses_locations,location_code',
            'qty_reserved' => 'required|numeric|min:0.001',
        ]);

        $this->reservationService->reserveStock(
            salesOrderId: $validated['sales_order_id'],
            soLineId: $validated['so_line_id'],
            sku: $validated['variant_sku'],
            locationCode: $validated['location_code'],
            qty: $validated['qty_reserved'],
            actor: $request->user()
        );

        return redirect()->back()
            ->with('success', "Reservasi {$validated['qty_reserved']} unit {$validated['variant_sku']} di {$validated['location_code']} berhasil dibuat.");
    }

    /**
     * Release reservation.
     */
    public function releaseReservation(Request $request, int $id): RedirectResponse
    {
        $this->reservationService->releaseReservation($id, $request->user());

        return redirect()->back()->with('success', 'Reservasi berhasil dibatalkan / dilepas.');
    }

    /**
     * Stock Moves History — Odoo-style (F-20).
     * Shows all stock movements: Referensi, Produk, Dari, Ke, Qty, Status.
     */
    public function stockMoves(Request $request): Response
    {
        $sku        = $request->query('sku', 'all');
        $status     = $request->query('status', 'all');
        $docType    = $request->query('doc_type', 'all');
        $dateFrom   = $request->query('date_from');
        $dateTo     = $request->query('date_to');

        $query = StockMove::with(['product', 'fromLocation', 'toLocation', 'doneBy'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        if ($sku !== 'all') {
            $query->where('variant_sku', $sku);
        }

        if ($status !== 'all') {
            $query->where('state', $status);
        }

        if ($docType !== 'all') {
            $query->where('source_document_type', $docType);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $moves = $query->paginate(50)->through(function ($m) {
            return [
                'id'                   => $m->id,
                'date'                 => $m->done_at?->format('d/m/Y H:i')
                                          ?? $m->created_at?->format('d/m/Y H:i'),
                'reference'            => $m->source_document_id,
                'doc_type'             => $m->source_document_type,
                'variant_sku'          => $m->variant_sku,
                'product_name'         => $m->product?->name ?? $m->variant_sku,
                'location_from'        => $m->location_from ?? '—',
                'location_from_name'   => $m->fromLocation?->location_name ?? $m->location_from ?? '—',
                'location_to'          => $m->location_to ?? '—',
                'location_to_name'     => $m->toLocation?->location_name ?? $m->location_to ?? '—',
                'qty_done'             => (float) $m->qty_done,
                'state'                => $m->state,
                'done_by_name'         => $m->doneBy?->name ?? 'System',
            ];
        });

        $products  = Product::orderBy('name')->get(['variant_sku', 'name']);
        $locations = WarehouseLocation::orderBy('location_code')->get(['location_code', 'location_name']);

        return Inertia::render('Inventory/Reporting/StockMoves', [
            'moves'   => $moves,
            'filters' => [
                'sku'       => $sku,
                'status'    => $status,
                'doc_type'  => $docType,
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
            'products'  => $products,
            'locations' => $locations,
        ]);
    }
}

