<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Akses modul (app) per peran — diatur Super Admin di Manajemen User › Hak Akses Modul.
 */
class RoleAppAccess extends Model
{
    protected $table = 'role_app_access';

    protected $fillable = ['role_id', 'app_key', 'is_allowed'];

    protected function casts(): array
    {
        return ['is_allowed' => 'boolean'];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
