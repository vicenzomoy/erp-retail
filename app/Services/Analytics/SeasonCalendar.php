<?php

namespace App\Services\Analytics;

use Carbon\CarbonInterface;

/**
 * Kalender musim penjualan ritel fashion (Pekanbaru / Indonesia).
 *
 * Setiap tanggal dipetakan ke tepat SATU musim dengan prioritas:
 *   Lebaran (Ramadan s.d. H+7 Idul Fitri)
 *   > Akhir Tahun (1 Des – 5 Jan)
 *   > Tahun Ajaran Baru (20 Jun – 31 Jul)
 *   > Musim Hujan (Nov – Mar) / Musim Kemarau (Apr – Okt)
 *
 * Dipakai bersama oleh seeder riwayat penjualan dan analisis penjualan
 * supaya definisi musim selalu konsisten.
 */
class SeasonCalendar
{
    public const SEASONS = [
        'lebaran' => [
            'label' => 'Ramadan & Lebaran',
            'short' => 'Lebaran',
            'period' => 'Awal Ramadan s.d. H+7 Idul Fitri',
        ],
        'akhir_tahun' => [
            'label' => 'Akhir Tahun & Liburan',
            'short' => 'Akhir Tahun',
            'period' => '1 Des – 5 Jan',
        ],
        'ajaran_baru' => [
            'label' => 'Tahun Ajaran Baru',
            'short' => 'Ajaran Baru',
            'period' => '20 Jun – 31 Jul',
        ],
        'hujan' => [
            'label' => 'Musim Hujan',
            'short' => 'Hujan',
            'period' => 'Nov – Mar (di luar musim khusus)',
        ],
        'kemarau' => [
            'label' => 'Musim Kemarau',
            'short' => 'Kemarau',
            'period' => 'Apr – Okt (di luar musim khusus)',
        ],
    ];

    /** Tanggal Idul Fitri (perkiraan kalender pemerintah). */
    private const IDUL_FITRI = [
        2024 => '2024-04-10',
        2025 => '2025-03-31',
        2026 => '2026-03-20',
        2027 => '2027-03-10',
        2028 => '2028-02-27',
        2029 => '2029-02-14',
    ];

    public static function seasonFor(CarbonInterface $date): string
    {
        if (self::isLebaran($date)) {
            return 'lebaran';
        }

        $m = (int) $date->month;
        $d = (int) $date->day;

        if ($m === 12 || ($m === 1 && $d <= 5)) {
            return 'akhir_tahun';
        }
        if (($m === 6 && $d >= 20) || $m === 7) {
            return 'ajaran_baru';
        }

        return in_array($m, [11, 12, 1, 2, 3], true) ? 'hujan' : 'kemarau';
    }

    public static function label(string $key): string
    {
        return self::SEASONS[$key]['label'] ?? $key;
    }

    private static function isLebaran(CarbonInterface $date): bool
    {
        $fitri = self::IDUL_FITRI[(int) $date->year] ?? null;
        if (! $fitri) {
            return false;
        }

        $day = $date->format('Y-m-d');
        $start = date('Y-m-d', strtotime($fitri.' -30 days')); // ±awal Ramadan
        $end = date('Y-m-d', strtotime($fitri.' +7 days'));

        return $day >= $start && $day <= $end;
    }
}
