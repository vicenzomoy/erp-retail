<?php

namespace App\Services\Purchase;

use App\Models\Master\ContactVendor;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\PurchaseOrderLine;
use App\Services\Inventory\StockService;
use Illuminate\Support\Collection;

class PurchaseProductService
{
    public function __construct(
        protected StockService $stockService
    ) {}

    /**
     * Get products with procurement-specific data (Vendor, Purchase Cost, Min Order, Stock levels, Incoming POs).
     */
    public function getProductsForProcurement(array $filters = []): array
    {
        $search = $filters['search'] ?? '';
        $vendorId = $filters['vendor_id'] ?? 'all';
        $stockStatus = $filters['stock_status'] ?? 'all';
        $color = $filters['color'] ?? 'all';
        $size = $filters['size'] ?? 'all';

        $query = Product::with(['vendor', 'pricelists'])->orderBy('variant_sku');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('variant_sku', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%")
                    ->orWhereHas('vendor', function ($vq) use ($search) {
                        $vq->where('name', 'ilike', "%{$search}%")
                            ->orWhere('id', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($vendorId !== 'all') {
            $query->where('default_vendor', $vendorId);
        }

        if ($color !== 'all') {
            $query->where('color', $color);
        }

        if ($size !== 'all') {
            $query->where('size', $size);
        }

        // Pre-fetch pending incoming purchase order quantities for confirmed POs
        $incomingQuantities = PurchaseOrderLine::query()
            ->whereHas('purchaseOrder', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->selectRaw('variant_sku, SUM(GREATEST(0, qty_ordered - qty_received)) as incoming_qty')
            ->groupBy('variant_sku')
            ->pluck('incoming_qty', 'variant_sku')
            ->all();

        $products = $query->get()->map(function ($p) use ($incomingQuantities) {
            $onHand = (float) $this->stockService->getOnHand($p->variant_sku);
            $reserved = (float) $this->stockService->getReserved($p->variant_sku);
            $available = $onHand - $reserved;

            // Find specific vendor pricelist or first pricelist
            $pricelist = $p->pricelists->firstWhere('vendor_id', $p->default_vendor)
                ?? $p->pricelists->first();

            $minOrderQty = $pricelist ? (int) $pricelist->min_qty : 1;
            $purchasePrice = $pricelist ? (float) $pricelist->unit_price : (float) $p->cost;
            $incoming = (float) ($incomingQuantities[$p->variant_sku] ?? 0);

            // Reorder status
            if ($available <= 0) {
                $status = 'out_of_stock';
                $statusLabel = 'Stok Habis';
            } elseif ($available <= 10) {
                $status = 'low_stock';
                $statusLabel = 'Perlu Reorder';
            } else {
                $status = 'normal';
                $statusLabel = 'Stok Aman';
            }

            // Margin %
            $marginPct = $p->sales_price > 0
                ? round((($p->sales_price - $purchasePrice) / $p->sales_price) * 100, 1)
                : 0;

            return [
                'variant_sku' => $p->variant_sku,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'cost' => (float) $p->cost,
                'sales_price' => (float) $p->sales_price,
                'purchase_price' => $purchasePrice,
                'margin_pct' => $marginPct,
                // Procurement key data
                'default_vendor_id' => $p->default_vendor,
                'vendor_name' => $p->vendor?->name ?? 'Belum Ditentukan',
                'vendor_city' => $p->vendor?->city ?? '-',
                'vendor_payment_terms' => $p->vendor?->payment_terms ?? '-',
                'min_order_qty' => $minOrderQty,
                'currency' => $pricelist?->currency ?? 'IDR',
                // Stock levels
                'on_hand' => $onHand,
                'reserved' => $reserved,
                'available' => $available,
                'incoming' => $incoming,
                'valuation' => $onHand * $purchasePrice,
                'stock_status' => $status,
                'status_label' => $statusLabel,
            ];
        });

        // Filter by stock status if applied
        if ($stockStatus !== 'all') {
            $products = $products->filter(function ($item) use ($stockStatus) {
                return $item['stock_status'] === $stockStatus;
            })->values();
        }

        return $products->toArray();
    }

    /**
     * Get KPI Summary for Procurement Dashboard.
     */
    public function getProcurementKPIs(): array
    {
        $allProducts = Product::with(['vendor', 'pricelists'])->get();
        $totalSku = $allProducts->count();
        $lowStock = 0;
        $outOfStock = 0;
        $totalValuation = 0;
        $uniqueVendors = [];

        foreach ($allProducts as $p) {
            $onHand = (float) $this->stockService->getOnHand($p->variant_sku);
            $reserved = (float) $this->stockService->getReserved($p->variant_sku);
            $available = $onHand - $reserved;

            if ($available <= 0) {
                $outOfStock++;
            } elseif ($available <= 10) {
                $lowStock++;
            }

            $totalValuation += ($onHand * (float) $p->cost);

            if ($p->default_vendor) {
                $uniqueVendors[$p->default_vendor] = true;
            }
        }

        return [
            'total_sku' => $totalSku,
            'low_stock_count' => $lowStock,
            'out_of_stock_count' => $outOfStock,
            'reorder_needed_count' => $lowStock + $outOfStock,
            'total_valuation' => $totalValuation,
            'active_vendors_count' => count($uniqueVendors),
        ];
    }

    /**
     * Get filter options (Vendors, Colors, Sizes).
     */
    public function getFilterOptions(): array
    {
        return [
            'vendors' => ContactVendor::orderBy('name')->get(['id', 'name', 'city']),
            'colors' => Product::distinct()->orderBy('color')->pluck('color'),
            'sizes' => Product::distinct()->orderBy('size')->pluck('size'),
        ];
    }

    /**
     * Get stock by location breakdown for Procurement.
     */
    public function getStockByLocationData(): array
    {
        $matrix = $this->stockService->getStockByLocationMatrix();
        $locations = WarehouseLocation::orderBy('location_code')->get();

        // Enrich matrix with vendor and purchase price info for procurement
        $productsBySku = Product::with('vendor')->get()->keyBy('variant_sku');

        foreach ($matrix as &$row) {
            $prod = $productsBySku->get($row['variant_sku']);
            $row['vendor_name'] = $prod?->vendor?->name ?? '-';
            $row['default_vendor_id'] = $prod?->default_vendor ?? '-';
            $row['cost'] = (float) ($prod?->cost ?? 0);
        }
        unset($row);

        return [
            'matrix' => $matrix,
            'locations' => $locations,
            'summary' => [
                'total_on_hand' => collect($matrix)->sum('company_total_qty'),
                'total_reserved' => collect($matrix)->sum('company_reserved_qty'),
                'total_available' => collect($matrix)->sum('company_available_qty'),
                'total_valuation' => collect($matrix)->sum('standard_value'),
            ],
        ];
    }
}

