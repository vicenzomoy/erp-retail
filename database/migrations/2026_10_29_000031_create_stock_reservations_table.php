<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->string('sales_order_id', 20);
            $table->unsignedBigInteger('so_line_id');
            $table->string('variant_sku', 20);
            $table->string('location_code', 20);
            $table->decimal('qty_reserved', 12, 3);
            $table->string('status', 20)->default('active'); // active, fulfilled, cancelled
            $table->timestamp('reserved_at')->useCurrent();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->cascadeOnDelete();
            $table->foreign('so_line_id')->references('id')->on('sales_order_lines')->cascadeOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('location_code')->references('location_code')->on('warehouses_locations');

            $table->index(['variant_sku', 'location_code', 'status']);
            $table->index(['sales_order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
    }
};

