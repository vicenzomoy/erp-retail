<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\StockMove;
use App\Services\Inventory\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * List all products & SKU variants with On Hand and Available quantities.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');
        $color = $request->query('color', 'all');
        $size = $request->query('size', 'all');

        $query = Product::with('vendor')->orderBy('variant_sku');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('variant_sku', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        if ($color !== 'all') {
            $query->where('color', $color);
        }

        if ($size !== 'all') {
            $query->where('size', $size);
        }

        $products = $query->get()->map(function ($p) {
            $onHand = (float) $this->stockService->getOnHand($p->variant_sku);
            $reserved = (float) $this->stockService->getReserved($p->variant_sku);
            $available = $onHand - $reserved;

            return [
                'variant_sku' => $p->variant_sku,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'sales_price' => $p->sales_price,
                'cost' => $p->cost,
                'default_vendor' => $p->default_vendor,
                'vendor_name' => $p->vendor?->name,
                'on_hand' => $onHand,
                'reserved' => $reserved,
                'available' => $available,
                'valuation' => $onHand * $p->cost,
            ];
        });

        // Filter options
        $availableColors = Product::distinct()->pluck('color');
        $availableSizes = Product::distinct()->pluck('size');

        return Inertia::render('Inventory/Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'color' => $color,
                'size' => $size,
            ],
            'availableColors' => $availableColors,
            'availableSizes' => $availableSizes,
        ]);
    }

    /**
     * Show Product Form View with Stock by Location breakdown (T-07).
     */
    public function show(string $sku): Response
    {
        $product = Product::with('vendor')->findOrFail($sku);
        $locations = WarehouseLocation::orderBy('location_code')->get();

        $locationStock = [];
        $totalOnHand = 0;
        $totalReserved = 0;
        $totalAvailable = 0;

        foreach ($locations as $loc) {
            $onHand = (float) $this->stockService->getOnHand($product->variant_sku, $loc->location_code);
            $reserved = (float) $this->stockService->getReserved($product->variant_sku, $loc->location_code);
            $available = $onHand - $reserved;
            $val = $onHand * $product->cost;

            $locationStock[] = [
                'location_code' => $loc->location_code,
                'location_name' => $loc->location_name,
                'city' => $loc->city,
                'on_hand' => $onHand,
                'reserved' => $reserved,
                'available' => $available,
                'valuation' => $val,
            ];

            $totalOnHand += $onHand;
            $totalReserved += $reserved;
            $totalAvailable += $available;
        }

        $moves = StockMove::where('variant_sku', $product->variant_sku)
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Inventory/Products/Show', [
            'product' => [
                'variant_sku' => $product->variant_sku,
                'name' => $product->name,
                'size' => $product->size,
                'color' => $product->color,
                'unit' => $product->unit,
                'sales_price' => $product->sales_price,
                'cost' => $product->cost,
                'default_vendor' => $product->default_vendor,
                'vendor_name' => $product->vendor?->name,
                'total_on_hand' => $totalOnHand,
                'total_reserved' => $totalReserved,
                'total_available' => $totalAvailable,
                'total_valuation' => $totalOnHand * $product->cost,
            ],
            'locationStock' => $locationStock,
            'recentMoves' => $moves->map(fn ($m) => [
                'id' => $m->id,
                'date' => $m->done_at?->format('d/m/Y H:i'),
                'type' => $m->source_document_type,
                'ref' => $m->source_document_id,
                'from' => $m->location_from,
                'to' => $m->location_to,
                'qty' => (float) $m->qty_done,
            ]),
        ]);
    }

    /**
     * Update product details without affecting other variants (T-08).
     */
    public function update(Request $request, string $sku): RedirectResponse
    {
        $product = Product::findOrFail($sku);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sales_price' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'color' => 'required|string|max:50',
            'size' => 'required|string|max:50',
        ]);

        $oldValues = $product->toArray();

        // Update product using DB direct update since Master Product model has guarded = ['*']
        \DB::table('products')->where('variant_sku', $sku)->update([
            'name' => $validated['name'],
            'sales_price' => $validated['sales_price'],
            'cost' => $validated['cost'],
            'color' => $validated['color'],
            'size' => $validated['size'],
        ]);

        AuditLog::record(
            action: 'UPDATE_PRODUCT_VARIANT',
            status: 'SUCCESS',
            actorUserId: $request->user()?->id,
            actorUsername: $request->user()?->name ?? 'system',
            actorRole: $request->user()?->role_id ?? 'system',
            documentType: 'product',
            documentId: $sku,
            oldValue: $oldValues,
            newValue: $validated,
            notes: "Perubahan varian SKU {$sku}. Varian lain tetap independen (SR-21)."
        );

        return redirect()->route('inventory.products.show', $sku)
            ->with('success', "Atribut produk varian {$sku} berhasil diperbarui.");
    }

    /**
     * Stock by Location matrix view (T-07).
     */
    public function stockByLocation(): Response
    {
        $matrix = $this->stockService->getStockByLocationMatrix();
        $locations = WarehouseLocation::orderBy('location_code')->get();

        return Inertia::render('Inventory/Products/StockByLocation', [
            'matrix' => $matrix,
            'locations' => $locations,
            'summary' => [
                'total_on_hand' => collect($matrix)->sum('company_total_qty'),
                'total_reserved' => collect($matrix)->sum('company_reserved_qty'),
                'total_available' => collect($matrix)->sum('company_available_qty'),
                'total_valuation' => collect($matrix)->sum('standard_value'),
            ],
        ]);
    }
}

