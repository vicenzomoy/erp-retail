<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\StockMove;
use App\Services\Accounting\GeneralLedgerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller S-14: Journal Entries dan General Ledger (F-16, T-27, T-28).
 */
class JournalEntryController extends Controller
{
    public function __construct(
        protected GeneralLedgerService $glService
    ) {}

    /**
     * Daftar seluruh Journal Entries beserta verifikasi keseimbangan Debit = Kredit (S-14).
     */
    public function index(Request $request): Response
    {
        $entryType = $request->query('entry_type', 'all');
        $search    = $request->query('search', '');

        $query = JournalEntry::with(['lines.account', 'postedBy'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($entryType !== 'all') {
            $query->where('entry_type', $entryType);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('entry_no', 'ilike', "%{$search}%")
                  ->orWhere('source_document_id', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $entries = $query->paginate(20)->through(fn (JournalEntry $je) => [
            'id'                   => $je->id,
            'entry_no'             => $je->entry_no,
            'entry_type'           => $je->entry_type,
            'source_document_type' => $je->source_document_type,
            'source_document_id'   => $je->source_document_id,
            'source_url'           => $this->glService->resolveSourceUrl($je->source_document_type, $je->source_document_id),
            'entry_date'           => $je->entry_date?->format('d/m/Y'),
            'description'          => $je->description,
            'status'               => $je->status,
            'is_balanced'          => bccomp((string) $je->total_debit, (string) $je->total_credit, 2) === 0,
            'total_debit'          => (float) $je->total_debit,
            'total_credit'         => (float) $je->total_credit,
            'posted_at'            => $je->posted_at?->format('d/m/Y H:i'),
            'posted_by'            => $je->postedBy?->name,
            'lines'                => $je->lines->map(fn ($l) => [
                'id'           => $l->id,
                'account_code' => $l->account_code,
                'account_name' => $l->account?->account_name ?? $l->account_code,
                'description'  => $l->description,
                'debit'        => (float) $l->debit,
                'credit'       => (float) $l->credit,
            ]),
        ])->withQueryString();

        $glSummary = $this->glService->getAccountsSummary();

        return Inertia::render('Accounting/Journals/Index', [
            'entries'   => $entries,
            'filters'   => [
                'entry_type' => $entryType,
                'search'     => $search,
            ],
            'glSummary' => [
                'total_debit'  => $glSummary['total_debit'],
                'total_credit' => $glSummary['total_credit'],
                'is_balanced'  => $glSummary['is_balanced'],
                'total_count'  => JournalEntry::count(),
                'cogs_count'   => JournalEntry::where('entry_type', 'cogs')->count(),
            ],
        ]);
    }

    /**
     * Detail satu Journal Entry beserta rincian baris Debit/Kredit dan Stock Move terkait (T-27 & T-28).
     */
    public function show(int $id): Response
    {
        $je = JournalEntry::with(['lines.account', 'lines.product', 'postedBy', 'creator'])
            ->findOrFail($id);

        $stockMoves = StockMove::with('product')
            ->where(function ($q) use ($je) {
                $q->where('journal_entry_id', $je->id)
                  ->orWhere(function ($sq) use ($je) {
                      $sq->where('source_document_type', $je->source_document_type)
                         ->where('source_document_id', $je->source_document_id);
                  });
            })
            ->get()
            ->map(fn (StockMove $sm) => [
                'id'                   => $sm->id,
                'source_document_type' => $sm->source_document_type,
                'source_document_id'   => $sm->source_document_id,
                'variant_sku'          => $sm->variant_sku,
                'product_name'         => $sm->product?->name ?? $sm->variant_sku,
                'location_from'        => $sm->location_from,
                'location_to'          => $sm->location_to,
                'qty_done'             => (float) $sm->qty_done,
                'unit_cost'            => (float) $sm->unit_cost,
                'total_value'          => (float) $sm->total_value,
                'done_at'              => $sm->done_at?->format('d/m/Y H:i'),
            ]);

        $sourceUrl = $this->glService->resolveSourceUrl($je->source_document_type, $je->source_document_id);
        $relatedDocs = [];

        if ($je->source_document_id && $je->source_document_id !== 'OPENING') {
            $relatedDocs[] = [
                'type'   => strtoupper(str_replace('_', ' ', $je->source_document_type)),
                'id'     => $je->source_document_id,
                'title'  => "Dokumen Sumber {$je->source_document_id}",
                'status' => 'done',
                'info'   => $je->description,
                'url'    => $sourceUrl ?? '#',
            ];
        }

        // Hitung jumlah entri jurnal yang memiliki source_document_type & source_document_id sama (bukti anti-duplikasi T-28)
        $sameSourceJournalCount = JournalEntry::where('source_document_type', $je->source_document_type)
            ->where('source_document_id', $je->source_document_id)
            ->count();

        $auditLogs = AuditLog::where('document_id', $je->source_document_id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (AuditLog $log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'notes'          => $log->notes,
                'old_value'      => $log->old_value,
                'new_value'      => $log->new_value,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
                'time_ago'       => $log->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Accounting/Journals/Show', [
            'entry' => [
                'id'                        => $je->id,
                'entry_no'                  => $je->entry_no,
                'entry_type'                => $je->entry_type,
                'source_document_type'      => $je->source_document_type,
                'source_document_id'        => $je->source_document_id,
                'source_url'                => $sourceUrl,
                'entry_date'                => $je->entry_date?->format('Y-m-d'),
                'description'               => $je->description,
                'status'                    => $je->status,
                'is_balanced'               => bccomp((string) $je->total_debit, (string) $je->total_credit, 2) === 0,
                'total_debit'               => (float) $je->total_debit,
                'total_credit'              => (float) $je->total_credit,
                'posted_at'                 => $je->posted_at?->format('d/m/Y H:i'),
                'posted_by'                 => $je->postedBy?->name,
                'same_source_journal_count' => $sameSourceJournalCount,
                'lines'                     => $je->lines->map(fn ($l) => [
                    'id'           => $l->id,
                    'account_code' => $l->account_code,
                    'account_name' => $l->account?->account_name ?? $l->account_code,
                    'account_type' => $l->account?->account_type ?? '',
                    'description'  => $l->description,
                    'variant_sku'  => $l->variant_sku,
                    'debit'        => (float) $l->debit,
                    'credit'       => (float) $l->credit,
                ]),
            ],
            'stockMoves'  => $stockMoves,
            'relatedDocs' => $relatedDocs,
            'auditLogs'   => $auditLogs,
        ]);
    }

    /**
     * Halaman General Ledger / Buku Besar (S-14, T-27, T-28).
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
}

