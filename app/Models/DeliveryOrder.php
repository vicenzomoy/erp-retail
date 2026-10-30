<?php

namespace App\Models;

use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryOrder extends Model
{
    protected $table = 'delivery_orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'sales_order_id',
        'parent_delivery_id',
        'is_backorder',
        'status',
        'location_from',
        'location_to',
        'scheduled_date',
        'validated_at',
        'validated_by',
        'idempotency_key',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_backorder'   => 'boolean',
            'scheduled_date' => 'date',
            'validated_at'   => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function parentDelivery(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class, 'parent_delivery_id');
    }

    public function backorders(): HasMany
    {
        return $this->hasMany(DeliveryOrder::class, 'parent_delivery_id');
    }

    public function sourceLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_from', 'location_code');
    }

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DeliveryOrderLine::class, 'delivery_order_id');
    }

    public function stockMoves(): HasMany
    {
        return $this->hasMany(StockMove::class, 'source_document_id')
            ->where('source_document_type', 'delivery_order');
    }

    public function isDraft(): bool { return $this->status === 'draft'; }
    public function isReady(): bool { return $this->status === 'ready'; }
    public function isDone(): bool  { return $this->status === 'done'; }
}

