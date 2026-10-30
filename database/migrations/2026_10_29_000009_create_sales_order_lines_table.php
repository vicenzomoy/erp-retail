<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_order_lines', function (Blueprint $table) {
            $table->id();
            $table->string('sales_order_id', 20);
            $table->string('variant_sku', 20);
            $table->decimal('qty_ordered', 12, 3);
            $table->decimal('qty_delivered', 12, 3)->default(0);
            $table->decimal('qty_invoiced', 12, 3)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->string('tax_id', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->timestamp('price_locked_at')->nullable();
            $table->timestamps();

            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->cascadeOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('tax_id')->references('tax_id')->on('tax_rates');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_lines');
    }
};
