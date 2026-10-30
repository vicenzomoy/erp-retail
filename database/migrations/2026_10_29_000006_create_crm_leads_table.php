<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('source_doc_no', 20)->nullable();
            $table->string('customer_id', 10);
            $table->string('contact_name', 100)->nullable();
            $table->string('stage', 30)->default('new'); // new, qualified, opportunity, won, lost
            $table->string('type', 20)->default('lead'); // lead, opportunity
            $table->decimal('expected_revenue', 15, 2)->default(0);
            $table->string('variant_sku', 20)->nullable();
            $table->integer('qty_interest')->nullable();
            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('won_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('contacts_customers');
            $table->foreign('variant_sku')->references('variant_sku')->on('products')->nullOnDelete();
            $table->foreign('assigned_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_leads');
    }
};
