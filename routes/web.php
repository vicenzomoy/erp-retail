<?php

use App\Http\Controllers\Inventory\DeliveryOrderController;
use App\Http\Controllers\Inventory\InternalTransferController;
use App\Http\Controllers\Inventory\InventoryOverviewController;
use App\Http\Controllers\Inventory\LogNoteController;
use App\Http\Controllers\Inventory\ProductController;
use App\Http\Controllers\Inventory\ReceiptController;
use App\Http\Controllers\Inventory\StockReportingController;
use App\Http\Controllers\Inventory\WarehouseLocationController;
use App\Http\Controllers\Pos\PosController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('inventory.overview');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return redirect()->route('inventory.overview');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ==========================================
    // INVENTORY MODULE ROUTES (F-04, F-08, F-09, F-13, F-20)
    // ==========================================
    Route::prefix('inventory')->name('inventory.')->group(function () {
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

        // Log Notes / Chatter Footer (Odoo Pattern)
        Route::post('/log-notes', [LogNoteController::class, 'store'])->name('log-notes.store');
    });

    // ==========================================
    // POINT OF SALE MODULE ROUTES (F-17, F-18, S-15, S-16)
    // ==========================================
    Route::prefix('pos')->name('pos.')->group(function () {
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
});

require __DIR__.'/auth.php';
