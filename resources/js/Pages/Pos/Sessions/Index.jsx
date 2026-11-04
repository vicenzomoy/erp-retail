import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import {
    Play,
    StopCircle,
    Search,
    Plus,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    Receipt,
    DollarSign,
    Clock,
    ExternalLink,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function SessionsIndex({ sessions, filters, counts, store_locations }) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [showOpenModal, setShowOpenModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        location_code: 'TOKO-PKU',
        opening_cash_float: '',
    });

    const statusTabs = [
        { label: 'Semua', key: 'all', count: counts.all },
        { label: 'Aktif', key: 'open', count: counts.open },
        { label: 'Tutup', key: 'closed', count: counts.closed },
    ];

    const handleOpenSession = (e) => {
        e.preventDefault();
        post(route('pos.sessions.open'), {
            onSuccess: () => { setShowOpenModal(false); },
        });
    };

    return (
        <PosLayout title="Sesi Kasir" breadcrumbs={[{ label: 'Sesi Kasir' }]}>
            <Head title="Sesi Kasir POS — Bara Wear" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Sesi Kasir (POS Sessions)</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Kelola pembukaan dan penutupan sesi kasir gerai</p>
                </div>
                <button
                    onClick={() => setShowOpenModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-sm"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Buka Sesi Baru
                </button>
            </div>

            {/* Filter Tabs + Search */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden mb-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 bg-slate-50/50">
                    <div className="flex items-center gap-1">
                        {statusTabs.map((tab) => (
                            <Link
                                key={tab.key}
                                href={route('pos.sessions.index', { status: tab.key, search: searchInput })}
                                className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold transition ${
                                    filters.status === tab.key
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                                    filters.status === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {tab.count}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = route('pos.sessions.index', { status: filters.status, search: searchInput });
                        }}
                        className="flex items-center gap-2"
                    >
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari sesi / kasir..."
                                className="rounded-md border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 w-48"
                            />
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">ID Sesi</th>
                                <th className="px-4 py-2.5">Kasir</th>
                                <th className="px-4 py-2.5">Lokasi</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5">Kas Awal</th>
                                <th className="px-4 py-2.5 text-right">Total Penjualan</th>
                                <th className="px-4 py-2.5 text-right">Expected Cash</th>
                                <th className="px-4 py-2.5 text-right">Counted Cash</th>
                                <th className="px-4 py-2.5 text-right">Variance</th>
                                <th className="px-4 py-2.5">Order</th>
                                <th className="px-4 py-2.5">Dibuka</th>
                                <th className="px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.data.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="px-4 py-10 text-center text-slate-400">
                                        Belum ada sesi kasir.
                                    </td>
                                </tr>
                            ) : (
                                sessions.data.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-rose-700">
                                            {s.id}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium">{s.cashier_name}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{s.location_code}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                s.status === 'open'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {s.status === 'open' ? <CheckCircle2 className="h-3 w-3" /> : <StopCircle className="h-3 w-3" />}
                                                {s.status === 'open' ? 'Aktif' : 'Tutup'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">{formatRp(s.opening_cash_float)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{formatRp(s.total_sales)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-blue-700">{formatRp(s.expected_cash)}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            {s.counted_cash !== null ? formatRp(s.counted_cash) : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            {s.cash_variance !== null ? (
                                                <span className={`font-semibold ${s.cash_variance === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {formatRp(s.cash_variance)}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-block font-semibold text-slate-700">{s.orders_count}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{s.opened_at}</td>
                                        <td className="px-4 py-2.5">
                                            <Link
                                                href={route('pos.sessions.show', s.id)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                                            >
                                                Detail <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sessions.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                        <span className="text-xs text-slate-500">
                            {sessions.from}–{sessions.to} dari {sessions.total} sesi
                        </span>
                        <div className="flex gap-1">
                            {sessions.links?.map((link, i) => (
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-2.5 py-1 rounded text-xs font-medium ${
                                            link.active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={i} className="px-2.5 py-1 rounded text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Open Session Modal */}
            {showOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Play className="h-4 w-4 text-rose-600" />
                                Buka Sesi Kasir
                            </h3>
                            <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleOpenSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Toko</label>
                                <select
                                    value={data.location_code}
                                    onChange={(e) => setData('location_code', e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    {(store_locations ?? [{ location_code: 'TOKO-PKU', location_name: 'Gerai utama' }]).map((loc) => (
                                        <option key={loc.location_code} value={loc.location_code}>
                                            {loc.location_code} — {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Kas Awal (Float) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                                    <input
                                        type="number" min="0" step="1000"
                                        value={data.opening_cash_float}
                                        onChange={(e) => setData('opening_cash_float', e.target.value)}
                                        placeholder="500000"
                                        className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                                {errors.opening_cash_float && <p className="mt-1 text-xs text-rose-600">{errors.opening_cash_float}</p>}
                            </div>
                            {errors.error && (
                                <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    {errors.error}
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button type="button" onClick={() => setShowOpenModal(false)}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition">
                                    <Play className="h-3.5 w-3.5" />
                                    {processing ? 'Membuka...' : 'Buka Sesi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PosLayout>
    );
}

