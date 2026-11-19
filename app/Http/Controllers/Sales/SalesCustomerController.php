<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\ContactCustomer;
use App\Models\Master\PaymentTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesCustomerController extends Controller
{
    private function computeUtilization(string $openAr, string $creditLimit): string
    {
        if (bccomp($creditLimit, '0', 2) > 0) {
            return number_format(
                (float) bcdiv(bcmul($openAr, '100', 10), $creditLimit, 10),
                2,
                '.',
                ''
            );
        }

        if (bccomp($openAr, '0', 2) > 0) {
            return '100.00';
        }

        return '0.00';
    }

    private function generateNextCustomerId(): string
    {
        $ids = ContactCustomer::withTrashed()->pluck('id');
        $maxNum = 0;

        foreach ($ids as $id) {
            if (preg_match('/^C(\d+)$/i', (string) $id, $m)) {
                $maxNum = max($maxNum, (int) $m[1]);
            }
        }

        return 'C' . str_pad((string) ($maxNum + 1), 3, '0', STR_PAD_LEFT);
    }

    // -------------------------------------------------------------------------
    // Index — List of customers with AR/credit summary
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $customers = ContactCustomer::orderBy('id')->get()->map(function (ContactCustomer $c) {
            $openAr         = $c->open_ar;
            $creditLimit    = (string) $c->credit_limit;
            $utilizationPct = $this->computeUtilization($openAr, $creditLimit);

            return [
                'id'                 => $c->id,
                'name'               => $c->name,
                'type'               => $c->type ?? null,
                'city'               => $c->city ?? null,
                'address'            => $c->address,
                'credit_limit'       => $creditLimit,
                'payment_terms'      => $c->payment_terms,
                'open_ar'            => $openAr,
                'credit_utilization' => $utilizationPct,
            ];
        })->values()->all();

        $isOwner = $request->user()?->role_id === 'owner';
        $deletedCustomers = $isOwner
            ? ContactCustomer::onlyTrashed()->orderBy('id')->get()->map(fn (ContactCustomer $c) => [
                'id'            => $c->id,
                'name'          => $c->name,
                'type'          => $c->type,
                'city'          => $c->city,
                'credit_limit'  => (string) $c->credit_limit,
                'payment_terms' => $c->payment_terms,
                'deleted_at'    => $c->deleted_at?->format('d/m/Y H:i'),
            ])->values()->all()
            : [];

        $paymentTerms = PaymentTerm::orderBy('term_id')->get(['term_id', 'description']);

        return Inertia::render('Sales/Customers/Index', [
            'customers'        => $customers,
            'deletedCustomers' => $deletedCustomers,
            'paymentTerms'     => $paymentTerms,
            'nextId'           => $this->generateNextCustomerId(),
            'inCrm'            => $request->routeIs('crm.*'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Store — Create a new customer
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'type'          => ['required', 'string', 'max:50'],
            'city'          => ['required', 'string', 'max:100'],
            'address'       => ['nullable', 'string', 'max:500'],
            'credit_limit'  => ['required', 'integer', 'min:0'],
            'payment_terms' => ['required', 'string', 'exists:payment_terms,term_id'],
        ], [
            'name.required'          => 'Nama pelanggan wajib diisi.',
            'type.required'          => 'Tipe pelanggan wajib dipilih.',
            'city.required'          => 'Kota pelanggan wajib diisi.',
            'credit_limit.required'  => 'Limit kredit wajib diisi.',
            'payment_terms.required' => 'Termin pembayaran wajib dipilih.',
        ]);

        $customer = DB::transaction(function () use ($validated, $request) {
            $customerId = $this->generateNextCustomerId();

            $customer = ContactCustomer::create([
                'id'            => $customerId,
                'name'          => $validated['name'],
                'type'          => $validated['type'],
                'city'          => $validated['city'],
                'address'       => $validated['address'] ?? null,
                'credit_limit'  => $validated['credit_limit'],
                'payment_terms' => $validated['payment_terms'],
            ]);

            AuditLog::record(
                action: 'CREATE_CUSTOMER',
                status: 'SUCCESS',
                actorUserId: $request->user()?->id,
                actorUsername: $request->user()?->name ?? 'system',
                actorRole: $request->user()?->role_id ?? 'sales',
                documentType: 'customer',
                documentId: $customer->id,
                newValue: $customer->toArray(),
                notes: "Pelanggan baru {$customer->name} ({$customer->id}) berhasil ditambahkan."
            );

            return $customer;
        });

        $targetRoute = $request->routeIs('crm.*') ? 'crm.customers.index' : 'sales.customers.index';

        return redirect()
            ->route($targetRoute)
            ->with('success', "Pelanggan {$customer->name} ({$customer->id}) berhasil ditambahkan.");
    }

    // -------------------------------------------------------------------------
    // Show — Customer detail with SOs and invoices
    // -------------------------------------------------------------------------

    public function show(Request $request, string $id): Response
    {
        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::findOrFail($id);

        $salesOrders = $customer->salesOrders()
            ->withCount('lines')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($so) => [
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
            ->map(fn ($inv) => [
                'id'              => $inv->id,
                'status'          => $inv->status,
                'grand_total'     => (string) $inv->grand_total,
                'amount_residual' => (string) $inv->amount_residual,
                'invoice_date'    => $inv->invoice_date?->toDateString(),
                'due_date'        => $inv->due_date?->toDateString(),
            ]);

        $openAr         = $customer->open_ar;
        $creditLimit    = (string) $customer->credit_limit;
        $utilizationPct = $this->computeUtilization($openAr, $creditLimit);
        $paymentTerms   = PaymentTerm::orderBy('term_id')->get(['term_id', 'description']);

        return Inertia::render('Sales/Customers/Show', [
            'customer' => [
                'id'                 => $customer->id,
                'name'               => $customer->name,
                'type'               => $customer->type ?? null,
                'city'               => $customer->city ?? null,
                'address'            => $customer->address,
                'credit_limit'       => $creditLimit,
                'payment_terms'      => $customer->payment_terms,
                'open_ar'            => $openAr,
                'credit_utilization' => $utilizationPct,
            ],
            'sales_orders' => $salesOrders,
            'invoices'     => $invoices,
            'paymentTerms' => $paymentTerms,
            'inCrm'        => $request->routeIs('crm.*'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Update — Update customer profile, credit_limit, and payment_terms
    // -------------------------------------------------------------------------

    public function update(Request $request, string $id): RedirectResponse
    {
        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::findOrFail($id);

        $validated = $request->validate([
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'type'          => ['sometimes', 'required', 'string', 'max:50'],
            'city'          => ['sometimes', 'required', 'string', 'max:100'],
            'address'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'credit_limit'  => ['required', 'integer', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'exists:payment_terms,term_id'],
        ]);

        $oldValues = [
            'name'          => $customer->name,
            'type'          => $customer->type,
            'city'          => $customer->city,
            'address'       => $customer->address,
            'credit_limit'  => $customer->credit_limit,
            'payment_terms' => $customer->payment_terms,
        ];

        $newValues = [
            'name'          => $validated['name'] ?? $customer->name,
            'type'          => $validated['type'] ?? $customer->type,
            'city'          => $validated['city'] ?? $customer->city,
            'address'       => array_key_exists('address', $validated) ? $validated['address'] : $customer->address,
            'credit_limit'  => $validated['credit_limit'],
            'payment_terms' => $validated['payment_terms'] ?? $customer->payment_terms,
        ];

        DB::transaction(function () use ($customer, $newValues, $oldValues, $request, $id) {
            $customer->update($newValues);

            AuditLog::record(
                action: 'UPDATE_CUSTOMER',
                status: 'SUCCESS',
                actorUserId: $request->user()?->id,
                actorUsername: $request->user()?->name ?? 'system',
                actorRole: $request->user()?->role_id ?? 'user',
                documentType: 'customer',
                documentId: $id,
                oldValue: $oldValues,
                newValue: $newValues,
                notes: "Data pelanggan {$customer->name} ({$id}) berhasil diperbarui."
            );
        });

        if ($request->boolean('from_index')) {
            $indexRoute = $request->routeIs('crm.*') ? 'crm.customers.index' : 'sales.customers.index';
            return redirect()
                ->route($indexRoute)
                ->with('success', "Data pelanggan {$customer->name} berhasil diperbarui.");
        }

        $targetRoute = $request->routeIs('crm.*') ? 'crm.customers.show' : 'sales.customers.show';

        return redirect()
            ->route($targetRoute, $id)
            ->with('success', "Data pelanggan {$customer->name} berhasil diperbarui.");
    }

    // -------------------------------------------------------------------------
    // Destroy — Soft delete customer
    // -------------------------------------------------------------------------

    public function destroy(Request $request, string $id): RedirectResponse
    {
        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::findOrFail($id);

        $hasActiveOrders = $customer->salesOrders()
            ->whereIn('status', ['draft', 'confirmed'])
            ->exists();

        if ($hasActiveOrders) {
            return redirect()->back()
                ->with('error', "Pelanggan {$customer->name} ({$customer->id}) tidak dapat dihapus karena masih memiliki Sales Order aktif.");
        }

        $hasUnpaidInvoices = $customer->customerInvoices()
            ->where('status', 'posted')
            ->where('amount_residual', '>', 0)
            ->exists();

        if ($hasUnpaidInvoices) {
            return redirect()->back()
                ->with('error', "Pelanggan {$customer->name} ({$customer->id}) tidak dapat dihapus karena masih memiliki piutang (AR) yang belum lunas.");
        }

        $customerName = $customer->name;
        $customerId   = $customer->id;

        DB::transaction(function () use ($customer, $request, $customerId, $customerName) {
            $customer->delete();

            AuditLog::record(
                action: 'DELETE_CUSTOMER',
                status: 'SUCCESS',
                actorUserId: $request->user()?->id,
                actorUsername: $request->user()?->name ?? 'system',
                actorRole: $request->user()?->role_id ?? 'sales',
                documentType: 'customer',
                documentId: $customerId,
                notes: "Pelanggan {$customerName} ({$customerId}) berhasil di-soft delete."
            );
        });

        $indexRoute = $request->routeIs('crm.*') ? 'crm.customers.index' : 'sales.customers.index';

        return redirect()
            ->route($indexRoute)
            ->with('success', "Pelanggan {$customerName} ({$customerId}) berhasil dihapus (dapat dipulihkan oleh Admin/Owner).");
    }

    // -------------------------------------------------------------------------
    // Restore — Restore soft-deleted customer (Admin / Owner only)
    // -------------------------------------------------------------------------

    public function restore(Request $request, string $id): RedirectResponse
    {
        if ($request->user()?->role_id !== 'owner') {
            abort(403, 'Hanya Admin/Owner yang dapat memulihkan pelanggan yang telah dihapus.');
        }

        /** @var ContactCustomer $customer */
        $customer = ContactCustomer::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($customer, $request) {
            $customer->restore();

            AuditLog::record(
                action: 'RESTORE_CUSTOMER',
                status: 'SUCCESS',
                actorUserId: $request->user()?->id,
                actorUsername: $request->user()?->name ?? 'system',
                actorRole: $request->user()?->role_id ?? 'owner',
                documentType: 'customer',
                documentId: $customer->id,
                notes: "Pelanggan {$customer->name} ({$customer->id}) berhasil dipulihkan oleh Admin/Owner."
            );
        });

        $indexRoute = $request->routeIs('crm.*') ? 'crm.customers.index' : 'sales.customers.index';

        return redirect()
            ->route($indexRoute)
            ->with('success', "Pelanggan {$customer->name} ({$customer->id}) berhasil dipulihkan.");
    }
}
