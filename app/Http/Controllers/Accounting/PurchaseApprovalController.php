<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\Purchase\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Persetujuan Finance atas Purchase Order bernilai di atas ambang (Rp 5.000.000).
 */
class PurchaseApprovalController extends Controller
{
    public function __construct(
        protected PurchaseOrderService $service
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Accounting/PurchaseApprovals/Index', [
            'pendingApprovals' => $this->service->getPendingApprovals(),
            'history' => $this->service->getApprovalHistory(30),
            'threshold' => PurchaseOrder::APPROVAL_THRESHOLD,
            'canApprove' => in_array($request->user()?->role_id, PurchaseOrder::APPROVER_ROLES, true),
        ]);
    }

    public function approve(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $po = PurchaseOrder::findOrFail($id);

        try {
            $po = $this->service->approveOrder($po, $request->user(), $validated['notes'] ?? null);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with('success', "Purchase Order {$po->id} disetujui dan dikonfirmasi. Dokumen Penerimaan Gudang telah disiapkan.");
    }

    public function reject(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
            'reason.min' => 'Alasan penolakan minimal 5 karakter.',
        ]);

        $po = PurchaseOrder::findOrFail($id);

        try {
            $po = $this->service->rejectOrder($po, $request->user(), $validated['reason']);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with('success', "Pengajuan Purchase Order {$po->id} ditolak dan dikembalikan ke Procurement.");
    }
}
