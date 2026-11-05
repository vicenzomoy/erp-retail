<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CustomerInvoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\VendorBill;
use App\Services\Accounting\GeneralLedgerService;
use Inertia\Inertia;
use Inertia\Response;

class AccountingOverviewController extends Controller
{
    public function __construct(
        protected GeneralLedgerService $glService
    ) {}

    /**
     * Dashboard Overview Modul Accounting (F-14, F-15, F-16, F-23).
     */
    public function index(): Response
    {
        $glSummary = $this->glService->getAccountsSummary();
        $accountsByCode = collect($glSummary['accounts'])->keyBy('code');

        $openAr = (float) CustomerInvoice::where('status', 'posted')->sum('amount_residual');
        $openAp = (float) VendorBill::where('status', 'posted')->sum('amount_residual');

        $recentBills = VendorBill::with(['vendor', 'purchaseOrder', 'receipt'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (VendorBill $b) => [
                'id'                => $b->id,
                'vendor_name'       => $b->vendor?->name ?? $b->vendor_id,
                'purchase_order_id' => $b->purchase_order_id,
                'receipt_id'        => $b->receipt_id,
                'status'            => $b->status,
                'grand_total'       => (float) $b->grand_total,
                'amount_residual'   => (float) $b->amount_residual,
                'bill_date'         => $b->bill_date?->format('d/m/Y'),
            ]);

        $recentInvoices = CustomerInvoice::with(['customer', 'salesOrder'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (CustomerInvoice $i) => [
                'id'              => $i->id,
                'customer_name'   => $i->customer?->name ?? $i->customer_id,
                'sales_order_id'  => $i->sales_order_id,
                'status'          => $i->status,
                'grand_total'     => (float) $i->grand_total,
                'amount_residual' => (float) $i->amount_residual,
                'invoice_date'    => $i->invoice_date?->format('d/m/Y'),
            ]);

        $recentJournals = JournalEntry::withCount('lines')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (JournalEntry $je) => [
                'id'                   => $je->id,
                'entry_no'             => $je->entry_no,
                'entry_type'           => $je->entry_type,
                'source_document_type' => $je->source_document_type,
                'source_document_id'   => $je->source_document_id,
                'entry_date'           => $je->entry_date?->format('d/m/Y'),
                'description'          => $je->description,
                'total_debit'          => (float) $je->total_debit,
                'total_credit'         => (float) $je->total_credit,
                'is_balanced'          => (bool) $je->is_balanced,
                'lines_count'          => $je->lines_count,
            ]);

        return Inertia::render('Accounting/Overview', [
            'kpis' => [
                'bank_balance'            => (float) ($accountsByCode['1020']['balance'] ?? 0),
                'cash_balance'            => (float) ($accountsByCode['1010']['balance'] ?? 0),
                'open_ar'                 => $openAr,
                'open_ap'                 => $openAp,
                'inventory_value'         => (float) ($accountsByCode['1200']['balance'] ?? 0),
                'cogs_total'              => (float) ($accountsByCode['5000']['balance'] ?? 0),
                'revenue_total'           => (float) (($accountsByCode['4000']['balance'] ?? 0) + ($accountsByCode['4010']['balance'] ?? 0)),
                'gl_total_debit'          => $glSummary['total_debit'],
                'gl_total_credit'         => $glSummary['total_credit'],
                'gl_is_balanced'          => $glSummary['is_balanced'],
                'vendor_bills_count'      => VendorBill::count(),
                'customer_invoices_count' => CustomerInvoice::count(),
                'payments_count'          => Payment::count(),
                'journal_entries_count'   => JournalEntry::count(),
            ],
            'recentBills'    => $recentBills,
            'recentInvoices' => $recentInvoices,
            'recentJournals' => $recentJournals,
        ]);
    }
}

