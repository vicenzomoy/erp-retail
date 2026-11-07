<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Services\Purchase\PurchaseProductService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseProductController extends Controller
{
    public function __construct(
        protected PurchaseProductService $service
    ) {}

    /**
     * Display procurement product list with vendor, purchase cost, min order, and stock.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search'       => $request->query('search', ''),
            'vendor_id'    => $request->query('vendor_id', 'all'),
            'stock_status' => $request->query('stock_status', 'all'),
            'color'        => $request->query('color', 'all'),
            'size'         => $request->query('size', 'all'),
        ];

        $products = $this->service->getProductsForProcurement($filters);
        $kpis = $this->service->getProcurementKPIs();
        $filterOptions = $this->service->getFilterOptions();
        $locationData = $this->service->getStockByLocationData();

        return Inertia::render('Purchase/Products/Index', [
            'products'      => $products,
            'filters'       => $filters,
            'kpis'          => $kpis,
            'vendors'       => $filterOptions['vendors'],
            'colors'        => $filterOptions['colors'],
            'sizes'         => $filterOptions['sizes'],
            // Stock by location data for toggle view without page reload
            'matrix'        => $locationData['matrix'],
            'locations'     => $locationData['locations'],
            'stockSummary'  => $locationData['summary'],
        ]);
    }
}

