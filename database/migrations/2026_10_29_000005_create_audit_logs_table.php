<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('actor_user_id')->nullable();
            $table->string('actor_username', 50);
            $table->string('actor_role', 30);
            $table->string('action', 80);
            $table->string('status', 20); // SUCCESS / REJECTED / DUPLICATE
            $table->string('document_type', 50)->nullable();
            $table->string('document_id', 30)->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // NO updated_at — audit logs are append-only

            $table->foreign('actor_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['document_type', 'document_id']);
            $table->index('actor_user_id');
            $table->index(['action', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
