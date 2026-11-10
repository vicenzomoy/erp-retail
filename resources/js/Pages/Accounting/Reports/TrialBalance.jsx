import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    TableProperties,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Scale,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function TrialBalance({ report }) {
    const rows = report?.rows || [];

    return (
        <AccountingLayout
            title="Neraca Saldo"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Neraca Saldo' },
            ]}
        >
            <Head title="Neraca Saldo — Accounting" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <TableProperties className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">
                                Laporan Neraca Saldo (Trial Balance)
                            </h1>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Verifikasi Keseimbangan Debit &amp; Kredit Seluruh Bagan Akun per{' '}
                            <span className="font-semibold text-slate-700">
                                {report?.as_of_date}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {report?.is_balanced ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Total Debit = Total Kredit (Seimbang)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                Terdapat Selisih Saldo
                            </span>
                        )}

                        <Link
                            href={route('accounting.reports.general-ledger')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Buka Buku Besar Umum</span>
                        </Link>
                    </div>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Saldo Pembukaan (Opening)
                        </p>
                        <p className="mt-1.5 font-mono text-lg font-extrabold text-slate-900">
                            D: {formatRp(report?.sum_open_debit)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                            K: {formatRp(report?.sum_open_credit)}
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Mutasi Transaksi Berjalan
                        </p>
                        <p className="mt-1.5 font-mono text-lg font-extrabold text-emerald-700">
                            D: {formatRp(report?.sum_mut_debit)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-amber-700">
                            K: {formatRp(report?.sum_mut_credit)}
                        </p>
                    </div>

                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Saldo Akhir Neraca Saldo
                        </p>
                        <p className="mt-1.5 font-mono text-lg font-extrabold text-indigo-700">
                            D: {formatRp(report?.sum_ending_debit)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-indigo-700">
                            K: {formatRp(report?.sum_ending_credit)}
                        </p>
                    </div>
                </div>

                {/* Trial Balance Full Matrix Table */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                            Tabel Neraca Saldo 6 Kolom (Saldo Awal, Mutasi &amp; Saldo Akhir)
                        </h2>
                        <span className="text-[11px] text-slate-500">
                            Klik kode akun untuk menelusuri mutasi Buku Besar Umum
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold uppercase text-slate-600 text-[11px]">
                                <tr className="border-b border-slate-200">
                                    <th rowSpan={2} className="px-4 py-2.5 border-r border-slate-200">
                                        Kode
                                    </th>
                                    <th rowSpan={2} className="px-4 py-2.5 border-r border-slate-200">
                                        Nama Akun &amp; Kategori
                                    </th>
                                    <th
                                        colSpan={2}
                                        className="px-4 py-2 text-center border-r border-slate-200 bg-slate-100/70"
                                    >
                                        Saldo Awal (Opening)
                                    </th>
                                    <th
                                        colSpan={2}
                                        className="px-4 py-2 text-center border-r border-slate-200 bg-emerald-50/50"
                                    >
                                        Mutasi Periode
                                    </th>
                                    <th
                                        colSpan={2}
                                        className="px-4 py-2 text-center bg-indigo-50/50"
                                    >
                                        Saldo Akhir
                                    </th>
                                </tr>
                                <tr>
                                    <th className="px-3 py-2 text-right bg-slate-100/40">Debit</th>
                                    <th className="px-3 py-2 text-right border-r border-slate-200 bg-slate-100/40">
                                        Kredit
                                    </th>
                                    <th className="px-3 py-2 text-right bg-emerald-50/30">Debit</th>
                                    <th className="px-3 py-2 text-right border-r border-slate-200 bg-emerald-50/30">
                                        Kredit
                                    </th>
                                    <th className="px-3 py-2 text-right bg-indigo-50/30">Debit</th>
                                    <th className="px-3 py-2 text-right bg-indigo-50/30">Kredit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((acc) => (
                                    <tr key={acc.code} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-700 border-r border-slate-100">
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
                                        <td className="px-4 py-2.5 border-r border-slate-100">
                                            <div className="font-semibold text-slate-900">
                                                {acc.account_name}
                                            </div>
                                            <div className="text-[10px] uppercase text-slate-400">
                                                {acc.account_type}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                                            {acc.opening_debit > 0
                                                ? formatRp(acc.opening_debit)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-slate-600 border-r border-slate-100">
                                            {acc.opening_credit > 0
                                                ? formatRp(acc.opening_credit)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-emerald-700">
                                            {acc.mutation_debit > 0
                                                ? formatRp(acc.mutation_debit)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-amber-700 border-r border-slate-100">
                                            {acc.mutation_credit > 0
                                                ? formatRp(acc.mutation_credit)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 bg-indigo-50/15">
                                            {acc.ending_debit > 0
                                                ? formatRp(acc.ending_debit)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 bg-indigo-50/15">
                                            {acc.ending_credit > 0
                                                ? formatRp(acc.ending_credit)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-extrabold text-slate-900">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-right uppercase">
                                        TOTAL KESEIMBANGAN NERACA SALDO:
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-slate-800">
                                        {formatRp(report?.sum_open_debit)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-slate-800 border-r border-slate-200">
                                        {formatRp(report?.sum_open_credit)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-emerald-800">
                                        {formatRp(report?.sum_mut_debit)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-amber-800 border-r border-slate-200">
                                        {formatRp(report?.sum_mut_credit)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-indigo-900 bg-indigo-50">
                                        {formatRp(report?.sum_ending_debit)}
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono text-indigo-900 bg-indigo-50">
                                        {formatRp(report?.sum_ending_credit)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}

