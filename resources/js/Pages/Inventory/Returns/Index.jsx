import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    RotateCcw,
    Search,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    ClipboardCheck,
} from 'lucide-react';

export default function Index({ inspections, filters, counts }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (newStatus) => {
        router.get(
            route('inventory.returns.index'),
            { status: newStatus, search },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('inventory.returns.index'),
            { status: filters.status, search },
            { preserveState: true, replace: true }
        );
    };

    const tabs = [
        { key: 'pending_inspection', label: 'Perlu QC / Cek Fisik', count: counts.pending },
        { key: 'inspected', label: 'Sudah Dicek Gudang', count: counts.inspected },
        { key: 'completed', label: 'Selesai (Nota Kredit)', count: counts.completed },
        { key: 'all', label: 'Semua Inspeksi', count: counts.all },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_inspection':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-semibold border border-amber-200">
                        <Clock className="h-3 w-3" />
                        Menunggu QC Fisik
                    </span>
                );
            case 'inspected':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold border border-blue-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Telah Diinspeksi
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Selesai
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
        <InventoryLayout
            title="Inspeksi Retur (QC)"
            breadcrumbs={[{ label: 'Inventory' }, { label: 'Inspeksi Retur (QC)' }]}
        >
            <Head title="Inspeksi Retur Barang Pelanggan (QC) — Bara Wear" />

            {/* Top Action Bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                        <span>Return Inspection / QC Barang Retur</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pemeriksaan fisik barang retur pelanggan oleh Warehouse, validasi kondisi layak/rusak, dan penambahan stok masuk kembali ke gudang (in_return).
                    </p>
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
                        placeholder="Cari No. Retur, Faktur..."
                        className="w-full rounded border border-slate-300 py-1 pl-8 pr-3 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                </form>
            </div>

            {/* Inspections Table */}
            <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">No. Retur</th>
                            <th className="px-4 py-3">Faktur Terkait</th>
                            <th className="px-4 py-3">Pelanggan</th>
                            <th className="px-4 py-3">Tgl Pengajuan</th>
                            <th className="px-4 py-3 text-center">Total Item</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inspections.data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400">
                                    Tidak ada antrean inspeksi retur barang saat ini.
                                </td>
                            </tr>
                        ) : (
                            inspections.data.map((ins) => (
                                <tr key={ins.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold font-mono text-emerald-700">
                                        <Link href={route('inventory.returns.show', ins.id)} className="hover:underline">
                                            {ins.id}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-700">
                                        {ins.customer_invoice_id}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {ins.customer_name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {ins.return_date}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                                        {ins.total_items} pcs
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(ins.status)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('inventory.returns.show', ins.id)}
                                            className="inline-flex items-center gap-1 rounded bg-slate-900 text-white px-3 py-1 text-[11px] font-semibold hover:bg-slate-800 transition"
                                        >
                                            <span>{ins.status === 'pending_inspection' ? 'Cek Fisik & Validasi' : 'Lihat Detail'}</span>
                                            <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </InventoryLayout>
    );
}

