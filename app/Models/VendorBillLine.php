<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorBillLine extends Model
{
    protected $table = 'vendor_bill_lines';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'vendor_bill_id',
        'receipt_line_id',
        'po_line_id',
        'variant_sku',
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
            'qty_billed'          => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
            'created_at'          => 'datetime',
        ];
    }

    public function vendorBill(): BelongsTo
    {
        return $this->belongsTo(VendorBill::class, 'vendor_bill_id');
    }

    public function receiptLine(): BelongsTo
    {
        return $this->belongsTo(ReceiptLine::class, 'receipt_line_id');
    }

    public function poLine(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderLine::class, 'po_line_id');
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

