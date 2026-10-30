<?php

namespace App\Models;

use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalTransfer extends Model
{
    protected $table = 'internal_transfers';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'location_from',
        'location_to',
        'status',
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
            'scheduled_date' => 'date',
            'validated_at'   => 'datetime',
        ];
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_from', 'location_code');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_to', 'location_code');
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
        return $this->hasMany(InternalTransferLine::class, 'internal_transfer_id');
    }

    public function isDraft(): bool { return $this->status === 'draft'; }
    public function isReady(): bool { return $this->status === 'ready'; }
    public function isDone(): bool  { return $this->status === 'done'; }
}

