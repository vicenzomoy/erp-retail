<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('credit_note_lines', function (Blueprint $table) {
            $table->id();
            $table->string('credit_note_id', 20);
            $table->unsignedBigInteger('original_invoice_line_id');
            $table->string('variant_sku', 20);
            $table->string('condition', 20)->default('saleable'); // saleable, damaged
            $table->decimal('qty_returned', 12, 3);
            $table->decimal('unit_price', 15, 2);
            $table->string('tax_id', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->decimal('cogs_reversal', 15, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('credit_note_id')->references('id')->on('credit_notes')->cascadeOnDelete();
            $table->foreign('original_invoice_line_id')->references('id')->on('customer_invoice_lines');
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('tax_id')->references('tax_id')->on('tax_rates');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_note_lines');
    }
};

