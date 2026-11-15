<?php

namespace App\Services\Analytics;

use App\Models\Master\Product;
use App\Services\Inventory\StockService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Analisis penjualan 12 bulan & rekomendasi restock (dipakai modul Purchase
 * dan Dashboard Owner).
 *
 * Sumber data (digabung): arsip `sales_history` + POS live (paid) + Sales Order
 * live (confirmed/done). Analisis read-only — tidak menulis ke database.
 *
 * Cara rekomendasi dihitung (sengaja sederhana agar bisa dijelaskan):
 *   1. Rata-rata harian SKU selama 12 bulan.
 *   2. Indeks musim per model = laju jual model di musim itu ÷ laju rata-rata model.
 *   3. Tren terkini = penjualan 60 hari terakhir ÷ penjualan yang "seharusnya"
 *      menurut pola musim (diredam & dibatasi 0,5–1,6).
 *   4. Perkiraan kebutuhan H hari ke depan = rata-rata harian × tren × Σ indeks musim
 *      tiap hari ke depan.
 *   5. Saran beli = perkiraan × 1,15 (stok pengaman) − stok tersedia − barang dalam PO.
 */
class SalesAnalyticsService
{
    private const SAFETY_FACTOR = 1.15;
    private const TREND_WINDOW_DAYS = 60;
    private const URGENT_COVER_DAYS = 14;

    public function __construct(
        protected StockService $stockService
    ) {}

    /**
     * @param  int  $horizonDays  Rencana stok untuk berapa hari ke depan (30/60/90).
     */
    public function getAnalysis(int $horizonDays = 60): array
    {
        $today = Carbon::today();
        $from = $today->copy()->subYear()->addDay();
        $to = $today->copy();
        $totalDays = $from->diffInDays($to) + 1;

        $products = Product::with(['vendor', 'pricelists'])->orderBy('variant_sku')->get()->keyBy('variant_sku');
        $daily = $this->dailySalesBySku($from, $to);

        // ── Kalender: musim tiap hari dalam jendela & ke depan ──────────
        $windowSeasonDays = array_fill_keys(array_keys(SeasonCalendar::SEASONS), 0);
        $dateSeason = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $s = SeasonCalendar::seasonFor($d);
            $dateSeason[$d->format('Y-m-d')] = $s;
            $windowSeasonDays[$s]++;
        }

        $futureSeasonDays = array_fill_keys(array_keys(SeasonCalendar::SEASONS), 0);
        for ($d = $today->copy()->addDay(), $i = 0; $i < $horizonDays; $d->addDay(), $i++) {
            $futureSeasonDays[SeasonCalendar::seasonFor($d)]++;
        }

        $trendFrom = $today->copy()->subDays(self::TREND_WINDOW_DAYS - 1)->format('Y-m-d');
        $last30From = $today->copy()->subDays(29)->format('Y-m-d');
        $trendSeasonDays = array_fill_keys(array_keys(SeasonCalendar::SEASONS), 0);
        foreach ($dateSeason as $date => $s) {
            if ($date >= $trendFrom) {
                $trendSeasonDays[$s]++;
            }
        }

        // ── Agregasi per SKU, per model, per musim, per bulan ───────────
        $months = $this->monthBuckets($from, $to, $dateSeason);
        $sku = [];
        $modelSeasonUnits = [];
        $modelUnits = [];
        $seasonTotals = array_fill_keys(array_keys(SeasonCalendar::SEASONS), ['units' => 0.0, 'revenue' => 0.0, 'sku_units' => []]);

        foreach ($products as $code => $p) {
            $sku[$code] = [
                'units' => 0.0, 'revenue' => 0.0, 'cogs' => 0.0,
                'units_30' => 0.0, 'units_trend' => 0.0,
                'monthly' => array_fill_keys(array_keys($months), 0.0),
            ];
        }

        foreach ($daily as $row) {
            $code = $row->variant_sku;
            if (! isset($sku[$code], $dateSeason[$row->sale_date])) {
                continue;
            }
            $units = (float) $row->units;
            $season = $dateSeason[$row->sale_date];
            $model = $products[$code]->name;
            $monthKey = substr($row->sale_date, 0, 7);

            $sku[$code]['units'] += $units;
            $sku[$code]['revenue'] += (float) $row->revenue;
            $sku[$code]['cogs'] += (float) $row->cogs;
            $sku[$code]['monthly'][$monthKey] += $units;
            if ($row->sale_date >= $last30From) {
                $sku[$code]['units_30'] += $units;
            }
            if ($row->sale_date >= $trendFrom) {
                $sku[$code]['units_trend'] += $units;
            }

            $modelUnits[$model] = ($modelUnits[$model] ?? 0) + $units;
            $modelSeasonUnits[$model][$season] = ($modelSeasonUnits[$model][$season] ?? 0) + $units;

            $months[$monthKey]['units'] += $units;
            $months[$monthKey]['revenue'] += (float) $row->revenue;

            $seasonTotals[$season]['units'] += $units;
            $seasonTotals[$season]['revenue'] += (float) $row->revenue;
            $seasonTotals[$season]['sku_units'][$code] = ($seasonTotals[$season]['sku_units'][$code] ?? 0) + $units;
        }

        // ── Indeks musim per model ──────────────────────────────────────
        $models = $products->pluck('name')->unique()->values()->all();
        $seasonIndex = [];
        foreach ($models as $model) {
            $avgRate = ($modelUnits[$model] ?? 0) / $totalDays;
            foreach (SeasonCalendar::SEASONS as $s => $_) {
                $days = $windowSeasonDays[$s];
                $seasonIndex[$model][$s] = ($avgRate > 0 && $days > 0)
                    ? (($modelSeasonUnits[$model][$s] ?? 0) / $days) / $avgRate
                    : 1.0;
            }
        }
        $sumIndex = function (string $model, array $seasonDays) use ($seasonIndex): float {
            $sum = 0.0;
            foreach ($seasonDays as $s => $days) {
                $sum += $days * ($seasonIndex[$model][$s] ?? 1.0);
            }

            return $sum;
        };

        // ── Klasifikasi laku: dibanding SKU median ──────────────────────
        //   terlaris    : >= 1,5x median pcs terjual
        //   kurang_laku : <= 0,45x median pcs terjual
        $totalUnits = array_sum(array_column($sku, 'units'));
        $unitsList = array_column($sku, 'units');
        sort($unitsList);
        $n = count($unitsList);
        $median = $n ? ($n % 2 ? $unitsList[intdiv($n, 2)] : ($unitsList[$n / 2 - 1] + $unitsList[$n / 2]) / 2) : 0;
        $class = [];
        foreach ($sku as $code => $v) {
            $class[$code] = $median <= 0 ? 'normal'
                : ($v['units'] >= $median * 1.5 ? 'terlaris' : ($v['units'] <= $median * 0.45 ? 'kurang_laku' : 'normal'));
        }

        // ── Stok & barang dalam perjalanan (PO confirmed) ───────────────
        $levels = $this->stockService->getStockLevelsBySkuLocation();
        $incoming = DB::table('purchase_order_lines')
            ->join('purchase_orders', 'purchase_orders.id', '=', 'purchase_order_lines.purchase_order_id')
            ->where('purchase_orders.status', 'confirmed')
            ->groupBy('purchase_order_lines.variant_sku')
            ->selectRaw('purchase_order_lines.variant_sku, SUM(GREATEST(0, qty_ordered - qty_received)) as qty')
            ->pluck('qty', 'variant_sku');

        // ── Per-SKU: performa + rekomendasi ─────────────────────────────
        $productRows = [];
        $restockRows = [];
        foreach ($products as $code => $p) {
            $s = $sku[$code];
            $model = $p->name;
            $baseRate = $s['units'] / $totalDays;

            $expectedTrend = $baseRate * $sumIndex($model, $trendSeasonDays);
            $rawTrend = $expectedTrend >= 3 ? $s['units_trend'] / $expectedTrend : 1.0;
            $trend = max(0.5, min(1.6, 1 + ($rawTrend - 1) * 0.7));

            $futureIndexSum = $sumIndex($model, $futureSeasonDays);
            $forecast = $baseRate * $trend * $futureIndexSum;
            $forecastDaily = $forecast / max(1, $horizonDays);
            $seasonFactor = $futureIndexSum / max(1, $horizonDays);

            $available = array_sum(array_column($levels[$code] ?? [], 'available'));
            $inbound = (float) ($incoming[$code] ?? 0);
            $coverDays = $forecastDaily > 0 ? ($available + $inbound) / $forecastDaily : null;

            $pricelist = $p->pricelists->firstWhere('vendor_id', $p->default_vendor) ?? $p->pricelists->first();
            $minQty = max(1, (int) ($pricelist->min_qty ?? 1));
            $buyPrice = (float) ($pricelist->unit_price ?? $p->cost);

            $need = $forecast * self::SAFETY_FACTOR - $available - $inbound;
            $suggestQty = $need > 0 ? (int) (ceil(ceil($need) / $minQty) * $minQty) : 0;

            $decision = $this->decide($class[$code], $suggestQty, $coverDays, $horizonDays, $forecast);
            if ($decision === 'hold') {
                $suggestQty = 0;
            }

            $profit = $s['revenue'] - $s['cogs'];
            $productRows[] = [
                'sku' => $code,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'units' => round($s['units']),
                'units_30' => round($s['units_30']),
                'avg_monthly' => round($baseRate * 30, 1),
                'revenue' => round($s['revenue']),
                'profit' => round($profit),
                'margin_pct' => $s['revenue'] > 0 ? round($profit / $s['revenue'] * 100, 1) : 0,
                'share_pct' => $totalUnits > 0 ? round($s['units'] / $totalUnits * 100, 1) : 0,
                'class' => $class[$code],
                'trend_pct' => round(($rawTrend - 1) * 100),
                'monthly' => array_values(array_map('round', $s['monthly'])),
            ];

            $restockRows[] = [
                'sku' => $code,
                'name' => $p->name,
                'size' => $p->size,
                'color' => $p->color,
                'unit' => $p->unit,
                'class' => $class[$code],
                'vendor_id' => $p->default_vendor,
                'vendor_name' => $p->vendor?->name ?? $p->default_vendor,
                'units_30' => round($s['units_30']),
                'avg_monthly' => round($baseRate * 30, 1),
                'forecast' => (int) round($forecast),
                'season_factor' => round($seasonFactor, 2),
                'trend_pct' => round(($rawTrend - 1) * 100),
                'available' => $available,
                'incoming' => $inbound,
                'cover_days' => $coverDays === null ? null : (int) floor($coverDays),
                'suggest_qty' => $suggestQty,
                'buy_price' => $buyPrice,
                'est_cost' => $suggestQty * $buyPrice,
                'decision' => $decision,
                'reason' => $this->reason($decision, $class[$code], $coverDays, $seasonFactor, $rawTrend, $model, $horizonDays),
            ];
        }

        $decisionOrder = ['urgent' => 0, 'restock' => 1, 'ok' => 2, 'hold' => 3];
        usort($restockRows, fn ($a, $b) => [$decisionOrder[$a['decision']], $a['cover_days'] ?? PHP_INT_MAX] <=> [$decisionOrder[$b['decision']], $b['cover_days'] ?? PHP_INT_MAX]);
        usort($productRows, fn ($a, $b) => $b['units'] <=> $a['units']);

        $totalRevenue = array_sum(array_column($productRows, 'revenue'));
        $totalProfit = array_sum(array_column($productRows, 'profit'));
        $currentSeason = SeasonCalendar::seasonFor($today);
        $nextSeason = $this->nextSeasonChange($today);

        $seasonRows = $this->seasonSummary($seasonTotals, $windowSeasonDays, $dateSeason, $products);
        $matrix = $this->modelSeasonMatrix($models, $seasonIndex, $modelSeasonUnits, $windowSeasonDays);

        return [
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'label' => $from->locale('id')->translatedFormat('d M Y').' – '.$to->locale('id')->translatedFormat('d M Y'),
                'days' => $totalDays,
            ],
            'horizon_days' => $horizonDays,
            'kpis' => [
                'total_units' => round($totalUnits),
                'total_revenue' => round($totalRevenue),
                'total_profit' => round($totalProfit),
                'margin_pct' => $totalRevenue > 0 ? round($totalProfit / $totalRevenue * 100, 1) : 0,
                'avg_monthly_units' => round($totalUnits / $totalDays * 30),
                'best_month' => collect($months)->filter(fn ($m) => ! $m['partial'])->sortByDesc('units')->first()['label'] ?? null,
                'peak_season' => collect($seasonRows)->sortByDesc('units_per_week')->first()['label'] ?? null,
            ],
            'current_season' => [
                'key' => $currentSeason,
                'label' => SeasonCalendar::label($currentSeason),
                'next_key' => $nextSeason['key'],
                'next_label' => SeasonCalendar::label($nextSeason['key']),
                'next_start' => $nextSeason['date']->locale('id')->translatedFormat('d M Y'),
                'days_until_next' => $nextSeason['days'],
            ],
            'insights' => $this->insights($currentSeason, $nextSeason, $seasonIndex, $productRows, $restockRows, $horizonDays),
            'monthly' => array_values($months),
            'seasons' => $seasonRows,
            'season_matrix' => $matrix,
            'products' => $productRows,
            'restock' => $restockRows,
            'restock_summary' => [
                'urgent' => count(array_filter($restockRows, fn ($r) => $r['decision'] === 'urgent')),
                'restock' => count(array_filter($restockRows, fn ($r) => $r['decision'] === 'restock')),
                'ok' => count(array_filter($restockRows, fn ($r) => $r['decision'] === 'ok')),
                'hold' => count(array_filter($restockRows, fn ($r) => $r['decision'] === 'hold')),
                'total_qty' => array_sum(array_column($restockRows, 'suggest_qty')),
                'total_cost' => array_sum(array_column($restockRows, 'est_cost')),
            ],
        ];
    }

    /**
     * Penjualan harian per SKU dari arsip + POS live + SO live.
     */
    protected function dailySalesBySku(CarbonInterface $from, CarbonInterface $to)
    {
        $fromDate = $from->format('Y-m-d');
        $toDate = $to->format('Y-m-d');

        $history = DB::table('sales_history')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('sale_date::text as sale_date, variant_sku, qty, subtotal_before_tax as revenue, cogs_total as cogs');

        $pos = DB::table('pos_order_lines')
            ->join('pos_orders', 'pos_orders.id', '=', 'pos_order_lines.pos_order_id')
            ->where('pos_orders.status', 'paid')
            ->whereNotNull('pos_orders.paid_at')
            ->whereRaw('DATE(pos_orders.paid_at) BETWEEN ? AND ?', [$fromDate, $toDate])
            ->selectRaw('DATE(pos_orders.paid_at)::text as sale_date, pos_order_lines.variant_sku, pos_order_lines.qty, pos_order_lines.subtotal_before_tax as revenue, pos_order_lines.cogs_total as cogs');

        $so = DB::table('sales_order_lines')
            ->join('sales_orders', 'sales_orders.id', '=', 'sales_order_lines.sales_order_id')
            ->join('products', 'products.variant_sku', '=', 'sales_order_lines.variant_sku')
            ->whereIn('sales_orders.status', ['confirmed', 'done'])
            ->whereNotNull('sales_orders.confirmed_at')
            ->whereRaw('DATE(sales_orders.confirmed_at) BETWEEN ? AND ?', [$fromDate, $toDate])
            ->selectRaw('DATE(sales_orders.confirmed_at)::text as sale_date, sales_order_lines.variant_sku, sales_order_lines.qty_ordered as qty, sales_order_lines.subtotal_before_tax as revenue, sales_order_lines.qty_ordered * products.cost as cogs');

        $union = $history->unionAll($pos)->unionAll($so);

        return DB::query()->fromSub($union, 'lines')
            ->groupBy('sale_date', 'variant_sku')
            ->selectRaw('sale_date, variant_sku, SUM(qty) as units, SUM(revenue) as revenue, SUM(cogs) as cogs')
            ->get();
    }

    protected function monthBuckets(CarbonInterface $from, CarbonInterface $to, array $dateSeason): array
    {
        $months = [];
        foreach ($dateSeason as $date => $season) {
            $key = substr($date, 0, 7);
            if (! isset($months[$key])) {
                $c = Carbon::parse($key.'-01');
                $months[$key] = [
                    'key' => $key,
                    'label' => $c->locale('id')->translatedFormat('M y'),
                    'units' => 0.0,
                    'revenue' => 0.0,
                    'season_days' => [],
                    'days' => 0,
                    'partial' => false,
                ];
            }
            $months[$key]['days']++;
            $months[$key]['season_days'][$season] = ($months[$key]['season_days'][$season] ?? 0) + 1;
        }

        foreach ($months as $key => &$m) {
            $m['partial'] = $m['days'] < Carbon::parse($key.'-01')->daysInMonth;
            arsort($m['season_days']);
            $m['season'] = array_key_first($m['season_days']);
        }
        unset($m);

        return $months;
    }

    protected function seasonSummary(array $seasonTotals, array $windowSeasonDays, array $dateSeason, $products): array
    {
        $rows = [];
        foreach (SeasonCalendar::SEASONS as $key => $meta) {
            $days = $windowSeasonDays[$key];
            $dates = array_keys(array_filter($dateSeason, fn ($s) => $s === $key));
            arsort($seasonTotals[$key]['sku_units']);
            $top = array_slice($seasonTotals[$key]['sku_units'], 0, 3, true);

            $rows[] = [
                'key' => $key,
                'label' => $meta['label'],
                'period' => $meta['period'],
                'range' => $dates ? Carbon::parse(min($dates))->locale('id')->translatedFormat('d M y').' – '.Carbon::parse(max($dates))->locale('id')->translatedFormat('d M y') : null,
                'days' => $days,
                'units' => round($seasonTotals[$key]['units']),
                'revenue' => round($seasonTotals[$key]['revenue']),
                'units_per_week' => $days > 0 ? round($seasonTotals[$key]['units'] / $days * 7, 1) : 0,
                'top_products' => collect($top)->map(fn ($u, $code) => [
                    'sku' => $code,
                    'name' => $products[$code]->name,
                    'variant' => $products[$code]->size.' / '.$products[$code]->color,
                    'units' => round($u),
                ])->values()->all(),
            ];
        }

        return $rows;
    }

    protected function modelSeasonMatrix(array $models, array $seasonIndex, array $modelSeasonUnits, array $windowSeasonDays): array
    {
        return array_map(fn ($model) => [
            'model' => $model,
            'cells' => collect(SeasonCalendar::SEASONS)->map(fn ($_, $s) => [
                'season' => $s,
                'index' => round($seasonIndex[$model][$s] ?? 1.0, 2),
                'units_per_week' => $windowSeasonDays[$s] > 0
                    ? round(($modelSeasonUnits[$model][$s] ?? 0) / $windowSeasonDays[$s] * 7, 1)
                    : 0,
            ])->values()->all(),
        ], $models);
    }

    protected function decide(string $class, int $suggestQty, ?float $coverDays, int $horizon, float $forecast): string
    {
        if ($suggestQty <= 0) {
            return ($class === 'kurang_laku' && ($coverDays === null || $coverDays > $horizon * 2)) ? 'hold' : 'ok';
        }
        if ($class === 'kurang_laku' && $forecast < 3) {
            return 'hold';
        }

        return ($coverDays !== null && $coverDays < self::URGENT_COVER_DAYS) ? 'urgent' : 'restock';
    }

    protected function reason(string $decision, string $class, ?float $coverDays, float $seasonFactor, float $rawTrend, string $model, int $horizon): string
    {
        $parts = [];
        $cover = $coverDays === null ? 'stok tidak bergerak' : 'stok cukup ±'.(int) floor($coverDays).' hari';

        $parts[] = match ($decision) {
            'urgent' => "Hampir habis — {$cover}",
            'restock' => "Stok kurang untuk {$horizon} hari ke depan ({$cover})",
            'ok' => "Stok masih cukup ({$cover})",
            'hold' => "Kurang laku — {$cover}, jangan tambah stok",
        };

        if ($seasonFactor >= 1.25) {
            $parts[] = sprintf('musim ramai untuk %s (±%s× normal)', $model, number_format($seasonFactor, 1, ',', '.'));
        } elseif ($seasonFactor <= 0.8) {
            $parts[] = sprintf('musim sepi untuk %s (±%s× normal)', $model, number_format($seasonFactor, 1, ',', '.'));
        }

        if ($class === 'kurang_laku' && in_array($decision, ['urgent', 'restock'], true)) {
            $parts[] = 'produk kurang laku, beli secukupnya';
        }

        if ($rawTrend >= 1.25) {
            $parts[] = 'permintaan sedang naik';
        } elseif ($rawTrend <= 0.75) {
            $parts[] = 'permintaan sedang turun';
        }

        return ucfirst(implode('; ', $parts)).'.';
    }

    /** @return array{key:string,date:Carbon,days:int} */
    protected function nextSeasonChange(CarbonInterface $today): array
    {
        $current = SeasonCalendar::seasonFor($today);
        $d = $today->copy();
        for ($i = 1; $i <= 366; $i++) {
            $d->addDay();
            $s = SeasonCalendar::seasonFor($d);
            if ($s !== $current) {
                return ['key' => $s, 'date' => $d->copy(), 'days' => $i];
            }
        }

        return ['key' => $current, 'date' => $d, 'days' => 366];
    }

    /**
     * Kalimat ringkas yang langsung bisa dipakai mengambil keputusan.
     *
     * @return array<int, array{type:string, title:string, text:string}>
     */
    protected function insights(string $currentSeason, array $next, array $seasonIndex, array $productRows, array $restockRows, int $horizon): array
    {
        $fmt = fn (float $x) => number_format($x, 1, ',', '.');
        $topModels = function (string $season, int $n = 2) use ($seasonIndex) {
            $scores = [];
            foreach ($seasonIndex as $model => $idx) {
                $scores[$model] = $idx[$season] ?? 1.0;
            }
            arsort($scores);

            return array_slice(array_filter($scores, fn ($v) => $v >= 1.15), 0, $n, true);
        };

        $out = [];

        $now = $topModels($currentSeason);
        $out[] = [
            'type' => 'season',
            'title' => 'Sekarang: '.SeasonCalendar::label($currentSeason),
            'text' => $now
                ? 'Biasanya paling laku di musim ini: '.implode(', ', array_map(fn ($m, $v) => "{$m} ({$fmt($v)}× normal)", array_keys($now), $now)).'.'
                : 'Penjualan di musim ini biasanya normal untuk semua model.',
        ];

        $upcoming = $topModels($next['key']);
        $out[] = [
            'type' => 'upcoming',
            'title' => SeasonCalendar::label($next['key']).' mulai '.$next['date']->locale('id')->translatedFormat('d M').' ('.$next['days'].' hari lagi)',
            'text' => $upcoming
                ? 'Siapkan stok: '.implode(', ', array_map(fn ($m, $v) => "{$m} naik ±{$fmt($v)}×", array_keys($upcoming), $upcoming)).'.'
                : 'Tidak ada lonjakan khusus — cukup restock seperti biasa.',
        ];

        $urgent = array_filter($restockRows, fn ($r) => $r['decision'] === 'urgent');
        $restock = array_filter($restockRows, fn ($r) => $r['decision'] === 'restock');
        if ($urgent || $restock) {
            $names = array_map(fn ($r) => "{$r['name']} {$r['size']} {$r['color']}", array_slice($urgent ?: $restock, 0, 3));
            $out[] = [
                'type' => 'restock',
                'title' => count($urgent).' produk perlu restock segera, '.count($restock).' perlu restock',
                'text' => 'Prioritas: '.implode(', ', $names).'.',
            ];
        }

        $best = $productRows[0] ?? null;
        $slow = collect($productRows)->where('class', 'kurang_laku')->sortBy('units')->first();
        if ($best) {
            $out[] = [
                'type' => 'best',
                'title' => 'Terlaris 12 bulan: '.$best['name'].' '.$best['size'].' '.$best['color'],
                'text' => number_format($best['units'], 0, ',', '.').' pcs terjual ('.$fmt($best['share_pct']).'% dari total).'
                    .($slow ? ' Paling kurang laku: '.$slow['name'].' '.$slow['size'].' '.$slow['color'].' — hanya '.number_format($slow['units'], 0, ',', '.').' pcs, sebaiknya tahan pembelian.' : ''),
            ];
        }

        $rising = collect($productRows)->where('units', '>=', 30)->sortByDesc('trend_pct')->first();
        if ($rising && $rising['trend_pct'] >= 20) {
            $out[] = [
                'type' => 'trend',
                'title' => 'Sedang naik: '.$rising['name'].' '.$rising['size'].' '.$rising['color'],
                'text' => "Terjual {$rising['trend_pct']}% di atas pola musimannya dalam 60 hari terakhir — pertimbangkan menambah porsi beli.",
            ];
        }

        return $out;
    }
}
