import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    Award,
    TrendingUp,
    Package,
    Receipt,
    Search,
    ExternalLink,
    Store,
    ShoppingCart,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function GrossProfit({ kpiSummary, report }) {
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'transactions'
    const [searchQuery, setSearchQuery] = useState('');

    const handlePeriodChange = (p) => {
        router.get(
            route('owner.reports.gross-profit'),
            { period: p },
            { preserveState: true, preserveScroll: true }
        );
    };

    const filteredProducts = (report.products || []).filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTransactions = (report.transactions || []).filter(
        (t) =>
            t.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <OwnerLayout
            title="Laba Kotor & Analisis HPP"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Laba Kotor' },
            ]}
        >
            <Head title="Rincian Laba Kotor & Analisis HPP - Executive Dashboard" />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="gross-profit"
                title="Rincian Laba Kotor & Analisis HPP Produk"
                subtitle="Rincian produk terjual, perbandingan harga jual terhadap Harga Pokok Produksi (HPP modul Inventory), dan selisih margin keuntungan."
                dateBadge={report.period_label}
            />

            {/* Period Selector Bar */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Filter Periode:</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => handlePeriodChange('mtd')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${
                                report.period === 'mtd'
                                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Bulan Ini (MTD)
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePeriodChange('today')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${
                                report.period === 'today'
                                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePeriodChange('all')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition ${
                                report.period === 'all'
                                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Semua Periode
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info className="h-4 w-4 text-amber-600" />
                    <span>
                        HPP dihitung otomatis berdasarkan data <strong>Biaya Pokok Standar (Cost)</strong> dari Modul Inventory.
                    </span>
                </div>
            </div>

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Penjualan (Omset)</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{formatRp(report.kpis.total_revenue)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nilai kotor penjualan</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total HPP (Modal Barang)</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">{formatRp(report.kpis.total_cogs)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Biaya modal inventory</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs bg-linear-to-br from-amber-50/40 to-white">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Total Laba Kotor</p>
                    <p className="text-xl font-black text-amber-700 mt-1">{formatRp(report.kpis.gross_profit)}</p>
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">Harga Jual - Biaya Pokok (HPP)</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Margin Laba Kotor</p>
                    <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <p className="text-xl font-bold text-emerald-700">
                            {report.kpis.overall_margin_pct}%
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Rasio laba terhadap omset</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jumlah SKU Terjual</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{report.kpis.products_count} SKU</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Variasi produk aktif</p>
                </div>
            </div>

            {/* Tab Switches & Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md">
                    <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                            activeTab === 'products'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Package className="h-3.5 w-3.5 text-amber-600" />
                        <span>Rincian Laba Kotor per Produk ({report.products.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                            activeTab === 'transactions'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Receipt className="h-3.5 w-3.5 text-blue-600" />
                        <span>Rincian Baris Transaksi ({report.transactions.length})</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari SKU, nama produk, atau pelanggan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            </div>

            {/* TAB 1: PRODUCT MARGINS BREAKDOWN */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Analisis Laba Kotor per Produk & Perbandingan HPP
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                HPP diambil dari data Biaya Pokok Inventory. Selisih margin dihitung dari (Rata-rata Harga Jual - HPP).
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredProducts.length} Produk
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">SKU</th>
                                    <th className="py-2.5 px-3">Nama Produk</th>
                                    <th className="py-2.5 px-2 text-center">Ukuran / Warna</th>
                                    <th className="py-2.5 px-3 text-right">Qty Terjual</th>
                                    <th className="py-2.5 px-3 text-right">Rata-rata Harga Jual</th>
                                    <th className="py-2.5 px-3 text-right text-rose-800 bg-rose-50/50">HPP (Modal Inventory)</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800 bg-emerald-50/50">Selisih Margin/Unit</th>
                                    <th className="py-2.5 px-3 text-right">Total Penjualan</th>
                                    <th className="py-2.5 px-3 text-right text-rose-700">Total HPP</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-amber-900 bg-amber-50">Laba Kotor (Rp)</th>
                                    <th className="py-2.5 px-2 text-right">Margin %</th>
                                    <th className="py-2.5 px-3 text-center">Modul Inventory</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((p) => {
                                        const isPositive = p.unit_margin >= 0;
                                        return (
                                            <tr key={p.sku} className="hover:bg-slate-50 transition">
                                                <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-900">
                                                    {p.sku}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                                    {p.name}
                                                </td>
                                                <td className="py-2.5 px-2 text-center text-slate-500">
                                                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                                                        {p.size} / {p.color}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                                                    {p.qty_sold.toLocaleString('id-ID')} {p.unit}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-slate-700">
                                                    {formatRp(p.avg_sales_price)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-medium text-rose-800 bg-rose-50/20">
                                                    {formatRp(p.cost_price)}
                                                </td>
                                                <td className={`py-2.5 px-3 text-right font-bold bg-emerald-50/20 ${
                                                    isPositive ? 'text-emerald-700' : 'text-rose-700'
                                                }`}>
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        {isPositive ? (
                                                            <ArrowUpRight className="h-3 w-3 text-emerald-600 inline" />
                                                        ) : (
                                                            <ArrowDownRight className="h-3 w-3 text-rose-600 inline" />
                                                        )}
                                                        <span>{formatRp(p.unit_margin)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-slate-800 font-medium">
                                                    {formatRp(p.total_revenue)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-rose-700">
                                                    {formatRp(p.total_cogs)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-bold text-amber-900 bg-amber-50/50">
                                                    {formatRp(p.gross_profit)}
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                                                    {p.margin_pct}%
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Link
                                                        href={p.inventory_url}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                                        title="Lihat Data Master & HPP di Modul Inventory"
                                                    >
                                                        <span>Buka HPP</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="py-8 text-center text-slate-400">
                                            Tidak ada data produk pada periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Grand Total:
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-800">
                                        {filteredProducts.reduce((sum, p) => sum + p.qty_sold, 0).toLocaleString('id-ID')} pcs
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-3 px-3 text-right text-slate-900 font-black">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.total_revenue, 0))}
                                    </td>
                                    <td className="py-3 px-3 text-right text-rose-800 font-black">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.total_cogs, 0))}
                                    </td>
                                    <td className="py-3 px-4 text-right text-amber-900 bg-amber-100 font-black">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.gross_profit, 0))}
                                    </td>
                                    <td className="py-3 px-2 text-right text-emerald-800 font-black">
                                        {report.kpis.overall_margin_pct}%
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: DETAILED TRANSACTIONS */}
            {activeTab === 'transactions' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Transaksi Penjualan per Baris Item
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Data baris item transaksi SO (B2B) dan POS (Toko) beserta harga jual, HPP, margin, dan keuntungan.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredTransactions.length} Baris transaksi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">No Dokumen</th>
                                    <th className="py-2.5 px-3">Saluran</th>
                                    <th className="py-2.5 px-3">Tanggal</th>
                                    <th className="py-2.5 px-3">Pelanggan</th>
                                    <th className="py-2.5 px-3">Barang / SKU</th>
                                    <th className="py-2.5 px-2 text-right">Qty</th>
                                    <th className="py-2.5 px-3 text-right">Harga Jual</th>
                                    <th className="py-2.5 px-3 text-right text-rose-800">HPP Unit</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Margin/Unit</th>
                                    <th className="py-2.5 px-3 text-right">Subtotal Omset</th>
                                    <th className="py-2.5 px-3 text-right text-rose-700">Subtotal HPP</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50">Laba Baris</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t, idx) => (
                                        <tr key={`${t.doc_id}-${t.sku}-${idx}`} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                                {t.doc_id}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                                        t.channel.includes('POS')
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                    }`}
                                                >
                                                    {t.channel.includes('POS') ? (
                                                        <Store className="h-3 w-3" />
                                                    ) : (
                                                        <ShoppingCart className="h-3 w-3" />
                                                    )}
                                                    <span>{t.channel.includes('POS') ? 'POS' : 'SO'}</span>
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                                {t.date}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[140px] truncate" title={t.customer_name}>
                                                {t.customer_name}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <p className="font-semibold text-slate-900">{t.product_name}</p>
                                                <p className="font-mono text-[10px] text-slate-400">{t.sku}</p>
                                            </td>
                                            <td className="py-2.5 px-2 text-right font-bold text-slate-800">
                                                {t.qty}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-700">
                                                {formatRp(t.sales_price)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-rose-700">
                                                {formatRp(t.cost_price)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                                {formatRp(t.unit_margin)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-900 font-medium">
                                                {formatRp(t.line_revenue)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-rose-700">
                                                {formatRp(t.line_cogs)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/50">
                                                {formatRp(t.line_profit)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={t.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    <span>Lihat</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={13} className="py-8 text-center text-slate-400">
                                            Tidak ada data transaksi ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

