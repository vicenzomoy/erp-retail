<?php

namespace App\Models;

use App\Models\Master\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptLine extends Model
{
    protected $table = 'receipt_lines';

    protected $fillable = [
        'receipt_id',
        'po_line_id',
        'variant_sku',
        'qty_expected',
        'qty_accepted',
        'qty_rejected',
        'rejection_reason',
        'unit_cost',
        'accepted_value',
    ];

    protected function casts(): array
    {
        return [
            'qty_expected'   => 'decimal:3',
            'qty_accepted'   => 'decimal:3',
            'qty_rejected'   => 'decimal:3',
            'unit_cost'      => 'decimal:2',
            'accepted_value' => 'decimal:2',
        ];
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class, 'receipt_id');
    }

    public function poLine(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderLine::class, 'po_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    /**
     * Validate that accepted + rejected <= expected (Three-Way Match guard).
     */
    public function isQuantityValid(): bool
    {
        return bccomp(
            bcadd((string) $this->qty_accepted, (string) $this->qty_rejected, 3),
            (string) $this->qty_expected,
            3
        ) <= 0;
    }
}

