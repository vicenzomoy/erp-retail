<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('roles')->updateOrInsert(
            ['id' => 'auditor'],
            [
                'display_name' => 'Auditor',
                'description'  => 'Akses baca-saja (Read-Only) ke seluruh modul, audit trail, dan relasi dokumen lintas modul',
                'created_at'   => $now,
                'updated_at'   => $now,
            ]
        );

        DB::table('users')->updateOrInsert(
            ['email' => 'auditor.demo@barawear.com'],
            [
                'name'       => 'Rina Auditor',
                'password'   => Hash::make('password'),
                'role_id'    => 'auditor',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'auditor.demo@barawear.com')->delete();
        DB::table('roles')->where('id', 'auditor')->delete();
    }
};

