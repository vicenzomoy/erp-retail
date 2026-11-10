import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    Filter,
    Wallet,
    ArrowRight,
    ArrowDownLeft,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function PaymentIndex({
    payments,
    pendingDocuments = [],
    filters = {},
    counts = {},
}) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilterType = (type) => {
        router.get(
            route('accounting.payments.index'),
            { type, search },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.payments.index'),
            { type: filters?.type || 'all', search },
            { preserveState: true }
        );
    };

    const activeType = filters?.type || 'all';

    return (
        <AccountingLayout
            title="Pembayaran (Payments)"
            breadcrumbs={[
                { label: 'Kas & Pembayaran' },
                { label: 'Pembayaran (Payments)' },
            ]}
        >
            <Head title="Pembayaran (Payments) — Bara Wear" />

            {/* Odoo Control Panel Header (Senada dengan Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Pembayaran Kas &amp; Bank (Register Payment)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Catat penerimaan pembayaran piutang pelanggan (AR) dan pelunasan tagihan pemasok (AP)
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
                                placeholder="Cari No. Pembayaran, Mitra, Referensi..."
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
                        href={route('accounting.payments.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Catat Pembayaran Baru
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
                    onClick={() => handleFilterType('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeType === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua Pembayaran ({counts?.all || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('pending')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeType === 'pending'
                            ? 'bg-emerald-700 text-white font-semibold'
                            : (counts?.pending || 0) > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span>Tagihan Menunggu Pembayaran ({counts?.pending || 0})</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('inbound')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeType === 'inbound'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Penerimaan Pelanggan / AR ({counts?.inbound || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('outbound')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeType === 'outbound'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Pelunasan Pemasok / AP ({counts?.outbound || 0})
                </button>
            </div>

            {/* Bagian Antrean Faktur & Tagihan yang Perlu Dibayar / Diterima Pembayarannya */}
            {(activeType === 'pending' || (activeType === 'all' && pendingDocuments.length > 0)) && (
                <div className="mb-5 rounded-lg border border-emerald-300 bg-white shadow-xs overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="text-xs font-bold text-emerald-950">
                                Daftar Faktur &amp; Tagihan yang Menunggu Pembayaran ({pendingDocuments.length} Dokumen)
                            </span>
                            <span className="hidden sm:inline text-[11px] text-emerald-700">
                                — Klik tombol di kanan untuk langsung mencatat pelunasan
                            </span>
                        </div>
                    </div>

                    {pendingDocuments.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                            Seluruh Faktur Pelanggan dan Tagihan Pemasok sudah lunas.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2.5">Jenis Tagihan</th>
                                        <th className="px-4 py-2.5">No. Dokumen</th>
                                        <th className="px-4 py-2.5">Pelanggan / Pemasok</th>
                                        <th className="px-4 py-2.5">Jatuh Tempo</th>
                                        <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                        <th className="px-4 py-2.5 text-right">Sudah Dibayar</th>
                                        <th className="px-4 py-2.5 text-right">Sisa Tagihan</th>
                                        <th className="px-4 py-2.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingDocuments.map((doc) => (
                                        <tr
                                            key={`${doc.document_type}-${doc.id}`}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {doc.payment_type === 'inbound' ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                                        <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                                                        Piutang Pelanggan (AR)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                                                        <ArrowUpRight className="h-3 w-3 text-amber-700" />
                                                        Utang Pemasok (AP)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {doc.id}
                                                {doc.source_order_id && (
                                                    <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                                                        ({doc.source_order_id})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-slate-900">
                                                {doc.party_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                                {doc.due_date || '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                                                {formatRp(doc.grand_total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-slate-500 whitespace-nowrap">
                                                {formatRp(doc.amount_paid)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {formatRp(doc.amount_residual)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('accounting.payments.create', {
                                                        document_type: doc.document_type,
                                                        document_id: doc.id,
                                                    })}
                                                    className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold text-white transition ${
                                                        doc.payment_type === 'inbound'
                                                            ? 'bg-emerald-700 hover:bg-emerald-800'
                                                            : 'bg-slate-900 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {doc.payment_type === 'inbound'
                                                        ? 'Terima Pembayaran'
                                                        : 'Bayar Tagihan'}
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

            {/* Tabel Riwayat Pembayaran Tercatat */}
            {activeType !== 'pending' && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">No. Pembayaran</th>
                                    <th className="px-4 py-2.5">Jenis Transaksi</th>
                                    <th className="px-4 py-2.5">Pelanggan / Pemasok</th>
                                    <th className="px-4 py-2.5">Dokumen Tagihan</th>
                                    <th className="px-4 py-2.5">Akun Kas / Bank</th>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5 text-right">Nominal</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                                            Belum ada transaksi pembayaran yang tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    payments?.data?.map((pay) => (
                                        <tr
                                            key={pay.id}
                                            className="hover:bg-slate-50 transition cursor-pointer group"
                                            onClick={() =>
                                                router.visit(route('accounting.payments.show', pay.id))
                                            }
                                        >
                                            <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                                                <Wallet className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                                                <span className="font-mono">{pay.id}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {pay.payment_type === 'inbound' ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        <ArrowDownLeft className="h-3 w-3" />
                                                        Penerimaan (AR)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        Pelunasan (AP)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                {pay.party_name}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                                                {pay.document_id || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {pay.bank_account_code} — {pay.bank_account_name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {pay.payment_date}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {formatRp(pay.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <OdooBadge status={pay.status} />
                                            </td>
                                            <td
                                                className="px-4 py-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link
                                                    href={route('accounting.payments.show', pay.id)}
                                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                                                >
                                                    Buka
                                                    <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {payments?.links && payments.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                            <div className="text-xs text-slate-500">
                                Menampilkan {payments.from || 0} - {payments.to || 0} dari {payments.total} data
                            </div>
                            <div className="flex items-center gap-1">
                                {payments.links.map((link, idx) => (
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
