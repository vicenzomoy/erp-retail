<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel arsip `sales_history` diganti dengan order historis asli (is_legacy)
 * di sales_orders / pos_orders agar tampil di riwayat Sales & POS.
 * Migrasi ini membersihkan tabel lama di environment yang sempat menjalankannya.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('sales_history');
    }

    public function down(): void
    {
        // Tidak dibuat ulang: data historis kini berada di sales_orders & pos_orders.
    }
};
