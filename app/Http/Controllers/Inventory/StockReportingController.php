<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\SalesOrder;
use App\Models\StockLedger;
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
     * Stock Moves / Stock Ledger History Report.
     */
    public function stockMoves(Request $request): Response
    {
        $sku = $request->query('sku', 'all');
        $location = $request->query('location', 'all');
        $moveType = $request->query('move_type', 'all');

        $query = StockLedger::with(['product', 'location', 'movedBy'])
            ->orderBy('id', 'desc');

        if ($sku !== 'all') {
            $query->where('variant_sku', $sku);
        }

        if ($location !== 'all') {
            $query->where('location_code', $location);
        }

        if ($moveType !== 'all') {
            $query->where('move_type', $moveType);
        }

        $moves = $query->paginate(20)->through(function ($m) {
            return [
                'id' => $m->id,
                'created_at' => $m->created_at?->format('d/m/Y H:i'),
                'variant_sku' => $m->variant_sku,
                'product_name' => $m->product?->name ?? $m->variant_sku,
                'location_code' => $m->location_code,
                'move_type' => $m->move_type,
                'qty_change' => (float) $m->qty_change,
                'qty_on_hand_after' => (float) $m->qty_on_hand_after,
                'unit_cost' => (float) $m->unit_cost,
                'total_value_change' => (float) $m->total_value_change,
                'source_document_type' => $m->source_document_type,
                'source_document_id' => $m->source_document_id,
                'moved_by_name' => $m->movedBy?->name ?? 'System',
            ];
        });

        $products = Product::all();
        $locations = WarehouseLocation::all();

        return Inertia::render('Inventory/Reporting/StockMoves', [
            'moves' => $moves,
            'filters' => [
                'sku' => $sku,
                'location' => $location,
                'move_type' => $moveType,
            ],
            'products' => $products,
            'locations' => $locations,
        ]);
    }
}

