<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReservation extends Model
{
    protected $table = 'stock_reservations';

    protected $fillable = [
        'sales_order_id',
        'so_line_id',
        'variant_sku',
        'location_code',
        'qty_reserved',
        'status',
        'reserved_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'qty_reserved' => 'decimal:3',
            'reserved_at'  => 'datetime',
            'released_at'  => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function soLine(): BelongsTo
    {
        return $this->belongsTo(SalesOrderLine::class, 'so_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_code', 'location_code');
    }

    /**
     * Compute Available-to-Promise (ATP) for a SKU at a location.
     * ATP = On Hand - Active Reservations
     */
    public static function getAvailable(string $sku, string $locationCode): string
    {
        $onHand = StockLedger::getOnHand($sku, $locationCode);
        $reserved = (string) self::where('variant_sku', $sku)
            ->where('location_code', $locationCode)
            ->where('status', 'active')
            ->sum('qty_reserved');

        return bcsub($onHand, $reserved, 3);
    }

    public function isActive(): bool { return $this->status === 'active'; }
}

