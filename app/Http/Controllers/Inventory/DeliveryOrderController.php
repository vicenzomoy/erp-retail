<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderLine;
use App\Models\JournalEntry;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\SalesOrder;
use App\Models\StockMove;
use App\Services\Inventory\DeliveryOrderService;
use App\Services\Inventory\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryOrderController extends Controller
{
    protected DeliveryOrderService $deliveryService;
    protected StockService $stockService;

    public function __construct(DeliveryOrderService $deliveryService, StockService $stockService)
    {
        $this->deliveryService = $deliveryService;
        $this->stockService = $stockService;
    }

    /**
     * List all delivery orders with filters.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = DeliveryOrder::with(['salesOrder.customer', 'lines.product', 'sourceLocation'])
            ->orderBy('created_at', 'desc');

        if ($status === 'to_process') {
            $query->whereIn('status', ['draft', 'ready']);
        } elseif ($status === 'done') {
            $query->where('status', 'done');
        } elseif ($status === 'backorders') {
            $query->where('is_backorder', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhere('sales_order_id', 'ilike', "%{$search}%")
                    ->orWhere('location_to', 'ilike', "%{$search}%")
                    ->orWhereHas('salesOrder.customer', function ($sq) use ($search) {
                        $sq->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        $deliveries = $query->paginate(15)->through(function ($do) {
            return [
                'id' => $do->id,
                'sales_order_id' => $do->sales_order_id,
                'customer_name' => $do->salesOrder?->customer?->name ?? 'Pelanggan',
                'parent_delivery_id' => $do->parent_delivery_id,
                'is_backorder' => $do->is_backorder,
                'status' => $do->status,
                'location_from' => $do->location_from,
                'location_to' => $do->location_to,
                'scheduled_date' => $do->scheduled_date?->format('d/m/Y'),
                'validated_at' => $do->validated_at?->format('d/m/Y H:i'),
                'total_items' => $do->lines->sum('qty_demand'),
                'total_delivered' => $do->lines->sum('qty_done'),
            ];
        });

        return Inertia::render('Inventory/Deliveries/Index', [
            'deliveries' => $deliveries,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => [
                'all' => DeliveryOrder::count(),
                'to_process' => DeliveryOrder::whereIn('status', ['draft', 'ready'])->count(),
                'done' => DeliveryOrder::where('status', 'done')->count(),
                'backorders' => DeliveryOrder::where('is_backorder', true)->count(),
            ],
        ]);
    }

    /**
     * Show Delivery Order Form View.
     */
    public function show(string $id): Response
    {
        $do = DeliveryOrder::with([
            'salesOrder.customer',
            'lines.product',
            'lines.soLine',
            'sourceLocation',
            'validatedBy',
            'creator',
            'parentDelivery',
            'backorders',
        ])->findOrFail($id);

        $stockMoves = StockMove::where('source_document_type', 'delivery_order')
            ->where('source_document_id', $do->id)
            ->with('journalEntry')
            ->get();

        $lines = $do->lines->map(function ($line) use ($do) {
            $onHand = (float) $this->stockService->getOnHand($line->variant_sku, $do->location_from);
            $available = (float) $this->stockService->getAvailable($line->variant_sku, $do->location_from);

            return [
                'id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'product_name' => $line->product?->name ?? $line->variant_sku,
                'size' => $line->product?->size,
                'color' => $line->product?->color,
                'unit' => $line->product?->unit,
                'qty_demand' => (float) $line->qty_demand,
                'qty_done' => (float) $line->qty_done,
                'cogs_per_unit' => (float) $line->cogs_per_unit,
                'cogs_total' => (float) $line->cogs_total,
                'current_on_hand' => $onHand,
                'current_available' => $available,
            ];
        });

        // Related Docs (Odoo Linked Documents)
        $relatedDocs = [];

        if ($do->sales_order_id) {
            $relatedDocs[] = [
                'type' => 'Sales Order',
                'id' => $do->sales_order_id,
                'title' => "Pesanan Penjualan {$do->sales_order_id}",
                'status' => $do->salesOrder?->status ?? 'confirmed',
                'url' => route('sales.orders.show', $do->sales_order_id),
                'info' => "Pelanggan: {$do->salesOrder?->customer?->name}",
            ];
        }

        if ($do->parent_delivery_id) {
            $relatedDocs[] = [
                'type' => 'Pengiriman Induk',
                'id' => $do->parent_delivery_id,
                'title' => "Delivery Order Induk {$do->parent_delivery_id}",
                'status' => 'done',
                'url' => route('inventory.deliveries.show', $do->parent_delivery_id),
                'info' => 'Pengiriman awal sebelum timbul pecahan backorder',
            ];
        }

        foreach ($do->backorders as $bo) {
            $relatedDocs[] = [
                'type' => 'Backorder',
                'id' => $bo->id,
                'title' => "Backorder Pengiriman {$bo->id}",
                'status' => $bo->status,
                'url' => route('inventory.deliveries.show', $bo->id),
                'info' => 'Pengiriman sisa kuantitas barang yang belum dikirim',
            ];
        }

        $cogsJournal = JournalEntry::where('source_document_type', 'delivery_order')
            ->where('source_document_id', $do->id)
            ->first();

        if ($cogsJournal) {
            $relatedDocs[] = [
                'type' => 'Jurnal Akuntansi (HPP)',
                'id' => $cogsJournal->entry_no,
                'title' => "Jurnal Pengakuan HPP {$cogsJournal->entry_no}",
                'status' => $cogsJournal->status,
                'info' => 'Debit 5000 / Kredit 1200: Rp ' . number_format($cogsJournal->total_debit, 0, ',', '.'),
            ];
        }

        // Audit Logs & Chatter Notes
        $auditLogs = AuditLog::where('document_type', 'delivery_order')
            ->where('document_id', $do->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'status' => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role' => $log->actor_role,
                'notes' => $log->notes,
                'old_value' => $log->old_value,
                'new_value' => $log->new_value,
                'created_at' => $log->created_at?->format('d/m/Y H:i:s'),
                'time_ago' => $log->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Inventory/Deliveries/Show', [
            'delivery' => [
                'id' => $do->id,
                'sales_order_id' => $do->sales_order_id,
                'customer_name' => $do->salesOrder?->customer?->name ?? 'Pelanggan',
                'customer_city' => $do->salesOrder?->customer?->city,
                'parent_delivery_id' => $do->parent_delivery_id,
                'is_backorder' => $do->is_backorder,
                'status' => $do->status,
                'location_from' => $do->location_from,
                'location_from_name' => $do->sourceLocation?->location_name,
                'location_to' => $do->location_to,
                'scheduled_date' => $do->scheduled_date?->format('Y-m-d'),
                'validated_at' => $do->validated_at?->format('d/m/Y H:i'),
                'validated_by' => $do->validatedBy?->name,
                'notes' => $do->notes,
                'idempotency_key' => $do->idempotency_key,
                'lines' => $lines,
            ],
            'backorders' => $do->backorders->map(fn ($b) => ['id' => $b->id, 'status' => $b->status]),
            'stockMoves' => $stockMoves->map(function ($m) {
                return [
                    'id' => $m->id,
                    'sku' => $m->variant_sku,
                    'qty' => (float) $m->qty_done,
                    'unit_cost' => (float) $m->unit_cost,
                    'total_value' => (float) $m->total_value,
                    'journal_entry_no' => $m->journalEntry?->entry_no,
                ];
            }),
            'relatedDocs' => $relatedDocs,
            'auditLogs' => $auditLogs,
        ]);
    }

    /**
     * Create view for Delivery Order.
     */
    public function create(): Response
    {
        $salesOrders = SalesOrder::where('status', 'confirmed')->with('customer')->get();
        $locations = WarehouseLocation::all();
        $products = Product::all();

        return Inertia::render('Inventory/Deliveries/Create', [
            'salesOrders' => $salesOrders->map(fn ($s) => [
                'id' => $s->id,
                'customer_name' => $s->customer?->name,
            ]),
            'locations' => $locations,
            'products' => $products,
        ]);
    }

    /**
     * Store new Delivery Order.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'location_from' => 'required|exists:warehouses_locations,location_code',
            'location_to' => 'nullable|string|max:255',
            'scheduled_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|exists:products,variant_sku',
            'lines.*.qty_demand' => 'required|numeric|min:0.001',
        ]);

        $doId = $this->deliveryService->generateDeliveryId();

        $do = DeliveryOrder::create([
            'id' => $doId,
            'sales_order_id' => $validated['sales_order_id'],
            'location_from' => $validated['location_from'],
            'location_to' => $validated['location_to'],
            'scheduled_date' => $validated['scheduled_date'] ?? now()->toDateString(),
            'notes' => $validated['notes'],
            'status' => 'ready',
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['lines'] as $l) {
            DeliveryOrderLine::create([
                'delivery_order_id' => $do->id,
                'so_line_id' => 1, // default or linked
                'variant_sku' => $l['variant_sku'],
                'qty_demand' => $l['qty_demand'],
                'qty_done' => 0,
            ]);
        }

        AuditLog::record(
            action: 'CREATE_DELIVERY_ORDER',
            status: 'SUCCESS',
            actorUserId: $request->user()->id,
            actorUsername: $request->user()->name,
            actorRole: $request->user()->role_id ?? 'warehouse',
            documentType: 'delivery_order',
            documentId: $do->id,
            notes: "Delivery Order {$do->id} berhasil dibuat untuk Sales Order {$do->sales_order_id}"
        );

        return redirect()->route('inventory.deliveries.show', $do->id)
            ->with('success', "Delivery Order {$do->id} berhasil dibuat.");
    }

    /**
     * Validate delivery (supports partial delivery + backorder generation).
     */
    public function validateOrder(Request $request, string $id): RedirectResponse
    {
        $do = DeliveryOrder::findOrFail($id);

        $linesData = $request->input('lines', []);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $result = $this->deliveryService->validateDelivery($do, $linesData, $request->user(), $idempotencyKey);

        if ($result['already_done']) {
            return redirect()->route('inventory.deliveries.show', $do->id)
                ->with('info', "Dokumen {$do->id} sudah tervalidasi sebelumnya (Idempotent).");
        }

        $msg = "Pengiriman {$do->id} berhasil divalidasi. HPP diakui secara otomatis.";
        if ($result['backorder']) {
            $msg .= " Backorder {$result['backorder']->id} otomatis terbentuk untuk sisa item.";
        }

        return redirect()->route('inventory.deliveries.show', $do->id)->with('success', $msg);
    }
}

