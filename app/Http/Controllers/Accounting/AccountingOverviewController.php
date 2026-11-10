<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\CustomerInvoice;
use App\Models\CustomerReturn;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\VendorBill;
use App\Services\Accounting\CustomerInvoiceService;
use App\Services\Accounting\GeneralLedgerService;
use App\Services\Accounting\VendorBillService;
use Inertia\Inertia;
use Inertia\Response;

class AccountingOverviewController extends Controller
{
    public function __construct(
        protected GeneralLedgerService $glService,
        protected VendorBillService $billService,
        protected CustomerInvoiceService $invoiceService
    ) {}

    /**
     * Dashboard Overview Terpadu Modul Accounting (Faktur, Tagihan, Kas & Buku Besar).
     */
    public function index(): Response
    {
        $glSummary = $this->glService->getAccountsSummary();
        $accountsByCode = collect($glSummary['accounts'])->keyBy('code');

        $openAr = (float) CustomerInvoice::where('status', 'posted')->sum('amount_residual');
        $openAp = (float) VendorBill::where('status', 'posted')->sum('amount_residual');
        $totalCreditNotes = (float) CreditNote::whereIn('status', ['posted', 'applied'])->sum('grand_total');
        $totalPaidThisMonth = (float) Payment::whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount');

        // 1. Antrean Pembelian Menunggu Tagihan (To Bill — Three-Way Match)
        $purchaseOrders = PurchaseOrder::with(['vendor', 'lines.product', 'receipts.lines'])
            ->whereIn('status', ['confirmed', 'done'])
            ->orderByDesc('id')
            ->get();

        $pendingBills = [];
        foreach ($purchaseOrders as $po) {
            $matrix = $this->billService->getThreeWayMatchForPo($po);
            $totalBillable = collect($matrix['lines'])->sum('max_billable_qty');
            if ($matrix['has_validated_receipt'] && $totalBillable > 0) {
                $totalOrdered = collect($matrix['lines'])->sum('qty_ordered');
                $totalAccepted = collect($matrix['lines'])->sum('qty_accepted');
                $totalBilled = collect($matrix['lines'])->sum('qty_already_billed');
                $estAmount = collect($matrix['lines'])->sum('default_line_total');

                $pendingBills[] = [
                    'purchase_order_id'    => $po->id,
                    'vendor_name'          => $po->vendor?->name ?? $po->vendor_id,
                    'primary_receipt_id'   => $matrix['primary_receipt_id'],
                    'order_date'           => $po->order_date?->format('d/m/Y'),
                    'payment_terms'        => $po->payment_terms,
                    'total_ordered'        => (float) $totalOrdered,
                    'total_accepted'       => (float) $totalAccepted,
                    'total_already_billed' => (float) $totalBilled,
                    'total_billable'       => (float) $totalBillable,
                    'estimated_amount'     => (float) $estAmount,
                    'action_url'           => route('accounting.bills.create', ['purchase_order_id' => $po->id]),
                ];
            }
        }

        // 2. Antrean Penjualan Menunggu Faktur (To Invoice — Delivered-Based)
        $salesOrders = SalesOrder::with(['customer', 'lines.product', 'deliveryOrders.lines'])
            ->whereIn('status', ['confirmed', 'done'])
            ->orderByDesc('id')
            ->get();

        $pendingInvoices = [];
        foreach ($salesOrders as $so) {
            $matrix = $this->invoiceService->getBillableMatrixForSo($so);
            $totalInvoiceable = (float) ($matrix['total_invoiceable'] ?? 0);
            if ($matrix['has_done_delivery'] && $totalInvoiceable > 0) {
                $totalOrdered = collect($matrix['lines'])->sum('qty_ordered');
                $totalDelivered = collect($matrix['lines'])->sum('qty_delivered');
                $totalInvoiced = collect($matrix['lines'])->sum('qty_already_invoiced');
                $estAmount = collect($matrix['lines'])->sum('default_line_total');

                $pendingInvoices[] = [
                    'sales_order_id'         => $so->id,
                    'customer_name'          => $so->customer?->name ?? $so->customer_id,
                    'order_date'             => $so->order_date?->format('d/m/Y'),
                    'payment_terms'          => $so->payment_terms,
                    'total_ordered'          => (float) $totalOrdered,
                    'total_delivered'        => (float) $totalDelivered,
                    'total_already_invoiced' => (float) $totalInvoiced,
                    'total_invoiceable'      => (float) $totalInvoiceable,
                    'estimated_amount'       => (float) $estAmount,
                    'action_url'             => route('accounting.invoices.create', ['sales_order_id' => $so->id]),
                ];
            }
        }

        // 3. Antrean Retur Pelanggan Menunggu Nota Kredit (To Credit Note)
        $pendingReturns = CustomerReturn::with(['customer', 'lines.product', 'originalInvoice'])
            ->where('status', 'inspected')
            ->orderByDesc('id')
            ->get()
            ->map(fn (CustomerReturn $r) => [
                'id'                  => $r->id,
                'customer_name'       => $r->customer?->name ?? $r->customer_id,
                'customer_invoice_id' => $r->customer_invoice_id,
                'return_date'         => $r->return_date?->format('d/m/Y'),
                'inspected_at'        => $r->inspected_at?->format('d/m/Y H:i'),
                'total_accepted'      => (float) $r->lines->sum('qty_accepted'),
                'total_damaged'       => (float) $r->lines->sum('qty_damaged'),
                'estimated_credit'    => (float) $r->lines->sum(fn ($l) => bcmul((string) $l->qty_accepted, (string) $l->unit_price, 2)),
                'action_url'          => route('accounting.credit-notes.create', ['customer_return_id' => $r->id]),
            ]);

        // 4. Tagihan & Faktur Terbuka Menunggu Pembayaran
        $unpaidInvoices = CustomerInvoice::with('customer')
            ->where('status', 'posted')
            ->where('amount_residual', '>', 0)
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (CustomerInvoice $i) => [
                'id'              => $i->id,
                'partner_name'    => $i->customer?->name ?? $i->customer_id,
                'due_date'        => $i->due_date?->format('d/m/Y'),
                'grand_total'     => (float) $i->grand_total,
                'amount_residual' => (float) $i->amount_residual,
                'action_url'      => route('accounting.payments.create', ['document_type' => 'customer_invoice', 'document_id' => $i->id]),
            ]);

        $unpaidBills = VendorBill::with('vendor')
            ->where('status', 'posted')
            ->where('amount_residual', '>', 0)
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (VendorBill $b) => [
                'id'              => $b->id,
                'partner_name'    => $b->vendor?->name ?? $b->vendor_id,
                'due_date'        => $b->due_date?->format('d/m/Y'),
                'grand_total'     => (float) $b->grand_total,
                'amount_residual' => (float) $b->amount_residual,
                'action_url'      => route('accounting.payments.create', ['document_type' => 'vendor_bill', 'document_id' => $b->id]),
            ]);

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
                'total_credit_notes'      => $totalCreditNotes,
                'paid_this_month'         => $totalPaidThisMonth,
                'inventory_value'         => (float) ($accountsByCode['1200']['balance'] ?? 0),
                'cogs_total'              => (float) ($accountsByCode['5000']['balance'] ?? 0),
                'revenue_total'           => (float) (($accountsByCode['4000']['balance'] ?? 0) + ($accountsByCode['4010']['balance'] ?? 0)),
                'gl_total_debit'          => $glSummary['total_debit'],
                'gl_total_credit'         => $glSummary['total_credit'],
                'gl_is_balanced'          => $glSummary['is_balanced'],
                'vendor_bills_count'      => VendorBill::count(),
                'customer_invoices_count' => CustomerInvoice::count(),
                'credit_notes_count'      => CreditNote::count(),
                'payments_count'          => Payment::count(),
                'journal_entries_count'   => JournalEntry::count(),
                'pending_bills_count'     => count($pendingBills),
                'pending_invoices_count'  => count($pendingInvoices),
                'pending_returns_count'   => count($pendingReturns),
            ],
            'pendingBills'    => $pendingBills,
            'pendingInvoices' => $pendingInvoices,
            'pendingReturns'  => $pendingReturns,
            'unpaidInvoices'  => $unpaidInvoices,
            'unpaidBills'     => $unpaidBills,
            'recentBills'     => $recentBills,
            'recentInvoices'  => $recentInvoices,
            'recentJournals'  => $recentJournals,
        ]);
    }
}
