<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // Append-only: disable updated_at
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'actor_user_id', 'actor_username', 'actor_role',
        'action', 'status', 'document_type', 'document_id',
        'old_value', 'new_value', 'ip_address', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'old_value'  => 'array',
            'new_value'  => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * Convenience static factory — always INSERT, never UPDATE.
     */
    public static function record(
        string $action,
        string $status,
        ?int $actorUserId = null,
        string $actorUsername = 'system',
        string $actorRole = 'system',
        ?string $documentType = null,
        ?string $documentId = null,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?string $notes = null,
        ?string $ipAddress = null,
    ): self {
        return self::create([
            'actor_user_id'  => $actorUserId,
            'actor_username' => $actorUsername,
            'actor_role'     => $actorRole,
            'action'         => $action,
            'status'         => $status,
            'document_type'  => $documentType,
            'document_id'    => $documentId,
            'old_value'      => $oldValue,
            'new_value'      => $newValue,
            'ip_address'     => $ipAddress,
            'notes'          => $notes,
        ]);
    }
}
