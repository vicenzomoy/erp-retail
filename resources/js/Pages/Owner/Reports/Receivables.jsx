import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    ArrowUpRight,
    Building2,
    FileText,
    Store,
    ShoppingCart,
    Search,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronDown,
    ChevronUp,
    Package,
    Percent,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function Receivables({ kpiSummary, report }) {
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'customers', 'pos'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedInvoices, setExpandedInvoices] = useState({});
    const [expandedCustomers, setExpandedCustomers] = useState({});
    const [expandedPos, setExpandedPos] = useState({});

    const toggleInvoiceExpand = (invId) => {
        setExpandedInvoices((prev) => ({ ...prev, [invId]: !prev[invId] }));
    };

    const toggleCustomerExpand = (custId) => {
        setExpandedCustomers((prev) => ({ ...prev, [custId]: !prev[custId] }));
    };

    const togglePosExpand = (orderId) => {
        setExpandedPos((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    const filteredInvoices = (report.invoices || []).filter(
        (i) =>
            i.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.sales_order_id && i.sales_order_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredCustomers = (report.customers || []).filter(
        (c) =>
            c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPos = (report.pos_orders || []).filter(
        (p) =>
            p.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <OwnerLayout
            title="Rincian Piutang Usaha (AR)"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Piutang Usaha' },
            ]}
        >
            <Head title="Rincian Piutang Usaha (AR) - Executive Dashboard" />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="receivables"
                title="Rincian Piutang Usaha & Penjualan POS"
                subtitle="Daftar faktur Sales Order B2B per PT pembeli, rincian barang, diskon, sisa piutang, serta rekap penjualan kasir toko fisik."
            />

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                <div className="rounded-lg border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Total Piutang Berjalan (AR)</p>
                    <p className="text-xl font-black text-indigo-900 mt-1">{formatRp(report.kpis.total_open_ar)}</p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">Faktur B2B belum terbayar</p>
                </div>

                <div className="rounded-lg border border-rose-200 bg-linear-to-br from-rose-50 to-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Piutang Jatuh Tempo</p>
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <p className="text-xl font-bold text-rose-700 mt-1">{formatRp(report.kpis.total_overdue_ar)}</p>
                    <p className="text-[10px] text-rose-600/80 mt-0.5">Melewati batas termin pembayaran</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PT Pelanggan Berpiutang</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{report.kpis.customers_with_ar_count} Perusahaan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Memiliki saldo piutang aktif</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Faktur B2B Terbit</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{formatRp(report.kpis.total_invoiced_b2b)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{report.invoices.length} faktur diposting</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Penjualan Kasir POS</p>
                    <p className="text-xl font-bold text-teal-700 mt-1">{formatRp(report.kpis.total_pos_sales)}</p>
                    <p className="text-[10px] text-teal-600 mt-0.5">Lunas langsung di toko ({report.kpis.total_pos_items} pcs)</p>
                </div>
            </div>

            {/* Tab Switches & Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'invoices'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FileText className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Faktur Sales Order B2B ({report.invoices.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('customers')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'customers'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        <span>Rekap Piutang per PT ({report.customers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('pos')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'pos'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Store className="h-3.5 w-3.5 text-teal-600" />
                        <span>Penjualan Toko Fisik / POS ({report.pos_orders.length})</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari no faktur, SO, PT pembeli, atau order..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* TAB 1: B2B INVOICES WITH SALES ORDER & ITEM BREAKDOWN */}
            {activeTab === 'invoices' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Faktur Penjualan Sales Order (B2B) & Rincian Produk
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan PT yang membeli, nama produk, kuantitas, harga, diskon, nilai faktur, dan sisa piutang.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredInvoices.length} Faktur
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((inv) => {
                                const isExpanded = !!expandedInvoices[inv.invoice_id];
                                return (
                                    <div key={inv.invoice_id} className="transition hover:bg-slate-50/50">
                                        {/* Invoice Row Header */}
                                        <div
                                            onClick={() => toggleInvoiceExpand(inv.invoice_id)}
                                            className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 cursor-pointer"
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
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-indigo-700">
                                                            {inv.invoice_id}
                                                        </span>
                                                        {inv.sales_order_id && (
                                                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                                Ref SO: {inv.sales_order_id}
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {inv.customer_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            (Termin: {inv.payment_terms})
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Tgl Faktur: <span className="font-medium text-slate-700">{inv.invoice_date}</span> • Jatuh Tempo: <span className="font-medium text-slate-700">{inv.due_date}</span> • Total Barang: <span className="font-bold text-slate-800">{inv.total_qty} pcs</span> ({inv.items.length} ragam item)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Financials & Status */}
                                            <div className="flex flex-wrap items-center gap-5 self-end lg:self-center pl-8 lg:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Faktur</p>
                                                    <p className="text-xs font-bold text-slate-800">{formatRp(inv.grand_total)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Dibayar</p>
                                                    <p className="text-xs font-semibold text-emerald-700">{formatRp(inv.amount_paid)}</p>
                                                </div>
                                                <div className="text-right min-w-[120px]">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sisa Piutang (AR)</p>
                                                    <p className={`text-sm font-black ${
                                                        inv.amount_residual > 0
                                                            ? inv.is_overdue
                                                                ? 'text-rose-700'
                                                                : 'text-indigo-700'
                                                            : 'text-emerald-700'
                                                    }`}>
                                                        {formatRp(inv.amount_residual)}
                                                    </p>
                                                </div>
                                                <div>
                                                    {inv.status === 'paid' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Lunas</span>
                                                        </span>
                                                    )}
                                                    {inv.status === 'overdue' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            <span>Jatuh Tempo</span>
                                                        </span>
                                                    )}
                                                    {inv.status === 'open' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Belum Lunas</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Link
                                                        href={inv.view_url}
                                                        className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                                    >
                                                        Faktur
                                                    </Link>
                                                    {inv.so_view_url && (
                                                        <Link
                                                            href={inv.so_view_url}
                                                            className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                                        >
                                                            SO
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible Line Items Detail */}
                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="h-3.5 w-3.5 text-indigo-600" />
                                                        <span>Rincian Barang yang Dipesan pada Faktur Ini:</span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500">
                                                        Pelanggan: <strong className="text-slate-900">{inv.customer_name}</strong>
                                                    </span>
                                                </div>
                                                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                                                            <tr>
                                                                <th className="py-2 px-3">SKU</th>
                                                                <th className="py-2 px-3">Nama Produk</th>
                                                                <th className="py-2 px-2 text-center">Ukuran / Warna</th>
                                                                <th className="py-2 px-3 text-right">Kuantitas</th>
                                                                <th className="py-2 px-3 text-right">Harga Satuan</th>
                                                                <th className="py-2 px-3 text-right">Diskon %</th>
                                                                <th className="py-2 px-3 text-right font-bold text-slate-900">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {inv.items.map((it, idx) => (
                                                                <tr key={`${it.sku}-${idx}`} className="hover:bg-slate-50">
                                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                                                        {it.sku}
                                                                    </td>
                                                                    <td className="py-2 px-3 font-medium text-slate-900">
                                                                        {it.product_name}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-center text-slate-500">
                                                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                                                                            {it.size} / {it.color}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-semibold text-slate-800">
                                                                        {it.qty} pcs
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-slate-600">
                                                                        {formatRp(it.unit_price)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-amber-700 font-semibold">
                                                                        {it.discount_pct > 0 ? `${it.discount_pct}%` : '-'}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-bold text-indigo-700">
                                                                        {formatRp(it.line_total)}
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
                                Tidak ada data faktur B2B ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: CUSTOMERS / PT AGGREGATION BREAKDOWN */}
            {activeTab === 'customers' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rekap Saldo Piutang per PT Pelanggan
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan total faktur, riwayat pembayaran, sisa piutang kita ke masing-masing PT, dan produk yang dibeli.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredCustomers.length} PT / Pelanggan
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((c) => {
                                const isExpanded = !!expandedCustomers[c.customer_id];
                                return (
                                    <div key={c.customer_id} className="transition hover:bg-slate-50/50">
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
                                                            Termin: {c.payment_terms}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Limit Kredit: <span className="font-medium text-slate-700">{formatRp(c.credit_limit)}</span> • Total {c.invoices_count} faktur • {c.products.length} SKU dipesan
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 self-end md:self-center pl-8 md:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Faktur</p>
                                                    <p className="text-xs font-semibold text-slate-700">{formatRp(c.total_invoiced)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Terbayar</p>
                                                    <p className="text-xs font-semibold text-emerald-700">{formatRp(c.total_paid)}</p>
                                                </div>
                                                <div className="text-right min-w-[120px]">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Sisa Piutang</p>
                                                    <p className={`text-sm font-black ${
                                                        c.total_residual > 0 ? 'text-indigo-700' : 'text-slate-400'
                                                    }`}>
                                                        {formatRp(c.total_residual)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-purple-600" />
                                                    <span>Ragam Produk yang Dibeli oleh {c.customer_name}:</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {c.products.map((p) => (
                                                        <div key={p.sku} className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between">
                                                            <div>
                                                                <p className="font-semibold text-xs text-slate-900">{p.name}</p>
                                                                <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                                                {p.qty} pcs
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Tidak ada data pelanggan.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: POS STORE SALES */}
            {activeTab === 'pos' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Penjualan Toko Fisik (Point of Sale Kasir)
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Keterangan barang apa saja yang dijual langsung di kasir toko fisik, total rupiah, dan jumlah itemnya.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredPos.length} Transaksi POS
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredPos.length > 0 ? (
                            filteredPos.map((pos) => {
                                const isExpanded = !!expandedPos[pos.order_id];
                                return (
                                    <div key={pos.order_id} className="transition hover:bg-slate-50/50">
                                        <div
                                            onClick={() => togglePosExpand(pos.order_id)}
                                            className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 cursor-pointer"
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
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-teal-700">
                                                            {pos.order_id}
                                                        </span>
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {pos.customer_name}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                                            Metode: {pos.payment_method}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Waktu: <span className="font-medium text-slate-700">{pos.date}</span> • Kasir: <span className="font-medium text-slate-700">{pos.cashier_name}</span> • Total Barang: <span className="font-bold text-slate-800">{pos.total_qty} pcs</span> ({pos.items.length} ragam item)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-5 self-end lg:self-center pl-8 lg:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Belanja</p>
                                                    <p className="text-sm font-black text-slate-900">{formatRp(pos.grand_total)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Uang Diterima</p>
                                                    <p className="text-xs font-semibold text-slate-700">{formatRp(pos.cash_tendered)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Kembalian</p>
                                                    <p className="text-xs font-semibold text-slate-600">{formatRp(pos.change_given)}</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Lunas Langsung</span>
                                                </span>
                                                <Link
                                                    href={pos.view_url}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-semibold text-teal-700 hover:bg-slate-50 shadow-2xs"
                                                >
                                                    <span>Struk POS</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-teal-600" />
                                                    <span>Keterangan Barang yang Dibeli di Kasir Toko:</span>
                                                </div>
                                                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                                                            <tr>
                                                                <th className="py-2 px-3">SKU</th>
                                                                <th className="py-2 px-3">Nama Produk</th>
                                                                <th className="py-2 px-2 text-center">Ukuran / Warna</th>
                                                                <th className="py-2 px-3 text-right">Kuantitas</th>
                                                                <th className="py-2 px-3 text-right">Harga Satuan</th>
                                                                <th className="py-2 px-3 text-right font-bold text-slate-900">Total Harga</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {pos.items.map((it, idx) => (
                                                                <tr key={`${it.sku}-${idx}`} className="hover:bg-slate-50">
                                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                                                        {it.sku}
                                                                    </td>
                                                                    <td className="py-2 px-3 font-medium text-slate-900">
                                                                        {it.product_name}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-center text-slate-500">
                                                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                                                                            {it.size} / {it.color}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-semibold text-slate-800">
                                                                        {it.qty} pcs
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-slate-600">
                                                                        {formatRp(it.unit_price)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-bold text-teal-700">
                                                                        {formatRp(it.line_total)}
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
                                Tidak ada data transaksi kasir POS.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

