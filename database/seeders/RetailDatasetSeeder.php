<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RetailDatasetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Master Independen
        DB::table('payment_terms')->insert([
            ['term_id' => 'CASH', 'due_days' => 0, 'description' => 'Pembayaran langsung'],
            ['term_id' => 'NET14', 'due_days' => 14, 'description' => 'Jatuh tempo 14 hari'],
            ['term_id' => 'NET30', 'due_days' => 30, 'description' => 'Jatuh tempo 30 hari'],
        ]);

        DB::table('chart_of_accounts')->insert([
            ['code' => '1010', 'account_name' => 'Kas', 'account_type' => 'Aset lancar'],
            ['code' => '1020', 'account_name' => 'Bank', 'account_type' => 'Aset lancar'],
            ['code' => '1100', 'account_name' => 'Piutang Usaha', 'account_type' => 'Aset lancar'],
            ['code' => '1200', 'account_name' => 'Persediaan', 'account_type' => 'Aset lancar'],
            ['code' => '1210', 'account_name' => 'Barang Dalam Pemeriksaan', 'account_type' => 'Aset lancar'],
            ['code' => '1300', 'account_name' => 'PPN Masukan', 'account_type' => 'Aset lancar'],
            ['code' => '1400', 'account_name' => 'Stock Interim Received', 'account_type' => 'Aset lancar'],
            ['code' => '2100', 'account_name' => 'Utang Usaha', 'account_type' => 'Liabilitas'],
            ['code' => '2200', 'account_name' => 'PPN Keluaran', 'account_type' => 'Liabilitas'],
            ['code' => '2300', 'account_name' => 'Uang Muka Pelanggan', 'account_type' => 'Liabilitas'],
            ['code' => '3000', 'account_name' => 'Modal Awal', 'account_type' => 'Ekuitas'],
            ['code' => '4000', 'account_name' => 'Penjualan Grosir', 'account_type' => 'Pendapatan'],
            ['code' => '4010', 'account_name' => 'Penjualan POS', 'account_type' => 'Pendapatan'],
            ['code' => '5000', 'account_name' => 'Beban Pokok Penjualan', 'account_type' => 'Beban'],
            ['code' => '5100', 'account_name' => 'Selisih Harga Beli', 'account_type' => 'Beban'],
        ]);

        DB::table('tax_rates')->insert([
            [
                'tax_id' => 'VAT-NONLUX',
                'formal_rate' => '12%',
                'tax_base_factor' => '11/12',
                'effective_rate' => '11%',
                'rounding_policy' => 'Per invoice line; rupiah terdekat'
            ],
        ]);

        DB::table('warehouses_locations')->insert([
            ['location_code' => 'WH-PKU', 'location_name' => 'Gudang pusat', 'type' => 'Internal warehouse', 'city' => 'Pekanbaru'],
            ['location_code' => 'TOKO-PKU', 'location_name' => 'Gerai utama', 'type' => 'Retail store', 'city' => 'Pekanbaru'],
        ]);

        // 2. Tabel Kontak Eksternal
        DB::table('contacts_customers')->insert([
            ['id' => 'C001', 'name' => 'PT Riau Mode Bersama', 'type' => 'B2B', 'city' => 'Pekanbaru', 'credit_limit' => 5000000, 'payment_terms' => 'NET14'],
            ['id' => 'C002', 'name' => 'CV Karya Busana', 'type' => 'B2B', 'city' => 'Dumai', 'credit_limit' => 4000000, 'payment_terms' => 'NET14'],
            ['id' => 'C003', 'name' => 'Nadia Putri', 'type' => 'Individu', 'city' => 'Pekanbaru', 'credit_limit' => 1500000, 'payment_terms' => 'CASH'],
            ['id' => 'C004', 'name' => 'Satria Fikri', 'type' => 'Individu', 'city' => 'Pekanbaru', 'credit_limit' => 1000000, 'payment_terms' => 'CASH'],
            ['id' => 'C005', 'name' => 'Toko Mentari Riau', 'type' => 'B2B', 'city' => 'Siak', 'credit_limit' => 6000000, 'payment_terms' => 'NET30'],
            ['id' => 'C006', 'name' => 'Dewi Permata', 'type' => 'Individu', 'city' => 'Bangkinang', 'credit_limit' => 1200000, 'payment_terms' => 'CASH'],
        ]);

        DB::table('contacts_vendors')->insert([
            ['id' => 'V01', 'name' => 'PT Sandang Prima', 'city' => 'Bandung', 'payment_terms' => 'NET30'],
            ['id' => 'V02', 'name' => 'CV Jaket Nusantara', 'city' => 'Jakarta', 'payment_terms' => 'NET14'],
            ['id' => 'V03', 'name' => 'PT Denim Mandiri', 'city' => 'Bandung', 'payment_terms' => 'NET30'],
            ['id' => 'V04', 'name' => 'UD Aksesori Sumatra', 'city' => 'Medan', 'payment_terms' => 'NET14'],
        ]);

        // 3. Tabel Produk
        DB::table('products')->insert([
            ['variant_sku' => 'TSP-M-BLK', 'name' => 'Kaos Basic', 'size' => 'M', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 159000, 'cost' => 88000, 'default_vendor' => 'V01'],
            ['variant_sku' => 'TSP-L-BLK', 'name' => 'Kaos Basic', 'size' => 'L', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 159000, 'cost' => 88000, 'default_vendor' => 'V01'],
            ['variant_sku' => 'TSP-M-WHT', 'name' => 'Kaos Basic', 'size' => 'M', 'color' => 'Putih', 'unit' => 'pcs', 'sales_price' => 159000, 'cost' => 88000, 'default_vendor' => 'V01'],
            ['variant_sku' => 'TSP-L-WHT', 'name' => 'Kaos Basic', 'size' => 'L', 'color' => 'Putih', 'unit' => 'pcs', 'sales_price' => 159000, 'cost' => 88000, 'default_vendor' => 'V01'],
            ['variant_sku' => 'JKT-M-BLK', 'name' => 'Jaket Urban', 'size' => 'M', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 349000, 'cost' => 205000, 'default_vendor' => 'V02'],
            ['variant_sku' => 'JKT-L-BLK', 'name' => 'Jaket Urban', 'size' => 'L', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 349000, 'cost' => 205000, 'default_vendor' => 'V02'],
            ['variant_sku' => 'JKT-M-CRM', 'name' => 'Jaket Urban', 'size' => 'M', 'color' => 'Krem', 'unit' => 'pcs', 'sales_price' => 349000, 'cost' => 205000, 'default_vendor' => 'V02'],
            ['variant_sku' => 'JKT-L-CRM', 'name' => 'Jaket Urban', 'size' => 'L', 'color' => 'Krem', 'unit' => 'pcs', 'sales_price' => 349000, 'cost' => 205000, 'default_vendor' => 'V02'],
            ['variant_sku' => 'JNS-30-BLU', 'name' => 'Jeans Regular', 'size' => '30', 'color' => 'Biru', 'unit' => 'pcs', 'sales_price' => 289000, 'cost' => 168000, 'default_vendor' => 'V03'],
            ['variant_sku' => 'JNS-32-BLU', 'name' => 'Jeans Regular', 'size' => '32', 'color' => 'Biru', 'unit' => 'pcs', 'sales_price' => 289000, 'cost' => 168000, 'default_vendor' => 'V03'],
            ['variant_sku' => 'JNS-30-BLK', 'name' => 'Jeans Regular', 'size' => '30', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 289000, 'cost' => 168000, 'default_vendor' => 'V03'],
            ['variant_sku' => 'JNS-32-BLK', 'name' => 'Jeans Regular', 'size' => '32', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 289000, 'cost' => 168000, 'default_vendor' => 'V03'],
            ['variant_sku' => 'CAP-OS-BLK', 'name' => 'Topi Logo', 'size' => 'OS', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 99000, 'cost' => 47000, 'default_vendor' => 'V04'],
            ['variant_sku' => 'BAG-OS-CRM', 'name' => 'Tas Kanvas', 'size' => 'OS', 'color' => 'Krem', 'unit' => 'pcs', 'sales_price' => 129000, 'cost' => 65000, 'default_vendor' => 'V04'],
            ['variant_sku' => 'BAG-OS-BLK', 'name' => 'Tas Kanvas', 'size' => 'OS', 'color' => 'Hitam', 'unit' => 'pcs', 'sales_price' => 129000, 'cost' => 65000, 'default_vendor' => 'V04'],
        ]);

        // 4. Tabel Relasi & Stok
        DB::table('vendor_pricelist')->insert([
            ['vendor_id' => 'V01', 'variant_sku' => 'TSP-M-BLK', 'min_qty' => 1, 'unit_price' => 88000, 'currency' => 'IDR'],
            ['vendor_id' => 'V01', 'variant_sku' => 'TSP-L-BLK', 'min_qty' => 1, 'unit_price' => 88000, 'currency' => 'IDR'],
            ['vendor_id' => 'V01', 'variant_sku' => 'TSP-M-WHT', 'min_qty' => 1, 'unit_price' => 88000, 'currency' => 'IDR'],
            ['vendor_id' => 'V01', 'variant_sku' => 'TSP-L-WHT', 'min_qty' => 1, 'unit_price' => 88000, 'currency' => 'IDR'],
            ['vendor_id' => 'V02', 'variant_sku' => 'JKT-M-BLK', 'min_qty' => 1, 'unit_price' => 205000, 'currency' => 'IDR'],
            ['vendor_id' => 'V02', 'variant_sku' => 'JKT-L-BLK', 'min_qty' => 1, 'unit_price' => 205000, 'currency' => 'IDR'],
            ['vendor_id' => 'V02', 'variant_sku' => 'JKT-M-CRM', 'min_qty' => 1, 'unit_price' => 205000, 'currency' => 'IDR'],
            ['vendor_id' => 'V02', 'variant_sku' => 'JKT-L-CRM', 'min_qty' => 1, 'unit_price' => 205000, 'currency' => 'IDR'],
            ['vendor_id' => 'V03', 'variant_sku' => 'JNS-30-BLU', 'min_qty' => 1, 'unit_price' => 168000, 'currency' => 'IDR'],
            ['vendor_id' => 'V03', 'variant_sku' => 'JNS-32-BLU', 'min_qty' => 1, 'unit_price' => 168000, 'currency' => 'IDR'],
            ['vendor_id' => 'V03', 'variant_sku' => 'JNS-30-BLK', 'min_qty' => 1, 'unit_price' => 168000, 'currency' => 'IDR'],
            ['vendor_id' => 'V03', 'variant_sku' => 'JNS-32-BLK', 'min_qty' => 1, 'unit_price' => 168000, 'currency' => 'IDR'],
            ['vendor_id' => 'V04', 'variant_sku' => 'CAP-OS-BLK', 'min_qty' => 1, 'unit_price' => 47000, 'currency' => 'IDR'],
            ['vendor_id' => 'V04', 'variant_sku' => 'BAG-OS-CRM', 'min_qty' => 1, 'unit_price' => 65000, 'currency' => 'IDR'],
            ['vendor_id' => 'V04', 'variant_sku' => 'BAG-OS-BLK', 'min_qty' => 1, 'unit_price' => 65000, 'currency' => 'IDR'],
        ]);

        DB::table('opening_stock')->insert([
            ['variant_sku' => 'TSP-M-BLK', 'WH_PKU_qty' => 12, 'TOKO_PKU_qty' => 8, 'company_total_qty' => 20, 'standard_value' => 1760000],
            ['variant_sku' => 'TSP-L-BLK', 'WH_PKU_qty' => 10, 'TOKO_PKU_qty' => 7, 'company_total_qty' => 17, 'standard_value' => 1496000],
            ['variant_sku' => 'TSP-M-WHT', 'WH_PKU_qty' => 9, 'TOKO_PKU_qty' => 6, 'company_total_qty' => 15, 'standard_value' => 1320000],
            ['variant_sku' => 'TSP-L-WHT', 'WH_PKU_qty' => 11, 'TOKO_PKU_qty' => 5, 'company_total_qty' => 16, 'standard_value' => 1408000],
            ['variant_sku' => 'JKT-M-BLK', 'WH_PKU_qty' => 6, 'TOKO_PKU_qty' => 3, 'company_total_qty' => 9, 'standard_value' => 1845000],
            ['variant_sku' => 'JKT-L-BLK', 'WH_PKU_qty' => 4, 'TOKO_PKU_qty' => 3, 'company_total_qty' => 7, 'standard_value' => 1435000],
            ['variant_sku' => 'JKT-M-CRM', 'WH_PKU_qty' => 7, 'TOKO_PKU_qty' => 2, 'company_total_qty' => 9, 'standard_value' => 1845000],
            ['variant_sku' => 'JKT-L-CRM', 'WH_PKU_qty' => 5, 'TOKO_PKU_qty' => 2, 'company_total_qty' => 7, 'standard_value' => 1435000],
            ['variant_sku' => 'JNS-30-BLU', 'WH_PKU_qty' => 9, 'TOKO_PKU_qty' => 5, 'company_total_qty' => 14, 'standard_value' => 2352000],
            ['variant_sku' => 'JNS-32-BLU', 'WH_PKU_qty' => 7, 'TOKO_PKU_qty' => 4, 'company_total_qty' => 11, 'standard_value' => 1848000],
            ['variant_sku' => 'JNS-30-BLK', 'WH_PKU_qty' => 8, 'TOKO_PKU_qty' => 4, 'company_total_qty' => 12, 'standard_value' => 2016000],
            ['variant_sku' => 'JNS-32-BLK', 'WH_PKU_qty' => 6, 'TOKO_PKU_qty' => 3, 'company_total_qty' => 9, 'standard_value' => 1512000],
            ['variant_sku' => 'CAP-OS-BLK', 'WH_PKU_qty' => 15, 'TOKO_PKU_qty' => 12, 'company_total_qty' => 27, 'standard_value' => 1269000],
            ['variant_sku' => 'BAG-OS-CRM', 'WH_PKU_qty' => 14, 'TOKO_PKU_qty' => 9, 'company_total_qty' => 23, 'standard_value' => 1495000],
            ['variant_sku' => 'BAG-OS-BLK', 'WH_PKU_qty' => 13, 'TOKO_PKU_qty' => 10, 'company_total_qty' => 23, 'standard_value' => 1495000],
        ]);

        // 5. Tabel Dokumen Transaksi Awal
        DB::table('existing_documents')->insert([
            ['document_no' => 'L0007', 'document_type' => 'Lead', 'party' => 'C002', 'status' => 'New', 'variant_sku' => 'TSP-M-BLK', 'ordered_qty' => 2, 'reserved_qty' => 0, 'accepted_qty' => 0, 'financial_state' => 'No AR/no stock'],
            ['document_no' => 'S00008', 'document_type' => 'Sales Order', 'party' => 'C005', 'status' => 'Confirmed', 'variant_sku' => 'TSP-M-BLK', 'ordered_qty' => 3, 'reserved_qty' => 3, 'accepted_qty' => 0, 'financial_state' => 'Uninvoiced; WH-PKU reservation'],
            ['document_no' => 'P00007', 'document_type' => 'Purchase Order', 'party' => 'V03', 'status' => 'Confirmed', 'variant_sku' => 'JNS-30-BLU', 'ordered_qty' => 10, 'reserved_qty' => 0, 'accepted_qty' => 0, 'financial_state' => 'No bill; no receipt'],
            ['document_no' => 'INV-OPEN01', 'document_type' => 'Customer Invoice', 'party' => 'C001', 'status' => 'Posted', 'variant_sku' => null, 'ordered_qty' => null, 'reserved_qty' => 0, 'accepted_qty' => 0, 'financial_state' => 'AR Rp2.500.000'],
            ['document_no' => 'BILL-OPEN01', 'document_type' => 'Vendor Bill', 'party' => 'V02', 'status' => 'Posted', 'variant_sku' => null, 'ordered_qty' => null, 'reserved_qty' => 0, 'accepted_qty' => 0, 'financial_state' => 'AP Rp5.000.000'],
        ]);
    }
}
