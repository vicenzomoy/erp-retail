<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Penanda transaksi historis (migrasi data sebelum go-live ERP).
 *
 * Order historis tampil di riwayat Sales & POS serta ikut dianalisis, tetapi
 * TIDAK punya stock move, jurnal, pengiriman, maupun faktur di ERP — saldo stok
 * dan akuntansi dimulai dari saldo awal saat go-live. Karena itu order ini
 * dikecualikan dari antrean operasional (faktur, pengiriman, reservasi, kas).
 */
return new class extends Migration {
    public function up(): void
    {
        foreach (['sales_orders', 'pos_sessions', 'pos_orders'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->boolean('is_legacy')->default(false)->index();
            });
        }
    }

    public function down(): void
    {
        foreach (['sales_orders', 'pos_sessions', 'pos_orders'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('is_legacy');
            });
        }
    }
};
