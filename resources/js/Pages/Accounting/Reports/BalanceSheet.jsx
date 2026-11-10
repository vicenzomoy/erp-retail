import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    Landmark,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Scale,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function BalanceSheet({ report }) {
    const assets = report?.assets || [];
    const liabilities = report?.liabilities || [];
    const equityAccounts = report?.equity_accounts || [];

    return (
        <AccountingLayout
            title="Neraca Keuangan"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Neraca Keuangan' },
            ]}
        >
            <Head title="Neraca Keuangan — Accounting" />

            <div className="space-y-6">
                {/* Control Bar Header */}
                <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">
                                Laporan Neraca Keuangan (Balance Sheet)
                            </h1>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Posisi Keuangan PT Bara Ritel Nusantara per{' '}
                            <span className="font-semibold text-slate-700">
                                {report?.as_of_date}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {report?.is_balanced ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Aset = Liabilitas + Ekuitas (Seimbang)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                Tidak Seimbang
                            </span>
                        )}

                        <Link
                            href={route('accounting.reports.trial-balance')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Lihat Neraca Saldo</span>
                        </Link>
                    </div>
                </div>

                {/* 3 Summary KPI Cards (Persamaan Dasar Akuntansi) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Aset (Aktiva)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-700">
                            {formatRp(report?.total_assets)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Kas, Bank, Piutang, Persediaan &amp; PPN Masukan
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Liabilitas (Kewajiban)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-amber-700">
                            {formatRp(report?.total_liabilities)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Utang Usaha, PPN Keluaran &amp; Uang Muka
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Total Ekuitas (Modal + Laba Berjalan)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-indigo-700">
                            {formatRp(report?.total_equity)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Modal Awal + Laba/(Rugi) Tahun Berjalan
                        </p>
                    </div>
                </div>

                {/* Two-Column Balance Sheet Sheet */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Sisi Kiri: ASET (AKTIVA) */}
                    <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                ASET (ASSETS)
                            </h2>
                            <span className="text-[11px] font-semibold text-emerald-700">
                                Saldo Normal: Debit
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="bg-slate-50/60 font-semibold text-slate-500 uppercase text-[11px]">
                                    <tr>
                                        <th className="px-4 py-2.5">Kode</th>
                                        <th className="px-4 py-2.5">Nama Akun Aset</th>
                                        <th className="px-4 py-2.5 text-right">Saldo Akhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assets.map((acc) => (
                                        <tr
                                            key={acc.code}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                                                <Link
                                                    href={route('accounting.reports.general-ledger', {
                                                        account: acc.code,
                                                    })}
                                                    className="inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <span>{acc.code}</span>
                                                    <ArrowUpRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">
                                                    {acc.account_name}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {acc.account_type}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                {formatRp(acc.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t-2 border-slate-200 bg-emerald-50/60 px-4 py-3.5 flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                                TOTAL ASET (AKTIVA)
                            </span>
                            <span className="font-mono text-sm font-extrabold text-emerald-800">
                                {formatRp(report?.total_assets)}
                            </span>
                        </div>
                    </div>

                    {/* Sisi Kanan: LIABILITAS & EKUITAS (PASIVA) */}
                    <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                LIABILITAS &amp; EKUITAS (PASIVA)
                            </h2>
                            <span className="text-[11px] font-semibold text-indigo-700">
                                Saldo Normal: Kredit
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="bg-slate-50/60 font-semibold text-slate-500 uppercase text-[11px]">
                                    <tr>
                                        <th className="px-4 py-2.5">Kode</th>
                                        <th className="px-4 py-2.5">Nama Akun</th>
                                        <th className="px-4 py-2.5 text-right">Saldo Akhir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* Sub-header Liabilitas */}
                                    <tr className="bg-amber-50/40">
                                        <td
                                            colSpan={3}
                                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-900"
                                        >
                                            1. Liabilitas Jangka Pendek (Kewajiban)
                                        </td>
                                    </tr>
                                    {liabilities.map((acc) => (
                                        <tr
                                            key={acc.code}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-4 py-2.5 font-mono font-bold text-amber-700">
                                                <Link
                                                    href={route('accounting.reports.general-ledger', {
                                                        account: acc.code,
                                                    })}
                                                    className="inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <span>{acc.code}</span>
                                                    <ArrowUpRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-900">
                                                {acc.account_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                {formatRp(acc.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold text-slate-800">
                                        <td colSpan={2} className="px-4 py-2 text-right text-xs">
                                            Subtotal Liabilitas:
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-amber-800">
                                            {formatRp(report?.total_liabilities)}
                                        </td>
                                    </tr>

                                    {/* Sub-header Ekuitas */}
                                    <tr className="bg-indigo-50/40">
                                        <td
                                            colSpan={3}
                                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-indigo-900"
                                        >
                                            2. Ekuitas (Modal &amp; Laba Ditahan)
                                        </td>
                                    </tr>
                                    {equityAccounts.map((acc) => (
                                        <tr
                                            key={acc.code}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                                <Link
                                                    href={route('accounting.reports.general-ledger', {
                                                        account: acc.code,
                                                    })}
                                                    className="inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <span>{acc.code}</span>
                                                    <ArrowUpRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-900">
                                                {acc.account_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                {formatRp(acc.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Baris Laba / (Rugi) Tahun Berjalan */}
                                    <tr className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">
                                            <Link
                                                href={route('accounting.reports.profit-loss')}
                                                className="inline-flex items-center gap-1 hover:underline"
                                            >
                                                <span>L/R</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                                            Laba / (Rugi) Tahun Berjalan
                                            <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                                                (Dari Laporan Laba &amp; Rugi)
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                            {formatRp(report?.current_year_profit)}
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-50 font-bold text-slate-800">
                                        <td colSpan={2} className="px-4 py-2 text-right text-xs">
                                            Subtotal Ekuitas:
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-indigo-800">
                                            {formatRp(report?.total_equity)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t-2 border-slate-200 bg-indigo-50/60 px-4 py-3.5 flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                                TOTAL LIABILITAS + EKUITAS (PASIVA)
                            </span>
                            <span className="font-mono text-sm font-extrabold text-indigo-800">
                                {formatRp(report?.total_liab_equity)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}

