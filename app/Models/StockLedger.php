<?php

namespace App\Models;

use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLedger extends Model
{
    protected $table = 'stock_ledger';
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    // Append-only — no updates allowed in app layer
    protected $fillable = [
        'variant_sku',
        'location_code',
        'move_type',
        'qty_change',
        'qty_on_hand_after',
        'unit_cost',
        'total_value_change',
        'source_document_type',
        'source_document_id',
        'journal_entry_id',
        'moved_by',
    ];

    protected function casts(): array
    {
        return [
            'qty_change'         => 'decimal:3',
            'qty_on_hand_after'  => 'decimal:3',
            'unit_cost'          => 'decimal:2',
            'total_value_change' => 'decimal:2',
            'created_at'         => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'variant_sku', 'variant_sku');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_code', 'location_code');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function movedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moved_by');
    }

    /**
     * Get current on-hand quantity for a SKU at a location.
     */
    public static function getOnHand(string $sku, string $locationCode): string
    {
        return (string) self::where('variant_sku', $sku)
            ->where('location_code', $locationCode)
            ->sum('qty_change');
    }
}

