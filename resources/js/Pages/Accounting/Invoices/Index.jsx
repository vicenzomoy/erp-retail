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
    Clock,
    FileText,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

function InvoiceTable({
    rows = [],
    emptyMessage = 'Belum ada dokumen Faktur Pelanggan pada kategori ini.',
}) {
    if (rows.length === 0) {
        return (
            <div className="p-8 text-center text-xs text-slate-400">
                {emptyMessage}
            </div>
        );
    }

    return (
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
                    {rows.map((inv) => (
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
                                    {inv.status === 'draft' && (
                                        <Link
                                            href={route('accounting.invoices.show', inv.id)}
                                            className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                                        >
                                            Validasi / Posting
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    )}
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function CustomerInvoiceIndex({
    invoices,
    groupedInvoices = {},
    pendingOrders = [],
    filters = {},
    counts = {},
}) {
    const [search, setSearch] = useState(filters?.search || '');
    const activeStatus = filters?.status || 'all';

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
            { status: activeStatus, search },
            { preserveState: true }
        );
    };

    const stageCards = [
        {
            key: 'to_invoice',
            step: '1',
            title: 'SO Perlu Difakturkan',
            subtitle: 'Barang sudah dikirim gudang, siap dibuatkan draf faktur',
            count: counts?.to_invoice || 0,
            icon: Truck,
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'draft',
            step: '2',
            title: 'Draft',
            subtitle: 'Faktur draf menunggu validasi & posting ke Buku Besar',
            count: counts?.draft || 0,
            icon: Clock,
            badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'posted',
            step: '3',
            title: 'Posted',
            subtitle: `Menunggu pelunasan (Piutang: ${formatRp(counts?.open_ar || 0)})`,
            count: counts?.posted || 0,
            icon: FileText,
            badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'paid',
            step: '4',
            title: 'Paid',
            subtitle: 'Faktur pelanggan yang sudah lunas terbayar',
            count: counts?.paid || 0,
            icon: CheckCircle2,
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
    ];

    const draftRows = groupedInvoices?.draft || [];
    const postedRows = groupedInvoices?.posted || [];
    const paidRows = groupedInvoices?.paid || [];

    return (
        <AccountingLayout
            title="Faktur Pelanggan (Invoices)"
            breadcrumbs={[
                { label: 'Pelanggan' },
                { label: 'Faktur Pelanggan (Invoices)' },
            ]}
        >
            <Head title="Faktur Pelanggan (Invoices) — Bara Wear" />

            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Faktur Pelanggan (Customer Invoices)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Alur penagihan terpisah: SO Perlu Difakturkan &rarr; Draft &rarr; Posted &rarr; Paid
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
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Faktur Baru
                    </Link>
                </div>
            </div>

            {/* 4 Kartu Tahapan Terpisah (Klik untuk memfilter langsung per kategori) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {stageCards.map((card) => {
                    const Icon = card.icon;
                    const isSelected = activeStatus === card.key;
                    return (
                        <button
                            key={card.key}
                            type="button"
                            onClick={() => handleFilterStatus(isSelected ? 'all' : card.key)}
                            className={`text-left rounded-lg border p-3.5 transition cursor-pointer shadow-2xs ${
                                isSelected
                                    ? card.activeBorder
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                        {card.step}
                                    </span>
                                    {card.title}
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-black ${card.badgeBg}`}
                                >
                                    <Icon className="h-3 w-3" />
                                    {card.count}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                                {card.subtitle}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Filter Pills Bar */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase">
                    <Filter className="h-3 w-3" /> Tampilan:
                </span>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('all')}
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                        activeStatus === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua Kategori Terpisah
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('to_invoice')}
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                        activeStatus === 'to_invoice'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    SO Perlu Difakturkan ({counts?.to_invoice || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('draft')}
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
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
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                        activeStatus === 'posted'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Posted ({counts?.posted || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('paid')}
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                        activeStatus === 'paid'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Paid ({counts?.paid || 0})
                </button>
            </div>

            <div className="space-y-6">
                {/* 1. BAGIAN SO YANG PERLU DIFAKTURKAN */}
                {(activeStatus === 'all' || activeStatus === 'to_invoice') && (
                    <div className="rounded-lg border border-amber-300 bg-white shadow-xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                                    1
                                </span>
                                <span className="text-xs font-bold text-amber-950">
                                    SO yang Perlu Difakturkan ({pendingOrders.length} SO)
                                </span>
                                <span className="hidden sm:inline text-[11px] text-amber-800">
                                    — Barang sudah dikirim gudang dan belum dibuatkan draf faktur
                                </span>
                            </div>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="p-7 text-center text-xs text-slate-500">
                                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                                Semua Sales Order yang sudah dikirim gudang telah dibuatkan faktur.
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
                                            <tr key={so.sales_order_id} className="hover:bg-amber-50/30 transition">
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
                                                        className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 transition"
                                                    >
                                                        Buat Draft Faktur
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

                {/* TAMPILAN SEMUA KATEGORI TERPISAH (Draft, Posted, Paid dipisah masing-masing tabel) */}
                {activeStatus === 'all' && (
                    <>
                        {/* 2. FAKTUR DRAFT */}
                        <div className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                                        2
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                        Faktur Draft ({draftRows.length} Faktur)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-slate-500">
                                        — Draf faktur yang menunggu validasi &amp; posting oleh Finance
                                    </span>
                                </div>
                            </div>
                            <InvoiceTable
                                rows={draftRows}
                                emptyMessage="Tidak ada Faktur Pelanggan berstatus Draft saat ini."
                            />
                        </div>

                        {/* 3. FAKTUR POSTED (BELUM LUNAS) */}
                        <div className="rounded-lg border border-teal-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200 bg-teal-50/70 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                                        3
                                    </span>
                                    <span className="text-xs font-bold text-teal-950">
                                        Faktur Posted — Belum Lunas ({postedRows.length} Faktur)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-teal-800">
                                        — Sudah tercatat di Buku Besar Piutang dan menunggu pelunasan pelanggan
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-teal-900">
                                    Total Sisa Piutang: {formatRp(counts?.open_ar || 0)}
                                </span>
                            </div>
                            <InvoiceTable
                                rows={postedRows}
                                emptyMessage="Tidak ada Faktur Pelanggan berstatus Posted (Belum Lunas)."
                            />
                        </div>

                        {/* 4. FAKTUR PAID (LUNAS) */}
                        <div className="rounded-lg border border-emerald-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                                        4
                                    </span>
                                    <span className="text-xs font-bold text-emerald-950">
                                        Faktur Paid — Lunas ({paidRows.length} Faktur)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-emerald-800">
                                        — Faktur pelanggan yang pembayarannya telah selesai direkonsiliasi
                                    </span>
                                </div>
                            </div>
                            <InvoiceTable
                                rows={paidRows}
                                emptyMessage="Belum ada Faktur Pelanggan berstatus Paid (Lunas)."
                            />
                        </div>
                    </>
                )}

                {/* TAMPILAN FILTER SPESIFIK (Draft / Posted / Paid saja) */}
                {['draft', 'posted', 'paid'].includes(activeStatus) && (
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                {activeStatus === 'draft' && `Daftar Faktur Pelanggan — Draft (${invoices?.total || 0})`}
                                {activeStatus === 'posted' && `Daftar Faktur Pelanggan — Posted / Belum Lunas (${invoices?.total || 0})`}
                                {activeStatus === 'paid' && `Daftar Faktur Pelanggan — Paid / Lunas (${invoices?.total || 0})`}
                            </span>
                        </div>

                        <InvoiceTable
                            rows={invoices?.data || []}
                            emptyMessage="Tidak ada Faktur Pelanggan pada status ini."
                        />

                        {/* Pagination */}
                        {invoices?.links && invoices.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                                <div className="text-xs text-slate-500">
                                    Menampilkan <span className="font-semibold text-slate-700">{invoices.from || 0}</span> -{' '}
                                    <span className="font-semibold text-slate-700">{invoices.to || 0}</span> dari{' '}
                                    <span className="font-semibold text-slate-700">{invoices.total || 0}</span> faktur
                                </div>
                                <div className="flex items-center gap-1">
                                    {invoices.links.map((link, idx) =>
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveState
                                                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                                                    link.active
                                                        ? 'bg-slate-900 text-white'
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={idx}
                                                className="rounded px-2.5 py-1 text-xs text-slate-300"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AccountingLayout>
    );
}
