<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('source_doc_no', 20)->nullable();
            $table->string('vendor_id', 10);
            $table->string('status', 20)->default('rfq'); // rfq, confirmed, done, cancelled
            $table->string('payment_terms', 20);
            $table->decimal('subtotal_before_tax', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('source_doc_no')->references('document_no')->on('existing_documents')->nullOnDelete();
            $table->foreign('vendor_id')->references('id')->on('contacts_vendors');
            $table->foreign('payment_terms')->references('term_id')->on('payment_terms');
            $table->foreign('confirmed_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['vendor_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
