<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Peran Super Admin: setara Owner di seluruh modul + modul Manajemen User
 * (ubah username/email, reset password, atur peran & status akun seluruh pengguna).
 * Setiap perubahan tetap tercatat di Audit Trail (append-only).
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('roles')->updateOrInsert(
            ['id' => 'superadmin'],
            [
                'display_name' => 'Super Admin',
                'description'  => 'Akses penuh setara Owner ke seluruh modul, ditambah modul Manajemen User (username, password, dan hak akses seluruh pengguna). Seluruh perubahan dicatat di Audit Trail.',
                'created_at'   => $now,
                'updated_at'   => $now,
            ]
        );

        // Jangan menimpa password bila akun sudah ada (mis. sudah diganti lewat Manajemen User).
        $exists = DB::table('users')->where('email', 'superadmin.demo@barawear.com')->exists();

        if (! $exists) {
            DB::table('users')->insert([
                'name'       => 'Super Admin',
                'email'      => 'superadmin.demo@barawear.com',
                'password'   => Hash::make('password'),
                'role_id'    => 'superadmin',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'superadmin.demo@barawear.com')->delete();

        // Peran hanya dihapus bila sudah tidak dipakai pengguna lain (FK users.role_id).
        if (! DB::table('users')->where('role_id', 'superadmin')->exists()) {
            DB::table('roles')->where('id', 'superadmin')->delete();
        }
    }
};
