<?php

namespace App\Models\Master;

use App\Models\PurchaseOrder;
use App\Models\VendorBill;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContactVendor extends Model
{
    use SoftDeletes;

    protected $table = 'contacts_vendors';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'city',
        'payment_terms',
    ];

    public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'term_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'vendor_id', 'id');
    }

    public function vendorBills(): HasMany
    {
        return $this->hasMany(VendorBill::class, 'vendor_id', 'id');
    }

    public function pricelists(): HasMany
    {
        return $this->hasMany(VendorPricelist::class, 'vendor_id', 'id');
    }

    /**
     * Calculate current open AP (unpaid posted vendor bill residuals).
     */
    public function getOpenApAttribute(): string
    {
        return (string) $this->vendorBills()
            ->whereIn('status', ['posted'])
            ->sum('amount_residual');
    }
}

