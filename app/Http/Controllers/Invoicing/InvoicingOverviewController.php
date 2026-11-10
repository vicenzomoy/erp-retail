<?php

namespace App\Http\Controllers\Invoicing;

use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\CustomerInvoice;
use App\Models\CustomerReturn;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\VendorBill;
use App\Services\Accounting\CustomerInvoiceService;
use App\Services\Accounting\VendorBillService;
use Inertia\Inertia;
use Inertia\Response;

class InvoicingOverviewController extends Controller
{
    public function __construct(
        protected VendorBillService $billService,
        protected CustomerInvoiceService $invoiceService
    ) {}

    /**
     * Dashboard Ringkasan Khusus Modul Invoicing.
     * Dilengkapi antrean proaktif:
     * 1. Pembelian Menunggu Tagihan (To Bill)
     * 2. Penjualan Menunggu Faktur (To Invoice)
     * 3. Retur Pelanggan Menunggu Nota Kredit (To Credit Note)
     * 4. Faktur/Tagihan Terbuka Menunggu Pembayaran
     */
    public function index(): Response
    {
        $openAr = (float) CustomerInvoice::where('status', 'posted')->sum('amount_residual');
        $openAp = (float) VendorBill::where('status', 'posted')->sum('amount_residual');
        $totalCreditNotes = (float) CreditNote::whereIn('status', ['posted', 'applied'])->sum('grand_total');
        $totalPaidThisMonth = (float) Payment::whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount');

        // 1. Antrean Pembelian Menunggu Tagihan (To Bill)
        // Barang telah diterima & divalidasi gudang (Accepted Receipt), siap dibuatkan Vendor Bill
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
                    'action_url'           => route('invoicing.bills.create', ['purchase_order_id' => $po->id]),
                ];
            }
        }

        // 2. Antrean Penjualan Menunggu Faktur (To Invoice)
        // Barang telah terkirim oleh gudang (Delivered), siap diterbitkan Customer Invoice
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
                    'action_url'             => route('invoicing.invoices.create', ['sales_order_id' => $so->id]),
                ];
            }
        }

        // 3. Antrean Retur Pelanggan Menunggu Nota Kredit (To Credit Note)
        // Barang retur telah diinspeksi gudang, siap dibuatkan Nota Kredit & AR Adjustment
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
                'action_url'          => route('invoicing.credit-notes.create', ['customer_return_id' => $r->id]),
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
                'action_url'      => route('invoicing.payments.create', ['document_type' => 'customer_invoice', 'document_id' => $i->id]),
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
                'action_url'      => route('invoicing.payments.create', ['document_type' => 'vendor_bill', 'document_id' => $b->id]),
            ]);

        // Riwayat Faktur & Tagihan Terbaru
        $recentInvoices = CustomerInvoice::with(['customer', 'salesOrder'])
            ->orderByDesc('created_at')
            ->limit(5)
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

        $recentBills = VendorBill::with(['vendor', 'purchaseOrder'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (VendorBill $b) => [
                'id'                => $b->id,
                'vendor_name'       => $b->vendor?->name ?? $b->vendor_id,
                'purchase_order_id' => $b->purchase_order_id,
                'status'            => $b->status,
                'grand_total'       => (float) $b->grand_total,
                'amount_residual'   => (float) $b->amount_residual,
                'bill_date'         => $b->bill_date?->format('d/m/Y'),
            ]);

        return Inertia::render('Invoicing/Overview', [
            'kpis' => [
                'open_ar'              => $openAr,
                'open_ap'              => $openAp,
                'total_credit_notes'   => $totalCreditNotes,
                'paid_this_month'      => $totalPaidThisMonth,
                'pending_bills_count'    => count($pendingBills),
                'pending_invoices_count' => count($pendingInvoices),
                'pending_returns_count'  => count($pendingReturns),
                'invoices_count'       => CustomerInvoice::count(),
                'bills_count'          => VendorBill::count(),
                'credit_notes_count'   => CreditNote::count(),
                'payments_count'       => Payment::count(),
            ],
            'pendingBills'    => $pendingBills,
            'pendingInvoices' => $pendingInvoices,
            'pendingReturns'  => $pendingReturns,
            'unpaidInvoices'  => $unpaidInvoices,
            'unpaidBills'     => $unpaidBills,
            'recentInvoices'  => $recentInvoices,
            'recentBills'     => $recentBills,
        ]);
    }
}
