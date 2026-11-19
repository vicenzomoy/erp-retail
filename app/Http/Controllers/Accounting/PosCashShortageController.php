<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\PosSession;
use App\Services\Pos\PosCashShortageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pemantauan Finance atas selisih kurang kas POS dan penandaan penggantian oleh kasir.
 */
class PosCashShortageController extends Controller
{
    public function __construct(
        protected PosCashShortageService $service
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Accounting/PosCashShortages/Index', [
            'outstanding' => $this->service->getOutstanding(),
            'history' => $this->service->getSettledHistory(30),
            'canSettle' => in_array($request->user()?->role_id, PosSession::SETTLER_ROLES, true),
        ]);
    }

    public function settle(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $session = PosSession::findOrFail($id);

        try {
            $session = $this->service->settle($session, $request->user(), $validated['notes'] ?? null);
        } catch (ValidationException $e) {
            return back()->with('error', collect($e->errors())->flatten()->first());
        }

        return back()->with(
            'success',
            "Kekurangan kas sesi {$session->id} sebesar Rp " . number_format($session->shortageAmount(), 0, ',', '.')
                . " ditandai sudah diganti oleh kasir. Kas telah dijurnal kembali."
        );
    }
}
