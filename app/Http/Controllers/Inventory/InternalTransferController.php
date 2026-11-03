<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InternalTransfer;
use App\Models\InternalTransferLine;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\StockMove;
use App\Services\Inventory\InternalTransferService;
use App\Services\Inventory\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InternalTransferController extends Controller
{
    protected InternalTransferService $transferService;
    protected StockService $stockService;

    public function __construct(InternalTransferService $transferService, StockService $stockService)
    {
        $this->transferService = $transferService;
        $this->stockService = $stockService;
    }

    /**
     * List all internal transfers with filters.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = InternalTransfer::with(['fromLocation', 'toLocation', 'lines.product'])
            ->orderBy('created_at', 'desc');

        if ($status === 'to_process') {
            $query->whereIn('status', ['draft', 'ready']);
        } elseif ($status === 'done') {
            $query->where('status', 'done');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhere('location_from', 'ilike', "%{$search}%")
                    ->orWhere('location_to', 'ilike', "%{$search}%");
            });
        }

        $transfers = $query->paginate(15)->through(function ($t) {
            return [
                'id' => $t->id,
                'location_from' => $t->location_from,
                'from_name' => $t->fromLocation?->location_name,
                'location_to' => $t->location_to,
                'to_name' => $t->toLocation?->location_name,
                'status' => $t->status,
                'scheduled_date' => $t->scheduled_date?->format('d/m/Y'),
                'validated_at' => $t->validated_at?->format('d/m/Y H:i'),
                'total_demand' => (float) $t->lines->sum('qty_demand'),
                'total_done' => (float) $t->lines->sum('qty_done'),
            ];
        });

        return Inertia::render('Inventory/Transfers/Index', [
            'transfers' => $transfers,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => [
                'all' => InternalTransfer::count(),
                'to_process' => InternalTransfer::whereIn('status', ['draft', 'ready'])->count(),
                'done' => InternalTransfer::where('status', 'done')->count(),
            ],
        ]);
    }

    /**
     * Show Internal Transfer Form View.
     */
    public function show(string $id): Response
    {
        $transfer = InternalTransfer::with([
            'fromLocation',
            'toLocation',
            'lines.product',
            'validatedBy',
            'creator',
        ])->findOrFail($id);

        $stockMoves = StockMove::where('source_document_type', 'internal_transfer')
            ->where('source_document_id', $transfer->id)
            ->get();

        $lines = $transfer->lines->map(function ($line) use ($transfer) {
            $fromAvailable = (float) $this->stockService->getAvailable($line->variant_sku, $transfer->location_from);
            $fromOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $transfer->location_from);
            $toOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $transfer->location_to);

            return [
                'id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'product_name' => $line->product?->name ?? $line->variant_sku,
                'size' => $line->product?->size,
                'color' => $line->product?->color,
                'unit' => $line->product?->unit,
                'qty_demand' => (float) $line->qty_demand,
                'qty_done' => (float) $line->qty_done,
                'unit_cost' => (float) $line->unit_cost,
                'from_on_hand' => $fromOnHand,
                'from_available' => $fromAvailable,
                'to_on_hand' => $toOnHand,
            ];
        });

        return Inertia::render('Inventory/Transfers/Show', [
            'transfer' => [
                'id' => $transfer->id,
                'location_from' => $transfer->location_from,
                'location_from_name' => $transfer->fromLocation?->location_name,
                'location_to' => $transfer->location_to,
                'location_to_name' => $transfer->toLocation?->location_name,
                'status' => $transfer->status,
                'scheduled_date' => $transfer->scheduled_date?->format('Y-m-d'),
                'validated_at' => $transfer->validated_at?->format('d/m/Y H:i'),
                'validated_by' => $transfer->validatedBy?->name,
                'notes' => $transfer->notes,
                'lines' => $lines,
            ],
            'stockMoves' => $stockMoves->map(function ($m) {
                return [
                    'id' => $m->id,
                    'sku' => $m->variant_sku,
                    'from' => $m->location_from,
                    'to' => $m->location_to,
                    'qty' => (float) $m->qty_done,
                    'unit_cost' => (float) $m->unit_cost,
                    'total_value' => (float) $m->total_value,
                ];
            }),
        ]);
    }

    /**
     * Create view for Internal Transfer.
     */
    public function create(): Response
    {
        $locations = WarehouseLocation::all();
        $products = Product::all();

        return Inertia::render('Inventory/Transfers/Create', [
            'locations' => $locations,
            'products' => $products,
        ]);
    }

    /**
     * Store new Internal Transfer.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'location_from' => 'required|exists:warehouses_locations,location_code',
            'location_to' => 'required|exists:warehouses_locations,location_code|different:location_from',
            'scheduled_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|exists:products,variant_sku',
            'lines.*.qty_demand' => 'required|numeric|min:0.001',
        ]);

        $transfer = $this->transferService->createTransfer(
            locationFrom: $validated['location_from'],
            locationTo: $validated['location_to'],
            items: $validated['lines'],
            actor: $request->user(),
            scheduledDate: $validated['scheduled_date'] ?? null,
            notes: $validated['notes'] ?? null
        );

        return redirect()->route('inventory.transfers.show', $transfer->id)
            ->with('success', "Internal Transfer {$transfer->id} berhasil dibuat.");
    }

    /**
     * Validate internal transfer (checks Available stock at location_from).
     */
    public function validateTransfer(Request $request, string $id): RedirectResponse
    {
        $transfer = InternalTransfer::findOrFail($id);

        $linesData = $request->input('lines', []);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $result = $this->transferService->validateTransfer($transfer, $linesData, $request->user(), $idempotencyKey);

        if ($result['already_done']) {
            return redirect()->route('inventory.transfers.show', $transfer->id)
                ->with('info', "Transfer {$transfer->id} sudah selesai divalidasi (Idempotent).");
        }

        return redirect()->route('inventory.transfers.show', $transfer->id)
            ->with('success', "Transfer {$transfer->id} dari {$transfer->location_from} ke {$transfer->location_to} berhasil.");
    }
}

