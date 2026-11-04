<?php

namespace App\Services\Pos;

use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Master\Product;
use App\Models\PosOrder;
use App\Models\PosOrderLine;
use App\Models\PosSession;
use App\Models\StockLedger;
use App\Models\StockMove;
use App\Services\Inventory\StockService;
use Illuminate\Support\Facades\DB;

class PosService
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    // =========================================================================
    // SESSION MANAGEMENT
    // =========================================================================

    /**
     * Open a new POS session.
     * Business Rule: Only one active (open) session per cashier at a time.
     */
    public function openSession(int $cashierUserId, string $locationCode, float $openingCashFloat, string $idempotencyKey, ?string $actorUsername = null, string $actorRole = 'cashier'): PosSession
    {
        // Check idempotency – if same key already created a session, return it
        $existing = PosSession::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        // Check no open session for this cashier
        $openSession = PosSession::where('cashier_user_id', $cashierUserId)
            ->where('status', 'open')
            ->first();
        if ($openSession) {
            throw new \RuntimeException("Kasir sudah memiliki sesi POS yang aktif: {$openSession->id}. Tutup sesi tersebut terlebih dahulu.");
        }

        $username = $actorUsername ?? \App\Models\User::find($cashierUserId)?->name ?? 'system';

        return DB::transaction(function () use ($cashierUserId, $locationCode, $openingCashFloat, $idempotencyKey, $username, $actorRole) {
            $count = PosSession::count() + 1;
            $sessionId = sprintf('POS/%04d', $count);

            $session = PosSession::create([
                'id'                 => $sessionId,
                'cashier_user_id'    => $cashierUserId,
                'location_code'      => $locationCode,
                'status'             => 'open',
                'opening_cash_float' => $openingCashFloat,
                'total_sales'        => 0,
                'expected_cash'      => $openingCashFloat,
                'counted_cash'       => null,
                'cash_variance'      => null,
                'opened_at'          => now(),
                'idempotency_key'    => $idempotencyKey,
            ]);

            AuditLog::record(
                action: 'OPEN_POS_SESSION',
                status: 'SUCCESS',
                actorUserId: $cashierUserId,
                actorUsername: $username,
                actorRole: $actorRole,
                documentType: 'pos_session',
                documentId: $session->id,
                notes: "Sesi POS {$session->id} dibuka dengan kas awal Rp " . number_format($openingCashFloat, 0, ',', '.')
            );

            return $session;
        });
    }

    /**
     * Close a POS session.
     * Idempotent: second close does nothing extra.
     */
    public function closeSession(PosSession $session, float $countedCash, int $actorUserId, string $actorName, string $actorRole): array
    {
        // Idempotency guard – already closed
        if ($session->isClosed()) {
            AuditLog::record(
                action: 'CLOSE_POS_SESSION',
                status: 'DUPLICATE_ATTEMPT',
                actorUserId: $actorUserId,
                actorUsername: $actorName,
                actorRole: $actorRole,
                documentType: 'pos_session',
                documentId: $session->id,
                notes: "Percobaan penutupan ulang sesi {$session->id} yang sudah ditutup. Idempotent – diabaikan."
            );

            return ['already_closed' => true, 'session' => $session];
        }

        return DB::transaction(function () use ($session, $countedCash, $actorUserId, $actorName, $actorRole) {
            // Calculate totals
            $totalSales = (float) $session->orders()
                ->where('status', 'paid')
                ->sum('grand_total');

            $expectedCash = (float) $session->opening_cash_float + $totalSales;
            $cashVariance = $countedCash - $expectedCash;

            // Create closing journal entry: Dr Kas / Cr Penjualan POS (summary)
            $journalEntry = $this->createSessionClosingJournal($session, $totalSales, $actorUserId, $actorName);

            // Update session
            $session->update([
                'status'                   => 'closed',
                'total_sales'              => $totalSales,
                'expected_cash'            => $expectedCash,
                'counted_cash'             => $countedCash,
                'cash_variance'            => $cashVariance,
                'closed_at'                => now(),
                'closing_journal_entry_id' => $journalEntry?->id,
            ]);

            AuditLog::record(
                action: 'CLOSE_POS_SESSION',
                status: 'SUCCESS',
                actorUserId: $actorUserId,
                actorUsername: $actorName,
                actorRole: $actorRole,
                documentType: 'pos_session',
                documentId: $session->id,
                notes: "Sesi {$session->id} ditutup. Total Penjualan: Rp " . number_format($totalSales, 0, ',', '.') .
                       " | Expected Cash: Rp " . number_format($expectedCash, 0, ',', '.') .
                       " | Counted: Rp " . number_format($countedCash, 0, ',', '.') .
                       " | Selisih: Rp " . number_format($cashVariance, 0, ',', '.')
            );

            return ['already_closed' => false, 'session' => $session->fresh()];
        });
    }

    // =========================================================================
    // ORDER CHECKOUT
    // =========================================================================

    /**
     * Process a POS checkout order.
     * Business Rules:
     *   - Stock must come from the session's store location (TOKO-PKU)
     *   - Stock cannot go negative
     *   - COGS recognized immediately
     *   - Journal Entry created: Dr Kas / Cr Revenue+VAT / Dr COGS / Cr Inventory
     */
    public function checkout(PosSession $session, array $lines, ?string $customerId, float $cashTendered, string $paymentMethod, string $idempotencyKey, int $actorUserId, string $actorName, string $actorRole): PosOrder
    {
        // Idempotency guard
        $existing = PosOrder::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        if (!$session->isOpen()) {
            throw new \RuntimeException('Sesi POS tidak aktif. Pastikan sesi sudah dibuka sebelum melakukan transaksi.');
        }

        $locationCode = $session->location_code;
        $taxRate = DB::table('tax_rates')->where('tax_id', 'VAT-NONLUX')->first();

        // ---- Pre-validate stock for all lines ----
        foreach ($lines as $line) {
            $sku = $line['variant_sku'];
            $qty = (float) $line['qty'];
            $available = (float) $this->stockService->getAvailable($sku, $locationCode);

            if ($available < $qty) {
                $product = Product::find($sku);
                $productName = $product ? "{$product->name} ({$sku})" : $sku;
                throw new \RuntimeException(
                    "Stok tidak mencukupi untuk {$productName} di lokasi {$locationCode}. " .
                    "Stok tersedia: {$available} pcs, diminta: {$qty} pcs."
                );
            }
        }

        return DB::transaction(function () use ($session, $lines, $customerId, $cashTendered, $paymentMethod, $idempotencyKey, $actorUserId, $actorName, $actorRole, $locationCode, $taxRate) {

            $subtotalBeforeTax = 0;
            $totalTax          = 0;
            $grandTotal        = 0;
            $totalCogs         = 0;

            // Calculate totals
            $orderLineData = [];
            foreach ($lines as $line) {
                $sku      = $line['variant_sku'];
                $qty      = (float) $line['qty'];
                $product  = Product::findOrFail($sku);

                $unitPrice   = (float) ($line['unit_price'] ?? $product->sales_price);
                $lineSubtotal = $qty * $unitPrice;

                // VAT per line, rounded to nearest rupiah
                $lineTax = (int) round($lineSubtotal * 0.11); // effective 11%
                $lineTotal = $lineSubtotal + $lineTax;

                $cogsPerUnit  = (float) $product->cost;
                $cogsTotal    = $qty * $cogsPerUnit;

                $subtotalBeforeTax += $lineSubtotal;
                $totalTax          += $lineTax;
                $grandTotal        += $lineTotal;
                $totalCogs         += $cogsTotal;

                $orderLineData[] = [
                    'variant_sku'         => $sku,
                    'qty'                 => $qty,
                    'unit_price'          => $unitPrice,
                    'tax_id'              => 'VAT-NONLUX',
                    'subtotal_before_tax' => $lineSubtotal,
                    'tax_amount'          => $lineTax,
                    'line_total'          => $lineTotal,
                    'cogs_per_unit'       => $cogsPerUnit,
                    'cogs_total'          => $cogsTotal,
                ];
            }

            $changeGiven = max(0, $cashTendered - $grandTotal);

            // Generate order ID
            $orderCount = PosOrder::count() + 1;
            $orderId    = sprintf('POS-ORD-%04d', $orderCount);

            // Create POS Order
            $order = PosOrder::create([
                'id'                  => $orderId,
                'pos_session_id'      => $session->id,
                'cashier_user_id'     => $actorUserId,
                'customer_id'         => $customerId,
                'status'              => 'paid',
                'payment_method'      => $paymentMethod,
                'subtotal_before_tax' => $subtotalBeforeTax,
                'total_tax'           => $totalTax,
                'grand_total'         => $grandTotal,
                'cash_tendered'       => $cashTendered,
                'change_given'        => $changeGiven,
                'paid_at'             => now(),
                'idempotency_key'     => $idempotencyKey,
            ]);

            // Create Journal Entry for this order first
            $journalEntry = $this->createOrderJournal($order, $grandTotal, $subtotalBeforeTax, $totalTax, $totalCogs, $actorUserId, $actorName);
            $order->update(['journal_entry_id' => $journalEntry->id]);

            // Create Order Lines + deduct stock + create stock moves
            foreach ($orderLineData as $ld) {
                PosOrderLine::create(array_merge($ld, ['pos_order_id' => $order->id]));

                // Deduct stock from store location
                $this->deductStock($ld['variant_sku'], $ld['qty'], $ld['cogs_per_unit'], $locationCode, $order->id, $actorUserId, $journalEntry->id);
            }

            // Update session totals
            $session->increment('total_sales', $grandTotal);
            $newExpected = (float) $session->opening_cash_float + (float) $session->total_sales;
            $session->update(['expected_cash' => $newExpected]);

            AuditLog::record(
                action: 'POS_CHECKOUT',
                status: 'SUCCESS',
                actorUserId: $actorUserId,
                actorUsername: $actorName,
                actorRole: $actorRole,
                documentType: 'pos_order',
                documentId: $order->id,
                notes: "Transaksi POS {$order->id} berhasil. Total: Rp " . number_format($grandTotal, 0, ',', '.') .
                       " | Tunai: Rp " . number_format($cashTendered, 0, ',', '.') .
                       " | Kembalian: Rp " . number_format($changeGiven, 0, ',', '.')
            );

            return $order;
        });
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Deduct stock from store location via StockLedger + StockMove.
     */
    private function deductStock(string $sku, float $qty, float $cogsPerUnit, string $locationCode, string $orderId, int $actorUserId, ?int $journalEntryId = null): void
    {
        $totalValue = $qty * $cogsPerUnit;
        $onHand = (float) $this->stockService->getOnHand($sku, $locationCode);
        $newOnHandAfter = bcsub((string) $onHand, (string) $qty, 3);

        // StockLedger: negative qty_change = outbound
        StockLedger::create([
            'variant_sku'          => $sku,
            'location_code'        => $locationCode,
            'move_type'            => 'out_pos',
            'source_document_type' => 'pos_order',
            'source_document_id'   => $orderId,
            'qty_change'           => -$qty,
            'qty_on_hand_after'    => $newOnHandAfter,
            'unit_cost'            => $cogsPerUnit,
            'total_value_change'   => -$totalValue,
            'journal_entry_id'     => $journalEntryId,
            'moved_by'             => $actorUserId,
            'created_at'           => now(),
        ]);

        // StockMove record for audit trail
        StockMove::create([
            'variant_sku'          => $sku,
            'source_document_type' => 'pos_order',
            'source_document_id'   => $orderId,
            'location_from'        => $locationCode,
            'location_to'          => 'CUSTOMER',
            'qty_done'             => $qty,
            'unit_cost'            => $cogsPerUnit,
            'total_value'          => $totalValue,
            'journal_entry_id'     => $journalEntryId,
            'state'                => 'done',
            'done_at'              => now(),
            'done_by'              => $actorUserId,
            'created_at'           => now(),
        ]);
    }

    /**
     * Create the sales journal entry for a single POS order.
     * Debit: Kas (1010) = grand_total
     * Credit: Penjualan POS (4010) = subtotal_before_tax
     * Credit: PPN Keluaran (2200) = total_tax
     * Debit: HPP (5000) = total_cogs
     * Credit: Persediaan (1200) = total_cogs
     */
    private function createOrderJournal(PosOrder $order, float $grandTotal, float $subtotal, float $tax, float $cogs, int $actorUserId, string $actorName): JournalEntry
    {
        $count = JournalEntry::count() + 1;
        $entryNo = sprintf('JNL/POS/%04d', $count);

        $entry = JournalEntry::create([
            'entry_no'             => $entryNo,
            'entry_type'           => 'pos_sale',
            'source_document_type' => 'pos_order',
            'source_document_id'   => $order->id,
            'entry_date'           => now()->toDateString(),
            'description'          => "POS Sale — {$order->id}",
            'status'               => 'posted',
            'is_balanced'          => true,
            'total_debit'          => $grandTotal + $cogs,
            'total_credit'         => $grandTotal + $cogs,
            'posted_at'            => now(),
            'posted_by'            => $actorUserId,
            'created_by'           => $actorUserId,
        ]);

        // Dr Kas
        JournalLine::create([
            'journal_entry_id'     => $entry->id,
            'account_code'         => '1010',
            'description'          => "Penerimaan Kas — {$order->id}",
            'debit'                => $grandTotal,
            'credit'               => 0,
        ]);

        // Cr Penjualan POS
        JournalLine::create([
            'journal_entry_id'     => $entry->id,
            'account_code'         => '4010',
            'description'          => "Penjualan POS — {$order->id}",
            'debit'                => 0,
            'credit'               => $subtotal,
        ]);

        // Cr PPN Keluaran
        JournalLine::create([
            'journal_entry_id'     => $entry->id,
            'account_code'         => '2200',
            'description'          => "PPN Keluaran — {$order->id}",
            'debit'                => 0,
            'credit'               => $tax,
        ]);

        // Dr HPP (COGS)
        JournalLine::create([
            'journal_entry_id'     => $entry->id,
            'account_code'         => '5000',
            'description'          => "HPP POS — {$order->id}",
            'debit'                => $cogs,
            'credit'               => 0,
        ]);

        // Cr Persediaan
        JournalLine::create([
            'journal_entry_id'     => $entry->id,
            'account_code'         => '1200',
            'description'          => "Keluar Persediaan — {$order->id}",
            'debit'                => 0,
            'credit'               => $cogs,
        ]);

        return $entry;
    }

    /**
     * Create session closing summary journal entry (optional/summary level).
     */
    private function createSessionClosingJournal(PosSession $session, float $totalSales, int $actorUserId, string $actorName): ?JournalEntry
    {
        if ($totalSales <= 0) {
            return null;
        }

        $count = JournalEntry::count() + 1;
        $entryNo = sprintf('JNL/POS-CLOSE/%04d', $count);

        $entry = JournalEntry::create([
            'entry_no'             => $entryNo,
            'entry_type'           => 'pos_close',
            'source_document_type' => 'pos_session',
            'source_document_id'   => $session->id,
            'entry_date'           => now()->toDateString(),
            'description'          => "Penutupan Sesi POS — {$session->id}",
            'status'               => 'posted',
            'is_balanced'          => true,
            'total_debit'          => $totalSales,
            'total_credit'         => $totalSales,
            'posted_at'            => now(),
            'posted_by'            => $actorUserId,
            'created_by'           => $actorUserId,
        ]);

        // This is a memo/summary entry — actual postings were done per-order
        JournalLine::create([
            'journal_entry_id' => $entry->id,
            'account_code'     => '1010',
            'description'      => "Ringkasan Kas POS Sesi {$session->id}",
            'debit'            => $totalSales,
            'credit'           => 0,
        ]);

        JournalLine::create([
            'journal_entry_id' => $entry->id,
            'account_code'     => '4010',
            'description'      => "Ringkasan Penjualan POS Sesi {$session->id}",
            'debit'            => 0,
            'credit'           => $totalSales,
        ]);

        return $entry;
    }

    // =========================================================================
    // REPORTING
    // =========================================================================

    /**
     * Get daily summary for a specific date and location.
     */
    public function getDailySummary(string $date, string $locationCode): array
    {
        $sessions = PosSession::where('location_code', $locationCode)
            ->whereDate('opened_at', $date)
            ->with(['orders' => function ($q) {
                $q->where('status', 'paid')->with('lines.product');
            }, 'cashier'])
            ->get();

        $totalOrders   = 0;
        $totalRevenue  = 0;
        $totalTax      = 0;
        $totalCogs     = 0;
        $totalCash     = 0;
        $openingFloats = 0;
        $allOrders     = collect();

        foreach ($sessions as $session) {
            $openingFloats += (float) $session->opening_cash_float;
            foreach ($session->orders as $order) {
                $totalOrders++;
                $totalRevenue += (float) $order->grand_total;
                $totalTax     += (float) $order->total_tax;
                $totalCash    += (float) $order->cash_tendered;
                $allOrders->push($order);

                foreach ($order->lines as $line) {
                    $totalCogs += (float) $line->cogs_total;
                }
            }
        }

        $expectedCashInDrawer = $openingFloats + $totalRevenue;

        return [
            'date'                    => $date,
            'location_code'           => $locationCode,
            'sessions_count'          => $sessions->count(),
            'total_orders'            => $totalOrders,
            'total_revenue'           => $totalRevenue,
            'total_tax'               => $totalTax,
            'total_cogs'              => $totalCogs,
            'gross_profit'            => $totalRevenue - $totalTax - $totalCogs,
            'opening_floats'          => $openingFloats,
            'expected_cash_in_drawer' => $expectedCashInDrawer,
            'sessions'                => $sessions,
            'orders'                  => $allOrders->sortByDesc('paid_at')->values(),
        ];
    }
}
