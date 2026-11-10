import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InvoicingLayout from '@/Layouts/InvoicingLayout';
import {
    Plus,
    Search,
    ReceiptText,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Scale,
    FileText,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Index({ creditNotes, filters, counts }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (newStatus) => {
        router.get(
            route('accounting.credit-notes.index'),
            { status: newStatus, search },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.credit-notes.index'),
            { status: filters.status, search },
            { preserveState: true, replace: true }
        );
    };

    const tabs = [
        { key: 'all', label: 'Semua Nota Kredit', count: counts.all },
        { key: 'applied', label: 'Terapkan (AR Adjusted)', count: counts.applied },
        { key: 'posted', label: 'Posted', count: counts.posted },
        { key: 'draft', label: 'Draft', count: counts.draft },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'applied':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[11px] font-semibold border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        AR Disesuaikan (Applied)
                    </span>
                );
            case 'posted':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold border border-blue-200">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        Posted
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-semibold border border-slate-200">
                        {status}
                    </span>
                );
        }
    };

    return (
        <InvoicingLayout
            title="Nota Kredit (Credit Notes)"
            breadcrumbs={[{ label: 'Invoicing' }, { label: 'Nota Kredit (AR Adjustments)' }]}
        >
            <Head title="Nota Kredit & AR Adjustments — Bara Wear" />

            {/* Top Action Bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-teal-600" />
                        <span>Nota Kredit &amp; Penyesuaian Piutang (AR Adjustments)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Diterbitkan oleh Finance berdasarkan hasil Return Inspection yang telah divalidasi gudang, memotong saldo piutang faktur, dan mencatat jurnal pembalikan pendapatan &amp; PPN.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('accounting.credit-notes.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Proses Nota Kredit Dari Retur
                    </Link>
                </div>
            </div>

            {/* Filter Tabs & Search */}
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
                        placeholder="Cari CN, Retur, Faktur, Pelanggan..."
                        className="w-full rounded border border-slate-300 py-1 pl-8 pr-3 text-xs focus:border-teal-500 focus:outline-none"
                    />
                </form>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">No. Nota Kredit</th>
                            <th className="px-4 py-3">Faktur Asal</th>
                            <th className="px-4 py-3">Dokumen Retur</th>
                            <th className="px-4 py-3">Pelanggan</th>
                            <th className="px-4 py-3">Tgl Terbit</th>
                            <th className="px-4 py-3 text-right">Nilai Kredit (Gross)</th>
                            <th className="px-4 py-3">Jurnal Akuntansi</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {creditNotes.data.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="p-8 text-center text-slate-400">
                                    Belum ada nota kredit yang tercatat.
                                </td>
                            </tr>
                        ) : (
                            creditNotes.data.map((cn) => (
                                <tr key={cn.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold font-mono text-teal-800">
                                        <Link href={route('accounting.credit-notes.show', cn.id)} className="hover:underline">
                                            {cn.id}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-700">
                                        <Link href={route('accounting.invoices.show', cn.original_invoice_id)} className="hover:underline text-teal-600">
                                            {cn.original_invoice_id}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-indigo-700 font-medium">
                                        {cn.customer_return_id || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {cn.customer_name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {cn.return_date}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                                        {formatRp(cn.grand_total)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                                        {cn.journal_entry_no || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(cn.status)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('accounting.credit-notes.show', cn.id)}
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
        </InvoicingLayout>
    );
}

