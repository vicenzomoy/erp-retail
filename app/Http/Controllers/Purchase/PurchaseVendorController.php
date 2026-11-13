<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use App\Models\Master\Product;
use App\Models\Master\VendorPricelist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
        $nextId = $this->generateNextVendorId();

        $paymentTerms = PaymentTerm::all(['term_id', 'description'])->toArray();
        $products = Product::orderBy('name')
            ->orderBy('variant_sku')
            ->get(['variant_sku', 'name', 'size', 'color', 'unit', 'cost'])
            ->toArray();

        return Inertia::render('Purchase/Vendors/Create', [
            'nextId' => $nextId,
            'paymentTerms' => $paymentTerms,
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $idempotencyKey = $request->input('idempotency_key')
            ?: md5(json_encode([
                $request->input('name'),
                $request->input('city'),
                $request->input('payment_terms'),
                $request->input('lines'),
            ]));

        $cacheKey = "idempotency_create_vendor_{$idempotencyKey}";

        // Idempotency: Jika request sudah pernah diproses, kembalikan vendor yang sudah dibuat
        if ($existingId = Cache::get($cacheKey)) {
            $existingVendor = ContactVendor::find($existingId);
            if ($existingVendor) {
                return redirect()->route('purchase.vendors.show', $existingVendor->id)
                    ->with('success', "Vendor {$existingVendor->name} ({$existingVendor->id}) telah berhasil dibuat sebelumnya.");
            }
        }

        $validated = $request->validate([
            'idempotency_key' => 'nullable|string|max:64',
            'name' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'payment_terms' => 'required|string|exists:payment_terms,term_id',
            'lines' => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|string|exists:products,variant_sku|distinct',
            'lines.*.min_qty' => 'required|integer|min:1',
            'lines.*.unit_price' => 'required|numeric|min:1',
        ], [
            'name.required' => 'Nama perusahaan / pemasok wajib diisi.',
            'city.required' => 'Kota domisili / pabrik wajib diisi.',
            'payment_terms.required' => 'Termin pembayaran standar wajib dipilih.',
            'lines.required' => 'Wajib mendaftarkan minimal 1 barang yang dijual oleh vendor ini.',
            'lines.min' => 'Wajib mendaftarkan minimal 1 barang yang dijual oleh vendor ini.',
            'lines.*.variant_sku.required' => 'Barang / produk wajib dipilih.',
            'lines.*.variant_sku.distinct' => 'Produk tidak boleh dipilih lebih dari sekali (duplikat).',
            'lines.*.min_qty.required' => 'Min qty order wajib diisi.',
            'lines.*.min_qty.integer' => 'Min qty order harus berupa bilangan bulat.',
            'lines.*.min_qty.min' => 'Min qty order minimal 1 unit.',
            'lines.*.unit_price.required' => 'Harga satuan (price per unit) wajib diisi.',
            'lines.*.unit_price.min' => 'Harga satuan (price per unit) minimal Rp 1.',
        ]);

        // Race condition protection: Atomic lock saat membuat vendor baru
        $vendor = Cache::lock('create_vendor_lock', 10)->block(5, function () use ($validated, $request, $cacheKey) {
            // Check double-submit inside lock
            if ($existingId = Cache::get($cacheKey)) {
                $existingVendor = ContactVendor::find($existingId);
                if ($existingVendor) {
                    return $existingVendor;
                }
            }

            return DB::transaction(function () use ($validated, $request, $cacheKey) {
                $vendorId = $this->generateNextVendorId(true);

                $vendor = ContactVendor::create([
                    'id' => $vendorId,
                    'name' => $validated['name'],
                    'city' => $validated['city'],
                    'payment_terms' => $validated['payment_terms'],
                ]);

                foreach ($validated['lines'] as $line) {
                    VendorPricelist::create([
                        'vendor_id' => $vendor->id,
                        'variant_sku' => $line['variant_sku'],
                        'min_qty' => (int) $line['min_qty'],
                        'unit_price' => (int) $line['unit_price'],
                        'currency' => 'IDR',
                    ]);
                }

                Cache::put($cacheKey, $vendor->id, now()->addMinutes(10));

                AuditLog::record(
                    action: 'CREATE_VENDOR',
                    status: 'SUCCESS',
                    actorUserId: $request->user()?->id,
                    actorUsername: $request->user()?->name ?? 'system',
                    actorRole: $request->user()?->role_id ?? 'procurement',
                    documentType: 'vendor',
                    documentId: $vendor->id,
                    notes: "Vendor baru {$vendor->name} ({$vendor->id}) berhasil ditambahkan beserta " . count($validated['lines']) . " item pricelist barang."
                );

                return $vendor;
            });
        });

        return redirect()->route('purchase.vendors.show', $vendor->id)
            ->with('success', "Vendor {$vendor->name} ({$vendor->id}) berhasil ditambahkan beserta katalog produknya.");
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $vendor = ContactVendor::findOrFail($id);

        $hasActiveOrders = $vendor->purchaseOrders()
            ->whereIn('status', ['draft', 'confirmed'])
            ->exists();

        if ($hasActiveOrders) {
            return redirect()->back()
                ->with('error', "Vendor {$vendor->name} ({$vendor->id}) tidak dapat dihapus karena masih memiliki pesanan pembelian (PO) aktif.");
        }

        $vendorName = $vendor->name;
        $vendorId = $vendor->id;

        DB::transaction(function () use ($vendor, $request, $vendorId, $vendorName) {
            $vendor->delete(); // Soft deletes (updates deleted_at)

            AuditLog::record(
                action: 'DELETE_VENDOR',
                status: 'SUCCESS',
                actorUserId: $request->user()?->id,
                actorUsername: $request->user()?->name ?? 'system',
                actorRole: $request->user()?->role_id ?? 'procurement',
                documentType: 'vendor',
                documentId: $vendorId,
                notes: "Vendor {$vendorName} ({$vendorId}) berhasil di-soft delete oleh user."
            );
        });

        return redirect()->route('purchase.vendors.index')
            ->with('success', "Vendor {$vendorName} ({$vendorId}) berhasil dihapus.");
    }

    protected function generateNextVendorId(bool $forUpdate = false): string
    {
        $query = ContactVendor::withTrashed();
        if ($forUpdate && DB::transactionLevel() > 0) {
            $query->lockForUpdate();
        }

        $maxNum = 0;
        foreach ($query->pluck('id') as $id) {
            if (preg_match('/^V(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }
        return sprintf('V%02d', $maxNum + 1);
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

