<?php

namespace App\Services\UserManagement;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\RoleAppAccess;
use App\Models\User;
use App\Services\Navigation\AppCatalogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Modul Manajemen User (khusus Super Admin).
 *
 * Aturan:
 * - Setiap perubahan dibungkus DB::transaction() + lockForUpdate pada baris pengguna target.
 * - Setiap perubahan WAJIB tercatat di Audit Trail (append-only) — termasuk perubahan oleh Super Admin.
 *   Nilai password tidak pernah ditulis ke log (hanya penanda bahwa password diubah).
 * - Idempoten: submit ulang tanpa perubahan data tidak menulis apa pun & tidak menggandakan log.
 * - Pengaman lockout: Super Admin tidak dapat menurunkan peran / menonaktifkan akunnya sendiri,
 *   dan sistem harus selalu memiliki minimal satu Super Admin aktif.
 */
class UserManagementService
{
    public const AUDIT_PREFIX = 'user_management.';

    public function createUser(array $data, User $actor, ?string $ipAddress = null): User
    {
        $this->assertRoleExists($data['role_id']);

        return DB::transaction(function () use ($data, $actor, $ipAddress) {
            $user = User::create([
                'name'      => $data['name'],
                'email'     => Str::lower($data['email']),
                'role_id'   => $data['role_id'],
                'password'  => Hash::make($data['password']),
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            $this->audit(
                action: 'user_created',
                actor: $actor,
                target: $user,
                oldValue: null,
                newValue: [
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'role_id'   => $user->role_id,
                    'is_active' => $user->is_active,
                    'password'  => '(diatur)',
                ],
                notes: "Super Admin '{$actor->name}' membuat pengguna baru '{$user->name}' ({$user->email}) dengan peran '{$user->role_id}'.",
                ipAddress: $ipAddress,
            );

            return $user;
        });
    }

    /**
     * Ubah nama, username (email login), peran (hak akses), dan status aktif.
     *
     * @return array<string, array{old:mixed,new:mixed}> daftar field yang berubah (kosong = tidak ada perubahan)
     */
    public function updateUser(int $userId, array $data, User $actor, ?string $ipAddress = null): array
    {
        $this->assertRoleExists($data['role_id']);

        return DB::transaction(function () use ($userId, $data, $actor, $ipAddress) {
            /** @var User $target */
            $target = User::whereKey($userId)->lockForUpdate()->firstOrFail();

            $incoming = [
                'name'      => $data['name'],
                'email'     => Str::lower($data['email']),
                'role_id'   => $data['role_id'],
                'is_active' => (bool) $data['is_active'],
            ];

            $changes = [];
            foreach ($incoming as $field => $newValue) {
                $oldValue = $field === 'is_active' ? (bool) $target->{$field} : $target->{$field};
                if ($oldValue !== $newValue) {
                    $changes[$field] = ['old' => $oldValue, 'new' => $newValue];
                }
            }

            if ($changes === []) {
                return [];
            }

            $this->guardLockout($target, $incoming, $actor);

            $target->update($incoming);

            $this->audit(
                action: 'user_updated',
                actor: $actor,
                target: $target,
                oldValue: array_map(fn ($c) => $c['old'], $changes),
                newValue: array_map(fn ($c) => $c['new'], $changes),
                notes: "Super Admin '{$actor->name}' mengubah pengguna '{$target->name}': " . $this->describeChanges($changes) . '.',
                ipAddress: $ipAddress,
            );

            // Akun dinonaktifkan → putus seluruh sesi login pengguna tersebut.
            if (isset($changes['is_active']) && $changes['is_active']['new'] === false) {
                $this->terminateSessions($target);
            }

            return $changes;
        });
    }

    /**
     * Reset password pengguna. Seluruh sesi login pengguna target diputus
     * (kecuali sesi Super Admin yang sedang dipakai bila mengubah password sendiri).
     */
    public function resetPassword(int $userId, string $newPassword, User $actor, ?string $ipAddress = null, ?string $keepSessionId = null): User
    {
        return DB::transaction(function () use ($userId, $newPassword, $actor, $ipAddress, $keepSessionId) {
            /** @var User $target */
            $target = User::whereKey($userId)->lockForUpdate()->firstOrFail();

            $target->forceFill([
                'password'       => Hash::make($newPassword),
                'remember_token' => Str::random(60),
            ])->save();

            $isSelf = $target->id === $actor->id;

            $this->audit(
                action: 'password_reset',
                actor: $actor,
                target: $target,
                oldValue: ['password' => '********'],
                newValue: ['password' => '******** (diubah)'],
                notes: $isSelf
                    ? "Super Admin '{$actor->name}' mengubah password akunnya sendiri."
                    : "Super Admin '{$actor->name}' mereset password pengguna '{$target->name}' ({$target->email}). Seluruh sesi login pengguna tersebut diputus.",
                ipAddress: $ipAddress,
            );

            $this->terminateSessions($target, $isSelf ? $keepSessionId : null);

            return $target;
        });
    }

    /**
     * Simpan matriks Hak Akses Modul per peran.
     *
     * @param  array<string, array<int, string>>  $submitted  [role_id => daftar app_key yang dicentang]
     * @return array<string, array{added: array<int,string>, removed: array<int,string>}> peran yang berubah
     */
    public function updateRoleAppAccess(array $submitted, User $actor, ?string $ipAddress = null): array
    {
        $roles   = Role::query()->pluck('display_name', 'id');
        $appKeys = array_keys(AppCatalogService::APPS);

        $unknownRoles = array_diff(array_keys($submitted), $roles->keys()->all());
        if ($unknownRoles !== []) {
            throw ValidationException::withMessages([
                'matrix' => 'Peran tidak terdaftar: ' . implode(', ', $unknownRoles) . '.',
            ]);
        }

        return DB::transaction(function () use ($submitted, $actor, $ipAddress, $roles, $appKeys) {
            // Kunci matriks agar dua Super Admin yang menyimpan bersamaan tidak saling menimpa sebagian.
            $current = [];
            foreach (RoleAppAccess::query()->lockForUpdate()->get() as $row) {
                $current[$row->role_id][$row->app_key] = (bool) $row->is_allowed;
            }

            $now     = now();
            $changed = [];

            foreach ($roles as $roleId => $roleName) {
                if (! array_key_exists($roleId, $submitted)) {
                    continue;
                }

                $wanted  = array_values(array_intersect($appKeys, $submitted[$roleId]));
                $before  = [];
                $after   = [];
                $upserts = [];

                foreach ($appKeys as $appKey) {
                    $old = $current[$roleId][$appKey] ?? AppCatalogService::defaultAllowed($roleId, $appKey);
                    $new = AppCatalogService::isLocked($roleId, $appKey)
                        ? AppCatalogService::defaultAllowed($roleId, $appKey)
                        : in_array($appKey, $wanted, true);

                    if ($old) $before[] = $appKey;
                    if ($new) $after[]  = $appKey;

                    if (($current[$roleId][$appKey] ?? null) !== $new) {
                        $upserts[] = [
                            'role_id'    => $roleId,
                            'app_key'    => $appKey,
                            'is_allowed' => $new,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if ($upserts !== []) {
                    RoleAppAccess::upsert($upserts, ['role_id', 'app_key'], ['is_allowed', 'updated_at']);
                }

                $added   = array_values(array_diff($after, $before));
                $removed = array_values(array_diff($before, $after));

                if ($added === [] && $removed === []) {
                    continue;
                }

                $changed[$roleId] = ['added' => $added, 'removed' => $removed];

                $names = fn (array $keys) => array_map(fn ($k) => AppCatalogService::APPS[$k]['name'], $keys);
                $parts = [];
                if ($added !== [])   $parts[] = 'ditambah ' . implode(', ', $names($added));
                if ($removed !== []) $parts[] = 'dicabut ' . implode(', ', $names($removed));

                AuditLog::record(
                    action: self::AUDIT_PREFIX . 'role_access_updated',
                    status: 'SUCCESS',
                    actorUserId: $actor->id,
                    actorUsername: $actor->name,
                    actorRole: $actor->role_id,
                    documentType: 'role',
                    documentId: $roleId,
                    oldValue: ['modul' => $names($before)],
                    newValue: ['modul' => $names($after)],
                    notes: "Super Admin '{$actor->name}' mengubah akses modul peran '{$roleName}': " . implode('; ', $parts) . '.',
                    ipAddress: $ipAddress,
                );
            }

            AppCatalogService::flushCache();

            return $changed;
        });
    }

    /**
     * Mencegah sistem kehilangan akses administrator.
     */
    protected function guardLockout(User $target, array $incoming, User $actor): void
    {
        $isSelf = $target->id === $actor->id;

        if ($isSelf && $incoming['role_id'] !== $target->role_id) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda tidak dapat mengubah peran akun Anda sendiri.',
            ]);
        }

        if ($isSelf && ! $incoming['is_active']) {
            throw ValidationException::withMessages([
                'is_active' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ]);
        }

        $losesSuperAdmin = $target->isSuperAdmin()
            && $target->is_active
            && ($incoming['role_id'] !== 'superadmin' || ! $incoming['is_active']);

        if ($losesSuperAdmin) {
            // PostgreSQL tidak mengizinkan FOR UPDATE dengan agregat: kunci barisnya, lalu hitung.
            $otherActiveSuperAdmins = User::where('role_id', 'superadmin')
                ->where('is_active', true)
                ->whereKeyNot($target->id)
                ->lockForUpdate()
                ->pluck('id')
                ->count();

            if ($otherActiveSuperAdmins === 0) {
                throw ValidationException::withMessages([
                    'role_id' => 'Sistem harus memiliki minimal satu Super Admin aktif.',
                ]);
            }
        }
    }

    protected function assertRoleExists(string $roleId): void
    {
        if (! Role::whereKey($roleId)->exists()) {
            throw ValidationException::withMessages([
                'role_id' => 'Peran yang dipilih tidak terdaftar.',
            ]);
        }
    }

    protected function terminateSessions(User $target, ?string $keepSessionId = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::table(config('session.table', 'sessions'))
            ->where('user_id', $target->id)
            ->when($keepSessionId, fn ($q) => $q->where('id', '!=', $keepSessionId))
            ->delete();
    }

    protected function describeChanges(array $changes): string
    {
        $labels = [
            'name'      => 'Nama',
            'email'     => 'Username/Email',
            'role_id'   => 'Peran',
            'is_active' => 'Status',
        ];

        $parts = [];
        foreach ($changes as $field => $c) {
            $fmt = fn ($v) => $field === 'is_active' ? ($v ? 'Aktif' : 'Nonaktif') : (string) $v;
            $parts[] = "{$labels[$field]} '{$fmt($c['old'])}' → '{$fmt($c['new'])}'";
        }

        return implode(', ', $parts);
    }

    protected function audit(
        string $action,
        User $actor,
        User $target,
        mixed $oldValue,
        mixed $newValue,
        string $notes,
        ?string $ipAddress,
    ): void {
        AuditLog::record(
            action: self::AUDIT_PREFIX . $action,
            status: 'SUCCESS',
            actorUserId: $actor->id,
            actorUsername: $actor->name,
            actorRole: $actor->role_id,
            documentType: 'user',
            documentId: (string) $target->id,
            oldValue: $oldValue,
            newValue: $newValue,
            notes: $notes,
            ipAddress: $ipAddress,
        );
    }
}
