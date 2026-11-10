<?php

namespace App\Models;

use App\Models\Master\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReturnLine extends Model
{
    protected $table = 'customer_return_lines';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'customer_return_id',
        'customer_invoice_line_id',
        'variant_sku',
        'qty_requested',
        'qty_inspected',
        'qty_accepted',
        'qty_damaged',
        'unit_price',
        'condition',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'qty_requested' => 'decimal:3',
            'qty_inspected' => 'decimal:3',
            'qty_accepted'  => 'decimal:3',
            'qty_damaged'   => 'decimal:3',
            'unit_price'    => 'decimal:2',
            'created_at'    => 'datetime',
        ];
    }

    public function customerReturn(): BelongsTo
    {
        return $this->belongsTo(CustomerReturn::class, 'customer_return_id');
    }

    public function invoiceLine(): BelongsTo
    {
        return $this->belongsTo(CustomerInvoiceLine::class, 'customer_invoice_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }
}

