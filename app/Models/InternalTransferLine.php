<?php

namespace App\Models;

use App\Models\Master\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalTransferLine extends Model
{
    protected $table = 'internal_transfer_lines';

    protected $fillable = [
        'internal_transfer_id',
        'variant_sku',
        'qty_demand',
        'qty_done',
        'unit_cost',
    ];

    protected function casts(): array
    {
        return [
            'qty_demand' => 'decimal:3',
            'qty_done'   => 'decimal:3',
            'unit_cost'  => 'decimal:2',
        ];
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(InternalTransfer::class, 'internal_transfer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }
}

