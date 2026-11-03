<?php

namespace App\Services\Inventory;

use App\Models\AuditLog;
use App\Models\StockReservation;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockReservationService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Reserve stock for a Sales Order at a specific location (F-08, SR-09 / T-13, T-14).
     *
     * @param string $salesOrderId
     * @param int $soLineId
     * @param string $sku
     * @param string $locationCode
     * @param float|string $qty
     * @param User|null $actor
     * @return StockReservation
     * @throws ValidationException
     */
    public function reserveStock(
        string $salesOrderId,
        int $soLineId,
        string $sku,
        string $locationCode,
        float|string $qty,
        ?User $actor = null
    ): StockReservation {
        $actorId = $actor?->id ?? User::first()->id;
        $qtyFloat = (float) $qty;

        if ($qtyFloat <= 0) {
            throw ValidationException::withMessages([
                'qty_reserved' => 'Kuantitas reservasi harus lebih dari 0.',
            ]);
        }

        // Check available at the target location (ATP rule SR-09 / T-14)
        $available = (float) $this->stockService->getAvailable($sku, $locationCode);

        // T-14 Edge case: if requested > available
        if ($qtyFloat > $available) {
            AuditLog::record(
                action: 'REJECTED_ATP_INSUFFICIENT_STOCK',
                status: 'REJECTED',
                actorUserId: $actorId,
                actorUsername: $actor?->name ?? 'sales.demo',
                actorRole: $actor?->role_id ?? 'sales',
                documentType: 'sales_order',
                documentId: $salesOrderId,
                notes: "Reservasi ditolak oleh aturan ATP: Diminta {$qtyFloat} unit {$sku} di {$locationCode}, namun stok Available hanya {$available} unit (Aturan SR-09)"
            );

            throw ValidationException::withMessages([
                'stock' => "Aturan ATP menolak reservasi: Stok Available untuk produk {$sku} di lokasi {$locationCode} hanya {$available} unit (diminta {$qtyFloat} unit). (SR-09).",
            ]);
        }

        return DB::transaction(function () use ($salesOrderId, $soLineId, $sku, $locationCode, $qtyFloat, $actorId, $actor) {
            // Check if active reservation already exists for this line
            $existing = StockReservation::where('sales_order_id', $salesOrderId)
                ->where('so_line_id', $soLineId)
                ->where('location_code', $locationCode)
                ->where('status', 'active')
                ->first();

            if ($existing) {
                $newQty = bcadd((string) $existing->qty_reserved, (string) $qtyFloat, 3);
                $existing->update([
                    'qty_reserved' => $newQty,
                    'reserved_at' => now(),
                ]);
                $reservation = $existing;
            } else {
                $reservation = StockReservation::create([
                    'sales_order_id' => $salesOrderId,
                    'so_line_id' => $soLineId,
                    'variant_sku' => $sku,
                    'location_code' => $locationCode,
                    'qty_reserved' => $qtyFloat,
                    'status' => 'active',
                    'reserved_at' => now(),
                ]);
            }

            // Audit Trail
            AuditLog::record(
                action: 'STOCK_RESERVED',
                status: 'SUCCESS',
                actorUserId: $actorId,
                actorUsername: $actor?->name ?? 'sales.demo',
                actorRole: $actor?->role_id ?? 'sales',
                documentType: 'sales_order',
                documentId: $salesOrderId,
                notes: "Reservasi {$qtyFloat} unit {$sku} di {$locationCode} berhasil dibuat untuk SO {$salesOrderId}."
            );

            return $reservation;
        });
    }

    /**
     * Release or cancel an active reservation.
     */
    public function releaseReservation(int $reservationId, ?User $actor = null): void
    {
        $res = StockReservation::findOrFail($reservationId);
        if ($res->status === 'active') {
            $res->update([
                'status' => 'cancelled',
                'released_at' => now(),
            ]);

            AuditLog::record(
                action: 'STOCK_RESERVATION_RELEASED',
                status: 'SUCCESS',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'system',
                actorRole: $actor?->role_id ?? 'system',
                documentType: 'sales_order',
                documentId: $res->sales_order_id,
                notes: "Reservasi {$res->qty_reserved} unit {$res->variant_sku} di {$res->location_code} dibatalkan / dilepas."
            );
        }
    }
}

