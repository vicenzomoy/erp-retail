<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Arsip riwayat penjualan (line-level) sebelum transaksi live di ERP.
 *
 * Sengaja dipisah dari pos_orders / sales_orders supaya data historis untuk
 * analisis TIDAK mengubah saldo stok (stock_ledger) maupun jurnal akuntansi.
 * Analisis penjualan menggabungkan tabel ini dengan transaksi POS & SO live.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_history', function (Blueprint $table) {
            $table->id();
            $table->string('document_no', 30);
            $table->string('channel', 20); // pos, wholesale
            $table->date('sale_date');
            $table->timestamp('sold_at');
            $table->string('location_code');
            $table->string('customer_id')->nullable();
            $table->string('variant_sku');
            $table->decimal('qty', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('subtotal_before_tax', 15, 2);
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('line_total', 15, 2);
            $table->decimal('cogs_total', 15, 2);
            $table->string('source', 20)->default('import'); // import, seed
            $table->timestamps();

            $table->foreign('location_code')->references('location_code')->on('warehouses_locations');
            $table->foreign('customer_id')->references('id')->on('contacts_customers')->nullOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');

            $table->index(['variant_sku', 'sale_date']);
            $table->index('sale_date');
            $table->index('document_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_history');
    }
};
