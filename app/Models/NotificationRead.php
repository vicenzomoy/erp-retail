<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationRead extends Model
{
    public const TYPE_PO_REJECTED = 'po_rejected';

    protected $fillable = [
        'user_id',
        'type',
        'document_id',
        'event_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'event_at' => 'datetime',
            'read_at'  => 'datetime',
        ];
    }
}
