<?php

namespace App\Models;

use App\Models\Master\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSession extends Model
{
    protected $table = 'pos_sessions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'cashier_user_id',
        'location_code',
        'status',
        'opening_cash_float',
        'total_sales',
        'expected_cash',
        'counted_cash',
        'cash_variance',
        'opened_at',
        'closed_at',
        'closing_journal_entry_id',
        'idempotency_key',
        'shortage_status',
        'shortage_journal_entry_id',
        'shortage_settled_at',
        'shortage_settled_by',
        'shortage_settlement_notes',
        'shortage_settlement_journal_entry_id',
    ];

    public const SHORTAGE_OUTSTANDING = 'outstanding';
    public const SHORTAGE_SETTLED = 'settled';

    /** Akun piutang kasir penampung kekurangan kas sampai diganti. */
    public const SHORTAGE_ACCOUNT = '1150';

    /** Peran yang dapat menandai kekurangan kas sudah diganti. */
    public const SETTLER_ROLES = ['finance', 'owner', 'superadmin'];

    protected function casts(): array
    {
        return [
            'opening_cash_float'  => 'decimal:2',
            'total_sales'         => 'decimal:2',
            'expected_cash'       => 'decimal:2',
            'counted_cash'        => 'decimal:2',
            'cash_variance'       => 'decimal:2',
            'opened_at'           => 'datetime',
            'closed_at'           => 'datetime',
            'shortage_settled_at' => 'datetime',
        ];
    }

    public function shortageSettledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shortage_settled_by');
    }

    public function shortageAmount(): float
    {
        return $this->cash_variance !== null && (float) $this->cash_variance < 0
            ? abs((float) $this->cash_variance)
            : 0.0;
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'location_code', 'location_code');
    }

    public function closingJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'closing_journal_entry_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(PosOrder::class, 'pos_session_id');
    }

    public function isOpen(): bool   { return $this->status === 'open'; }
    public function isClosed(): bool { return $this->status === 'closed'; }
}

