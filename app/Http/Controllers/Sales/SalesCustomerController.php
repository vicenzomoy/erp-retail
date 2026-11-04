<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Master\ContactCustomer;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesCustomerController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — List of customers with AR/credit summary
    // -------------------------------------------------------------------------

    public function index(): Response
    {
        $customers = ContactCustomer::all()->map(function (ContactCustomer $c) {
            $openAr        = $c->open_ar; // decimal string from accessor
            $creditLimit   = (string) $c->credit_limit;
            $utilizationPct = '0.00';

            if (bccomp($creditLimit, '0', 2) > 0) {
                $utilizationPct = number_format(
                    (float) bcdiv(bcmul($openAr, '100', 10), $creditLimit, 10),
                    2
                );
            }

            return [
                'id'                 => $c->id,
                'name'               => $c->name,
                'type'               => $c->type   ?? null,
                'city'               => $c->city   ?? null,
                'credit_limit'       => $creditLimit,
                'payment_terms'      => $c->payment_terms,
                'open_ar'            => $openAr,
                'credit_utilization' => $utilizationPct, // %
            ];
        })->values()->all();

        return Inertia::render('Sales/Customers/Index', [
            'customers' => $customers,
        ]);
    }

    // -------------------------------------------------------------------------
    // Show — Customer detail with SOs and invoices
    // -------------------------------------------------------------------------

    public function show(string $id): Response
    {
        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::findOrFail($id);

        $salesOrders = $customer->salesOrders()
            ->withCount('lines')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($so) => [
                'id'          => $so->id,
                'status'      => $so->status,
                'grand_total' => (string) $so->grand_total,
                'created_at'  => $so->created_at?->toIso8601String(),
                'credit_hold' => $so->credit_hold,
                'lines_count' => $so->lines_count,
            ]);

        $invoices = $customer->customerInvoices()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($inv) => [
                'id'              => $inv->id,
                'status'          => $inv->status,
                'grand_total'     => (string) $inv->grand_total,
                'amount_residual' => (string) $inv->amount_residual,
                'invoice_date'    => $inv->invoice_date?->toDateString(),
                'due_date'        => $inv->due_date?->toDateString(),
            ]);

        $openAr       = $customer->open_ar;
        $creditLimit  = (string) $customer->credit_limit;
        $utilizationPct = '0.00';

        if (bccomp($creditLimit, '0', 2) > 0) {
            $utilizationPct = number_format(
                (float) bcdiv(bcmul($openAr, '100', 10), $creditLimit, 10),
                2
            );
        }

        return Inertia::render('Sales/Customers/Show', [
            'customer' => [
                'id'                 => $customer->id,
                'name'               => $customer->name,
                'type'               => $customer->type   ?? null,
                'city'               => $customer->city   ?? null,
                'credit_limit'       => $creditLimit,
                'payment_terms'      => $customer->payment_terms,
                'open_ar'            => $openAr,
                'credit_utilization' => $utilizationPct,
            ],
            'sales_orders' => $salesOrders,
            'invoices'     => $invoices,
        ]);
    }

    // -------------------------------------------------------------------------
    // Update — Adjust credit_limit and/or payment_terms
    // -------------------------------------------------------------------------

    public function update(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'credit_limit'  => ['required', 'integer', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'exists:payment_terms,term_id'],
        ]);

        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::findOrFail($id);

        $oldValues = [
            'credit_limit'  => $customer->credit_limit,
            'payment_terms' => $customer->payment_terms,
        ];

        $customer->update([
            'credit_limit'  => $validated['credit_limit'],
            'payment_terms' => $validated['payment_terms'] ?? $customer->payment_terms,
        ]);

        AuditLog::record(
            action: 'CUSTOMER_CREDIT_UPDATED',
            status: 'success',
            actorUserId: $request->user()->id,
            actorUsername: $request->user()->name,
            actorRole: $request->user()->role_id ?? 'user',
            documentType: 'contact_customer',
            documentId: $id,
            oldValue: $oldValues,
            newValue: [
                'credit_limit'  => $validated['credit_limit'],
                'payment_terms' => $validated['payment_terms'] ?? $customer->payment_terms,
            ],
        );

        return redirect()
            ->route('sales.customers.show', $id)
            ->with('success', "Data pelanggan {$customer->name} berhasil diperbarui.");
    }
}
