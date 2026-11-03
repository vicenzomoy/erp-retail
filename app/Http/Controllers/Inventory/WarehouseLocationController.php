<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Master\WarehouseLocation;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseLocationController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display list of warehouses & locations with total stock & valuation.
     */
    public function index(Request $request): Response
    {
        $locations = WarehouseLocation::all()->map(function ($loc) {
            $val = (float) $this->stockService->getValuation(null, $loc->location_code);
            return [
                'location_code' => $loc->location_code,
                'location_name' => $loc->location_name,
                'type' => $loc->type,
                'city' => $loc->city,
                'valuation' => $val,
            ];
        });

        return Inertia::render('Inventory/Configuration/Locations', [
            'locations' => $locations,
        ]);
    }
}

