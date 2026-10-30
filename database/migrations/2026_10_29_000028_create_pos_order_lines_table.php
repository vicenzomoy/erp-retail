<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_order_lines', function (Blueprint $table) {
            $table->id();
            $table->string('pos_order_id', 20);
            $table->string('variant_sku', 20);
            $table->decimal('qty', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->string('tax_id', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->decimal('cogs_per_unit', 15, 2)->default(0);
            $table->decimal('cogs_total', 15, 2)->default(0);
            $table->string('scanned_barcode', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('pos_order_id')->references('id')->on('pos_orders')->cascadeOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('tax_id')->references('tax_id')->on('tax_rates');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_order_lines');
    }
};

