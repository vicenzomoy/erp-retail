<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmLead extends Model
{
    protected $table = 'crm_leads';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'source_doc_no', 'customer_id', 'contact_name',
        'stage', 'type', 'expected_revenue', 'variant_sku',
        'qty_interest', 'assigned_user_id', 'converted_at',
        'won_at', 'lost_at', 'idempotency_key', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'expected_revenue' => 'decimal:2',
            'converted_at'     => 'datetime',
            'won_at'           => 'datetime',
            'lost_at'          => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Master\ContactCustomer::class, 'customer_id', 'id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Master\Product::class, 'variant_sku', 'variant_sku');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function quotationLinks(): HasMany
    {
        return $this->hasMany(CrmLeadQuotationLink::class, 'lead_id');
    }
}
