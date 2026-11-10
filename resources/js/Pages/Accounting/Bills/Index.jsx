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
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function VendorBillIndex({
    bills,
    pendingOrders = [],
    filters = {},
    counts = {},
}) {
    const [search, setSearch] = useState(filters?.search || '');

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
            { status: filters?.status || 'all', search },
            { preserveState: true }
        );
    };

    const activeStatus = filters?.status || 'all';

    return (
        <AccountingLayout
            title="Tagihan Pemasok (Bills)"
            breadcrumbs={[
                { label: 'Pemasok' },
                { label: 'Tagihan Pemasok (Bills)' },
            ]}
        >
            <Head title="Tagihan Pemasok (Vendor Bills) — Bara Wear" />

            {/* Odoo Control Panel Header (Senada dengan Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Tagihan Pemasok (Vendor Bills)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Kelola tagihan pembelian pemasok berdasarkan barang yang telah diterima &amp; lolos QC gudang
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
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Tagihan Baru
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
                    Semua Tagihan ({counts?.all || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterStatus('to_bill')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeStatus === 'to_bill'
                            ? 'bg-emerald-700 text-white font-semibold'
                            : (counts?.to_bill || 0) > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span>PO Perlu Ditagih ({counts?.to_bill || 0})</span>
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
                    Belum Dibayar / Posted ({counts?.posted || 0})
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

            {/* Bagian Antrean Purchase Order yang Perlu Diurus Tagihannya */}
            {(activeStatus === 'to_bill' || (activeStatus === 'all' && pendingOrders.length > 0)) && (
                <div className="mb-5 rounded-lg border border-emerald-300 bg-white shadow-xs overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="text-xs font-bold text-emerald-950">
                                Daftar Purchase Order (PO) yang Perlu Dibuatkan Tagihan ({pendingOrders.length} PO)
                            </span>
                            <span className="hidden sm:inline text-[11px] text-emerald-700">
                                — Barang sudah diterima &amp; lolos QC gudang
                            </span>
                        </div>
                    </div>

                    {pendingOrders.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                            Semua Purchase Order yang sudah diterima gudang telah selesai dibuatkan Vendor Bill.
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
                                        <tr key={po.purchase_order_id} className="hover:bg-emerald-50/30 transition">
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
                                                    className="inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition"
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
            )}

            {/* Tabel Daftar Tagihan Pemasok */}
            {activeStatus !== 'to_bill' && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
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
                                {bills?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                                            Belum ada dokumen Tagihan Pemasok yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    bills?.data?.map((b) => (
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {bills?.links && bills.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                            <div className="text-xs text-slate-500">
                                Menampilkan {bills.from || 0} - {bills.to || 0} dari {bills.total} data
                            </div>
                            <div className="flex items-center gap-1">
                                {bills.links.map((link, idx) => (
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
