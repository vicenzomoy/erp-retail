<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseVendorController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');

        $query = ContactVendor::withCount('purchaseOrders')
            ->withSum('purchaseOrders', 'grand_total')
            ->orderBy('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%")
                  ->orWhere('city', 'ilike', "%{$search}%");
            });
        }

        $vendors = $query->paginate(15)->through(fn (ContactVendor $v) => [
            'id' => $v->id,
            'name' => $v->name,
            'city' => $v->city,
            'payment_terms' => $v->payment_terms,
            'purchase_orders_count' => $v->purchase_orders_count,
            'total_spent' => (float) ($v->purchase_orders_sum_grand_total ?? 0),
        ]);

        return Inertia::render('Purchase/Vendors/Index', [
            'vendors' => $vendors,
            'filters' => [
                'search' => $search,
            ],
            'totalCount' => ContactVendor::count(),
        ]);
    }

    public function create(): Response
    {
        $maxNum = 0;
        foreach (ContactVendor::pluck('id') as $id) {
            if (preg_match('/^V(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }
        $nextId = sprintf('V%02d', $maxNum + 1);

        $paymentTerms = PaymentTerm::all(['term_id', 'description'])->toArray();

        return Inertia::render('Purchase/Vendors/Create', [
            'nextId' => $nextId,
            'paymentTerms' => $paymentTerms,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => 'required|string|max:10|unique:contacts_vendors,id',
            'name' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'payment_terms' => 'required|string|exists:payment_terms,term_id',
        ]);

        $vendor = ContactVendor::create($validated);

        AuditLog::record(
            action: 'CREATE_VENDOR',
            status: 'SUCCESS',
            actorUserId: $request->user()?->id,
            actorUsername: $request->user()?->name ?? 'system',
            actorRole: $request->user()?->role_id ?? 'procurement',
            documentType: 'vendor',
            documentId: $vendor->id,
            notes: "Vendor baru {$vendor->name} ({$vendor->id}) berhasil ditambahkan."
        );

        return redirect()->route('purchase.vendors.show', $vendor->id)
            ->with('success', "Vendor {$vendor->name} berhasil ditambahkan.");
    }

    public function show(string $id): Response
    {
        $vendor = ContactVendor::with(['purchaseOrders.lines', 'vendorBills'])
            ->findOrFail($id);

        $pricelists = DB::table('vendor_pricelist')
            ->join('products', 'vendor_pricelist.variant_sku', '=', 'products.variant_sku')
            ->where('vendor_pricelist.vendor_id', $vendor->id)
            ->select(
                'vendor_pricelist.*',
                'products.name as product_name',
                'products.size',
                'products.color',
                'products.unit'
            )
            ->get();

        $orders = $vendor->purchaseOrders()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($po) => [
                'id' => $po->id,
                'status' => $po->status,
                'grand_total' => (float) $po->grand_total,
                'created_at' => $po->created_at?->format('d/m/Y H:i'),
                'total_ordered' => (float) $po->lines->sum('qty_ordered'),
            ]);

        $bills = $vendor->vendorBills()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'status' => $b->status,
                'grand_total' => (float) $b->grand_total,
                'amount_residual' => (float) $b->amount_residual,
                'created_at' => $b->created_at?->format('d/m/Y'),
            ]);

        return Inertia::render('Purchase/Vendors/Show', [
            'vendor' => [
                'id' => $vendor->id,
                'name' => $vendor->name,
                'city' => $vendor->city,
                'payment_terms' => $vendor->payment_terms,
            ],
            'pricelists' => $pricelists,
            'orders' => $orders,
            'bills' => $bills,
            'stats' => [
                'total_orders' => $vendor->purchaseOrders()->count(),
                'total_spent' => (float) $vendor->purchaseOrders()->whereIn('status', ['confirmed', 'done'])->sum('grand_total'),
                'open_bills_amount' => (float) $vendor->vendorBills()->where('status', 'posted')->sum('amount_residual'),
            ],
        ]);
    }
}

