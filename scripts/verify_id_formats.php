<?php
/**
 * Script verifikasi format ID setelah migrate:fresh --seed
 * Jalankan: php scripts/verify_id_formats.php
 */

require 'c:/laragon/www/erp-retail/vendor/autoload.php';
$app = require 'c:/laragon/www/erp-retail/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFIKASI FORMAT ID ERP RETAIL ===\n\n";

// SO
$salesService = app(App\Services\Sales\SalesOrderService::class);
$nextSo = $salesService->generateOrderId();
echo "Next SO ID   : {$nextSo}  (expected: SO0009)\n";
$check = $nextSo === 'SO0009' ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// PO
$poService = app(App\Services\Purchase\PurchaseOrderService::class);
$nextPo = $poService->generatePoId();
echo "Next PO ID   : {$nextPo}  (expected: PO0008)\n";
$check = $nextPo === 'PO0008' ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Receipt
$nextRcp = $poService->generateReceiptId('WH-PKU');
echo "Next Receipt : {$nextRcp}  (expected: WH-PKU/IN/0002)\n";
$check = $nextRcp === 'WH-PKU/IN/0002' ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Lead
$leadService = app(App\Services\Crm\CrmLeadService::class);
$nextLead = $leadService->generateLeadId();
echo "Next Lead ID : {$nextLead}  (expected: L0008)\n";
$check = $nextLead === 'L0008' ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Invoice
$invService = app(App\Services\Accounting\CustomerInvoiceService::class);
$nextInv = $invService->generateInvoiceId();
$year = date('Y');
$month = date('m');
$expectedInv = "INV/{$year}/{$month}/0001";
echo "Next Invoice : {$nextInv}  (expected: {$expectedInv})\n";
$check = $nextInv === $expectedInv ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Vendor Bill
$billService = app(App\Services\Accounting\VendorBillService::class);
$nextBill = $billService->generateBillId();
$expectedBill = "BILL/{$year}/{$month}/0001";
echo "Next Bill    : {$nextBill}  (expected: {$expectedBill})\n";
$check = $nextBill === $expectedBill ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Delivery
$doService = app(App\Services\Inventory\DeliveryOrderService::class);
$nextDo = $doService->generateDeliveryId('WH-PKU');
echo "Next DO      : {$nextDo}  (expected: WH-PKU/OUT/0002)\n";
$check = $nextDo === 'WH-PKU/OUT/0002' ? '✅' : '❌';
echo "Status       : {$check}\n\n";

// Tampilkan data aktual di DB
echo "=== DATA AKTUAL DI DATABASE ===\n";
echo "\nSales Orders  : " . implode(', ', Illuminate\Support\Facades\DB::table('sales_orders')->pluck('id')->toArray()) . "\n";
echo "Purchase Orders: " . implode(', ', Illuminate\Support\Facades\DB::table('purchase_orders')->pluck('id')->toArray()) . "\n";
echo "Delivery Orders: " . implode(', ', Illuminate\Support\Facades\DB::table('delivery_orders')->pluck('id')->toArray()) . "\n";
echo "Receipts       : " . implode(', ', Illuminate\Support\Facades\DB::table('receipts')->pluck('id')->toArray()) . "\n";
echo "CRM Leads      : " . implode(', ', Illuminate\Support\Facades\DB::table('crm_leads')->pluck('id')->toArray()) . "\n";
echo "Invoices       : " . implode(', ', Illuminate\Support\Facades\DB::table('customer_invoices')->pluck('id')->toArray()) . "\n";
echo "Vendor Bills   : " . implode(', ', Illuminate\Support\Facades\DB::table('vendor_bills')->pluck('id')->toArray()) . "\n";

