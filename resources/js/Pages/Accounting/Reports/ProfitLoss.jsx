import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    TrendingUp,
    ArrowUpRight,
    Landmark,
    BookOpen,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function ProfitLoss({ report }) {
    const revenues = report?.revenues || [];
    const expenses = report?.expenses || [];
    const recentLines = report?.recent_lines || [];

    return (
        <AccountingLayout
            title="Laba dan Rugi"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Laba dan Rugi' },
            ]}
        >
            <Head title="Laba dan Rugi — Accounting" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">
                                Laporan Laba dan Rugi (Profit &amp; Loss)
                            </h1>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Kinerja Operasional PT Bara Ritel Nusantara —{' '}
                            <span className="font-semibold text-slate-700">
                                {report?.period_label}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('accounting.reports.balance-sheet')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Landmark className="h-3.5 w-3.5 text-slate-500" />
                            <span>Lihat Neraca Keuangan</span>
                        </Link>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Pendapatan Usaha
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-700">
                            {formatRp(report?.total_revenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Penjualan Grosir B2B (4000) &amp; POS (4010)
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Harga Pokok &amp; Beban
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-rose-700">
                            {formatRp(report?.total_expense)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            COGS (5000) &amp; Selisih Harga Beli (5100)
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Laba Bersih Tahun Berjalan
                        </p>
                        <p
                            className={`mt-1.5 font-mono text-xl font-extrabold ${
                                (report?.net_profit || 0) >= 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                            }`}
                        >
                            {formatRp(report?.net_profit)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Pendapatan Usaha dikurangi Beban Pokok
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Rasio Margin Laba
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-indigo-700">
                            {report?.margin_pct || 0}%
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Persentase Laba terhadap Total Omset
                        </p>
                    </div>
                </div>

                {/* Statement of Profit & Loss Sheet */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                            Rincian Perhitungan Laba dan Rugi
                        </h2>
                        <span className="text-[11px] text-slate-500">
                            Klik kode akun untuk membuka Buku Besar
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50/70 font-semibold uppercase text-slate-500 text-[11px]">
                                <tr>
                                    <th className="px-5 py-2.5">Kode Akun</th>
                                    <th className="px-5 py-2.5">Uraian Pos Laba Rugi</th>
                                    <th className="px-5 py-2.5 text-center">Proporsi Omset</th>
                                    <th className="px-5 py-2.5 text-right">Nilai (IDR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Bagian I: Pendapatan */}
                                <tr className="bg-emerald-50/50">
                                    <td
                                        colSpan={4}
                                        className="px-5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900"
                                    >
                                        I. PENDAPATAN USAHA (OPERATING REVENUE)
                                    </td>
                                </tr>
                                {revenues.map((rev) => (
                                    <tr key={rev.code} className="hover:bg-slate-50 transition">
                                        <td className="px-5 py-3 font-mono font-bold text-emerald-700">
                                            <Link
                                                href={route('accounting.reports.general-ledger', {
                                                    account: rev.code,
                                                })}
                                                className="inline-flex items-center gap-1 hover:underline"
                                            >
                                                <span>{rev.code}</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-slate-900">
                                            {rev.account_name}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                                {rev.share_pct}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(rev.balance)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-extrabold text-slate-900">
                                    <td colSpan={3} className="px-5 py-2.5 text-right">
                                        TOTAL PENDAPATAN USAHA (A):
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono text-emerald-800">
                                        {formatRp(report?.total_revenue)}
                                    </td>
                                </tr>

                                {/* Bagian II: Harga Pokok Penjualan & Beban */}
                                <tr className="bg-rose-50/50">
                                    <td
                                        colSpan={4}
                                        className="px-5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-rose-900"
                                    >
                                        II. BEBAN POKOK PENJUALAN &amp; BEBAN LANGSUNG (COGS)
                                    </td>
                                </tr>
                                {expenses.map((exp) => (
                                    <tr key={exp.code} className="hover:bg-slate-50 transition">
                                        <td className="px-5 py-3 font-mono font-bold text-rose-700">
                                            <Link
                                                href={route('accounting.reports.general-ledger', {
                                                    account: exp.code,
                                                })}
                                                className="inline-flex items-center gap-1 hover:underline"
                                            >
                                                <span>{exp.code}</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-slate-900">
                                            {exp.account_name}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                                                {exp.pct_of_revenue}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono font-bold text-rose-700">
                                            ({formatRp(exp.balance)})
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-extrabold text-slate-900">
                                    <td colSpan={3} className="px-5 py-2.5 text-right">
                                        TOTAL BEBAN POKOK &amp; OPERASIONAL (B):
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-mono text-rose-800">
                                        ({formatRp(report?.total_expense)})
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="border-t-2 border-slate-300 bg-emerald-50/80 font-extrabold text-slate-900">
                                <tr>
                                    <td colSpan={2} className="px-5 py-3.5 text-sm uppercase">
                                        LABA / (RUGI) BERSIH TAHUN BERJALAN (A − B)
                                    </td>
                                    <td className="px-5 py-3.5 text-center text-xs text-emerald-800">
                                        Margin: {report?.margin_pct}%
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono text-base text-emerald-800">
                                        {formatRp(report?.net_profit)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Tabel Jurnal Pendapatan & COGS Terbaru */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Rincian Entri Jurnal Pendapatan (4000/4010) &amp; HPP/COGS (5000/5100)
                            </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">
                            Menampilkan {recentLines.length} baris jurnal terbaru
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                                <tr>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5">No. Jurnal</th>
                                    <th className="px-4 py-2.5">Dokumen Sumber</th>
                                    <th className="px-4 py-2.5">Akun</th>
                                    <th className="px-4 py-2.5">Keterangan</th>
                                    <th className="px-4 py-2.5 text-right">Beban (Debit)</th>
                                    <th className="px-4 py-2.5 text-right">Pendapatan (Kredit)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentLines.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-6 text-center text-slate-400"
                                        >
                                            Belum ada mutasi jurnal pendapatan atau beban.
                                        </td>
                                    </tr>
                                ) : (
                                    recentLines.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-2.5 font-mono text-slate-600">
                                                {line.entry_date}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">
                                                <Link
                                                    href={route(
                                                        'accounting.journals.show',
                                                        line.journal_entry_id
                                                    )}
                                                    className="hover:underline"
                                                >
                                                    {line.entry_no}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">
                                                {line.source_url ? (
                                                    <Link
                                                        href={line.source_url}
                                                        className="text-indigo-700 hover:underline"
                                                    >
                                                        {line.source_document_id}
                                                    </Link>
                                                ) : (
                                                    line.source_document_id
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-800">
                                                <span className="font-bold">{line.account_code}</span>{' '}
                                                — {line.account_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">
                                                {line.description}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-700">
                                                {line.debit > 0 ? formatRp(line.debit) : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                                {line.credit > 0 ? formatRp(line.credit) : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}

