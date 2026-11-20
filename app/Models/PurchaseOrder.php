<?php

namespace App\Models;

use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    protected $table = 'purchase_orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'source_doc_no',
        'vendor_id',
        'status',
        'payment_terms',
        'subtotal_before_tax',
        'total_tax',
        'grand_total',
        'confirmed_at',
        'confirmed_by',
        'idempotency_key',
        'notes',
        'created_by',
        'approval_requested_at',
        'approval_requested_by',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'approval_notes',
    ];

    /**
     * PO dengan total (termasuk PPN) di atas nilai ini wajib disetujui Finance sebelum dikonfirmasi.
     */
    public const APPROVAL_THRESHOLD = 5_000_000;

    /**
     * Peran yang berwenang menyetujui / menolak PO bernilai besar.
     */
    public const APPROVER_ROLES = ['finance', 'owner', 'superadmin'];

    protected function casts(): array
    {
        return [
            'subtotal_before_tax'   => 'decimal:2',
            'total_tax'             => 'decimal:2',
            'grand_total'           => 'decimal:2',
            'confirmed_at'          => 'datetime',
            'approval_requested_at' => 'datetime',
            'approved_at'           => 'datetime',
            'rejected_at'           => 'datetime',
        ];
    }

    public function approvalRequestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approval_requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(ContactVendor::class, 'vendor_id', 'id');
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'term_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class, 'purchase_order_id');
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class, 'purchase_order_id');
    }

    public function vendorBills(): HasMany
    {
        return $this->hasMany(VendorBill::class, 'purchase_order_id');
    }

    public function isRfq(): bool       { return $this->status === 'rfq'; }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isDone(): bool      { return $this->status === 'done'; }
    public function isToApprove(): bool { return $this->status === 'to_approve'; }

    /**
     * Apakah PO ini wajib melewati persetujuan Finance sebelum menjadi confirmed.
     */
    public function requiresApproval(): bool
    {
        return (float) $this->grand_total > self::APPROVAL_THRESHOLD;
    }

    /**
     * Check if any validated receipt exists for this PO (required before creating bill).
     */
    public function hasValidatedReceipt(): bool
    {
        return $this->receipts()->where('status', 'validated')->exists();
    }
}

