<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('delivery_order_lines', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_order_id', 20);
            $table->unsignedBigInteger('so_line_id');
            $table->string('variant_sku', 20);
            $table->decimal('qty_demand', 12, 3);
            $table->decimal('qty_done', 12, 3)->default(0);
            $table->decimal('cogs_per_unit', 15, 2)->default(0);
            $table->decimal('cogs_total', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('delivery_order_id')->references('id')->on('delivery_orders')->cascadeOnDelete();
            $table->foreign('so_line_id')->references('id')->on('sales_order_lines');
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_order_lines');
    }
};

