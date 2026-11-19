<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Perbaikan data: quotation yang sudah dibatalkan / dikonfirmasi / selesai tidak boleh
 * lagi membawa flag Kredit Hold / Diskon Hold, agar riwayat menampilkan status sebenarnya
 * (mis. "Dibatalkan", bukan "Kredit Hold").
 */
return new class extends Migration {
    public function up(): void
    {
        DB::table('sales_orders')
            ->whereIn('status', ['cancelled', 'confirmed', 'done'])
            ->where(fn ($q) => $q->where('credit_hold', true)->orWhere('discount_hold', true))
            ->update([
                'credit_hold'   => false,
                'discount_hold' => false,
                'updated_at'    => now(),
            ]);
    }

    public function down(): void
    {
        // Perbaikan data satu arah: flag lama tidak dipulihkan.
    }
};
