<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Status "sudah dibaca" notifikasi per pengguna.
 * event_at = waktu kejadian (mis. rejected_at PO), sehingga penolakan ulang
 * pada dokumen yang sama memunculkan notifikasi baru.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type', 50);          // mis. 'po_rejected'
            $table->string('document_id', 50);   // mis. 'PO0008'
            $table->timestamp('event_at');
            $table->timestamp('read_at');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'type', 'document_id', 'event_at'], 'notification_reads_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
    }
};
