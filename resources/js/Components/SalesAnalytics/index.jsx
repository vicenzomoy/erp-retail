import React from 'react';
import {
    CloudRain,
    CalendarClock,
    PackagePlus,
    Award,
    TrendingUp,
    Sun,
    Moon,
    Gift,
    GraduationCap,
    Info,
} from 'lucide-react';

// ── Format helpers ────────────────────────────────────────────────
export const formatRp = (n) => 'Rp ' + Math.round(Number(n || 0)).toLocaleString('id-ID');

export const formatRpShort = (n) => {
    const v = Number(n || 0);
    if (Math.abs(v) >= 1e9) return 'Rp ' + (v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
    if (Math.abs(v) >= 1e6) return 'Rp ' + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    if (Math.abs(v) >= 1e3) return 'Rp ' + (v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' rb';
    return formatRp(v);
};

export const fmtNum = (n, digits = 0) =>
    Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: digits });

// ── Musim ─────────────────────────────────────────────────────────
export const SEASON_STYLE = {
    lebaran: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Moon, short: 'Lebaran' },
    akhir_tahun: { bar: 'bg-violet-500', chip: 'bg-violet-50 text-violet-800 border-violet-200', icon: Gift, short: 'Akhir Tahun' },
    ajaran_baru: { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-800 border-sky-200', icon: GraduationCap, short: 'Ajaran Baru' },
    hujan: { bar: 'bg-indigo-400', chip: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: CloudRain, short: 'Hujan' },
    kemarau: { bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-800 border-amber-200', icon: Sun, short: 'Kemarau' },
};

export function SeasonChip({ season, label }) {
    const st = SEASON_STYLE[season] ?? SEASON_STYLE.hujan;
    const Icon = st.icon;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${st.chip}`}>
            <Icon className="h-3 w-3" />
            {label ?? st.short}
        </span>
    );
}

// ── Badge kelas laku & keputusan restock ─────────────────────────
const CLASS_STYLE = {
    terlaris: ['Terlaris', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
    normal: ['Normal', 'bg-slate-50 text-slate-700 border-slate-200'],
    kurang_laku: ['Kurang Laku', 'bg-rose-50 text-rose-800 border-rose-200'],
};

export function ClassBadge({ cls }) {
    const [label, style] = CLASS_STYLE[cls] ?? CLASS_STYLE.normal;
    return <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${style}`}>{label}</span>;
}

export const DECISION_STYLE = {
    urgent: { label: 'Restock Segera', style: 'bg-rose-600 text-white border-rose-600', dot: 'bg-rose-500' },
    restock: { label: 'Perlu Restock', style: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
    ok: { label: 'Stok Cukup', style: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    hold: { label: 'Jangan Restock', style: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' },
};

export function DecisionBadge({ decision }) {
    const d = DECISION_STYLE[decision] ?? DECISION_STYLE.ok;
    return <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${d.style}`}>{d.label}</span>;
}

// ── Insight cards ─────────────────────────────────────────────────
const INSIGHT_STYLE = {
    season: { icon: CloudRain, tone: 'border-indigo-200 bg-indigo-50/60', iconTone: 'text-indigo-600' },
    upcoming: { icon: CalendarClock, tone: 'border-violet-200 bg-violet-50/60', iconTone: 'text-violet-600' },
    restock: { icon: PackagePlus, tone: 'border-rose-200 bg-rose-50/60', iconTone: 'text-rose-600' },
    best: { icon: Award, tone: 'border-emerald-200 bg-emerald-50/60', iconTone: 'text-emerald-600' },
    trend: { icon: TrendingUp, tone: 'border-amber-200 bg-amber-50/60', iconTone: 'text-amber-600' },
};

export function InsightCards({ insights = [], limit, compact = false }) {
    const list = limit ? insights.slice(0, limit) : insights;
    return (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {list.map((ins, i) => {
                const st = INSIGHT_STYLE[ins.type] ?? INSIGHT_STYLE.season;
                const Icon = st.icon;
                return (
                    <div key={i} className={`rounded-lg border p-3.5 ${st.tone}`}>
                        <div className="flex items-start gap-2.5">
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${st.iconTone}`} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900">{ins.title}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{ins.text}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Grafik penjualan bulanan (bar berwarna per musim) ────────────
export function MonthlyChart({ monthly = [], metric = 'units', height = 160 }) {
    const values = monthly.map((m) => Number(metric === 'revenue' ? m.revenue : m.units));
    const max = Math.max(1, ...values);
    const seasonsInChart = [...new Set(monthly.map((m) => m.season))];

    return (
        <div>
            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
                {monthly.map((m, i) => {
                    const v = values[i];
                    const h = Math.max(2, (v / max) * (height - 22));
                    const st = SEASON_STYLE[m.season] ?? SEASON_STYLE.hujan;
                    const label = metric === 'revenue' ? formatRpShort(v) : `${fmtNum(v)} pcs`;
                    return (
                        <div key={m.key} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                            <span className="text-[9px] font-semibold text-slate-500 mb-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 sm:opacity-100 transition">
                                {metric === 'revenue' ? formatRpShort(v).replace('Rp ', '') : fmtNum(v)}
                            </span>
                            <div
                                title={`${m.label}: ${label}${m.partial ? ' (bulan belum penuh)' : ''}`}
                                className={`w-full rounded-t ${st.bar} ${m.partial ? 'opacity-40' : ''} group-hover:brightness-110 transition`}
                                style={{ height: h }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-1.5 sm:gap-2 mt-1 border-t border-slate-200 pt-1">
                {monthly.map((m) => (
                    <div key={m.key} className="flex-1 min-w-0 text-center text-[9px] sm:text-[10px] text-slate-500 truncate">
                        {m.label}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-slate-500">
                {seasonsInChart.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-sm ${SEASON_STYLE[s]?.bar}`} />
                        {SEASON_STYLE[s]?.short}
                    </span>
                ))}
                {monthly.some((m) => m.partial) && <span className="text-slate-400">· Pudar = bulan belum penuh</span>}
            </div>
        </div>
    );
}

// ── Matriks Model × Musim ────────────────────────────────────────
const indexTone = (x) => {
    if (x >= 1.5) return 'bg-emerald-500 text-white';
    if (x >= 1.15) return 'bg-emerald-100 text-emerald-900';
    if (x > 0.85) return 'bg-slate-50 text-slate-700';
    if (x > 0.6) return 'bg-rose-50 text-rose-800';
    return 'bg-rose-200 text-rose-900';
};

export function SeasonMatrix({ matrix = [], seasons = [], currentSeason, nextSeason }) {
    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1">
                    <thead>
                        <tr>
                            <th className="text-left px-2 py-1 text-[11px] font-bold text-slate-600">Model</th>
                            {seasons.map((s) => (
                                <th key={s.key} className="px-1 py-1 text-center font-normal">
                                    <SeasonChip season={s.key} />
                                    {(s.key === currentSeason || s.key === nextSeason) && (
                                        <div className="text-[9px] font-bold uppercase text-slate-500 mt-0.5">
                                            {s.key === currentSeason ? 'Sekarang' : 'Berikutnya'}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row) => (
                            <tr key={row.model}>
                                <td className="px-2 py-1.5 font-semibold text-slate-800 whitespace-nowrap">{row.model}</td>
                                {row.cells.map((c) => (
                                    <td
                                        key={c.season}
                                        title={`${row.model} saat ${SEASON_STYLE[c.season]?.short}: ±${fmtNum(c.units_per_week, 1)} pcs/minggu`}
                                        className={`rounded text-center px-2 py-1.5 ${indexTone(c.index)} ${
                                            c.season === currentSeason || c.season === nextSeason ? 'ring-2 ring-slate-400/60' : ''
                                        }`}
                                    >
                                        <div className="font-black">{fmtNum(c.index, 1)}×</div>
                                        <div className="text-[9px] opacity-80">{fmtNum(c.units_per_week, 1)}/mgg</div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                <Info className="h-3.5 w-3.5 mt-px shrink-0" />
                <span>
                    Angka = seberapa laku model itu di musim tersebut dibanding rata-ratanya. <b>2,0×</b> = dua kali lebih laku (stok perlu
                    lebih banyak), <b>0,5×</b> = hanya separuh (kurangi pembelian). Hijau tua = musim terbaik.
                </span>
            </p>
        </div>
    );
}

// ── Sparkline ────────────────────────────────────────────────────
export function Sparkline({ values = [], width = 80, height = 22, className = 'text-slate-500' }) {
    if (values.length < 2) return null;
    const max = Math.max(1, ...values);
    const step = width / (values.length - 1);
    const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 4)).toFixed(1)}`).join(' ');
    return (
        <svg width={width} height={height} className={className} aria-hidden="true">
            <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ── Daftar ringkas terlaris / kurang laku ────────────────────────
export function RankList({ title, icon: Icon, items = [], tone = 'emerald', emptyText = 'Tidak ada data.' }) {
    const toneCls = tone === 'rose' ? 'text-rose-600' : 'text-emerald-600';
    const max = Math.max(1, ...items.map((i) => i.units));
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                {Icon && <Icon className={`h-4 w-4 ${toneCls}`} />}
                {title}
            </h3>
            {items.length === 0 ? (
                <p className="text-[11px] text-slate-400">{emptyText}</p>
            ) : (
                <ol className="space-y-2.5">
                    {items.map((p, i) => (
                        <li key={p.sku} className="text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate">
                                    <span className="text-slate-400 font-mono mr-1.5">{i + 1}.</span>
                                    <span className="font-semibold text-slate-800">{p.name}</span>
                                    <span className="text-slate-500"> {p.size}/{p.color}</span>
                                </span>
                                <span className="font-bold text-slate-900 whitespace-nowrap">{fmtNum(p.units)} pcs</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${tone === 'rose' ? 'bg-rose-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${(p.units / max) * 100}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

// ── Tombol pilihan segmented kecil ───────────────────────────────
export function Segmented({ options, value, onChange }) {
    return (
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        value === o.value ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
