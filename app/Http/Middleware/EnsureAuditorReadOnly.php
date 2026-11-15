<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Penjaga Read-Only mutlak untuk peran Auditor:
 * Auditor hanya boleh membaca data, audit trail, dan relasi dokumen lintas modul.
 * Seluruh aksi mutasi (POST/PUT/PATCH/DELETE) dan halaman pembuatan (/create) ditolak (403).
 */
class EnsureAuditorReadOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role_id !== 'auditor') {
            return $next($request);
        }

        if ($request->routeIs('logout')) {
            return $next($request);
        }

        $isMutationMethod = ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);
        $isCreateFormRoute = str_ends_with(trim($request->path(), '/'), '/create');

        if ($isMutationMethod || $isCreateFormRoute) {
            AuditLog::record(
                action: 'auditor.mutation_blocked',
                status: 'REJECTED',
                actorUserId: $user->id,
                actorUsername: $user->name ?? explode('@', $user->email)[0],
                actorRole: $user->role_id,
                documentType: 'app',
                documentId: $request->path(),
                newValue: [
                    'method' => $request->method(),
                    'path'   => $request->path(),
                ],
                notes: "Percobaan aksi/perubahan data ({$request->method()} /{$request->path()}) oleh Auditor ditolak (Read-Only).",
                ipAddress: $request->ip(),
            );

            abort(
                403,
                'Akun Auditor hanya memiliki hak baca (Read-Only) dan tidak dapat membuat, mengubah, atau memvalidasi data.'
            );
        }

        return $next($request);
    }
}

