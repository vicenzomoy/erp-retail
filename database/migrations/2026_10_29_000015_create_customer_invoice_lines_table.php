<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->string('customer_invoice_id', 20);
            $table->unsignedBigInteger('delivery_order_line_id')->nullable();
            $table->unsignedBigInteger('so_line_id')->nullable();
            $table->string('variant_sku', 20);
            $table->string('description', 255);
            $table->decimal('qty_invoiced', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->string('tax_id', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('customer_invoice_id')->references('id')->on('customer_invoices')->cascadeOnDelete();
            $table->foreign('delivery_order_line_id')->references('id')->on('delivery_order_lines')->nullOnDelete();
            $table->foreign('so_line_id')->references('id')->on('sales_order_lines')->nullOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('tax_id')->references('tax_id')->on('tax_rates');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_invoice_lines');
    }
};

