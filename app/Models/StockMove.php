<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMove extends Model
{
    protected $table = 'stock_moves';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'source_document_type',
        'source_document_id',
        'variant_sku',
        'location_from',
        'location_to',
        'qty_done',
        'unit_cost',
        'total_value',
        'journal_entry_id',
        'state',
        'done_at',
        'done_by',
    ];

    protected function casts(): array
    {
        return [
            'qty_done'    => 'decimal:3',
            'unit_cost'   => 'decimal:2',
            'total_value' => 'decimal:2',
            'done_at'     => 'datetime',
            'created_at'  => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_from', 'location_code');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_to', 'location_code');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function doneBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'done_by');
    }

    public function isDone(): bool { return $this->state === 'done'; }
}

