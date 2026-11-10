<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Services\Navigation\AppCatalogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Penjaga sisi server per app (SR-18, F-01 AC2): menolak tegas (403) dan merekam audit.
 */
class EnsureAppAccess
{
    public function handle(Request $request, Closure $next, string $appKey): Response
    {
        $user = $request->user();

        if (AppCatalogService::canAccess($user, $appKey)) {
            return $next($request);
        }

        $appName  = AppCatalogService::APPS[$appKey]['name'] ?? ucfirst($appKey);
        $roleName = $user?->role?->display_name ?? ucfirst($user?->role_id ?? 'guest');

        AuditLog::record(
            action: 'access.denied',
            status: 'REJECTED',
            actorUserId: $user?->id,
            actorUsername: $user?->name ?? ($user ? (explode('@', $user->email)[0]) : 'guest'),
            actorRole: $user?->role_id ?? 'guest',
            documentType: 'app',
            documentId: $appKey,
            newValue: [
                'method' => $request->method(),
                'path'   => $request->path(),
                'app'    => $appName,
            ],
            notes: "Percobaan akses ke modul '{$appName}' ({$appKey}) ditolak untuk peran '{$roleName}' dan telah dicatat ke Audit Log.",
            ipAddress: $request->ip(),
        );

        abort(
            403,
            "Peran '{$roleName}' tidak memiliki izin untuk mengakses modul {$appName}."
        );
    }
}
