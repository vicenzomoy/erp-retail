import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    Filter,
    FileSpreadsheet,
    ArrowDownLeft,
    ArrowRight,
    Wallet,
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

function BillTable({
    rows = [],
    emptyMessage = 'Belum ada dokumen Tagihan Pemasok pada kategori ini.',
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
                        <th className="px-4 py-2.5">No. Tagihan</th>
                        <th className="px-4 py-2.5">PO / Penerimaan</th>
                        <th className="px-4 py-2.5">Pemasok (Vendor)</th>
                        <th className="px-4 py-2.5">Tgl Tagihan</th>
                        <th className="px-4 py-2.5">Jatuh Tempo</th>
                        <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                        <th className="px-4 py-2.5 text-right">Sisa Utang</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((b) => (
                        <tr
                            key={b.id}
                            className="hover:bg-slate-50 transition cursor-pointer group"
                            onClick={() => router.visit(route('accounting.bills.show', b.id))}
                        >
                            <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                                <span className="font-mono">{b.id}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {b.purchase_order_id ? (
                                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                        <span className="font-semibold text-slate-800">{b.purchase_order_id}</span>
                                        {b.receipt_id && (
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 border border-slate-200">
                                                {b.receipt_id}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400">Saldo Awal</span>
                                )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                {b.vendor_name}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {b.bill_date || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {b.due_date || '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {formatRp(b.grand_total)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                                {formatRp(b.amount_residual)}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                <OdooBadge status={b.status} />
                            </td>
                            <td
                                className="px-4 py-3 text-right whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="inline-flex items-center gap-2">
                                    {b.status === 'draft' && (
                                        <Link
                                            href={route('accounting.bills.show', b.id)}
                                            className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                                        >
                                            Validasi / Posting
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                    {b.status === 'posted' && b.amount_residual > 0 && (
                                        <Link
                                            href={route('accounting.payments.create', {
                                                document_type: 'vendor_bill',
                                                document_id: b.id,
                                            })}
                                            className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800"
                                        >
                                            <Wallet className="h-3 w-3" />
                                            Bayar
                                        </Link>
                                    )}
                                    <Link
                                        href={route('accounting.bills.show', b.id)}
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

export default function VendorBillIndex({
    bills,
    groupedBills = {},
    pendingOrders = [],
    filters = {},
    counts = {},
}) {
    const [search, setSearch] = useState(filters?.search || '');
    const activeStatus = filters?.status || 'all';

    const handleFilterStatus = (status) => {
        router.get(
            route('accounting.bills.index'),
            { status, search },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.bills.index'),
            { status: activeStatus, search },
            { preserveState: true }
        );
    };

    const stageCards = [
        {
            key: 'to_bill',
            step: '1',
            title: 'PO Perlu Ditagih',
            subtitle: 'Barang sudah diterima & lolos QC gudang, siap dibuatkan draf tagihan',
            count: counts?.to_bill || 0,
            icon: ArrowDownLeft,
            badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'draft',
            step: '2',
            title: 'Draft',
            subtitle: 'Draf tagihan menunggu validasi Three-Way Match & posting',
            count: counts?.draft || 0,
            icon: Clock,
            badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'posted',
            step: '3',
            title: 'Posted',
            subtitle: `Menunggu pembayaran ke pemasok (Utang: ${formatRp(counts?.open_ap || 0)})`,
            count: counts?.posted || 0,
            icon: FileText,
            badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
        {
            key: 'paid',
            step: '4',
            title: 'Paid',
            subtitle: 'Tagihan pemasok yang sudah lunas dibayarkan',
            count: counts?.paid || 0,
            icon: CheckCircle2,
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            activeBorder: 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50',
        },
    ];

    const draftRows = groupedBills?.draft || [];
    const postedRows = groupedBills?.posted || [];
    const paidRows = groupedBills?.paid || [];

    return (
        <AccountingLayout
            title="Tagihan Pemasok (Bills)"
            breadcrumbs={[
                { label: 'Pemasok' },
                { label: 'Tagihan Pemasok (Bills)' },
            ]}
        >
            <Head title="Tagihan Pemasok (Vendor Bills) — Bara Wear" />

            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Tagihan Pemasok (Vendor Bills)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Alur tagihan pemasok terpisah: PO Perlu Ditagih &rarr; Draft &rarr; Posted &rarr; Paid
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
                                placeholder="Cari Bill, PO, Receipt, atau Vendor..."
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
                        href={route('accounting.bills.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Tagihan Baru
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
                    onClick={() => handleFilterStatus('to_bill')}
                    className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                        activeStatus === 'to_bill'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    PO Perlu Ditagih ({counts?.to_bill || 0})
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
                {/* 1. BAGIAN PO YANG PERLU DITAGIH */}
                {(activeStatus === 'all' || activeStatus === 'to_bill') && (
                    <div className="rounded-lg border border-amber-300 bg-white shadow-xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                                    1
                                </span>
                                <span className="text-xs font-bold text-amber-950">
                                    PO yang Perlu Ditagih ({pendingOrders.length} PO)
                                </span>
                                <span className="hidden sm:inline text-[11px] text-amber-800">
                                    — Barang sudah diterima &amp; lolos QC gudang, belum dibuatkan draf tagihan
                                </span>
                            </div>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="p-7 text-center text-xs text-slate-500">
                                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                                Semua Purchase Order yang sudah diterima gudang telah dibuatkan Vendor Bill.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <tr>
                                            <th className="px-4 py-2.5">Purchase Order</th>
                                            <th className="px-4 py-2.5">Pemasok (Vendor)</th>
                                            <th className="px-4 py-2.5">Penerimaan Gudang (QC)</th>
                                            <th className="px-4 py-2.5 text-center">Dipesan</th>
                                            <th className="px-4 py-2.5 text-center">Diterima Baik (QC)</th>
                                            <th className="px-4 py-2.5 text-center">Siap Ditagih</th>
                                            <th className="px-4 py-2.5 text-right">Estimasi Tagihan</th>
                                            <th className="px-4 py-2.5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingOrders.map((po) => (
                                            <tr key={po.purchase_order_id} className="hover:bg-amber-50/30 transition">
                                                <td className="px-4 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {po.purchase_order_id}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-slate-900">
                                                    {po.vendor_name}
                                                    <span className="ml-1.5 text-[11px] text-slate-400">
                                                        ({po.payment_terms || 'CASH'})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    {po.primary_receipt_id ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                                            <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                                                            {po.primary_receipt_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-semibold text-slate-600">
                                                    {po.total_ordered} pcs
                                                </td>
                                                <td className="px-4 py-2.5 text-center font-bold text-emerald-700">
                                                    {po.total_accepted} pcs
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-900 border border-amber-300">
                                                        {po.total_billable} pcs
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(po.estimated_amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={route('accounting.bills.create', {
                                                            purchase_order_id: po.purchase_order_id,
                                                        })}
                                                        className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 transition"
                                                    >
                                                        Buat Draft Tagihan
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
                        {/* 2. TAGIHAN DRAFT */}
                        <div className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                                        2
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                        Tagihan Draft ({draftRows.length} Tagihan)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-slate-500">
                                        — Draf tagihan yang menunggu validasi Three-Way Match &amp; posting oleh Finance
                                    </span>
                                </div>
                            </div>
                            <BillTable
                                rows={draftRows}
                                emptyMessage="Tidak ada Tagihan Pemasok berstatus Draft saat ini."
                            />
                        </div>

                        {/* 3. TAGIHAN POSTED (BELUM DIBAYAR) */}
                        <div className="rounded-lg border border-teal-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200 bg-teal-50/70 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                                        3
                                    </span>
                                    <span className="text-xs font-bold text-teal-950">
                                        Tagihan Posted — Belum Dibayar ({postedRows.length} Tagihan)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-teal-800">
                                        — Sudah tercatat di Buku Besar Utang Usaha dan menunggu pelunasan ke pemasok
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-teal-900">
                                    Total Sisa Utang: {formatRp(counts?.open_ap || 0)}
                                </span>
                            </div>
                            <BillTable
                                rows={postedRows}
                                emptyMessage="Tidak ada Tagihan Pemasok berstatus Posted (Belum Dibayar)."
                            />
                        </div>

                        {/* 4. TAGIHAN PAID (LUNAS) */}
                        <div className="rounded-lg border border-emerald-300 bg-white shadow-xs overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                                        4
                                    </span>
                                    <span className="text-xs font-bold text-emerald-950">
                                        Tagihan Paid — Lunas ({paidRows.length} Tagihan)
                                    </span>
                                    <span className="hidden sm:inline text-[11px] text-emerald-800">
                                        — Tagihan pemasok yang pembayarannya telah selesai direkonsiliasi
                                    </span>
                                </div>
                            </div>
                            <BillTable
                                rows={paidRows}
                                emptyMessage="Belum ada Tagihan Pemasok berstatus Paid (Lunas)."
                            />
                        </div>
                    </>
                )}

                {/* TAMPILAN FILTER SPESIFIK (Draft / Posted / Paid saja) */}
                {['draft', 'posted', 'paid'].includes(activeStatus) && (
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                {activeStatus === 'draft' && `Daftar Tagihan Pemasok — Draft (${bills?.total || 0})`}
                                {activeStatus === 'posted' && `Daftar Tagihan Pemasok — Posted / Belum Dibayar (${bills?.total || 0})`}
                                {activeStatus === 'paid' && `Daftar Tagihan Pemasok — Paid / Lunas (${bills?.total || 0})`}
                            </span>
                        </div>

                        <BillTable
                            rows={bills?.data || []}
                            emptyMessage="Tidak ada Tagihan Pemasok pada status ini."
                        />

                        {/* Pagination */}
                        {bills?.links && bills.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                                <div className="text-xs text-slate-500">
                                    Menampilkan <span className="font-semibold text-slate-700">{bills.from || 0}</span> -{' '}
                                    <span className="font-semibold text-slate-700">{bills.to || 0}</span> dari{' '}
                                    <span className="font-semibold text-slate-700">{bills.total || 0}</span> tagihan
                                </div>
                                <div className="flex items-center gap-1">
                                    {bills.links.map((link, idx) =>
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
