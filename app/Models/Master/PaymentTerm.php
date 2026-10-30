<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    protected $table = 'payment_terms';
    protected $primaryKey = 'term_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    // Master table baseline — read-only from app perspective
    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'due_days' => 'integer',
        ];
    }
}

