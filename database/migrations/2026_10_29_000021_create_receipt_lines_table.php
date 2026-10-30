<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receipt_lines', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_id', 20);
            $table->unsignedBigInteger('po_line_id');
            $table->string('variant_sku', 20);
            $table->decimal('qty_expected', 12, 3);
            $table->decimal('qty_accepted', 12, 3)->default(0);
            $table->decimal('qty_rejected', 12, 3)->default(0);
            $table->string('rejection_reason', 255)->nullable();
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('accepted_value', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('receipt_id')->references('id')->on('receipts')->cascadeOnDelete();
            $table->foreign('po_line_id')->references('id')->on('purchase_order_lines');
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_lines');
    }
};

