<?php

namespace App\Services\Accounting;

use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\ChartOfAccount;
use App\Models\StockMove;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Layanan Buku Besar (General Ledger), Neraca Saldo, dan Keterlacakan Jurnal COGS / Stock Move (F-16, S-14, T-27, T-28).
 */
class GeneralLedgerService
{
    /**
     * Tentukan sisi saldo normal akun berdasarkan tipe akun.
     */
    public function getNormalSide(string $accountType): string
    {
        $lower = strtolower($accountType);
        if (str_contains($lower, 'aset') || str_contains($lower, 'beban')) {
            return 'debit';
        }

        return 'credit';
    }

    /**
     * Ambil ringkasan seluruh akun pada Chart of Accounts beserta total Debit, Kredit, dan Saldo Akhir.
     *
     * @return array{
     *   accounts: array<int, array<string, mixed>>,
     *   total_debit: string,
     *   total_credit: string,
     *   is_balanced: bool
     * }
     */
    public function getAccountsSummary(?string $from = null, ?string $to = null, bool $excludeClosing = false): array
    {
        $accounts = ChartOfAccount::orderBy('code')->get();

        $aggregates = $this->aggregateLines(function ($q) use ($from, $to, $excludeClosing) {
            if ($from) {
                $q->where('journal_entries.entry_date', '>=', $from);
            }
            if ($to) {
                $q->where('journal_entries.entry_date', '<=', $to);
            }
            if ($excludeClosing) {
                $q->whereNotIn('journal_entries.entry_type', self::CLOSING_TYPES);
            }
        });

        $grandDebit  = '0.00';
        $grandCredit = '0.00';
        $result      = [];

        foreach ($accounts as $acc) {
            $agg        = $aggregates[$acc->code] ?? null;
            $sumDebit   = number_format((float) ($agg->sum_debit ?? 0), 2, '.', '');
            $sumCredit  = number_format((float) ($agg->sum_credit ?? 0), 2, '.', '');
            $normalSide = $this->getNormalSide($acc->account_type);

            $balance = $normalSide === 'debit'
                ? bcsub($sumDebit, $sumCredit, 2)
                : bcsub($sumCredit, $sumDebit, 2);

            $grandDebit  = bcadd($grandDebit, $sumDebit, 2);
            $grandCredit = bcadd($grandCredit, $sumCredit, 2);

            $result[] = [
                'code'         => $acc->code,
                'account_name' => $acc->account_name,
                'account_type' => $acc->account_type,
                'normal_side'  => $normalSide,
                'total_debit'  => (float) $sumDebit,
                'total_credit' => (float) $sumCredit,
                'balance'      => (float) $balance,
                'lines_count'  => (int) ($agg->lines_count ?? 0),
            ];
        }

        return [
            'accounts'     => $result,
            'total_debit'  => (float) $grandDebit,
            'total_credit' => (float) $grandCredit,
            'is_balanced'  => bccomp($grandDebit, $grandCredit, 2) === 0,
        ];
    }

    /**
     * Agregasi debit/kredit per akun dari jurnal berstatus posted.
     * $scope menerima query builder (journal_lines JOIN journal_entries) untuk filter tambahan.
     */
    public function aggregateLines(?callable $scope = null)
    {
        $query = DB::table('journal_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted');

        if ($scope) {
            $scope($query);
        }

        return $query
            ->selectRaw('
                journal_lines.account_code,
                COALESCE(SUM(journal_lines.debit), 0) AS sum_debit,
                COALESCE(SUM(journal_lines.credit), 0) AS sum_credit,
                COUNT(journal_lines.id) AS lines_count
            ')
            ->groupBy('journal_lines.account_code')
            ->get()
            ->keyBy('account_code');
    }

    /** Tipe jurnal saldo awal. */
    public const OPENING_TYPES = ['opening', 'opening_balance'];

    /** Jurnal penutup sistem lama (memindahkan saldo historis ke Saldo Awal go-live). */
    public const CLOSING_TYPES = ['legacy_closing'];

    /** Saldo awal & penutup: bukan transaksi operasional periode berjalan. */
    public static function isOpeningOrClosing(?string $entryType, ?string $sourceDocumentId): bool
    {
        return $sourceDocumentId === 'OPENING'
            || in_array($entryType, [...self::OPENING_TYPES, ...self::CLOSING_TYPES], true);
    }

    /**
     * Filter untuk jurnal Saldo Awal (OPENING) dan jurnal penutup sistem lama.
     */
    public static function whereOpening($q, bool $isOpening = true): void
    {
        $types = [...self::OPENING_TYPES, ...self::CLOSING_TYPES];

        if ($isOpening) {
            $q->where(function ($w) use ($types) {
                $w->where('journal_entries.source_document_id', 'OPENING')
                  ->orWhereIn('journal_entries.entry_type', $types);
            });
        } else {
            $q->where(function ($w) {
                $w->whereNull('journal_entries.source_document_id')
                  ->orWhere('journal_entries.source_document_id', '!=', 'OPENING');
            })->where(function ($w) use ($types) {
                $w->whereNull('journal_entries.entry_type')
                  ->orWhereNotIn('journal_entries.entry_type', $types);
            });
        }
    }

    /**
     * Ambil mutasi buku besar (General Ledger lines) dengan perhitungan Running Balance per akun.
     *
     * Bila $from/$to diisi (filter periode), ringkasan akun berisi:
     *   opening_balance = saldo sebelum $from, total_debit/total_credit = mutasi periode,
     *   balance = saldo akhir per $to. Saldo berjalan dimulai dari saldo awal tersebut.
     */
    public function getAccountLedger(
        ?string $accountCode = null,
        ?string $entryType = null,
        ?string $from = null,
        ?string $to = null
    ): array {
        $summary = $this->getAccountsSummary($from, $to);

        $openingByCode = $from
            ? collect($this->getAccountsSummary(null, Carbon::parse($from)->subDay()->toDateString())['accounts'])->keyBy('code')
            : collect();

        foreach ($summary['accounts'] as &$acc) {
            $openingBalance         = (float) ($openingByCode[$acc['code']]['balance'] ?? 0);
            $acc['opening_balance'] = $openingBalance;
            $acc['balance']         = round($openingBalance + $acc['balance'], 2);
        }
        unset($acc);

        $accountsByCode = collect($summary['accounts'])->keyBy('code');

        $query = JournalLine::query()
            ->with(['journalEntry', 'account', 'product'])
            ->whereHas('journalEntry', function ($q) use ($entryType) {
                $q->where('status', 'posted');
                if ($entryType && $entryType !== 'all') {
                    $q->where('entry_type', $entryType);
                }
            })
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->orderBy('journal_entries.entry_date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->orderBy('journal_lines.id', 'asc')
            ->select('journal_lines.*');

        if ($accountCode && $accountCode !== 'all') {
            $query->where('journal_lines.account_code', $accountCode);
        }
        if ($from) {
            $query->where('journal_entries.entry_date', '>=', $from);
        }
        if ($to) {
            $query->where('journal_entries.entry_date', '<=', $to);
        }

        $lines = $query->get();

        // Hitung running balance per account_code secara kronologis
        $runningByAccount = [];
        $ledgerRows       = [];

        foreach ($lines as $line) {
            $code       = $line->account_code;
            $accInfo    = $accountsByCode[$code] ?? null;
            $normalSide = $accInfo['normal_side'] ?? 'debit';

            if (! isset($runningByAccount[$code])) {
                $runningByAccount[$code] = number_format((float) ($accInfo['opening_balance'] ?? 0), 2, '.', '');
            }

            $delta = $normalSide === 'debit'
                ? bcsub((string) $line->debit, (string) $line->credit, 2)
                : bcsub((string) $line->credit, (string) $line->debit, 2);

            $runningByAccount[$code] = bcadd($runningByAccount[$code], $delta, 2);

            $je = $line->journalEntry;

            $ledgerRows[] = [
                'id'                   => $line->id,
                'journal_entry_id'     => $je->id,
                'entry_no'             => $je->entry_no,
                'entry_date'           => $je->entry_date?->format('Y-m-d'),
                'entry_type'           => $je->entry_type,
                'source_document_type' => $je->source_document_type,
                'source_document_id'   => $je->source_document_id,
                'source_url'           => $this->resolveSourceUrl($je->source_document_type, $je->source_document_id),
                'account_code'         => $code,
                'account_name'         => $accInfo['account_name'] ?? $line->account?->account_name ?? $code,
                'account_type'         => $accInfo['account_type'] ?? $line->account?->account_type ?? '',
                'normal_side'          => $normalSide,
                'description'          => $line->description ?: $je->description,
                'variant_sku'          => $line->variant_sku,
                'debit'                => (float) $line->debit,
                'credit'               => (float) $line->credit,
                'running_balance'      => (float) $runningByAccount[$code],
            ];
        }

        // Ambil Stock Moves yang terhubung ke jurnal COGS / Persediaan untuk bukti T-27
        $stockMoves = StockMove::with(['product', 'journalEntry'])
            ->when($from, fn ($q) => $q->where('done_at', '>=', $from . ' 00:00:00'))
            ->when($to, fn ($q) => $q->where('done_at', '<=', $to . ' 23:59:59'))
            ->orderByDesc('id')
            ->limit(25)
            ->get()
            ->map(fn (StockMove $sm) => [
                'id'                   => $sm->id,
                'source_document_type' => $sm->source_document_type,
                'source_document_id'   => $sm->source_document_id,
                'source_url'           => $this->resolveSourceUrl($sm->source_document_type, $sm->source_document_id),
                'variant_sku'          => $sm->variant_sku,
                'product_name'         => $sm->product?->name ?? $sm->variant_sku,
                'location_from'        => $sm->location_from,
                'location_to'          => $sm->location_to,
                'qty_done'             => (float) $sm->qty_done,
                'unit_cost'            => (float) $sm->unit_cost,
                'total_value'          => (float) $sm->total_value,
                'journal_entry_id'     => $sm->journal_entry_id,
                'journal_entry_no'     => $sm->journalEntry?->entry_no,
                'done_at'              => $sm->done_at?->format('d/m/Y H:i'),
            ])
            ->all();

        return [
            'summary'          => $summary,
            'selected_account' => ($accountCode && $accountCode !== 'all') ? ($accountsByCode[$accountCode] ?? null) : null,
            'ledger_rows'      => $ledgerRows,
            'stock_moves'      => $stockMoves,
        ];
    }

    /**
     * Resolve URL ke dokumen sumber berdasarkan tipe & ID dokumen.
     */
    public function resolveSourceUrl(?string $docType, ?string $docId): ?string
    {
        if (! $docType || ! $docId || $docId === 'OPENING') {
            return null;
        }

        return match ($docType) {
            'vendor_bill'       => route('accounting.bills.show', $docId),
            'customer_invoice'  => route('accounting.invoices.show', $docId),
            'credit_note'       => route('accounting.credit-notes.show', $docId),
            'payment'           => route('accounting.payments.show', $docId),
            'delivery_order'    => route('inventory.deliveries.show', $docId),
            'receipt'           => route('inventory.receipts.show', $docId),
            'internal_transfer' => route('inventory.transfers.show', $docId),
            'product'           => route('inventory.products.show', $docId),
            'sales_order'       => route('sales.orders.show', $docId),
            'customer_return'   => route('sales.returns.show', $docId),
            'customer'          => route('sales.customers.show', $docId),
            'purchase_order'    => route('purchase.orders.show', $docId),
            'vendor'            => route('purchase.vendors.show', $docId),
            'crm_lead'          => route('crm.leads.show', $docId),
            'pos_session'       => route('pos.sessions.show', $docId),
            'pos_order'         => route('pos.orders.show', $docId),
            default             => null,
        };
    }
}

