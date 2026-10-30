<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_invoices', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('source_doc_no', 20)->nullable();
            $table->string('sales_order_id', 20)->nullable();
            $table->string('customer_id', 10);
            $table->string('status', 20)->default('draft'); // draft, posted, paid, cancelled
            $table->date('invoice_date')->nullable();
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
            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->nullOnDelete();
            $table->foreign('customer_id')->references('id')->on('contacts_customers');
            $table->foreign('payment_terms')->references('term_id')->on('payment_terms');
            $table->foreign('posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['customer_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_invoices');
    }
};

