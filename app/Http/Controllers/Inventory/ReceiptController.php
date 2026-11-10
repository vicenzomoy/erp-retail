<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\Master\Product;
use App\Models\Master\WarehouseLocation;
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\ReceiptLine;
use App\Models\StockMove;
use App\Services\Inventory\ReceiptService;
use App\Services\Inventory\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    protected ReceiptService $receiptService;
    protected StockService $stockService;

    public function __construct(ReceiptService $receiptService, StockService $stockService)
    {
        $this->receiptService = $receiptService;
        $this->stockService = $stockService;
    }

    /**
     * List all receipts with filters.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = Receipt::with(['purchaseOrder.vendor', 'lines.product', 'destinationLocation'])
            ->orderBy('created_at', 'desc');

        if ($status === 'to_process') {
            $query->whereIn('status', ['draft', 'ready']);
        } elseif ($status === 'done') {
            $query->where('status', 'validated');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhere('purchase_order_id', 'ilike', "%{$search}%")
                    ->orWhereHas('purchaseOrder.vendor', function ($vq) use ($search) {
                        $vq->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        $receipts = $query->paginate(15)->through(function ($r) {
            return [
                'id' => $r->id,
                'purchase_order_id' => $r->purchase_order_id,
                'vendor_name' => $r->purchaseOrder?->vendor?->name ?? 'Vendor',
                'status' => $r->status,
                'location_to' => $r->location_to,
                'receipt_date' => $r->receipt_date?->format('d/m/Y'),
                'validated_at' => $r->validated_at?->format('d/m/Y H:i'),
                'total_expected' => (float) $r->lines->sum('qty_expected'),
                'total_accepted' => (float) $r->lines->sum('qty_accepted'),
                'total_rejected' => (float) $r->lines->sum('qty_rejected'),
            ];
        });

        return Inertia::render('Inventory/Receipts/Index', [
            'receipts' => $receipts,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts' => [
                'all' => Receipt::count(),
                'to_process' => Receipt::whereIn('status', ['draft', 'ready'])->count(),
                'done' => Receipt::where('status', 'validated')->count(),
            ],
        ]);
    }

    /**
     * Show Receipt Form View.
     */
    public function show(string $id): Response
    {
        $receipt = Receipt::with([
            'purchaseOrder.vendor',
            'lines.product',
            'destinationLocation',
            'validatedBy',
            'creator',
        ])->findOrFail($id);

        $stockMoves = StockMove::where('source_document_type', 'receipt')
            ->where('source_document_id', $receipt->id)
            ->with('journalEntry')
            ->get();

        $lines = $receipt->lines->map(function ($line) use ($receipt) {
            $onHand = (float) $this->stockService->getOnHand($line->variant_sku, $receipt->location_to);

            return [
                'id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'product_name' => $line->product?->name ?? $line->variant_sku,
                'size' => $line->product?->size,
                'color' => $line->product?->color,
                'unit' => $line->product?->unit,
                'qty_expected' => (float) $line->qty_expected,
                'qty_accepted' => (float) $line->qty_accepted,
                'qty_rejected' => (float) $line->qty_rejected,
                'rejection_reason' => $line->rejection_reason,
                'unit_cost' => (float) $line->unit_cost,
                'accepted_value' => (float) $line->accepted_value,
                'current_on_hand' => $onHand,
            ];
        });

        // Related Docs
        $relatedDocs = [];

        if ($receipt->purchase_order_id) {
            $relatedDocs[] = [
                'type' => 'Purchase Order',
                'id' => $receipt->purchase_order_id,
                'title' => "Pesanan Pembelian {$receipt->purchase_order_id}",
                'status' => $receipt->purchaseOrder?->status ?? 'confirmed',
                'info' => "Vendor: {$receipt->purchaseOrder?->vendor?->name}",
            ];
        }

        $grirJournal = JournalEntry::where('source_document_type', 'receipt')
            ->where('source_document_id', $receipt->id)
            ->first();

        if ($grirJournal) {
            $relatedDocs[] = [
                'type' => 'Jurnal Akuntansi (GRIR)',
                'id' => $grirJournal->entry_no,
                'title' => "Jurnal Persediaan Diterima {$grirJournal->entry_no}",
                'status' => $grirJournal->status,
                'info' => 'Debit 1200 / Kredit 1400: Rp ' . number_format($grirJournal->total_debit, 0, ',', '.'),
            ];
        }

        // Audit Logs & Chatter Notes
        $auditLogs = AuditLog::where('document_type', 'receipt')
            ->where('document_id', $receipt->id)
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

        return Inertia::render('Inventory/Receipts/Show', [
            'receipt' => [
                'id' => $receipt->id,
                'purchase_order_id' => $receipt->purchase_order_id,
                'vendor_name' => $receipt->purchaseOrder?->vendor?->name ?? 'Vendor',
                'vendor_city' => $receipt->purchaseOrder?->vendor?->city,
                'status' => $receipt->status,
                'location_to' => $receipt->location_to,
                'location_to_name' => $receipt->destinationLocation?->location_name,
                'receipt_date' => $receipt->receipt_date?->format('Y-m-d'),
                'validated_at' => $receipt->validated_at?->format('d/m/Y H:i'),
                'validated_by' => $receipt->validatedBy?->name,
                'notes' => $receipt->notes,
                'idempotency_key' => $receipt->idempotency_key,
                'lines' => $lines,
            ],
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
     * Create view for Receipt.
     */
    public function create(): Response
    {
        $purchaseOrders = PurchaseOrder::where('status', 'confirmed')->with('vendor')->get();
        $locations = WarehouseLocation::all();
        $products = Product::all();

        return Inertia::render('Inventory/Receipts/Create', [
            'purchaseOrders' => $purchaseOrders->map(fn ($p) => [
                'id' => $p->id,
                'vendor_name' => $p->vendor?->name,
            ]),
            'locations' => $locations,
            'products' => $products,
        ]);
    }

    /**
     * Store new Receipt.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'location_to' => 'required|exists:warehouses_locations,location_code',
            'receipt_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.variant_sku' => 'required|exists:products,variant_sku',
            'lines.*.qty_expected' => 'required|numeric|min:0.001',
        ]);

        $rcpId = $this->receiptService->generateReceiptId($validated['location_to'] ?? 'WH-PKU');

        $receipt = Receipt::create([
            'id' => $rcpId,
            'purchase_order_id' => $validated['purchase_order_id'],
            'location_to' => $validated['location_to'],
            'receipt_date' => $validated['receipt_date'] ?? now()->toDateString(),
            'notes' => $validated['notes'],
            'status' => 'ready',
            'created_by' => $request->user()->id,
        ]);

        $po = PurchaseOrder::with('lines')->find($validated['purchase_order_id']);

        foreach ($validated['lines'] as $l) {
            $prod = Product::find($l['variant_sku']);
            $cost = $prod?->cost ?? 0;
            $poLine = $po?->lines->where('variant_sku', $l['variant_sku'])->first();

            ReceiptLine::create([
                'receipt_id' => $receipt->id,
                'po_line_id' => $poLine?->id ?? 1,
                'variant_sku' => $l['variant_sku'],
                'qty_expected' => $l['qty_expected'],
                'qty_accepted' => $l['qty_expected'], // default full accepted before QC
                'qty_rejected' => 0,
                'unit_cost' => $cost,
                'accepted_value' => bcmul((string) $l['qty_expected'], (string) $cost, 2),
            ]);
        }

        AuditLog::record(
            action: 'CREATE_RECEIPT',
            status: 'SUCCESS',
            actorUserId: $request->user()->id,
            actorUsername: $request->user()->name,
            actorRole: $request->user()->role_id ?? 'warehouse',
            documentType: 'receipt',
            documentId: $receipt->id,
            notes: "Penerimaan barang {$receipt->id} berhasil dibuat untuk Purchase Order {$receipt->purchase_order_id}"
        );

        return redirect()->route('inventory.receipts.show', $receipt->id)
            ->with('success', "Receipt {$receipt->id} berhasil dibuat.");
    }

    /**
     * Validate receipt with QC check (Accepted vs Rejected).
     */
    public function validateReceipt(Request $request, string $id): RedirectResponse
    {
        $receipt = Receipt::findOrFail($id);

        $linesData = $request->input('lines', []);
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? $request->input('idempotency_key');

        $result = $this->receiptService->validateReceipt($receipt, $linesData, $request->user(), $idempotencyKey);

        if ($result['already_done']) {
            return redirect()->route('inventory.receipts.show', $receipt->id)
                ->with('info', "Penerimaan {$receipt->id} sudah divalidasi sebelumnya (Idempotent).");
        }

        return redirect()->route('inventory.receipts.show', $receipt->id)
            ->with('success', "Penerimaan {$receipt->id} berhasil divalidasi. Stok yang diterima baik (accepted) telah ditambahkan ke persediaan.");
    }
}

