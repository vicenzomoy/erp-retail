import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Landmark,
    Wallet,
    FileSpreadsheet,
    FileCheck2,
    Layers,
    ExternalLink,
    ArrowRight,
    Plus,
    CheckCircle2,
    Package,
    Truck,
    ArrowDownLeft,
    AlertCircle,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Overview({
    kpis = {},
    pendingBills = [],
    pendingInvoices = [],
    unpaidInvoices = [],
    unpaidBills = [],
}) {
    const totalToInvoiceCount = pendingInvoices.length;
    const totalToBillCount = pendingBills.length;
    const totalUnpaidCount = unpaidInvoices.length + unpaidBills.length;

    return (
        <AccountingLayout
            title="Accounting Overview"
            breadcrumbs={[{ label: 'Ringkasan Operasi' }]}
        >
            <Head title="Accounting Overview — Bara Wear" />

            {/* Top Operational KPI Cards Bar (Senada dengan Modul Inventaris) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                {/* 1. Saldo Kas & Bank */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Saldo Bank &amp; Kas
                        </span>
                        <Landmark className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-xl font-black text-slate-900">
                        {formatRp((kpis?.bank_balance || 0) + (kpis?.cash_balance || 0))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Bank: {formatRp(kpis?.bank_balance)} &bull; Kas: {formatRp(kpis?.cash_balance)}
                    </p>
                </div>

                {/* 2. Piutang Pelanggan (Open AR) */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Piutang Pelanggan (AR)
                        </span>
                        <FileCheck2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-black text-emerald-700">
                        {formatRp(kpis?.open_ar)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {unpaidInvoices.length} faktur menunggu pelunasan
                    </p>
                </div>

                {/* 3. Utang Pemasok (Open AP) */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Utang Pemasok (AP)
                        </span>
                        <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-black text-amber-600">
                        {formatRp(kpis?.open_ap)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        {unpaidBills.length} tagihan pemasok belum dibayar
                    </p>
                </div>

                {/* 4. Antrean Dokumen Perlu Diurus */}
                <div
                    className={`rounded-lg border p-4 shadow-xs ${
                        totalToInvoiceCount + totalToBillCount > 0
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-slate-200 bg-white'
                    }`}
                >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                            SO &amp; PO Perlu Diurus
                        </span>
                        <AlertCircle
                            className={`h-4 w-4 ${
                                totalToInvoiceCount + totalToBillCount > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                            }`}
                        />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-700">
                            {totalToInvoiceCount + totalToBillCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                            dokumen siap ditagih
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                        {totalToInvoiceCount} SO Terkirim &bull; {totalToBillCount} PO Lolos QC
                    </p>
                </div>
            </div>

            {/* Odoo 17 Operation Cards (Persis Modul Inventaris) */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-slate-500" />
                        Kartu Operasional Finance &amp; Akuntansi
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. CUSTOMER INVOICES CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                                        <FileCheck2 className="h-4 w-4" />
                                    </div>
                                    Faktur Pelanggan (Invoices)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tagihan penjualan atas SO yang dikirim gudang
                                </p>
                            </div>
                            <Link
                                href={route('accounting.invoices.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('accounting.invoices.index', { status: 'to_invoice' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-emerald-600 group-hover:underline">
                                    {totalToInvoiceCount}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">
                                    SO Perlu Difakturkan
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {unpaidInvoices.length} Belum Lunas
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('accounting.invoices.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                            >
                                Buka Daftar Faktur
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* 2. VENDOR BILLS CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-blue-50 text-blue-600">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </div>
                                    Tagihan Pemasok (Bills)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tagihan pembelian dari PO yang lolos QC gudang
                                </p>
                            </div>
                            <Link
                                href={route('accounting.bills.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('accounting.bills.index', { status: 'to_bill' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-blue-600 group-hover:underline">
                                    {totalToBillCount}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700">
                                    PO Perlu Ditagih
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {unpaidBills.length} Belum Dibayar
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('accounting.bills.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                                Buka Daftar Tagihan Pemasok
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* 3. PAYMENTS CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-purple-50 text-purple-600">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    Kas &amp; Pembayaran
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Penerimaan piutang &amp; pelunasan utang usaha
                                </p>
                            </div>
                            <Link
                                href={route('accounting.payments.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Bayar
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('accounting.payments.index')}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-purple-600 group-hover:underline">
                                    {totalUnpaidCount}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-purple-700">
                                    Menunggu Pembayaran
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {unpaidInvoices.length} AR / {unpaidBills.length} AP
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('accounting.payments.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
                            >
                                Buka Riwayat Pembayaran
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabel 1: Daftar Sales Order (SO) yang Perlu Dibuatkan Faktur (Invoice) */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                            Sales Order (SO) yang Perlu Dibuatkan Faktur Pelanggan
                        </h3>
                        {pendingInvoices.length > 0 && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                {pendingInvoices.length} SO Siap Ditagih
                            </span>
                        )}
                    </div>
                    <Link
                        href={route('accounting.invoices.index')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        Lihat Semua Faktur &rarr;
                    </Link>
                </div>

                {pendingInvoices.length === 0 ? (
                    <div className="p-6 text-center">
                        <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                        <p className="text-xs font-semibold text-slate-800">
                            Semua Sales Order yang sudah dikirim telah dibuatkan Faktur
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Sales Order</th>
                                    <th className="px-4 py-2.5">Pelanggan</th>
                                    <th className="px-4 py-2.5 text-center">Dipesan</th>
                                    <th className="px-4 py-2.5 text-center">Terkirim Gudang</th>
                                    <th className="px-4 py-2.5 text-center">Siap Difakturkan</th>
                                    <th className="px-4 py-2.5 text-right">Estimasi Nilai Faktur</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingInvoices.map((so) => (
                                    <tr key={so.sales_order_id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                            {so.sales_order_id}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800">
                                            {so.customer_name}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-slate-600">
                                            {so.total_ordered} pcs
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-emerald-700">
                                            {so.total_delivered} pcs
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 border border-emerald-200">
                                                {so.total_invoiceable} pcs
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                            {formatRp(so.estimated_amount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link
                                                href={so.action_url}
                                                className="inline-flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 text-xs font-bold transition"
                                            >
                                                Buat Faktur
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tabel 2: Daftar Purchase Order (PO) yang Perlu Dibuatkan Tagihan Pemasok (Vendor Bill) */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                            Purchase Order (PO) yang Perlu Dibuatkan Tagihan Pemasok (Vendor Bill)
                        </h3>
                        {pendingBills.length > 0 && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                                {pendingBills.length} PO Siap Ditagih
                            </span>
                        )}
                    </div>
                    <Link
                        href={route('accounting.bills.index')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        Lihat Semua Tagihan &rarr;
                    </Link>
                </div>

                {pendingBills.length === 0 ? (
                    <div className="p-6 text-center">
                        <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                        <p className="text-xs font-semibold text-slate-800">
                            Semua Purchase Order yang diterima gudang telah dibuatkan Vendor Bill
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Purchase Order</th>
                                    <th className="px-4 py-2.5">Pemasok (Vendor)</th>
                                    <th className="px-4 py-2.5">Penerimaan Gudang</th>
                                    <th className="px-4 py-2.5 text-center">Diterima Baik (QC)</th>
                                    <th className="px-4 py-2.5 text-center">Siap Ditagih</th>
                                    <th className="px-4 py-2.5 text-right">Estimasi Nilai Tagihan</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingBills.map((po) => (
                                    <tr key={po.purchase_order_id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                            {po.purchase_order_id}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800">
                                            {po.vendor_name}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-slate-600">
                                            {po.primary_receipt_id || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-emerald-700">
                                            {po.total_accepted} pcs
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-900 border border-blue-200">
                                                {po.total_billable} pcs
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                            {formatRp(po.estimated_amount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link
                                                href={po.action_url}
                                                className="inline-flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 text-xs font-bold transition"
                                            >
                                                Buat Tagihan
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AccountingLayout>
    );
}
