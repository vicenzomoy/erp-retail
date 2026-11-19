<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persetujuan Finance untuk Purchase Order bernilai besar (> Rp 5.000.000).
 * Status PO bertambah: rfq -> to_approve -> confirmed -> done (atau cancelled).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->timestamp('approval_requested_at')->nullable()->after('confirmed_by');
            $table->unsignedBigInteger('approval_requested_by')->nullable()->after('approval_requested_at');
            $table->timestamp('approved_at')->nullable()->after('approval_requested_by');
            $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->after('approved_by');
            $table->unsignedBigInteger('rejected_by')->nullable()->after('rejected_at');
            $table->text('approval_notes')->nullable()->after('rejected_by');

            $table->foreign('approval_requested_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('rejected_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['approval_requested_by']);
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropColumn([
                'approval_requested_at',
                'approval_requested_by',
                'approved_at',
                'approved_by',
                'rejected_at',
                'rejected_by',
                'approval_notes',
            ]);
        });
    }
};
