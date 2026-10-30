<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosOrderLine extends Model
{
    protected $table = 'pos_order_lines';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'pos_order_id',
        'variant_sku',
        'qty',
        'unit_price',
        'tax_id',
        'subtotal_before_tax',
        'tax_amount',
        'line_total',
        'cogs_per_unit',
        'cogs_total',
        'scanned_barcode',
    ];

    protected function casts(): array
    {
        return [
            'qty'                 => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
            'cogs_per_unit'       => 'decimal:2',
            'cogs_total'          => 'decimal:2',
            'created_at'          => 'datetime',
        ];
    }

    public function posOrder(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'pos_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_id', 'tax_id');
    }
}

