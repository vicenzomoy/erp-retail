import React from 'react';
import { router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Parameter periode untuk dibawa ke tautan laporan lain. */
export const periodQuery = (period) =>
    period ? { year: period.year, month: period.month } : {};

/**
 * Filter periode laporan akuntansi: [‹] [Bulan ▾] [Tahun ▾] [›]  Bulan ini
 *
 * - Pilih "Setahun penuh" di dropdown bulan untuk laporan tahunan.
 * - Tombol panah menggeser satu bulan (atau satu tahun bila setahun penuh).
 * - `params` = query lain yang ikut dipertahankan (mis. akun pada Buku Besar).
 */
export default function PeriodFilter({ period, routeName, params = {}, className = '' }) {
    if (!period) return null;

    const year = Number(period.year);
    const month = period.month === 'all' ? 'all' : Number(period.month);
    const isYearly = month === 'all';

    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1;
    const isCurrent = !isYearly && year === thisYear && month === thisMonth;

    const years = period.years?.length ? period.years : [year];

    const go = (y, m) => {
        router.get(
            route(routeName),
            { ...params, year: y, month: m },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const shift = (step) => {
        if (isYearly) return go(year + step, 'all');
        const idx = year * 12 + (month - 1) + step;
        go(Math.floor(idx / 12), (idx % 12) + 1);
    };

    const selectCls =
        'h-8 rounded border border-slate-300 bg-white py-0 pl-2.5 pr-7 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500';
    const arrowCls =
        'inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900';

    const goLive = period.go_live ? new Date(`${period.go_live}T00:00:00`) : null;

    return (
        <div className={className}>
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Periode
                </span>

                <button type="button" onClick={() => shift(-1)} className={arrowCls} title={isYearly ? 'Tahun sebelumnya' : 'Bulan sebelumnya'}>
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <select
                    aria-label="Bulan"
                    value={month}
                    onChange={(e) => go(year, e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className={selectCls}
                >
                    {MONTHS.map((name, i) => (
                        <option key={name} value={i + 1}>
                            {name}
                        </option>
                    ))}
                    <option value="all">Setahun penuh</option>
                </select>

                <select
                    aria-label="Tahun"
                    value={year}
                    onChange={(e) => go(Number(e.target.value), month)}
                    className={selectCls}
                >
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>

                <button type="button" onClick={() => shift(1)} className={arrowCls} title={isYearly ? 'Tahun berikutnya' : 'Bulan berikutnya'}>
                    <ChevronRight className="h-4 w-4" />
                </button>

                {!isCurrent && (
                    <button
                        type="button"
                        onClick={() => go(thisYear, thisMonth)}
                        className="ml-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                        Bulan ini
                    </button>
                )}
            </div>

            {period.before_go_live && goLive && (
                <div className="mt-2.5 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p>
                        Data pembukuan tersedia mulai <strong>{period.go_live_label}</strong>, jadi
                        laporan periode ini kosong.{' '}
                        <button
                            type="button"
                            onClick={() => go(goLive.getFullYear(), goLive.getMonth() + 1)}
                            className="font-semibold text-amber-800 underline hover:text-amber-950"
                        >
                            Lihat {MONTHS[goLive.getMonth()]} {goLive.getFullYear()}
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
}
