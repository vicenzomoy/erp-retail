<?php

namespace App\Services\Purchase;

use App\Models\AuditLog;
use App\Models\Master\ContactVendor;
use App\Models\Master\PaymentTerm;
use App\Models\Master\Product;
use App\Models\Master\TaxRate;
use App\Models\NotificationRead;
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
     * Generate ID unik untuk Purchase Order / RFQ (format: PO000X).
     * Baseline PO adalah PO0007, sehingga PO baru dimulai dari PO0008.
     */
    public function generatePoId(): string
    {
        $maxNum = 7;
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
        return sprintf('PO%04d', $next);
    }

    /**
     * Generate ID Penerimaan Barang (Receipt) berformat WH-PKU/IN/000X.
     */
    public function generateReceiptId(?string $locationCode = 'WH-PKU'): string
    {
        $prefix = sprintf('%s/IN/', $locationCode ?: 'WH-PKU');
        $maxNum = 0;
        $receipts = DB::table('receipts')->pluck('id');

        foreach ($receipts as $id) {
            if (preg_match('/(?:WH-PKU|WH)\/IN\/(\d+)$/i', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $next = $maxNum + 1;
        return sprintf('%s%04d', $prefix, $next);
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
            } elseif ($status === 'to_approve') {
                $query->where('status', 'to_approve');
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
            'to_approve' => PurchaseOrder::where('status', 'to_approve')->count(),
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

            $requestedSkus = collect($data['lines'])->pluck('variant_sku')->unique()->all();
            $productsBySku = Product::with('pricelists')
                ->whereIn('variant_sku', $requestedSkus)
                ->get()
                ->keyBy('variant_sku');

            foreach ($data['lines'] as $lineData) {
                $sku = $lineData['variant_sku'];
                $qty = (float) $lineData['qty_ordered'];

                $product = $productsBySku->get($sku);
                if (! $product) {
                    throw ValidationException::withMessages([
                        'lines' => "Produk {$sku} tidak ditemukan.",
                    ]);
                }

                // Kunci harga beli satuan dari pricelist vendor (fallback ke master cost produk)
                $vendorPricelist = $product->pricelists->firstWhere('vendor_id', $vendor->id);
                $unitPrice = $vendorPricelist
                    ? (float) $vendorPricelist->unit_price
                    : (float) $product->cost;

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

            $status = 'rfq';
            if (!empty($data['auto_confirm'])) {
                // Auto-confirm tetap tunduk pada ambang persetujuan Finance
                $status = $grandTotal > PurchaseOrder::APPROVAL_THRESHOLD ? 'to_approve' : 'confirmed';
            }
            $confirmedAt = ($status === 'confirmed') ? now() : null;
            $confirmedBy = ($status === 'confirmed') ? $actor->id : null;
            $approvalRequestedAt = ($status === 'to_approve') ? now() : null;
            $approvalRequestedBy = ($status === 'to_approve') ? $actor->id : null;

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
                'approval_requested_at' => $approvalRequestedAt,
                'approval_requested_by' => $approvalRequestedBy,
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
        // PO sudah diajukan & masih menunggu Finance: klik ulang tidak mengubah apa pun (idempotent)
        if ($po->isToApprove()) {
            return $po->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        }

        // PO bernilai besar wajib disetujui Finance terlebih dahulu
        if ($po->isRfq() && $po->requiresApproval()) {
            return $this->submitForApproval($po, $actor);
        }

        return $this->performConfirmation($po, $actor, $idempotencyKey);
    }

    /**
     * Ajukan RFQ bernilai besar ke Finance (status: to_approve). Belum ada Receipt yang dibuat.
     */
    public function submitForApproval(PurchaseOrder $po, User $actor): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $actor) {
            $locked = PurchaseOrder::whereKey($po->id)->lockForUpdate()->firstOrFail();

            if (! $locked->isRfq()) {
                return $locked->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
            }

            $locked->update([
                'status' => 'to_approve',
                'approval_requested_at' => now(),
                'approval_requested_by' => $actor->id,
                'rejected_at' => null,
                'rejected_by' => null,
                'approval_notes' => null,
            ]);

            AuditLog::record(
                action: 'SUBMIT_PURCHASE_ORDER_APPROVAL',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'procurement',
                documentType: 'purchase_order',
                documentId: $locked->id,
                notes: "RFQ {$locked->id} senilai Rp " . number_format((float) $locked->grand_total, 0, ',', '.')
                    . " melebihi batas Rp " . number_format(PurchaseOrder::APPROVAL_THRESHOLD, 0, ',', '.')
                    . " dan diajukan ke Finance untuk persetujuan.",
                oldValue: ['status' => 'rfq'],
                newValue: ['status' => 'to_approve']
            );

            return $locked->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        });
    }

    /**
     * Finance menyetujui PO bernilai besar: status langsung menjadi confirmed dan Receipt gudang disiapkan.
     * Idempotent: menyetujui PO yang sudah confirmed hanya mengembalikan PO tersebut.
     */
    public function approveOrder(PurchaseOrder $po, User $actor, ?string $notes = null): PurchaseOrder
    {
        $this->ensureApprover($actor);

        return DB::transaction(function () use ($po, $actor, $notes) {
            $locked = PurchaseOrder::whereKey($po->id)->lockForUpdate()->firstOrFail();

            if ($locked->isConfirmed() || $locked->isDone()) {
                return $locked->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
            }

            if (! $locked->isToApprove()) {
                throw ValidationException::withMessages([
                    'status' => "Purchase Order {$locked->id} tidak sedang menunggu persetujuan Finance.",
                ]);
            }

            $locked->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'confirmed_by' => $actor->id,
                'approved_at' => now(),
                'approved_by' => $actor->id,
                'approval_notes' => $notes,
            ]);

            AuditLog::record(
                action: 'APPROVE_PURCHASE_ORDER',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id,
                documentType: 'purchase_order',
                documentId: $locked->id,
                notes: "Purchase Order {$locked->id} disetujui oleh {$actor->name} dan dikonfirmasi. Dokumen penerimaan gudang (Receipt) telah disiapkan."
                    . ($notes ? " Catatan: {$notes}" : ''),
                oldValue: ['status' => 'to_approve'],
                newValue: ['status' => 'confirmed']
            );

            $this->ensureReceiptCreated($locked->load(['lines', 'vendor']), $actor);

            return $locked->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        });
    }

    /**
     * Finance menolak PO bernilai besar: dikembalikan ke Draft (rfq) beserta alasannya,
     * sehingga Procurement dapat mengajukan ulang atau membatalkannya.
     */
    public function rejectOrder(PurchaseOrder $po, User $actor, string $reason): PurchaseOrder
    {
        $this->ensureApprover($actor);

        return DB::transaction(function () use ($po, $actor, $reason) {
            $locked = PurchaseOrder::whereKey($po->id)->lockForUpdate()->firstOrFail();

            if (! $locked->isToApprove()) {
                throw ValidationException::withMessages([
                    'status' => "Purchase Order {$locked->id} tidak sedang menunggu persetujuan Finance.",
                ]);
            }

            $locked->update([
                'status' => 'rfq',
                'rejected_at' => now(),
                'rejected_by' => $actor->id,
                'approval_notes' => $reason,
            ]);

            AuditLog::record(
                action: 'REJECT_PURCHASE_ORDER',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id,
                documentType: 'purchase_order',
                documentId: $locked->id,
                notes: "Pengajuan Purchase Order {$locked->id} ditolak oleh {$actor->name} dan dikembalikan ke Draft. Alasan: {$reason}",
                oldValue: ['status' => 'to_approve'],
                newValue: ['status' => 'rfq']
            );

            return $locked->fresh(['lines.product', 'vendor', 'receipts.lines', 'vendorBills']);
        });
    }

    protected function ensureApprover(User $actor): void
    {
        if (! in_array($actor->role_id, PurchaseOrder::APPROVER_ROLES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Hanya Finance atau Owner yang berwenang menyetujui / menolak Purchase Order.',
            ]);
        }
    }

    /**
     * Daftar PO yang menunggu persetujuan Finance (untuk dashboard Accounting).
     */
    public function getPendingApprovals(): array
    {
        return PurchaseOrder::with(['vendor', 'lines.product', 'approvalRequestedBy', 'creator'])
            ->where('status', 'to_approve')
            ->orderBy('approval_requested_at')
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'vendor_id' => $po->vendor_id,
                'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                'vendor_city' => $po->vendor?->city,
                'payment_terms' => $po->payment_terms,
                'subtotal_before_tax' => (float) $po->subtotal_before_tax,
                'total_tax' => (float) $po->total_tax,
                'grand_total' => (float) $po->grand_total,
                'notes' => $po->notes,
                'requested_by' => $po->approvalRequestedBy?->name ?? $po->creator?->name,
                'requested_at' => $po->approval_requested_at?->format('d/m/Y H:i'),
                'waiting_for' => $po->approval_requested_at?->diffForHumans(),
                'lines' => $po->lines->map(fn ($l) => [
                    'variant_sku' => $l->variant_sku,
                    'product_name' => $l->product?->name ?? $l->variant_sku,
                    'size' => $l->product?->size,
                    'color' => $l->product?->color,
                    'unit' => $l->product?->unit ?? 'pcs',
                    'qty_ordered' => (float) $l->qty_ordered,
                    'unit_price' => (float) $l->unit_price,
                    'line_total' => (float) $l->line_total,
                ])->values(),
            ])
            ->all();
    }

    /**
     * Query dasar PO yang ditolak Finance dan belum ditindaklanjuti (belum diajukan ulang / dibatalkan).
     */
    protected function unhandledRejectionsQuery()
    {
        return PurchaseOrder::where('status', 'rfq')->whereNotNull('rejected_at');
    }

    /**
     * Notifikasi modul Purchase untuk satu pengguna: PO yang ditolak Finance dan belum dibaca
     * oleh pengguna tersebut. Hilang setelah dibuka (dibaca), diajukan ulang, atau dibatalkan.
     */
    public function getRejectedNotifications(User $user, int $limit = 20): array
    {
        return $this->unhandledRejectionsQuery()
            ->with(['vendor', 'rejectedBy'])
            ->whereNotExists(function ($q) use ($user) {
                $q->select(DB::raw(1))
                    ->from('notification_reads')
                    ->where('notification_reads.user_id', $user->id)
                    ->where('notification_reads.type', NotificationRead::TYPE_PO_REJECTED)
                    ->whereColumn('notification_reads.document_id', 'purchase_orders.id')
                    ->whereColumn('notification_reads.event_at', 'purchase_orders.rejected_at');
            })
            ->orderByDesc('rejected_at')
            ->limit($limit)
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                'grand_total' => (float) $po->grand_total,
                'rejected_by' => $po->rejectedBy?->name ?? 'Finance',
                'rejected_at' => $po->rejected_at?->format('d/m/Y H:i'),
                'time_ago' => $po->rejected_at?->diffForHumans(),
                'reason' => $po->approval_notes,
            ])
            ->all();
    }

    /**
     * Tandai notifikasi penolakan sebuah PO sebagai sudah dibaca oleh pengguna (idempotent).
     */
    public function markRejectionRead(PurchaseOrder $po, User $user): void
    {
        if (! $po->isRfq() || ! $po->rejected_at) {
            return;
        }

        NotificationRead::firstOrCreate(
            [
                'user_id' => $user->id,
                'type' => NotificationRead::TYPE_PO_REJECTED,
                'document_id' => $po->id,
                'event_at' => $po->rejected_at,
            ],
            ['read_at' => now()]
        );
    }

    /**
     * Tandai semua notifikasi penolakan PO yang masih aktif sebagai sudah dibaca oleh pengguna.
     */
    public function markAllRejectionsRead(User $user): int
    {
        return DB::transaction(function () use ($user) {
            $count = 0;
            foreach ($this->unhandledRejectionsQuery()->get() as $po) {
                $read = NotificationRead::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => NotificationRead::TYPE_PO_REJECTED,
                        'document_id' => $po->id,
                        'event_at' => $po->rejected_at,
                    ],
                    ['read_at' => now()]
                );
                $count += $read->wasRecentlyCreated ? 1 : 0;
            }

            return $count;
        });
    }

    /**
     * Riwayat keputusan persetujuan PO (disetujui / ditolak) terbaru.
     */
    public function getApprovalHistory(int $limit = 30): array
    {
        return PurchaseOrder::with(['vendor', 'approvedBy', 'rejectedBy', 'approvalRequestedBy'])
            ->where(fn ($q) => $q->whereNotNull('approved_at')->orWhereNotNull('rejected_at'))
            ->get()
            ->map(function (PurchaseOrder $po) {
                // Keputusan terakhir: persetujuan jika approved_at ada (setelah persetujuan PO tidak bisa ditolak lagi)
                $approved = $po->approved_at !== null;
                $decidedAt = $approved ? $po->approved_at : $po->rejected_at;

                return [
                    'id' => $po->id,
                    'decision' => $approved ? 'approved' : 'rejected',
                    'status' => $po->status,
                    'vendor_name' => $po->vendor?->name ?? $po->vendor_id,
                    'grand_total' => (float) $po->grand_total,
                    'requested_by' => $po->approvalRequestedBy?->name,
                    'decided_by' => $approved ? $po->approvedBy?->name : $po->rejectedBy?->name,
                    'decided_at_ts' => $decidedAt?->timestamp,
                    'decided_at' => $decidedAt?->format('d/m/Y H:i'),
                    'notes' => $po->approval_notes,
                ];
            })
            ->sortByDesc('decided_at_ts')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * Konfirmasi langsung RFQ menjadi PO (tanpa / setelah lolos ambang persetujuan).
     */
    protected function performConfirmation(PurchaseOrder $po, User $actor, ?string $idempotencyKey = null): PurchaseOrder
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
     * Memastikan dokumen Receipt (WH-PKU/IN/000X) dibuat untuk PO yang sudah confirmed.
     */
    public function ensureReceiptCreated(PurchaseOrder $po, ?User $actor = null): Receipt
    {
        $existing = Receipt::where('purchase_order_id', $po->id)->first();
        if ($existing) {
            return $existing;
        }

        $rcpId = $this->generateReceiptId('WH-PKU');
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
                'billing' => "Pembuatan tagihan vendor ditolak: Belum ada barang yang diterima dan lolos QC untuk Purchase Order {$po->id}.",
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
        $toApproveCount = PurchaseOrder::where('status', 'to_approve')->count();

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
            'to_approve_count' => $toApproveCount,
            'waiting_receipts_count' => $waitingReceiptsCount,
            'waiting_bill_count' => $waitingBillCount,
        ];
    }

    /**
     * Data vendor untuk select options.
     */
    public function getVendorsForSelect(): array
    {
        return ContactVendor::orderBy('id')
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
        return Product::with('pricelists')
            ->orderBy('variant_sku')
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
                'vendor_prices' => $p->pricelists
                    ->pluck('unit_price', 'vendor_id')
                    ->map(fn ($price) => (float) $price)
                    ->toArray(),
                'vendor_ids' => array_values(array_unique(array_filter([
                    $p->default_vendor,
                    ...$p->pricelists->pluck('vendor_id')->all(),
                ]))),
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

