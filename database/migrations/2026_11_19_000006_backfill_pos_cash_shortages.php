<?php

use App\Models\PosSession;
use App\Services\Pos\PosCashShortageService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sesi POS yang sudah ditutup dengan kas fisik kurang (sebelum fitur ini ada) ikut dicatat
 * sebagai kekurangan kas yang belum diganti, lengkap dengan jurnal piutang kasirnya,
 * agar muncul di dashboard Finance.
 */
return new class extends Migration {
    public function up(): void
    {
        $service = app(PosCashShortageService::class);

        DB::transaction(function () use ($service) {
            PosSession::with('cashier')
                ->where('status', 'closed')
                ->where('cash_variance', '<', 0)
                ->whereNull('shortage_status')
                ->get()
                ->each(fn (PosSession $s) => $service->recordShortage(
                    $s,
                    $s->cashier_user_id,
                    $s->cashier?->name ?? 'system',
                    'cashier'
                ));
        });
    }

    public function down(): void
    {
        // Tidak dibalik otomatis: jurnal piutang kasir yang sudah terbentuk tetap dipertahankan.
    }
};
