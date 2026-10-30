<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_ledger', function (Blueprint $table) {
            $table->id();
            $table->string('variant_sku', 20);
            $table->string('location_code', 20);
            $table->string('move_type', 30);
            // in_receipt, out_delivery, out_pos, in_return, transfer_in, transfer_out, opening_balance
            $table->decimal('qty_change', 12, 3);       // positive = in, negative = out
            $table->decimal('qty_on_hand_after', 12, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_value_change', 15, 2)->default(0);
            $table->string('source_document_type', 40)->nullable();
            $table->string('source_document_id', 20)->nullable();
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->unsignedBigInteger('moved_by');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('variant_sku')->references('variant_sku')->on('products');
            $table->foreign('location_code')->references('location_code')->on('warehouses_locations');
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('moved_by')->references('id')->on('users');

            $table->index(['variant_sku', 'location_code']);
            $table->index(['source_document_type', 'source_document_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ledger');
    }
};

