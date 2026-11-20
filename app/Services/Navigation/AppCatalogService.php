<?php

namespace App\Services\Navigation;

use App\Models\RoleAppAccess;
use App\Models\User;

/**
 * Katalog app utama (S-01 / F-01) beserta matriks akses per peran (SR-18).
 * Dipakai bersama oleh beranda, app switcher, dan middleware penjaga server.
 */
class AppCatalogService
{
    /**
     * key => [name, desc, route (nama route entry), roles yang berhak].
     * 'roles' = matriks BAWAAN. Matriks aktif dibaca dari tabel role_app_access
     * (diatur Super Admin di Manajemen User › Hak Akses Modul); bawaan dipakai bila baris belum ada.
     */
    public const APPS = [
        'owner' => [
            'name'  => 'Dashboard',
            'desc'  => 'Eksekutif, Profit & Persetujuan',
            'route' => 'owner.dashboard',
            'roles' => ['owner', 'superadmin'],
        ],
        'auditor' => [
            'name'  => 'Audit Trail',
            'desc'  => 'Log Audit & Telusur Dokumen',
            'route' => 'auditor.index',
            'roles' => ['auditor'],
        ],
        'sales' => [
            'name'  => 'Sales',
            'desc'  => 'Penjualan & Penawaran',
            'route' => 'sales.overview',
            'roles' => ['owner', 'superadmin', 'sales', 'finance', 'auditor'],
        ],
        'crm' => [
            'name'  => 'CRM',
            'desc'  => 'Lead & Peluang',
            'route' => 'crm.overview',
            'roles' => ['owner', 'superadmin', 'sales', 'auditor'],
        ],
        'inventory' => [
            'name'  => 'Inventory',
            'desc'  => 'Gudang & Persediaan',
            'route' => 'inventory.overview',
            'roles' => ['owner', 'superadmin', 'warehouse', 'sales', 'procurement', 'auditor'],
        ],
        'purchase' => [
            'name'  => 'Purchase',
            'desc'  => 'Pembelian & Vendor',
            'route' => 'purchase.overview',
            'roles' => ['owner', 'superadmin', 'procurement', 'auditor'],
        ],
        'accounting' => [
            'name'  => 'Accounting',
            'desc'  => 'Faktur, Tagihan, Kas & Buku Besar',
            'route' => 'accounting.overview',
            'roles' => ['owner', 'superadmin', 'finance', 'auditor'],
        ],
        'pos' => [
            'name'  => 'Point of Sale',
            'desc'  => 'Kasir Retail Omnichannel',
            'route' => 'pos.overview',
            'roles' => ['owner', 'superadmin', 'cashier', 'auditor'],
        ],
        'settings' => [
            'name'  => 'Settings',
            'desc'  => 'Pengaturan & Hak Akses',
            'route' => 'settings.overview',
            'roles' => ['owner', 'superadmin', 'finance', 'auditor'],
        ],
        'user_management' => [
            'name'  => 'Manajemen User',
            'desc'  => 'Username, Password & Hak Akses',
            'route' => 'user-management.index',
            'roles' => ['superadmin'],
        ],
    ];

    /**
     * Sel matriks yang dikunci (tidak dapat diubah lewat UI) untuk mencegah lockout & eskalasi:
     * - Modul Manajemen User selalu khusus Super Admin.
     * - Baris peran Super Admin selalu mengikuti matriks bawaan.
     * - Sel tertentu (peran => app) selalu mengikuti bawaan, mis. Auditor wajib memiliki Audit Trail.
     */
    public const LOCKED_APPS  = ['user_management'];
    public const LOCKED_ROLES = ['superadmin'];
    public const LOCKED_CELLS = [
        'auditor' => ['auditor'],
    ];

    /** @var array<string, array<string, bool>>|null cache per request: [role_id][app_key] => allowed */
    protected static ?array $matrix = null;

    public static function canAccess(?User $user, string $appKey): bool
    {
        if (! $user) {
            return false;
        }

        return self::roleHasApp((string) $user->role_id, $appKey);
    }

    public static function roleHasApp(string $roleId, string $appKey): bool
    {
        if ($appKey === 'invoicing') {
            $appKey = 'accounting';
        }

        if (! isset(self::APPS[$appKey])) {
            return false;
        }

        if (self::isLocked($roleId, $appKey)) {
            return self::defaultAllowed($roleId, $appKey);
        }

        return self::matrix()[$roleId][$appKey] ?? self::defaultAllowed($roleId, $appKey);
    }

    public static function isLocked(string $roleId, string $appKey): bool
    {
        return in_array($appKey, self::LOCKED_APPS, true)
            || in_array($roleId, self::LOCKED_ROLES, true)
            || in_array($appKey, self::LOCKED_CELLS[$roleId] ?? [], true);
    }

    public static function defaultAllowed(string $roleId, string $appKey): bool
    {
        return in_array($roleId, self::APPS[$appKey]['roles'] ?? [], true);
    }

    /** @return array<int, string> app key yang diizinkan untuk peran */
    public static function appKeysForRole(string $roleId): array
    {
        return array_values(array_filter(
            array_keys(self::APPS),
            fn (string $key) => self::roleHasApp($roleId, $key)
        ));
    }

    /** @return array<int, string> nama app yang diizinkan untuk peran */
    public static function appNamesForRole(string $roleId): array
    {
        return array_map(fn (string $key) => self::APPS[$key]['name'], self::appKeysForRole($roleId));
    }

    /** @return array<string, bool> peta akses app untuk pengguna (dibagikan ke frontend) */
    public static function accessMapFor(?User $user): array
    {
        $map = [];
        foreach (array_keys(self::APPS) as $key) {
            $map[$key] = self::canAccess($user, $key);
        }
        $map['invoicing'] = $map['accounting'];

        return $map;
    }

    public static function flushCache(): void
    {
        self::$matrix = null;
    }

    /** @return array<string, array<string, bool>> */
    protected static function matrix(): array
    {
        if (self::$matrix !== null) {
            return self::$matrix;
        }

        $matrix = [];
        foreach (RoleAppAccess::query()->get(['role_id', 'app_key', 'is_allowed']) as $row) {
            $matrix[$row->role_id][$row->app_key] = (bool) $row->is_allowed;
        }

        return self::$matrix = $matrix;
    }

    /**
     * Daftar app yang ditampilkan di Beranda (Home):
     * Modul umum selalu ditampilkan (yang tidak diizinkan ditolak 403 & dicatat ke AuditLog
     * oleh middleware EnsureAppAccess). Modul khusus (Dashboard Owner, Audit Trail, Manajemen User)
     * hanya ditampilkan bila peran pengguna diizinkan.
     *
     * @return array<int, array{key:string,name:string,desc:string,href:string,allowed:bool}>
     */
    public static function forUser(?User $user): array
    {
        $apps = [];
        foreach (self::APPS as $key => $app) {
            $allowed = self::canAccess($user, $key);

            if (in_array($key, ['owner', 'auditor', 'user_management'], true) && ! $allowed) {
                continue;
            }

            $apps[] = [
                'key'     => $key,
                'name'    => $app['name'],
                'desc'    => $app['desc'],
                'href'    => route($app['route']),
                'allowed' => $allowed,
            ];
        }

        return $apps;
    }
}
