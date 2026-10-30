<?php

namespace App\Models;

use App\Models\Master\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryOrderLine extends Model
{
    protected $table = 'delivery_order_lines';

    protected $fillable = [
        'delivery_order_id',
        'so_line_id',
        'variant_sku',
        'qty_demand',
        'qty_done',
        'cogs_per_unit',
        'cogs_total',
    ];

    protected function casts(): array
    {
        return [
            'qty_demand'    => 'decimal:3',
            'qty_done'      => 'decimal:3',
            'cogs_per_unit' => 'decimal:2',
            'cogs_total'    => 'decimal:2',
        ];
    }

    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class, 'delivery_order_id');
    }

    public function soLine(): BelongsTo
    {
        return $this->belongsTo(SalesOrderLine::class, 'so_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }
}

