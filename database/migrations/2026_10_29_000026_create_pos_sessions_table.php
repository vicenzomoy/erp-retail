<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->unsignedBigInteger('cashier_user_id');
            $table->string('location_code', 20);
            $table->string('status', 20)->default('open'); // open, closing, closed
            $table->decimal('opening_cash_float', 15, 2)->default(0);
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('counted_cash', 15, 2)->nullable();
            $table->decimal('cash_variance', 15, 2)->nullable();
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->unsignedBigInteger('closing_journal_entry_id')->nullable();
            $table->string('idempotency_key', 64)->unique();
            $table->timestamps();

            $table->foreign('cashier_user_id')->references('id')->on('users');
            $table->foreign('location_code')->references('location_code')->on('warehouses_locations');
            $table->foreign('closing_journal_entry_id')->references('id')->on('journal_entries')->nullOnDelete();

            $table->index(['cashier_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};
