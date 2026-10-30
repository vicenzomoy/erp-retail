<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->string('payment_id', 20);
            $table->string('document_type', 30); // customer_invoice, vendor_bill, credit_note
            $table->string('document_id', 20);
            $table->decimal('amount_allocated', 15, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            $table->unique(['payment_id', 'document_type', 'document_id']);
            $table->index(['document_type', 'document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
    }
};

