<?php

namespace App\Services\Navigation;

use App\Models\User;

/**
 * Katalog 7 app utama (S-01 / F-01) beserta matriks akses per peran (SR-18).
 * Dipakai bersama oleh beranda, app switcher, dan middleware penjaga server.
 */
class AppCatalogService
{
    /**
     * key => [name, desc, route (nama route entry), roles yang berhak].
     * Owner berhak ke seluruh app.
     */
    public const APPS = [
        'sales' => [
            'name'  => 'Sales',
            'desc'  => 'Penjualan & Penawaran',
            'route' => 'sales.overview',
            'roles' => ['owner', 'sales', 'finance'],
        ],
        'crm' => [
            'name'  => 'CRM',
            'desc'  => 'Lead & Peluang',
            'route' => 'crm.overview',
            'roles' => ['owner', 'sales'],
        ],
        'inventory' => [
            'name'  => 'Inventory',
            'desc'  => 'Gudang & Persediaan',
            'route' => 'inventory.overview',
            'roles' => ['owner', 'warehouse', 'sales', 'procurement'],
        ],
        'purchase' => [
            'name'  => 'Purchase',
            'desc'  => 'Pembelian & Vendor',
            'route' => 'purchase.overview',
            'roles' => ['owner', 'procurement'],
        ],
        'accounting' => [
            'name'  => 'Accounting',
            'desc'  => 'Faktur & Buku Besar',
            'route' => 'accounting.overview',
            'roles' => ['owner', 'finance'],
        ],
        'pos' => [
            'name'  => 'Point of Sale',
            'desc'  => 'Kasir Retail Omnichannel',
            'route' => 'pos.overview',
            'roles' => ['owner', 'cashier'],
        ],
        'settings' => [
            'name'  => 'Settings',
            'desc'  => 'Pengaturan & Hak Akses',
            'route' => 'settings.overview',
            'roles' => ['owner', 'finance'],
        ],
    ];

    public static function canAccess(?User $user, string $appKey): bool
    {
        if (! $user || ! isset(self::APPS[$appKey])) {
            return false;
        }

        return in_array($user->role_id, self::APPS[$appKey]['roles'], true);
    }

    /**
     * Daftar app yang boleh dibuka user (yang tidak berhak disembunyikan).
     *
     * @return array<int, array{key:string,name:string,desc:string,href:string}>
     */
    public static function forUser(?User $user): array
    {
        $apps = [];
        foreach (self::APPS as $key => $app) {
            if (! self::canAccess($user, $key)) {
                continue;
            }
            $apps[] = [
                'key'  => $key,
                'name' => $app['name'],
                'desc' => $app['desc'],
                'href' => route($app['route']),
            ];
        }

        return $apps;
    }
}

