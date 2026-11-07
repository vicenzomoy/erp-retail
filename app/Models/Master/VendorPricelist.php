<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPricelist extends Model
{
    protected $table = 'vendor_pricelist';
    public $timestamps = false;

    protected $fillable = [
        'vendor_id',
        'variant_sku',
        'min_qty',
        'unit_price',
        'currency',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(ContactVendor::class, 'vendor_id', 'id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }
}

