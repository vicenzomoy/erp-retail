<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Periode laporan akuntansi (filter Bulan + Tahun).
 *
 * Query string: ?year=2026&month=11  → satu bulan
 *               ?year=2026&month=all → satu tahun penuh
 * Tanpa parameter → bulan berjalan.
 */
final class ReportPeriod
{
    public const MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function __construct(
        public readonly int $year,
        public readonly ?int $month, // null = setahun penuh
    ) {}

    public static function fromRequest(Request $request): self
    {
        $now = now();

        $year = filter_var($request->query('year'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 2000, 'max_range' => 2100],
        ]) ?: (int) $now->year;

        $monthRaw = $request->query('month');
        if ($monthRaw === 'all') {
            $month = null;
        } else {
            $month = filter_var($monthRaw, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 1, 'max_range' => 12],
            ]) ?: (int) $now->month;
        }

        return new self($year, $month);
    }

    public function start(): CarbonImmutable
    {
        return CarbonImmutable::create($this->year, $this->month ?? 1, 1)->startOfDay();
    }

    public function end(): CarbonImmutable
    {
        return $this->month
            ? $this->start()->endOfMonth()->startOfDay()
            : CarbonImmutable::create($this->year, 12, 31)->startOfDay();
    }

    public function startDate(): string
    {
        return $this->start()->toDateString();
    }

    public function endDate(): string
    {
        return $this->end()->toDateString();
    }

    /** "November 2026" atau "Tahun 2026" */
    public function label(): string
    {
        return $this->month
            ? self::MONTHS[$this->month] . ' ' . $this->year
            : 'Tahun ' . $this->year;
    }

    /** "1 – 30 November 2026" atau "1 Januari – 31 Desember 2026" */
    public function rangeLabel(): string
    {
        $end = $this->end();

        return $this->month
            ? '1 – ' . $end->day . ' ' . self::MONTHS[$this->month] . ' ' . $this->year
            : '1 Januari – 31 Desember ' . $this->year;
    }

    /** "30 November 2026" — dipakai laporan posisi (Neraca) */
    public function endLabel(): string
    {
        return $this->formatDate($this->end());
    }

    private function formatDate(CarbonImmutable $date): string
    {
        return $date->day . ' ' . self::MONTHS[$date->month] . ' ' . $date->year;
    }

    /** Parameter query untuk tautan antar-laporan. */
    public function query(): array
    {
        return ['year' => $this->year, 'month' => $this->month ?? 'all'];
    }

    /** Daftar tahun yang bisa dipilih: tahun jurnal pertama s/d tahun berjalan. */
    public function availableYears(): array
    {
        $current = (int) now()->year;
        $first   = DB::table('journal_entries')->min('entry_date');
        $from    = $first ? (int) substr((string) $first, 0, 4) : $current;

        $from = min($from, $this->year, $current);
        $to   = max($current, $this->year);

        return range($to, $from);
    }

    /**
     * Tanggal jurnal pertama (awal data pembukuan). Periode sebelum tanggal ini pasti kosong.
     */
    public static function goLiveDate(): ?string
    {
        static $cache = false;

        if ($cache === false) {
            $first = DB::table('journal_entries')->where('status', 'posted')->min('entry_date');
            $cache = $first ? substr((string) $first, 0, 10) : null;
        }

        return $cache;
    }

    public function toArray(): array
    {
        $goLive = self::goLiveDate();

        return [
            'go_live'          => $goLive,
            'go_live_label'    => $goLive ? $this->formatDate(CarbonImmutable::parse($goLive)) : null,
            'before_go_live'   => $goLive !== null && $this->endDate() < $goLive,
            'year'        => $this->year,
            'month'       => $this->month ?? 'all',
            'label'       => $this->label(),
            'range_label' => $this->rangeLabel(),
            'end_label'   => $this->endLabel(),
            'start'       => $this->startDate(),
            'end'         => $this->endDate(),
            'years'       => $this->availableYears(),
        ];
    }
}
