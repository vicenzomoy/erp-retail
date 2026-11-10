<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\CustomerReturn;
use App\Services\Sales\CustomerReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CreditNoteController extends Controller
{
    public function __construct(
        protected CustomerReturnService $returnService
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = CreditNote::with(['customer', 'originalInvoice', 'customerReturn', 'journalEntry'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('original_invoice_id', 'ilike', "%{$search}%")
                  ->orWhere('customer_return_id', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        $creditNotes = $query->paginate(15)->through(fn (CreditNote $cn) => [
            'id'                  => $cn->id,
            'original_invoice_id' => $cn->original_invoice_id,
            'customer_return_id'  => $cn->customer_return_id,
            'customer_name'       => $cn->customer?->name,
            'status'              => $cn->status,
            'return_date'         => $cn->return_date?->format('d/m/Y'),
            'subtotal_before_tax' => (float) $cn->subtotal_before_tax,
            'total_tax'           => (float) $cn->total_tax,
            'grand_total'         => (float) $cn->grand_total,
            'journal_entry_no'    => $cn->journalEntry?->entry_no,
            'posted_at'           => $cn->posted_at?->format('d/m/Y H:i'),
        ])->withQueryString();

        return Inertia::render('Accounting/CreditNotes/Index', [
            'creditNotes' => $creditNotes,
            'filters'     => [
                'status' => $status,
                'search' => $search,
            ],
            'counts'      => [
                'all'     => CreditNote::count(),
                'applied' => CreditNote::where('status', 'applied')->count(),
                'posted'  => CreditNote::where('status', 'posted')->count(),
                'draft'   => CreditNote::where('status', 'draft')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $selectedReturnId = $request->query('customer_return_id', '');

        $inspectedReturns = CustomerReturn::with(['customer', 'customerInvoice', 'lines.product'])
            ->where('status', 'inspected')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Accounting/CreditNotes/Create', [
            'inspectedReturns' => $inspectedReturns->map(fn ($r) => [
                'id'                  => $r->id,
                'customer_invoice_id' => $r->customer_invoice_id,
                'customer_id'         => $r->customer_id,
                'customer_name'       => $r->customer?->name,
                'return_date'         => $r->return_date?->format('d/m/Y'),
                'inspection_notes'    => $r->inspection_notes,
                'lines'               => $r->lines->where('qty_accepted', '>', 0)->values()->map(fn ($l) => [
                    'id'           => $l->id,
                    'variant_sku'  => $l->variant_sku,
                    'product_name' => $l->product?->name ?? $l->variant_sku,
                    'qty_accepted' => (float) $l->qty_accepted,
                    'unit_price'   => (float) $l->unit_price,
                    'line_total'   => (float) bcmul((string) $l->qty_accepted, (string) $l->unit_price, 2),
                ]),
            ]),
            'selectedReturnId' => $selectedReturnId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_return_id' => 'required|exists:customer_returns,id',
            'notes'              => 'nullable|string|max:500',
        ], [
            'customer_return_id.required' => 'Pilih dokumen retur yang telah diinspeksi gudang.',
        ]);

        $return = CustomerReturn::findOrFail($validated['customer_return_id']);

        $creditNote = $this->returnService->processCreditNoteAndArAdjustment($return, $validated, $request->user());

        return redirect()->route('accounting.credit-notes.show', $creditNote->id)
            ->with('success', "Nota Kredit {$creditNote->id} berhasil diterbitkan dan AR Adjustment telah otomatis direkonsiliasi ke Faktur {$creditNote->original_invoice_id}.");
    }

    public function show(string $id): Response
    {
        $creditNote = CreditNote::with([
            'customer',
            'originalInvoice',
            'customerReturn',
            'journalEntry.lines.account',
            'lines.product',
            'postedBy',
        ])->findOrFail($id);

        return Inertia::render('Accounting/CreditNotes/Show', [
            'creditNote' => [
                'id'                  => $creditNote->id,
                'original_invoice_id' => $creditNote->original_invoice_id,
                'customer_return_id'  => $creditNote->customer_return_id,
                'customer_name'       => $creditNote->customer?->name,
                'status'              => $creditNote->status,
                'return_date'         => $creditNote->return_date?->format('d/m/Y'),
                'days_since_invoice'  => $creditNote->days_since_invoice,
                'subtotal_before_tax' => (float) $creditNote->subtotal_before_tax,
                'total_tax'           => (float) $creditNote->total_tax,
                'grand_total'         => (float) $creditNote->grand_total,
                'notes'               => $creditNote->notes,
                'posted_at'           => $creditNote->posted_at?->format('d/m/Y H:i'),
                'posted_by_name'      => $creditNote->postedBy?->name,
                'journal_entry'       => $creditNote->journalEntry ? [
                    'id'          => $creditNote->journalEntry->id,
                    'entry_no'    => $creditNote->journalEntry->entry_no,
                    'total_debit' => (float) $creditNote->journalEntry->total_debit,
                    'lines'       => $creditNote->journalEntry->lines->map(fn ($jl) => [
                        'account_code' => $jl->account_code,
                        'account_name' => $jl->account?->account_name ?? $jl->account_code,
                        'description'  => $jl->description,
                        'debit'        => (float) $jl->debit,
                        'credit'       => (float) $jl->credit,
                    ]),
                ] : null,
                'lines'               => $creditNote->lines->map(fn ($l) => [
                    'id'                  => $l->id,
                    'variant_sku'         => $l->variant_sku,
                    'product_name'        => $l->product?->name ?? $l->variant_sku,
                    'condition'           => $l->condition,
                    'qty_returned'        => (float) $l->qty_returned,
                    'unit_price'          => (float) $l->unit_price,
                    'tax_amount'          => (float) $l->tax_amount,
                    'subtotal_before_tax' => (float) $l->subtotal_before_tax,
                    'line_total'          => (float) $l->line_total,
                ]),
            ],
        ]);
    }
}

