<?php

namespace App\Services\Navigation;

use App\Models\User;

/**
 * Katalog app utama (S-01 / F-01) beserta matriks akses per peran (SR-18).
 * Dipakai bersama oleh beranda, app switcher, dan middleware penjaga server.
 */
class AppCatalogService
{
    /**
     * key => [name, desc, route (nama route entry), roles yang berhak].
     * Owner berhak ke seluruh app.
     */
    public const APPS = [
        'owner' => [
            'name'  => 'Dashboard',
            'desc'  => 'Eksekutif, Profit & Persetujuan',
            'route' => 'owner.dashboard',
            'roles' => ['owner'],
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
            'roles' => ['owner', 'sales', 'finance', 'auditor'],
        ],
        'crm' => [
            'name'  => 'CRM',
            'desc'  => 'Lead & Peluang',
            'route' => 'crm.overview',
            'roles' => ['owner', 'sales', 'auditor'],
        ],
        'inventory' => [
            'name'  => 'Inventory',
            'desc'  => 'Gudang & Persediaan',
            'route' => 'inventory.overview',
            'roles' => ['owner', 'warehouse', 'sales', 'procurement', 'auditor'],
        ],
        'purchase' => [
            'name'  => 'Purchase',
            'desc'  => 'Pembelian & Vendor',
            'route' => 'purchase.overview',
            'roles' => ['owner', 'procurement', 'auditor'],
        ],
        'accounting' => [
            'name'  => 'Accounting',
            'desc'  => 'Faktur, Tagihan, Kas & Buku Besar',
            'route' => 'accounting.overview',
            'roles' => ['owner', 'finance', 'auditor'],
        ],
        'pos' => [
            'name'  => 'Point of Sale',
            'desc'  => 'Kasir Retail Omnichannel',
            'route' => 'pos.overview',
            'roles' => ['owner', 'cashier', 'auditor'],
        ],
        'settings' => [
            'name'  => 'Settings',
            'desc'  => 'Pengaturan & Hak Akses',
            'route' => 'settings.overview',
            'roles' => ['owner', 'finance', 'auditor'],
        ],
    ];

    public static function canAccess(?User $user, string $appKey): bool
    {
        if ($appKey === 'invoicing') {
            $appKey = 'accounting';
        }

        if (! $user || ! isset(self::APPS[$appKey])) {
            return false;
        }

        return in_array($user->role_id, self::APPS[$appKey]['roles'], true);
    }

    /**
     * Daftar app yang ditampilkan di Beranda (Home):
     * Seluruh modul ditampilkan untuk semua pengguna KECUALI modul khusus 'owner' (Owner Hub).
     * Ketika pengguna mengklik modul yang tidak diizinkan bagi perannya,
     * server middleware EnsureAppAccess akan menolak akses (403) dan mencatat ke AuditLog.
     *
     * @return array<int, array{key:string,name:string,desc:string,href:string,allowed:bool}>
     */
    public static function forUser(?User $user): array
    {
        $apps = [];
        foreach (self::APPS as $key => $app) {
            // Modul khusus Owner ('owner') hanya ditampilkan di Home untuk peran Owner
            if ($key === 'owner' && $user?->role_id !== 'owner') {
                continue;
            }
            // Modul khusus Auditor ('auditor') hanya ditampilkan di Home untuk peran Auditor
            if ($key === 'auditor' && $user?->role_id !== 'auditor') {
                continue;
            }

            $apps[] = [
                'key'     => $key,
                'name'    => $app['name'],
                'desc'    => $app['desc'],
                'href'    => route($app['route']),
                'allowed' => self::canAccess($user, $key),
            ];
        }

        return $apps;
    }
}
