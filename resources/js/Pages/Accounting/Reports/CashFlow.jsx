import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    ArrowLeftRight,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function CashFlow({ report }) {
    const movements = report?.movements || [];

    return (
        <AccountingLayout
            title="Arus Kas"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Arus Kas' },
            ]}
        >
            <Head title="Laporan Arus Kas — Accounting" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">
                                Laporan Arus Kas (Cash Flow Statement)
                            </h1>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Mutasi Likuiditas Akun Kas (1010) &amp; Bank (1020) —{' '}
                            <span className="font-semibold text-slate-700">
                                {report?.period_label}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('accounting.payments.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Wallet className="h-3.5 w-3.5 text-slate-500" />
                            <span>Buka Menu Pembayaran</span>
                        </Link>
                    </div>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Saldo Awal Kas &amp; Bank
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-slate-900">
                            {formatRp(report?.opening_balance)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Posisi Saldo Pembukaan (OPENING)
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                            Arus Kas Masuk (Inflow)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-700">
                            +{formatRp(report?.total_inflow)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Pelunasan Pelanggan (AR) &amp; Kasir POS
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Arus Kas Keluar (Outflow)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-rose-700">
                            -{formatRp(report?.total_outflow)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Pembayaran Tagihan Pemasok (AP)
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                            Saldo Akhir Kas &amp; Bank
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-indigo-700">
                            {formatRp(report?.ending_balance)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Kas: {formatRp(report?.cash_balance)} • Bank:{' '}
                            {formatRp(report?.bank_balance)}
                        </p>
                    </div>
                </div>

                {/* Ringkasan Struktur Arus Kas Operasional */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                            Ringkasan Aktivitas Arus Kas (Metode Langsung)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-slate-50 font-bold text-slate-800">
                                    <td className="px-5 py-3">
                                        I. SALDO AWAL KAS &amp; SETARA KAS (1010 + 1020)
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono">
                                        {formatRp(report?.opening_balance)}
                                    </td>
                                </tr>

                                <tr className="bg-emerald-50/40">
                                    <td
                                        colSpan={2}
                                        className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-900"
                                    >
                                        II. ARUS KAS MASUK DARI AKTIVITAS OPERASIONAL
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 pl-8 text-slate-700">
                                        Penerimaan Kas/Bank dari Pelanggan B2B (Pelunasan Faktur AR)
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                        +{formatRp(report?.inflow_customer_ar)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 pl-8 text-slate-700">
                                        Penerimaan Kas/Bank dari Penjualan Ritel Toko (Point of Sale)
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                        +{formatRp(report?.inflow_pos_retail)}
                                    </td>
                                </tr>
                                {(report?.inflow_other || 0) > 0 && (
                                    <tr>
                                        <td className="px-5 py-2.5 pl-8 text-slate-700">
                                            Penerimaan Kas/Bank Operasional Lainnya
                                        </td>
                                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                            +{formatRp(report?.inflow_other)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-slate-50/80 font-bold text-slate-900">
                                    <td className="px-5 py-2.5 text-right">
                                        Total Arus Kas Masuk Operasional:
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono text-emerald-800">
                                        +{formatRp(report?.total_inflow)}
                                    </td>
                                </tr>

                                <tr className="bg-rose-50/40">
                                    <td
                                        colSpan={2}
                                        className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-900"
                                    >
                                        III. ARUS KAS KELUAR UNTUK AKTIVITAS OPERASIONAL
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-2.5 pl-8 text-slate-700">
                                        Pembayaran Kas/Bank kepada Pemasok (Pelunasan Vendor Bill AP)
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-rose-700">
                                        -{formatRp(report?.outflow_vendor_ap)}
                                    </td>
                                </tr>
                                {(report?.outflow_other || 0) > 0 && (
                                    <tr>
                                        <td className="px-5 py-2.5 pl-8 text-slate-700">
                                            Pengeluaran Kas/Bank Operasional Lainnya
                                        </td>
                                        <td className="px-5 py-2.5 text-right font-mono font-semibold text-rose-700">
                                            -{formatRp(report?.outflow_other)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-slate-50/80 font-bold text-slate-900">
                                    <td className="px-5 py-2.5 text-right">
                                        Total Arus Kas Keluar Operasional:
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono text-rose-800">
                                        -{formatRp(report?.total_outflow)}
                                    </td>
                                </tr>

                                <tr className="bg-indigo-50/50 font-bold text-slate-900">
                                    <td className="px-5 py-3">
                                        IV. KENAIKAN / (PENURUNAN) BERSIH KAS PERIODE BERJALAN
                                    </td>
                                    <td
                                        className={`px-5 py-3 text-right font-mono ${
                                            (report?.net_cash_change || 0) >= 0
                                                ? 'text-emerald-700'
                                                : 'text-rose-700'
                                        }`}
                                    >
                                        {(report?.net_cash_change || 0) >= 0 ? '+' : ''}
                                        {formatRp(report?.net_cash_change)}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="border-t-2 border-slate-300 bg-emerald-50/80 font-extrabold text-slate-900">
                                <tr>
                                    <td className="px-5 py-3.5 text-sm uppercase">
                                        V. SALDO AKHIR KAS &amp; SETARA KAS (1010 + 1020)
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono text-base text-emerald-800">
                                        {formatRp(report?.ending_balance)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Tabel Kronologis Mutasi Kas & Bank */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Rincian Mutasi Kronologis Kas (1010) &amp; Bank (1020)
                        </h3>
                        <span className="text-[11px] text-slate-400">
                            Total {movements.length} transaksi kas/bank
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                                <tr>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5">No. Jurnal</th>
                                    <th className="px-4 py-2.5">Akun Kas/Bank</th>
                                    <th className="px-4 py-2.5">Kategori Arus Kas</th>
                                    <th className="px-4 py-2.5">Dokumen</th>
                                    <th className="px-4 py-2.5 text-right">Kas Masuk (Debit)</th>
                                    <th className="px-4 py-2.5 text-right">Kas Keluar (Kredit)</th>
                                    <th className="px-4 py-2.5 text-right">Saldo Kas Kumulatif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movements.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono text-slate-600">
                                            {m.entry_date}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">
                                            <Link
                                                href={route(
                                                    'accounting.journals.show',
                                                    m.journal_entry_id
                                                )}
                                                className="hover:underline"
                                            >
                                                {m.entry_no}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-slate-800">
                                            <span className="font-bold">{m.account_code}</span> —{' '}
                                            {m.account_name}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="font-medium text-slate-800">
                                                {m.category}
                                            </span>
                                            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                                                {m.description}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">
                                            {m.source_url ? (
                                                <Link
                                                    href={m.source_url}
                                                    className="text-indigo-700 hover:underline"
                                                >
                                                    {m.source_document_id}
                                                </Link>
                                            ) : (
                                                m.source_document_id
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                            {m.is_opening
                                                ? formatRp(m.net_change)
                                                : m.inflow > 0
                                                ? `+${formatRp(m.inflow)}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-700">
                                            {m.outflow > 0 ? `-${formatRp(m.outflow)}` : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                            {formatRp(m.running_balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}

