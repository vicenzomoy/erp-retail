<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('sales_order_id', 20);
            $table->string('parent_delivery_id', 20)->nullable();
            $table->boolean('is_backorder')->default(false);
            $table->string('status', 20)->default('draft'); // draft, ready, done, cancelled
            $table->string('location_from', 20);
            $table->string('location_to', 255)->nullable();
            $table->date('scheduled_date')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->unsignedBigInteger('validated_by')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('sales_order_id')->references('id')->on('sales_orders');
            $table->foreign('location_from')->references('location_code')->on('warehouses_locations');
            $table->foreign('validated_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['sales_order_id', 'status']);
            $table->index('status');
        });

        // Add self-referencing foreign key after primary key has been created
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->foreign('parent_delivery_id')->references('id')->on('delivery_orders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropForeign(['parent_delivery_id']);
        });

        Schema::dropIfExists('delivery_orders');
    }
};
