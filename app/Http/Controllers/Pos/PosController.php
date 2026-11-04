<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Master\ContactCustomer;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\PosOrder;
use App\Models\PosSession;
use App\Services\Inventory\StockService;
use App\Services\Pos\PosService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    protected PosService $posService;
    protected StockService $stockService;

    public function __construct(PosService $posService, StockService $stockService)
    {
        $this->posService   = $posService;
        $this->stockService = $stockService;
    }

    // =========================================================================
    // OVERVIEW
    // =========================================================================

    public function overview(): Response
    {
        // KPIs for POS Overview dashboard
        $openSession = PosSession::where('cashier_user_id', auth()->id())
            ->where('status', 'open')
            ->with('cashier')
            ->first();

        $todayOrders = PosOrder::where('status', 'paid')
            ->whereDate('paid_at', today())
            ->count();

        $todayRevenue = PosOrder::where('status', 'paid')
            ->whereDate('paid_at', today())
            ->sum('grand_total');

        $recentSessions = PosSession::with('cashier')
            ->orderByDesc('opened_at')
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id'                  => $s->id,
                'cashier_name'        => $s->cashier?->name ?? 'Kasir',
                'location_code'       => $s->location_code,
                'status'              => $s->status,
                'opening_cash_float'  => (float) $s->opening_cash_float,
                'total_sales'         => (float) $s->total_sales,
                'expected_cash'       => (float) $s->expected_cash,
                'opened_at'           => $s->opened_at?->format('d/m/Y H:i'),
                'closed_at'           => $s->closed_at?->format('d/m/Y H:i'),
            ]);

        $storeLocations = WarehouseLocation::where('type', 'Retail store')->get();

        return Inertia::render('Pos/Overview', [
            'open_session'    => $openSession ? [
                'id'                 => $openSession->id,
                'location_code'      => $openSession->location_code,
                'opening_cash_float' => (float) $openSession->opening_cash_float,
                'total_sales'        => (float) $openSession->total_sales,
                'expected_cash'      => (float) $openSession->expected_cash,
                'opened_at'          => $openSession->opened_at?->format('d/m/Y H:i'),
            ] : null,
            'kpis'            => [
                'today_orders'  => $todayOrders,
                'today_revenue' => (float) $todayRevenue,
                'total_sessions_open'  => PosSession::where('status', 'open')->count(),
                'total_sessions_today' => PosSession::whereDate('opened_at', today())->count(),
            ],
            'recent_sessions' => $recentSessions,
            'store_locations' => $storeLocations,
        ]);
    }

    // =========================================================================
    // SESSIONS
    // =========================================================================

    public function sessionsIndex(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = PosSession::with('cashier')
            ->orderByDesc('opened_at');

        if ($status === 'open') {
            $query->where('status', 'open');
        } elseif ($status === 'closed') {
            $query->where('status', 'closed');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhereHas('cashier', fn ($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $sessions = $query->paginate(15)->through(fn ($s) => [
            'id'                  => $s->id,
            'cashier_name'        => $s->cashier?->name ?? 'Kasir',
            'location_code'       => $s->location_code,
            'status'              => $s->status,
            'opening_cash_float'  => (float) $s->opening_cash_float,
            'total_sales'         => (float) $s->total_sales,
            'expected_cash'       => (float) $s->expected_cash,
            'counted_cash'        => $s->counted_cash !== null ? (float) $s->counted_cash : null,
            'cash_variance'       => $s->cash_variance !== null ? (float) $s->cash_variance : null,
            'opened_at'           => $s->opened_at?->format('d/m/Y H:i'),
            'closed_at'           => $s->closed_at?->format('d/m/Y H:i'),
            'orders_count'        => $s->orders()->where('status', 'paid')->count(),
        ]);

        return Inertia::render('Pos/Sessions/Index', [
            'sessions' => $sessions,
            'filters'  => ['status' => $status, 'search' => $search],
            'counts'   => [
                'all'    => PosSession::count(),
                'open'   => PosSession::where('status', 'open')->count(),
                'closed' => PosSession::where('status', 'closed')->count(),
            ],
        ]);
    }

    public function sessionOpen(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'location_code'      => 'required|exists:warehouses_locations,location_code',
            'opening_cash_float' => 'required|numeric|min:0',
        ]);

        $idempotencyKey = $request->header('X-Idempotency-Key')
            ?? 'sess-open-' . auth()->id() . '-' . now()->format('YmdHis');

        try {
            $session = $this->posService->openSession(
                cashierUserId:    auth()->id(),
                locationCode:     $validated['location_code'],
                openingCashFloat: (float) $validated['opening_cash_float'],
                idempotencyKey:   $idempotencyKey,
                actorUsername:    $request->user()->name,
                actorRole:        $request->user()->role_id ?? 'cashier',
            );

            return redirect()->route('pos.sessions.show', $session->id)
                ->with('success', "Sesi POS {$session->id} berhasil dibuka dengan kas awal Rp " . number_format($validated['opening_cash_float'], 0, ',', '.'));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function sessionShow(string $id): Response
    {
        $session = PosSession::with([
            'cashier',
            'orders' => fn ($q) => $q->with('lines.product', 'customer')->orderByDesc('paid_at'),
        ])->findOrFail($id);

        $orders = $session->orders->map(fn ($o) => [
            'id'                  => $o->id,
            'customer_name'       => $o->customer?->name ?? 'Pelanggan Umum',
            'status'              => $o->status,
            'payment_method'      => $o->payment_method,
            'subtotal_before_tax' => (float) $o->subtotal_before_tax,
            'total_tax'           => (float) $o->total_tax,
            'grand_total'         => (float) $o->grand_total,
            'cash_tendered'       => (float) $o->cash_tendered,
            'change_given'        => (float) $o->change_given,
            'paid_at'             => $o->paid_at?->format('d/m/Y H:i:s'),
            'items_count'         => $o->lines->sum('qty'),
        ]);

        $auditLogs = AuditLog::where('document_type', 'pos_session')
            ->where('document_id', $id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'notes'          => $log->notes,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
                'time_ago'       => $log->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Pos/Sessions/Show', [
            'session' => [
                'id'                       => $session->id,
                'cashier_name'             => $session->cashier?->name ?? 'Kasir',
                'location_code'            => $session->location_code,
                'status'                   => $session->status,
                'opening_cash_float'       => (float) $session->opening_cash_float,
                'total_sales'              => (float) $session->total_sales,
                'expected_cash'            => (float) $session->expected_cash,
                'counted_cash'             => $session->counted_cash !== null ? (float) $session->counted_cash : null,
                'cash_variance'            => $session->cash_variance !== null ? (float) $session->cash_variance : null,
                'opened_at'                => $session->opened_at?->format('d/m/Y H:i:s'),
                'closed_at'                => $session->closed_at?->format('d/m/Y H:i:s'),
                'closing_journal_entry_id' => $session->closing_journal_entry_id,
            ],
            'orders'     => $orders,
            'audit_logs' => $auditLogs,
        ]);
    }

    public function sessionClose(Request $request, string $id): RedirectResponse
    {
        $session = PosSession::findOrFail($id);

        $validated = $request->validate([
            'counted_cash' => 'required|numeric|min:0',
        ]);

        $result = $this->posService->closeSession(
            session:      $session,
            countedCash:  (float) $validated['counted_cash'],
            actorUserId:  auth()->id(),
            actorName:    auth()->user()->name,
            actorRole:    auth()->user()->role_id ?? 'cashier',
        );

        if ($result['already_closed']) {
            return redirect()->route('pos.sessions.show', $id)
                ->with('info', "Sesi {$id} sudah ditutup sebelumnya (Idempotent – tidak ada pencatatan ganda).");
        }

        return redirect()->route('pos.sessions.show', $id)
            ->with('success', "Sesi {$id} berhasil ditutup. Variance: Rp " . number_format($result['session']->cash_variance, 0, ',', '.'));
    }

    // =========================================================================
    // ORDERS
    // =========================================================================

    public function ordersIndex(Request $request): Response
    {
        $search  = $request->query('search', '');
        $dateFrom = $request->query('date_from', today()->format('Y-m-d'));
        $dateTo   = $request->query('date_to', today()->format('Y-m-d'));

        $query = PosOrder::with(['customer', 'cashier', 'session'])
            ->where('status', 'paid')
            ->orderByDesc('paid_at');

        if ($dateFrom) {
            $query->whereDate('paid_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('paid_at', '<=', $dateTo);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', fn ($sq) => $sq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $orders = $query->paginate(20)->through(fn ($o) => [
            'id'                  => $o->id,
            'pos_session_id'      => $o->pos_session_id,
            'cashier_name'        => $o->cashier?->name ?? 'Kasir',
            'customer_name'       => $o->customer?->name ?? 'Pelanggan Umum',
            'location_code'       => $o->session?->location_code,
            'payment_method'      => $o->payment_method,
            'subtotal_before_tax' => (float) $o->subtotal_before_tax,
            'total_tax'           => (float) $o->total_tax,
            'grand_total'         => (float) $o->grand_total,
            'cash_tendered'       => (float) $o->cash_tendered,
            'change_given'        => (float) $o->change_given,
            'paid_at'             => $o->paid_at?->format('d/m/Y H:i'),
        ]);

        // Daily totals for the filtered range
        $dailyTotal = PosOrder::where('status', 'paid')
            ->when($dateFrom, fn ($q) => $q->whereDate('paid_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('paid_at', '<=', $dateTo))
            ->selectRaw('SUM(grand_total) as revenue, SUM(total_tax) as tax, COUNT(*) as count')
            ->first();

        return Inertia::render('Pos/Orders/Index', [
            'orders'      => $orders,
            'filters'     => ['search' => $search, 'date_from' => $dateFrom, 'date_to' => $dateTo],
            'daily_total' => [
                'revenue' => (float) ($dailyTotal->revenue ?? 0),
                'tax'     => (float) ($dailyTotal->tax ?? 0),
                'count'   => (int) ($dailyTotal->count ?? 0),
            ],
        ]);
    }

    public function orderShow(string $id): Response
    {
        $order = PosOrder::with([
            'lines.product',
            'customer',
            'cashier',
            'session',
            'journalEntry.lines',
        ])->findOrFail($id);

        $auditLogs = AuditLog::where('document_type', 'pos_order')
            ->where('document_id', $id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'notes'          => $log->notes,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
            ]);

        return Inertia::render('Pos/Orders/Show', [
            'order' => [
                'id'                  => $order->id,
                'pos_session_id'      => $order->pos_session_id,
                'location_code'       => $order->session?->location_code,
                'cashier_name'        => $order->cashier?->name ?? 'Kasir',
                'customer_name'       => $order->customer?->name ?? 'Pelanggan Umum',
                'customer_id'         => $order->customer_id,
                'status'              => $order->status,
                'payment_method'      => $order->payment_method,
                'subtotal_before_tax' => (float) $order->subtotal_before_tax,
                'total_tax'           => (float) $order->total_tax,
                'grand_total'         => (float) $order->grand_total,
                'cash_tendered'       => (float) $order->cash_tendered,
                'change_given'        => (float) $order->change_given,
                'paid_at'             => $order->paid_at?->format('d/m/Y H:i:s'),
                'journal_entry_no'    => $order->journalEntry?->entry_no,
                'lines'               => $order->lines->map(fn ($l) => [
                    'id'                  => $l->id,
                    'variant_sku'         => $l->variant_sku,
                    'product_name'        => $l->product?->name ?? $l->variant_sku,
                    'size'                => $l->product?->size,
                    'color'               => $l->product?->color,
                    'qty'                 => (float) $l->qty,
                    'unit_price'          => (float) $l->unit_price,
                    'subtotal_before_tax' => (float) $l->subtotal_before_tax,
                    'tax_amount'          => (float) $l->tax_amount,
                    'line_total'          => (float) $l->line_total,
                    'cogs_per_unit'       => (float) $l->cogs_per_unit,
                    'cogs_total'          => (float) $l->cogs_total,
                ])->values(),
            ],
            'journal_lines' => $order->journalEntry?->lines?->map(fn ($jl) => [
                'account_code' => $jl->account_code,
                'description'  => $jl->description,
                'debit'        => (float) $jl->debit,
                'credit'       => (float) $jl->credit,
            ]) ?? [],
            'audit_logs' => $auditLogs,
        ]);
    }

    public function checkoutCreate(Request $request): Response
    {
        // Find active session for this cashier
        $session = PosSession::where('cashier_user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        $products = Product::orderBy('name')->get()->map(fn ($p) => [
            'variant_sku' => $p->variant_sku,
            'name'        => $p->name,
            'size'        => $p->size,
            'color'       => $p->color,
            'unit'        => $p->unit,
            'sales_price' => (float) $p->sales_price,
            'cost'        => (float) $p->cost,
            'on_hand_store' => $session
                ? (float) $this->stockService->getOnHand($p->variant_sku, $session->location_code)
                : 0,
            'available_store' => $session
                ? (float) $this->stockService->getAvailable($p->variant_sku, $session->location_code)
                : 0,
        ]);

        $customers = ContactCustomer::orderBy('name')->get()->map(fn ($c) => [
            'id'   => $c->id,
            'name' => $c->name,
            'type' => $c->type,
        ]);

        return Inertia::render('Pos/Orders/Create', [
            'session'   => $session ? [
                'id'                 => $session->id,
                'location_code'      => $session->location_code,
                'opening_cash_float' => (float) $session->opening_cash_float,
                'total_sales'        => (float) $session->total_sales,
                'expected_cash'      => (float) $session->expected_cash,
            ] : null,
            'products'  => $products,
            'customers' => $customers,
        ]);
    }

    public function checkoutStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pos_session_id'  => 'required|exists:pos_sessions,id',
            'customer_id'     => 'nullable|exists:contacts_customers,id',
            'payment_method'  => 'required|in:cash,qris,card',
            'cash_tendered'   => 'required|numeric|min:0',
            'lines'           => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|exists:products,variant_sku',
            'lines.*.qty'         => 'required|numeric|min:0.001',
            'lines.*.unit_price'  => 'nullable|numeric|min:0',
        ]);

        $session = PosSession::findOrFail($validated['pos_session_id']);

        $idempotencyKey = $request->header('X-Idempotency-Key')
            ?? 'pos-order-' . auth()->id() . '-' . now()->format('YmdHis') . '-' . uniqid();

        try {
            $order = $this->posService->checkout(
                session:        $session,
                lines:          $validated['lines'],
                customerId:     $validated['customer_id'],
                cashTendered:   (float) $validated['cash_tendered'],
                paymentMethod:  $validated['payment_method'],
                idempotencyKey: $idempotencyKey,
                actorUserId:    auth()->id(),
                actorName:      auth()->user()->name,
                actorRole:      auth()->user()->role_id ?? 'cashier',
            );

            return redirect()->route('pos.orders.show', $order->id)
                ->with('success', "Transaksi {$order->id} berhasil! Kembalian: Rp " . number_format($order->change_given, 0, ',', '.'));
        } catch (\RuntimeException $e) {
            return back()->withInput()->withErrors(['error' => $e->getMessage()]);
        }
    }

    // =========================================================================
    // REPORTING
    // =========================================================================

    public function dailySummary(Request $request): Response
    {
        $date         = $request->query('date', today()->format('Y-m-d'));
        $locationCode = $request->query('location_code', 'TOKO-PKU');

        $storeLocations = WarehouseLocation::where('type', 'Retail store')->get();

        $summary = $this->posService->getDailySummary($date, $locationCode);

        // Format for frontend
        $sessions = collect($summary['sessions'])->map(fn ($s) => [
            'id'                 => $s->id,
            'cashier_name'       => $s->cashier?->name ?? 'Kasir',
            'opening_cash_float' => (float) $s->opening_cash_float,
            'total_sales'        => (float) $s->total_sales,
            'expected_cash'      => (float) $s->expected_cash,
            'counted_cash'       => $s->counted_cash !== null ? (float) $s->counted_cash : null,
            'cash_variance'      => $s->cash_variance !== null ? (float) $s->cash_variance : null,
            'status'             => $s->status,
            'orders_count'       => $s->orders->count(),
            'opened_at'          => $s->opened_at?->format('H:i'),
            'closed_at'          => $s->closed_at?->format('H:i'),
        ])->values();

        $orders = collect($summary['orders'])->map(fn ($o) => [
            'id'             => $o->id,
            'customer_name'  => $o->customer?->name ?? 'Pelanggan Umum',
            'grand_total'    => (float) $o->grand_total,
            'cash_tendered'  => (float) $o->cash_tendered,
            'change_given'   => (float) $o->change_given,
            'payment_method' => $o->payment_method,
            'paid_at'        => $o->paid_at?->format('H:i:s'),
        ])->values();

        return Inertia::render('Pos/Reporting/DailySummary', [
            'date'            => $date,
            'location_code'   => $locationCode,
            'store_locations' => $storeLocations,
            'summary'         => [
                'sessions_count'          => $summary['sessions_count'],
                'total_orders'            => $summary['total_orders'],
                'total_revenue'           => $summary['total_revenue'],
                'total_tax'               => $summary['total_tax'],
                'total_cogs'              => $summary['total_cogs'],
                'gross_profit'            => $summary['gross_profit'],
                'opening_floats'          => $summary['opening_floats'],
                'expected_cash_in_drawer' => $summary['expected_cash_in_drawer'],
            ],
            'sessions' => $sessions,
            'orders'   => $orders,
        ]);
    }
}

