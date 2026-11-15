<?php

namespace Database\Seeders;

use App\Services\Analytics\SeasonCalendar;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Data penjualan historis 12 bulan SEBELUM go-live ERP (acak namun masuk akal).
 *
 * Ditulis sebagai dokumen asli agar muncul di riwayat Sales & POS:
 *   - Penjualan gerai  → pos_sessions + pos_orders + pos_order_lines (TOKO-PKU)
 *   - Penjualan grosir → sales_orders + sales_order_lines (status done)
 * Semua ditandai is_legacy = true dan TIDAK membuat stock ledger, jurnal,
 * pengiriman, maupun faktur — saldo stok & akuntansi dimulai dari saldo awal
 * go-live, sehingga tidak bentrok dengan data yang sudah ada.
 *
 * Periode: 12 bulan s.d. H-1 go-live (go-live = tanggal saldo awal stok).
 * Idempoten: data historis lama dihapus dulu sebelum diisi ulang.
 *
 * Pola yang disimulasikan: musim (Lebaran, Akhir Tahun, Tahun Ajaran Baru,
 * Hujan, Kemarau), akhir pekan & tanggal gajian lebih ramai, tren naik
 * (Jeans Hitam) / turun (Topi), serta produk yang memang kurang laku.
 */
class LegacySalesSeeder extends Seeder
{
    private const TAX_RATE = 0.11; // efektif 11% (12% x 11/12), dibulatkan per baris
    private const STORE = 'TOKO-PKU';
    private const OPENING_FLOAT = 500000;

    /** Rata-rata pcs terjual per hari di gerai (kondisi normal). */
    private const BASE_DAILY = [
        'TSP-M-BLK' => 1.30, 'TSP-L-BLK' => 1.10, 'TSP-M-WHT' => 0.90, 'TSP-L-WHT' => 0.55,
        'JKT-M-BLK' => 0.45, 'JKT-L-BLK' => 0.35, 'JKT-M-CRM' => 0.18, 'JKT-L-CRM' => 0.07,
        'JNS-30-BLU' => 0.50, 'JNS-32-BLU' => 0.55, 'JNS-30-BLK' => 0.42, 'JNS-32-BLK' => 0.55,
        'CAP-OS-BLK' => 0.55, 'BAG-OS-CRM' => 0.22, 'BAG-OS-BLK' => 0.40,
    ];

    /** Pengali musim per model (prefix SKU). */
    private const SEASON_MULT = [
        'lebaran' => ['TSP' => 2.4, 'JNS' => 2.6, 'JKT' => 1.3, 'CAP' => 1.8, 'BAG' => 2.0],
        'akhir_tahun' => ['TSP' => 1.4, 'JNS' => 1.5, 'JKT' => 1.7, 'CAP' => 1.3, 'BAG' => 1.5],
        'ajaran_baru' => ['TSP' => 1.2, 'JNS' => 1.4, 'JKT' => 1.0, 'CAP' => 1.1, 'BAG' => 2.3],
        'hujan' => ['TSP' => 0.85, 'JNS' => 1.0, 'JKT' => 1.8, 'CAP' => 0.7, 'BAG' => 0.9],
        'kemarau' => ['TSP' => 1.15, 'JNS' => 1.0, 'JKT' => 0.4, 'CAP' => 1.3, 'BAG' => 1.0],
    ];

    /** Tren sepanjang tahun: [pengali awal, pengali akhir]. */
    private const TREND = [
        'JNS-30-BLK' => [0.70, 1.35],
        'JNS-32-BLK' => [0.70, 1.40],
        'CAP-OS-BLK' => [1.35, 0.65],
    ];

    private const B2B_CUSTOMERS = ['C001', 'C002', 'C005'];
    private const MEMBER_CUSTOMERS = ['C003', 'C004', 'C006'];

    private array $sessions = [];
    private array $posOrders = [];
    private array $posLines = [];
    private array $salesOrders = [];
    private array $soLines = [];
    private array $invoices = [];
    private array $invoiceLines = [];
    private array $payments = [];
    private array $paymentAllocations = [];

    public function run(): void
    {
        mt_srand(20261113);

        $products = DB::table('products')->get()->keyBy('variant_sku');
        $customers = DB::table('contacts_customers')->get()->keyBy('id');
        $cashierId = $this->userIdForRole('cashier');
        $salesId = $this->userIdForRole('sales');

        $goLive = DB::table('stock_ledger')->min('created_at');
        $end = ($goLive ? Carbon::parse($goLive) : Carbon::today())->startOfDay()->subDay();
        $start = $end->copy()->subYear()->addDay();
        $totalDays = max(1, $start->diffInDays($end));

        for ($day = $start->copy(), $i = 0; $day->lte($end); $day->addDay(), $i++) {
            $season = SeasonCalendar::seasonFor($day);
            $this->generateStoreDay($day, $season, $i / $totalDays, $products, $cashierId);
            $this->maybeGenerateWholesale($day, $season, $products, $customers, $salesId);
        }

        DB::transaction(function () {
            // Bersihkan data historis lama (baris anak ikut terhapus via cascade)
            DB::table('payments')->where('id', 'like', 'LPAY/%')->delete();
            DB::table('customer_invoices')->where('id', 'like', 'LINV/%')->delete();
            DB::table('pos_orders')->where('is_legacy', true)->delete();
            DB::table('pos_sessions')->where('is_legacy', true)->delete();
            DB::table('sales_orders')->where('is_legacy', true)->delete();

            foreach ([
                'pos_sessions' => $this->sessions,
                'pos_orders' => $this->posOrders,
                'pos_order_lines' => $this->posLines,
                'sales_orders' => $this->salesOrders,
                'sales_order_lines' => $this->soLines,
            ] as $table => $rows) {
                foreach (array_chunk($rows, 500) as $chunk) {
                    DB::table($table)->insert($chunk);
                }
            }

            // Hubungkan so_line_id pada baris faktur agar matrix penagihan mengenali seluruh LSO sudah difakturkan
            if (! empty($this->salesOrders)) {
                $soLineLookup = DB::table('sales_order_lines')
                    ->whereIn('sales_order_id', array_column($this->salesOrders, 'id'))
                    ->get(['id', 'sales_order_id', 'variant_sku'])
                    ->keyBy(fn ($r) => "{$r->sales_order_id}|{$r->variant_sku}");

                foreach ($this->invoiceLines as &$il) {
                    $soId = $il['_sales_order_id'];
                    unset($il['_sales_order_id']);
                    $il['so_line_id'] = $soLineLookup["{$soId}|{$il['variant_sku']}"]->id ?? null;
                }
                unset($il);
            }

            foreach ([
                'customer_invoices' => $this->invoices,
                'customer_invoice_lines' => $this->invoiceLines,
                'payments' => $this->payments,
                'payment_allocations' => $this->paymentAllocations,
            ] as $table => $rows) {
                foreach (array_chunk($rows, 500) as $chunk) {
                    DB::table($table)->insert($chunk);
                }
            }
        });

        $this->command?->info(sprintf(
            'Data historis %s s.d. %s: %d sesi POS, %d struk POS, %d Sales Order grosir (semua berfaktur & lunas).',
            $start->format('d/m/Y'),
            $end->format('d/m/Y'),
            count($this->sessions),
            count($this->posOrders),
            count($this->salesOrders)
        ));
    }

    // ── Gerai (POS) ──────────────────────────────────────────────────
    private function generateStoreDay(Carbon $day, string $season, float $t, $products, int $cashierId): void
    {
        $chunks = [];
        foreach (self::BASE_DAILY as $sku => $base) {
            if (! isset($products[$sku])) {
                continue;
            }
            $lambda = $base
                * self::SEASON_MULT[$season][substr($sku, 0, 3)]
                * $this->dayOfWeekFactor($day)
                * $this->paydayFactor($day)
                * $this->trendFactor($sku, $t);

            $units = $this->poisson($lambda);
            while ($units > 0) {
                $q = ($units >= 2 && mt_rand(1, 100) <= 25) ? 2 : 1;
                $chunks[] = [$sku, $q];
                $units -= $q;
            }
        }
        if (! $chunks) {
            return;
        }

        $dayKey = $day->format('ymd');
        $sessionId = "LSES/{$dayKey}";
        $openedAt = $day->copy()->setTime(9, 30);
        $sessionSales = 0;
        $sessionCash = 0;
        $seq = 0;

        shuffle($chunks);
        while ($chunks) {
            $size = min(count($chunks), $this->weightedPick([1 => 55, 2 => 30, 3 => 15]));
            $items = [];
            foreach (array_splice($chunks, 0, $size) as [$sku, $q]) {
                $items[$sku] = ($items[$sku] ?? 0) + $q;
            }

            $seq++;
            $orderId = sprintf('LPOS/%s/%03d', $dayKey, $seq);
            $paidAt = $day->copy()->setTime(
                $this->weightedPick([10 => 6, 11 => 8, 12 => 10, 13 => 9, 14 => 7, 15 => 7, 16 => 9, 17 => 10, 18 => 11, 19 => 12, 20 => 9, 21 => 4]),
                mt_rand(0, 59),
                mt_rand(0, 59)
            );
            $promo = $season === 'akhir_tahun' && mt_rand(1, 100) <= 20; // promo akhir tahun 10%

            $subtotal = 0;
            $tax = 0;
            foreach ($items as $sku => $q) {
                $p = $products[$sku];
                $unitPrice = $promo ? (int) round($p->sales_price * 0.9) : (int) $p->sales_price;
                $lineSub = $q * $unitPrice;
                $lineTax = (int) round($lineSub * self::TAX_RATE);
                $subtotal += $lineSub;
                $tax += $lineTax;

                $this->posLines[] = [
                    'pos_order_id' => $orderId,
                    'variant_sku' => $sku,
                    'qty' => $q,
                    'unit_price' => $unitPrice,
                    'tax_id' => 'VAT-NONLUX',
                    'subtotal_before_tax' => $lineSub,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineSub + $lineTax,
                    'cogs_per_unit' => $p->cost,
                    'cogs_total' => $q * $p->cost,
                    'scanned_barcode' => null,
                    'created_at' => $paidAt,
                ];
            }

            $grand = $subtotal + $tax;
            $method = $this->weightedPickKey(['cash' => 55, 'qris' => 30, 'card' => 15]);
            $tendered = $method === 'cash' ? $this->cashTendered($grand) : $grand;

            $this->posOrders[] = [
                'id' => $orderId,
                'pos_session_id' => $sessionId,
                'cashier_user_id' => $cashierId,
                'customer_id' => mt_rand(1, 100) <= 12 ? self::MEMBER_CUSTOMERS[array_rand(self::MEMBER_CUSTOMERS)] : null,
                'status' => 'paid',
                'payment_method' => $method,
                'subtotal_before_tax' => $subtotal,
                'total_tax' => $tax,
                'grand_total' => $grand,
                'cash_tendered' => $tendered,
                'change_given' => $tendered - $grand,
                'journal_entry_id' => null,
                'idempotency_key' => null,
                'paid_at' => $paidAt,
                'is_legacy' => true,
                'created_at' => $paidAt,
                'updated_at' => $paidAt,
            ];

            $sessionSales += $grand;
            if ($method === 'cash') {
                $sessionCash += $grand;
            }
        }

        $closedAt = $day->copy()->setTime(22, 0);
        $expected = self::OPENING_FLOAT + $sessionCash;
        $this->sessions[] = [
            'id' => $sessionId,
            'cashier_user_id' => $cashierId,
            'location_code' => self::STORE,
            'status' => 'closed',
            'opening_cash_float' => self::OPENING_FLOAT,
            'total_sales' => $sessionSales,
            'expected_cash' => $expected,
            'counted_cash' => $expected,
            'cash_variance' => 0,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'closing_journal_entry_id' => null,
            'idempotency_key' => "legacy-session-{$dayKey}",
            'is_legacy' => true,
            'created_at' => $openedAt,
            'updated_at' => $closedAt,
        ];
    }

    // ── Grosir (Sales Order B2B) ─────────────────────────────────────
    private function maybeGenerateWholesale(Carbon $day, string $season, $products, $customers, int $salesId): void
    {
        $chance = match ($season) {
            'lebaran', 'akhir_tahun' => 16,
            'ajaran_baru' => 12,
            default => 9,
        };
        if ($day->isSunday() || mt_rand(1, 100) > $chance) {
            return;
        }

        $monthKey = $day->format('ym');
        $seq = 1 + count(array_filter($this->salesOrders, fn ($so) => str_starts_with($so['id'], "LSO/{$monthKey}/")));
        $soId = sprintf('LSO/%s/%02d', $monthKey, $seq);
        $invId = sprintf('LINV/%s/%02d', $monthKey, $seq);
        $payId = sprintf('LPAY/%s/%02d', $monthKey, $seq);
        $customerId = self::B2B_CUSTOMERS[array_rand(self::B2B_CUSTOMERS)];
        $orderedAt = $day->copy()->setTime(mt_rand(9, 16), mt_rand(0, 59));
        $disc = mt_rand(1, 100) <= 60 ? 5.0 : 10.0;
        $paymentTerms = $customers[$customerId]->payment_terms ?? 'NET14';

        $pool = ['TSP-M-BLK', 'TSP-L-BLK', 'TSP-M-WHT', 'JNS-30-BLU', 'JNS-32-BLU', 'JNS-32-BLK', 'BAG-OS-BLK'];
        if ($season === 'hujan' || $season === 'akhir_tahun') {
            array_push($pool, 'JKT-M-BLK', 'JKT-L-BLK');
        }
        shuffle($pool);

        $subtotal = 0;
        $tax = 0;
        foreach (array_slice($pool, 0, mt_rand(2, 4)) as $sku) {
            $p = $products[$sku];
            $q = 6 * mt_rand(1, 3); // per setengah lusin / lusin
            $lineSub = (int) round($q * $p->sales_price * (1 - $disc / 100));
            $lineTax = (int) round($lineSub * self::TAX_RATE);
            $subtotal += $lineSub;
            $tax += $lineTax;

            $this->soLines[] = [
                'sales_order_id' => $soId,
                'variant_sku' => $sku,
                'qty_ordered' => $q,
                'qty_delivered' => $q,
                'qty_invoiced' => $q,
                'unit_price' => $p->sales_price,
                'discount_pct' => $disc,
                'tax_id' => 'VAT-NONLUX',
                'subtotal_before_tax' => $lineSub,
                'tax_amount' => $lineTax,
                'line_total' => $lineSub + $lineTax,
                'price_locked_at' => $orderedAt,
                'created_at' => $orderedAt,
                'updated_at' => $orderedAt,
            ];

            $this->invoiceLines[] = [
                '_sales_order_id' => $soId,
                'customer_invoice_id' => $invId,
                'delivery_order_line_id' => null,
                'so_line_id' => null,
                'variant_sku' => $sku,
                'description' => $p->name,
                'qty_invoiced' => $q,
                'unit_price' => $p->sales_price,
                'discount_pct' => $disc,
                'tax_id' => 'VAT-NONLUX',
                'subtotal_before_tax' => $lineSub,
                'tax_amount' => $lineTax,
                'line_total' => $lineSub + $lineTax,
                'created_at' => $orderedAt,
            ];
        }

        $grandTotal = $subtotal + $tax;

        $this->salesOrders[] = [
            'id' => $soId,
            'source_doc_no' => null,
            'customer_id' => $customerId,
            'status' => 'done',
            'credit_hold' => false,
            'discount_hold' => false,
            'discount_pct' => 0,
            'discount_approved_by' => null,
            'discount_approved_at' => null,
            'payment_terms' => $paymentTerms,
            'subtotal_before_tax' => $subtotal,
            'total_tax' => $tax,
            'grand_total' => $grandTotal,
            'confirmed_at' => $orderedAt,
            'confirmed_by' => $salesId,
            'notes' => 'Data historis sebelum go-live ERP (dikirim & difakturkan di sistem lama).',
            'idempotency_key' => null,
            'created_by' => $salesId,
            'is_legacy' => true,
            'created_at' => $orderedAt,
            'updated_at' => $orderedAt,
        ];

        $this->invoices[] = [
            'id' => $invId,
            'source_doc_no' => null,
            'sales_order_id' => $soId,
            'customer_id' => $customerId,
            'status' => 'paid',
            'invoice_date' => $orderedAt->toDateString(),
            'due_date' => $orderedAt->toDateString(),
            'payment_terms' => $paymentTerms,
            'subtotal_before_tax' => $subtotal,
            'total_tax' => $tax,
            'grand_total' => $grandTotal,
            'amount_paid' => $grandTotal,
            'amount_residual' => 0,
            'posted_at' => $orderedAt,
            'posted_by' => $salesId,
            'journal_entry_id' => null,
            'idempotency_key' => "LEGACY-{$invId}",
            'notes' => "Faktur historis {$soId} (sudah lunas sebelum go-live ERP).",
            'created_by' => $salesId,
            'created_at' => $orderedAt,
            'updated_at' => $orderedAt,
        ];

        $this->payments[] = [
            'id' => $payId,
            'payment_type' => 'inbound',
            'party_type' => 'customer',
            'party_id' => $customerId,
            'payment_method' => 'bank_transfer',
            'bank_account_code' => '1020',
            'amount' => $grandTotal,
            'payment_date' => $orderedAt->toDateString(),
            'reference' => "REF-{$invId}",
            'status' => 'reconciled',
            'journal_entry_id' => null,
            'idempotency_key' => "LEGACY-{$payId}",
            'posted_at' => $orderedAt,
            'posted_by' => $salesId,
            'notes' => "Pembayaran historis {$invId} (lunas sebelum go-live ERP).",
            'created_by' => $salesId,
            'created_at' => $orderedAt,
            'updated_at' => $orderedAt,
        ];

        $this->paymentAllocations[] = [
            'payment_id' => $payId,
            'document_type' => 'customer_invoice',
            'document_id' => $invId,
            'amount_allocated' => $grandTotal,
            'created_at' => $orderedAt,
        ];
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private function userIdForRole(string $role): int
    {
        return (int) (DB::table('users')->where('role_id', $role)->orderBy('id')->value('id')
            ?? DB::table('users')->orderBy('id')->value('id'));
    }

    private function cashTendered(int $grand): int
    {
        if (mt_rand(1, 100) <= 25) {
            return $grand; // uang pas
        }
        $step = $grand > 300000 ? 100000 : 50000;

        return (int) (ceil($grand / $step) * $step);
    }

    private function dayOfWeekFactor(Carbon $day): float
    {
        return match ($day->dayOfWeekIso) {
            6 => 1.45, // Sabtu
            7 => 1.35, // Minggu
            5 => 1.10, // Jumat
            default => 0.90,
        };
    }

    private function paydayFactor(Carbon $day): float
    {
        return ($day->day >= 25 || $day->day <= 3) ? 1.15 : 1.0;
    }

    private function trendFactor(string $sku, float $t): float
    {
        if (! isset(self::TREND[$sku])) {
            return 1.0;
        }
        [$from, $to] = self::TREND[$sku];

        return $from + ($to - $from) * $t;
    }

    /** Sampling Poisson (Knuth) — cocok untuk lambda kecil. */
    private function poisson(float $lambda): int
    {
        $l = exp(-$lambda);
        $k = 0;
        $p = 1.0;
        do {
            $k++;
            $p *= mt_rand() / mt_getrandmax();
        } while ($p > $l);

        return $k - 1;
    }

    /** @param array<int,int> $weights nilai => bobot */
    private function weightedPick(array $weights): int
    {
        return (int) $this->weightedPickKey($weights);
    }

    /** @param array<int|string,int> $weights kunci => bobot */
    private function weightedPickKey(array $weights): int|string
    {
        $r = mt_rand(1, array_sum($weights));
        foreach ($weights as $key => $w) {
            if (($r -= $w) <= 0) {
                return $key;
            }
        }

        return array_key_first($weights);
    }
}
