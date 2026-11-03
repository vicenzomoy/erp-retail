<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockMove;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryOverviewController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display the inventory overview dashboard (Odoo Kanban cards).
     */
    public function index(Request $request): Response
    {
        $kpis = $this->stockService->getInventoryKPIs();

        $recentMoves = StockMove::with(['product', 'fromLocation', 'toLocation'])
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'reference' => $m->source_document_id,
                    'type' => $m->source_document_type,
                    'sku' => $m->variant_sku,
                    'product_name' => $m->product?->name ?? $m->variant_sku,
                    'from' => $m->location_from,
                    'to' => $m->location_to,
                    'qty' => (float) $m->qty_done,
                    'unit_cost' => (float) $m->unit_cost,
                    'total_value' => (float) $m->total_value,
                    'date' => $m->done_at?->format('d M Y H:i') ?? $m->created_at?->format('d M Y H:i'),
                ];
            });

        return Inertia::render('Inventory/Overview', [
            'kpis' => $kpis,
            'recentMoves' => $recentMoves,
        ]);
    }
}

