<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    /** Peran dengan wewenang setara Owner (eksekutif). Super Admin = Owner + Manajemen User. */
    public const OWNER_LEVEL_ROLES = ['owner', 'superadmin'];

    public function isOwnerLevel(): bool
    {
        return in_array($this->role_id, self::OWNER_LEVEL_ROLES, true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role_id === 'superadmin';
    }

    /**
     * Check if user has permission via their role.
     */
    public function hasPermission(string $module, string $action): bool
    {
        return $this->role?->can($module, $action) ?? false;
    }
}
