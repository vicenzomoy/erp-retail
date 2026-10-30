<?php

namespace App\Models;

use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorBill extends Model
{
    protected $table = 'vendor_bills';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'source_doc_no',
        'purchase_order_id',
        'receipt_id',
        'vendor_id',
        'status',
        'bill_date',
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
            'bill_date'           => 'date',
            'due_date'            => 'date',
            'subtotal_before_tax' => 'decimal:2',
            'total_tax'           => 'decimal:2',
            'grand_total'         => 'decimal:2',
            'amount_paid'         => 'decimal:2',
            'amount_residual'     => 'decimal:2',
            'posted_at'           => 'datetime',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class, 'receipt_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(ContactVendor::class, 'vendor_id', 'id');
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
        return $this->hasMany(VendorBillLine::class, 'vendor_bill_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'document_id')
            ->where('document_type', 'vendor_bill');
    }

    public function isDraft(): bool  { return $this->status === 'draft'; }
    public function isPosted(): bool { return $this->status === 'posted'; }
    public function isPaid(): bool   { return $this->status === 'paid'; }
}

