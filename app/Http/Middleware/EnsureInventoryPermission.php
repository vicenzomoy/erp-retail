<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInventoryPermission
{
    /**
     * Menjaga hak akses spesifik di modul Inventory:
     * - Peran 'owner' dan 'warehouse' memiliki akses penuh.
     * - Peran 'sales' dan 'procurement' hanya memiliki hak baca (Read-Only) di modul Inventory.
     *   Segala aksi mutasi/edit/konfirmasi/buat dokumen (POST/PUT/PATCH/DELETE atau form /create)
     *   DITOLAK (403) dan DICATAT di AuditLog.
     * - Khusus peran 'procurement', akses ke pengiriman, transfer internal, dan gudang & lokasi
     *   juga DITOLAK (403) dan DICATAT di AuditLog.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role_id, ['procurement', 'sales'], true)) {
            return $next($request);
        }

        $roleId    = $user->role_id;
        $roleLabel = $user->role?->display_name ?? ucfirst($roleId);
        $routeName = $request->route()?->getName() ?? '';
        $path      = trim($request->path(), '/');
        $method    = $request->method();

        // Kecualikan posting komentar log notes jika ada
        if ($routeName === 'inventory.log-notes.store') {
            return $next($request);
        }

        // 1. Khusus peran procurement: menu Pengiriman, Transfer Internal, dan Lokasi dilarang
        if ($roleId === 'procurement') {
            $forbiddenMenus = [
                'deliveries' => [
                    'pattern'      => 'inventory.deliveries.',
                    'path_pattern' => 'inventory/deliveries',
                    'title'        => 'Pengiriman (Deliveries)',
                ],
                'transfers' => [
                    'pattern'      => 'inventory.transfers.',
                    'path_pattern' => 'inventory/transfers',
                    'title'        => 'Transfer Internal',
                ],
                'locations' => [
                    'pattern'      => 'inventory.configuration.',
                    'path_pattern' => 'inventory/configuration',
                    'title'        => 'Gudang & Lokasi',
                ],
            ];

            foreach ($forbiddenMenus as $key => $menu) {
                $isMatch = str_starts_with($routeName, $menu['pattern']) ||
                           str_starts_with($path, $menu['path_pattern']);

                if ($isMatch) {
                    AuditLog::record(
                        action: 'access.denied',
                        status: 'REJECTED',
                        actorUserId: $user->id,
                        actorUsername: $user->name ?? explode('@', $user->email)[0],
                        actorRole: $roleId,
                        documentType: 'inventory_menu',
                        documentId: $key,
                        newValue: [
                            'method' => $method,
                            'path'   => $request->path(),
                            'route'  => $routeName,
                        ],
                        notes: "Akses ke menu '{$menu['title']}' ditolak untuk peran '{$roleLabel}'.",
                        ipAddress: $request->ip(),
                    );

                    abort(403, "Peran '{$roleLabel}' tidak memiliki hak akses ke menu {$menu['title']}.");
                }
            }
        }

        // 2. Blokir halaman form pembuatan dokumen gudang (/create) bagi peran Read-Only (Sales & Procurement)
        if (str_ends_with($routeName, '.create') || str_ends_with($path, '/create')) {
            AuditLog::record(
                action: 'inventory.mutation_denied',
                status: 'REJECTED',
                actorUserId: $user->id,
                actorUsername: $user->name ?? explode('@', $user->email)[0],
                actorRole: $roleId,
                documentType: 'inventory_mutation',
                documentId: $routeName ?: $path,
                newValue: [
                    'method' => $method,
                    'path'   => $request->path(),
                    'route'  => $routeName,
                ],
                notes: "Percobaan membuka form pembuatan dokumen inventaris ditolak untuk peran '{$roleLabel}' (Read-Only).",
                ipAddress: $request->ip(),
            );

            abort(
                403,
                "Peran '{$roleLabel}' hanya memiliki hak baca (Read-Only) pada modul Inventory dan tidak diizinkan membuat dokumen gudang."
            );
        }

        // 3. Periksa batasan Read-Only: tolak segala aksi mutasi data inventaris (POST, PUT, PATCH, DELETE)
        if (! in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            AuditLog::record(
                action: 'inventory.mutation_denied',
                status: 'REJECTED',
                actorUserId: $user->id,
                actorUsername: $user->name ?? explode('@', $user->email)[0],
                actorRole: $roleId,
                documentType: 'inventory_mutation',
                documentId: $routeName ?: $path,
                newValue: [
                    'method' => $method,
                    'path'   => $request->path(),
                    'route'  => $routeName,
                ],
                notes: "Tindakan perubahan/validasi inventaris ditolak untuk peran '{$roleLabel}' (hanya memiliki hak baca/Read-Only).",
                ipAddress: $request->ip(),
            );

            abort(
                403,
                "Peran '{$roleLabel}' hanya memiliki hak baca (Read-Only) pada modul Inventory dan tidak dapat melakukan perubahan atau validasi data."
            );
        }

        return $next($request);
    }
}
