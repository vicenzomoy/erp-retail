import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import InvoicingLayout from '@/Layouts/InvoicingLayout';
import {
    ReceiptText,
    FileCheck2,
    FileSpreadsheet,
    Wallet,
    RotateCcw,
    Plus,
    ArrowUpRight,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2,
    PackageCheck,
    Truck,
    ArrowRight,
    ShieldAlert,
    ShieldCheck,
    Calendar,
    Building2,
    UserCheck,
    HelpCircle,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Overview({
    kpis,
    pendingBills = [],
    pendingInvoices = [],
    pendingReturns = [],
    unpaidInvoices = [],
    unpaidBills = [],
    recentInvoices = [],
    recentBills = [],
}) {
    const [activeTab, setActiveTab] = useState('pembelian');

    const totalToBillCount = pendingBills.length;
    const totalToInvoiceCount = pendingInvoices.length;
    const totalToReturnCount = pendingReturns.length;
    const totalUnpaidCount = unpaidInvoices.length + unpaidBills.length;

    return (
        <InvoicingLayout
            title="Overview Invoicing"
            breadcrumbs={[{ label: 'Invoicing' }, { label: 'Overview' }]}
        >
            <Head title="Overview Invoicing & Penagihan — Bara Wear" />

            {/* Top Action Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-teal-700" />
                        <span>Kokpit Operasional Invoicing &amp; Penagihan</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pantau antrean penagihan proaktif tanpa perlu menunggu konfirmasi manual dari tim Gudang atau Sales.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('invoicing.invoices.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Faktur Pelanggan Baru
                    </Link>

                    <Link
                        href={route('invoicing.bills.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Vendor Bill Baru
                    </Link>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 1. Pembelian Menunggu Tagihan (To Bill) */}
                <div
                    onClick={() => setActiveTab('pembelian')}
                    className={`rounded-lg border p-4 shadow-2xs cursor-pointer transition ${
                        activeTab === 'pembelian'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-300'
                            : 'border-slate-200 bg-white hover:border-amber-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Pembelian Menunggu Tagihan
                        </span>
                        <div className="rounded-full bg-amber-100 p-1.5 text-amber-800">
                            <PackageCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-amber-950">
                            {totalToBillCount}
                        </span>
                        <span className="text-xs text-amber-800 font-semibold">PO Siap Ditagih</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Barang diterima &amp; lolos QC gudang, belum dibuatkan Vendor Bill.
                    </p>
                </div>

                {/* 2. Penjualan Menunggu Faktur (To Invoice) */}
                <div
                    onClick={() => setActiveTab('penjualan')}
                    className={`rounded-lg border p-4 shadow-2xs cursor-pointer transition ${
                        activeTab === 'penjualan'
                            ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-300'
                            : 'border-slate-200 bg-white hover:border-teal-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                            Penjualan Menunggu Faktur
                        </span>
                        <div className="rounded-full bg-teal-100 p-1.5 text-teal-800">
                            <Truck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-teal-950">
                            {totalToInvoiceCount}
                        </span>
                        <span className="text-xs text-teal-800 font-semibold">SO Siap Difaktur</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Barang sudah dikirim gudang, belum diterbitkan Customer Invoice.
                    </p>
                </div>

                {/* 3. Retur Menunggu Nota Kredit */}
                <div
                    onClick={() => setActiveTab('retur')}
                    className={`rounded-lg border p-4 shadow-2xs cursor-pointer transition ${
                        activeTab === 'retur'
                            ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-300'
                            : 'border-slate-200 bg-white hover:border-rose-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                            Retur Menunggu Nota Kredit
                        </span>
                        <div className="rounded-full bg-rose-100 p-1.5 text-rose-800">
                            <RotateCcw className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-rose-950">
                            {totalToReturnCount}
                        </span>
                        <span className="text-xs text-rose-800 font-semibold">Retur Diinspeksi</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Gudang selesai cek fisik, siap dibuatkan Nota Kredit &amp; penyesuaian AR.
                    </p>
                </div>

                {/* 4. Posisi Piutang & Utang Terbuka */}
                <div
                    onClick={() => setActiveTab('unpaid')}
                    className={`rounded-lg border p-4 shadow-2xs cursor-pointer transition ${
                        activeTab === 'unpaid'
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-300'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            Menunggu Pembayaran
                        </span>
                        <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-800">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-indigo-950">
                            {totalUnpaidCount}
                        </span>
                        <span className="text-xs text-indigo-800 font-semibold">Faktur/Bill Terbuka</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                        AR: <span className="font-mono font-bold text-slate-700">{formatRp(kpis.open_ar)}</span> &bull; AP: <span className="font-mono font-bold text-slate-700">{formatRp(kpis.open_ap)}</span>
                    </p>
                </div>
            </div>

            {/* ACTIONABLE WORK QUEUES (Antrean Tugas Finance) */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden mb-8">
                {/* Section Title & Segmented Control */}
                <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Antrean Tindakan Tim Finance</span>
                            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                                Proaktif (Otomatis dari Aktivitas Gudang &amp; Penjualan)
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih tab untuk melihat daftar pesanan yang memerlukan tindak lanjut faktur atau pembayaran.
                        </p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex flex-wrap gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pembelian')}
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                activeTab === 'pembelian'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            Pembelian Menunggu Tagihan ({totalToBillCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('penjualan')}
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                activeTab === 'penjualan'
                                    ? 'bg-teal-700 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            Penjualan Menunggu Faktur ({totalToInvoiceCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('retur')}
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                activeTab === 'retur'
                                    ? 'bg-rose-700 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            Retur Menunggu Nota Kredit ({totalToReturnCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unpaid')}
                            className={`rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                activeTab === 'unpaid'
                                    ? 'bg-indigo-700 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            Menunggu Pembayaran ({totalUnpaidCount})
                        </button>
                    </div>
                </div>

                {/* TAB CONTENT: 1. PEMBELIAN MENUNGGU TAGIHAN */}
                {activeTab === 'pembelian' && (
                    <div>
                        {pendingBills.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Semua Pembelian Sudah Selesai Ditagih
                                </h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Tidak ada penerimaan barang gudang (Receipt) yang menunggu dibuatkan tagihan pemasok. Semua pesanan yang diterima telah sesuai dengan prinsip Three-Way Match.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">No. PO</th>
                                            <th className="px-4 py-2.5">Pemasok / Vendor</th>
                                            <th className="px-4 py-2.5">Bukti Terima Gudang</th>
                                            <th className="px-4 py-2.5 text-center">Status Barang</th>
                                            <th className="px-4 py-2.5 text-right">Sisa Boleh Ditagih</th>
                                            <th className="px-4 py-2.5 text-right">Estimasi Tagihan</th>
                                            <th className="px-4 py-2.5 text-center">Aksi Cepat Finance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingBills.map((item) => (
                                            <tr key={item.purchase_order_id} className="hover:bg-amber-50/30 transition">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                                    {item.purchase_order_id}
                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                        Tgl PO: {item.order_date}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-800">{item.vendor_name}</div>
                                                    <div className="text-[10px] text-slate-500">Termin: {item.payment_terms || 'Immediate'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.primary_receipt_id ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-800">
                                                            <PackageCheck className="h-3 w-3 text-emerald-600" />
                                                            {item.primary_receipt_id} (Diterima)
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex items-center gap-1 text-[11px]">
                                                        <span className="font-mono text-slate-600" title="Dipesan">
                                                            {item.total_ordered} order
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono font-bold text-emerald-700" title="Diterima Lolos QC">
                                                            {item.total_accepted} rcvd
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono text-slate-500" title="Sudah Ditagih">
                                                            {item.total_already_billed} billed
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-block font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                                        {item.total_billable} pcs
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                                    {formatRp(item.estimated_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={item.action_url}
                                                        className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition"
                                                    >
                                                        <span>Buat Vendor Bill</span>
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: 2. PENJUALAN MENUNGGU FAKTUR */}
                {activeTab === 'penjualan' && (
                    <div>
                        {pendingInvoices.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Semua Penjualan Terkirim Sudah Difakturkan
                                </h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Tidak ada barang yang sudah dikirim gudang (Delivery Order) yang belum dibuatkan faktur. Sesuai Delivered-Based Invoicing Policy, seluruh omzet terkirim telah ditagih.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">No. SO</th>
                                            <th className="px-4 py-2.5">Pelanggan</th>
                                            <th className="px-4 py-2.5 text-center">Status Pengiriman</th>
                                            <th className="px-4 py-2.5 text-right">Sisa Boleh Difakturkan</th>
                                            <th className="px-4 py-2.5 text-right">Estimasi Nilai Faktur</th>
                                            <th className="px-4 py-2.5 text-center">Aksi Cepat Finance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingInvoices.map((item) => (
                                            <tr key={item.sales_order_id} className="hover:bg-teal-50/30 transition">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                                    {item.sales_order_id}
                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                        Tgl SO: {item.order_date}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-800">{item.customer_name}</div>
                                                    <div className="text-[10px] text-slate-500">Termin: {item.payment_terms || 'Immediate'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex items-center gap-1 text-[11px]">
                                                        <span className="font-mono text-slate-600" title="Dipesan">
                                                            {item.total_ordered} order
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono font-bold text-teal-700" title="Telah Dikirim Gudang">
                                                            {item.total_delivered} dlvrd
                                                        </span>
                                                        <span className="text-slate-300">&rarr;</span>
                                                        <span className="font-mono text-slate-500" title="Sudah Difakturkan">
                                                            {item.total_already_invoiced} inv
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-block font-mono font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                                                        {item.total_invoiceable} pcs
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                                    {formatRp(item.estimated_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={item.action_url}
                                                        className="inline-flex items-center gap-1 rounded bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 transition"
                                                    >
                                                        <span>Terbitkan Faktur</span>
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: 3. RETUR PELANGGAN MENUNGGU NOTA KREDIT */}
                {activeTab === 'retur' && (
                    <div>
                        {pendingReturns.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Tidak Ada Retur Menunggu Nota Kredit
                                </h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                    Seluruh permohonan retur pelanggan yang sudah selesai diinspeksi oleh gudang telah dibuatkan Nota Kredit dan penyesuaian piutang (AR Adjustment).
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">No. Retur</th>
                                            <th className="px-4 py-2.5">Pelanggan</th>
                                            <th className="px-4 py-2.5">Faktur Asal</th>
                                            <th className="px-4 py-2.5">Waktu Inspeksi Gudang</th>
                                            <th className="px-4 py-2.5 text-center">Barang Diterima Kembali</th>
                                            <th className="px-4 py-2.5 text-right">Estimasi Nota Kredit</th>
                                            <th className="px-4 py-2.5 text-center">Aksi Cepat Finance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingReturns.map((item) => (
                                            <tr key={item.id} className="hover:bg-rose-50/30 transition">
                                                <td className="px-4 py-3 font-mono font-bold text-rose-800">
                                                    {item.id}
                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                        Tgl Pengajuan: {item.return_date}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">
                                                    {item.customer_name}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                                    {item.customer_invoice_id}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                        {item.inspected_at}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-mono font-bold text-emerald-700">
                                                        {item.total_accepted} pcs diterima
                                                    </span>
                                                    {item.total_damaged > 0 && (
                                                        <span className="text-[10px] text-rose-600 ml-1">
                                                            ({item.total_damaged} rusak)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-rose-800">
                                                    {formatRp(item.estimated_credit)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={item.action_url}
                                                        className="inline-flex items-center gap-1 rounded bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-800 transition"
                                                    >
                                                        <span>Proses Nota Kredit</span>
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: 4. MENUNGGU PEMBAYARAN */}
                {activeTab === 'unpaid' && (
                    <div className="p-4 space-y-6">
                        {/* Sub-section: Faktur Penjualan Belum Lunas (Open AR) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <FileCheck2 className="h-4 w-4 text-indigo-600" />
                                    <span>Faktur Pelanggan Belum Lunas (Open AR &bull; Sisa Piutang)</span>
                                </h3>
                                <Link
                                    href={route('invoicing.invoices.index')}
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                    Lihat Seluruh Faktur &rarr;
                                </Link>
                            </div>

                            {unpaidInvoices.length === 0 ? (
                                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded">
                                    Seluruh faktur pelanggan telah lunas (Open AR = 0).
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2">No. Faktur</th>
                                                <th className="px-3 py-2">Pelanggan</th>
                                                <th className="px-3 py-2">Jatuh Tempo</th>
                                                <th className="px-3 py-2 text-right">Grand Total</th>
                                                <th className="px-3 py-2 text-right">Sisa Piutang (Residual)</th>
                                                <th className="px-3 py-2 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {unpaidInvoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                                                        <Link href={route('invoicing.invoices.show', inv.id)} className="hover:underline">
                                                            {inv.id}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold text-slate-800">{inv.partner_name}</td>
                                                    <td className="px-3 py-2 text-slate-600">{inv.due_date}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{formatRp(inv.grand_total)}</td>
                                                    <td className="px-3 py-2 text-right font-mono font-bold text-indigo-800">
                                                        {formatRp(inv.amount_residual)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Link
                                                            href={inv.action_url}
                                                            className="inline-flex items-center gap-1 rounded bg-indigo-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-800"
                                                        >
                                                            <span>Register Payment</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Sub-section: Tagihan Pemasok Belum Lunas (Open AP) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                                    <span>Tagihan Pemasok Belum Lunas (Open AP &bull; Sisa Utang)</span>
                                </h3>
                                <Link
                                    href={route('invoicing.bills.index')}
                                    className="text-xs font-semibold text-amber-600 hover:underline"
                                >
                                    Lihat Seluruh Tagihan &rarr;
                                </Link>
                            </div>

                            {unpaidBills.length === 0 ? (
                                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded">
                                    Seluruh tagihan pemasok telah dibayar lunas (Open AP = 0).
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2">No. Tagihan</th>
                                                <th className="px-3 py-2">Vendor / Pemasok</th>
                                                <th className="px-3 py-2">Jatuh Tempo</th>
                                                <th className="px-3 py-2 text-right">Grand Total</th>
                                                <th className="px-3 py-2 text-right">Sisa Utang (Residual)</th>
                                                <th className="px-3 py-2 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {unpaidBills.map((b) => (
                                                <tr key={b.id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2 font-mono font-bold text-amber-800">
                                                        <Link href={route('invoicing.bills.show', b.id)} className="hover:underline">
                                                            {b.id}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold text-slate-800">{b.partner_name}</td>
                                                    <td className="px-3 py-2 text-slate-600">{b.due_date}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{formatRp(b.grand_total)}</td>
                                                    <td className="px-3 py-2 text-right font-mono font-bold text-amber-900">
                                                        {formatRp(b.amount_residual)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Link
                                                            href={b.action_url}
                                                            className="inline-flex items-center gap-1 rounded bg-amber-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-800"
                                                        >
                                                            <span>Register Payment</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* DOKUMEN FAKTUR & BILL TERBARU (HISTORIS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Customer Invoices */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Faktur Pelanggan Terbaru
                            </h2>
                            <p className="text-[11px] text-slate-500">Faktur yang telah diterbitkan</p>
                        </div>
                        <Link
                            href={route('invoicing.invoices.index')}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5">No. Faktur</th>
                                    <th className="px-4 py-2.5">Pelanggan</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                    <th className="px-4 py-2.5 text-right">Residual</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                            <Link href={route('invoicing.invoices.show', inv.id)} className="hover:underline">
                                                {inv.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                                            <div className="text-[10px] text-slate-400">Tgl: {inv.invoice_date}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono">{formatRp(inv.grand_total)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                            {formatRp(inv.amount_residual)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    inv.status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : inv.status === 'posted'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Vendor Bills */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Tagihan Pemasok Terbaru
                            </h2>
                            <p className="text-[11px] text-slate-500">Vendor Bill yang telah divalidasi</p>
                        </div>
                        <Link
                            href={route('invoicing.bills.index')}
                            className="text-xs font-semibold text-amber-700 hover:underline"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5">No. Bill</th>
                                    <th className="px-4 py-2.5">Vendor</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                    <th className="px-4 py-2.5 text-right">Residual</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentBills.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-bold text-amber-800">
                                            <Link href={route('invoicing.bills.show', b.id)} className="hover:underline">
                                                {b.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-800">{b.vendor_name}</div>
                                            <div className="text-[10px] text-slate-400">PO: {b.purchase_order_id}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono">{formatRp(b.grand_total)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                            {formatRp(b.amount_residual)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    b.status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : b.status === 'posted'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </InvoicingLayout>
    );
}
