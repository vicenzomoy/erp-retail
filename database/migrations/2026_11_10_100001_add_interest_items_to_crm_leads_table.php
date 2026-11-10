<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambahkan kolom interest_items (JSON) untuk mendukung multi-produk dalam satu Lead.
 * Format: [{"variant_sku":"TSP-M-BLK","qty_interest":3}, ...]
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('crm_leads', 'interest_items')) {
            Schema::table('crm_leads', function (Blueprint $table) {
                // JSON array peminatan produk (multi-item)
                $table->jsonb('interest_items')->nullable()->after('qty_interest');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('crm_leads', 'interest_items')) {
            Schema::table('crm_leads', function (Blueprint $table) {
                $table->dropColumn('interest_items');
            });
        }
    }
};

