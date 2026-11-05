<?php

namespace App\Services\Purchase;

use App\Models\AuditLog;
use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\Receipt;
use App\Models\ReceiptLine;
use App\Models\User;
use App\Models\VendorBill;
use App\Models\VendorBillLine;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderService
{
    /**
     * Generate ID unik untuk Purchase Order / RFQ (format: PO-0001 atau PO0009).
     */
    public function generatePoId(): string
    {
        $maxNum = 0;
        $orders = DB::table('purchase_orders')->pluck('id');

        foreach ($orders as $id) {
            if (preg_match('/^PO-?(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            } elseif (preg_match('/^P(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $next = $maxNum + 1;
        return sprintf('PO-%04d', $next);
    }

    /**
     * Ambil data PO untuk tampilan list dengan filter.
     */
    public function getOrdersForList(array $filters = []): LengthAwarePaginator
    {
        $query = PurchaseOrder::with(['vendor', 'lines.product', 'receipts', 'vendorBills'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $status = $filters['status'] ?? null;
        if ($status && $status !== 'all') {
            if ($status === 'rfq') {
                $query->where('status', 'rfq');
            } elseif ($status === 'confirmed') {
                $query->where('status', 'confirmed');
            } elseif ($status === 'done') {
                $query->where('status', 'done');
            } elseif ($status === 'cancelled') {
                $query->where('status', 'cancelled');
            }
        }

        if (!empty($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhere('source_doc_no', 'ilike', "%{$search}%")
                    ->orWhereHas('vendor', function ($vq) use ($search) {
                        $vq->where('name', 'ilike', "%{$search}%")
                           ->orWhere('city', 'ilike', "%{$search}%");
                    });
            });
        }

        return $query->paginate(15)->through(function (PurchaseOrder $po) {
            $totalOrdered = $po->lines->sum('qty_ordered');
            $totalReceived = $po->lines->sum('qty_received');
            $totalBilled = $po->lines->sum('qty_billed');

            return [
                'id' => $po->id,
                'source_doc_no' => $po->source_doc_no,
                'vendor_id' => $po->vendor_id,
                'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                'vendor_city' => $po->vendor?->city,
                'status' => $po->status,
                'payment_terms' => $po->payment_terms,
                'subtotal_before_tax' => (float) $po->subtotal_before_tax,
                'total_tax' => (float) $po->total_tax,
                'grand_total' => (float) $po->grand_total,
                'confirmed_at' => $po->confirmed_at?->format('d/m/Y H:i'),
                'created_at' => $po->created_at?->format('d/m/Y H:i'),
                'lines_count' => $po->lines->count(),
                'total_ordered' => (float) $totalOrdered,
                'total_received' => (float) $totalReceived,
                'total_billed' => (float) $totalBilled,
                'receipts_count' => $po->receipts->count(),
                'bills_count' => $po->vendorBills->count(),
            ];
        });
    }

    /**
     * Hitung ringkasan jumlah PO berdasarkan status.
     */
    public function getCounts(): array
    {
        return [
            'all' => PurchaseOrder::count(),
            'rfq' => PurchaseOrder::where('status', 'rfq')->count(),
            'confirmed' => PurchaseOrder::where('status', 'confirmed')->count(),
            'done' => PurchaseOrder::where('status', 'done')->count(),
            'cancelled' => PurchaseOrder::where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Buat RFQ baru (status: rfq) dengan kalkulasi PPN per baris pembulatan rupiah (F-12, F-23, SR-05, SR-22).
     */
    public function createRfq(array $data, User $actor): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $actor) {
            $poId = !empty($data['id']) ? $data['id'] : $this->generatePoId();

            $vendor = ContactVendor::findOrFail($data['vendor_id']);
            $paymentTerms = $data['payment_terms'] ?? $vendor->payment_terms ?? 'NET30';

            $taxRate = TaxRate::where('tax_id', 'VAT-NONLUX')->first();
            $taxPercent = ($taxRate && !empty($taxRate->effective_rate))
                ? (float) rtrim($taxRate->effective_rate, '%')
                : 11.0;

            $subtotalBeforeTax = 0.0;
            $totalTax = 0.0;
            $grandTotal = 0.0;

            $preparedLines = [];

            foreach ($data['lines'] as $lineData) {
                $sku = $lineData['variant_sku'];
                $qty = (float) $lineData['qty_ordered'];
                $unitPrice = (float) $lineData['unit_price'];

                if ($qty <= 0) {
                    throw ValidationException::withMessages([
                        'lines' => "Kuantitas produk {$sku} harus lebih besar dari 0.",
                    ]);
                }

                if ($unitPrice < 0) {
                    throw ValidationException::withMessages([
                        'lines' => "Harga satuan produk {$sku} tidak boleh bernilai negatif.",
                    ]);
                }

                $taxId = $lineData['tax_id'] ?? 'VAT-NONLUX';
                $lineSubtotal = round($qty * $unitPrice, 2);

                // PPN per baris, dibulatkan ke rupiah terdekat (F-23 / SR-22)
                $lineTax = round($lineSubtotal * ($taxPercent / 100.0));
                $lineTotal = $lineSubtotal + $lineTax;

                $subtotalBeforeTax += $lineSubtotal;
                $totalTax += $lineTax;
                $grandTotal += $lineTotal;

                $preparedLines[] = [
                    'variant_sku' => $sku,
                    'qty_ordered' => $qty,
                    'qty_received' => 0,
                    'qty_billed' => 0,
                    'unit_price' => $unitPrice,
                    'tax_id' => $taxId,
                    'subtotal_before_tax' => $lineSubtotal,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ];
            }

            $status = !empty($data['auto_confirm']) ? 'confirmed' : 'rfq';
            $confirmedAt = ($status === 'confirmed') ? now() : null;
            $confirmedBy = ($status === 'confirmed') ? $actor->id : null;

            $po = PurchaseOrder::create([
                'id' => $poId,
                'source_doc_no' => $data['source_doc_no'] ?? null,
                'vendor_id' => $vendor->id,
                'status' => $status,
                'payment_terms' => $paymentTerms,
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax' => $totalTax,
                'grand_total' => $grandTotal,
                'confirmed_at' => $confirmedAt,
                'confirmed_by' => $confirmedBy,
                'idempotency_key' => $data['idempotency_key'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor->id,
            ]);

            foreach ($preparedLines as $pl) {
                $po->lines()->create($pl);
            }

            AuditLog::record(
                action: 'CREATE_PURCHASE_ORDER',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'procurement',
                documentType: 'purchase_order',
                documentId: $po->id,
                notes: "Draft RFQ {$po->id} dibuat untuk vendor {$vendor->name} dengan total " . number_format($grandTotal, 0, ',', '.'),
                newValue: [
                    'id' => $po->id,
                    'vendor_id' => $vendor->id,
                    'status' => $status,
                    'grand_total' => $grandTotal,
                ]
            );

            // Jika langsung auto-confirm, siapkan dokumen penerimaan fisik (Receipt) di gudang
            if ($status === 'confirmed') {
                $this->ensureReceiptCreated($po, $actor);
            }

            return $po;
        });
    }

    /**
     * Konfirmasi RFQ menjadi Purchase Order (F-12, SR-05).
     * Merekam jejak audit, mengunci harga, dan otomatis menyiapkan Receipt di Inventory (S-11).
     * Melindungi dari request ganda (idempotent).
     */
    public function confirmOrder(PurchaseOrder $po, User $actor, ?string $idempotencyKey = null): PurchaseOrder
    {
        // Idempotency check: jika sudah confirmed atau done, kembalikan tanpa error atau duplikasi receipt
        if ($po->isConfirmed() || $po->isDone()) {
            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_PO_CONFIRM',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'procurement',
                documentType: 'purchase_order',
                documentId: $po->id,
                notes: "Permintaan konfirmasi ulang pada Purchase Order {$po->id} yang sudah confirmed diabaikan secara idempotent"
            );

            return $po->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        }

        if ($po->status === 'cancelled') {
            throw ValidationException::withMessages([
                'status' => "Purchase Order {$po->id} yang telah dibatalkan tidak dapat dikonfirmasi ulang.",
            ]);
        }

        return DB::transaction(function () use ($po, $actor, $idempotencyKey) {
            $po->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'confirmed_by' => $actor->id,
                'idempotency_key' => $idempotencyKey ?? $po->idempotency_key,
            ]);

            AuditLog::record(
                action: 'CONFIRM_PURCHASE_ORDER',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'procurement',
                documentType: 'purchase_order',
                documentId: $po->id,
                notes: "Purchase Order {$po->id} berhasil dikonfirmasi. Dokumen penerimaan gudang (Receipt) telah disiapkan.",
                oldValue: ['status' => 'rfq'],
                newValue: ['status' => 'confirmed']
            );

            // Buat dokumen Receipt terkait di Inventory agar siap diterima tim gudang (F-13 / S-11)
            $this->ensureReceiptCreated($po, $actor);

            return $po->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        });
    }

    /**
     * Memastikan dokumen Receipt (WH/IN/xxxx) dibuat untuk PO yang sudah confirmed.
     */
    public function ensureReceiptCreated(PurchaseOrder $po, ?User $actor = null): Receipt
    {
        $existing = Receipt::where('purchase_order_id', $po->id)->first();
        if ($existing) {
            return $existing;
        }

        // Generate ID Receipt WH/IN/xxxx
        $rcpCount = Receipt::count() + 1;
        $rcpId = sprintf('WH/IN/%04d', $rcpCount);

        // Cari ID yang belum terpakai jika ada tabrakan
        while (Receipt::where('id', $rcpId)->exists()) {
            $rcpCount++;
            $rcpId = sprintf('WH/IN/%04d', $rcpCount);
        }

        $creatorId = $actor?->id ?? $po->created_by ?? User::first()->id;

        $receipt = Receipt::create([
            'id' => $rcpId,
            'purchase_order_id' => $po->id,
            'status' => 'ready', // siap diterima / ready for QC
            'location_to' => 'WH-PKU', // Default gudang utama
            'receipt_date' => now()->toDateString(),
            'notes' => "Penerimaan fisik barang atas {$po->id} ({$po->vendor?->name})",
            'created_by' => $creatorId,
        ]);

        foreach ($po->lines as $line) {
            $prod = Product::find($line->variant_sku);
            $cost = $prod?->cost ?? $line->unit_price;

            ReceiptLine::create([
                'receipt_id' => $receipt->id,
                'po_line_id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'qty_expected' => $line->qty_ordered,
                'qty_accepted' => 0, // default belum diinspeksi QC
                'qty_rejected' => 0,
                'unit_cost' => $cost,
                'accepted_value' => 0,
            ]);
        }

        AuditLog::record(
            action: 'CREATE_RECEIPT',
            status: 'SUCCESS',
            actorUserId: $creatorId,
            actorUsername: $actor?->name ?? 'system',
            actorRole: $actor?->role_id ?? 'procurement',
            documentType: 'receipt',
            documentId: $receipt->id,
            notes: "Dokumen penerimaan gudang {$receipt->id} dibuat otomatis untuk {$po->id}"
        );

        return $receipt;
    }

    /**
     * Validasi Three-Way Matching sebelum pembuatan Vendor Bill (F-14, SR-05, SR-06, SR-13, T-20).
     * Jika belum ada barang yang diterima dan lolos QC (accepted receipt), tolak penagihan!
     *
     * @throws ValidationException
     */
    public function checkBillingEligibility(PurchaseOrder $po): array
    {
        $po->loadMissing(['vendor', 'lines.product', 'receipts.lines']);

        $validatedReceipts = $po->receipts->where('status', 'validated')->values();
        $validatedReceiptIds = $validatedReceipts->pluck('id')->all();

        // Hitung total accepted kuantitas
        $totalAccepted = 0.0;
        $billableLines = [];

        foreach ($po->lines as $line) {
            $rcpLines = ReceiptLine::whereIn('receipt_id', $validatedReceiptIds)
                ->where(function ($q) use ($line) {
                    $q->where('po_line_id', $line->id)
                      ->orWhere('variant_sku', $line->variant_sku);
                })
                ->get();

            $qtyAccepted = (float) $rcpLines->sum('qty_accepted');
            $qtyRejected = (float) $rcpLines->sum('qty_rejected');

            // Hitung yang sudah ditagih pada bill aktif
            $alreadyBilled = (float) VendorBillLine::whereHas('vendorBill', function ($q) use ($po) {
                $q->where('purchase_order_id', $po->id)
                  ->whereIn('status', ['draft', 'posted', 'paid']);
            })
            ->where(function ($q) use ($line) {
                $q->where('po_line_id', $line->id)
                  ->orWhere('variant_sku', $line->variant_sku);
            })
            ->sum('qty_billed');

            $maxBillable = max(0.0, $qtyAccepted - $alreadyBilled);
            $totalAccepted += $qtyAccepted;

            $billableLines[] = [
                'po_line_id' => $line->id,
                'variant_sku' => $line->variant_sku,
                'product_name' => $line->product?->name ?? $line->variant_sku,
                'unit_price' => (float) $line->unit_price,
                'qty_ordered' => (float) $line->qty_ordered,
                'qty_accepted' => $qtyAccepted,
                'qty_rejected' => $qtyRejected,
                'qty_billed' => $alreadyBilled,
                'max_billable' => $maxBillable,
            ];
        }

        // ATURAN KRITIS T-20 / SR-05 / SR-06:
        // Tagihan / Pembayaran Vendor TIDAK BOLEH dibuat tanpa adanya accepted receipt!
        if ($totalAccepted <= 0) {
            AuditLog::record(
                action: 'ATTEMPT_BILL_WITHOUT_RECEIPT',
                status: 'REJECTED',
                documentType: 'purchase_order',
                documentId: $po->id,
                notes: "Pembuatan tagihan vendor untuk {$po->id} ditolak karena belum ada barang yang diterima dan lolos QC (Three-Way Match SR-05/SR-06)"
            );

            throw ValidationException::withMessages([
                'billing' => "Pembuatan tagihan vendor ditolak: Belum ada barang yang diterima dan lolos QC (Accepted Receipt) untuk Purchase Order {$po->id}. Sesuai kebijakan Three-Way Matching (SR-05, SR-06), tagihan hanya dapat diterbitkan atas barang yang sudah diterima baik.",
            ]);
        }

        return [
            'total_accepted' => $totalAccepted,
            'billable_lines' => $billableLines,
            'validated_receipts' => $validatedReceipts,
        ];
    }

    /**
     * Batalkan Purchase Order (hanya jika belum ada barang yang diterima / tervalidasi).
     */
    public function cancelOrder(PurchaseOrder $po, User $actor, ?string $reason = null): PurchaseOrder
    {
        $hasValidatedReceipts = $po->receipts()->where('status', 'validated')->exists();
        if ($hasValidatedReceipts) {
            throw ValidationException::withMessages([
                'status' => "Purchase Order {$po->id} tidak dapat dibatalkan karena sudah ada barang yang diterima di gudang.",
            ]);
        }

        $hasPostedBills = $po->vendorBills()->whereIn('status', ['posted', 'paid'])->exists();
        if ($hasPostedBills) {
            throw ValidationException::withMessages([
                'status' => "Purchase Order {$po->id} tidak dapat dibatalkan karena sudah memiliki tagihan vendor yang diposting.",
            ]);
        }

        return DB::transaction(function () use ($po, $actor, $reason) {
            $po->update(['status' => 'cancelled']);

            // Batalkan juga draft receipt yang belum divalidasi
            $po->receipts()->where('status', '!=', 'validated')->update(['status' => 'cancelled']);

            AuditLog::record(
                action: 'CANCEL_PURCHASE_ORDER',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'procurement',
                documentType: 'purchase_order',
                documentId: $po->id,
                notes: "Purchase Order {$po->id} dibatalkan. Alasan: " . ($reason ?? 'Dibatalkan oleh staf pengadaan')
            );

            return $po->fresh();
        });
    }

    /**
     * Ambil data KPI ringkasan untuk dashboard overview modul Purchase.
     */
    public function getKpis(): array
    {
        $currentMonthStart = now()->startOfMonth();

        $totalPurchasesMonth = PurchaseOrder::whereIn('status', ['confirmed', 'done'])
            ->where('created_at', '>=', $currentMonthStart)
            ->sum('grand_total');

        $rfqCount = PurchaseOrder::where('status', 'rfq')->count();

        // PO confirmed tapi belum ada receipt validated atau penerimaan belum selesai
        $waitingReceiptsCount = PurchaseOrder::where('status', 'confirmed')
            ->whereHas('receipts', fn ($q) => $q->where('status', '!=', 'validated'))
            ->count();

        // PO yang sudah ada receipt validated tetapi belum dibuatkan Vendor Bill lengkap
        $waitingBillCount = PurchaseOrder::whereIn('status', ['confirmed', 'done'])
            ->whereHas('receipts', fn ($q) => $q->where('status', 'validated'))
            ->where(function ($q) {
                $q->whereDoesntHave('vendorBills')
                  ->orWhereHas('vendorBills', fn ($bq) => $bq->where('status', 'draft'));
            })
            ->count();

        return [
            'total_purchases_month' => (float) $totalPurchasesMonth,
            'rfq_count' => $rfqCount,
            'waiting_receipts_count' => $waitingReceiptsCount,
            'waiting_bill_count' => $waitingBillCount,
        ];
    }

    /**
     * Data vendor untuk select options.
     */
    public function getVendorsForSelect(): array
    {
        return ContactVendor::orderBy('name')
            ->get(['id', 'name', 'city', 'payment_terms'])
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => "{$v->id} — {$v->name} ({$v->city})",
                'raw_name' => $v->name,
                'city' => $v->city,
                'payment_terms' => $v->payment_terms,
            ])
            ->toArray();
    }

    /**
     * Data produk untuk form pembuatan PO/RFQ.
     */
    public function getProductsForSelect(): array
    {
        return Product::orderBy('variant_sku')
            ->get(['variant_sku', 'name', 'size', 'color', 'unit', 'cost', 'default_vendor'])
            ->map(fn ($p) => [
                'variant_sku' => $p->variant_sku,
                'name' => "{$p->variant_sku} — {$p->name} ({$p->size}/{$p->color})",
                'raw_name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'cost' => (float) $p->cost,
                'default_vendor' => $p->default_vendor,
            ])
            ->toArray();
    }

    /**
     * Data payment terms.
     */
    public function getPaymentTermsForSelect(): array
    {
        return PaymentTerm::all(['term_id', 'description', 'due_days'])->toArray();
    }
}

