<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_moves', function (Blueprint $table) {
            $table->id();
            $table->string('source_document_type', 40);
            // delivery_order, receipt, internal_transfer, pos_order, credit_note
            $table->string('source_document_id', 20);
            $table->string('variant_sku', 20);
            $table->string('location_from', 20);
            $table->string('location_to', 20);
            $table->decimal('qty_done', 12, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('state', 20)->default('draft'); // draft, done, cancelled
            $table->timestamp('done_at')->nullable();
            $table->unsignedBigInteger('done_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('location_from')->references('location_code')->on('warehouses_locations');
            $table->foreign('location_to')->references('location_code')->on('warehouses_locations');
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('done_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['source_document_type', 'source_document_id']);
            $table->index(['variant_sku', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_moves');
    }
};

