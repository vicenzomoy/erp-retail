<?php

namespace App\Http\Controllers\UserManagement;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Services\Navigation\AppCatalogService;
use App\Services\UserManagement\UserManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Modul Manajemen User — khusus Super Admin (dijaga middleware app.access:user_management).
 */
class UserManagementController extends Controller
{
    /** @var array<int, User|null> */
    private array $userCache = [];

    public function __construct(
        private UserManagementService $service
    ) {}

    public function index(Request $request): Response
    {
        $roleFilter = (string) $request->query('role', 'all');
        $search     = trim((string) $request->query('search', ''));
        $actorId    = $request->user()->id;

        $roles = $this->roleOptions();

        $query = User::with('role')->orderBy('id');

        if ($roleFilter !== 'all') {
            $query->where('role_id', $roleFilter);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $users = $query->get()->map(fn (User $u) => [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'role_id'    => $u->role_id,
            'role_name'  => $u->role?->display_name ?? ucfirst((string) $u->role_id),
            'is_active'  => (bool) $u->is_active,
            'is_self'    => $u->id === $actorId,
            'apps'       => $this->appNamesForRole((string) $u->role_id),
            'created_at' => $u->created_at?->format('d/m/Y'),
            'updated_at' => $u->updated_at?->format('d/m/Y H:i'),
        ]);

        $recentLogs = $this->auditQuery()
            ->limit(8)
            ->get()
            ->map(fn (AuditLog $log) => $this->presentLog($log));

        return Inertia::render('UserManagement/Index', [
            'users'      => $users,
            'roles'      => $roles,
            'filters'    => ['role' => $roleFilter, 'search' => $search],
            'counts'     => [
                'total'    => User::count(),
                'active'   => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
                'changes'  => $this->auditQuery()->count(),
            ],
            'recentLogs' => $recentLogs,
        ]);
    }

    public function auditLog(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $query = $this->auditQuery();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'ilike', "%{$search}%")
                  ->orWhere('actor_username', 'ilike', "%{$search}%")
                  ->orWhere('action', 'ilike', "%{$search}%");
            });
        }

        $logs = $query->paginate(25)->withQueryString()
            ->through(fn (AuditLog $log) => $this->presentLog($log));

        return Inertia::render('UserManagement/AuditLog', [
            'logs'    => $logs,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:120'],
            'email'     => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'role_id'   => ['required', 'string', Rule::exists('roles', 'id')],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['required', 'boolean'],
        ]);

        $user = $this->service->createUser($validated, $request->user(), $request->ip());

        return redirect()->route('user-management.index')
            ->with('success', "Pengguna '{$user->name}' berhasil dibuat dan tercatat di Audit Trail.");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:120'],
            'email'     => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($id)],
            'role_id'   => ['required', 'string', Rule::exists('roles', 'id')],
            'is_active' => ['required', 'boolean'],
        ]);

        $changes = $this->service->updateUser($id, $validated, $request->user(), $request->ip());

        if ($changes === []) {
            return redirect()->route('user-management.index')
                ->with('info', 'Tidak ada perubahan data pengguna.');
        }

        return redirect()->route('user-management.index')
            ->with('success', "Data pengguna '{$validated['name']}' berhasil diperbarui dan tercatat di Audit Trail.");
    }

    public function updatePassword(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $this->service->resetPassword(
            $id,
            $validated['password'],
            $request->user(),
            $request->ip(),
            $request->session()->getId(),
        );

        return redirect()->route('user-management.index')
            ->with('success', "Password pengguna '{$user->name}' berhasil direset dan tercatat di Audit Trail.");
    }

    /**
     * Halaman matriks Hak Akses Modul per peran.
     */
    public function accessMatrix(): Response
    {
        $roles   = $this->roleOptions();
        $appKeys = array_keys(AppCatalogService::APPS);

        $matrix   = [];
        $defaults = [];
        $locked   = [];
        foreach ($roles as $role) {
            foreach ($appKeys as $key) {
                $matrix[$role['id']][$key]   = AppCatalogService::roleHasApp($role['id'], $key);
                $defaults[$role['id']][$key] = AppCatalogService::defaultAllowed($role['id'], $key);
                $locked[$role['id']][$key]   = AppCatalogService::isLocked($role['id'], $key);
            }
        }

        $apps = collect(AppCatalogService::APPS)->map(fn ($app, $key) => [
            'key'  => $key,
            'name' => $app['name'],
            'desc' => $app['desc'],
        ])->values();

        return Inertia::render('UserManagement/AccessMatrix', [
            'roles'    => $roles,
            'apps'     => $apps,
            'matrix'   => $matrix,
            'defaults' => $defaults,
            'locked'   => $locked,
        ]);
    }

    public function updateAccessMatrix(Request $request): RedirectResponse
    {
        $appKeys = array_keys(AppCatalogService::APPS);

        $validated = $request->validate([
            'matrix'     => ['required', 'array'],
            'matrix.*'   => ['present', 'array'],
            'matrix.*.*' => ['string', Rule::in($appKeys)],
        ]);

        $changed = $this->service->updateRoleAppAccess($validated['matrix'], $request->user(), $request->ip());

        if ($changed === []) {
            return redirect()->route('user-management.access')
                ->with('info', 'Tidak ada perubahan hak akses modul.');
        }

        return redirect()->route('user-management.access')
            ->with('success', 'Hak akses modul untuk ' . count($changed) . ' peran berhasil diperbarui dan tercatat di Audit Trail.');
    }

    /**
     * Log yang relevan: seluruh aksi modul Manajemen User + perubahan pengguna dari modul Settings.
     */
    protected function auditQuery()
    {
        return AuditLog::query()
            ->where(function ($q) {
                $q->where('action', 'like', UserManagementService::AUDIT_PREFIX . '%')
                  ->orWhereIn('action', ['settings.user_created', 'settings.user_updated']);
            })
            ->orderByDesc('id');
    }

    protected function presentLog(AuditLog $log): array
    {
        $targetId = $log->document_type === 'user' ? (int) $log->document_id : 0;
        if ($targetId && ! array_key_exists($targetId, $this->userCache)) {
            $this->userCache[$targetId] = User::find($targetId, ['id', 'name', 'email']);
        }
        $target = $targetId ? $this->userCache[$targetId] : null;

        // Perubahan hak akses modul menargetkan peran, bukan pengguna
        if ($log->document_type === 'role') {
            $target = (object) [
                'name'  => 'Peran: ' . (Role::find($log->document_id)?->display_name ?? $log->document_id),
                'email' => null,
            ];
        }

        return [
            'id'             => $log->id,
            'action'         => $log->action,
            'status'         => $log->status,
            'actor_username' => $log->actor_username,
            'actor_role'     => $log->actor_role,
            'target_id'      => $log->document_id,
            'target_name'    => $target?->name,
            'target_email'   => $target?->email,
            'old_value'      => $log->old_value,
            'new_value'      => $log->new_value,
            'notes'          => $log->notes,
            'ip_address'     => $log->ip_address,
            'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
            'time_ago'       => $log->created_at?->diffForHumans(),
        ];
    }

    protected function roleOptions(): array
    {
        $order = ['superadmin', 'owner', 'finance', 'sales', 'warehouse', 'procurement', 'cashier', 'auditor'];

        return Role::withCount('users')->get()
            ->sortBy(fn (Role $r) => array_search($r->id, $order, true) === false ? 99 : array_search($r->id, $order, true))
            ->map(fn (Role $r) => [
                'id'           => $r->id,
                'display_name' => $r->display_name,
                'description'  => $r->description,
                'users_count'  => $r->users_count,
                'apps'         => $this->appNamesForRole($r->id),
            ])
            ->values()
            ->all();
    }

    /** @return array<int, string> */
    protected function appNamesForRole(string $roleId): array
    {
        return AppCatalogService::appNamesForRole($roleId);
    }
}
