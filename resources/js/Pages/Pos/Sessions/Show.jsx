import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import {
    Play,
    StopCircle,
    ShoppingCart,
    Receipt,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Info,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function SessionShow({ session, orders, audit_logs }) {
    const [showCloseModal, setShowCloseModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ counted_cash: '' });

    const handleClose = (e) => {
        e.preventDefault();
        post(route('pos.sessions.close', session.id), {
            onSuccess: () => setShowCloseModal(false),
        });
    };

    const isOpen = session.status === 'open';
    const statusSteps = ['Aktif', 'Tutup'];

    return (
        <PosLayout
            title={`Sesi ${session.id}`}
            breadcrumbs={[
                { label: 'Sesi Kasir', href: route('pos.sessions.index') },
                { label: session.id },
            ]}
        >
            <Head title={`Sesi ${session.id} — POS Bara Wear`} />

            {/* ---- Status Bar (Odoo Style) ---- */}
            <div className="flex items-center gap-2 mb-5">
                {statusSteps.map((step, i) => {
                    const isCurrent = (step === 'Aktif' && isOpen) || (step === 'Tutup' && !isOpen);
                    const isDone = step === 'Tutup' && !isOpen;
                    return (
                        <React.Fragment key={step}>
                            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                isCurrent
                                    ? isDone ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                                    : 'text-slate-400'
                            }`}>
                                {step}
                            </span>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ---- Smart Buttons ---- */}
            <div className="flex items-center gap-2 mb-5">
                <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                    <Receipt className="h-3.5 w-3.5 text-rose-500" />
                    {orders.length} Transaksi
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    {formatRp(session.total_sales)}
                </div>
                {isOpen && (
                    <>
                        <Link
                            href={route('pos.orders.create')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-sm"
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Proses Transaksi
                        </Link>
                        <button
                            onClick={() => setShowCloseModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <StopCircle className="h-3.5 w-3.5 text-rose-500" />
                            Tutup Sesi
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ---- Session Detail Card ---- */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3">
                            <h2 className="text-sm font-bold text-slate-900">Detail Sesi</h2>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">ID Sesi</p>
                                <p className="text-sm font-mono font-bold text-rose-700">{session.id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Kasir</p>
                                <p className="text-sm font-semibold text-slate-900">{session.cashier_name}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Lokasi Gerai</p>
                                <p className="text-sm font-semibold text-slate-900">{session.location_code}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {isOpen ? <CheckCircle2 className="h-3 w-3" /> : <StopCircle className="h-3 w-3" />}
                                    {isOpen ? 'Aktif' : 'Tutup'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Dibuka</p>
                                <p className="text-sm text-slate-700">{session.opened_at}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Ditutup</p>
                                <p className="text-sm text-slate-700">{session.closed_at ?? '—'}</p>
                            </div>
                        </div>

                        {/* Cash Summary */}
                        <div className="border-t border-slate-200 bg-slate-50/40 p-5">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Ringkasan Kas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="rounded-md border border-slate-200 bg-white p-3 text-center shadow-xs">
                                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Kas Awal</p>
                                    <p className="text-base font-black text-slate-900">{formatRp(session.opening_cash_float)}</p>
                                </div>
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-center shadow-xs">
                                    <p className="text-[11px] text-emerald-600 uppercase tracking-wider mb-1">Total Penjualan</p>
                                    <p className="text-base font-black text-emerald-700">{formatRp(session.total_sales)}</p>
                                </div>
                                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-center shadow-xs">
                                    <p className="text-[11px] text-blue-600 uppercase tracking-wider mb-1">Expected Cash</p>
                                    <p className="text-base font-black text-blue-700">{formatRp(session.expected_cash)}</p>
                                    <p className="text-[10px] text-blue-500">Kas Awal + Penjualan</p>
                                </div>
                                {!isOpen && (
                                    <div className={`rounded-md border p-3 text-center shadow-xs ${
                                        session.cash_variance === 0
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-rose-200 bg-rose-50'
                                    }`}>
                                        <p className={`text-[11px] uppercase tracking-wider mb-1 ${
                                            session.cash_variance === 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>Variance</p>
                                        <p className={`text-base font-black ${
                                            session.cash_variance === 0 ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                            {formatRp(session.cash_variance)}
                                        </p>
                                        <p className={`text-[10px] ${
                                            session.cash_variance === 0 ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>Counted: {formatRp(session.counted_cash)}</p>
                                    </div>
                                )}
                            </div>

                            {isOpen && (
                                <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
                                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>
                                        Uang yang seharusnya ada di laci saat ini: <strong>{formatRp(session.expected_cash)}</strong>.
                                        Hitung uang fisik, lalu tutup sesi untuk merekam selisih.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Transaksi dalam Sesi ({orders.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2.5">Kode Order</th>
                                        <th className="px-4 py-2.5">Pelanggan</th>
                                        <th className="px-4 py-2.5">Pembayaran</th>
                                        <th className="px-4 py-2.5 text-right">Grand Total</th>
                                        <th className="px-4 py-2.5 text-right">Tunai Diterima</th>
                                        <th className="px-4 py-2.5 text-right">Kembalian</th>
                                        <th className="px-4 py-2.5">Waktu</th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                                Belum ada transaksi dalam sesi ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((o) => (
                                            <tr key={o.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-mono font-semibold text-rose-700">{o.id}</td>
                                                <td className="px-4 py-2.5">{o.customer_name}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="capitalize">{o.payment_method}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRp(o.grand_total)}</td>
                                                <td className="px-4 py-2.5 text-right">{formatRp(o.cash_tendered)}</td>
                                                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">{formatRp(o.change_given)}</td>
                                                <td className="px-4 py-2.5 text-slate-500">{o.paid_at}</td>
                                                <td className="px-4 py-2.5">
                                                    <Link href={route('pos.orders.show', o.id)} className="text-xs text-rose-600 hover:underline">
                                                        Lihat
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ---- Right Panel: Audit Log ---- */}
                <div className="space-y-5">
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                            <h2 className="text-sm font-bold text-slate-900">Riwayat Aktivitas</h2>
                        </div>
                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {audit_logs.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">Belum ada log aktivitas.</p>
                            ) : (
                                audit_logs.map((log) => (
                                    <div key={log.id} className="flex gap-2.5">
                                        <div className={`mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-full ${
                                            log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                            log.status === 'DUPLICATE_ATTEMPT' ? 'bg-amber-100 text-amber-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                            {log.status === 'SUCCESS' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</p>
                                            {log.notes && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{log.notes}</p>}
                                            <p className="text-[11px] text-slate-400 mt-1">{log.time_ago} · {log.actor_username}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- Close Session Modal ---- */}
            {showCloseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <StopCircle className="h-4 w-4 text-rose-600" />
                                Tutup Sesi Kasir
                            </h3>
                            <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {/* Summary before close */}
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Kas Awal (Float)</span>
                                <span className="font-semibold">{formatRp(session.opening_cash_float)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Total Penjualan</span>
                                <span className="font-semibold text-emerald-700">{formatRp(session.total_sales)}</span>
                            </div>
                            <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                                <span className="text-slate-700 font-semibold">Expected Cash di Laci</span>
                                <span className="font-black text-blue-700">{formatRp(session.expected_cash)}</span>
                            </div>
                        </div>

                        <form onSubmit={handleClose} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Uang Fisik yang Dihitung (Counted Cash) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                                    <input
                                        type="number" min="0" step="1000"
                                        value={data.counted_cash}
                                        onChange={(e) => setData('counted_cash', e.target.value)}
                                        placeholder={session.expected_cash}
                                        className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                                {data.counted_cash && (
                                    <p className={`mt-1.5 text-xs font-semibold ${
                                        (parseFloat(data.counted_cash) - session.expected_cash) === 0
                                            ? 'text-emerald-600'
                                            : 'text-rose-600'
                                    }`}>
                                        Variance: {formatRp(parseFloat(data.counted_cash || 0) - session.expected_cash)}
                                    </p>
                                )}
                                {errors.counted_cash && <p className="mt-1 text-xs text-rose-600">{errors.counted_cash}</p>}
                            </div>

                            {errors.error && (
                                <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    {errors.error}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button type="button" onClick={() => setShowCloseModal(false)}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition">
                                    <StopCircle className="h-3.5 w-3.5" />
                                    {processing ? 'Menutup...' : 'Tutup Sesi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PosLayout>
    );
}

