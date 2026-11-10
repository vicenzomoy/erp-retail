<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Lepas foreign key constraint source_doc_no yang merujuk ke tabel existing_documents.
 * Kolom source_doc_no adalah referensi teks bebas ke dokumen asal (misal Lead L0008, PO, dsb),
 * bukan hanya terbatas pada 5 baris baseline dokumen awal.
 */
return new class extends Migration {
    public function up(): void
    {
        // 1. sales_orders
        if (Schema::hasTable('sales_orders')) {
            try {
                DB::statement('ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_source_doc_no_foreign');
            } catch (\Throwable $e) {
                // Abaikan jika constraint tidak ditemukan
            }
        }

        // 2. customer_invoices
        if (Schema::hasTable('customer_invoices')) {
            try {
                DB::statement('ALTER TABLE customer_invoices DROP CONSTRAINT IF EXISTS customer_invoices_source_doc_no_foreign');
            } catch (\Throwable $e) {
                // Abaikan jika constraint tidak ditemukan
            }
        }

        // 3. purchase_orders
        if (Schema::hasTable('purchase_orders')) {
            try {
                DB::statement('ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_source_doc_no_foreign');
            } catch (\Throwable $e) {
                // Abaikan jika constraint tidak ditemukan
            }
        }

        // 4. vendor_bills
        if (Schema::hasTable('vendor_bills')) {
            try {
                DB::statement('ALTER TABLE vendor_bills DROP CONSTRAINT IF EXISTS vendor_bills_source_doc_no_foreign');
            } catch (\Throwable $e) {
                // Abaikan jika constraint tidak ditemukan
            }
        }
    }

    public function down(): void
    {
        // Tidak perlu mengembalikan constraint ke existing_documents karena membatasi dokumen baru
    }
};

