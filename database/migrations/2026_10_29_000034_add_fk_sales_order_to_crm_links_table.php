<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('crm_lead_quotation_links', function (Blueprint $table) {
            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('crm_lead_quotation_links', function (Blueprint $table) {
            $table->dropForeign(['sales_order_id']);
        });
    }
};

