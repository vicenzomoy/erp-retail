<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\CustomerReturn;
use App\Services\Sales\CustomerReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReturnInspectionController extends Controller
{
    public function __construct(
        protected CustomerReturnService $returnService
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending_inspection');
        $search = $request->query('search', '');

        $query = CustomerReturn::with(['customer', 'customerInvoice', 'lines.product'])
            ->orderByDesc('created_at');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                  ->orWhere('customer_invoice_id', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        $inspections = $query->paginate(15)->through(fn (CustomerReturn $r) => [
            'id'                  => $r->id,
            'customer_invoice_id' => $r->customer_invoice_id,
            'customer_name'       => $r->customer?->name,
            'return_date'         => $r->return_date?->format('d/m/Y'),
            'status'              => $r->status,
            'total_items'         => $r->lines->sum('qty_requested'),
            'inspected_at'        => $r->inspected_at?->format('d/m/Y H:i'),
        ])->withQueryString();

        return Inertia::render('Inventory/Returns/Index', [
            'inspections' => $inspections,
            'filters'     => [
                'status' => $status,
                'search' => $search,
            ],
            'counts'      => [
                'pending'   => CustomerReturn::where('status', 'pending_inspection')->count(),
                'inspected' => CustomerReturn::where('status', 'inspected')->count(),
                'completed' => CustomerReturn::where('status', 'completed')->count(),
                'all'       => CustomerReturn::count(),
            ],
        ]);
    }

    public function show(string $id): Response
    {
        $return = CustomerReturn::with([
            'customer',
            'customerInvoice',
            'salesOrder',
            'salesUser',
            'inspectedBy',
            'lines.product',
        ])->findOrFail($id);

        return Inertia::render('Inventory/Returns/Show', [
            'customerReturn' => [
                'id'                  => $return->id,
                'customer_invoice_id' => $return->customer_invoice_id,
                'sales_order_id'      => $return->sales_order_id,
                'customer_name'       => $return->customer?->name,
                'return_date'         => $return->return_date?->format('d/m/Y'),
                'days_since_invoice'  => $return->days_since_invoice,
                'status'              => $return->status,
                'reason'              => $return->reason,
                'sales_user_name'     => $return->salesUser?->name,
                'inspected_by_name'   => $return->inspectedBy?->name,
                'inspected_at'        => $return->inspected_at?->format('d/m/Y H:i'),
                'inspection_notes'    => $return->inspection_notes,
                'credit_note_id'      => $return->credit_note_id,
                'lines'               => $return->lines->map(fn ($l) => [
                    'id'            => $l->id,
                    'variant_sku'   => $l->variant_sku,
                    'product_name'  => $l->product?->name ?? $l->variant_sku,
                    'size'          => $l->product?->size,
                    'color'         => $l->product?->color,
                    'qty_requested' => (float) $l->qty_requested,
                    'qty_inspected' => (float) $l->qty_inspected,
                    'qty_accepted'  => (float) $l->qty_accepted,
                    'qty_damaged'   => (float) $l->qty_damaged,
                    'unit_price'    => (float) $l->unit_price,
                    'condition'     => $l->condition,
                    'notes'         => $l->notes,
                ]),
            ],
        ]);
    }

    public function validateInspection(Request $request, string $id): RedirectResponse
    {
        $return = CustomerReturn::findOrFail($id);

        $validated = $request->validate([
            'inspection_notes'          => 'nullable|string|max:500',
            'lines'                     => 'required|array|min:1',
            'lines.*.id'                => 'required|integer',
            'lines.*.qty_inspected'     => 'required|numeric|min:0',
            'lines.*.qty_accepted'      => 'required|numeric|min:0',
            'lines.*.qty_damaged'       => 'nullable|numeric|min:0',
            'lines.*.condition'         => 'nullable|string|in:saleable,damaged',
            'lines.*.notes'             => 'nullable|string|max:255',
        ]);

        $this->returnService->validateWarehouseInspection($return, $validated, $request->user());

        return redirect()->route('inventory.returns.show', $return->id)
            ->with('success', "Inspeksi barang retur {$return->id} berhasil divalidasi. Stok barang layak jual telah ditambahkan ke gudang.");
    }
}

