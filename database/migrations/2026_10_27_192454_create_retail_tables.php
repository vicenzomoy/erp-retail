<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabel Master Independen
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->string('term_id')->primary();
            $table->integer('due_days');
            $table->string('description');
        });

        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('account_name');
            $table->string('account_type');
        });

        Schema::create('tax_rates', function (Blueprint $table) {
            $table->string('tax_id')->primary();
            $table->string('formal_rate');
            $table->string('tax_base_factor');
            $table->string('effective_rate');
            $table->string('rounding_policy');
        });

        Schema::create('warehouses_locations', function (Blueprint $table) {
            $table->string('location_code')->primary();
            $table->string('location_name');
            $table->string('type');
            $table->string('city');
        });

        // 2. Tabel Kontak
        Schema::create('contacts_customers', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('type');
            $table->string('city');
            $table->integer('credit_limit');
            $table->string('payment_terms');
            
            $table->foreign('payment_terms')->references('term_id')->on('payment_terms');
        });

        Schema::create('contacts_vendors', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('city');
            $table->string('payment_terms');
            
            $table->foreign('payment_terms')->references('term_id')->on('payment_terms');
        });

        // 3. Tabel Produk
        Schema::create('products', function (Blueprint $table) {
            $table->string('variant_sku')->primary();
            $table->string('name');
            $table->string('size');
            $table->string('color');
            $table->string('unit');
            $table->integer('sales_price');
            $table->integer('cost');
            $table->string('default_vendor');
            
            $table->foreign('default_vendor')->references('id')->on('contacts_vendors');
        });

        // 4. Tabel Relasi & Stok
        Schema::create('vendor_pricelist', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_id');
            $table->string('variant_sku');
            $table->integer('min_qty');
            $table->integer('unit_price');
            $table->string('currency');
            
            $table->foreign('vendor_id')->references('id')->on('contacts_vendors');
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });

        Schema::create('opening_stock', function (Blueprint $table) {
            $table->id();
            $table->string('variant_sku');
            $table->integer('WH_PKU_qty');
            $table->integer('TOKO_PKU_qty');
            $table->integer('company_total_qty');
            $table->integer('standard_value');
            
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });

        // 5. Tabel Dokumen
        Schema::create('existing_documents', function (Blueprint $table) {
            $table->string('document_no')->primary();
            $table->string('document_type');
            $table->string('party');
            $table->string('status');
            $table->string('variant_sku')->nullable();
            $table->integer('ordered_qty')->nullable();
            $table->integer('reserved_qty');
            $table->integer('accepted_qty');
            $table->string('financial_state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop dengan urutan terbalik dari pembuatan untuk menghindari error relasi
        Schema::dropIfExists('existing_documents');
        Schema::dropIfExists('opening_stock');
        Schema::dropIfExists('vendor_pricelist');
        Schema::dropIfExists('products');
        Schema::dropIfExists('contacts_vendors');
        Schema::dropIfExists('contacts_customers');
        Schema::dropIfExists('warehouses_locations');
        Schema::dropIfExists('tax_rates');
        Schema::dropIfExists('chart_of_accounts');
        Schema::dropIfExists('payment_terms');
    }
};
