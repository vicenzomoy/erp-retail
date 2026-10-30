<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'variant_sku';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'sales_price' => 'integer',
            'cost'        => 'integer',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(ContactVendor::class, 'default_vendor', 'id');
    }
}

