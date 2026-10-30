<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrderLine extends Model
{
    protected $table = 'sales_order_lines';

    protected $fillable = [
        'sales_order_id',
        'variant_sku',
        'qty_ordered',
        'qty_delivered',
        'qty_invoiced',
        'unit_price',
        'discount_pct',
        'tax_id',
        'subtotal_before_tax',
        'tax_amount',
        'line_total',
        'price_locked_at',
    ];

    protected function casts(): array
    {
        return [
            'qty_ordered'         => 'decimal:3',
            'qty_delivered'       => 'decimal:3',
            'qty_invoiced'        => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'discount_pct'        => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
            'price_locked_at'     => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_id', 'tax_id');
    }

    public function deliveryOrderLines(): HasMany
    {
        return $this->hasMany(DeliveryOrderLine::class, 'so_line_id');
    }

    public function invoiceLines(): HasMany
    {
        return $this->hasMany(CustomerInvoiceLine::class, 'so_line_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'so_line_id');
    }

    /**
     * Qty that can still be invoiced = delivered - already invoiced
     */
    public function getQtyCanInvoiceAttribute(): string
    {
        return bcsub((string) $this->qty_delivered, (string) $this->qty_invoiced, 3);
    }
}

