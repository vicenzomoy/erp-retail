<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderLine;
use App\Models\InternalTransfer;
use App\Models\InternalTransferLine;
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
            ['id' => 'owner', 'display_name' => 'Owner / Pemilik', 'description' => 'Akses penuh ke seluruh modul sistem'],
            ['id' => 'sales', 'display_name' => 'Sales', 'description' => 'Akses ke modul CRM dan Sales Order'],
            ['id' => 'warehouse', 'display_name' => 'Warehouse', 'description' => 'Akses ke modul Inventory, Pengiriman, Penerimaan dan Transfer'],
            ['id' => 'finance', 'display_name' => 'Finance & Accounting', 'description' => 'Akses ke Faktur, Pembayaran, dan Buku Besar'],
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
                'name' => 'Budi Santoso (Gudang)',
                'email' => 'warehouse.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'warehouse',
                'is_active' => true,
            ],
            [
                'name' => 'Siti Rahma (Sales)',
                'email' => 'sales.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'sales',
                'is_active' => true,
            ],
            [
                'name' => 'Doni Hendra (Keuangan)',
                'email' => 'finance.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'finance',
                'is_active' => true,
            ],
            [
                'name' => 'Maya Sari (Kasir)',
                'email' => 'cashier.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'cashier',
                'is_active' => true,
            ],
            [
                'name' => 'Ahmad Reza (Pengadaan)',
                'email' => 'procurement.demo@barawear.com',
                'password' => Hash::make('password'),
                'role_id' => 'procurement',
                'is_active' => true,
            ],
            [
                'name' => 'H. Bara Pratama (Owner)',
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

        // 5. Existing Document S00008 (Sales Order C005, 3 TSP-M-BLK Reserved at WH-PKU)
        $so8 = SalesOrder::firstOrCreate(
            ['id' => 'S00008'],
            [
                'source_doc_no' => 'S00008',
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
                'notes' => 'Existing Sales Order S00008 (Baseline)',
            ]
        );

        $so8Line = SalesOrderLine::firstOrCreate(
            ['sales_order_id' => 'S00008', 'variant_sku' => 'TSP-M-BLK'],
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

        // Reserve 3 units for S00008 at WH-PKU
        StockReservation::firstOrCreate(
            ['sales_order_id' => 'S00008', 'so_line_id' => $so8Line->id],
            [
                'variant_sku' => 'TSP-M-BLK',
                'location_code' => 'WH-PKU',
                'qty_reserved' => 3,
                'status' => 'active',
                'reserved_at' => now(),
            ]
        );

        // 6. Existing Document P00007 (PO V03, 10 JNS-30-BLU @ 168.000)
        PurchaseOrder::firstOrCreate(
            ['id' => 'P00007'],
            [
                'source_doc_no' => 'P00007',
                'vendor_id' => 'V03',
                'status' => 'confirmed',
                'payment_terms' => 'NET30',
                'subtotal_before_tax' => 1680000,
                'total_tax' => 184800,
                'grand_total' => 1864800,
                'confirmed_at' => now(),
                'confirmed_by' => $procurementUser->id ?? $warehouseUser->id,
                'created_by' => $warehouseUser->id,
                'notes' => 'Existing Purchase Order P00007 (Baseline)',
            ]
        );

        PurchaseOrderLine::firstOrCreate(
            ['purchase_order_id' => 'P00007', 'variant_sku' => 'JNS-30-BLU'],
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

        // 7. Fixture PO0008 (PO for T-19 / T-21 testing: 10 x JNS-30-BLU)
        $po8 = PurchaseOrder::firstOrCreate(
            ['id' => 'PO0008'],
            [
                'vendor_id' => 'V03',
                'status' => 'confirmed',
                'payment_terms' => 'NET30',
                'subtotal_before_tax' => 1680000,
                'total_tax' => 184800,
                'grand_total' => 1864800,
                'confirmed_at' => now(),
                'confirmed_by' => $warehouseUser->id,
                'created_by' => $warehouseUser->id,
                'notes' => 'PO untuk Skenario Pengujian T-19 & T-21 (Receipt 8 accepted, 2 rejected)',
            ]
        );

        $po8Line = PurchaseOrderLine::firstOrCreate(
            ['purchase_order_id' => 'PO0008', 'variant_sku' => 'JNS-30-BLU'],
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

        // Receipt fixture for PO0008 (Ready to validate in T-21)
        Receipt::firstOrCreate(
            ['id' => 'WH/IN/0001'],
            [
                'purchase_order_id' => 'PO0008',
                'status' => 'ready',
                'location_to' => 'WH-PKU',
                'receipt_date' => now()->toDateString(),
                'created_by' => $warehouseUser->id,
                'notes' => 'Penerimaan fisik barang PO0008 (T-21)',
            ]
        );

        ReceiptLine::firstOrCreate(
            ['receipt_id' => 'WH/IN/0001', 'po_line_id' => $po8Line->id],
            [
                'variant_sku' => 'JNS-30-BLU',
                'qty_expected' => 10,
                'qty_accepted' => 8,
                'qty_rejected' => 2,
                'rejection_reason' => '2 unit jahitan saku robek / cacat QC pabrik',
                'unit_cost' => 168000,
                'accepted_value' => 1344000,
            ]
        );

        // 8. Fixture SO-0001 (SO for T-11, T-13, T-15 testing: 4 x TSP-M-BLK)
        $so1 = SalesOrder::firstOrCreate(
            ['id' => 'SO-0001'],
            [
                'customer_id' => 'C002',
                'status' => 'confirmed',
                'credit_hold' => false,
                'discount_hold' => false,
                'payment_terms' => 'NET14',
                'subtotal_before_tax' => 636000,
                'total_tax' => 69960,
                'grand_total' => 705960,
                'confirmed_at' => now(),
                'confirmed_by' => $salesUser->id,
                'created_by' => $salesUser->id,
                'notes' => 'Sales Order C002 untuk Skenario Pengujian T-11, T-13, T-15',
            ]
        );

        $so1Line = SalesOrderLine::firstOrCreate(
            ['sales_order_id' => 'SO-0001', 'variant_sku' => 'TSP-M-BLK'],
            [
                'qty_ordered' => 4,
                'qty_delivered' => 0,
                'qty_invoiced' => 0,
                'unit_price' => 159000,
                'discount_pct' => 0,
                'tax_id' => 'VAT-NONLUX',
                'subtotal_before_tax' => 636000,
                'tax_amount' => 69960,
                'line_total' => 705960,
                'price_locked_at' => now(),
            ]
        );

        // Delivery Order fixture for SO-0001 (Ready to validate partial 2 of 4 in T-15)
        DeliveryOrder::firstOrCreate(
            ['id' => 'WH/OUT/0001'],
            [
                'sales_order_id' => 'SO-0001',
                'is_backorder' => false,
                'status' => 'ready',
                'location_from' => 'WH-PKU',
                'location_to' => 'CV Karya Busana (Dumai)',
                'scheduled_date' => now()->toDateString(),
                'created_by' => $warehouseUser->id,
                'notes' => 'Pengiriman barang SO-0001 (T-15: Pengiriman parsial 2 dari 4)',
            ]
        );

        DeliveryOrderLine::firstOrCreate(
            ['delivery_order_id' => 'WH/OUT/0001', 'so_line_id' => $so1Line->id],
            [
                'variant_sku' => 'TSP-M-BLK',
                'qty_demand' => 4,
                'qty_done' => 2,
                'cogs_per_unit' => 88000,
                'cogs_total' => 176000,
            ]
        );

        // Audit log for WH/OUT/0001
        AuditLog::firstOrCreate(
            ['document_type' => 'delivery_order', 'document_id' => 'WH/OUT/0001'],
            [
                'action' => 'CREATE_DELIVERY_ORDER',
                'status' => 'SUCCESS',
                'actor_user_id' => $warehouseUser->id,
                'actor_username' => $warehouseUser->name,
                'actor_role' => 'warehouse',
                'notes' => 'Pengiriman barang SO-0001 siap diproses di gudang utama WH-PKU',
                'created_at' => now(),
            ]
        );

        // Audit log for WH/IN/0001
        AuditLog::firstOrCreate(
            ['document_type' => 'receipt', 'document_id' => 'WH/IN/0001'],
            [
                'action' => 'CREATE_RECEIPT',
                'status' => 'SUCCESS',
                'actor_user_id' => $warehouseUser->id,
                'actor_username' => $warehouseUser->name,
                'actor_role' => 'warehouse',
                'notes' => 'Penerimaan barang PO0008 dari vendor V03 siap dilakukan inspeksi QC',
                'created_at' => now(),
            ]
        );
    }
}

