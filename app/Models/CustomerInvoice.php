<?php

namespace App\Models;

use App\Models\Master\ContactCustomer;
use App\Models\Master\PaymentTerm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerInvoice extends Model
{
    protected $table = 'customer_invoices';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'source_doc_no',
        'sales_order_id',
        'customer_id',
        'status',
        'invoice_date',
        'due_date',
        'payment_terms',
        'subtotal_before_tax',
        'total_tax',
        'grand_total',
        'amount_paid',
        'amount_residual',
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
            'invoice_date'        => 'date',
            'due_date'            => 'date',
            'subtotal_before_tax' => 'decimal:2',
            'total_tax'           => 'decimal:2',
            'grand_total'         => 'decimal:2',
            'amount_paid'         => 'decimal:2',
            'amount_residual'     => 'decimal:2',
            'posted_at'           => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(ContactCustomer::class, 'customer_id', 'id');
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'term_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CustomerInvoiceLine::class, 'customer_invoice_id');
    }

    public function creditNotes(): HasMany
    {
        return $this->hasMany(CreditNote::class, 'original_invoice_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'document_id')
            ->where('document_type', 'customer_invoice');
    }

    public function isDraft(): bool  { return $this->status === 'draft'; }
    public function isPosted(): bool { return $this->status === 'posted'; }
    public function isPaid(): bool   { return $this->status === 'paid'; }
}

