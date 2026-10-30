<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('crm_lead_quotation_links', function (Blueprint $table) {
            $table->id();
            $table->string('lead_id', 20);
            $table->string('sales_order_id', 20);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('lead_id')->references('id')->on('crm_leads')->cascadeOnDelete();
            // sales_order FK added later after sales_orders table exists
            $table->unique(['lead_id', 'sales_order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_lead_quotation_links');
    }
};
