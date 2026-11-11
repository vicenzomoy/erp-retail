<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Services\Owner\OwnerDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDashboardController extends Controller
{
    public function __construct(
        private readonly OwnerDashboardService $dashboardService,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Owner/Dashboard', [
            'kpis'              => $this->dashboardService->getExecutiveKpis(),
            'pendingApprovals'  => $this->dashboardService->getPendingDiscountApprovals(),
            'channels'          => $this->dashboardService->getSalesChannelBreakdown(),
            'topProducts'       => $this->dashboardService->getTopProducts(5),
            'salesTeam'         => $this->dashboardService->getSalesTeamPerformance(),
        ]);
    }

    public function omsetToday(Request $request): Response
    {
        return Inertia::render('Owner/Reports/OmsetToday', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getOmsetTodayDetails(),
        ]);
    }

    public function omsetMonth(Request $request): Response
    {
        $selectedMonth = $request->query('month');

        return Inertia::render('Owner/Reports/OmsetMonth', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getOmsetMonthDetails($selectedMonth),
        ]);
    }

    public function grossProfit(Request $request): Response
    {
        $period = $request->query('period', 'mtd');

        return Inertia::render('Owner/Reports/GrossProfit', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getGrossProfitDetails($period),
        ]);
    }

    public function cashBank(Request $request): Response
    {
        return Inertia::render('Owner/Reports/CashBank', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getCashBankDetails(),
        ]);
    }

    public function receivables(Request $request): Response
    {
        return Inertia::render('Owner/Reports/Receivables', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getReceivablesDetails(),
        ]);
    }

    public function payables(Request $request): Response
    {
        return Inertia::render('Owner/Reports/Payables', [
            'kpiSummary' => $this->dashboardService->getExecutiveKpis(),
            'report'     => $this->dashboardService->getPayablesDetails(),
        ]);
    }
}

