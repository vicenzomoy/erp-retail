<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerInvoiceLine extends Model
{
    protected $table = 'customer_invoice_lines';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'customer_invoice_id',
        'delivery_order_line_id',
        'so_line_id',
        'variant_sku',
        'description',
        'qty_invoiced',
        'unit_price',
        'discount_pct',
        'tax_id',
        'subtotal_before_tax',
        'tax_amount',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'qty_invoiced'        => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'discount_pct'        => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
            'created_at'          => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(CustomerInvoice::class, 'customer_invoice_id');
    }

    public function deliveryOrderLine(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrderLine::class, 'delivery_order_line_id');
    }

    public function soLine(): BelongsTo
    {
        return $this->belongsTo(SalesOrderLine::class, 'so_line_id');
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

