import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import {
    CalendarDays,
    TrendingUp,
    DollarSign,
    Receipt,
    Play,
    StopCircle,
    ShoppingCart,
    Info,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function DailySummary({ date, location_code, store_locations, summary, sessions, orders }) {
    const [selectedDate, setSelectedDate] = useState(date);
    const [selectedLocation, setSelectedLocation] = useState(location_code);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('pos.reporting.daily-summary'), {
            date: selectedDate,
            location_code: selectedLocation,
        });
    };

    const varianceColor = (v) => {
        if (v === null || v === undefined) return 'text-slate-400';
        if (v === 0) return 'text-emerald-700';
        return 'text-rose-700';
    };

    return (
        <PosLayout title="Ringkasan Harian" breadcrumbs={[{ label: 'Laporan', href: '#' }, { label: 'Ringkasan Harian' }]}>
            <Head title="Ringkasan Harian POS — Bara Wear" />

            {/* Filter */}
            <form onSubmit={handleFilter} className="mb-5 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <label className="text-xs font-semibold text-slate-700">Tanggal:</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Lokasi:</label>
                    <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
                        {store_locations.map((loc) => (
                            <option key={loc.location_code} value={loc.location_code}>
                                {loc.location_code} — {loc.location_name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit"
                    className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition">
                    Tampilkan
                </button>
            </form>

            {/* ---- KPI Summary Cards ---- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Order</span>
                        <ShoppingCart className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{summary.total_orders}</div>
                    <p className="text-[11px] text-slate-400 mt-1">{summary.sessions_count} sesi</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Penjualan</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-black text-emerald-700 truncate">{formatRp(summary.total_revenue)}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Incl. PPN {formatRp(summary.total_tax)}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expected Cash</span>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-black text-blue-700 truncate">{formatRp(summary.expected_cash_in_drawer)}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Float {formatRp(summary.opening_floats)} + Penjualan</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Laba Kotor</span>
                        <Receipt className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className={`text-xl font-black truncate ${summary.gross_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatRp(summary.gross_profit)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Revenue - PPN - HPP</p>
                </div>
            </div>

            {/* ---- Cash Drawer Info Box ---- */}
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Rekap Kas Laci — {date}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div className="bg-white rounded-md border border-blue-200 p-3 text-center">
                                <p className="text-[11px] text-blue-500 uppercase tracking-wider mb-1">Kas Awal (Float)</p>
                                <p className="text-lg font-black text-blue-900">{formatRp(summary.opening_floats)}</p>
                                <p className="text-[10px] text-blue-400">Jumlah uang sebelum buka toko</p>
                            </div>
                            <div className="bg-white rounded-md border border-blue-200 p-3 text-center">
                                <p className="text-[11px] text-blue-500 uppercase tracking-wider mb-1">+ Penjualan Tunai</p>
                                <p className="text-lg font-black text-emerald-700">{formatRp(summary.total_revenue)}</p>
                                <p className="text-[10px] text-slate-400">Total transaksi lunas hari ini</p>
                            </div>
                            <div className="bg-white rounded-md border border-emerald-300 p-3 text-center shadow-sm">
                                <p className="text-[11px] text-emerald-600 uppercase tracking-wider mb-1">= Expected di Laci</p>
                                <p className="text-xl font-black text-emerald-800">{formatRp(summary.expected_cash_in_drawer)}</p>
                                <p className="text-[10px] text-emerald-500 font-semibold">Jumlah yang seharusnya ada</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sessions Summary */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Sesi Kasir Hari Ini</h2>
                        <span className="text-xs text-slate-500">{sessions.length} sesi</span>
                    </div>
                    {sessions.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Belum ada sesi pada tanggal ini.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sessions.map((s) => (
                                <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-mono font-bold text-rose-700">{s.id}</p>
                                        <p className="text-[11px] text-slate-600">{s.cashier_name}</p>
                                        <p className="text-[11px] text-slate-400">{s.opened_at} → {s.closed_at ?? 'Aktif'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-emerald-700">{formatRp(s.total_sales)}</p>
                                        <p className="text-[11px] text-blue-600">{s.orders_count} order</p>
                                        {s.cash_variance !== null ? (
                                            <p className={`text-[11px] font-semibold ${varianceColor(s.cash_variance)}`}>
                                                Variance: {formatRp(s.cash_variance)}
                                            </p>
                                        ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                                <Play className="h-2.5 w-2.5" /> Aktif
                                            </span>
                                        )}
                                    </div>
                                    <Link href={route('pos.sessions.show', s.id)} className="text-xs text-slate-400 hover:text-slate-700">
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Orders List */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Transaksi Hari Ini</h2>
                        <span className="text-xs text-slate-500">{orders.length} transaksi</span>
                    </div>
                    {orders.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Belum ada transaksi.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                            {orders.map((o) => (
                                <div key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-mono font-semibold text-rose-700">{o.id}</p>
                                        <p className="text-[11px] text-slate-600">{o.customer_name}</p>
                                        <p className="text-[11px] text-slate-400">{o.paid_at}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900">{formatRp(o.grand_total)}</p>
                                        <p className="text-[11px] text-slate-500">
                                            Tunai: {formatRp(o.cash_tendered)}
                                        </p>
                                        <p className="text-[11px] text-emerald-600 font-semibold">
                                            Kembalian: {formatRp(o.change_given)}
                                        </p>
                                    </div>
                                    <Link href={route('pos.orders.show', o.id)} className="text-xs text-slate-400 hover:text-slate-700">
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PosLayout>
    );
}

