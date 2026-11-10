import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    Filter,
    FileCheck2,
    Truck,
    ArrowRight,
    Wallet,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function CustomerInvoiceIndex({
    invoices,
    pendingOrders = [],
    filters = {},
    counts = {},
}) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilterStatus = (status) => {
        router.get(
            route('accounting.invoices.index'),
            { status, search },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.invoices.index'),
            { status: filters?.status || 'all', search },
            { preserveState: true }
        );
    };

    const activeStatus = filters?.status || 'all';

    return (
        <AccountingLayout
            title="Faktur Pelanggan (Invoices)"
            breadcrumbs={[
                { label: 'Pelanggan' },
                { label: 'Faktur Pelanggan (Invoices)' },
            ]}
        >
            <Head title="Faktur Pelanggan (Invoices) — Bara Wear" />

            {/* Odoo Control Panel Header (Senada dengan Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Faktur Pelanggan (Customer Invoices)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Kelola tagihan penjualan pelanggan berdasarkan barang yang telah dikirim gudang
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari Faktur, SO, atau Pelanggan..."
                                className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-60"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>

                    <Link
                        href={route('accounting.invoices.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Faktur Baru
                    </Link>
                </div>
            </div>

            {/* Filter Pills Bar (Odoo Style — Persis Modul Inventaris) */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase">
                    <Filter className="h-3 w-3" /> Filter:
                </span>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeStatus === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua Faktur ({counts?.all || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('to_invoice')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeStatus === 'to_invoice'
                            ? 'bg-emerald-700 text-white font-semibold'
                            : (counts?.to_invoice || 0) > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span>SO Perlu Difakturkan ({counts?.to_invoice || 0})</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('draft')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeStatus === 'draft'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Draft ({counts?.draft || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('posted')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeStatus === 'posted'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Belum Lunas / Posted ({counts?.posted || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('paid')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeStatus === 'paid'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Lunas / Paid ({counts?.paid || 0})
                </button>
            </div>

            {/* Bagian Antrean Sales Order yang Perlu Diurus Tagihannya */}
            {(activeStatus === 'to_invoice' || (activeStatus === 'all' && pendingOrders.length > 0)) && (
                <div className="mb-5 rounded-lg border border-emerald-300 bg-white shadow-xs overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="text-xs font-bold text-emerald-950">
                                Daftar Sales Order (SO) yang Perlu Dibuatkan Faktur ({pendingOrders.length} SO)
                            </span>
                            <span className="hidden sm:inline text-[11px] text-emerald-700">
                                — Barang sudah dikirim gudang dan siap ditagihkan ke pelanggan
                            </span>
                        </div>
                    </div>

                    {pendingOrders.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                            Semua Sales Order yang sudah dikirim gudang telah selesai dibuatkan faktur.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2.5">Sales Order</th>
                                        <th className="px-4 py-2.5">Pelanggan</th>
                                        <th className="px-4 py-2.5">Surat Jalan Gudang</th>
                                        <th className="px-4 py-2.5 text-center">Dipesan</th>
                                        <th className="px-4 py-2.5 text-center">Terkirim</th>
                                        <th className="px-4 py-2.5 text-center">Siap Ditagih</th>
                                        <th className="px-4 py-2.5 text-right">Estimasi Tagihan</th>
                                        <th className="px-4 py-2.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingOrders.map((so) => (
                                        <tr key={so.sales_order_id} className="hover:bg-emerald-50/30 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {so.sales_order_id}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-slate-900">
                                                {so.customer_name}
                                                <span className="ml-1.5 text-[11px] text-slate-400">
                                                    ({so.payment_terms || 'CASH'})
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {so.primary_delivery_id ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                                        <Truck className="h-3 w-3 text-emerald-600" />
                                                        {so.primary_delivery_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-semibold text-slate-600">
                                                {so.total_ordered} pcs
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-bold text-emerald-700">
                                                {so.total_delivered} pcs
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900 border border-amber-300">
                                                    {so.total_invoiceable} pcs
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                {formatRp(so.estimated_amount)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('accounting.invoices.create', {
                                                        sales_order_id: so.sales_order_id,
                                                    })}
                                                    className="inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"
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
            )}

            {/* Tabel Daftar Faktur Pelanggan */}
            {activeStatus !== 'to_invoice' && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">No. Faktur</th>
                                    <th className="px-4 py-2.5">Sales Order</th>
                                    <th className="px-4 py-2.5">Pelanggan</th>
                                    <th className="px-4 py-2.5">Tgl Faktur</th>
                                    <th className="px-4 py-2.5">Jatuh Tempo</th>
                                    <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                    <th className="px-4 py-2.5 text-right">Sisa Piutang</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                                            Belum ada dokumen Faktur Pelanggan yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices?.data?.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="hover:bg-slate-50 transition cursor-pointer group"
                                            onClick={() => router.visit(route('accounting.invoices.show', inv.id))}
                                        >
                                            <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                                                <FileCheck2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                                                <span className="font-mono">{inv.id}</span>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                                                {inv.sales_order_id || 'Saldo Awal'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                {inv.customer_name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {inv.invoice_date || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {inv.due_date || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                                                {formatRp(inv.grand_total)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                                {formatRp(inv.amount_residual)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <OdooBadge status={inv.status} />
                                            </td>
                                            <td
                                                className="px-4 py-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="inline-flex items-center gap-2">
                                                    {inv.status === 'posted' && inv.amount_residual > 0 && (
                                                        <Link
                                                            href={route('accounting.payments.create', {
                                                                document_type: 'customer_invoice',
                                                                document_id: inv.id,
                                                            })}
                                                            className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800"
                                                        >
                                                            <Wallet className="h-3 w-3" />
                                                            Terima Bayar
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={route('accounting.invoices.show', inv.id)}
                                                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                                                    >
                                                        Buka
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {invoices?.links && invoices.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                            <div className="text-xs text-slate-500">
                                Menampilkan {invoices.from || 0} - {invoices.to || 0} dari {invoices.total} data
                            </div>
                            <div className="flex items-center gap-1">
                                {invoices.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                                            link.active
                                                ? 'bg-slate-900 text-white font-bold'
                                                : link.url
                                                ? 'text-slate-700 hover:bg-slate-200'
                                                : 'text-slate-300 pointer-events-none'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AccountingLayout>
    );
}
