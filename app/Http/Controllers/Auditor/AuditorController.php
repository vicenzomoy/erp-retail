<?php

namespace App\Http\Controllers\Auditor;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\Accounting\GeneralLedgerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditorController extends Controller
{
    public function __construct(
        private GeneralLedgerService $glService
    ) {}

    public function index(Request $request): Response
    {
        $search       = trim((string) $request->input('search', ''));
        $documentType = trim((string) $request->input('document_type', ''));
        $status       = trim((string) $request->input('status', ''));
        $actorRole    = trim((string) $request->input('actor_role', ''));
        $dateFrom     = trim((string) $request->input('date_from', ''));
        $dateTo       = trim((string) $request->input('date_to', ''));

        $query = AuditLog::query()->orderByDesc('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('document_id', 'ilike', "%{$search}%")
                  ->orWhere('action', 'ilike', "%{$search}%")
                  ->orWhere('actor_username', 'ilike', "%{$search}%")
                  ->orWhere('notes', 'ilike', "%{$search}%");
            });
        }

        if ($documentType !== '') {
            $query->where('document_type', $documentType);
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($actorRole !== '') {
            $query->where('actor_role', $actorRole);
        }

        if ($dateFrom !== '') {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== '') {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->paginate(30)->withQueryString()->through(function (AuditLog $log) {
            return [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'document_type'  => $log->document_type,
                'document_id'    => $log->document_id,
                'document_url'   => $this->glService->resolveSourceUrl($log->document_type, $log->document_id),
                'old_value'      => $log->old_value,
                'new_value'      => $log->new_value,
                'notes'          => $log->notes,
                'ip_address'     => $log->ip_address,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
                'time_ago'       => $log->created_at?->diffForHumans(),
            ];
        });

        $documentTypes = AuditLog::query()
            ->whereNotNull('document_type')
            ->distinct()
            ->orderBy('document_type')
            ->pluck('document_type');

        $actorRoles = AuditLog::query()
            ->whereNotNull('actor_role')
            ->distinct()
            ->orderBy('actor_role')
            ->pluck('actor_role');

        $summary = [
            'total'    => AuditLog::count(),
            'success'  => AuditLog::where('status', 'SUCCESS')->count(),
            'rejected' => AuditLog::where('status', 'REJECTED')->count(),
            'today'    => AuditLog::whereDate('created_at', now()->toDateString())->count(),
        ];

        return Inertia::render('Auditor/Index', [
            'logs'          => $logs,
            'documentTypes' => $documentTypes,
            'actorRoles'    => $actorRoles,
            'summary'       => $summary,
            'filters'       => [
                'search'        => $search,
                'document_type' => $documentType,
                'status'        => $status,
                'actor_role'    => $actorRole,
                'date_from'     => $dateFrom,
                'date_to'       => $dateTo,
            ],
        ]);
    }
}

