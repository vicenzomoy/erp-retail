import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SalesLayout from '@/Layouts/SalesLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    RotateCcw,
    Calendar,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';

export default function Index({ returns, filters, counts }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (newStatus) => {
        router.get(
            route('sales.returns.index'),
            { status: newStatus, search },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('sales.returns.index'),
            { status: filters.status, search },
            { preserveState: true, replace: true }
        );
    };

    const tabs = [
        { key: 'all', label: 'Semua Retur', count: counts.all },
        { key: 'pending_inspection', label: 'Menunggu QC Gudang', count: counts.pending_inspection },
        { key: 'inspected', label: 'Sudah Dicek Gudang', count: counts.inspected },
        { key: 'completed', label: 'Selesai (Credit Note Diterbitkan)', count: counts.completed },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_inspection':
                return <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-semibold border border-amber-200">
                    <Clock className="h-3 w-3" />
                    Menunggu QC Gudang
                </span>;
            case 'inspected':
                return <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold border border-blue-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Telah Diinspeksi
                </span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Selesai (Credit Note)
                </span>;
            default:
                return <span className="inline-flex items-center rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-semibold border border-slate-200">
                    {status}
                </span>;
        }
    };

    return (
        <SalesLayout
            title="Retur Pelanggan (RMA)"
            breadcrumbs={[{ label: 'Penjualan' }, { label: 'Retur Pelanggan' }]}
        >
            <Head title="Retur Pelanggan (Maks 14 Hari) — Bara Wear" />

            {/* Top Action Bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-indigo-600" />
                        <span>Permintaan Retur Pelanggan (RMA)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Proses retur diajukan oleh Sales (maks. 14 hari), diinspeksi oleh Warehouse, dan diterbitkan Nota Kredit oleh Finance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('sales.returns.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Ajukan Retur Baru
                    </Link>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded border border-slate-200 bg-white p-2 text-xs shadow-2xs">
                <div className="flex flex-wrap items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleFilter(tab.key)}
                            className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${
                                filters.status === tab.key
                                    ? 'bg-slate-900 text-white font-semibold'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                            <span
                                className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                                    filters.status === tab.key
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="relative flex items-center w-full md:w-64">
                    <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ID, Faktur, Pelanggan..."
                        className="w-full rounded border border-slate-300 py-1 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-0"
                    />
                </form>
            </div>

            {/* Table View */}
            <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">No. Retur</th>
                                <th className="px-4 py-3">Faktur Asal</th>
                                <th className="px-4 py-3">Pelanggan</th>
                                <th className="px-4 py-3">Tgl Retur</th>
                                <th className="px-4 py-3">Usia Faktur</th>
                                <th className="px-4 py-3">Alasan Retur</th>
                                <th className="px-4 py-3">Diajukan Oleh</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {returns.data.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-slate-400">
                                        Tidak ada dokumen retur pelanggan yang sesuai.
                                    </td>
                                </tr>
                            ) : (
                                returns.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                                        <td className="px-4 py-3 font-semibold text-indigo-700">
                                            <Link href={route('sales.returns.show', r.id)} className="hover:underline">
                                                {r.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-700">
                                            <Link href={route('accounting.invoices.show', r.customer_invoice_id)} className="text-teal-700 hover:underline">
                                                {r.customer_invoice_id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {r.customer_name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {r.return_date}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                r.days_since_invoice <= 14
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {r.days_since_invoice} Hari (Aman ≤ 14)
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]" title={r.reason}>
                                            {r.reason}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {r.sales_user_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(r.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('sales.returns.show', r.id)}
                                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                <span>Buka</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SalesLayout>
    );
}

