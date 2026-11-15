<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Services\Analytics\SalesAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseSalesAnalysisController extends Controller
{
    public const HORIZONS = [30, 60, 90];

    public function __construct(
        protected SalesAnalyticsService $analytics
    ) {}

    /**
     * Analisis penjualan 12 bulan + rekomendasi restock (dasar pembuatan RFQ).
     */
    public function index(Request $request): Response
    {
        $horizon = (int) $request->query('horizon', 60);
        if (! in_array($horizon, self::HORIZONS, true)) {
            $horizon = 60;
        }

        return Inertia::render('Purchase/SalesAnalysis/Index', [
            'analysis' => $this->analytics->getAnalysis($horizon),
            'horizons' => self::HORIZONS,
            'tab' => in_array($request->query('tab'), ['restock', 'season', 'products'], true)
                ? $request->query('tab')
                : 'restock',
        ]);
    }
}
