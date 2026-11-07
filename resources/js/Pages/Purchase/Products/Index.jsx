import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    Package,
    Building2,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Search,
    MapPin,
    ShoppingCart,
    ArrowRight,
    TrendingUp,
    ShieldAlert,
    X,
    Layers,
    FileText,
    Truck,
    Tag,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────
const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num || 0);

// ── Toggle View Component ─────────────────────────────────────────
function ViewToggle({ view, onChange }) {
    return (
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
            <button
                type="button"
                onClick={() => onChange('procurement')}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    view === 'procurement'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Package className="h-3.5 w-3.5 text-amber-600" />
                Katalog &amp; Harga Beli
            </button>
            <button
                type="button"
                onClick={() => onChange('location')}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    view === 'location'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <MapPin className="h-3.5 w-3.5 text-slate-600" />
                Stok per Lokasi Gudang
            </button>
        </div>
    );
}

export default function Index({
    products = [],
    filters = {},
    kpis = {},
    vendors = [],
    colors = [],
    sizes = [],
    matrix = [],
    locations = [],
    stockSummary = {},
}) {
    const [activeView, setActiveView] = useState('procurement');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('purchase.products.index'),
            {
                ...filters,
                search: e.target.search.value,
            },
            { preserveState: true }
        );
    };

    const handleFilterChange = (field, val) => {
        router.get(
            route('purchase.products.index'),
            {
                ...filters,
                [field]: val,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        router.get(route('purchase.products.index'));
    };

    const hasActiveFilters =
        filters.search ||
        (filters.vendor_id && filters.vendor_id !== 'all') ||
        (filters.stock_status && filters.stock_status !== 'all') ||
        (filters.color && filters.color !== 'all') ||
        (filters.size && filters.size !== 'all');

    return (
        <PurchaseLayout
            title="Produk & Stok Pengadaan"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Produk & Stok' },
            ]}
        >
            <Head title="Produk & Stok Pengadaan — Bara Wear" />

            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 border border-amber-200">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Katalog Produk &amp; Stok Pengadaan
                        </h1>
                        <p className="text-xs text-slate-500">
                            Pantau harga beli vendor, minimum order (MOQ), dan saldo ketersediaan barang untuk tim Procurement.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ViewToggle view={activeView} onChange={setActiveView} />
                    <Link
                        href={route('purchase.orders.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Buat RFQ Baru
                    </Link>
                </div>
            </div>

            {/* KPI Cards Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {/* Total SKU */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total SKU Produk
                        </span>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">
                        {kpis.total_sku ?? 0}{' '}
                        <span className="text-xs font-normal text-slate-400">Varian</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Siap dipesan ke vendor
                    </div>
                </div>

                {/* Reorder Needed */}
                <div
                    className={`rounded-lg border p-3.5 shadow-xs transition ${
                        (kpis.reorder_needed_count || 0) > 0
                            ? 'border-amber-300 bg-amber-50/50'
                            : 'border-slate-200 bg-white'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                            Perlu Reorder Segera
                        </span>
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-amber-900 flex items-baseline gap-2">
                        {kpis.reorder_needed_count ?? 0}
                        <span className="text-xs font-semibold text-amber-700">
                            ({kpis.out_of_stock_count ?? 0} Habis, {kpis.low_stock_count ?? 0} Menipis)
                        </span>
                    </div>
                    <div className="mt-1 text-[11px] text-amber-700">
                        Stok di bawah ambang batas (≤ 10 pcs)
                    </div>
                </div>

                {/* Total Valuation */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Valuasi Modal Stok
                        </span>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-lg font-bold text-slate-900 font-mono">
                        {formatRp(kpis.total_valuation ?? 0)}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Berdasarkan harga beli satuan
                    </div>
                </div>

                {/* Active Vendors */}
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Mitra Pemasok Aktif
                        </span>
                        <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">
                        {kpis.active_vendors_count ?? 0}{' '}
                        <span className="text-xs font-normal text-slate-400">Vendor Utama</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Terikat kontrak pengadaan
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Cari SKU, nama produk, atau nama vendor..."
                        className="w-full rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>

                {/* Filter Vendor */}
                <select
                    value={filters.vendor_id || 'all'}
                    onChange={(e) => handleFilterChange('vendor_id', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-2.5 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
                >
                    <option value="all">Semua Pemasok (Vendor)</option>
                    {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.id} — {v.name}
                        </option>
                    ))}
                </select>

                {/* Filter Status Stok */}
                <select
                    value={filters.stock_status || 'all'}
                    onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-2.5 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
                >
                    <option value="all">Semua Status Stok</option>
                    <option value="low_stock">⚠️ Perlu Reorder (≤ 10)</option>
                    <option value="out_of_stock">🚫 Stok Habis (0)</option>
                    <option value="normal">✅ Stok Aman (&gt; 10)</option>
                </select>

                {/* Filter Warna */}
                <select
                    value={filters.color || 'all'}
                    onChange={(e) => handleFilterChange('color', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-2.5 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
                >
                    <option value="all">Semua Warna</option>
                    {colors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                {/* Filter Ukuran */}
                <select
                    value={filters.size || 'all'}
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                    className="rounded border border-slate-300 bg-white pl-2.5 pr-7 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none"
                >
                    <option value="all">Semua Ukuran</option>
                    {sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                    Cari
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Reset
                    </button>
                )}

                <div className="ml-auto text-xs font-semibold text-slate-500">
                    Menampilkan {products.length} SKU varian
                </div>
            </form>

            {/* ========================================================= */}
            {/* VIEW 1: KATALOG & HARGA BELI (PROCUREMENT MAIN VIEW)      */}
            {/* ========================================================= */}
            {activeView === 'procurement' && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-3.5 py-2.5">Produk &amp; SKU</th>
                                    <th className="px-3.5 py-2.5">Pemasok Utama (Vendor)</th>
                                    <th className="px-3.5 py-2.5 text-right bg-amber-50/50 text-amber-900 border-x border-amber-100">
                                        Harga Beli (Cost)
                                    </th>
                                    <th className="px-3.5 py-2.5 text-center bg-amber-50/30">
                                        Min. Order (MOQ)
                                    </th>
                                    <th className="px-3.5 py-2.5 text-right">Harga Jual</th>
                                    <th className="px-3.5 py-2.5 text-center">Fisik (On Hand)</th>
                                    <th className="px-3.5 py-2.5 text-center">Tersedia (ATP)</th>
                                    <th className="px-3.5 py-2.5 text-center">PO Masuk</th>
                                    <th className="px-3.5 py-2.5 text-center">Status Stok</th>
                                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                                            <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            Tidak ada data produk pengadaan yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => (
                                        <tr
                                            key={p.variant_sku}
                                            className="hover:bg-amber-50/30 transition cursor-pointer group"
                                            onClick={() => setSelectedProduct(p)}
                                        >
                                            {/* SKU & Nama */}
                                            <td className="px-3.5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-mono font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                        {p.variant_sku}
                                                    </div>
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                                                        {p.size}
                                                    </span>
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                                                        {p.color}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                                                    {p.name}
                                                </div>
                                            </td>

                                            {/* Vendor */}
                                            <td className="px-3.5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                                        {p.default_vendor_id}
                                                    </span>
                                                    <span className="font-medium text-slate-900">
                                                        {p.vendor_name}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    {p.vendor_city} • {p.vendor_payment_terms}
                                                </div>
                                            </td>

                                            {/* Harga Beli Satuan (Purchase Price) */}
                                            <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-amber-900 bg-amber-50/40 border-x border-amber-100">
                                                {formatRp(p.purchase_price)}
                                            </td>

                                            {/* Min Order (MOQ) */}
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap bg-amber-50/20">
                                                <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-bold border border-amber-200">
                                                    {p.min_order_qty} {p.unit}
                                                </span>
                                            </td>

                                            {/* Harga Jual & Margin */}
                                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                <div className="font-mono text-slate-800">
                                                    {formatRp(p.sales_price)}
                                                </div>
                                                <div className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-0.5 mt-0.5">
                                                    <TrendingUp className="h-3 w-3" />
                                                    +{p.margin_pct}% margin
                                                </div>
                                            </td>

                                            {/* Fisik On Hand */}
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap font-mono font-semibold text-slate-800">
                                                {p.on_hand} <span className="text-[10px] font-normal text-slate-400">{p.unit}</span>
                                            </td>

                                            {/* Tersedia (ATP) */}
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                                                        p.available <= 0
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : p.available <= 10
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    {p.available} {p.unit}
                                                </span>
                                            </td>

                                            {/* Incoming PO */}
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap font-mono text-xs">
                                                {p.incoming > 0 ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200" title="Sedang dipesan dari PO yang sudah dikonfirmasi">
                                                        <Truck className="h-3 w-3" />
                                                        +{p.incoming}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>

                                            {/* Status Stok */}
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                {p.stock_status === 'out_of_stock' && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                                                        <AlertCircle className="h-3 w-3 text-rose-600" />
                                                        Stok Habis
                                                    </span>
                                                )}
                                                {p.stock_status === 'low_stock' && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                                                        Perlu Reorder
                                                    </span>
                                                )}
                                                {p.stock_status === 'normal' && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                        Stok Aman
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <Link
                                                        href={route('purchase.orders.create', {
                                                            vendor_id: p.default_vendor_id,
                                                            sku: p.variant_sku,
                                                        })}
                                                        className="inline-flex items-center gap-1 rounded bg-amber-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-800 transition cursor-pointer"
                                                        title={`Buat Pesanan Pembelian / RFQ ke ${p.vendor_name}`}
                                                    >
                                                        <ShoppingCart className="h-3 w-3" />
                                                        Buat RFQ
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedProduct(p)}
                                                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                                        title="Lihat Rincian Pengadaan"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: STOK PER LOKASI GUDANG (LOCATION BREAKDOWN)       */}
            {/* ========================================================= */}
            {activeView === 'location' && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Rincian Stok Produk per Lokasi Gudang &amp; Toko
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Membantu Procurement mengetahui lokasi mana yang kekurangan stok sebelum membuat PO.
                            </p>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-700">
                            Total Saldo Valuasi: {formatRp(stockSummary.total_valuation || 0)}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-3.5 py-2.5">SKU Varian &amp; Produk</th>
                                    <th className="px-3.5 py-2.5">Pemasok</th>
                                    <th className="px-3.5 py-2.5 text-right font-mono">Harga Beli</th>
                                    {locations.map((loc) => (
                                        <th key={loc.location_code} className="px-3.5 py-2.5 text-center bg-slate-50/50">
                                            {loc.location_code}
                                            <div className="text-[9px] font-normal text-slate-400 uppercase tracking-normal">
                                                {loc.location_name}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-3.5 py-2.5 text-center bg-amber-50 text-amber-900 border-l border-amber-200">
                                        Total On Hand
                                    </th>
                                    <th className="px-3.5 py-2.5 text-center bg-amber-50 text-amber-900">
                                        Total Tersedia
                                    </th>
                                    <th className="px-3.5 py-2.5 text-right bg-amber-50 text-amber-900">
                                        Nilai Stok
                                    </th>
                                    <th className="px-3.5 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {matrix.map((row) => (
                                    <tr key={row.variant_sku} className="hover:bg-slate-50/60 transition">
                                        <td className="px-3.5 py-3 whitespace-nowrap">
                                            <div className="font-mono font-bold text-slate-900">
                                                {row.variant_sku}
                                            </div>
                                            <div className="text-[11px] text-slate-600">
                                                {row.product_name} ({row.size}/{row.color})
                                            </div>
                                        </td>
                                        <td className="px-3.5 py-3 whitespace-nowrap">
                                            <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 mr-1">
                                                {row.default_vendor_id}
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {row.vendor_name}
                                            </span>
                                        </td>
                                        <td className="px-3.5 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                                            {formatRp(row.cost)}
                                        </td>

                                        {/* Per-location columns */}
                                        {locations.map((loc) => {
                                            const locData = row.locations[loc.location_code] || {};
                                            const avail = locData.available ?? 0;
                                            return (
                                                <td key={loc.location_code} className="px-3.5 py-3 text-center whitespace-nowrap">
                                                    <div className="font-mono font-bold text-slate-800">
                                                        {locData.on_hand ?? 0}
                                                    </div>
                                                    <div className={`text-[10px] font-mono ${avail <= 3 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                                                        Avail: {avail}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Company totals */}
                                        <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-900 bg-amber-50/30 border-l border-amber-100 whitespace-nowrap">
                                            {row.company_total_qty} <span className="text-[10px] font-normal text-slate-400">{row.unit}</span>
                                        </td>
                                        <td className="px-3.5 py-3 text-center whitespace-nowrap bg-amber-50/30">
                                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                                                row.company_available_qty <= 0
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : row.company_available_qty <= 10
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {row.company_available_qty} {row.unit}
                                            </span>
                                        </td>
                                        <td className="px-3.5 py-3 text-right font-mono font-bold text-amber-900 bg-amber-50/30 whitespace-nowrap">
                                            {formatRp(row.standard_value)}
                                        </td>

                                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                            <Link
                                                href={route('purchase.orders.create', {
                                                    vendor_id: row.default_vendor_id,
                                                    sku: row.variant_sku,
                                                })}
                                                className="inline-flex items-center gap-1 rounded bg-amber-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-800 transition cursor-pointer"
                                            >
                                                <ShoppingCart className="h-3 w-3" />
                                                Reorder
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                                <tr>
                                    <td colSpan={3} className="px-3.5 py-3 text-right uppercase tracking-wider text-slate-600">
                                        Total Seluruh Stok:
                                    </td>
                                    {locations.map((loc) => {
                                        const locTotal = matrix.reduce((sum, r) => sum + (r.locations[loc.location_code]?.on_hand || 0), 0);
                                        return (
                                            <td key={loc.location_code} className="px-3.5 py-3 text-center font-mono text-slate-800">
                                                {locTotal} pcs
                                            </td>
                                        );
                                    })}
                                    <td className="px-3.5 py-3 text-center font-mono text-amber-950 bg-amber-100/60 border-l border-amber-200">
                                        {stockSummary.total_on_hand || 0} pcs
                                    </td>
                                    <td className="px-3.5 py-3 text-center font-mono text-emerald-900 bg-amber-100/60">
                                        {stockSummary.total_available || 0} pcs
                                    </td>
                                    <td className="px-3.5 py-3 text-right font-mono text-amber-950 bg-amber-100/60">
                                        {formatRp(stockSummary.total_valuation || 0)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* DETAIL MODAL / DRAWER                                      */}
            {/* ========================================================= */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        {selectedProduct.variant_sku}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {selectedProduct.size} / {selectedProduct.color}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mt-1">
                                    {selectedProduct.name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="space-y-4 text-xs">
                            {/* Pemasok Info Card */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                                    Data Pemasok Utama (Vendor)
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-slate-700">
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Nama Vendor:</span>
                                        <span className="font-semibold text-slate-900">
                                            {selectedProduct.vendor_name} ({selectedProduct.default_vendor_id})
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Kota Vendor:</span>
                                        <span className="font-medium text-slate-900">{selectedProduct.vendor_city}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Termin Pembayaran:</span>
                                        <span className="font-medium text-slate-900">{selectedProduct.vendor_payment_terms}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Mata Uang:</span>
                                        <span className="font-medium text-slate-900">{selectedProduct.currency}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Harga & Minimum Order Card */}
                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-amber-700" />
                                    Ketentuan Pembelian &amp; Harga Beli
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Harga Beli Satuan (Cost):</span>
                                        <span className="font-mono text-base font-extrabold text-amber-900">
                                            {formatRp(selectedProduct.purchase_price)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Minimum Order (MOQ):</span>
                                        <span className="font-bold text-amber-900 text-sm">
                                            {selectedProduct.min_order_qty} {selectedProduct.unit}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Harga Jual Ritel:</span>
                                        <span className="font-mono text-slate-800 font-semibold">
                                            {formatRp(selectedProduct.sales_price)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[11px]">Estimasi Margin:</span>
                                        <span className="font-bold text-emerald-700">
                                            +{selectedProduct.margin_pct}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Saldo Stok */}
                            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 text-slate-600" />
                                    Saldo Stok Terkini
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                        <div className="text-[10px] text-slate-500">Stok Fisik (On Hand)</div>
                                        <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                                            {selectedProduct.on_hand} {selectedProduct.unit}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                        <div className="text-[10px] text-slate-500">Direservasi (SO)</div>
                                        <div className="font-mono font-bold text-amber-700 text-sm mt-0.5">
                                            {selectedProduct.reserved} {selectedProduct.unit}
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded border ${
                                        selectedProduct.available <= 0
                                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                                            : selectedProduct.available <= 10
                                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}>
                                        <div className="text-[10px]">Tersedia (ATP)</div>
                                        <div className="font-mono font-bold text-sm mt-0.5">
                                            {selectedProduct.available} {selectedProduct.unit}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 mt-5">
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Tutup
                            </button>
                            <Link
                                href={route('purchase.orders.create', {
                                    vendor_id: selectedProduct.default_vendor_id,
                                    sku: selectedProduct.variant_sku,
                                })}
                                className="inline-flex items-center gap-1.5 rounded bg-amber-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition cursor-pointer"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Buat RFQ untuk SKU Ini
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </PurchaseLayout>
    );
}

