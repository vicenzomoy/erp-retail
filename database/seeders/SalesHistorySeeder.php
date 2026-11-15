<?php

namespace Database\Seeders;

use App\Services\Analytics\SeasonCalendar;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Riwayat penjualan 12 bulan terakhir (acak namun masuk akal) untuk analisis
 * penjualan & rekomendasi restock.
 *
 * Pola yang disimulasikan:
 * - Permintaan dasar per varian (Kaos paling laris, Jaket Krem L paling lambat).
 * - Musim: Lebaran (semua naik, Kaos & Jeans melonjak), Akhir Tahun, Tahun
 *   Ajaran Baru (Tas & Jeans), Musim Hujan (Jaket naik), Kemarau (Kaos & Topi naik).
 * - Akhir pekan & tanggal gajian lebih ramai.
 * - Tren: Jeans Hitam sedang naik, Topi Logo sedang turun.
 * - Penjualan grosir (B2B) beberapa kali per bulan dari gudang.
 *
 * Data masuk ke tabel `sales_history` sehingga tidak mengubah stok maupun jurnal.
 * Seeder ini idempoten: data hasil seed sebelumnya dihapus dulu.
 */
class SalesHistorySeeder extends Seeder
{
    private const TAX_RATE = 0.11; // efektif 11% (12% x 11/12), dibulatkan per baris

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

    public function run(): void
    {
        mt_srand(20261115);

        $products = DB::table('products')->get()->keyBy('variant_sku');
        $end = Carbon::yesterday();
        $start = $end->copy()->subDays(364);
        $totalDays = 364;

        $rows = [];
        $posSeq = [];
        $soSeq = [];
        $now = now();

        for ($day = $start->copy(), $i = 0; $day->lte($end); $day->addDay(), $i++) {
            $season = SeasonCalendar::seasonFor($day);
            $t = $i / $totalDays;

            // ── Penjualan POS di gerai ─────────────────────────────
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
                    $q = ($units >= 2 && mt_rand(1, 100) <= 25) ? 2 : 1; // kadang beli 2 pcs sekaligus
                    $chunks[] = [$sku, $q];
                    $units -= $q;
                }
            }

            shuffle($chunks);
            while ($chunks) {
                $size = min(count($chunks), $this->weightedPick([1 => 55, 2 => 30, 3 => 15]));
                $receiptLines = [];
                foreach (array_splice($chunks, 0, $size) as [$sku, $q]) {
                    $receiptLines[$sku] = ($receiptLines[$sku] ?? 0) + $q;
                }

                $seqKey = $day->format('ymd');
                $posSeq[$seqKey] = ($posSeq[$seqKey] ?? 0) + 1;
                $docNo = sprintf('HPOS/%s/%03d', $seqKey, $posSeq[$seqKey]);
                $soldAt = $day->copy()->setTime($this->weightedPick([10 => 6, 11 => 8, 12 => 10, 13 => 9, 14 => 7, 15 => 7, 16 => 9, 17 => 10, 18 => 11, 19 => 12, 20 => 9, 21 => 4]), mt_rand(0, 59));

                // Promo akhir tahun (mis. 12.12): sebagian struk dapat diskon 10%
                $disc = ($season === 'akhir_tahun' && mt_rand(1, 100) <= 20) ? 10.0 : 0.0;

                foreach ($receiptLines as $sku => $q) {
                    $rows[] = $this->line($docNo, 'pos', $soldAt, 'TOKO-PKU', null, $products[$sku], $q, $disc, $now);
                }
            }

            // ── Penjualan grosir (B2B) dari gudang, ±3x per bulan ──
            $b2bChance = match ($season) {
                'lebaran', 'akhir_tahun' => 16,
                'ajaran_baru' => 12,
                default => 9,
            };
            if (! $day->isSunday() && mt_rand(1, 100) <= $b2bChance) {
                $seqKey = $day->format('ym');
                $soSeq[$seqKey] = ($soSeq[$seqKey] ?? 0) + 1;
                $docNo = sprintf('HSO/%s/%02d', $seqKey, $soSeq[$seqKey]);
                $customer = self::B2B_CUSTOMERS[array_rand(self::B2B_CUSTOMERS)];
                $soldAt = $day->copy()->setTime(mt_rand(9, 16), mt_rand(0, 59));
                $disc = mt_rand(1, 100) <= 60 ? 5.0 : 10.0;

                $pool = ['TSP-M-BLK', 'TSP-L-BLK', 'TSP-M-WHT', 'JNS-30-BLU', 'JNS-32-BLU', 'JNS-32-BLK', 'BAG-OS-BLK'];
                if ($season === 'hujan' || $season === 'akhir_tahun') {
                    array_push($pool, 'JKT-M-BLK', 'JKT-L-BLK');
                }
                shuffle($pool);

                foreach (array_slice($pool, 0, mt_rand(2, 4)) as $sku) {
                    $q = 6 * mt_rand(1, 3); // grosir per lusin/setengah lusin
                    $rows[] = $this->line($docNo, 'wholesale', $soldAt, 'WH-PKU', $customer, $products[$sku], $q, $disc, $now);
                }
            }
        }

        DB::transaction(function () use ($rows) {
            DB::table('sales_history')->where('source', 'seed')->delete();
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('sales_history')->insert($chunk);
            }
        });

        $this->command?->info(sprintf(
            'Riwayat penjualan: %d baris (%s s.d. %s).',
            count($rows),
            $start->format('d/m/Y'),
            $end->format('d/m/Y')
        ));
    }

    private function line(string $docNo, string $channel, Carbon $soldAt, string $location, ?string $customer, object $p, int $qty, float $discPct, $now): array
    {
        $subtotal = (int) round($qty * $p->sales_price * (1 - $discPct / 100));
        $tax = (int) round($subtotal * self::TAX_RATE);

        return [
            'document_no' => $docNo,
            'channel' => $channel,
            'sale_date' => $soldAt->format('Y-m-d'),
            'sold_at' => $soldAt->format('Y-m-d H:i:s'),
            'location_code' => $location,
            'customer_id' => $customer,
            'variant_sku' => $p->variant_sku,
            'qty' => $qty,
            'unit_price' => $p->sales_price,
            'discount_pct' => $discPct,
            'subtotal_before_tax' => $subtotal,
            'tax_amount' => $tax,
            'line_total' => $subtotal + $tax,
            'cogs_total' => $qty * $p->cost,
            'source' => 'seed',
            'created_at' => $now,
            'updated_at' => $now,
        ];
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

    /** @param array<int,int> $weights value => bobot */
    private function weightedPick(array $weights): int
    {
        $r = mt_rand(1, array_sum($weights));
        foreach ($weights as $value => $w) {
            if (($r -= $w) <= 0) {
                return $value;
            }
        }

        return array_key_first($weights);
    }
}
