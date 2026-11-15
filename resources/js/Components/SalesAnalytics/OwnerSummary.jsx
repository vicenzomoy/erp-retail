import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { TrendingUp, ArrowUpRight, Award, ThumbsDown, PackagePlus, CalendarRange } from 'lucide-react';
import {
    InsightCards,
    MonthlyChart,
    SeasonMatrix,
    SeasonChip,
    DecisionBadge,
    DECISION_STYLE,
    RankList,
    Segmented,
    formatRpShort,
    fmtNum,
} from '@/Components/SalesAnalytics/index';

/**
 * Ringkasan Analisis Penjualan & Restock untuk Dashboard Owner.
 * Analisis lengkap + pembuatan RFQ ada di modul Purchase.
 */
export default function SalesAnalysisSection({ analysis }) {
    const [metric, setMetric] = useState('revenue');
    if (!analysis) return null;

    const { kpis, period, restock, restock_summary: summary, current_season: cs, products } = analysis;
    const priority = restock.filter((r) => ['urgent', 'restock'].includes(r.decision)).slice(0, 5);
    const top = products.slice(0, 5);
    const bottom = [...products].sort((a, b) => a.units - b.units).slice(0, 5);

    return (
        <section className="bg-white rounded-lg border border-slate-200 shadow-xs">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        Analisis Penjualan &amp; Restock (12 Bulan)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {period.label} · {fmtNum(kpis.total_units)} pcs · omset {formatRpShort(kpis.total_revenue)} · margin{' '}
                        {fmtNum(kpis.margin_pct, 1)}%
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <SeasonChip season={cs.key} label={`Sekarang: ${cs.label}`} />
                    <Link
                        href={route('purchase.sales-analysis.index')}
                        className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                        Analisis lengkap
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <div className="p-5 space-y-5">
                <InsightCards insights={analysis.insights} limit={3} compact />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Tren bulanan */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
                                Penjualan per Bulan
                            </h3>
                            <Segmented
                                options={[
                                    { value: 'revenue', label: 'Omset' },
                                    { value: 'units', label: 'Pcs' },
                                ]}
                                value={metric}
                                onChange={setMetric}
                            />
                        </div>
                        <MonthlyChart monthly={analysis.monthly} metric={metric} height={170} />
                    </div>

                    {/* Ringkasan restock */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                            <PackagePlus className="h-3.5 w-3.5 text-slate-500" />
                            Kebutuhan Restock 60 Hari
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {['urgent', 'restock', 'ok', 'hold'].map((k) => (
                                <div key={k} className="rounded border border-slate-200 bg-white px-2.5 py-1.5">
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                        <span className={`h-1.5 w-1.5 rounded-full ${DECISION_STYLE[k].dot}`} />
                                        {DECISION_STYLE[k].label}
                                    </div>
                                    <div className="text-base font-black text-slate-900">{summary[k]} <span className="text-[10px] font-normal text-slate-400">SKU</span></div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-600 mb-2">
                            Perkiraan dana pembelian: <b className="text-slate-900">{formatRpShort(summary.total_cost)}</b> ({fmtNum(summary.total_qty)} pcs)
                        </p>
                        <ul className="divide-y divide-slate-200 border-t border-slate-200">
                            {priority.map((r) => (
                                <li key={r.sku} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                                    <span className="truncate">
                                        <span className="font-semibold text-slate-800">{r.name}</span>{' '}
                                        <span className="text-slate-500">{r.size}/{r.color}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <b className="text-slate-900">{fmtNum(r.suggest_qty)} pcs</b>
                                        <DecisionBadge decision={r.decision} />
                                    </span>
                                </li>
                            ))}
                            {priority.length === 0 && <li className="py-2 text-[11px] text-slate-500">Semua stok mencukupi.</li>}
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-3">
                        <h3 className="text-xs font-bold text-slate-800 mb-2">Model Mana Laku di Musim Apa?</h3>
                        <SeasonMatrix matrix={analysis.season_matrix} seasons={analysis.seasons} currentSeason={cs.key} nextSeason={cs.next_key} />
                    </div>
                    <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                        <RankList title="Paling Laku" icon={Award} items={top} tone="emerald" />
                        <RankList title="Kurang Laku" icon={ThumbsDown} items={bottom} tone="rose" />
                    </div>
                </div>
            </div>
        </section>
    );
}
