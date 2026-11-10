<?php

namespace App\Models;

use App\Models\Master\ContactCustomer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerReturn extends Model
{
    protected $table = 'customer_returns';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'sales_order_id',
        'customer_invoice_id',
        'customer_id',
        'return_date',
        'days_since_invoice',
        'status', // pending_inspection, inspected, completed, rejected
        'reason',
        'sales_user_id',
        'inspected_by',
        'inspected_at',
        'inspection_notes',
        'credit_note_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'return_date'        => 'date',
            'days_since_invoice' => 'integer',
            'inspected_at'       => 'datetime',
        ];
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function customerInvoice(): BelongsTo
    {
        return $this->belongsTo(CustomerInvoice::class, 'customer_invoice_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(ContactCustomer::class, 'customer_id', 'id');
    }

    public function salesUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_user_id');
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    public function creditNote(): BelongsTo
    {
        return $this->belongsTo(CreditNote::class, 'credit_note_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CustomerReturnLine::class, 'customer_return_id');
    }

    public function isPendingInspection(): bool
    {
        return $this->status === 'pending_inspection';
    }

    public function isInspected(): bool
    {
        return $this->status === 'inspected';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Business rule: Customer return is allowed only within 14 calendar days.
     */
    public function isWithinReturnWindow(): bool
    {
        return $this->days_since_invoice <= 14;
    }
}

