import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Search,
    ExternalLink,
    Store,
    ShoppingCart,
    Building2,
    Landmark,
    FileText,
    TrendingUp,
    Scale,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function CashBank({ kpiSummary, report }) {
    const [activeTab, setActiveTab] = useState('inflows_so'); // 'inflows_so', 'inflows_pos', 'outflows_po', 'ledger'
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInflowSo = (report.inflows_so || []).filter(
        (i) =>
            i.payment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.sales_order_id && i.sales_order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (i.invoice_id && i.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredInflowPos = (report.inflows_pos || []).filter(
        (p) =>
            p.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOutflowPo = (report.outflows_po || []).filter(
        (o) =>
            o.payment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.purchase_order_id && o.purchase_order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (o.bill_id && o.bill_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredLedger = (report.ledger_lines || []).filter(
        (l) =>
            l.entry_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.source_doc && l.source_doc.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <OwnerLayout
            title="Rincian Kas & Bank"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Kas & Bank' },
            ]}
        >
            <Head title="Rincian Kas & Bank - Executive Dashboard" />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="cash-bank"
                title="Rincian Arus Kas & Saldo Bank"
                subtitle="Mutasi uang masuk dari Sales Order (B2B) dan Kasir Toko, serta uang keluar untuk pembayaran Purchase Order (Vendor)."
            />

            {/* Top Liquidity Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-teal-200 bg-linear-to-br from-teal-50 to-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Saldo Kas Tunai (1010)</span>
                        <Wallet className="h-5 w-5 text-teal-600" />
                    </div>
                    <p className="text-2xl font-black text-teal-900 mt-2">{formatRp(report.kpis.cash_1010)}</p>
                    <p className="text-[11px] text-teal-700/80 mt-1">Uang tunai di brankas toko dan kasir</p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-linear-to-br from-blue-50 to-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Saldo Rekening Bank (1020)</span>
                        <Landmark className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-black text-blue-900 mt-2">{formatRp(report.kpis.bank_1020)}</p>
                    <p className="text-[11px] text-blue-700/80 mt-1">Total giro dan rekening operasional bank</p>
                </div>

                <div className="rounded-lg border border-slate-300 bg-linear-to-br from-slate-900 to-slate-800 text-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Likuiditas Kas & Bank</span>
                        <Scale className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-2">{formatRp(report.kpis.total_balance)}</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                        Kas Bersih: <span className="font-bold text-emerald-300">{formatRp(report.kpis.net_cash_flow)}</span>
                    </p>
                </div>
            </div>

            {/* Inflow & Outflow KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uang Masuk dari SO</p>
                        <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{formatRp(report.kpis.total_inflow_so)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{report.inflows_so.length} transaksi pembayaran SO</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uang Masuk POS Kasir</p>
                        <Store className="h-4 w-4 text-teal-600" />
                    </div>
                    <p className="text-xl font-bold text-teal-700 mt-1">{formatRp(report.kpis.total_inflow_pos)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{report.inflows_pos.length} struk penjualan toko</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uang Keluar untuk PO</p>
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                    </div>
                    <p className="text-xl font-bold text-rose-700 mt-1">{formatRp(report.kpis.total_outflow_po)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{report.outflows_po.length} pembayaran ke vendor</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Net Arus Kas (In - Out)</p>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={`text-xl font-bold mt-1 ${
                        report.kpis.net_cash_flow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                        {formatRp(report.kpis.net_cash_flow)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Surplus / (Defisit) kas</p>
                </div>
            </div>

            {/* Tab Switches & Search Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('inflows_so')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'inflows_so'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Uang Masuk dari SO ({report.inflows_so.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('inflows_pos')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'inflows_pos'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Store className="h-3.5 w-3.5 text-teal-600" />
                        <span>Uang Masuk POS Kasir ({report.inflows_pos.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('outflows_po')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'outflows_po'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />
                        <span>Uang Keluar untuk PO ({report.outflows_po.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ledger')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'ledger'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>Buku Mutasi Kas/Bank ({report.ledger_lines.length})</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari ID pembayaran, pelanggan, vendor, atau no jurnal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
            </div>

            {/* TAB 1: INFLOWS FROM SO */}
            {activeTab === 'inflows_so' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Pembayaran Masuk dari Sales Order (B2B)
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Catatan penerimaan pelunasan piutang pelanggan atas faktur dan Sales Order yang diterbitkan.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredInflowSo.length} Transaksi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">No Pembayaran</th>
                                    <th className="py-2.5 px-3">Tanggal</th>
                                    <th className="py-2.5 px-3">Pelanggan / PT</th>
                                    <th className="py-2.5 px-3">Ref Sales Order</th>
                                    <th className="py-2.5 px-3">Ref Faktur (Invoice)</th>
                                    <th className="py-2.5 px-3">Rekening Penerima</th>
                                    <th className="py-2.5 px-3">Metode Bayar</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-emerald-800 bg-emerald-50/50">Uang Masuk</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredInflowSo.length > 0 ? (
                                    filteredInflowSo.map((item) => (
                                        <tr key={item.payment_id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                                                {item.payment_id}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                                {item.date}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900">
                                                {item.customer_name}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px]">
                                                {item.sales_order_id !== '-' ? (
                                                    <Link
                                                        href={route('sales.orders.show', item.sales_order_id)}
                                                        className="text-blue-600 hover:underline font-semibold"
                                                    >
                                                        {item.sales_order_id}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px]">
                                                {item.invoice_id ? (
                                                    <Link
                                                        href={route('accounting.invoices.show', item.invoice_id)}
                                                        className="text-indigo-600 hover:underline"
                                                    >
                                                        {item.invoice_id}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {item.account_name}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                                    {item.payment_method}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-emerald-700 bg-emerald-50/30">
                                                +{formatRp(item.amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={item.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800"
                                                >
                                                    <span>Detail</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            Tidak ada data penerimaan kas dari Sales Order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Penerimaan dari SO:
                                    </td>
                                    <td className="py-3 px-4 text-right text-emerald-800 bg-emerald-100 font-black">
                                        +{formatRp(filteredInflowSo.reduce((sum, i) => sum + i.amount, 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: INFLOWS FROM POS */}
            {activeTab === 'inflows_pos' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Penerimaan Kasir Toko Fisik (POS Retail)
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Arus kas masuk langsung dari transaksi penjualan tunai dan QRIS di gerai toko.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredInflowPos.length} Transaksi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">No Order POS</th>
                                    <th className="py-2.5 px-3">Waktu Transaksi</th>
                                    <th className="py-2.5 px-3">Pelanggan</th>
                                    <th className="py-2.5 px-3">Kasir Bertugas</th>
                                    <th className="py-2.5 px-3 text-center">Metode Bayar</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-teal-800 bg-teal-50/50">Uang Diterima</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredInflowPos.length > 0 ? (
                                    filteredInflowPos.map((item) => (
                                        <tr key={item.order_id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                                                {item.order_id}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {item.date}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900">
                                                {item.customer_name}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {item.cashier_name}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                                    {item.payment_method}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-teal-700 bg-teal-50/30">
                                                +{formatRp(item.amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={item.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                                                >
                                                    <span>Struk</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            Tidak ada data penerimaan kasir POS.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Penerimaan POS Toko:
                                    </td>
                                    <td className="py-3 px-4 text-right text-teal-900 bg-teal-100 font-black">
                                        +{formatRp(filteredInflowPos.reduce((sum, i) => sum + i.amount, 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: OUTFLOWS FOR PO */}
            {activeTab === 'outflows_po' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Pembayaran Keluar untuk Purchase Order (Vendor PO)
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Bukti kas/bank keluar untuk pelunasan tagihan vendor atas pembelian bahan baku dan barang dagang.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredOutflowPo.length} Pembayaran
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">No Pembayaran</th>
                                    <th className="py-2.5 px-3">Tanggal</th>
                                    <th className="py-2.5 px-3">Vendor / Pemasok (PT)</th>
                                    <th className="py-2.5 px-3">Ref Purchase Order</th>
                                    <th className="py-2.5 px-3">Ref Tagihan (Bill)</th>
                                    <th className="py-2.5 px-3">Rekening Sumber</th>
                                    <th className="py-2.5 px-3">Metode Bayar</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-rose-800 bg-rose-50/50">Uang Keluar</th>
                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredOutflowPo.length > 0 ? (
                                    filteredOutflowPo.map((item) => (
                                        <tr key={item.payment_id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                                                {item.payment_id}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                                {item.date}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900">
                                                {item.vendor_name}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px]">
                                                {item.purchase_order_id !== '-' ? (
                                                    <Link
                                                        href={route('purchase.orders.show', item.purchase_order_id)}
                                                        className="text-blue-600 hover:underline font-semibold"
                                                    >
                                                        {item.purchase_order_id}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px]">
                                                {item.bill_id ? (
                                                    <Link
                                                        href={route('accounting.bills.show', item.bill_id)}
                                                        className="text-rose-600 hover:underline"
                                                    >
                                                        {item.bill_id}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {item.account_name}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                                                    {item.payment_method}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right font-bold text-rose-700 bg-rose-50/30">
                                                -{formatRp(item.amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <Link
                                                    href={item.view_url}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                                                >
                                                    <span>Detail</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            Tidak ada data pengeluaran kas untuk Purchase Order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Pengeluaran untuk PO:
                                    </td>
                                    <td className="py-3 px-4 text-right text-rose-800 bg-rose-100 font-black">
                                        -{formatRp(filteredOutflowPo.reduce((sum, o) => sum + o.amount, 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: CASH & BANK LEDGER MUTATION */}
            {activeTab === 'ledger' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Buku Besar Mutasi Kas & Bank (Akun 1010 & 1020)
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Log mutasi debit dan kredit langsung dari entri jurnal akuntansi berstatus posted.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredLedger.length} Baris mutasi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Tanggal</th>
                                    <th className="py-2.5 px-3">No Jurnal</th>
                                    <th className="py-2.5 px-2 text-center">Akun</th>
                                    <th className="py-2.5 px-3">Keterangan</th>
                                    <th className="py-2.5 px-3">Dokumen Sumber</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800 bg-emerald-50/50">Debit (Masuk)</th>
                                    <th className="py-2.5 px-3 text-right font-bold text-rose-800 bg-rose-50/50">Kredit (Keluar)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredLedger.length > 0 ? (
                                    filteredLedger.map((l) => (
                                        <tr key={l.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                                {l.date}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                                {l.entry_no}
                                            </td>
                                            <td className="py-2.5 px-2 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    l.account_code === '1010'
                                                        ? 'bg-teal-100 text-teal-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {l.account_code} - {l.account_name}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[250px] truncate" title={l.description}>
                                                {l.description}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                                {l.source_doc}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 bg-emerald-50/20">
                                                {l.debit > 0 ? '+' + formatRp(l.debit) : '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-rose-700 bg-rose-50/20">
                                                {l.credit > 0 ? '-' + formatRp(l.credit) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            Tidak ada data mutasi jurnal.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                                <tr>
                                    <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Mutasi:
                                    </td>
                                    <td className="py-3 px-3 text-right text-emerald-800 bg-emerald-100 font-black">
                                        +{formatRp(filteredLedger.reduce((sum, l) => sum + l.debit, 0))}
                                    </td>
                                    <td className="py-3 px-3 text-right text-rose-800 bg-rose-100 font-black">
                                        -{formatRp(filteredLedger.reduce((sum, l) => sum + l.credit, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

