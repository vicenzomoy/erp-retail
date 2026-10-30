<?php

namespace App\Models;

use App\Models\Master\ContactCustomer;
use App\Models\Master\PaymentTerm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    protected $table = 'sales_orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'source_doc_no',
        'customer_id',
        'status',
        'credit_hold',
        'discount_hold',
        'discount_pct',
        'discount_approved_by',
        'discount_approved_at',
        'payment_terms',
        'subtotal_before_tax',
        'total_tax',
        'grand_total',
        'confirmed_at',
        'confirmed_by',
        'notes',
        'idempotency_key',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'credit_hold'          => 'boolean',
            'discount_hold'        => 'boolean',
            'discount_pct'         => 'decimal:2',
            'subtotal_before_tax'  => 'decimal:2',
            'total_tax'            => 'decimal:2',
            'grand_total'          => 'decimal:2',
            'confirmed_at'         => 'datetime',
            'discount_approved_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(ContactCustomer::class, 'customer_id', 'id');
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'term_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function discountApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'discount_approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SalesOrderLine::class, 'sales_order_id');
    }

    public function deliveryOrders(): HasMany
    {
        return $this->hasMany(DeliveryOrder::class, 'sales_order_id');
    }

    public function customerInvoices(): HasMany
    {
        return $this->hasMany(CustomerInvoice::class, 'sales_order_id');
    }

    public function quotationLinks(): HasMany
    {
        return $this->hasMany(CrmLeadQuotationLink::class, 'sales_order_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class, 'sales_order_id');
    }

    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isDone(): bool      { return $this->status === 'done'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }
}

