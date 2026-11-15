<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('chart_of_accounts')->updateOrInsert(
            ['code' => '4200'],
            [
                'account_name' => 'Selisih Pembulatan POS',
                'account_type' => 'Pendapatan',
            ]
        );
    }

    public function down(): void
    {
        DB::table('chart_of_accounts')->where('code', '4200')->delete();
    }
};

