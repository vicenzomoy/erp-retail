<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Selisih kurang kas POS (kas fisik < kas seharusnya) dicatat sebagai piutang kasir
 * dan dipantau Finance sampai kasir menggantinya.
 *   shortage_status: null (tidak ada kekurangan) | 'outstanding' (belum diganti) | 'settled' (sudah diganti)
 */
return new class extends Migration {
    public function up(): void
    {
        // Akun piutang kasir untuk menampung kekurangan kas sampai diganti
        if (! DB::table('chart_of_accounts')->where('code', '1150')->exists()) {
            DB::table('chart_of_accounts')->insert([
                'code'         => '1150',
                'account_name' => 'Piutang Karyawan (Selisih Kas)',
                'account_type' => 'Aset lancar',
            ]);
        }

        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->string('shortage_status', 20)->nullable()->after('cash_variance');
            $table->unsignedBigInteger('shortage_journal_entry_id')->nullable()->after('shortage_status');
            $table->timestamp('shortage_settled_at')->nullable()->after('shortage_journal_entry_id');
            $table->unsignedBigInteger('shortage_settled_by')->nullable()->after('shortage_settled_at');
            $table->text('shortage_settlement_notes')->nullable()->after('shortage_settled_by');
            $table->unsignedBigInteger('shortage_settlement_journal_entry_id')->nullable()->after('shortage_settlement_notes');

            $table->foreign('shortage_journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('shortage_settlement_journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('shortage_settled_by')->references('id')->on('users')->nullOnDelete();
            $table->index('shortage_status');
        });
    }

    public function down(): void
    {
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->dropForeign(['shortage_journal_entry_id']);
            $table->dropForeign(['shortage_settlement_journal_entry_id']);
            $table->dropForeign(['shortage_settled_by']);
            $table->dropIndex(['shortage_status']);
            $table->dropColumn([
                'shortage_status',
                'shortage_journal_entry_id',
                'shortage_settled_at',
                'shortage_settled_by',
                'shortage_settlement_notes',
                'shortage_settlement_journal_entry_id',
            ]);
        });
        // Akun 1150 tidak dihapus agar jurnal yang sudah ada tetap valid.
    }
};
