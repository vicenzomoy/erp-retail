<?php

namespace App\Models;

use App\Models\Master\ContactCustomer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOrder extends Model
{
    protected $table = 'pos_orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'pos_session_id',
        'cashier_user_id',
        'customer_id',
        'status',
        'payment_method',
        'subtotal_before_tax',
        'total_tax',
        'grand_total',
        'cash_tendered',
        'change_given',
        'journal_entry_id',
        'idempotency_key',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_before_tax' => 'decimal:2',
            'total_tax'           => 'decimal:2',
            'grand_total'         => 'decimal:2',
            'cash_tendered'       => 'decimal:2',
            'change_given'        => 'decimal:2',
            'paid_at'             => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_user_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(ContactCustomer::class, 'customer_id', 'id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PosOrderLine::class, 'pos_order_id');
    }

    public function isPaid(): bool { return $this->status === 'paid'; }
}

