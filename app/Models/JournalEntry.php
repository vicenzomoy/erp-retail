<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    protected $table = 'journal_entries';

    protected $fillable = [
        'entry_no',
        'entry_type',
        'source_document_type',
        'source_document_id',
        'entry_date',
        'description',
        'status',
        'is_balanced',
        'total_debit',
        'total_credit',
        'posted_at',
        'posted_by',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'entry_date'   => 'date',
            'is_balanced'  => 'boolean',
            'total_debit'  => 'decimal:2',
            'total_credit' => 'decimal:2',
            'posted_at'    => 'datetime',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class, 'journal_entry_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isDraft(): bool    { return $this->status === 'draft'; }
    public function isPosted(): bool   { return $this->status === 'posted'; }
    public function isBalanced(): bool { return $this->is_balanced; }
}

