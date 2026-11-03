import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import { Plus, Search, ArrowRightLeft, Filter, ArrowRight } from 'lucide-react';

export default function Index({ transfers, filters, counts }) {
    const handleStatusFilter = (status) => {
        router.get(
            route('inventory.transfers.index'),
            { ...filters, status },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const search = e.target.search.value;
        router.get(
            route('inventory.transfers.index'),
            { ...filters, search },
            { preserveState: true }
        );
    };

    return (
        <InventoryLayout
            title="Transfer Internal Antar Lokasi"
            breadcrumbs={[
                { label: 'Operasi' },
                { label: 'Transfer Internal' },
            ]}
        >
            <Head title="Transfer Internal Antar Lokasi — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('inventory.transfers.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Transfer (New)
                    </Link>
                    <span className="text-sm font-bold text-slate-800">
                        Transfer Persediaan Antar-Lokasi (Internal Transfers)
                    </span>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Cari Transfer, Lokasi..."
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-64"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cari
                    </button>
                </form>
            </div>

            {/* Filter Pills Bar (Odoo Style) */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase">
                    <Filter className="h-3 w-3" /> Status:
                </span>
                <button
                    onClick={() => handleStatusFilter('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua ({counts.all})
                </button>
                <button
                    onClick={() => handleStatusFilter('to_process')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'to_process'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Siap Ditransfer ({counts.to_process})
                </button>
                <button
                    onClick={() => handleStatusFilter('done')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'done'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Selesai (Done) ({counts.done})
                </button>
            </div>

            {/* List View Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">No. Dokumen</th>
                                <th className="px-4 py-2.5">Lokasi Asal (From)</th>
                                <th className="px-4 py-2.5">Lokasi Tujuan (To)</th>
                                <th className="px-4 py-2.5">Tanggal Jadwal</th>
                                <th className="px-4 py-2.5 text-center">Permintaan (Demand)</th>
                                <th className="px-4 py-2.5 text-center">Ditransfer (Done)</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transfers.data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-slate-400">
                                        Tidak ada dokumen transfer antar lokasi ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                transfers.data.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-slate-50 transition cursor-pointer group"
                                        onClick={() => router.visit(route('inventory.transfers.show', t.id))}
                                    >
                                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                                            <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                                            <span>{t.id}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                            {t.location_from} <span className="text-slate-400">({t.from_name})</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                            {t.location_to} <span className="text-slate-400">({t.to_name})</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {t.scheduled_date || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                            {t.total_demand} pcs
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-700">
                                            {t.total_done} pcs
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <OdooBadge status={t.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('inventory.transfers.show', t.id)}
                                                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                                                onClick={(e) => e.stopPropagation()}
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
                {transfers.links && transfers.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                        <div className="text-xs text-slate-500">
                            Menampilkan {transfers.from || 0} - {transfers.to || 0} dari {transfers.total} data
                        </div>
                        <div className="flex items-center gap-1">
                            {transfers.links.map((link, idx) => (
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
        </InventoryLayout>
    );
}

