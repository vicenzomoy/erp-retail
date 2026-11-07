import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    Package,
    MapPin,
    Search,
    ArrowRight,
    Layers,
    Printer,
    CheckCircle2,
    DollarSign,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────
const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num || 0);

// ── Toggle Button ─────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
    return (
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
            <button
                type="button"
                onClick={() => onChange('products')}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    view === 'products'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Package className="h-3.5 w-3.5" />
                Produk &amp; Varian
            </button>
            <button
                type="button"
                onClick={() => onChange('stock')}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    view === 'stock'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <MapPin className="h-3.5 w-3.5" />
                Stok per Lokasi
            </button>
        </div>
    );
}

// ── Produk & Varian Tab ───────────────────────────────────────────
function ProductsTab({ products, filters, availableColors, availableSizes }) {
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('inventory.products.index'),
            { ...filters, search: e.target.search.value },
            { preserveState: true }
        );
    };

    const handleFilterChange = (field, val) => {
        router.get(
            route('inventory.products.index'),
            { ...filters, [field]: val },
            { preserveState: true }
        );
    };

    return (
        <>
            {/* Filter bar */}
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Cari SKU atau nama produk..."
                        className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 w-64"
                    />
                </div>

                <select
                    value={filters.color}
                    onChange={(e) => handleFilterChange('color', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                    <option value="all">Semua Warna</option>
                    {availableColors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    value={filters.size}
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                    <option value="all">Semua Ukuran</option>
                    {availableSizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                    Cari
                </button>

                {(filters.search || filters.color !== 'all' || filters.size !== 'all') && (
                    <button
                        type="button"
                        onClick={() => router.get(route('inventory.products.index'))}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Reset
                    </button>
                )}

                <span className="ml-auto text-xs text-slate-400 font-medium">
                    {products.length} SKU varian
                </span>
            </form>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-2.5">SKU Varian</th>
                                <th className="px-4 py-2.5">Nama Produk</th>
                                <th className="px-4 py-2.5 text-center">Ukuran</th>
                                <th className="px-4 py-2.5 text-center">Warna</th>
                                <th className="px-4 py-2.5 text-right">Harga Jual</th>
                                <th className="px-4 py-2.5 text-right">Biaya (Cost)</th>
                                <th className="px-4 py-2.5 text-center">On Hand</th>
                                <th className="px-4 py-2.5 text-center">Tersedia (ATP)</th>
                                <th className="px-4 py-2.5 text-right">Nilai Valuasi</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr
                                        key={p.variant_sku}
                                        className="hover:bg-violet-50/40 transition cursor-pointer group"
                                        onClick={() => router.visit(route('inventory.products.show', p.variant_sku))}
                                    >
                                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Package className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                                {p.variant_sku}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{p.name}</td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{p.size}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap text-slate-700">{p.color}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">{formatRp(p.sales_price)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">{formatRp(p.cost)}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                                            {p.on_hand} <span className="text-[10px] font-normal text-slate-400">{p.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className={`font-bold px-2 py-0.5 rounded border text-xs ${
                                                p.available <= 0
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {p.available} {p.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">{formatRp(p.valuation)}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <Link
                                                href={route('inventory.products.show', p.variant_sku)}
                                                className="inline-flex items-center gap-1 text-slate-400 hover:text-violet-700 font-medium transition"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Detail <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// ── Stok per Lokasi Tab ───────────────────────────────────────────
function StockByLocationTab({ matrix = [], locations = [], summary = {} }) {
    const [search, setSearch] = useState('');

    const filtered = matrix.filter(
        (item) =>
            item.variant_sku.toLowerCase().includes(search.toLowerCase()) ||
            item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Total On Hand</span>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                        {summary.total_on_hand} <span className="text-xs font-normal text-slate-400">PCS</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Tereservasi SO</span>
                        <Layers className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold text-amber-800">
                        {summary.total_reserved} <span className="text-xs font-normal text-amber-500">PCS</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Siap Jual (ATP)</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-emerald-800">
                        {summary.total_available} <span className="text-xs font-normal text-emerald-500">PCS</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Total Valuasi</span>
                        <DollarSign className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="text-lg font-bold text-violet-900">
                        {formatRp(summary.total_valuation)}
                    </div>
                </div>
            </div>

            {/* Filter + Print */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari SKU atau nama produk..."
                        className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 w-64"
                    />
                </div>
                <span className="text-xs text-slate-400 font-medium ml-1">{filtered.length} SKU</span>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="ml-auto inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    Cetak
                </button>
            </div>

            {/* Matrix Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="py-2.5 px-3 text-left sticky left-0 bg-slate-50 z-10" rowSpan={2}>SKU Varian</th>
                                <th className="py-2.5 px-3 text-left sticky left-24 bg-slate-50 z-10" rowSpan={2}>Nama Produk</th>
                                <th className="py-2.5 px-3 text-center sticky left-56 bg-slate-50 z-10 border-r border-slate-200" rowSpan={2}>Ukuran / Warna</th>
                                {locations.map((loc) => (
                                    <th
                                        key={loc.location_code}
                                        colSpan={3}
                                        className="py-2 px-2 text-center border-l border-slate-200 bg-violet-50 text-violet-700"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {loc.location_code}
                                        </div>
                                        <div className="text-[9px] font-normal text-slate-400">{loc.location_name}</div>
                                    </th>
                                ))}
                                <th colSpan={4} className="py-2 px-2 text-center border-l-2 border-slate-300 bg-slate-100 text-slate-600">
                                    Total Konsolidasi
                                </th>
                                <th className="py-2 px-3 text-center" rowSpan={2}></th>
                            </tr>
                            <tr>
                                {locations.map((loc) => (
                                    <React.Fragment key={`sub_${loc.location_code}`}>
                                        <th className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-normal">On Hand</th>
                                        <th className="py-1.5 px-2 text-center text-amber-600 font-normal">Res.</th>
                                        <th className="py-1.5 px-2 text-center text-emerald-600 font-normal border-r border-slate-200">Avail.</th>
                                    </React.Fragment>
                                ))}
                                <th className="py-1.5 px-2 text-center border-l-2 border-slate-300 text-slate-600 font-normal">On Hand</th>
                                <th className="py-1.5 px-2 text-center text-amber-600 font-normal">Res.</th>
                                <th className="py-1.5 px-2 text-center text-emerald-600 font-normal">Avail.</th>
                                <th className="py-1.5 px-2 text-center text-violet-600 font-normal">Nilai</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3 + locations.length * 3 + 5} className="py-10 text-center text-slate-400">
                                        Tidak ada data stok.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr key={item.variant_sku} className="hover:bg-violet-50/30 transition">
                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10">
                                            {item.variant_sku}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap sticky left-24 bg-white z-10 max-w-[140px] truncate">
                                            {item.name}
                                        </td>
                                        <td className="py-2.5 px-3 text-center sticky left-56 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700">{item.size}</span>
                                            <span className="ml-1 text-slate-500 text-[10px]">{item.color}</span>
                                        </td>

                                        {locations.map((loc) => {
                                            const s = item.locations?.[loc.location_code] ?? { on_hand: 0, reserved: 0, available: 0 };
                                            return (
                                                <React.Fragment key={`${item.variant_sku}_${loc.location_code}`}>
                                                    <td className="py-2.5 px-2 text-center text-slate-800 border-l border-slate-100">
                                                        {s.on_hand > 0 ? <span className="font-semibold">{s.on_hand}</span> : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center text-amber-700">
                                                        {s.reserved > 0 ? s.reserved : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center text-emerald-700 border-r border-slate-100">
                                                        {s.available > 0 ? <span className="font-semibold">{s.available}</span> : <span className="text-slate-300">—</span>}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Totals */}
                                        <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-slate-50/50 border-l-2 border-slate-200">
                                            {item.company_total_qty} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center font-bold text-amber-800 bg-slate-50/50">
                                            {item.company_reserved_qty > 0 ? item.company_reserved_qty : '—'}
                                        </td>
                                        <td className="py-2.5 px-2 text-center font-bold text-emerald-800 bg-slate-50/50">
                                            {item.company_available_qty} <span className="text-[10px] font-normal text-emerald-400">{item.unit}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center font-semibold text-violet-800 bg-slate-50/50">
                                            {formatRp(item.standard_value)}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                            <Link
                                                href={route('inventory.products.show', item.variant_sku)}
                                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-700 px-2 py-1 text-[11px] font-semibold transition"
                                            >
                                                Detail <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}

                            {/* Footer total row */}
                            {filtered.length > 0 && (
                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                                    <td colSpan={3} className="py-3 px-3 text-slate-700 text-right border-r border-slate-200 sticky left-0 bg-slate-100 z-10">
                                        TOTAL KONSOLIDASI:
                                    </td>
                                    {locations.map((loc) => {
                                        const totOn  = filtered.reduce((acc, r) => acc + (r.locations[loc.location_code]?.on_hand || 0), 0);
                                        const totRes = filtered.reduce((acc, r) => acc + (r.locations[loc.location_code]?.reserved || 0), 0);
                                        const totAv  = filtered.reduce((acc, r) => acc + (r.locations[loc.location_code]?.available || 0), 0);
                                        return (
                                            <React.Fragment key={`tot_${loc.location_code}`}>
                                                <td className="py-3 px-2 text-center text-slate-900 border-l border-slate-200">{totOn}</td>
                                                <td className="py-3 px-2 text-center text-amber-800">{totRes}</td>
                                                <td className="py-3 px-2 text-center text-emerald-800 border-r border-slate-200">{totAv}</td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="py-3 px-2 text-center text-slate-900 border-l-2 border-slate-300">{summary.total_on_hand} PCS</td>
                                    <td className="py-3 px-2 text-center text-amber-900">{summary.total_reserved} PCS</td>
                                    <td className="py-3 px-2 text-center text-emerald-900">{summary.total_available} PCS</td>
                                    <td className="py-3 px-2 text-center text-violet-900">{formatRp(summary.total_valuation)}</td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Index({
    products = [],
    filters = {},
    availableColors = [],
    availableSizes = [],
    matrix = [],
    locations = [],
    summary = {},
}) {
    const [view, setView] = useState('products');

    return (
        <InventoryLayout
            title="Produk & Stok"
            breadcrumbs={[{ label: 'Produk & Stok' }]}
        >
            <Head title="Produk & Stok — Bara Wear" />

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        {view === 'products' ? 'Katalog Produk & SKU Varian' : 'Matriks Stok per Lokasi'}
                    </span>
                </div>
                {/* Toggle */}
                <ViewToggle view={view} onChange={setView} />
            </div>

            {/* ── Tab Content ── */}
            {view === 'products' ? (
                <ProductsTab
                    products={products}
                    filters={filters}
                    availableColors={availableColors}
                    availableSizes={availableSizes}
                />
            ) : (
                <StockByLocationTab
                    matrix={matrix}
                    locations={locations}
                    summary={summary}
                />
            )}
        </InventoryLayout>
    );
}
