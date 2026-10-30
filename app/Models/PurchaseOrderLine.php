<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderLine extends Model
{
    protected $table = 'purchase_order_lines';

    protected $fillable = [
        'purchase_order_id',
        'variant_sku',
        'qty_ordered',
        'qty_received',
        'qty_billed',
        'unit_price',
        'tax_id',
        'subtotal_before_tax',
        'tax_amount',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'qty_ordered'         => 'decimal:3',
            'qty_received'        => 'decimal:3',
            'qty_billed'          => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_id', 'tax_id');
    }

    public function receiptLines(): HasMany
    {
        return $this->hasMany(ReceiptLine::class, 'po_line_id');
    }

    public function vendorBillLines(): HasMany
    {
        return $this->hasMany(VendorBillLine::class, 'po_line_id');
    }

    /**
     * Total accepted qty across all validated receipts for this PO line.
     */
    public function getTotalAcceptedQtyAttribute(): string
    {
        return (string) $this->receiptLines()
            ->whereHas('receipt', fn ($q) => $q->where('status', 'validated'))
            ->sum('qty_accepted');
    }
}

