<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vendor_bill_lines', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_bill_id', 20);
            $table->unsignedBigInteger('receipt_line_id')->nullable();
            $table->unsignedBigInteger('po_line_id')->nullable();
            $table->string('variant_sku', 20);
            $table->decimal('qty_billed', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->string('tax_id', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('vendor_bill_id')->references('id')->on('vendor_bills')->cascadeOnDelete();
            $table->foreign('receipt_line_id')->references('id')->on('receipt_lines')->nullOnDelete();
            $table->foreign('po_line_id')->references('id')->on('purchase_order_lines')->nullOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('tax_id')->references('tax_id')->on('tax_rates');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_bill_lines');
    }
};

