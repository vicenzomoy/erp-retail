<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderLine;
use App\Models\InternalTransfer;
use App\Models\InternalTransferLine;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\Receipt;
use App\Models\ReceiptLine;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SalesOrder;
use App\Models\SalesOrderLine;
use App\Models\StockLedger;
use App\Models\StockReservation;
use App\Models\User;
use App\Models\VendorBill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AppInitialSeeder extends Seeder
{
    /**
     * Seed transactional baseline data and demo users.
     */
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['id' => 'owner', 'display_name' => 'Owner', 'description' => 'Akses penuh ke seluruh modul sistem'],
            ['id' => 'sales', 'display_name' => 'Sales', 'description' => 'Akses ke modul CRM dan Sales Order'],
            ['id' => 'warehouse', 'display_name' => 'Warehouse', 'description' => 'Akses ke modul Inventory, Pengiriman, Penerimaan dan Transfer'],
            ['id' => 'finance', 'display_name' => 'Finance', 'description' => 'Akses ke Faktur, Pembayaran, dan Buku Besar'],
            ['id' => 'cashier', 'display_name' => 'Cashier', 'description' => 'Akses operasional Point of Sale'],
            ['id' => 'procurement', 'display_name' => 'Procurement', 'description' => 'Akses ke Pembelian dan Vendor'],
        ];

        foreach ($roles as $r) {
            Role::firstOrCreate(['id' => $r['id']], $r);
        }

        // 2. Role Permissions (SR-18)
        $permissions = [
            // Cashier restrictions
            ['role_id' => 'cashier', 'module' => 'accounting', 'action' => 'post_gl', 'is_allowed' => false],
            ['role_id' => 'cashier', 'module' => 'sales', 'action' => 'edit_credit_limit', 'is_allowed' => false],
            ['role_id' => 'cashier', 'module' => 'sales', 'action' => 'approve_discount', 'is_allowed' => false],
            ['role_id' => 'cashier', 'module' => 'pos', 'action' => 'open_session', 'is_allowed' => true],
            ['role_id' => 'cashier', 'module' => 'pos', 'action' => 'sell', 'is_allowed' => true],
            // Warehouse permissions
            ['role_id' => 'warehouse', 'module' => 'inventory', 'action' => 'view', 'is_allowed' => true],
            ['role_id' => 'warehouse', 'module' => 'inventory', 'action' => 'transfer', 'is_allowed' => true],
            ['role_id' => 'warehouse', 'module' => 'inventory', 'action' => 'validate_receipt', 'is_allowed' => true],
            ['role_id' => 'warehouse', 'module' => 'inventory', 'action' => 'validate_delivery', 'is_allowed' => true],
            // Owner permissions
            ['role_id' => 'owner', 'module' => 'sales', 'action' => 'approve_discount', 'is_allowed' => true],
            ['role_id' => 'owner', 'module' => 'accounting', 'action' => 'post_gl', 'is_allowed' => true],
            // Finance permissions
            ['role_id' => 'finance', 'module' => 'accounting', 'action' => 'post_gl', 'is_allowed' => true],
            ['role_id' => 'finance', 'module' => 'sales', 'action' => 'edit_credit_limit', 'is_allowed' => true],
            // Procurement permissions for inventory (read-only on overview, receipts, products, forecast, moves)
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'view_overview', 'is_allowed' => true],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'view_receipts', 'is_allowed' => true],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'view_products', 'is_allowed' => true],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'view_forecast', 'is_allowed' => true],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'view_moves', 'is_allowed' => true],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'deliveries', 'is_allowed' => false],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'transfers', 'is_allowed' => false],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'locations', 'is_allowed' => false],
            ['role_id' => 'procurement', 'module' => 'inventory', 'action' => 'validate_receipt', 'is_allowed' => false],
        ];

        foreach ($permissions as $p) {
            RolePermission::firstOrCreate(
                ['role_id' => $p['role_id'], 'module' => $p['module'], 'action' => $p['action']],
                $p
            );
        }

        // 3. Demo Users
        $users = [
            [
                'name' => 'Budi Santoso',
                'email' => 'warehouse.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'Siti Rahma',
                'email' => 'sales.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'sales',
                'is_active' => true,
            ],
            [
                'name' => 'Doni Hendra',
                'email' => 'finance.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'finance',
                'is_active' => true,
            ],
            [
                'name' => 'Maya Sari',
                'email' => 'cashier.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'cashier',
                'is_active' => true,
            ],
            [
                'name' => 'Ahmad Reza',
                'email' => 'procurement.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'procurement',
                'is_active' => true,
            ],
            [
                'name' => 'H. Bara Pratama',
                'email' => 'owner.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'owner',
                'is_active' => true,
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(['email' => $u['email']], $u);
        }

        $warehouseUser = User::where('role_id', 'warehouse')->first() ?? User::first();
        $salesUser = User::where('role_id', 'sales')->first() ?? User::first();
        $procurementUser = User::where('role_id', 'procurement')->first() ?? $warehouseUser;

        // 4. Initialize stock_ledger from opening_stock baseline if empty
        if (StockLedger::count() === 0) {
            $openingRows = DB::table('opening_stock')->get();
            $products = Product::all()->keyBy('variant_sku');

            foreach ($openingRows as $row) {
                $cost = $products[$row->variant_sku]->cost ?? 0;

                // WH-PKU
                if ($row->WH_PKU_qty > 0) {
                    StockLedger::create([
                        'variant_sku' => $row->variant_sku,
                        'location_code' => 'WH-PKU',
                        'move_type' => 'opening_balance',
                        'qty_change' => $row->WH_PKU_qty,
                        'qty_on_hand_after' => $row->WH_PKU_qty,
                        'unit_cost' => $cost,
                        'total_value_change' => bcmul((string) $row->WH_PKU_qty, (string) $cost, 2),
                        'source_document_type' => 'opening_stock',
                        'source_document_id' => 'OPENING',
                        'moved_by' => $warehouseUser->id,
                        'created_at' => now(),
                    ]);
                }

                // TOKO-PKU
                if ($row->TOKO_PKU_qty > 0) {
                    StockLedger::create([
                        'variant_sku' => $row->variant_sku,
                        'location_code' => 'TOKO-PKU',
                        'move_type' => 'opening_balance',
                        'qty_change' => $row->TOKO_PKU_qty,
                        'qty_on_hand_after' => $row->TOKO_PKU_qty,
                        'unit_cost' => $cost,
                        'total_value_change' => bcmul((string) $row->TOKO_PKU_qty, (string) $cost, 2),
                        'source_document_type' => 'opening_stock',
                        'source_document_id' => 'OPENING',
                        'moved_by' => $warehouseUser->id,
                        'created_at' => now(),
                    ]);
                }
            }
        }

        // 5. Existing Document SO0008 (Sales Order C005, 3 TSP-M-BLK Reserved at WH-PKU)
        DB::table('existing_documents')->where('document_no', 'S00008')->update(['document_no' => 'SO0008']);

        $so8 = SalesOrder::firstOrCreate(
            ['id' => 'SO0008'],
            [
                'source_doc_no' => 'SO0008',
                'customer_id' => 'C005',
                'status' => 'confirmed',
                'credit_hold' => false,
                'discount_hold' => false,
                'payment_terms' => 'NET30',
                'subtotal_before_tax' => 477000,
                'total_tax' => 52470,
                'grand_total' => 529470,
                'confirmed_at' => now(),
                'confirmed_by' => $salesUser->id,
                'created_by' => $salesUser->id,
                'notes' => 'Existing Sales Order SO0008 (Baseline)',
            ]
        );

        $so8Line = SalesOrderLine::firstOrCreate(
            ['sales_order_id' => 'SO0008', 'variant_sku' => 'TSP-M-BLK'],
            [
                'qty_ordered' => 3,
                'qty_delivered' => 0,
                'qty_invoiced' => 0,
                'unit_price' => 159000,
                'discount_pct' => 0,
                'tax_id' => 'VAT-NONLUX',
                'subtotal_before_tax' => 477000,
                'tax_amount' => 52470,
                'line_total' => 529470,
                'price_locked_at' => now(),
            ]
        );

        // Reserve 3 units for SO0008 at WH-PKU
        StockReservation::firstOrCreate(
            ['sales_order_id' => 'SO0008', 'so_line_id' => $so8Line->id],
            [
                'variant_sku' => 'TSP-M-BLK',
                'location_code' => 'WH-PKU',
                'qty_reserved' => 3,
                'status' => 'active',
                'reserved_at' => now(),
            ]
        );

        // Generate baseline Delivery Order for SO0008 (WH-PKU/OUT/0001)
        $deliveryService = app(\App\Services\Inventory\DeliveryOrderService::class);
        $deliveryService->createFromSalesOrder($so8, $salesUser, 'WH-PKU');

        // Update existing document P00007 -> PO0007
        DB::table('existing_documents')->where('document_no', 'P00007')->update(['document_no' => 'PO0007']);

        // 6. Existing Document PO0007 (PO V03, 10 JNS-30-BLU @ 168.000)
        $po7 = PurchaseOrder::firstOrCreate(
            ['id' => 'PO0007'],
            [
                'source_doc_no' => 'PO0007',
                'vendor_id' => 'V03',
                'status' => 'confirmed',
                'payment_terms' => 'NET30',
                'subtotal_before_tax' => 1680000,
                'total_tax' => 184800,
                'grand_total' => 1864800,
                'confirmed_at' => now(),
                'confirmed_by' => $procurementUser->id ?? $warehouseUser->id,
                'created_by' => $warehouseUser->id,
                'notes' => 'Existing Purchase Order PO0007 (Baseline)',
            ]
        );

        PurchaseOrderLine::firstOrCreate(
            ['purchase_order_id' => 'PO0007', 'variant_sku' => 'JNS-30-BLU'],
            [
                'qty_ordered' => 10,
                'qty_received' => 0,
                'qty_billed' => 0,
                'unit_price' => 168000,
                'tax_id' => 'VAT-NONLUX',
                'subtotal_before_tax' => 1680000,
                'tax_amount' => 184800,
                'line_total' => 1864800,
            ]
        );

        // Generate baseline Receipt for PO0007 (WH-PKU/IN/0001)
        $poService = app(\App\Services\Purchase\PurchaseOrderService::class);
        $poService->ensureReceiptCreated($po7, $warehouseUser);

        $financeUser = User::where('role_id', 'finance')->first() ?? $salesUser;

        // 8b. Opening Balance Journal Entry (Baseline GL: Bank Rp50jt, AR Rp2,5jt, Inventory Rp24.531.000, AP Rp5jt)
        $openJe = JournalEntry::firstOrCreate(
            ['entry_no' => 'JE/OPEN/0001'],
            [
                'entry_type'           => 'opening_balance',
                'source_document_type' => 'opening_balance',
                'source_document_id'   => 'OPENING',
                'entry_date'           => now()->subDays(5)->toDateString(),
                'description'          => 'Saldo Awal Buku Besar (Bank, Piutang INV-OPEN01, Persediaan, Utang BILL-OPEN01, Modal)',
                'status'               => 'posted',
                'is_balanced'          => true,
                'total_debit'          => 77031000.00,
                'total_credit'         => 77031000.00,
                'posted_at'            => now()->subDays(5),
                'posted_by'            => $financeUser->id,
                'created_by'           => $financeUser->id,
            ]
        );

        if ($openJe->lines()->count() === 0) {
            $openLines = [
                ['account_code' => '1020', 'description' => 'Saldo Awal Bank Operasional', 'debit' => 50000000.00, 'credit' => 0.00],
                ['account_code' => '1100', 'description' => 'Saldo Awal Piutang Usaha (INV-OPEN01 - PT Riau Mode Bersama)', 'debit' => 2500000.00, 'credit' => 0.00],
                ['account_code' => '1200', 'description' => 'Saldo Awal Persediaan Barang Dagang (219 pcs)', 'debit' => 24531000.00, 'credit' => 0.00],
                ['account_code' => '2100', 'description' => 'Saldo Awal Utang Usaha (BILL-OPEN01 - CV Jaket Nusantara)', 'debit' => 0.00, 'credit' => 5000000.00],
                ['account_code' => '3000', 'description' => 'Modal Awal PT Bara Ritel Nusantara', 'debit' => 0.00, 'credit' => 72031000.00],
            ];
            foreach ($openLines as $ol) {
                JournalLine::create(array_merge($ol, [
                    'journal_entry_id' => $openJe->id,
                    'created_at'       => now()->subDays(5),
                ]));
            }
        }

        // 9. Existing Document INV-OPEN01 (Customer Invoice C001, AR Rp2.500.000 for T-05, T-12, T-37)
        CustomerInvoice::updateOrCreate(
            ['id' => 'INV-OPEN01'],
            [
                'source_doc_no' => 'INV-OPEN01',
                'customer_id' => 'C001',
                'status' => 'posted',
                'invoice_date' => now()->subDays(5)->toDateString(),
                'due_date' => now()->addDays(9)->toDateString(),
                'payment_terms' => 'NET14',
                'subtotal_before_tax' => 2252252.25,
                'total_tax' => 247747.75,
                'grand_total' => 2500000.00,
                'amount_paid' => 0.00,
                'amount_residual' => 2500000.00,
                'posted_at' => now()->subDays(5),
                'posted_by' => $financeUser->id,
                'journal_entry_id' => $openJe->id,
                'created_by' => $salesUser->id,
                'notes' => 'Existing Customer Invoice INV-OPEN01 (Baseline AR Rp2.500.000)',
            ]
        );

        // 10. Existing Document BILL-OPEN01 (Vendor Bill V02, AP Rp5.000.000 for T-37)
        VendorBill::updateOrCreate(
            ['id' => 'BILL-OPEN01'],
            [
                'source_doc_no' => 'BILL-OPEN01',
                'vendor_id' => 'V02',
                'status' => 'posted',
                'bill_date' => now()->subDays(5)->toDateString(),
                'due_date' => now()->addDays(9)->toDateString(),
                'payment_terms' => 'NET14',
                'subtotal_before_tax' => 4504504.50,
                'total_tax' => 495495.50,
                'grand_total' => 5000000.00,
                'amount_paid' => 0.00,
                'amount_residual' => 5000000.00,
                'posted_at' => now()->subDays(5),
                'posted_by' => $financeUser->id,
                'journal_entry_id' => $openJe->id,
                'created_by' => $warehouseUser->id,
                'notes' => 'Existing Vendor Bill BILL-OPEN01 (Baseline AP Rp5.000.000)',
            ]
        );

        // 11. Baseline CRM Leads (F-05 / S-05, T-09, T-10)
        $crmBaseline = [
            [
                'id' => 'L0007',
                'source_doc_no' => 'L0007',
                'customer_id' => 'C002',
                'contact_name' => 'Ibu Dewi (Purchasing)',
                'stage' => 'new',
                'type' => 'lead',
                'expected_revenue' => 318000.00,
                'variant_sku' => 'TSP-M-BLK',
                'qty_interest' => 2,
                'assigned_user_id' => $salesUser->id,
                'created_by' => $salesUser->id,
                'converted_at' => null,
                'won_at' => null,
                'lost_at' => null,
            ],
        ];

        foreach ($crmBaseline as $lead) {
            \App\Models\CrmLead::updateOrCreate(['id' => $lead['id']], $lead);
        }
    }
}

