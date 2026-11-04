import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import {
    Store,
    ShoppingCart,
    Receipt,
    Play,
    StopCircle,
    TrendingUp,
    DollarSign,
    Clock,
    Plus,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function PosOverview({ open_session, kpis, recent_sessions, store_locations }) {
    const [showOpenModal, setShowOpenModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        location_code: store_locations?.[0]?.location_code ?? 'TOKO-PKU',
        opening_cash_float: '',
    });

    const handleOpenSession = (e) => {
        e.preventDefault();
        post(route('pos.sessions.open'), {
            onSuccess: () => { setShowOpenModal(false); reset(); },
        });
    };

    return (
        <PosLayout title="POS Overview" breadcrumbs={[{ label: 'Overview Kasir' }]}>
            <Head title="Point of Sale — Bara Wear" />

            {/* ---- Active Session Banner ---- */}
            {open_session ? (
                <div className="mb-6 rounded-lg border border-rose-300 bg-rose-50 p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                            <Play className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-rose-900">
                                Sesi Aktif: <span className="font-mono">{open_session.id}</span>
                            </p>
                            <p className="text-xs text-rose-700">
                                Lokasi: {open_session.location_code} | Dibuka: {open_session.opened_at} | Total Penjualan: {formatRp(open_session.total_sales)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('pos.orders.create')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-sm"
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Kasir / Checkout
                        </Link>
                        <Link
                            href={route('pos.sessions.show', open_session.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                        >
                            Detail Sesi
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                            <StopCircle className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Tidak ada sesi aktif</p>
                            <p className="text-xs text-slate-500">Buka sesi kasir terlebih dahulu sebelum memulai transaksi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowOpenModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buka Sesi Baru
                    </button>
                </div>
            )}

            {/* ---- KPI Cards ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Transaksi Hari Ini</span>
                        <Receipt className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{kpis.today_orders}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Total order lunas</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Revenue Hari Ini</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-black text-emerald-700 truncate">{formatRp(kpis.today_revenue)}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Sudah termasuk PPN</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Sesi Aktif</span>
                        <Play className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-600">{kpis.total_sessions_open}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Sesi sedang terbuka</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Sesi Hari Ini</span>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-blue-600">{kpis.total_sessions_today}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Dibuka hari ini</p>
                </div>
            </div>

            {/* ---- Operation Cards ---- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Checkout Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-rose-50 text-rose-600">
                                    <ShoppingCart className="h-4 w-4" />
                                </div>
                                Kasir / Checkout
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Proses transaksi penjualan langsung</p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                        <Link
                            href={route('pos.orders.create')}
                            className={`inline-flex items-center gap-1 text-xs font-semibold transition ${
                                open_session ? 'text-rose-600 hover:text-rose-800' : 'text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {open_session ? 'Buka Kasir' : 'Buka sesi dulu'}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Sessions Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-amber-50 text-amber-600">
                                    <Play className="h-4 w-4" />
                                </div>
                                Sesi Kasir
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Kelola pembukaan & penutupan sesi</p>
                        </div>
                        <button
                            onClick={() => setShowOpenModal(true)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Buka
                        </button>
                    </div>
                    <div className="flex items-baseline justify-between mb-4">
                        <span className="text-3xl font-black text-amber-600">{kpis.total_sessions_open}</span>
                        <span className="text-xs text-slate-400">sesi aktif</span>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                        <Link href={route('pos.sessions.index')} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800">
                            Daftar Sesi <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Daily Summary Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-blue-50 text-blue-600">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                Ringkasan Harian
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Rekap kas & penjualan per hari</p>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-4">
                        <span className="text-xl font-black text-blue-600 truncate">{formatRp(kpis.today_revenue)}</span>
                        <span className="text-xs text-slate-400">hari ini</span>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                        <Link href={route('pos.reporting.daily-summary')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                            Lihat Laporan <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ---- Recent Sessions Table ---- */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-3.5">
                    <h3 className="text-sm font-bold text-slate-900">Sesi Kasir Terakhir</h3>
                    <Link href={route('pos.sessions.index')} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                        Lihat Semua →
                    </Link>
                </div>
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
                                <th className="px-4 py-2.5">Dibuka</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recent_sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                        Belum ada sesi kasir.
                                    </td>
                                </tr>
                            ) : (
                                recent_sessions.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-rose-700">
                                            <Link href={route('pos.sessions.show', s.id)} className="hover:underline">
                                                {s.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5">{s.cashier_name}</td>
                                        <td className="px-4 py-2.5">{s.location_code}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                s.status === 'open'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {s.status === 'open' ? <CheckCircle2 className="h-3 w-3" /> : null}
                                                {s.status === 'open' ? 'Aktif' : 'Tutup'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">{formatRp(s.opening_cash_float)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{formatRp(s.total_sales)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-blue-700">{formatRp(s.expected_cash)}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{s.opened_at}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ---- Open Session Modal ---- */}
            {showOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Play className="h-4 w-4 text-rose-600" />
                                Buka Sesi Kasir
                            </h3>
                            <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleOpenSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Lokasi Toko
                                </label>
                                <select
                                    value={data.location_code}
                                    onChange={(e) => setData('location_code', e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                >
                                    {store_locations.map((loc) => (
                                        <option key={loc.location_code} value={loc.location_code}>
                                            {loc.location_code} — {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.location_code && <p className="mt-1 text-xs text-rose-600">{errors.location_code}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Kas Awal (Float) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.opening_cash_float}
                                        onChange={(e) => setData('opening_cash_float', e.target.value)}
                                        placeholder="500000"
                                        className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                                {errors.opening_cash_float && <p className="mt-1 text-xs text-rose-600">{errors.opening_cash_float}</p>}
                                <p className="mt-1 text-[11px] text-slate-400">Jumlah uang tunai dalam laci kasir sebelum mulai berjualan</p>
                            </div>

                            {errors.error && (
                                <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    {errors.error}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowOpenModal(false)}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition"
                                >
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

