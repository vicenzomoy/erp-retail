<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Services\Accounting\FinancialReportService;
use App\Services\Accounting\GeneralLedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /**
     * 7. Bayar PPN Keluaran ke Negara.
     *    Jurnal: Dr 2200 (PPN Keluaran) / Cr 1020 (Bank)
     *    Idempoten: cek entry_no unik per tanggal + amount sebelum insert.
     */
    public function payOutputVat(Request $request): RedirectResponse
    {
        $request->validate([
            'amount'       => 'required|numeric|min:1',
            'payment_date' => 'required|date',
            'notes'        => 'nullable|string|max:500',
        ]);

        $actor = auth()->user();

        DB::transaction(function () use ($request, $actor) {
            $seq = str_pad(
                JournalEntry::where('entry_type', 'tax_payment')->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );
            $entryNo = 'TAX/' . now()->format('Y/m') . '/' . $seq;

            // Idempotency guard: jika entry_no sudah ada, skip
            if (JournalEntry::where('entry_no', $entryNo)->exists()) {
                return;
            }

            $je = JournalEntry::create([
                'entry_no'             => $entryNo,
                'entry_type'           => 'tax_payment',
                'source_document_type' => 'tax_payment',
                'source_document_id'   => $entryNo,
                'entry_date'           => $request->payment_date,
                'description'          => 'Pembayaran PPN Keluaran ke Negara'
                    . ($request->notes ? ' — ' . $request->notes : ''),
                'status'               => 'posted',
                'is_balanced'          => true,
                'total_debit'          => $request->amount,
                'total_credit'         => $request->amount,
                'posted_at'            => now(),
                'posted_by'            => $actor->id,
                'created_by'           => $actor->id,
            ]);

            // Dr 2200 — mengurangi kewajiban PPN Keluaran
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '2200',
                'description'      => 'Pelunasan PPN Keluaran ke Kas Negara — ' . $entryNo,
                'debit'            => $request->amount,
                'credit'           => 0.00,
                'created_at'       => now(),
            ]);

            // Cr 1020 — uang keluar dari Bank ke pemerintah
            JournalLine::create([
                'journal_entry_id' => $je->id,
                'account_code'     => '1020',
                'description'      => 'Pembayaran PPN ke Negara — ' . $entryNo,
                'debit'            => 0.00,
                'credit'           => $request->amount,
                'created_at'       => now(),
            ]);

            AuditLog::record(
                action: 'PAY_OUTPUT_VAT',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id,
                documentType: 'tax_payment',
                documentId: $entryNo,
                newValue: ['amount' => $request->amount, 'entry_no' => $entryNo, 'date' => $request->payment_date],
            );
        });

        return redirect()->route('accounting.reports.tax')
            ->with('success', 'Pembayaran PPN Keluaran ke negara berhasil dicatat.');
    }
}

