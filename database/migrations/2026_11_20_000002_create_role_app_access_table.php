<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Matriks akses modul (app) per peran yang dapat diatur Super Admin lewat UI.
 * Satu baris per pasangan (peran, modul) dengan is_allowed true/false.
 * Diisi awal dengan matriks bawaan yang sebelumnya hard-coded di AppCatalogService.
 */
return new class extends Migration
{
    /** Salinan matriks bawaan saat migrasi ini dibuat (sengaja literal agar migrasi stabil). */
    private const DEFAULTS = [
        'owner'           => ['owner', 'superadmin'],
        'auditor'         => ['auditor'],
        'sales'           => ['owner', 'superadmin', 'sales', 'finance', 'auditor'],
        'crm'             => ['owner', 'superadmin', 'sales', 'auditor'],
        'inventory'       => ['owner', 'superadmin', 'warehouse', 'sales', 'procurement', 'auditor'],
        'purchase'        => ['owner', 'superadmin', 'procurement', 'auditor'],
        'accounting'      => ['owner', 'superadmin', 'finance', 'auditor'],
        'pos'             => ['owner', 'superadmin', 'cashier', 'auditor'],
        'settings'        => ['owner', 'superadmin', 'finance', 'auditor'],
        'user_management' => ['superadmin'],
    ];

    public function up(): void
    {
        Schema::create('role_app_access', function (Blueprint $table) {
            $table->id();
            $table->string('role_id');
            $table->string('app_key', 50);
            $table->boolean('is_allowed')->default(false);
            $table->timestamps();

            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnUpdate()->restrictOnDelete();
            $table->unique(['role_id', 'app_key']);
        });

        $now  = now();
        $rows = [];
        foreach (DB::table('roles')->pluck('id') as $roleId) {
            foreach (self::DEFAULTS as $appKey => $roles) {
                $rows[] = [
                    'role_id'    => $roleId,
                    'app_key'    => $appKey,
                    'is_allowed' => in_array($roleId, $roles, true),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows !== []) {
            DB::table('role_app_access')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('role_app_access');
    }
};
