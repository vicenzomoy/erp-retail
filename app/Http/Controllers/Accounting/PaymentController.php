<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\Master\ContactCustomer;
use App\Models\Master\ContactVendor;
use App\Models\Payment;
use App\Models\PurchaseOrder;
use App\Models\VendorBill;
use App\Services\Accounting\GeneralLedgerService;
use App\Services\Accounting\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller S-13: Register Payment, Pembayaran Parsial, Rekonsiliasi & Anti-Duplikasi (F-15, T-20, T-25, T-26).
 */
class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected GeneralLedgerService $glService
    ) {}

    /**
     * Daftar seluruh pembayaran (Inbound & Outbound).
     */
    public function index(Request $request): Response
    {
        $type   = $request->query('type', 'all');
        $search = $request->query('search', '');

        $query = Payment::with(['allocations', 'journalEntry', 'bankAccount'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($type !== 'all') {
            $query->where('payment_type', $type);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('party_id', 'ilike', "%{$search}%")
                  ->orWhere('reference', 'ilike', "%{$search}%");
            });
        }

        $customers = ContactCustomer::all()->keyBy('id');
        $vendors   = ContactVendor::all()->keyBy('id');

        $payments = $query->paginate(15)->through(function (Payment $p) use ($customers, $vendors) {
            $partyName = $p->party_type === 'customer'
                ? ($customers[$p->party_id]->name ?? $p->party_id)
                : ($vendors[$p->party_id]->name ?? $p->party_id);

            $firstAlloc = $p->allocations->first();

            return [
                'id'                => $p->id,
                'payment_type'      => $p->payment_type,
                'party_type'        => $p->party_type,
                'party_id'          => $p->party_id,
                'party_name'        => $partyName,
                'payment_method'    => $p->payment_method,
                'bank_account_code' => $p->bank_account_code,
                'bank_account_name' => $p->bankAccount?->account_name ?? $p->bank_account_code,
                'amount'            => (float) $p->amount,
                'payment_date'      => $p->payment_date?->format('d/m/Y'),
                'reference'         => $p->reference,
                'status'            => $p->status,
                'idempotency_key'   => $p->idempotency_key,
                'journal_entry_no'  => $p->journalEntry?->entry_no,
                'document_type'     => $firstAlloc?->document_type,
                'document_id'       => $firstAlloc?->document_id,
            ];
        })->withQueryString();

        $glSummary = $this->glService->getAccountsSummary();
        $accByCode = collect($glSummary['accounts'])->keyBy('code');

        return Inertia::render('Accounting/Payments/Index', [
            'payments' => $payments,
            'filters'  => [
                'type'   => $type,
                'search' => $search,
            ],
            'balances' => [
                'bank_1020'    => (float) ($accByCode['1020']['balance'] ?? 0),
                'cash_1010'    => (float) ($accByCode['1010']['balance'] ?? 0),
                'open_ar_1100' => (float) CustomerInvoice::where('status', 'posted')->sum('amount_residual'),
                'open_ap_2100' => (float) VendorBill::where('status', 'posted')->sum('amount_residual'),
            ],
        ]);
    }

    /**
     * Form Register Payment (S-13) untuk Customer Invoice (T-25) atau Vendor Bill (T-26).
     */
    public function create(Request $request): Response
    {
        $preDocType = $request->query('document_type', 'customer_invoice');
        $preDocId   = $request->query('document_id', '');

        $openInvoices = CustomerInvoice::with('customer')
            ->whereIn('status', ['posted', 'paid'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CustomerInvoice $inv) => [
                'id'              => $inv->id,
                'party_id'        => $inv->customer_id,
                'party_name'      => $inv->customer?->name ?? $inv->customer_id,
                'status'          => $inv->status,
                'grand_total'     => (float) $inv->grand_total,
                'amount_paid'     => (float) $inv->amount_paid,
                'amount_residual' => (float) $inv->amount_residual,
                'due_date'        => $inv->due_date?->format('d/m/Y'),
            ]);

        $openBills = VendorBill::with('vendor')
            ->whereIn('status', ['posted', 'paid'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (VendorBill $b) => [
                'id'              => $b->id,
                'party_id'        => $b->vendor_id,
                'party_name'      => $b->vendor?->name ?? $b->vendor_id,
                'status'          => $b->status,
                'grand_total'     => (float) $b->grand_total,
                'amount_paid'     => (float) $b->amount_paid,
                'amount_residual' => (float) $b->amount_residual,
                'due_date'        => $b->due_date?->format('d/m/Y'),
            ]);

        $unbilledPos = PurchaseOrder::with('vendor')
            ->where('status', 'confirmed')
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id'          => $po->id,
                'party_id'    => $po->vendor_id,
                'party_name'  => $po->vendor?->name ?? $po->vendor_id,
                'status'      => $po->status,
                'grand_total' => (float) $po->grand_total,
            ]);

        $glSummary = $this->glService->getAccountsSummary();
        $accByCode = collect($glSummary['accounts'])->keyBy('code');

        return Inertia::render('Accounting/Payments/Create', [
            'preselected' => [
                'document_type' => $preDocType,
                'document_id'   => $preDocId,
            ],
            'customerInvoices' => $openInvoices,
            'vendorBills'      => $openBills,
            'purchaseOrders'   => $unbilledPos,
            'bankAccounts'     => [
                [
                    'code'    => '1020',
                    'name'    => 'Bank Operasional (1020)',
                    'balance' => (float) ($accByCode['1020']['balance'] ?? 0),
                ],
                [
                    'code'    => '1010',
                    'name'    => 'Kas Tunai (1010)',
                    'balance' => (float) ($accByCode['1010']['balance'] ?? 0),
                ],
            ],
        ]);
    }

    /**
     * Eksekusi Register Payment (mendukung pembayaran parsial T-25 & anti-duplikasi idempotency_key T-26).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'document_type'     => 'required|string|in:customer_invoice,vendor_bill,purchase_order',
            'document_id'       => 'required|string',
            'amount'            => 'required|numeric|min:0.01',
            'payment_method'    => 'nullable|string|in:bank_transfer,cash',
            'bank_account_code' => 'nullable|string|in:1020,1010',
            'payment_date'      => 'nullable|date',
            'reference'         => 'nullable|string|max:100',
            'notes'             => 'nullable|string|max:1000',
            'idempotency_key'   => 'required|string|max:64',
        ]);

        $result  = $this->paymentService->registerPayment($validated, $request->user());
        $payment = $result['payment'];

        if ($result['already_processed']) {
            return redirect()->route('accounting.payments.show', $payment->id)
                ->with('info', "Anti-Duplikasi Aktif (SR-17 & SR-20 / Skenario T-26): Permintaan pembayaran ulang dengan kunci transaksi '{$payment->idempotency_key}' telah dicegah. Utang/Piutang tetap lunas satu kali dan Saldo Bank tidak terpotong ganda.");
        }

        return redirect()->route('accounting.payments.show', $payment->id)
            ->with('success', "Pembayaran {$payment->id} sebesar Rp " . number_format((float) $payment->amount, 0, ',', '.') . " berhasil dicatat dan direkonsiliasi ke Buku Besar.");
    }

    /**
     * Detail Bukti Register Payment (S-13), lengkap dengan keterkaitan faktur/bill, Ledger Bank, dan tombol uji T-26.
     */
    public function show(string $id): Response
    {
        $payment = Payment::with([
            'allocations',
            'journalEntry.lines.account',
            'bankAccount',
            'postedBy',
            'creator',
        ])->findOrFail($id);

        $partyName = $payment->party_type === 'customer'
            ? (ContactCustomer::find($payment->party_id)?->name ?? $payment->party_id)
            : (ContactVendor::find($payment->party_id)?->name ?? $payment->party_id);

        $allocations = [];
        $relatedDocs = [];
        $allocDocIds = [$payment->id];

        foreach ($payment->allocations as $alloc) {
            $allocDocIds[] = $alloc->document_id;

            if ($alloc->document_type === 'customer_invoice') {
                $inv = CustomerInvoice::with('customer')->find($alloc->document_id);
                $allocations[] = [
                    'id'               => $alloc->id,
                    'document_type'    => 'customer_invoice',
                    'document_label'   => 'Customer Invoice',
                    'document_id'      => $alloc->document_id,
                    'document_url'     => route('accounting.invoices.show', $alloc->document_id),
                    'party_name'       => $inv?->customer?->name ?? $payment->party_id,
                    'grand_total'      => (float) ($inv?->grand_total ?? 0),
                    'amount_allocated' => (float) $alloc->amount_allocated,
                    'amount_paid'      => (float) ($inv?->amount_paid ?? 0),
                    'amount_residual'  => (float) ($inv?->amount_residual ?? 0),
                    'document_status'  => $inv?->status ?? 'posted',
                ];

                $relatedDocs[] = [
                    'type'   => 'Customer Invoice',
                    'id'     => $alloc->document_id,
                    'title'  => "Faktur Pelanggan {$alloc->document_id}",
                    'status' => $inv?->status ?? 'posted',
                    'info'   => 'Sisa Piutang (Residual): Rp ' . number_format((float) ($inv?->amount_residual ?? 0), 0, ',', '.'),
                    'url'    => route('accounting.invoices.show', $alloc->document_id),
                ];
            } else {
                $bill = VendorBill::with('vendor')->find($alloc->document_id);
                $allocations[] = [
                    'id'               => $alloc->id,
                    'document_type'    => 'vendor_bill',
                    'document_label'   => 'Vendor Bill',
                    'document_id'      => $alloc->document_id,
                    'document_url'     => route('accounting.bills.show', $alloc->document_id),
                    'party_name'       => $bill?->vendor?->name ?? $payment->party_id,
                    'grand_total'      => (float) ($bill?->grand_total ?? 0),
                    'amount_allocated' => (float) $alloc->amount_allocated,
                    'amount_paid'      => (float) ($bill?->amount_paid ?? 0),
                    'amount_residual'  => (float) ($bill?->amount_residual ?? 0),
                    'document_status'  => $bill?->status ?? 'paid',
                ];

                $relatedDocs[] = [
                    'type'   => 'Vendor Bill',
                    'id'     => $alloc->document_id,
                    'title'  => "Tagihan Vendor {$alloc->document_id}",
                    'status' => $bill?->status ?? 'paid',
                    'info'   => 'Sisa Utang (Residual): Rp ' . number_format((float) ($bill?->amount_residual ?? 0), 0, ',', '.'),
                    'url'    => route('accounting.bills.show', $alloc->document_id),
                ];
            }
        }

        if ($payment->journalEntry) {
            $relatedDocs[] = [
                'type'   => 'Journal Entry (Kas/Bank)',
                'id'     => $payment->journalEntry->entry_no,
                'title'  => "Jurnal Pembayaran {$payment->journalEntry->entry_no}",
                'status' => $payment->journalEntry->status,
                'info'   => 'Debit = Kredit: Rp ' . number_format((float) $payment->journalEntry->total_debit, 0, ',', '.'),
                'url'    => route('accounting.journals.show', $payment->journalEntry->id),
            ];
        }

        $auditLogs = AuditLog::whereIn('document_id', $allocDocIds)
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

        $bankLedger = $this->glService->getAccountLedger($payment->bank_account_code ?: '1020');
        $apLedger   = $this->glService->getAccountLedger('2100');
        $arLedger   = $this->glService->getAccountLedger('1100');

        return Inertia::render('Accounting/Payments/Show', [
            'payment' => [
                'id'                => $payment->id,
                'payment_type'      => $payment->payment_type,
                'party_type'        => $payment->party_type,
                'party_id'          => $payment->party_id,
                'party_name'        => $partyName,
                'payment_method'    => $payment->payment_method,
                'bank_account_code' => $payment->bank_account_code,
                'bank_account_name' => $payment->bankAccount?->account_name ?? $payment->bank_account_code,
                'amount'            => (float) $payment->amount,
                'payment_date'      => $payment->payment_date?->format('Y-m-d'),
                'reference'         => $payment->reference,
                'status'            => $payment->status,
                'idempotency_key'   => $payment->idempotency_key,
                'posted_at'         => $payment->posted_at?->format('d/m/Y H:i'),
                'posted_by'         => $payment->postedBy?->name,
                'journal_entry_id'  => $payment->journal_entry_id,
                'journal_entry_no'  => $payment->journalEntry?->entry_no,
                'notes'             => $payment->notes,
                'allocations'       => $allocations,
                'journal_lines'     => $payment->journalEntry?->lines->map(fn ($jl) => [
                    'id'           => $jl->id,
                    'account_code' => $jl->account_code,
                    'account_name' => $jl->account?->account_name ?? $jl->account_code,
                    'description'  => $jl->description,
                    'debit'        => (float) $jl->debit,
                    'credit'       => (float) $jl->credit,
                ]) ?? [],
            ],
            'bankLedger' => [
                'account_code' => $payment->bank_account_code ?: '1020',
                'account_name' => $bankLedger['selected_account']['account_name'] ?? 'Bank',
                'balance'      => (float) ($bankLedger['selected_account']['balance'] ?? 0),
                'rows'         => array_slice(array_reverse($bankLedger['ledger_rows']), 0, 10),
            ],
            'subLedgerBalances' => [
                'ar_1100' => (float) ($arLedger['selected_account']['balance'] ?? 0),
                'ap_2100' => (float) ($apLedger['selected_account']['balance'] ?? 0),
            ],
            'relatedDocs' => $relatedDocs,
            'auditLogs'   => $auditLogs,
        ]);
    }
}

