import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Search,
    Wallet,
    ArrowRight,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    Plus,
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
    const activeType = filters?.type || 'all';

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
            { type: activeType, search },
            { preserveState: true }
        );
    };

    const pendingInboundCount = pendingDocuments.filter((d) => d.payment_type === 'inbound').length;
    const pendingOutboundCount = pendingDocuments.filter((d) => d.payment_type === 'outbound').length;

    return (
        <AccountingLayout
            title="Pembayaran & Penerimaan"
            breadcrumbs={[
                { label: 'Kas & Pembayaran' },
                { label: 'Pembayaran & Penerimaan' },
            ]}
        >
            <Head title="Pembayaran & Penerimaan — Bara Wear" />

            {/* Header Control Panel */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-base font-bold text-slate-900">
                        Pembayaran &amp; Penerimaan Kas / Bank
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Catat uang masuk dari pelanggan dan pembayaran tagihan ke pemasok dengan mudah.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nomor, nama, referensi..."
                            className="w-56 sm:w-64 rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
                        />
                    </form>

                    <Link
                        href={route('accounting.payments.create', {
                            document_type: 'customer_invoice',
                        })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                    >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        Terima Pembayaran
                    </Link>

                    <Link
                        href={route('accounting.payments.create', {
                            document_type: 'vendor_bill',
                        })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Bayar Tagihan
                    </Link>
                </div>
            </div>

            {/* 3 Kartu Ringkasan Cepat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <button
                    type="button"
                    onClick={() => handleFilterType('pending')}
                    className={`text-left rounded-lg border p-3.5 transition cursor-pointer ${
                        activeType === 'pending'
                            ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-300'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Menunggu Pembayaran
                        </span>
                        <span className="rounded-full bg-amber-100 p-1.5 text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                        </span>
                    </div>
                    <div className="mt-1.5 text-xl font-black text-slate-900">
                        {counts?.pending ?? pendingDocuments.length} Dokumen
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        {pendingInboundCount} dari pelanggan &bull; {pendingOutboundCount} ke pemasok
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleFilterType('inbound')}
                    className={`text-left rounded-lg border p-3.5 transition cursor-pointer ${
                        activeType === 'inbound'
                            ? 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-300'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Uang Masuk (Pelanggan)
                        </span>
                        <span className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                        </span>
                    </div>
                    <div className="mt-1.5 text-xl font-black text-emerald-700">
                        {counts?.inbound || 0} Transaksi
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Pembayaran diterima dari pelanggan
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleFilterType('outbound')}
                    className={`text-left rounded-lg border p-3.5 transition cursor-pointer ${
                        activeType === 'outbound'
                            ? 'border-slate-400 bg-slate-100/80 ring-1 ring-slate-300'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Uang Keluar (Pemasok)
                        </span>
                        <span className="rounded-full bg-slate-100 p-1.5 text-slate-700">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                    <div className="mt-1.5 text-xl font-black text-slate-900">
                        {counts?.outbound || 0} Transaksi
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Pembayaran tagihan ke pemasok
                    </div>
                </button>
            </div>

            {/* Tab Navigasi Sederhana */}
            <div className="flex items-center gap-1.5 mb-4 border-b border-slate-200 pb-2.5 overflow-x-auto text-xs">
                <button
                    type="button"
                    onClick={() => handleFilterType('all')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition whitespace-nowrap cursor-pointer ${
                        activeType === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Semua ({counts?.all || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('pending')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition whitespace-nowrap cursor-pointer ${
                        activeType === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <span>Belum Lunas</span>
                    <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            activeType === 'pending'
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                        {counts?.pending ?? pendingDocuments.length}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('inbound')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 font-semibold transition whitespace-nowrap cursor-pointer ${
                        activeType === 'inbound'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Uang Masuk ({counts?.inbound || 0})
                </button>
                <button
                    type="button"
                    onClick={() => handleFilterType('outbound')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 font-semibold transition whitespace-nowrap cursor-pointer ${
                        activeType === 'outbound'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Uang Keluar ({counts?.outbound || 0})
                </button>
            </div>

            {/* Daftar Tagihan Menunggu Pembayaran */}
            {(activeType === 'pending' || (activeType === 'all' && pendingDocuments.length > 0)) && (
                <div className="mb-5 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-amber-50/70 px-4 py-2.5 border-b border-amber-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-900">
                                Tagihan Menunggu Pembayaran ({pendingDocuments.length})
                            </span>
                        </div>
                        <span className="hidden sm:inline text-[11px] text-slate-600">
                            Klik tombol aksi di kanan untuk langsung mencatat pembayaran
                        </span>
                    </div>

                    {pendingDocuments.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5" />
                            Semua faktur pelanggan dan tagihan pemasok sudah lunas.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2.5">Mitra &amp; Dokumen</th>
                                        <th className="px-4 py-2.5">Jenis</th>
                                        <th className="px-4 py-2.5">Jatuh Tempo</th>
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
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-slate-900">
                                                    {doc.party_name}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                    {doc.id}
                                                    {doc.source_order_id && (
                                                        <span className="ml-1.5 text-slate-400">
                                                            &bull; Ref: {doc.source_order_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {doc.payment_type === 'inbound' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                                        <ArrowDownLeft className="h-3 w-3" />
                                                        Dari Pelanggan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        Ke Pemasok
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {doc.due_date || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="font-mono font-bold text-slate-900">
                                                    {formatRp(doc.amount_residual)}
                                                </div>
                                                {Number(doc.amount_paid) > 0 && (
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        dari {formatRp(doc.grand_total)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('accounting.payments.create', {
                                                        document_type: doc.document_type,
                                                        document_id: doc.id,
                                                    })}
                                                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold text-white transition ${
                                                        doc.payment_type === 'inbound'
                                                            ? 'bg-emerald-700 hover:bg-emerald-800'
                                                            : 'bg-slate-900 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {doc.payment_type === 'inbound'
                                                        ? 'Terima Uang'
                                                        : 'Bayar'}
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
                    <div className="bg-slate-50/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-800">
                                Riwayat Pembayaran Tercatat
                            </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                            Klik baris untuk melihat bukti pembayaran
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-2.5">No. Pembayaran</th>
                                    <th className="px-4 py-2.5">Arus Kas</th>
                                    <th className="px-4 py-2.5">Mitra &amp; Tagihan</th>
                                    <th className="px-4 py-2.5">Akun Kas / Bank</th>
                                    <th className="px-4 py-2.5 text-right">Nominal</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
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
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-mono font-bold text-slate-900">
                                                    {pay.id}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {pay.payment_date}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {pay.payment_type === 'inbound' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                                        <ArrowDownLeft className="h-3 w-3" />
                                                        Uang Masuk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        Uang Keluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">
                                                    {pay.party_name}
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                                    Dok: {pay.document_id || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {pay.bank_account_name}
                                                <span className="ml-1 text-[11px] text-slate-400 font-mono">
                                                    ({pay.bank_account_code})
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                                                <span
                                                    className={
                                                        pay.payment_type === 'inbound'
                                                            ? 'text-emerald-700'
                                                            : 'text-slate-900'
                                                    }
                                                >
                                                    {pay.payment_type === 'inbound' ? '+' : '-'}
                                                    {formatRp(pay.amount)}
                                                </span>
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
                                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition"
                                                >
                                                    Detail
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
