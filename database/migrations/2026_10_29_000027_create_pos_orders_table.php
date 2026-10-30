<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_orders', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('pos_session_id', 20);
            $table->unsignedBigInteger('cashier_user_id');
            $table->string('customer_id', 10)->nullable();
            $table->string('status', 20)->default('open'); // open, paid, refunded, voided
            $table->string('payment_method', 20)->default('cash'); // cash, qris, card
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('cash_tendered', 15, 2)->default(0);
            $table->decimal('change_given', 15, 2)->default(0);
            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('pos_session_id')->references('id')->on('pos_sessions');
            $table->foreign('cashier_user_id')->references('id')->on('users');
            $table->foreign('customer_id')->references('id')->on('contacts_customers')->nullOnDelete();
            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();

            $table->index(['pos_session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_orders');
    }
};
