<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Akun beban untuk barang retur yang rusak: nilai pokok (cost) barang rusak yang
 * dikembalikan pelanggan dibebankan di sini, karena tidak bisa masuk persediaan lagi.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! DB::table('chart_of_accounts')->where('code', '6500')->exists()) {
            DB::table('chart_of_accounts')->insert([
                'code'         => '6500',
                'account_name' => 'Beban Kerusakan Barang Retur',
                'account_type' => 'Beban',
            ]);
        }
    }

    public function down(): void
    {
        // Akun tidak dihapus agar jurnal yang sudah memakainya tetap valid.
    }
};
