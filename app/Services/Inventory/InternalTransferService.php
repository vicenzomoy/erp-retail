<?php

namespace App\Services\Inventory;

use App\Models\AuditLog;
use App\Models\InternalTransfer;
use App\Models\InternalTransferLine;
use App\Models\StockLedger;
use App\Models\StockMove;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InternalTransferService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Create a new Internal Transfer header and lines.
     */
    public function createTransfer(
        string $locationFrom,
        string $locationTo,
        array $items,
        ?User $actor = null,
        ?string $scheduledDate = null,
        ?string $notes = null
    ): InternalTransfer {
        return DB::transaction(function () use ($locationFrom, $locationTo, $items, $actor, $scheduledDate, $notes) {
            $actorId = $actor?->id ?? User::first()->id;
            $intCount = InternalTransfer::count() + 1;
            $intId = sprintf('WH/INT/%04d', $intCount);

            $transfer = InternalTransfer::create([
                'id' => $intId,
                'location_from' => $locationFrom,
                'location_to' => $locationTo,
                'scheduled_date' => $scheduledDate ?? now()->toDateString(),
                'notes' => $notes,
                'status' => 'ready',
                'created_by' => $actorId,
            ]);

            foreach ($items as $item) {
                $sku = $item['variant_sku'];
                $demand = (float) $item['qty_demand'];
                $prod = \App\Models\Master\Product::find($sku);
                $cost = $prod?->cost ?? 0;

                InternalTransferLine::create([
                    'internal_transfer_id' => $transfer->id,
                    'variant_sku' => $sku,
                    'qty_demand' => $demand,
                    'qty_done' => $item['qty_done'] ?? $demand,
                    'unit_cost' => $cost,
                ]);
            }

            return $transfer;
        });
    }

    /**
     * Validate an Internal Transfer between locations (F-20, SR-16).
     *
     * @param InternalTransfer $transfer
     * @param array $linesData Array of ['id' => line_id, 'qty_done' => float]
     * @param User|null $actor
     * @param string|null $idempotencyKey
     * @return array
     * @throws ValidationException|Exception
     */
    public function validateTransfer(InternalTransfer $transfer, array $linesData, ?User $actor = null, ?string $idempotencyKey = null): array
    {
        // 1. Idempotency Check: if already done, return safely
        if ($transfer->isDone()) {
            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_TRANSFER_VALIDATE',
                status: 'DUPLICATE',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'system',
                actorRole: $actor?->role_id ?? 'system',
                documentType: 'internal_transfer',
                documentId: $transfer->id,
                notes: 'Permintaan validasi ulang pada Internal Transfer yang sudah berstatus Done diabaikan secara idempotent'
            );

            return [
                'transfer' => $transfer->fresh(['lines.product', 'fromLocation', 'toLocation']),
                'already_done' => true,
            ];
        }

        return DB::transaction(function () use ($transfer, $linesData, $actor, $idempotencyKey) {
            $actorId = $actor?->id ?? User::first()->id;
            $fromLoc = $transfer->location_from;
            $toLoc = $transfer->location_to;

            if ($fromLoc === $toLoc) {
                throw ValidationException::withMessages([
                    'location' => 'Lokasi asal dan lokasi tujuan tidak boleh sama.',
                ]);
            }

            $linesMap = collect($linesData)->keyBy('id');
            $transferLines = $transfer->lines()->get();

            // 2. Validate Available Stock at location_from (SR-16 / T-36)
            foreach ($transferLines as $line) {
                $requestedDone = isset($linesMap[$line->id])
                    ? (float) $linesMap[$line->id]['qty_done']
                    : (float) $line->qty_demand;

                if ($requestedDone <= 0) {
                    throw ValidationException::withMessages([
                        'quantity' => "Kuantitas transfer untuk {$line->variant_sku} harus lebih dari 0.",
                    ]);
                }

                // Check Available (OnHand - Reserved) at location_from
                $available = (float) $this->stockService->getAvailable($line->variant_sku, $fromLoc);

                // T-36 check: if requested > available
                if ($requestedDone > $available) {
                    AuditLog::record(
                        action: 'BLOCKED_TRANSFER_INSUFFICIENT_STOCK',
                        status: 'REJECTED',
                        actorUserId: $actorId,
                        actorUsername: $actor?->name ?? 'warehouse.demo',
                        actorRole: $actor?->role_id ?? 'warehouse',
                        documentType: 'internal_transfer',
                        documentId: $transfer->id,
                        notes: "Transfer {$transfer->id} diblokir: Kuantitas ({$requestedDone}) melebihi stok Available ({$available}) di lokasi {$fromLoc} untuk {$line->variant_sku} (Aturan SR-16)"
                    );

                    throw ValidationException::withMessages([
                        'stock' => "Kuantitas transfer ({$requestedDone} pcs) melebihi stok Available ({$available} pcs) di lokasi asal {$fromLoc} untuk produk {$line->variant_sku}. Transaksi diblokir (SR-16).",
                    ]);
                }

                $cost = (string) $line->product->cost;
                $value = bcmul((string) $requestedDone, $cost, 2);

                $line->update([
                    'qty_done' => $requestedDone,
                    'unit_cost' => $cost,
                ]);

                // 3. Mutasi Stok: 2 baris ledger
                // A. Keluar dari location_from
                $currentFromOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $fromLoc);
                $newFromOnHand = bcsub((string) $currentFromOnHand, (string) $requestedDone, 3);

                StockLedger::create([
                    'variant_sku' => $line->variant_sku,
                    'location_code' => $fromLoc,
                    'move_type' => 'transfer_out',
                    'qty_change' => -$requestedDone,
                    'qty_on_hand_after' => $newFromOnHand,
                    'unit_cost' => $cost,
                    'total_value_change' => -$value,
                    'source_document_type' => 'internal_transfer',
                    'source_document_id' => $transfer->id,
                    'moved_by' => $actorId,
                    'created_at' => now(),
                ]);

                // B. Masuk ke location_to
                $currentToOnHand = (float) $this->stockService->getOnHand($line->variant_sku, $toLoc);
                $newToOnHand = bcadd((string) $currentToOnHand, (string) $requestedDone, 3);

                StockLedger::create([
                    'variant_sku' => $line->variant_sku,
                    'location_code' => $toLoc,
                    'move_type' => 'transfer_in',
                    'qty_change' => $requestedDone,
                    'qty_on_hand_after' => $newToOnHand,
                    'unit_cost' => $cost,
                    'total_value_change' => $value,
                    'source_document_type' => 'internal_transfer',
                    'source_document_id' => $transfer->id,
                    'moved_by' => $actorId,
                    'created_at' => now(),
                ]);

                // 4. Stock Move Record
                StockMove::create([
                    'source_document_type' => 'internal_transfer',
                    'source_document_id' => $transfer->id,
                    'variant_sku' => $line->variant_sku,
                    'location_from' => $fromLoc,
                    'location_to' => $toLoc,
                    'qty_done' => $requestedDone,
                    'unit_cost' => $cost,
                    'total_value' => $value,
                    'state' => 'done',
                    'done_at' => now(),
                    'done_by' => $actorId,
                ]);
            }

            // 5. Update transfer status to done
            $transfer->update([
                'status' => 'done',
                'validated_at' => now(),
                'validated_by' => $actorId,
                'idempotency_key' => $idempotencyKey ?? $transfer->idempotency_key ?? uniqid('it_val_'),
            ]);

            // Audit Trail
            AuditLog::record(
                action: 'VALIDATE_INTERNAL_TRANSFER',
                status: 'SUCCESS',
                actorUserId: $actorId,
                actorUsername: $actor?->name ?? 'warehouse.demo',
                actorRole: $actor?->role_id ?? 'warehouse',
                documentType: 'internal_transfer',
                documentId: $transfer->id,
                notes: "Transfer internal {$transfer->id} dari {$fromLoc} ke {$toLoc} berhasil diselesaikan. Total nilai persediaan perusahaan tetap utuh."
            );

            return [
                'transfer' => $transfer->fresh(['lines.product', 'fromLocation', 'toLocation']),
                'already_done' => false,
            ];
        });
    }
}

