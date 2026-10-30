<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vendor_bills', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('source_doc_no', 20)->nullable();
            $table->string('purchase_order_id', 20)->nullable();
            $table->string('receipt_id', 20)->nullable();
            $table->string('vendor_id', 10);
            $table->string('status', 20)->default('draft'); // draft, posted, paid, cancelled
            $table->date('bill_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('payment_terms', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->decimal('amount_residual', 15, 2)->default(0);
            $table->timestamp('posted_at')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('source_doc_no')->references('document_no')->on('existing_documents')->nullOnDelete();
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->nullOnDelete();
            $table->foreign('receipt_id')->references('id')->on('receipts')->nullOnDelete();
            $table->foreign('vendor_id')->references('id')->on('contacts_vendors');
            $table->foreign('payment_terms')->references('term_id')->on('payment_terms');
            $table->foreign('posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['vendor_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_bills');
    }
};

