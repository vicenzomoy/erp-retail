<?php

use App\Http\Controllers\Accounting\AccountingOverviewController;
use App\Http\Controllers\Accounting\AccountingReportController;
use App\Http\Controllers\Accounting\CreditNoteController;
use App\Http\Controllers\Accounting\CustomerInvoiceController;
use App\Http\Controllers\Accounting\JournalEntryController;
use App\Http\Controllers\Accounting\PaymentController;
use App\Http\Controllers\Accounting\VendorBillController;
use App\Http\Controllers\Crm\CrmLeadController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Invoicing\InvoicingOverviewController;
use App\Http\Controllers\Owner\OwnerDashboardController;
use App\Http\Controllers\Owner\OwnerDiscountApprovalController;
use App\Http\Controllers\Inventory\DeliveryOrderController;
use App\Http\Controllers\Inventory\InternalTransferController;
use App\Http\Controllers\Inventory\InventoryOverviewController;
use App\Http\Controllers\Inventory\LogNoteController;
use App\Http\Controllers\Inventory\ProductController;
use App\Http\Controllers\Inventory\ReceiptController;
use App\Http\Controllers\Inventory\ReturnInspectionController;
use App\Http\Controllers\Inventory\StockReportingController;
use App\Http\Controllers\Inventory\WarehouseLocationController;
use App\Http\Controllers\Pos\PosController;
use App\Http\Controllers\Purchase\PurchaseOrderController;
use App\Http\Controllers\Purchase\PurchaseOverviewController;
use App\Http\Controllers\Purchase\PurchaseProductController;
use App\Http\Controllers\Purchase\PurchaseReportingController;
use App\Http\Controllers\Purchase\PurchaseVendorController;
use App\Http\Controllers\Sales\CustomerReturnController;
use App\Http\Controllers\Sales\SalesCustomerController;
use App\Http\Controllers\Sales\SalesOrderController;
use App\Http\Controllers\Sales\SalesOverviewController;
use App\Http\Controllers\Settings\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('home');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return redirect()->route('home');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // S-01 Beranda App Switcher (F-01) - semua peran
    Route::get('/home', [HomeController::class, 'index'])->name('home');

    // ==========================================
    // SETTINGS MODULE ROUTES (Pengguna & Hak Akses — Owner & Finance)
    // ==========================================
    Route::prefix('settings')->name('settings.')->middleware('app.access:settings')->group(function () {
        Route::get('/', [SettingsController::class, 'users'])->name('overview');
        Route::get('/users', [SettingsController::class, 'users'])->name('users.index');
        Route::post('/users', [SettingsController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{id}', [SettingsController::class, 'updateUser'])
            ->where('id', '[0-9]+')
            ->name('users.update');
        Route::get('/roles', [SettingsController::class, 'roles'])->name('roles.index');
    });

    // ==========================================
    // PURCHASE MODULE ROUTES (F-12, F-13, F-14 / S-10, S-11, S-12, T-19, T-20)
    // ==========================================
    Route::prefix('purchase')->name('purchase.')->middleware('app.access:purchase')->group(function () {
        Route::get('/', [PurchaseOverviewController::class, 'index'])->name('overview');

        // Orders / RFQ
        Route::get('/orders', [PurchaseOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/create', [PurchaseOrderController::class, 'create'])->name('orders.create');
        Route::post('/orders', [PurchaseOrderController::class, 'store'])->name('orders.store');
        Route::post('/orders/{id}/confirm', [PurchaseOrderController::class, 'confirm'])
            ->where('id', '.+')
            ->name('orders.confirm');
        Route::post('/orders/{id}/cancel', [PurchaseOrderController::class, 'cancel'])
            ->where('id', '.+')
            ->name('orders.cancel');
        Route::post('/orders/{id}/create-bill', [PurchaseOrderController::class, 'createBill'])
            ->where('id', '.+')
            ->name('orders.create-bill');
        Route::get('/orders/{id}', [PurchaseOrderController::class, 'show'])
            ->where('id', '.+')
            ->name('orders.show');

        // Vendors
        Route::get('/vendors', [PurchaseVendorController::class, 'index'])->name('vendors.index');
        Route::get('/vendors/create', [PurchaseVendorController::class, 'create'])->name('vendors.create');
        Route::post('/vendors', [PurchaseVendorController::class, 'store'])->name('vendors.store');
        Route::get('/vendors/{id}', [PurchaseVendorController::class, 'show'])
            ->where('id', '.+')
            ->name('vendors.show');

        // Products & Stock for Procurement
        Route::get('/products', [PurchaseProductController::class, 'index'])->name('products.index');

        // Reporting
        Route::get('/reporting', [PurchaseReportingController::class, 'index'])->name('reporting.index');
    });

    // ==========================================
    // CRM MODULE ROUTES (F-05 / S-05, T-09, T-10)
    // ==========================================
    Route::prefix('crm')->name('crm.')->middleware('app.access:crm')->group(function () {
        Route::get('/', [CrmLeadController::class, 'pipeline'])->name('overview');
        Route::get('/pipeline', [CrmLeadController::class, 'pipeline'])->name('pipeline');
        Route::get('/leads', [CrmLeadController::class, 'index'])->name('leads.index');
        Route::get('/leads/create', [CrmLeadController::class, 'create'])->name('leads.create');
        Route::post('/leads', [CrmLeadController::class, 'store'])->name('leads.store');
        Route::get('/leads/{id}', [CrmLeadController::class, 'show'])->where('id', '.+')->name('leads.show');
        Route::put('/leads/{id}', [CrmLeadController::class, 'update'])->where('id', '.+')->name('leads.update');
        Route::match(['put', 'patch'], '/leads/{id}/stage', [CrmLeadController::class, 'updateStage'])->where('id', '.+')->name('leads.stage');
        Route::post('/leads/{id}/convert', [CrmLeadController::class, 'convert'])->where('id', '.+')->name('leads.convert');
        Route::post('/leads/{id}/create-quotation', [CrmLeadController::class, 'createQuotation'])->where('id', '.+')->name('leads.create-quotation');
        Route::post('/leads/{id}/confirm-sales-order', [CrmLeadController::class, 'confirmSalesOrder'])->where('id', '.+')->name('leads.confirm-so');
        Route::post('/leads/{id}/won', [CrmLeadController::class, 'markWon'])->where('id', '.+')->name('leads.won');
        Route::post('/leads/{id}/lost', [CrmLeadController::class, 'markLost'])->where('id', '.+')->name('leads.lost');

        // Pelanggan (Customers di dalam modul CRM)
        Route::get('/customers', [SalesCustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{id}', [SalesCustomerController::class, 'show'])->where('id', '.+')->name('customers.show');
        Route::put('/customers/{id}', [SalesCustomerController::class, 'update'])->where('id', '.+')->name('customers.update');
    });

    // ==========================================
    // ACCOUNTING MODULE ROUTES (Faktur Pelanggan, Tagihan Pemasok, Nota Kredit, Pembayaran, Jurnal Umum & Buku Besar)
    // ==========================================
    Route::prefix('accounting')->name('accounting.')->middleware('app.access:accounting')->group(function () {
        // Overview Dashboard Terpadu (Kokpit Invoicing, Neraca Saldo, Saldo Akun COA, Jurnal Umum)
        Route::get('/', [AccountingOverviewController::class, 'index'])->name('overview');

        // Pelanggan: Customer Invoices (Delivered-Based)
        Route::get('/invoices', [CustomerInvoiceController::class, 'index'])->name('invoices.index');
        Route::get('/invoices/create', [CustomerInvoiceController::class, 'create'])->name('invoices.create');
        Route::post('/invoices', [CustomerInvoiceController::class, 'store'])->name('invoices.store');
        Route::post('/invoices/{id}/post', [CustomerInvoiceController::class, 'post'])
            ->where('id', '.+')
            ->name('invoices.post');
        Route::get('/invoices/{id}', [CustomerInvoiceController::class, 'show'])
            ->where('id', '.+')
            ->name('invoices.show');

        // Pelanggan: Nota Kredit / Credit Notes & AR Adjustments
        Route::get('/credit-notes', [CreditNoteController::class, 'index'])->name('credit-notes.index');
        Route::get('/credit-notes/create', [CreditNoteController::class, 'create'])->name('credit-notes.create');
        Route::post('/credit-notes', [CreditNoteController::class, 'store'])->name('credit-notes.store');
        Route::get('/credit-notes/{id}', [CreditNoteController::class, 'show'])
            ->where('id', '.+')
            ->name('credit-notes.show');

        // Pemasok: Vendor Bills (Three-Way Match)
        Route::get('/bills', [VendorBillController::class, 'index'])->name('bills.index');
        Route::get('/bills/create', [VendorBillController::class, 'create'])->name('bills.create');
        Route::post('/bills', [VendorBillController::class, 'store'])->name('bills.store');
        Route::post('/bills/{id}/post', [VendorBillController::class, 'post'])
            ->where('id', '.+')
            ->name('bills.post');
        Route::get('/bills/{id}', [VendorBillController::class, 'show'])
            ->where('id', '.+')
            ->name('bills.show');

        // Kas & Pembayaran: Payments
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/payments/create', [PaymentController::class, 'create'])->name('payments.create');
        Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{id}', [PaymentController::class, 'show'])
            ->where('id', '.+')
            ->name('payments.show');

        // Akuntansi: Journal Entries & General Ledger
        Route::get('/journals', [JournalEntryController::class, 'index'])->name('journals');
        Route::get('/journal-entries', [JournalEntryController::class, 'index'])->name('journals.index');
        Route::get('/journals/{id}', [JournalEntryController::class, 'show'])
            ->where('id', '[0-9]+')
            ->name('journals.show');
        Route::get('/ledger', [AccountingReportController::class, 'generalLedger'])->name('ledger');
        Route::get('/general-ledger', [AccountingReportController::class, 'generalLedger'])->name('gl.index');

        // Laporan Keuangan (Reporting: Neraca Keuangan, Laba dan Rugi, Arus Kas, Neraca Saldo, Buku Besar Umum, Laporan Pajak)
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/balance-sheet', [AccountingReportController::class, 'balanceSheet'])->name('balance-sheet');
            Route::get('/profit-loss', [AccountingReportController::class, 'profitLoss'])->name('profit-loss');
            Route::get('/cash-flow', [AccountingReportController::class, 'cashFlow'])->name('cash-flow');
            Route::get('/trial-balance', [AccountingReportController::class, 'trialBalance'])->name('trial-balance');
            Route::get('/general-ledger', [AccountingReportController::class, 'generalLedger'])->name('general-ledger');
            Route::get('/tax', [AccountingReportController::class, 'taxReport'])->name('tax');
        });
    });

    // Backward compatibility alias dari /invoicing/* ke /accounting/*
    Route::prefix('invoicing')->name('invoicing.')->middleware('app.access:accounting')->group(function () {
        Route::get('/', fn () => redirect()->route('accounting.overview'))->name('overview');

        Route::get('/bills', fn () => redirect()->route('accounting.bills.index'))->name('bills.index');
        Route::get('/bills/create', fn (\Illuminate\Http\Request $r) => redirect()->route('accounting.bills.create', $r->query()))->name('bills.create');
        Route::post('/bills', [VendorBillController::class, 'store'])->name('bills.store');
        Route::post('/bills/{id}/post', [VendorBillController::class, 'post'])->where('id', '.+')->name('bills.post');
        Route::get('/bills/{id}', [VendorBillController::class, 'show'])->where('id', '.+')->name('bills.show');

        Route::get('/invoices', fn () => redirect()->route('accounting.invoices.index'))->name('invoices.index');
        Route::get('/invoices/create', fn (\Illuminate\Http\Request $r) => redirect()->route('accounting.invoices.create', $r->query()))->name('invoices.create');
        Route::post('/invoices', [CustomerInvoiceController::class, 'store'])->name('invoices.store');
        Route::post('/invoices/{id}/post', [CustomerInvoiceController::class, 'post'])->where('id', '.+')->name('invoices.post');
        Route::get('/invoices/{id}', [CustomerInvoiceController::class, 'show'])->where('id', '.+')->name('invoices.show');

        Route::get('/credit-notes', fn () => redirect()->route('accounting.credit-notes.index'))->name('credit-notes.index');
        Route::get('/credit-notes/create', fn (\Illuminate\Http\Request $r) => redirect()->route('accounting.credit-notes.create', $r->query()))->name('credit-notes.create');
        Route::post('/credit-notes', [CreditNoteController::class, 'store'])->name('credit-notes.store');
        Route::get('/credit-notes/{id}', [CreditNoteController::class, 'show'])->where('id', '.+')->name('credit-notes.show');

        Route::get('/payments', fn () => redirect()->route('accounting.payments.index'))->name('payments.index');
        Route::get('/payments/create', fn (\Illuminate\Http\Request $r) => redirect()->route('accounting.payments.create', $r->query()))->name('payments.create');
        Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{id}', [PaymentController::class, 'show'])->where('id', '.+')->name('payments.show');
    });

    // Log Notes / Chatter Footer (Odoo Pattern — dapat dipakai lintas modul oleh seluruh peran terautentikasi)
    Route::post('/inventory/log-notes', [LogNoteController::class, 'store'])->name('inventory.log-notes.store');

    // ==========================================
    // INVENTORY MODULE ROUTES (F-04, F-08, F-09, F-13, F-20)
    // ==========================================
    Route::prefix('inventory')->name('inventory.')->middleware(['app.access:inventory', 'inventory.permission'])->group(function () {
        // Overview (Odoo Kanban cards)
        Route::get('/', [InventoryOverviewController::class, 'index'])->name('overview');

        // Operations: Delivery Orders (F-09 / S-08, T-15, T-16)
        Route::get('/deliveries', [DeliveryOrderController::class, 'index'])->name('deliveries.index');
        Route::get('/deliveries/create', [DeliveryOrderController::class, 'create'])->name('deliveries.create');
        Route::post('/deliveries', [DeliveryOrderController::class, 'store'])->name('deliveries.store');
        Route::post('/deliveries/{id}/validate', [DeliveryOrderController::class, 'validateOrder'])
            ->where('id', '.+')
            ->name('deliveries.validate');
        Route::get('/deliveries/{id}', [DeliveryOrderController::class, 'show'])
            ->where('id', '.+')
            ->name('deliveries.show');

        // Operations: Receipts (F-13 / S-11, T-21, T-22)
        Route::get('/receipts', [ReceiptController::class, 'index'])->name('receipts.index');
        Route::get('/receipts/create', [ReceiptController::class, 'create'])->name('receipts.create');
        Route::post('/receipts', [ReceiptController::class, 'store'])->name('receipts.store');
        Route::post('/receipts/{id}/validate', [ReceiptController::class, 'validateReceipt'])
            ->where('id', '.+')
            ->name('receipts.validate');
        Route::get('/receipts/{id}', [ReceiptController::class, 'show'])
            ->where('id', '.+')
            ->name('receipts.show');

        // Operations: Customer Return Inspections (Warehouse QC on returns)
        Route::get('/returns', [ReturnInspectionController::class, 'index'])->name('returns.index');
        Route::get('/returns/{id}', [ReturnInspectionController::class, 'show'])
            ->where('id', '.+')
            ->name('returns.show');
        Route::post('/returns/{id}/validate', [ReturnInspectionController::class, 'validateInspection'])
            ->where('id', '.+')
            ->name('returns.validate');

        // Operations: Internal Transfers (F-20 / S-18, T-35, T-36)
        Route::get('/transfers', [InternalTransferController::class, 'index'])->name('transfers.index');
        Route::get('/transfers/create', [InternalTransferController::class, 'create'])->name('transfers.create');
        Route::post('/transfers', [InternalTransferController::class, 'store'])->name('transfers.store');
        Route::post('/transfers/{id}/validate', [InternalTransferController::class, 'validateTransfer'])
            ->where('id', '.+')
            ->name('transfers.validate');
        Route::get('/transfers/{id}', [InternalTransferController::class, 'show'])
            ->where('id', '.+')
            ->name('transfers.show');

        // Products & SKU Variants (F-04 / S-04, T-07, T-08)
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::get('/products/stock-by-location', [ProductController::class, 'stockByLocation'])->name('products.stock-by-location');
        Route::get('/products/{sku}', [ProductController::class, 'show'])->name('products.show');
        Route::put('/products/{sku}', [ProductController::class, 'update'])->name('products.update');

        // Reporting: Stock Forecast / ATP (F-08 / S-07, T-13, T-14)
        Route::get('/reporting/forecast', [StockReportingController::class, 'stockForecast'])->name('reporting.forecast');
        Route::post('/reporting/forecast/reserve', [StockReportingController::class, 'reserveStock'])->name('reporting.reserve');
        Route::match(['post', 'delete'], '/reporting/forecast/reserve/{id}', [StockReportingController::class, 'releaseReservation'])->name('reporting.release-reservation');
        Route::get('/reporting/moves', [StockReportingController::class, 'stockMoves'])->name('reporting.moves');

        // Configuration: Locations & Warehouses
        Route::get('/configuration/locations', [WarehouseLocationController::class, 'index'])->name('configuration.locations');
    });

    // ==========================================
    // POINT OF SALE MODULE ROUTES (F-17, F-18, S-15, S-16)
    // ==========================================
    Route::prefix('pos')->name('pos.')->middleware('app.access:pos')->group(function () {
        // Overview Dashboard
        Route::get('/', [PosController::class, 'overview'])->name('overview');

        // Session Management
        Route::get('/sessions', [PosController::class, 'sessionsIndex'])->name('sessions.index');
        Route::post('/sessions/open', [PosController::class, 'sessionOpen'])->name('sessions.open');
        Route::get('/sessions/{id}', [PosController::class, 'sessionShow'])
            ->where('id', '.+')
            ->name('sessions.show');
        Route::post('/sessions/{id}/close', [PosController::class, 'sessionClose'])
            ->where('id', '.+')
            ->name('sessions.close');

        // Orders / Checkout
        Route::get('/orders', [PosController::class, 'ordersIndex'])->name('orders.index');
        Route::get('/orders/create', [PosController::class, 'checkoutCreate'])->name('orders.create');
        Route::post('/orders', [PosController::class, 'checkoutStore'])->name('orders.store');
        Route::get('/orders/{id}', [PosController::class, 'orderShow'])
            ->where('id', '.+')
            ->name('orders.show');

        // Reporting
        Route::get('/reporting/daily-summary', [PosController::class, 'dailySummary'])->name('reporting.daily-summary');
    });

    // ==========================================
    // SALES MODULE ROUTES (F-06, F-07, F-11)
    // ==========================================
    Route::prefix('sales')->name('sales.')->middleware('app.access:sales')->group(function () {
        // Overview
        Route::get('/', [SalesOverviewController::class, 'index'])->name('overview');

        // Reporting: Order History
        Route::get('/reporting/orders', [SalesOrderController::class, 'history'])->name('reporting.orders');

        // Orders (Quotations & Sales Orders)
        Route::get('/orders', [SalesOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/create', [SalesOrderController::class, 'create'])->name('orders.create');
        Route::post('/orders', [SalesOrderController::class, 'store'])->name('orders.store');
        Route::get('/orders/{id}', [SalesOrderController::class, 'show'])->where('id', '.+')->name('orders.show');
        Route::post('/orders/{id}/confirm', [SalesOrderController::class, 'confirm'])->where('id', '.+')->name('orders.confirm');
        Route::post('/orders/{id}/cancel', [SalesOrderController::class, 'cancel'])->where('id', '.+')->name('orders.cancel');
        Route::post('/orders/{id}/lines', [SalesOrderController::class, 'addLine'])->where('id', '.+')->name('orders.lines.add');
        Route::put('/orders/{id}/lines/{lineId}', [SalesOrderController::class, 'updateLine'])->where('id', '.+')->name('orders.lines.update');
        Route::delete('/orders/{id}/lines/{lineId}', [SalesOrderController::class, 'removeLine'])->where('id', '.+')->name('orders.lines.remove');
        Route::post('/orders/{id}/approve-discount', [SalesOrderController::class, 'approveDiscount'])->where('id', '.+')->name('orders.approve-discount');
        Route::post('/orders/{id}/reject-discount', [SalesOrderController::class, 'rejectDiscount'])->where('id', '.+')->name('orders.reject-discount');

        // Customer Returns (RMA, Max 14 Days)
        Route::get('/returns', [CustomerReturnController::class, 'index'])->name('returns.index');
        Route::get('/returns/create', [CustomerReturnController::class, 'create'])->name('returns.create');
        Route::post('/returns', [CustomerReturnController::class, 'store'])->name('returns.store');
        Route::get('/returns/{id}', [CustomerReturnController::class, 'show'])->where('id', '.+')->name('returns.show');

        // Customers
        Route::get('/customers', [SalesCustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{id}', [SalesCustomerController::class, 'show'])->where('id', '.+')->name('customers.show');
        Route::put('/customers/{id}', [SalesCustomerController::class, 'update'])->where('id', '.+')->name('customers.update');
    });

    // ==========================================
    // OWNER MODULE ROUTES (Executive Dashboard & Approvals)
    // ==========================================
    Route::prefix('owner')->name('owner.')->middleware('app.access:owner')->group(function () {
        Route::get('/', [OwnerDashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard', [OwnerDashboardController::class, 'index']);

        // Persetujuan Diskon
        Route::get('/approvals/discounts', [OwnerDiscountApprovalController::class, 'index'])->name('approvals.discounts');
        Route::post('/approvals/discounts/{id}/approve', [OwnerDiscountApprovalController::class, 'approve'])
            ->where('id', '.+')
            ->name('approvals.discounts.approve');
        Route::post('/approvals/discounts/{id}/reject', [OwnerDiscountApprovalController::class, 'reject'])
            ->where('id', '.+')
            ->name('approvals.discounts.reject');
    });
});

require __DIR__.'/auth.php';

Route::fallback(function (\Illuminate\Http\Request $request) {
    return Inertia::render('Errors/NotFound', [
        'status'        => 404,
        'title'         => 'Halaman Tidak Ditemukan',
        'message'       => 'Maaf, halaman atau dokumen yang Anda cari tidak ditemukan atau telah dipindahkan.',
        'attemptedPath' => '/' . ltrim($request->path(), '/'),
    ])->toResponse($request)->setStatusCode(404);
});
