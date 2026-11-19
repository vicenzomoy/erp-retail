<?php

namespace App\Http\Middleware;

use App\Services\Navigation\AppCatalogService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->display_name ?? ucfirst($user->role_id ?? 'User'),
                    'is_auditor' => $user->role_id === 'auditor',
                ] : null,
            ],
            'apps' => AppCatalogService::forUser($user),
            'company' => [
                'name' => 'PT Bara Ritel Nusantara',
                'brand' => 'Bara Wear',
                'city' => 'Pekanbaru',
            ],
            // Badge jumlah PO menunggu persetujuan Finance pada sidebar modul Accounting
            'pendingPoApprovalsCount' => fn () => $user && $request->routeIs('accounting.*')
                ? \App\Models\PurchaseOrder::where('status', 'to_approve')->count()
                : 0,
            // Badge jumlah selisih kurang kas POS yang belum diganti kasir (sidebar Accounting)
            'pendingPosShortagesCount' => fn () => $user && $request->routeIs('accounting.*')
                ? app(\App\Services\Pos\PosCashShortageService::class)->countOutstanding()
                : 0,
            // Notifikasi modul Purchase: PO yang ditolak Finance dan belum ditindaklanjuti
            'rejectedPoNotifications' => fn () => $user && $request->routeIs('purchase.*')
                ? app(\App\Services\Purchase\PurchaseOrderService::class)->getRejectedNotifications($user)
                : [],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ];
    }
}
