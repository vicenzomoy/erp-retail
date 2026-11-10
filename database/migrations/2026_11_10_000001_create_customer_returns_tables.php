<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_returns', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('sales_order_id', 20)->nullable();
            $table->string('customer_invoice_id', 20);
            $table->string('customer_id', 10);
            $table->date('return_date');
            $table->integer('days_since_invoice')->default(0);
            $table->string('status', 25)->default('pending_inspection'); // pending_inspection, inspected, completed, rejected
            $table->text('reason');
            $table->unsignedBigInteger('sales_user_id');
            $table->unsignedBigInteger('inspected_by')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->text('inspection_notes')->nullable();
            $table->string('credit_note_id', 20)->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->nullOnDelete();
            $table->foreign('customer_invoice_id')->references('id')->on('customer_invoices');
            $table->foreign('customer_id')->references('id')->on('contacts_customers');
            $table->foreign('sales_user_id')->references('id')->on('users');
            $table->foreign('inspected_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
        });

        Schema::create('customer_return_lines', function (Blueprint $table) {
            $table->id();
            $table->string('customer_return_id', 20);
            $table->unsignedBigInteger('customer_invoice_line_id')->nullable();
            $table->string('variant_sku', 20);
            $table->decimal('qty_requested', 12, 3);
            $table->decimal('qty_inspected', 12, 3)->default(0);
            $table->decimal('qty_accepted', 12, 3)->default(0);
            $table->decimal('qty_damaged', 12, 3)->default(0);
            $table->decimal('unit_price', 15, 2);
            $table->string('condition', 20)->default('saleable');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('customer_return_id')->references('id')->on('customer_returns')->cascadeOnDelete();
            $table->foreign('customer_invoice_line_id')->references('id')->on('customer_invoice_lines')->nullOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });

        if (Schema::hasTable('credit_notes') && !Schema::hasColumn('credit_notes', 'customer_return_id')) {
            Schema::table('credit_notes', function (Blueprint $table) {
                $table->string('customer_return_id', 20)->nullable()->after('original_invoice_id');
                $table->foreign('customer_return_id')->references('id')->on('customer_returns')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('credit_notes') && Schema::hasColumn('credit_notes', 'customer_return_id')) {
            Schema::table('credit_notes', function (Blueprint $table) {
                $table->dropForeign(['customer_return_id']);
                $table->dropColumn('customer_return_id');
            });
        }

        Schema::dropIfExists('customer_return_lines');
        Schema::dropIfExists('customer_returns');
    }
};

