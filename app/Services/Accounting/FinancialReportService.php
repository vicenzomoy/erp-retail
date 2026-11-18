<?php

namespace App\Services\Accounting;

use App\Models\CreditNote;
use App\Models\CustomerInvoice;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\VendorBill;
use App\Support\ReportPeriod;
use Illuminate\Support\Facades\DB;

/**
 * Layanan Laporan Keuangan Terpadu Modul Accounting (Odoo 17 Standard):
 * 1. Neraca Keuangan (Balance Sheet)
 * 2. Laba dan Rugi (Profit & Loss)
 * 3. Arus Kas (Cash Flow Statement)
 * 4. Neraca Saldo (Trial Balance)
 * 5. Buku Besar Umum (General Ledger)
 * 6. Laporan Pajak (Tax Report — PPN Keluaran vs PPN Masukan)
 */
class FinancialReportService
{
    public function __construct(
        protected GeneralLedgerService $glService
    ) {}

    /**
     * 1. Laporan Neraca Keuangan (Balance Sheet).
     */
    public function getBalanceSheet(ReportPeriod $period): array
    {
        // Neraca = posisi per akhir periode (kumulatif s/d tanggal akhir)
        $summary  = $this->glService->getAccountsSummary(null, $period->endDate());
        $accounts = collect($summary['accounts']);

        $assets = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'aset'))
            ->values()
            ->all();

        $liabilities = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'liabilitas'))
            ->values()
            ->all();

        $equityAccounts = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'ekuitas'))
            ->values()
            ->all();

        $revenues = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'pendapatan'));
        $expenses = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'beban'));

        $totalRevenue  = (float) $revenues->sum('balance');
        $totalExpense  = (float) $expenses->sum('balance');
        $allTimeProfit = round($totalRevenue - $totalExpense, 2);

        // Laba tahun berjalan = 1 Jan tahun periode s/d akhir periode; sisanya laba ditahan tahun lalu.
        // Bila ada jurnal penutup sistem lama sebelum akhir periode, hitung laba mulai sesudahnya
        // (saldo sebelum penutupan sudah dipindahkan ke Saldo Awal go-live).
        $profitFrom  = $period->year . '-01-01';
        $lastClosing = JournalEntry::where('status', 'posted')
            ->whereIn('entry_type', GeneralLedgerService::CLOSING_TYPES)
            ->where('entry_date', '<=', $period->endDate())
            ->max('entry_date');
        if ($lastClosing) {
            $afterClosing = \Carbon\Carbon::parse($lastClosing)->addDay()->toDateString();
            $profitFrom   = max($profitFrom, $afterClosing);
        }

        $yearAccounts = collect($this->glService->getAccountsSummary(
            $profitFrom,
            $period->endDate()
        )['accounts']);
        $currentYearProfit = round(
            (float) $yearAccounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'pendapatan'))->sum('balance')
            - (float) $yearAccounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'beban'))->sum('balance'),
            2
        );
        $retainedEarnings = round($allTimeProfit - $currentYearProfit, 2);

        $totalAssets      = round((float) collect($assets)->sum('balance'), 2);
        $totalLiabilities = round((float) collect($liabilities)->sum('balance'), 2);
        $baseEquity       = round((float) collect($equityAccounts)->sum('balance'), 2);
        $totalEquity      = round($baseEquity + $retainedEarnings + $currentYearProfit, 2);
        $totalLiabEquity  = round($totalLiabilities + $totalEquity, 2);

        return [
            'as_of_date'          => $period->endLabel(),
            'assets'              => $assets,
            'liabilities'         => $liabilities,
            'equity_accounts'     => $equityAccounts,
            'current_year_profit' => $currentYearProfit,
            'retained_earnings'   => $retainedEarnings,
            'total_assets'        => $totalAssets,
            'total_liabilities'   => $totalLiabilities,
            'base_equity'         => $baseEquity,
            'total_equity'        => $totalEquity,
            'total_liab_equity'   => $totalLiabEquity,
            'is_balanced'         => abs($totalAssets - $totalLiabEquity) < 1,
        ];
    }

    /**
     * 2. Laporan Laba dan Rugi (Profit & Loss / Income Statement).
     */
    public function getProfitAndLoss(ReportPeriod $period): array
    {
        // Jurnal penutup sistem lama bukan transaksi laba rugi → dikecualikan
        $summary  = $this->glService->getAccountsSummary($period->startDate(), $period->endDate(), excludeClosing: true);
        $accounts = collect($summary['accounts']);

        $revenues = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'pendapatan'))
            ->values();

        $expenses = $accounts->filter(fn ($a) => str_contains(strtolower($a['account_type']), 'beban'))
            ->values();

        $totalRevenue = round((float) $revenues->sum('balance'), 2);
        $totalExpense = round((float) $expenses->sum('balance'), 2);
        $netProfit    = round($totalRevenue - $totalExpense, 2);
        $marginPct    = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0.0;

        $revenueItems = $revenues->map(fn ($r) => array_merge($r, [
            'share_pct' => $totalRevenue > 0 ? round(($r['balance'] / $totalRevenue) * 100, 1) : 0.0,
        ]))->all();

        $expenseItems = $expenses->map(fn ($e) => array_merge($e, [
            'pct_of_revenue' => $totalRevenue > 0 ? round(($e['balance'] / $totalRevenue) * 100, 1) : 0.0,
        ]))->all();

        // Rincian mutasi jurnal pendapatan & beban terbaru
        $recentLines = JournalLine::with(['journalEntry', 'account'])
            ->whereIn('account_code', ['4000', '4010', '5000', '5100'])
            ->whereHas('journalEntry', fn ($q) => $q->where('status', 'posted')
                ->whereNotIn('entry_type', GeneralLedgerService::CLOSING_TYPES)
                ->whereBetween('entry_date', [$period->startDate(), $period->endDate()]))
            ->orderByDesc('id')
            ->limit(25)
            ->get()
            ->map(function (JournalLine $line) {
                $je = $line->journalEntry;
                return [
                    'id'                   => $line->id,
                    'journal_entry_id'     => $je->id,
                    'entry_no'             => $je->entry_no,
                    'entry_date'           => $je->entry_date?->format('d/m/Y'),
                    'source_document_type' => $je->source_document_type,
                    'source_document_id'   => $je->source_document_id,
                    'source_url'           => $this->glService->resolveSourceUrl($je->source_document_type, $je->source_document_id),
                    'account_code'         => $line->account_code,
                    'account_name'         => $line->account?->account_name ?? $line->account_code,
                    'description'          => $line->description ?: $je->description,
                    'debit'                => (float) $line->debit,
                    'credit'               => (float) $line->credit,
                ];
            })
            ->all();

        return [
            'period_label'  => $period->rangeLabel(),
            'revenues'      => $revenueItems,
            'expenses'      => $expenseItems,
            'total_revenue' => $totalRevenue,
            'total_expense' => $totalExpense,
            'gross_profit'  => $netProfit,
            'net_profit'    => $netProfit,
            'margin_pct'    => $marginPct,
            'recent_lines'  => $recentLines,
        ];
    }

    /**
     * 3. Laporan Arus Kas (Cash Flow Statement — Akun 1010 Kas & 1020 Bank).
     */
    public function getCashFlow(ReportPeriod $period): array
    {
        // Saldo kas & bank per akhir periode
        $summary        = $this->glService->getAccountsSummary(null, $period->endDate());
        $accountsByCode = collect($summary['accounts'])->keyBy('code');

        $cashAccount = $accountsByCode->get('1010');
        $bankAccount = $accountsByCode->get('1020');

        // Saldo awal = posisi kas & bank sebelum tanggal awal periode
        $before = $this->glService->aggregateLines(fn ($q) => $q
            ->whereIn('journal_lines.account_code', ['1010', '1020'])
            ->where('journal_entries.entry_date', '<', $period->startDate()));
        $openingBeforePeriod = round(
            (float) $before->sum('sum_debit') - (float) $before->sum('sum_credit'),
            2
        );

        $lines = JournalLine::with(['journalEntry', 'account'])
            ->whereIn('account_code', ['1010', '1020'])
            ->whereHas('journalEntry', fn ($q) => $q->where('status', 'posted'))
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->whereBetween('journal_entries.entry_date', [$period->startDate(), $period->endDate()])
            ->orderBy('journal_entries.entry_date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select('journal_lines.*')
            ->get();

        $openingBalance     = $openingBeforePeriod;
        $inflowCustomerAr   = 0.0;
        $inflowPosRetail    = 0.0;
        $inflowOther        = 0.0;
        $outflowVendorAp    = 0.0;
        $outflowOther       = 0.0;
        $cashMovements      = [];
        $runningCashBalance = $openingBeforePeriod;

        foreach ($lines as $line) {
            $je     = $line->journalEntry;
            $debit  = (float) $line->debit;
            $credit = (float) $line->credit;
            $net    = $debit - $credit;
            $runningCashBalance = round($runningCashBalance + $net, 2);

            // Setoran kas toko ke bank = mutasi internal (Kas ↔ Bank), tidak mengubah total kas & bank
            if ($je->entry_type === 'cash_transfer') {
                continue;
            }

            $isOpening = GeneralLedgerService::isOpeningOrClosing($je->entry_type, $je->source_document_id);

            if ($isOpening) {
                $openingBalance = round($openingBalance + $net, 2);
                $category       = in_array($je->entry_type, GeneralLedgerService::CLOSING_TYPES, true)
                    ? 'Penutupan Saldo Sistem Lama'
                    : 'Saldo Awal Kas & Bank';
            } elseif ($je->entry_type === 'tax_payment' && $credit > 0) {
                $outflowOther = round($outflowOther + $credit, 2);
                $category     = 'Penyetoran PPN ke Negara';
            } elseif ($debit > 0) {
                if (in_array($je->source_document_type, ['pos_session', 'pos_order'], true) || $je->entry_type === 'pos_closing') {
                    $inflowPosRetail = round($inflowPosRetail + $debit, 2);
                    $category        = 'Penerimaan Penjualan Ritel (POS)';
                } elseif ($je->source_document_type === 'payment' || $je->entry_type === 'payment_in') {
                    $inflowCustomerAr = round($inflowCustomerAr + $debit, 2);
                    $category         = 'Penerimaan Pelunasan Piutang (AR)';
                } else {
                    $inflowOther = round($inflowOther + $debit, 2);
                    $category    = 'Penerimaan Kas/Bank Lainnya';
                }
            } else {
                if ($je->source_document_type === 'payment' || $je->entry_type === 'payment_out') {
                    $outflowVendorAp = round($outflowVendorAp + $credit, 2);
                    $category        = 'Pembayaran Tagihan Pemasok (AP)';
                } else {
                    $outflowOther = round($outflowOther + $credit, 2);
                    $category     = 'Pengeluaran Operasional Lainnya';
                }
            }

            $cashMovements[] = [
                'id'                   => $line->id,
                'journal_entry_id'     => $je->id,
                'entry_no'             => $je->entry_no,
                'entry_date'           => $je->entry_date?->format('d/m/Y'),
                'account_code'         => $line->account_code,
                'account_name'         => $line->account?->account_name ?? $line->account_code,
                'category'             => $category,
                'source_document_type' => $je->source_document_type,
                'source_document_id'   => $je->source_document_id,
                'source_url'           => $this->glService->resolveSourceUrl($je->source_document_type, $je->source_document_id),
                'description'          => $line->description ?: $je->description,
                'inflow'               => $isOpening ? 0.0 : $debit,
                'outflow'              => $isOpening ? 0.0 : $credit,
                'net_change'           => $net,
                'running_balance'      => $runningCashBalance,
                'is_opening'           => $isOpening,
            ];
        }

        $totalInflow   = round($inflowCustomerAr + $inflowPosRetail + $inflowOther, 2);
        $totalOutflow  = round($outflowVendorAp + $outflowOther, 2);
        $netCashChange = round($totalInflow - $totalOutflow, 2);
        $endingBalance = round((float) ($cashAccount['balance'] ?? 0) + (float) ($bankAccount['balance'] ?? 0), 2);

        return [
            'period_label'       => $period->rangeLabel(),
            'cash_balance'       => (float) ($cashAccount['balance'] ?? 0),
            'bank_balance'       => (float) ($bankAccount['balance'] ?? 0),
            'opening_balance'    => $openingBalance,
            'inflow_customer_ar' => $inflowCustomerAr,
            'inflow_pos_retail'  => $inflowPosRetail,
            'inflow_other'       => $inflowOther,
            'total_inflow'       => $totalInflow,
            'outflow_vendor_ap'  => $outflowVendorAp,
            'outflow_other'      => $outflowOther,
            'total_outflow'      => $totalOutflow,
            'net_cash_change'    => $netCashChange,
            'ending_balance'     => $endingBalance,
            'movements'          => $cashMovements,
        ];
    }

    /**
     * 4. Laporan Neraca Saldo (Trial Balance — Saldo Awal, Mutasi, dan Saldo Akhir).
     */
    public function getTrialBalance(ReportPeriod $period): array
    {
        // Saldo akhir = kumulatif s/d akhir periode
        $summary = $this->glService->getAccountsSummary(null, $period->endDate());

        // Mutasi periode = jurnal di dalam periode, kecuali jurnal Saldo Awal (OPENING)
        $mutationAgg = $this->glService->aggregateLines(function ($q) use ($period) {
            $q->whereBetween('journal_entries.entry_date', [$period->startDate(), $period->endDate()]);
            GeneralLedgerService::whereOpening($q, false);
        });

        $rows             = [];
        $sumOpenDebit     = 0.0;
        $sumOpenCredit    = 0.0;
        $sumMutDebit      = 0.0;
        $sumMutCredit     = 0.0;
        $sumEndingDebit   = 0.0;
        $sumEndingCredit  = 0.0;

        foreach ($summary['accounts'] as $acc) {
            $code      = $acc['code'];
            $mut       = $mutationAgg->get($code);
            $mutDebit  = round((float) ($mut->sum_debit ?? 0), 2);
            $mutCredit = round((float) ($mut->sum_credit ?? 0), 2);

            // Saldo awal = semua jurnal sebelum periode + jurnal OPENING di dalam periode (disajikan neto)
            $openNet    = round(($acc['total_debit'] - $mutDebit) - ($acc['total_credit'] - $mutCredit), 2);
            $openDebit  = $openNet > 0 ? $openNet : 0.0;
            $openCredit = $openNet < 0 ? abs($openNet) : 0.0;

            $netDebitMinusCredit = round($acc['total_debit'] - $acc['total_credit'], 2);
            $endingDebit         = $netDebitMinusCredit > 0 ? $netDebitMinusCredit : 0.0;
            $endingCredit        = $netDebitMinusCredit < 0 ? abs($netDebitMinusCredit) : 0.0;

            $sumOpenDebit    = round($sumOpenDebit + $openDebit, 2);
            $sumOpenCredit   = round($sumOpenCredit + $openCredit, 2);
            $sumMutDebit     = round($sumMutDebit + $mutDebit, 2);
            $sumMutCredit    = round($sumMutCredit + $mutCredit, 2);
            $sumEndingDebit  = round($sumEndingDebit + $endingDebit, 2);
            $sumEndingCredit = round($sumEndingCredit + $endingCredit, 2);

            $rows[] = [
                'code'           => $code,
                'account_name'   => $acc['account_name'],
                'account_type'   => $acc['account_type'],
                'normal_side'    => $acc['normal_side'],
                'opening_debit'  => $openDebit,
                'opening_credit' => $openCredit,
                'mutation_debit' => $mutDebit,
                'mutation_credit'=> $mutCredit,
                'total_debit'    => $acc['total_debit'],
                'total_credit'   => $acc['total_credit'],
                'ending_debit'   => $endingDebit,
                'ending_credit'  => $endingCredit,
                'balance'        => $acc['balance'],
                'lines_count'    => (int) ($mut->lines_count ?? 0),
            ];
        }

        return [
            'as_of_date'        => $period->endLabel(),
            'period_label'      => $period->rangeLabel(),
            'rows'              => $rows,
            'sum_open_debit'    => $sumOpenDebit,
            'sum_open_credit'   => $sumOpenCredit,
            'sum_mut_debit'     => $sumMutDebit,
            'sum_mut_credit'    => $sumMutCredit,
            'total_debit'       => $summary['total_debit'],
            'total_credit'      => $summary['total_credit'],
            'sum_ending_debit'  => $sumEndingDebit,
            'sum_ending_credit' => $sumEndingCredit,
            'is_balanced'       => $summary['is_balanced'] && abs($sumEndingDebit - $sumEndingCredit) < 1,
        ];
    }

    /**
     * 6. Laporan Pajak (Tax Report — PPN Keluaran 2200 vs PPN Masukan 1300).
     */
    public function getTaxReport(ReportPeriod $period): array
    {
        // Masa pajak: semua angka dihitung dalam periode terpilih
        $from           = $period->startDate();
        $to             = $period->endDate();
        $summary        = $this->glService->getAccountsSummary($from, $to);
        $accountsByCode = collect($summary['accounts'])->keyBy('code');

        $taxRate = DB::table('tax_rates')->where('tax_id', 'VAT-NONLUX')->first();

        // 1. Faktur Pelanggan (PPN Keluaran)
        $invoices = CustomerInvoice::with('customer')
            ->whereIn('status', ['posted', 'paid'])
            ->whereBetween('invoice_date', [$from, $to])
            ->where(fn ($q) => $this->whereJournaled($q, 'customer_invoices', 'customer_invoice')) // hanya dokumen yang tercatat di buku besar
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CustomerInvoice $inv) => [
                'id'                  => $inv->id,
                'doc_type'            => 'Faktur Pelanggan (Invoice)',
                'partner_name'        => $inv->customer?->name ?? $inv->customer_id,
                'date'                => $inv->invoice_date?->format('d/m/Y'),
                'status'              => $inv->status,
                'subtotal_before_tax' => (float) $inv->subtotal_before_tax,
                'total_tax'           => (float) $inv->total_tax,
                'grand_total'         => (float) $inv->grand_total,
                'url'                 => route('accounting.invoices.show', $inv->id),
            ]);

        // 2. Nota Kredit (Pengurang PPN Keluaran)
        $creditNotes = CreditNote::with('customer')
            ->whereIn('status', ['posted', 'applied'])
            ->whereBetween('return_date', [$from, $to])
            ->where(fn ($q) => $this->whereJournaled($q, 'credit_notes', 'credit_note')) // hanya dokumen yang tercatat di buku besar
            ->orderByDesc('return_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CreditNote $cn) => [
                'id'                  => $cn->id,
                'doc_type'            => 'Nota Kredit Retur (Credit Note)',
                'partner_name'        => $cn->customer?->name ?? $cn->customer_id,
                'date'                => $cn->return_date?->format('d/m/Y'),
                'status'              => $cn->status,
                'subtotal_before_tax' => (float) $cn->subtotal_before_tax,
                'total_tax'           => (float) $cn->total_tax,
                'grand_total'         => (float) $cn->grand_total,
                'url'                 => route('accounting.credit-notes.show', $cn->id),
            ]);

        // 3. Tagihan Pemasok (PPN Masukan)
        $vendorBills = VendorBill::with('vendor')
            ->whereIn('status', ['posted', 'paid'])
            ->whereBetween('bill_date', [$from, $to])
            ->where(fn ($q) => $this->whereJournaled($q, 'vendor_bills', 'vendor_bill')) // hanya dokumen yang tercatat di buku besar
            ->orderByDesc('bill_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (VendorBill $bill) => [
                'id'                  => $bill->id,
                'doc_type'            => 'Tagihan Pemasok (Vendor Bill)',
                'partner_name'        => $bill->vendor?->name ?? $bill->vendor_id,
                'date'                => $bill->bill_date?->format('d/m/Y'),
                'status'              => $bill->status,
                'subtotal_before_tax' => (float) $bill->subtotal_before_tax,
                'total_tax'           => (float) $bill->total_tax,
                'grand_total'         => (float) $bill->grand_total,
                'url'                 => route('accounting.bills.show', $bill->id),
            ]);

        // Saldo Buku Besar Akun Pajak (2200 PPN Keluaran & 1300 PPN Masukan)
        $glOutputVat = (float) ($accountsByCode['2200']['balance'] ?? 0);

        $invoiceTaxTotal    = round((float) $invoices->sum('total_tax'), 2);
        $creditNoteTaxTotal = round((float) $creditNotes->sum('total_tax'), 2);

        // Mutasi GL akun pajak dalam masa (tanpa jurnal penutup sistem lama)
        $vatSum = function (string $account, string $side, ?callable $scope = null) use ($from, $to): float {
            $q = DB::table('journal_lines')
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->where('journal_entries.status', 'posted')
                ->whereBetween('journal_entries.entry_date', [$from, $to])
                ->whereNotIn('journal_entries.entry_type', GeneralLedgerService::CLOSING_TYPES)
                ->where('journal_lines.account_code', $account);
            if ($scope) {
                $scope($q);
            }

            return round((float) $q->sum("journal_lines.{$side}"), 2);
        };
        $isTaxPayment  = fn ($q) => $q->where('journal_entries.entry_type', 'tax_payment');
        $notTaxPayment = fn ($q) => $q->where('journal_entries.entry_type', '!=', 'tax_payment');

        // PPN Keluaran masa = kredit 2200 (faktur, POS, saldo awal) − debit 2200 non-setoran (retur)
        $outputVatTotal = round($vatSum('2200', 'credit') - $vatSum('2200', 'debit', $notTaxPayment), 2);

        // PPN Keluaran yang sudah disetor / dikompensasi = debit 2200 dari jurnal penyetoran PPN
        $paidOutputVat = $vatSum('2200', 'debit', $isTaxPayment);

        // Sisa PPN Keluaran yang belum disetor
        $remainingOutputVat = round($outputVatTotal - $paidOutputVat, 2);

        // PPN Keluaran dari penjualan POS (tercatat via jurnal sesi/struk POS)
        $posOutputTaxTotal = $vatSum('2200', 'credit', fn ($q) => $q
            ->whereIn('journal_entries.source_document_type', ['pos_session', 'pos_order']));

        // PPN Masukan masa = debit 1300; sebagian bisa sudah dikompensasi saat penyetoran PPN
        $glInputVat         = $vatSum('1300', 'debit');
        $inputVatCompensated = $vatSum('1300', 'credit', $isTaxPayment);

        // Riwayat pembayaran PPN ke negara
        $taxPayments = JournalEntry::where('entry_type', 'tax_payment')
            ->where('status', 'posted')
            ->whereBetween('entry_date', [$from, $to])
            ->orderByDesc('entry_date')
            ->get()
            ->map(fn ($je) => [
                'entry_no'    => $je->entry_no,
                'date'        => $je->entry_date?->format('d/m/Y'),
                'amount'      => (float) $je->total_debit,
                'description' => $je->description,
            ]);

        $netTaxPayable = round($remainingOutputVat - ($glInputVat - $inputVatCompensated), 2);

        return [
            'period_label' => $period->rangeLabel(),
            'tax_policy' => [
                'tax_id'          => $taxRate->tax_id ?? 'VAT-NONLUX',
                'formal_rate'     => $taxRate->formal_rate ?? '12%',
                'tax_base_factor' => $taxRate->tax_base_factor ?? '11/12',
                'effective_rate'  => $taxRate->effective_rate ?? '11%',
                'rounding_policy' => $taxRate->rounding_policy ?? 'Per invoice line; rupiah terdekat',
            ],
            'summary' => [
                'output_vat_total'    => $outputVatTotal,           // Total PPN keluaran masa (faktur + POS − retur)
                'output_vat_paid'     => $paidOutputVat,            // Sudah disetor / dikompensasi
                'input_vat_compensated' => $inputVatCompensated,
                'output_vat_remaining'=> $remainingOutputVat,       // Sisa yang belum dibayar
                'output_vat_gl'       => $glOutputVat,              // GL 2200 balance (referensi)
                'input_vat_gl'        => $glInputVat,
                'invoice_dpp_total'   => round((float) $invoices->sum('subtotal_before_tax'), 2),
                'invoice_tax_total'   => $invoiceTaxTotal,
                'credit_note_tax'     => $creditNoteTaxTotal,
                'pos_output_tax'      => $posOutputTaxTotal,
                'bill_dpp_total'      => round((float) $vendorBills->sum('subtotal_before_tax'), 2),
                'bill_tax_total'      => round((float) $vendorBills->sum('total_tax'), 2),
                'net_tax_payable'     => $netTaxPayable,
                'status_label'        => $netTaxPayable > 0
                    ? 'PPN Kurang Bayar (Utang Pajak)'
                    : ($netTaxPayable < 0 ? 'PPN Lebih Bayar (Restitusi / Kompensasi)' : 'Nihil (Seimbang)'),
            ],
            'invoices'     => $invoices->values()->all(),
            'credit_notes' => $creditNotes->values()->all(),
            'vendor_bills' => $vendorBills->values()->all(),
            'tax_payments' => $taxPayments->values()->all(),
        ];
    }

    /**
     * Dokumen dianggap tercatat di buku besar bila punya journal_entry_id,
     * atau menjadi sumber jurnal posted (mis. jurnal historis sistem lama).
     */
    private function whereJournaled($q, string $table, string $sourceType): void
    {
        $q->whereNotNull("{$table}.journal_entry_id")
            ->orWhereExists(fn ($s) => $s->select(DB::raw(1))
                ->from('journal_entries')
                ->whereColumn('journal_entries.source_document_id', "{$table}.id")
                ->where('journal_entries.source_document_type', $sourceType)
                ->where('journal_entries.status', 'posted'));
    }
}
