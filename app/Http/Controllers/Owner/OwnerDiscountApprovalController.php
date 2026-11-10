<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Services\Owner\OwnerDashboardService;
use App\Services\Sales\SalesOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDiscountApprovalController extends Controller
{
    public function __construct(
        private readonly OwnerDashboardService $dashboardService,
        private readonly SalesOrderService $salesOrderService,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Owner/Approvals/Discounts', [
            'pendingApprovals' => $this->dashboardService->getPendingDiscountApprovals(),
            'history'          => $this->dashboardService->getDiscountHistory(20),
        ]);
    }

    public function approve(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $so = $this->salesOrderService->approveDiscount($id, $validated['notes'] ?? null, $request->user());

            return back()->with('success', "Diskon penawaran {$so->id} berhasil disetujui. Sales sekarang dapat mengonfirmasi Sales Order.");
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }
    }

    public function reject(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'reason'            => ['nullable', 'string', 'max:500'],
            'adjusted_discount' => ['nullable', 'numeric', 'min:0', 'max:10'],
        ]);

        try {
            $so = $this->salesOrderService->rejectDiscount(
                $id,
                $validated['reason'] ?? null,
                isset($validated['adjusted_discount']) ? (float) $validated['adjusted_discount'] : 10.0,
                $request->user()
            );

            return back()->with('success', "Pengajuan diskon > 10% untuk {$so->id} ditolak dan diskon telah disesuaikan kembali.");
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }
    }
}

