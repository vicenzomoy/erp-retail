<?php

namespace App\Models;

use App\Models\Master\ContactCustomer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditNote extends Model
{
    protected $table = 'credit_notes';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'original_invoice_id',
        'customer_id',
        'status',
        'return_date',
        'days_since_invoice',
        'authorized_by',
        'subtotal_before_tax',
        'total_tax',
        'grand_total',
        'posted_at',
        'posted_by',
        'journal_entry_id',
        'idempotency_key',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'return_date'         => 'date',
            'days_since_invoice'  => 'integer',
            'subtotal_before_tax' => 'decimal:2',
            'total_tax'           => 'decimal:2',
            'grand_total'         => 'decimal:2',
            'posted_at'           => 'datetime',
        ];
    }

    public function originalInvoice(): BelongsTo
    {
        return $this->belongsTo(CustomerInvoice::class, 'original_invoice_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(ContactCustomer::class, 'customer_id', 'id');
    }

    public function authorizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CreditNoteLine::class, 'credit_note_id');
    }

    public function isDraft(): bool  { return $this->status === 'draft'; }
    public function isPosted(): bool { return $this->status === 'posted'; }

    /**
     * Business rule: returns within 14 days can be processed without owner authorization.
     */
    public function isWithinReturnWindow(): bool
    {
        return $this->days_since_invoice <= 14;
    }
}

