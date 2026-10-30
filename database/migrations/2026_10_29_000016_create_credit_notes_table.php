<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('original_invoice_id', 20);
            $table->string('customer_id', 10);
            $table->string('status', 20)->default('draft'); // draft, posted, applied
            $table->date('return_date');
            $table->integer('days_since_invoice')->default(0);
            $table->unsignedBigInteger('authorized_by')->nullable();
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->timestamp('posted_at')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('original_invoice_id')->references('id')->on('customer_invoices');
            $table->foreign('customer_id')->references('id')->on('contacts_customers');
            $table->foreign('authorized_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_notes');
    }
};

