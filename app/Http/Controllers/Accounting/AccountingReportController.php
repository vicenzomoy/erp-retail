<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\FinancialReportService;
use App\Services\Accounting\GeneralLedgerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller Menu Laporan (Reporting) Modul Accounting:
 * 1. Neraca Keuangan (Balance Sheet)
 * 2. Laba dan Rugi (Profit & Loss)
 * 3. Arus Kas (Cash Flow Statement)
 * 4. Neraca Saldo (Trial Balance)
 * 5. Buku Besar Umum (General Ledger)
 * 6. Laporan Pajak (Tax Report)
 */
class AccountingReportController extends Controller
{
    public function __construct(
        protected FinancialReportService $reportService,
        protected GeneralLedgerService $glService
    ) {}

    /**
     * 1. Laporan Neraca Keuangan (Balance Sheet).
     */
    public function balanceSheet(): Response
    {
        return Inertia::render('Accounting/Reports/BalanceSheet', [
            'report' => $this->reportService->getBalanceSheet(),
        ]);
    }

    /**
     * 2. Laporan Laba dan Rugi (Profit & Loss).
     */
    public function profitLoss(): Response
    {
        return Inertia::render('Accounting/Reports/ProfitLoss', [
            'report' => $this->reportService->getProfitAndLoss(),
        ]);
    }

    /**
     * 3. Laporan Arus Kas (Cash Flow Statement).
     */
    public function cashFlow(): Response
    {
        return Inertia::render('Accounting/Reports/CashFlow', [
            'report' => $this->reportService->getCashFlow(),
        ]);
    }

    /**
     * 4. Laporan Neraca Saldo (Trial Balance).
     */
    public function trialBalance(): Response
    {
        return Inertia::render('Accounting/Reports/TrialBalance', [
            'report' => $this->reportService->getTrialBalance(),
        ]);
    }

    /**
     * 5. Buku Besar Umum (General Ledger).
     */
    public function generalLedger(Request $request): Response
    {
        $accountCode = $request->query('account', 'all');
        $entryType   = $request->query('entry_type', 'all');

        $data = $this->glService->getAccountLedger($accountCode, $entryType);

        return Inertia::render('Accounting/GeneralLedger/Index', [
            'summary'         => $data['summary'],
            'selectedAccount' => $data['selected_account'],
            'ledgerRows'      => $data['ledger_rows'],
            'stockMoves'      => $data['stock_moves'],
            'filters'         => [
                'account'    => $accountCode,
                'entry_type' => $entryType,
            ],
        ]);
    }

    /**
     * 6. Laporan Pajak (Tax Report — PPN Keluaran vs PPN Masukan).
     */
    public function taxReport(): Response
    {
        return Inertia::render('Accounting/Reports/TaxReport', [
            'report' => $this->reportService->getTaxReport(),
        ]);
    }
}

