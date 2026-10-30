<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditNoteLine extends Model
{
    protected $table = 'credit_note_lines';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'credit_note_id',
        'original_invoice_line_id',
        'variant_sku',
        'condition',
        'qty_returned',
        'unit_price',
        'tax_id',
        'subtotal_before_tax',
        'tax_amount',
        'line_total',
        'cogs_reversal',
    ];

    protected function casts(): array
    {
        return [
            'qty_returned'        => 'decimal:3',
            'unit_price'          => 'decimal:2',
            'subtotal_before_tax' => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'line_total'          => 'decimal:2',
            'cogs_reversal'       => 'decimal:2',
            'created_at'          => 'datetime',
        ];
    }

    public function creditNote(): BelongsTo
    {
        return $this->belongsTo(CreditNote::class, 'credit_note_id');
    }

    public function originalInvoiceLine(): BelongsTo
    {
        return $this->belongsTo(CustomerInvoiceLine::class, 'original_invoice_line_id');
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

