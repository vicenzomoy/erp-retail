import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Users, Search, ArrowRight, ShieldAlert, CreditCard } from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function SalesCustomerIndex({ customers = [] }) {
    const [search, setSearch] = useState('');

    const filteredCustomers = customers.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.id?.toLowerCase().includes(q) ||
            c.name?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q) ||
            c.type?.toLowerCase().includes(q)
        );
    });

    const getUtilizationColor = (pct) => {
        const val = parseFloat(pct) || 0;
        if (val >= 90) return { bar: 'bg-rose-500', text: 'text-rose-700 bg-rose-50 border-rose-200' };
        if (val >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    };

    return (
        <SalesLayout
            title="Daftar Pelanggan"
            breadcrumbs={[{ label: 'Pelanggan' }, { label: 'Daftar Pelanggan' }]}
        >
            <Head title="Daftar Pelanggan — Sales Bara Wear" />

            {/* Header section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Daftar Pelanggan & Limit Kredit
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Monitoring saldo piutang (AR), limit kredit, dan termin pembayaran pelanggan.
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ID, nama, atau kota..."
                        className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">ID</th>
                                <th className="px-4 py-2.5">Nama Pelanggan</th>
                                <th className="px-4 py-2.5">Tipe</th>
                                <th className="px-4 py-2.5">Kota</th>
                                <th className="px-4 py-2.5">Termin</th>
                                <th className="px-4 py-2.5 text-right">Limit Kredit</th>
                                <th className="px-4 py-2.5 text-right">Piutang (AR)</th>
                                <th className="px-4 py-2.5 text-center">Utilisasi Kredit</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                                        Tidak ada data pelanggan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((cust) => {
                                    const utilStyle = getUtilizationColor(cust.credit_utilization);
                                    const utilVal = Math.min(100, Math.max(0, parseFloat(cust.credit_utilization) || 0));

                                    return (
                                        <tr key={cust.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                {cust.id}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                                <Link
                                                    href={route('sales.customers.show', cust.id)}
                                                    className="hover:text-blue-600 hover:underline"
                                                >
                                                    {cust.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold border ${
                                                    cust.type === 'B2B'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {cust.type || 'Umum'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {cust.city || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                                                {cust.payment_terms || 'CASH'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap tabular-nums">
                                                {formatRp(cust.credit_limit)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                                {formatRp(cust.open_ar)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="inline-flex flex-col items-center gap-1 w-32">
                                                    <div className="flex w-full items-center justify-between text-[10px] text-slate-500">
                                                        <span>{cust.credit_utilization}%</span>
                                                        {parseFloat(cust.credit_utilization) >= 90 && (
                                                            <ShieldAlert className="h-3 w-3 text-rose-500" />
                                                        )}
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                                        <div
                                                            className={`h-full ${utilStyle.bar}`}
                                                            style={{ width: `${utilVal}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <Link
                                                    href={route('sales.customers.show', cust.id)}
                                                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                                                >
                                                    Detail
                                                    <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SalesLayout>
    );
}

