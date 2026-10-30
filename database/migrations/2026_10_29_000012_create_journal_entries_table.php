<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('entry_no', 20)->unique();
            $table->string('entry_type', 40);
            // sales_invoice, cogs, payment_in, payment_out, pos_sale, stock_transfer, vendor_bill, credit_note, pos_close
            $table->string('source_document_type', 40);
            $table->string('source_document_id', 20);
            $table->date('entry_date');
            $table->string('description', 255)->nullable();
            $table->string('status', 20)->default('draft'); // draft, posted
            $table->boolean('is_balanced')->default(false);
            $table->decimal('total_debit', 15, 2)->default(0);
            $table->decimal('total_credit', 15, 2)->default(0);
            $table->timestamp('posted_at')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['source_document_type', 'source_document_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};

