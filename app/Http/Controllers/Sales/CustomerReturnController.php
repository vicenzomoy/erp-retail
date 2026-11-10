<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\CustomerInvoice;
use App\Models\CustomerReturn;
use App\Services\Sales\CustomerReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerReturnController extends Controller
{
    public function __construct(
        protected CustomerReturnService $returnService
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search', '');

        $query = CustomerReturn::with(['customer', 'customerInvoice', 'salesUser', 'inspectedBy', 'creditNote'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

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

        $returns = $query->paginate(15)->through(fn (CustomerReturn $r) => [
            'id'                  => $r->id,
            'customer_invoice_id' => $r->customer_invoice_id,
            'sales_order_id'      => $r->sales_order_id,
            'customer_name'       => $r->customer?->name,
            'return_date'         => $r->return_date?->format('d/m/Y'),
            'days_since_invoice'  => $r->days_since_invoice,
            'status'              => $r->status,
            'reason'              => $r->reason,
            'sales_user_name'     => $r->salesUser?->name,
            'inspected_by_name'   => $r->inspectedBy?->name,
            'credit_note_id'      => $r->credit_note_id,
        ])->withQueryString();

        return Inertia::render('Sales/Returns/Index', [
            'returns' => $returns,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'counts'  => [
                'all'                => CustomerReturn::count(),
                'pending_inspection' => CustomerReturn::where('status', 'pending_inspection')->count(),
                'inspected'          => CustomerReturn::where('status', 'inspected')->count(),
                'completed'          => CustomerReturn::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $selectedInvoiceId = $request->query('invoice_id', '');
        $invoices = $this->returnService->getEligibleInvoices();

        return Inertia::render('Sales/Returns/Create', [
            'invoices'          => $invoices,
            'selectedInvoiceId' => $selectedInvoiceId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_invoice_id'                 => 'required|exists:customer_invoices,id',
            'reason'                              => 'required|string|max:500',
            'lines'                               => 'required|array|min:1',
            'lines.*.customer_invoice_line_id'    => 'nullable|integer',
            'lines.*.variant_sku'                 => 'required|string|exists:products,variant_sku',
            'lines.*.qty_requested'              => 'required|numeric|min:1',
            'lines.*.unit_price'                  => 'nullable|numeric|min:0',
            'lines.*.notes'                       => 'nullable|string|max:255',
        ], [
            'customer_invoice_id.required'        => 'Pilih faktur pelanggan yang akan diajukan retur.',
            'lines.min'                           => 'Minimal harus ada 1 barang yang diajukan retur.',
            'lines.*.qty_requested.min'           => 'Jumlah retur minimal 1 unit.',
        ]);

        $return = $this->returnService->createReturnRequest($validated, $request->user());

        return redirect()->route('sales.returns.show', $return->id)
            ->with('success', "Permintaan retur {$return->id} berhasil diajukan dan menunggu Return Inspection oleh gudang.");
    }

    public function show(string $id): Response
    {
        $return = CustomerReturn::with([
            'customer',
            'customerInvoice.lines.product',
            'salesOrder',
            'salesUser',
            'inspectedBy',
            'creditNote',
            'lines.product',
        ])->findOrFail($id);

        return Inertia::render('Sales/Returns/Show', [
            'customerReturn' => [
                'id'                  => $return->id,
                'customer_invoice_id' => $return->customer_invoice_id,
                'sales_order_id'      => $return->sales_order_id,
                'customer_id'         => $return->customer_id,
                'customer_name'       => $return->customer?->name,
                'return_date'         => $return->return_date?->format('d/m/Y'),
                'days_since_invoice'  => $return->days_since_invoice,
                'is_within_14_days'   => $return->isWithinReturnWindow(),
                'status'              => $return->status,
                'reason'              => $return->reason,
                'sales_user_name'     => $return->salesUser?->name,
                'inspected_by_name'   => $return->inspectedBy?->name,
                'inspected_at'        => $return->inspected_at?->format('d/m/Y H:i'),
                'inspection_notes'    => $return->inspection_notes,
                'credit_note_id'      => $return->credit_note_id,
                'created_at'          => $return->created_at?->format('d/m/Y H:i'),
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
}

