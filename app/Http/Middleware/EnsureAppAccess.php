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

        AuditLog::record(
            action: 'access.denied',
            status: 'REJECTED',
            actorUserId: $user?->id,
            actorUsername: $user ? (explode('@', $user->email)[0]) : 'guest',
            actorRole: $user?->role_id ?? 'guest',
            documentType: 'app',
            documentId: $appKey,
            newValue: ['method' => $request->method(), 'path' => $request->path()],
            notes: "Akses ke app '{$appKey}' ditolak untuk peran '" . ($user?->role_id ?? 'guest') . "'.",
            ipAddress: $request->ip(),
        );

        abort(403, 'Anda tidak memiliki hak akses ke aplikasi ini.');
    }
}

