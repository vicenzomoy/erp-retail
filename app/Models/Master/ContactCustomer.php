<?php

namespace App\Models\Master;

use App\Models\CustomerInvoice;
use App\Models\SalesOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactCustomer extends Model
{
    protected $table = 'contacts_customers';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'integer',
        ];
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'customer_id', 'id');
    }

    public function customerInvoices(): HasMany
    {
        return $this->hasMany(CustomerInvoice::class, 'customer_id', 'id');
    }

    /**
     * Calculate current open AR (unpaid posted invoice residuals).
     */
    public function getOpenArAttribute(): string
    {
        return (string) $this->customerInvoices()
            ->whereIn('status', ['posted'])
            ->sum('amount_residual');
    }

    /**
     * Check if a new order amount would exceed credit limit.
     * (open_ar + new_order_amount) > credit_limit
     */
    public function wouldExceedCreditLimit(string $orderAmount): bool
    {
        return bccomp(
            bcadd($this->open_ar, $orderAmount, 2),
            (string) $this->credit_limit,
            2
        ) > 0;
    }
}

