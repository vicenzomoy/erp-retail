<?php

namespace App\Services\Inventory;

use App\Models\AuditLog;
use App\Models\DeliveryOrder;
use App\Models\DeliveryOrderLine;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\SalesOrder;
use App\Models\SalesOrderLine;
use App\Models\StockLedger;
use App\Models\StockMove;
use App\Models\StockReservation;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeliveryOrderService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Generate the next Delivery Order ID (e.g. WH-PKU/OUT/0001).
     */
    public function generateDeliveryId(?string $locationCode = 'WH-PKU'): string
    {
        $prefix = sprintf('%s/OUT/', $locationCode ?: 'WH-PKU');
        $maxNum = 0;
        $dos = DB::table('delivery_orders')->pluck('id');

        foreach ($dos as $id) {
            if (preg_match('/(?:WH-PKU|WH)\/OUT\/(\d+)$/i', $id, $m)) {
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
     * Automatically generate a Delivery Order from a confirmed Sales Order.
     * Idempotent: returns existing Delivery Order if already generated.
     */
    public function createFromSalesOrder(SalesOrder $so, User $actor, ?string $locationFrom = 'WH-PKU'): DeliveryOrder
    {
        $existing = DeliveryOrder::where('sales_order_id', $so->id)
            ->where('is_backorder', false)
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($so, $actor, $locationFrom) {
            $doId = $this->generateDeliveryId($locationFrom);
            $so->loadMissing(['customer', 'lines.product']);

            $delivery = DeliveryOrder::create([
                'id'                 => $doId,
                'sales_order_id'     => $so->id,
                'parent_delivery_id' => null,
                'is_backorder'       => false,
                'status'             => 'ready',
                'location_from'      => $locationFrom,
                'location_to'        => $so->customer?->city 
                    ? "{$so->customer->name}, {$so->customer->city}" 
                    : ($so->customer?->name ?? 'Pelanggan'),
                'scheduled_date'     => now()->toDateString(),
                'notes'              => "Pengiriman otomatis untuk Sales Order {$so->id}",
                'created_by'         => $actor->id,
            ]);

            foreach ($so->lines as $line) {
                DeliveryOrderLine::create([
                    'delivery_order_id' => $delivery->id,
                    'so_line_id'        => $line->id,
                    'variant_sku'       => $line->variant_sku,
                    'qty_demand'        => $line->qty_ordered,
                    'qty_done'          => 0,
                    'cogs_per_unit'     => $line->product?->cost ?? 0,
                    'cogs_total'        => 0,
                ]);

                // Create stock reservation in location if not already present
                StockReservation::firstOrCreate(
                    [
                        'sales_order_id' => $so->id,
                        'so_line_id'     => $line->id,
                    ],
                    [
                        'variant_sku'   => $line->variant_sku,
                        'location_code' => $locationFrom,
                        'qty_reserved'  => $line->qty_ordered,
                        'status'        => 'active',
                        'reserved_at'   => now(),
                    ]
                );
            }

            AuditLog::record(
                action: 'DELIVERY_ORDER_AUTO_CREATED',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'system',
                documentType: 'delivery_order',
                documentId: $delivery->id,
                newValue: [
                    'sales_order_id' => $so->id,
                    'lines_count'    => $so->lines->count(),
                ],
                notes: "Delivery Order {$delivery->id} otomatis di-generate untuk Sales Order {$so->id}."
            );

            return $delivery;
        });
    }

    /**
     * Validate a Delivery Order (supports partial delivery & backorder creation).
     *
     * @param DeliveryOrder $do
     * @param array $linesData Array of ['id' => line_id, 'qty_done' => float]
     * @param User|null $actor
     * @param string|null $idempotencyKey
     * @return array ['delivery_order' => DeliveryOrder, 'backorder' => ?DeliveryOrder, 'journal_entry' => ?JournalEntry]
     * @throws ValidationException|Exception
     */
    public function validateDelivery(DeliveryOrder $do, array $linesData, ?User $actor = null, ?string $idempotencyKey = null): array
    {
        // 1. Idempotency Check: if already done, return safely without duplicate moves/journals (T-16, T-28)
        if ($do->isDone()) {
            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_DELIVERY_VALIDATE',
                status: 'DUPLICATE',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'system',
                actorRole: $actor?->role_id ?? 'system',
                documentType: 'delivery_order',
                documentId: $do->id,
                notes: 'Permintaan validasi ulang pada Delivery Order yang sudah berstatus Done diabaikan secara idempotent'
            );

            return [
                'delivery_order' => $do->fresh(['lines.product', 'salesOrder']),
                'backorder' => null,
                'journal_entry' => null,
                'already_done' => true,
            ];
        }

        return DB::transaction(function () use ($do, $linesData, $actor, $idempotencyKey) {
            $actorId = $actor?->id ?? User::first()->id;
            $locationFrom = $do->location_from;

            // Map lines data
            $linesMap = collect($linesData)->keyBy('id');
            $doLines = $do->lines()->get();

            $totalCogs = '0.00';
            $hasBackorder = false;
            $backorderLines = [];

            // 2. Stock validation & calculation
            foreach ($doLines as $line) {
                $requestedDone = isset($linesMap[$line->id])
                    ? (float) $linesMap[$line->id]['qty_done']
                    : (float) $line->qty_demand;

                if ($requestedDone < 0) {
                    throw ValidationException::withMessages([
                        'qty_done' => "Kuantitas terkirim untuk SKU {$line->variant_sku} tidak boleh negatif.",
                    ]);
                }

                if ($requestedDone > (float) $line->qty_demand) {
                    throw ValidationException::withMessages([
                        'qty_done' => "Kuantitas terkirim ({$requestedDone}) tidak boleh melebihi demand ({$line->qty_demand}).",
                    ]);
                }

                // Check on-hand stock in location_from
                $onHand = (float) $this->stockService->getOnHand($line->variant_sku, $locationFrom);
                if ($requestedDone > $onHand) {
                    throw ValidationException::withMessages([
                        'stock' => "Stok On Hand tidak mencukupi di {$locationFrom} untuk {$line->variant_sku}. Tersedia {$onHand}, diminta {$requestedDone}.",
                    ]);
                }

                $costPerUnit = (string) $line->product->cost;
                $lineCogs = bcmul((string) $requestedDone, $costPerUnit, 2);
                $totalCogs = bcadd($totalCogs, $lineCogs, 2);

                // Update line qty_done & cogs
                $line->update([
                    'qty_done' => $requestedDone,
                    'cogs_per_unit' => $costPerUnit,
                    'cogs_total' => $lineCogs,
                ]);

                // Update Sales Order Line qty_delivered
                if ($line->so_line_id) {
                    $soLine = SalesOrderLine::find($line->so_line_id);
                    if ($soLine) {
                        $newDelivered = bcadd((string) $soLine->qty_delivered, (string) $requestedDone, 3);
                        $soLine->update(['qty_delivered' => $newDelivered]);
                    }
                }

                // Check for backorder
                $remainingQty = bcsub((string) $line->qty_demand, (string) $requestedDone, 3);
                if (bccomp($remainingQty, '0.000', 3) > 0) {
                    $hasBackorder = true;
                    $backorderLines[] = [
                        'so_line_id' => $line->so_line_id,
                        'variant_sku' => $line->variant_sku,
                        'qty_demand' => $remainingQty,
                        'cogs_per_unit' => $costPerUnit,
                    ];
                }

                // 3. Stock Ledger (Pengurangan Stok Fisik)
                if ($requestedDone > 0) {
                    $newOnHandAfter = bcsub((string) $onHand, (string) $requestedDone, 3);
                    StockLedger::create([
                        'variant_sku' => $line->variant_sku,
                        'location_code' => $locationFrom,
                        'move_type' => 'out_delivery',
                        'qty_change' => -$requestedDone,
                        'qty_on_hand_after' => $newOnHandAfter,
                        'unit_cost' => $costPerUnit,
                        'total_value_change' => -$lineCogs,
                        'source_document_type' => 'delivery_order',
                        'source_document_id' => $do->id,
                        'moved_by' => $actorId,
                        'created_at' => now(),
                    ]);

                    // Release / deduct active reservations for this SO
                    if ($do->sales_order_id) {
                        $reservation = StockReservation::where('sales_order_id', $do->sales_order_id)
                            ->where('variant_sku', $line->variant_sku)
                            ->where('location_code', $locationFrom)
                            ->where('status', 'active')
                            ->first();

                        if ($reservation) {
                            $resQty = (string) $reservation->qty_reserved;
                            if (bccomp($resQty, (string) $requestedDone, 3) <= 0) {
                                $reservation->update([
                                    'status' => 'fulfilled',
                                    'released_at' => now(),
                                ]);
                            } else {
                                $reservation->update([
                                    'qty_reserved' => bcsub($resQty, (string) $requestedDone, 3),
                                ]);
                            }
                        }
                    }
                }
            }

            // 4. Create Journal Entry for COGS (SR-23): Debit 5000, Credit 1200
            $journalEntry = null;
            if (bccomp($totalCogs, '0.00', 2) > 0) {
                $jeCount = JournalEntry::count() + 1;
                $jeNo = sprintf('JE/COGS/%04d', $jeCount);

                $journalEntry = JournalEntry::create([
                    'entry_no' => $jeNo,
                    'entry_type' => 'cogs',
                    'source_document_type' => 'delivery_order',
                    'source_document_id' => $do->id,
                    'entry_date' => now()->toDateString(),
                    'description' => "Pengakuan HPP / COGS atas Pengiriman {$do->id} (SO {$do->sales_order_id})",
                    'status' => 'posted',
                    'is_balanced' => true,
                    'total_debit' => $totalCogs,
                    'total_credit' => $totalCogs,
                    'posted_at' => now(),
                    'posted_by' => $actorId,
                    'created_by' => $actorId,
                ]);

                // Debit: Beban Pokok Penjualan (5000)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code' => '5000',
                    'description' => "Beban Pokok Penjualan - {$do->id}",
                    'debit' => $totalCogs,
                    'credit' => 0,
                    'created_at' => now(),
                ]);

                // Credit: Persediaan (1200)
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_code' => '1200',
                    'description' => "Pengurangan Persediaan - {$do->id}",
                    'debit' => 0,
                    'credit' => $totalCogs,
                    'created_at' => now(),
                ]);
            }

            // 5. Stock Move Record
            foreach ($doLines as $line) {
                if ($line->qty_done > 0) {
                    StockMove::create([
                        'source_document_type' => 'delivery_order',
                        'source_document_id' => $do->id,
                        'variant_sku' => $line->variant_sku,
                        'location_from' => $locationFrom,
                        'location_to' => 'CUSTOMER',
                        'qty_done' => $line->qty_done,
                        'unit_cost' => $line->cogs_per_unit,
                        'total_value' => $line->cogs_total,
                        'journal_entry_id' => $journalEntry?->id,
                        'state' => 'done',
                        'done_at' => now(),
                        'done_by' => $actorId,
                    ]);
                }
            }

            // 6. Handle Backorder Creation if partial
            $backorder = null;
            if ($hasBackorder && count($backorderLines) > 0) {
                $boId = $this->generateDeliveryId($do->location_from);

                $backorder = DeliveryOrder::create([
                    'id' => $boId,
                    'sales_order_id' => $do->sales_order_id,
                    'parent_delivery_id' => $do->id,
                    'is_backorder' => true,
                    'status' => 'ready',
                    'location_from' => $do->location_from,
                    'location_to' => $do->location_to,
                    'scheduled_date' => now()->toDateString(),
                    'notes' => "Backorder turunan dari pengiriman parsial {$do->id}",
                    'created_by' => $actorId,
                ]);

                foreach ($backorderLines as $bl) {
                    DeliveryOrderLine::create([
                        'delivery_order_id' => $backorder->id,
                        'so_line_id' => $bl['so_line_id'],
                        'variant_sku' => $bl['variant_sku'],
                        'qty_demand' => $bl['qty_demand'],
                        'qty_done' => 0,
                        'cogs_per_unit' => $bl['cogs_per_unit'],
                        'cogs_total' => 0,
                    ]);
                }
            }

            // 7. Mark current DO as done
            $do->update([
                'status' => 'done',
                'validated_at' => now(),
                'validated_by' => $actorId,
                'idempotency_key' => $idempotencyKey ?? $do->idempotency_key ?? uniqid('do_val_'),
            ]);

            // 8. If this DO belongs to a Sales Order, check if all items are fully delivered -> update SO status to done
            if ($do->sales_order_id) {
                $so = SalesOrder::with('lines')->find($do->sales_order_id);
                if ($so && $so->status === 'confirmed') {
                    $allDelivered = true;
                    foreach ($so->lines as $sol) {
                        if (bccomp((string) $sol->qty_delivered, (string) $sol->qty_ordered, 3) < 0) {
                            $allDelivered = false;
                            break;
                        }
                    }
                    if ($allDelivered) {
                        $so->update(['status' => 'done']);
                        AuditLog::record(
                            action: 'SO_STATUS_DONE',
                            status: 'SUCCESS',
                            actorUserId: $actorId,
                            actorUsername: $actor?->name ?? 'warehouse',
                            actorRole: $actor?->role_id ?? 'warehouse',
                            documentType: 'sales_order',
                            documentId: $so->id,
                            notes: "Sales Order {$so->id} selesai dikirim seluruhnya (Status: Done)."
                        );
                    }
                }
            }

            // Audit Trail
            AuditLog::record(
                action: 'VALIDATE_DELIVERY',
                status: 'SUCCESS',
                actorUserId: $actorId,
                actorUsername: $actor?->name ?? 'warehouse.demo',
                actorRole: $actor?->role_id ?? 'warehouse',
                documentType: 'delivery_order',
                documentId: $do->id,
                notes: "Validasi pengiriman {$do->id} berhasil. COGS diakui Rp " . number_format((float) $totalCogs, 0, ',', '.') . ($backorder ? ". Backorder {$backorder->id} otomatis dibuat." : '')
            );

            return [
                'delivery_order' => $do->fresh(['lines.product', 'salesOrder']),
                'backorder' => $backorder ? $backorder->fresh(['lines.product']) : null,
                'journal_entry' => $journalEntry,
                'already_done' => false,
            ];
        });
    }
}

