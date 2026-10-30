<?php

namespace App\Models\Master;

use App\Models\PurchaseOrder;
use App\Models\VendorBill;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactVendor extends Model
{
    protected $table = 'contacts_vendors';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = ['*'];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'vendor_id', 'id');
    }

    public function vendorBills(): HasMany
    {
        return $this->hasMany(VendorBill::class, 'vendor_id', 'id');
    }
}

