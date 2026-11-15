<?php

namespace App\Services\Inventory;

use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\StockLedger;
use App\Models\StockReservation;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Get On-Hand quantity for a SKU (optionally filtered by location).
     */
    public function getOnHand(string $sku, ?string $locationCode = null): string
    {
        $query = StockLedger::where('variant_sku', $sku);

        if ($locationCode) {
            $query->where('location_code', $locationCode);
        }

        $sum = $query->sum('qty_change');
        return number_format((float) $sum, 3, '.', '');
    }

    /**
     * Get Active Reserved quantity for a SKU (optionally filtered by location).
     */
    public function getReserved(string $sku, ?string $locationCode = null): string
    {
        $query = StockReservation::where('variant_sku', $sku)
            ->where('status', 'active');

        if ($locationCode) {
            $query->where('location_code', $locationCode);
        }

        $sum = $query->sum('qty_reserved');
        return number_format((float) $sum, 3, '.', '');
    }

    /**
     * Get Available-To-Promise (ATP) = OnHand - Reserved.
     */
    public function getAvailable(string $sku, ?string $locationCode = null): string
    {
        $onHand = $this->getOnHand($sku, $locationCode);
        $reserved = $this->getReserved($sku, $locationCode);

        return bcsub($onHand, $reserved, 3);
    }

    /**
     * Calculate current valuation of inventory.
     */
    public function getValuation(?string $sku = null, ?string $locationCode = null): string
    {
        $query = StockLedger::query();

        if ($sku) {
            $query->where('variant_sku', $sku);
        }
        if ($locationCode) {
            $query->where('location_code', $locationCode);
        }

        $sum = $query->sum('total_value_change');
        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * Get full stock matrix: Products x Locations with On Hand, Reserved, Available, Value.
     */
    public function getStockByLocationMatrix(): array
    {
        $products = Product::orderBy('variant_sku')->get();
        $locations = WarehouseLocation::orderBy('location_code')->get();

        $matrix = [];

        foreach ($products as $p) {
            $locData = [];
            $totalOnHand = '0.000';
            $totalReserved = '0.000';
            $totalAvailable = '0.000';
            $totalValuation = '0.00';

            foreach ($locations as $loc) {
                $onHand = $this->getOnHand($p->variant_sku, $loc->location_code);
                $reserved = $this->getReserved($p->variant_sku, $loc->location_code);
                $available = bcsub($onHand, $reserved, 3);
                $valuation = bcmul($onHand, (string) $p->cost, 2);

                $locData[$loc->location_code] = [
                    'location_name' => $loc->location_name,
                    'on_hand' => (float) $onHand,
                    'reserved' => (float) $reserved,
                    'available' => (float) $available,
                    'valuation' => (float) $valuation,
                ];

                $totalOnHand = bcadd($totalOnHand, $onHand, 3);
                $totalReserved = bcadd($totalReserved, $reserved, 3);
                $totalAvailable = bcadd($totalAvailable, $available, 3);
                $totalValuation = bcadd($totalValuation, $valuation, 2);
            }

            $matrix[] = [
                'variant_sku' => $p->variant_sku,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'sales_price' => $p->sales_price,
                'cost' => $p->cost,
                'default_vendor' => $p->default_vendor,
                'company_total_qty' => (float) $totalOnHand,
                'company_reserved_qty' => (float) $totalReserved,
                'company_available_qty' => (float) $totalAvailable,
                'standard_value' => (float) $totalValuation,
                'locations' => $locData,
            ];
        }

        return $matrix;
    }

    /**
     * Get Stock Forecast Report (ATP report).
     */
    public function getStockForecastReport(?string $locationCode = null): array
    {
        $products = Product::orderBy('variant_sku')->get();
        $report = [];

        foreach ($products as $p) {
            $onHand = $this->getOnHand($p->variant_sku, $locationCode);
            $reserved = $this->getReserved($p->variant_sku, $locationCode);
            $available = bcsub($onHand, $reserved, 3);

            // Active reservations details
            $resQuery = StockReservation::with('salesOrder.customer')
                ->where('variant_sku', $p->variant_sku)
                ->where('status', 'active');

            if ($locationCode) {
                $resQuery->where('location_code', $locationCode);
            }

            $reservations = $resQuery->get()->map(function ($r) {
                return [
                    'id' => $r->id,
                    'sales_order_id' => $r->sales_order_id,
                    'customer_name' => $r->salesOrder?->customer?->name ?? 'Pelanggan',
                    'location_code' => $r->location_code,
                    'qty_reserved' => (float) $r->qty_reserved,
                    'reserved_at' => $r->reserved_at?->format('d/m/Y H:i'),
                ];
            });

            $report[] = [
                'variant_sku' => $p->variant_sku,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'cost' => $p->cost,
                'sales_price' => $p->sales_price,
                'on_hand' => (float) $onHand,
                'reserved' => (float) $reserved,
                'available' => (float) $available,
                'forecasted' => (float) $available, // in pure spot ERP, forecast = available unless incoming PO added
                'reservations' => $reservations,
            ];
        }

        return $report;
    }

    /**
     * Get operational summary KPI counters.
     */
    public function getInventoryKPIs(): array
    {
        $totalOnHand = (float) StockLedger::sum('qty_change');
        $totalReserved = (float) StockReservation::where('status', 'active')->sum('qty_reserved');
        $totalAvailable = $totalOnHand - $totalReserved;
        $totalValue = (float) StockLedger::sum('total_value_change');

        // Low stock calculations
        $lowStockAlerts = $this->getLowStockAlerts(10);
        $lowStockCount = count($lowStockAlerts);
        $outOfStockCount = count(array_filter($lowStockAlerts, fn ($a) => $a['available'] <= 0));

        // Operations counts
        $receiptsToProcess = DB::table('receipts')->whereIn('status', ['draft', 'ready'])->count();
        $receiptsDone = DB::table('receipts')->where('status', 'validated')->count();

        $deliveriesToProcess = DB::table('delivery_orders')->whereIn('status', ['draft', 'ready'])->count();
        $deliveriesDone = DB::table('delivery_orders')->where('status', 'done')->count();
        $deliveriesBackorder = DB::table('delivery_orders')->where('is_backorder', true)->whereIn('status', ['draft', 'ready'])->count();

        $transfersToProcess = DB::table('internal_transfers')->whereIn('status', ['draft', 'ready'])->count();
        $transfersDone = DB::table('internal_transfers')->where('status', 'done')->count();

        return [
            'total_on_hand' => $totalOnHand,
            'total_reserved' => $totalReserved,
            'total_available' => $totalAvailable,
            'total_valuation' => $totalValue,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'receipts' => [
                'to_process' => $receiptsToProcess,
                'done' => $receiptsDone,
            ],
            'deliveries' => [
                'to_process' => $deliveriesToProcess,
                'done' => $deliveriesDone,
                'backorders' => $deliveriesBackorder,
            ],
            'transfers' => [
                'to_process' => $transfersToProcess,
                'done' => $transfersDone,
            ],
        ];
    }

    /**
     * Get products with low or depleted stock (ATP <= threshold).
     */
    public function getLowStockAlerts(int $threshold = 10): array
    {
        $products = Product::orderBy('name')->get();
        $alerts = [];

        foreach ($products as $p) {
            $onHand = (float) $this->getOnHand($p->variant_sku);
            $reserved = (float) $this->getReserved($p->variant_sku);
            $available = $onHand - $reserved;

            if ($available <= $threshold) {
                $status = 'warning';
                if ($available <= 0) {
                    $status = 'out_of_stock';
                } elseif ($available <= 5) {
                    $status = 'critical';
                }

                $alerts[] = [
                    'sku' => $p->variant_sku,
                    'name' => $p->name,
                    'size' => $p->size,
                    'color' => $p->color,
                    'unit' => $p->unit,
                    'on_hand' => $onHand,
                    'reserved' => $reserved,
                    'available' => $available,
                    'status' => $status,
                ];
            }
        }

        usort($alerts, fn ($a, $b) => $a['available'] <=> $b['available']);

        return $alerts;
    }

    /**
     * Low-stock alerts for a specific retail store (e.g. TOKO-PKU), enriched with
     * the replenishment source (warehouse) stock so the user can trigger an
     * internal transfer. If the company-wide ATP is itself under the threshold,
     * the row is flagged `company_low` so the UI can warn that the warehouse
     * cannot really cover it (a purchase is needed instead).
     */
    public function getStoreLowStockAlerts(
        string $storeCode = 'TOKO-PKU',
        string $warehouseCode = 'WH-PKU',
        int $threshold = 10
    ): array {
        // Aggregate in 2 queries instead of N*M per-product queries.
        $onHandBy = StockLedger::select('variant_sku', 'location_code', DB::raw('SUM(qty_change) as qty'))
            ->groupBy('variant_sku', 'location_code')
            ->get()
            ->groupBy('variant_sku');

        $reservedBy = StockReservation::where('status', 'active')
            ->select('variant_sku', 'location_code', DB::raw('SUM(qty_reserved) as qty'))
            ->groupBy('variant_sku', 'location_code')
            ->get()
            ->groupBy('variant_sku');

        $sumFor = function ($rows, ?string $location = null): float {
            if (! $rows) {
                return 0.0;
            }

            return (float) $rows
                ->when($location, fn ($c) => $c->where('location_code', $location))
                ->sum('qty');
        };

        $targetLevel = $threshold * 2; // isi ulang gerai sampai 2x ambang batas
        $alerts = [];

        foreach (Product::orderBy('name')->get() as $p) {
            $onHandRows = $onHandBy->get($p->variant_sku);
            $reservedRows = $reservedBy->get($p->variant_sku);

            $storeOnHand = $sumFor($onHandRows, $storeCode);
            $storeAvailable = $storeOnHand - $sumFor($reservedRows, $storeCode);

            if ($storeAvailable > $threshold) {
                continue;
            }

            $warehouseAvailable = $sumFor($onHandRows, $warehouseCode) - $sumFor($reservedRows, $warehouseCode);
            $companyAvailable = $sumFor($onHandRows) - $sumFor($reservedRows);

            $status = 'warning';
            if ($storeAvailable <= 0) {
                $status = 'out_of_stock';
            } elseif ($storeAvailable <= 5) {
                $status = 'critical';
            }

            $needed = max(0, $targetLevel - $storeAvailable);
            $suggestedQty = (int) floor(min($needed, max(0, $warehouseAvailable)));

            $alerts[] = [
                'sku' => $p->variant_sku,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'store_on_hand' => $storeOnHand,
                'store_available' => $storeAvailable,
                'warehouse_available' => $warehouseAvailable,
                'company_available' => $companyAvailable,
                'company_low' => $companyAvailable <= $threshold,
                'suggested_qty' => $suggestedQty,
                'status' => $status,
            ];
        }

        usort($alerts, fn ($a, $b) => $a['store_available'] <=> $b['store_available']);

        return $alerts;
    }
}

