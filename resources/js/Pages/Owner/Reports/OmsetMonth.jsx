import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    BarChart3,
    Package,
    Building2,
    Receipt,
    Search,
    ExternalLink,
    Store,
    ShoppingCart,
    Calendar,
    ChevronDown,
    ChevronUp,
    TrendingUp,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function OmsetMonth({ kpiSummary, report }) {
    const [activeView, setActiveView] = useState('products'); // 'products', 'customers', 'orders', 'monthly-summary'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCustomers, setExpandedCustomers] = useState({});

    const handleMonthChange = (monthKey) => {
        router.get(
            route('owner.reports.omset-month'),
            { month: monthKey },
            { preserveState: true, preserveScroll: true }
        );
    };

    const toggleCustomerExpand = (custId) => {
        setExpandedCustomers((prev) => ({
            ...prev,
            [custId]: !prev[custId],
        }));
    };

    const filteredProducts = (report.products || []).filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCustomers = (report.customers || []).filter(
        (c) =>
            c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOrders = (report.orders || []).filter(
        (o) =>
            o.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <OwnerLayout
            title="Rincian Omset Bulan Ini"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Omset Bulan Ini' },
            ]}
        >
            <Head title={`Rincian Omset ${report.selected_month_label} - Executive Dashboard`} />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="omset-month"
                title="Rincian Omset Penjualan per Bulan"
                subtitle="Analisis penjualan bulanan, perbandingan histori bulan, rincian produk terjual, dan belanja per PT/Pelanggan."
                dateBadge={report.selected_month_label}
            />

            {/* Month Filter Selector Bar */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Pilih Periode Bulan:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(report.monthly_grouping || []).map((m) => {
                            const isSelected = m.month_key === report.selected_month;
                            return (
                                <button
                                    key={m.month_key}
                                    type="button"
                                    onClick={() => handleMonthChange(m.month_key)}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {m.month_label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                    Menampilkan data periode: <span className="font-bold text-slate-900">{report.selected_month_label}</span>
                </div>
            </div>

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Omset Bulan Ini</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{formatRp(report.kpis.total_omset)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">B2B + POS Kasir</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Barang Terjual</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                        {report.kpis.total_qty.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pcs</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Semua SKU produk</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Transaksi</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{report.kpis.total_orders}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Order selesai/lunas</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jumlah PT/Pelanggan</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{report.kpis.total_customers}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customer aktif bulan ini</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Omset B2B (SO)</p>
                    <p className="text-xl font-bold text-indigo-700 mt-1">{formatRp(report.kpis.omset_b2b)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sales Order Perusahaan</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Omset POS Kasir</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">{formatRp(report.kpis.omset_pos)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Gerai Toko Fisik</p>
                </div>
            </div>

            {/* Monthly Trend Comparison Cards */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Perbandingan Omset Antar Bulan (6 Bulan Terakhir)
                        </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Klik kartu untuk beralih bulan</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(report.monthly_grouping || []).map((m) => {
                        const isCurrent = m.month_key === report.selected_month;
                        return (
                            <button
                                key={m.month_key}
                                type="button"
                                onClick={() => handleMonthChange(m.month_key)}
                                className={`text-left p-3 rounded-lg border transition ${
                                    isCurrent
                                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                            >
                                <p className="text-xs font-bold text-slate-800">{m.month_label}</p>
                                <p className="text-sm font-bold text-blue-700 mt-1">{formatRp(m.total_omset)}</p>
                                <div className="mt-2 text-[10px] space-y-0.5 text-slate-500">
                                    <div className="flex justify-between">
                                        <span>B2B:</span>
                                        <span className="font-semibold text-slate-700">{formatRp(m.omset_b2b)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>POS:</span>
                                        <span className="font-semibold text-slate-700">{formatRp(m.omset_pos)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-slate-200">
                                        <span>Order:</span>
                                        <span className="font-bold text-slate-900">{m.total_orders}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Switches & Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveView('products')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeView === 'products'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Package className="h-3.5 w-3.5 text-blue-600" />
                        <span>Rincian Barang yang Dijual ({report.products.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveView('customers')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeView === 'customers'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        <span>Rincian per PT / Pelanggan ({report.customers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveView('orders')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeView === 'orders'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Daftar Transaksi ({report.orders.length})</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari SKU, nama produk, PT, atau No Order..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* VIEW 1: PRODUCTS BREAKDOWN */}
            {activeView === 'products' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Barang Terjual - Periode {report.selected_month_label}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan total kuantitas per barang, kontribusi B2B vs POS, dan nilai nominal omset per SKU.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredProducts.length} Produk ditemukan
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">SKU</th>
                                    <th className="py-2.5 px-3">Nama Produk</th>
                                    <th className="py-2.5 px-2 text-center">Ukuran / Warna</th>
                                    <th className="py-2.5 px-3 text-right">Qty B2B (SO)</th>
                                    <th className="py-2.5 px-3 text-right">Qty POS (Kasir)</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-200/50">Total Qty</th>
                                    <th className="py-2.5 px-3 text-right">Nominal B2B</th>
                                    <th className="py-2.5 px-3 text-right">Nominal POS</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-blue-900 bg-blue-50">Total Omset Produk</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((p) => (
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
                                            <td className="py-2.5 px-3 text-right text-slate-600">
                                                {p.qty_b2b.toLocaleString('id-ID')} {p.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-600">
                                                {p.qty_pos.toLocaleString('id-ID')} {p.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-50/50">
                                                {p.total_qty.toLocaleString('id-ID')} {p.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-600">
                                                {formatRp(p.nominal_b2b)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-slate-600">
                                                {formatRp(p.nominal_pos)}
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-blue-800 bg-blue-50/50">
                                                {formatRp(p.total_nominal)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={route('inventory.products.show', p.sku)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                                    title="Lihat di Modul Inventory"
                                                >
                                                    <span>Inventori</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-slate-400">
                                            Tidak ada data barang yang terjual pada periode ini atau filter tidak cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Grand Total:
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-700">
                                        {filteredProducts.reduce((sum, p) => sum + p.qty_b2b, 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-700">
                                        {filteredProducts.reduce((sum, p) => sum + p.qty_pos, 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3 px-3 text-right bg-slate-200/50 text-slate-950 font-black">
                                        {filteredProducts.reduce((sum, p) => sum + p.total_qty, 0).toLocaleString('id-ID')} pcs
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-700">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.nominal_b2b, 0))}
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-700">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.nominal_pos, 0))}
                                    </td>
                                    <td className="py-3 px-4 text-right text-blue-900 bg-blue-100 font-black">
                                        {formatRp(filteredProducts.reduce((sum, p) => sum + p.total_nominal, 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: CUSTOMERS / PT BREAKDOWN */}
            {activeView === 'customers' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Belanja per PT / Pelanggan - Periode {report.selected_month_label}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan total barang, apa saja barangnya, dan nominal belanja dari setiap PT yang membeli dari kita bulan ini.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredCustomers.length} Pelanggan aktif
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((c) => {
                                const isExpanded = !!expandedCustomers[c.customer_id];
                                return (
                                    <div key={c.customer_id} className="transition hover:bg-slate-50/50">
                                        {/* Customer Header Row */}
                                        <div
                                            onClick={() => toggleCustomerExpand(c.customer_id)}
                                            className="px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    className="mt-0.5 p-1 rounded hover:bg-slate-200 text-slate-500"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {c.customer_name}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                            {c.customer_type}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            • {c.city}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {c.orders_count} transaksi • Terdiri dari {c.items.length} ragam produk barang
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 self-end md:self-center pl-8 md:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Barang</p>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {c.total_qty.toLocaleString('id-ID')} pcs
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Belanja (Nominal)</p>
                                                    <p className="text-sm font-bold text-blue-700">
                                                        {formatRp(c.total_nominal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible Items Detail Table */}
                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-blue-600" />
                                                    <span>Daftar Barang & Nominal yang Dibeli oleh {c.customer_name}:</span>
                                                </div>
                                                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                                                            <tr>
                                                                <th className="py-2 px-3">SKU</th>
                                                                <th className="py-2 px-3">Nama Produk / Barang</th>
                                                                <th className="py-2 px-3 text-right">Kuantitas Terjual</th>
                                                                <th className="py-2 px-3 text-right">Rata-rata Harga</th>
                                                                <th className="py-2 px-3 text-right font-bold text-slate-900">Total Nominal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {c.items.map((item) => (
                                                                <tr key={item.sku} className="hover:bg-slate-50">
                                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                                                        {item.sku}
                                                                    </td>
                                                                    <td className="py-2 px-3 font-medium text-slate-900">
                                                                        {item.name}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-slate-700">
                                                                        {item.qty.toLocaleString('id-ID')} pcs
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-slate-600">
                                                                        {formatRp(item.qty > 0 ? item.total_nominal / item.qty : 0)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-bold text-blue-700">
                                                                        {formatRp(item.total_nominal)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Tidak ada data belanja pelanggan pada periode ini.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 3: ORDERS LIST */}
            {activeView === 'orders' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Daftar Dokumen Penjualan - Periode {report.selected_month_label}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Semua Sales Order (B2B) dan Penjualan Kasir POS yang sah dan lunas.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredOrders.length} Dokumen
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">No Dokumen</th>
                                    <th className="py-2.5 px-3">Saluran</th>
                                    <th className="py-2.5 px-3">Tanggal & Waktu</th>
                                    <th className="py-2.5 px-3">Pelanggan / PT</th>
                                    <th className="py-2.5 px-3 text-right">Jumlah Barang</th>
                                    <th className="py-2.5 px-4 text-right">Grand Total</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((o) => (
                                        <tr key={o.doc_id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                                {o.doc_id}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        o.channel.includes('POS')
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                    }`}
                                                >
                                                    {o.channel.includes('POS') ? (
                                                        <Store className="h-3 w-3" />
                                                    ) : (
                                                        <ShoppingCart className="h-3 w-3" />
                                                    )}
                                                    <span>{o.channel}</span>
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {o.date} <span className="text-[10px] text-slate-400">{o.time}</span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900">
                                                {o.customer_name}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                                                {o.items_count.toLocaleString('id-ID')} pcs
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                                                {formatRp(o.grand_total)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={o.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    <span>Buka</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400">
                                            Tidak ada data transaksi pada periode ini.
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

