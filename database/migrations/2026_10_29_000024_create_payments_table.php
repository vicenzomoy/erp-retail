<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('payment_type', 20); // inbound, outbound
            $table->string('party_type', 20); // customer, vendor
            $table->string('party_id', 10);
            $table->string('payment_method', 20); // cash, bank_transfer
            $table->string('bank_account_code', 10);
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->string('reference', 100)->nullable();
            $table->string('status', 20)->default('draft'); // draft, posted, reconciled
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('idempotency_key', 64)->unique();
            $table->timestamp('posted_at')->nullable();
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('bank_account_code')->references('code')->on('chart_of_accounts');
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();
            $table->foreign('posted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['party_type', 'party_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

