import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    TrendingUp,
    TrendingDown,
    PackagePlus,
    CalendarRange,
    Award,
    ThumbsDown,
    HelpCircle,
    ChevronDown,
    ShoppingBag,
    Package,
    Wallet,
    Percent,
    Sparkles,
    Truck,
} from 'lucide-react';
import {
    InsightCards,
    MonthlyChart,
    SeasonMatrix,
    SeasonChip,
    ClassBadge,
    DecisionBadge,
    DECISION_STYLE,
    RankList,
    Sparkline,
    Segmented,
    formatRp,
    formatRpShort,
    fmtNum,
} from '@/Components/SalesAnalytics';

const TABS = [
    { key: 'restock', label: 'Rekomendasi Restock', icon: PackagePlus },
    { key: 'season', label: 'Tren & Musim', icon: CalendarRange },
    { key: 'products', label: 'Laku vs Kurang Laku', icon: Award },
];

export default function Index({ analysis, horizons = [30, 60, 90], tab: initialTab = 'restock' }) {
    const [tab, setTab] = useState(initialTab);
    const [showHelp, setShowHelp] = useState(false);
    const { kpis, period, restock_summary: summary, current_season: cs } = analysis;

    const changeTab = (key) => {
        setTab(key);
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', key);
            window.history.replaceState(window.history.state, '', url);
        } catch {
            /* abaikan */
        }
    };

    return (
        <PurchaseLayout
            title="Analisis Penjualan & Restock"
            breadcrumbs={[
                { label: 'Laporan', href: route('purchase.sales-analysis.index') },
                { label: 'Analisis Penjualan & Restock' },
            ]}
        >
            <Head title="Analisis Penjualan & Restock — Bara Wear" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                        Analisis Penjualan &amp; Restock
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Data 12 bulan ({period.label}) dari penjualan kasir (POS) &amp; grosir. Dipakai sebagai dasar memutuskan apa yang
                        perlu dibeli, berapa banyak, dan kapan.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <SeasonChip season={cs.key} label={`Sekarang: ${cs.label}`} />
                    <button
                        type="button"
                        onClick={() => setShowHelp((v) => !v)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Cara pakai
                        <ChevronDown className={`h-3 w-3 transition ${showHelp ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {showHelp && (
                <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {[
                        ['1', 'Baca ringkasan', 'Kotak berwarna di bawah merangkum musim sekarang, musim berikutnya, dan produk yang perlu perhatian.'],
                        ['2', 'Cek rekomendasi', `Tab "Rekomendasi Restock" menghitung kebutuhan ${analysis.horizon_days} hari ke depan berdasarkan pola musim & tren. Mulai dari yang merah (Restock Segera).`],
                        ['3', 'Buat RFQ', 'Klik "Buat RFQ" pada kartu vendor — form pembelian terisi otomatis dengan jumlah saran, tinggal disesuaikan.'],
                    ].map(([n, t, d]) => (
                        <div key={n} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-black text-[11px]">{n}</span>
                            <div>
                                <p className="font-bold text-slate-900">{t}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">{d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Insight */}
            <div className="mb-5">
                <InsightCards insights={analysis.insights} />
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <Kpi icon={Package} label="Total Terjual (12 bln)" value={`${fmtNum(kpis.total_units)} pcs`} sub={`±${fmtNum(kpis.avg_monthly_units)} pcs / bulan`} />
                <Kpi icon={Wallet} label="Omset (sebelum PPN)" value={formatRpShort(kpis.total_revenue)} sub={`Bulan terbaik: ${kpis.best_month ?? '—'}`} />
                <Kpi icon={Percent} label="Laba Kotor" value={formatRpShort(kpis.total_profit)} sub={`Margin ${fmtNum(kpis.margin_pct, 1)}%`} />
                <Kpi icon={Sparkles} label="Musim Paling Ramai" value={kpis.peak_season ?? '—'} sub="Rata-rata pcs/minggu tertinggi" small />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-4">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => changeTab(t.key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer ${
                                active ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon className={`h-3.5 w-3.5 ${active ? 'text-amber-600' : ''}`} />
                            {t.label}
                            {t.key === 'restock' && summary.urgent + summary.restock > 0 && (
                                <span className="rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">{summary.urgent + summary.restock}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {tab === 'restock' && <RestockTab analysis={analysis} horizons={horizons} />}
            {tab === 'season' && <SeasonTab analysis={analysis} />}
            {tab === 'products' && <ProductsTab analysis={analysis} />}
        </PurchaseLayout>
    );
}

function Kpi({ icon: Icon, label, value, sub, small = false }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>{label}</span>
                <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className={`${small ? 'text-base' : 'text-xl'} font-black text-slate-900 mt-1`}>{value}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
        </div>
    );
}

// ── Tab 1: Rekomendasi Restock ───────────────────────────────────
function RestockTab({ analysis, horizons }) {
    const { restock, restock_summary: summary, horizon_days: horizon } = analysis;
    const [filter, setFilter] = useState('need');

    const filters = [
        { key: 'need', label: 'Perlu dibeli', count: summary.urgent + summary.restock },
        { key: 'urgent', label: DECISION_STYLE.urgent.label, count: summary.urgent },
        { key: 'restock', label: DECISION_STYLE.restock.label, count: summary.restock },
        { key: 'ok', label: DECISION_STYLE.ok.label, count: summary.ok },
        { key: 'hold', label: DECISION_STYLE.hold.label, count: summary.hold },
        { key: 'all', label: 'Semua', count: restock.length },
    ];

    const rows = restock.filter((r) =>
        filter === 'all' ? true : filter === 'need' ? ['urgent', 'restock'].includes(r.decision) : r.decision === filter
    );

    const byVendor = useMemo(() => {
        const map = new Map();
        rows.forEach((r) => {
            if (!map.has(r.vendor_id)) map.set(r.vendor_id, { vendor_id: r.vendor_id, vendor_name: r.vendor_name, rows: [] });
            map.get(r.vendor_id).rows.push(r);
        });
        return [...map.values()];
    }, [rows]);

    const changeHorizon = (h) =>
        router.get(route('purchase.sales-analysis.index'), { horizon: h, tab: 'restock' }, { preserveScroll: true, preserveState: true });

    return (
        <div>
            {/* Kontrol */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Rencanakan stok untuk:</span>
                    <Segmented
                        options={horizons.map((h) => ({ value: h, label: `${h} hari` }))}
                        value={horizon}
                        onChange={changeHorizon}
                    />
                </div>
                <div className="text-xs text-slate-600">
                    Total saran beli: <b className="text-slate-900">{fmtNum(summary.total_qty)} pcs</b> · estimasi{' '}
                    <b className="text-slate-900">{formatRp(summary.total_cost)}</b>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition cursor-pointer ${
                            filter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {DECISION_STYLE[f.key] && <span className={`h-2 w-2 rounded-full ${DECISION_STYLE[f.key].dot}`} />}
                        {f.label}
                        <span className={filter === f.key ? 'text-slate-300' : 'text-slate-400'}>{f.count}</span>
                    </button>
                ))}
            </div>

            {byVendor.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                    Tidak ada produk pada kategori ini.
                </div>
            ) : (
                <div className="space-y-4">
                    {byVendor.map((v) => (
                        <VendorCard key={v.vendor_id} vendor={v} horizon={horizon} />
                    ))}
                </div>
            )}

            <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
                <b>Cara hitung:</b> rata-rata penjualan harian 12 bulan × pola musim {horizon} hari ke depan × tren 60 hari terakhir, ditambah
                stok pengaman 15%, lalu dikurangi stok tersedia (gudang + gerai) dan barang yang sudah dipesan (PO terkonfirmasi).
            </p>
        </div>
    );
}

function VendorCard({ vendor, horizon }) {
    const buyRows = vendor.rows.filter((r) => r.suggest_qty > 0);
    const totalQty = buyRows.reduce((a, r) => a + r.suggest_qty, 0);
    const totalCost = buyRows.reduce((a, r) => a + r.est_cost, 0);
    const rfqHref =
        buyRows.length > 0
            ? route('purchase.orders.create', {
                vendor_id: vendor.vendor_id,
                items: buyRows.map((r) => `${r.sku}:${r.suggest_qty}`).join(','),
                notes: `Restock berdasarkan Analisis Penjualan (kebutuhan ${horizon} hari)`,
            })
            : null;

    return (
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                    <Truck className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 truncate">{vendor.vendor_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{vendor.vendor_id}</span>
                </div>
                <div className="flex items-center gap-3">
                    {buyRows.length > 0 && (
                        <span className="text-[11px] text-slate-600">
                            {fmtNum(totalQty)} pcs · <b>{formatRpShort(totalCost)}</b>
                        </span>
                    )}
                    {rfqHref ? (
                        <Link
                            href={rfqHref}
                            className="inline-flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                        >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Buat RFQ ({buyRows.length} item)
                        </Link>
                    ) : (
                        <span className="text-[11px] text-slate-400">Tidak ada yang perlu dibeli</span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-2">Produk</th>
                            <th className="px-3 py-2 text-center">Terjual 30 hr</th>
                            <th className="px-3 py-2 text-center">Butuh {horizon} hr</th>
                            <th className="px-3 py-2 text-center">Stok Ada</th>
                            <th className="px-3 py-2 text-center">Cukup Untuk</th>
                            <th className="px-3 py-2 text-center">Saran Beli</th>
                            <th className="px-4 py-2">Keputusan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vendor.rows.map((r) => (
                            <tr key={r.sku} className="hover:bg-slate-50/60 align-top">
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                    <div className="font-semibold text-slate-900">
                                        {r.name} <span className="font-normal text-slate-500">{r.size} / {r.color}</span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] text-slate-400">{r.sku}</span>
                                        <ClassBadge cls={r.class} />
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{fmtNum(r.units_30)}</div>
                                    <div className="text-[10px] text-slate-400">±{fmtNum(r.avg_monthly, 1)}/bln</div>
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{fmtNum(r.forecast)}</div>
                                    {r.season_factor >= 1.25 && <div className="text-[10px] font-semibold text-emerald-700">musim ramai</div>}
                                    {r.season_factor <= 0.8 && <div className="text-[10px] font-semibold text-slate-500">musim sepi</div>}
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{fmtNum(r.available)}</div>
                                    {r.incoming > 0 && <div className="text-[10px] text-sky-700">+{fmtNum(r.incoming)} dalam PO</div>}
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <CoverBar days={r.cover_days} horizon={horizon} />
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    {r.suggest_qty > 0 ? (
                                        <>
                                            <div className="text-sm font-black text-slate-900">{fmtNum(r.suggest_qty)}</div>
                                            <div className="text-[10px] text-slate-400">{formatRpShort(r.est_cost)}</div>
                                        </>
                                    ) : (
                                        <span className="text-slate-300">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-2.5 min-w-[220px]">
                                    <DecisionBadge decision={r.decision} />
                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{r.reason}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CoverBar({ days, horizon }) {
    if (days === null || days === undefined) return <span className="text-slate-400">—</span>;
    const pct = Math.min(100, (days / horizon) * 100);
    const color = days < 14 ? 'bg-rose-500' : days < horizon ? 'bg-amber-400' : 'bg-emerald-500';
    return (
        <div className="w-20 mx-auto">
            <div className={`font-bold ${days < 14 ? 'text-rose-700' : 'text-slate-900'}`}>{days > 365 ? '> 1 thn' : `${fmtNum(days)} hari`}</div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ── Tab 2: Tren & Musim ──────────────────────────────────────────
function SeasonTab({ analysis }) {
    const [metric, setMetric] = useState('units');
    const { monthly, seasons, season_matrix: matrix, current_season: cs } = analysis;

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Penjualan per Bulan</h3>
                    <Segmented
                        options={[
                            { value: 'units', label: 'Jumlah (pcs)' },
                            { value: 'revenue', label: 'Omset (Rp)' },
                        ]}
                        value={metric}
                        onChange={setMetric}
                    />
                </div>
                <MonthlyChart monthly={monthly} metric={metric} height={190} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900">Model Mana Laku di Musim Apa?</h3>
                <p className="text-[11px] text-slate-500 mb-3">
                    Gunakan tabel ini untuk memutuskan model mana yang perlu stok lebih banyak menjelang musim tertentu.
                </p>
                <SeasonMatrix matrix={matrix} seasons={seasons} currentSeason={cs.key} nextSeason={cs.next_key} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {seasons.map((s) => (
                    <div key={s.key} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                        <SeasonChip season={s.key} label={s.label} />
                        <p className="text-[10px] text-slate-400 mt-1.5">{s.range ?? s.period}</p>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-lg font-black text-slate-900">{fmtNum(s.units_per_week, 1)}</span>
                            <span className="text-[11px] text-slate-500">pcs / minggu</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {fmtNum(s.units)} pcs · {formatRpShort(s.revenue)} · {s.days} hari
                        </p>
                        {s.top_products.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Terlaris</p>
                                {s.top_products.map((p) => (
                                    <p key={p.sku} className="text-[11px] text-slate-700 truncate">
                                        {p.name} <span className="text-slate-400">{p.variant}</span> — <b>{fmtNum(p.units)}</b>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Tab 3: Laku vs Kurang Laku ───────────────────────────────────
function ProductsTab({ analysis }) {
    const { products, monthly } = analysis;
    const top = products.slice(0, 5);
    const bottom = [...products].sort((a, b) => a.units - b.units).slice(0, 5);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RankList title="5 Produk Paling Laku" icon={Award} items={top} tone="emerald" />
                <RankList title="5 Produk Paling Kurang Laku" icon={ThumbsDown} items={bottom} tone="rose" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-900">Peringkat Semua Produk (12 bulan)</h3>
                    <p className="text-[11px] text-slate-500">
                        Tren = penjualan 60 hari terakhir dibanding pola musimannya. Grafik kecil = penjualan per bulan ({monthly[0]?.label} – {monthly[monthly.length - 1]?.label}).
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-2">#</th>
                                <th className="px-3 py-2">Produk</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right">Terjual</th>
                                <th className="px-3 py-2 text-right">Rata² / bln</th>
                                <th className="px-3 py-2 text-center">Tren</th>
                                <th className="px-3 py-2">Pola 12 bln</th>
                                <th className="px-3 py-2 text-right">Kontribusi</th>
                                <th className="px-3 py-2 text-right">Omset</th>
                                <th className="px-4 py-2 text-right">Laba (margin)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((p, i) => (
                                <tr key={p.sku} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="font-semibold text-slate-900">
                                            {p.name} <span className="font-normal text-slate-500">{p.size} / {p.color}</span>
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-400">{p.sku}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center"><ClassBadge cls={p.class} /></td>
                                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">{fmtNum(p.units)} pcs</td>
                                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{fmtNum(p.avg_monthly, 1)}</td>
                                    <td className="px-3 py-2.5 text-center whitespace-nowrap"><TrendTag pct={p.trend_pct} /></td>
                                    <td className="px-3 py-2.5">
                                        <Sparkline
                                            values={p.monthly}
                                            className={p.class === 'kurang_laku' ? 'text-rose-400' : p.class === 'terlaris' ? 'text-emerald-600' : 'text-slate-500'}
                                        />
                                    </td>
                                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{fmtNum(p.share_pct, 1)}%</td>
                                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{formatRpShort(p.revenue)}</td>
                                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                        {formatRpShort(p.profit)} <span className="text-slate-400">({fmtNum(p.margin_pct, 1)}%)</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function TrendTag({ pct }) {
    if (pct >= 15)
        return (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
                <TrendingUp className="h-3 w-3" /> +{pct}%
            </span>
        );
    if (pct <= -15)
        return (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700">
                <TrendingDown className="h-3 w-3" /> {pct}%
            </span>
        );
    return <span className="text-[11px] text-slate-400">stabil</span>;
}
