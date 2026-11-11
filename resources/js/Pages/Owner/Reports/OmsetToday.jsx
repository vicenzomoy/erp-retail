import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    DollarSign,
    Package,
    Building2,
    Receipt,
    Search,
    ExternalLink,
    Store,
    ShoppingCart,
    Layers,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function OmsetToday({ kpiSummary, report }) {
    const [activeView, setActiveView] = useState('products'); // 'products', 'customers', 'orders'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCustomers, setExpandedCustomers] = useState({});

    const toggleCustomerExpand = (custId) => {
        setExpandedCustomers((prev) => ({
            ...prev,
            [custId]: !prev[custId],
        }));
    };

    const filteredProducts = (report.products || []).filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCustomers = (report.customers || []).filter((c) =>
        c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOrders = (report.orders || []).filter((o) =>
        o.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <OwnerLayout
            title="Rincian Omset Hari Ini"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Omset Hari Ini' },
            ]}
        >
            <Head title="Rincian Omset Hari Ini - Executive Dashboard" />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="omset-today"
                title="Rincian Omset Penjualan Hari Ini"
                subtitle="Detail produk yang terjual hari ini, nominal per barang, dan rincian belanja setiap PT/Pelanggan."
                dateBadge={report.date_formatted}
            />

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Omset Hari Ini</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{formatRp(report.kpis.total_omset)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">B2B + POS Kasir</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Barang Terjual</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{report.kpis.total_qty.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">pcs</span></p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Semua SKU produk</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Transaksi</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{report.kpis.total_orders}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Order selesai/lunas</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Jumlah PT/Pelanggan</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{report.kpis.total_customers}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Customer aktif hari ini</p>
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

            {/* Tab Switches & Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md">
                    <button
                        type="button"
                        onClick={() => setActiveView('products')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                            activeView === 'products'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Package className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Rincian Barang yang Dijual ({report.products.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveView('customers')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                            activeView === 'customers'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        <span>Rincian per PT Pembeli ({report.customers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveView('orders')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                            activeView === 'orders'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Receipt className="h-3.5 w-3.5 text-blue-600" />
                        <span>Semua Transaksi ({report.orders.length})</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari barang, PT, atau no order..."
                        className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-1 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                </div>
            </div>

            {/* VIEW 1: PRODUCTS BREAKDOWN */}
            {activeView === 'products' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Total Barang yang Dijual Hari Ini &amp; Nilai Nominal per Barang
                            </h2>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                            {filteredProducts.length} produk ditemukan
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Produk / SKU</th>
                                    <th className="px-4 py-3">Varian</th>
                                    <th className="px-4 py-3 text-right">Qty B2B (SO)</th>
                                    <th className="px-4 py-3 text-right">Qty POS Retail</th>
                                    <th className="px-4 py-3 text-right font-black text-slate-900">Total Kuantitas</th>
                                    <th className="px-4 py-3 text-right">Nominal B2B</th>
                                    <th className="px-4 py-3 text-right">Nominal POS</th>
                                    <th className="px-4 py-3 text-right font-black text-slate-900">Total Nominal Penjualan</th>
                                    <th className="px-4 py-3 text-center">Modul Inventory</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-10 text-center text-slate-400">
                                            Tidak ada transaksi penjualan barang hari ini.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <tr key={p.sku} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900">{p.name}</p>
                                                <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                                                    {p.size} / {p.color}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {p.qty_b2b > 0 ? `${p.qty_b2b} ${p.unit}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {p.qty_pos > 0 ? `${p.qty_pos} ${p.unit}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                                                {p.total_qty} {p.unit}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-indigo-700">
                                                {formatRp(p.nominal_b2b)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-700">
                                                {formatRp(p.nominal_pos)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30 text-sm">
                                                {formatRp(p.total_nominal)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={route('inventory.products.show', p.sku)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                                                >
                                                    <span>Stok Gudang</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredProducts.length > 0 && (
                                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 text-right uppercase tracking-wider text-[11px] text-slate-600">
                                            Total Keseluruhan Hari Ini:
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-sm">
                                            {report.kpis.total_qty} pcs
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-indigo-700 text-sm">
                                            {formatRp(report.kpis.omset_b2b)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-rose-700 text-sm">
                                            {formatRp(report.kpis.omset_pos)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-base text-emerald-800 bg-emerald-100/50">
                                            {formatRp(report.kpis.total_omset)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW 2: CUSTOMERS / PT BREAKDOWN */}
            {activeView === 'customers' && (
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                        <span>Menampilkan setiap PT / pelanggan yang membeli dari kita hari ini, berapa total barangnya, dan nominal belanjanya.</span>
                        <span className="font-semibold text-slate-800">{filteredCustomers.length} Pelanggan Terdaftar</span>
                    </div>

                    {filteredCustomers.length === 0 ? (
                        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                            Tidak ada data pembelian pelanggan hari ini.
                        </div>
                    ) : (
                        filteredCustomers.map((cust) => {
                            const isExpanded = expandedCustomers[cust.customer_id] ?? true;

                            return (
                                <div key={cust.customer_id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                                    {/* Card Header for Customer */}
                                    <div
                                        onClick={() => toggleCustomerExpand(cust.customer_id)}
                                        className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-100 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-md bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900">{cust.customer_name}</h3>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                        {cust.customer_type}
                                                    </span>
                                                    <span className="text-xs text-slate-400">· {cust.city}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    ID: <span className="font-mono">{cust.customer_id}</span> · {cust.orders_count} transaksi hari ini
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Barang Dibeli</p>
                                                <p className="text-base font-bold text-slate-900">{cust.total_qty} pcs</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Nominal Belanja</p>
                                                <p className="text-base font-bold text-emerald-700 font-mono">{formatRp(cust.total_nominal)}</p>
                                            </div>
                                            <button type="button" className="text-slate-400 hover:text-slate-600">
                                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Items Table for Customer */}
                                    {isExpanded && (
                                        <div className="p-4 bg-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-slate-500" />
                                                    Rincian Barang yang Dibeli oleh {cust.customer_name}:
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-500">No. Order:</span>
                                                    {cust.order_ids.map((id) => (
                                                        <span key={id} className="font-mono text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                            {id}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <table className="w-full text-left text-xs text-slate-700 border border-slate-100 rounded">
                                                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-3 py-2">No</th>
                                                        <th className="px-3 py-2">Produk</th>
                                                        <th className="px-3 py-2">SKU</th>
                                                        <th className="px-3 py-2 text-right">Kuantitas</th>
                                                        <th className="px-3 py-2 text-right">Total Nominal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {cust.items.map((it, idx) => (
                                                        <tr key={it.sku} className="hover:bg-slate-50">
                                                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                                                            <td className="px-3 py-2 font-medium text-slate-900">{it.name}</td>
                                                            <td className="px-3 py-2 font-mono text-slate-500">{it.sku}</td>
                                                            <td className="px-3 py-2 text-right font-mono font-semibold">{it.qty} pcs</td>
                                                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">{formatRp(it.total_nominal)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan="3" className="px-3 py-2 text-right uppercase text-[10px] text-slate-500">Total Belanja PT Ini:</td>
                                                        <td className="px-3 py-2 text-right font-mono">{cust.total_qty} pcs</td>
                                                        <td className="px-3 py-2 text-right font-mono text-emerald-800">{formatRp(cust.total_nominal)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* VIEW 3: ALL ORDERS LIST */}
            {activeView === 'orders' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Daftar Transaksi Penjualan Hari Ini
                            </h2>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{filteredOrders.length} transaksi</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">No. Dokumen</th>
                                    <th className="px-4 py-3">Saluran</th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">Pelanggan / PT</th>
                                    <th className="px-4 py-3 text-right">Total Item</th>
                                    <th className="px-4 py-3 text-right">Grand Total</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-10 text-center text-slate-400">
                                            Tidak ada transaksi yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((ord) => (
                                        <tr key={ord.doc_id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                                {ord.doc_id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                    ord.channel.includes('POS')
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                }`}>
                                                    {ord.channel.includes('POS') ? <Store className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
                                                    {ord.channel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-mono">{ord.time}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{ord.customer_name}</td>
                                            <td className="px-4 py-3 text-right font-mono">{ord.items_count} pcs</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatRp(ord.grand_total)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                                    {ord.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={ord.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <span>Lihat Dokumen</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

