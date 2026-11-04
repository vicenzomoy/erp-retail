import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import { Search, Receipt, ChevronRight, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function OrdersIndex({ orders, filters, daily_total }) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const handleSearch = (e) => {
        e.preventDefault();
        window.location.href = route('pos.orders.index', {
            search: searchInput,
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const paymentBadge = (method) => {
        const map = {
            cash: { label: 'Tunai', cls: 'bg-emerald-100 text-emerald-800' },
            qris: { label: 'QRIS', cls: 'bg-blue-100 text-blue-800' },
            card: { label: 'Kartu', cls: 'bg-purple-100 text-purple-800' },
        };
        const { label, cls } = map[method] ?? { label: method, cls: 'bg-slate-100 text-slate-700' };
        return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{label}</span>;
    };

    return (
        <PosLayout title="Riwayat Transaksi" breadcrumbs={[{ label: 'Riwayat Transaksi POS' }]}>
            <Head title="Riwayat Transaksi POS — Bara Wear" />

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3.5 mb-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah Order</span>
                        <ShoppingCart className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{daily_total.count}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Periode filter</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-black text-emerald-700 truncate">{formatRp(daily_total.revenue)}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Sudah termasuk PPN</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total PPN</span>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-black text-blue-700 truncate">{formatRp(daily_total.tax)}</div>
                    <p className="text-[11px] text-slate-400 mt-1">PPN Keluaran (11%)</p>
                </div>
            </div>

            {/* Filter + Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5 bg-slate-50/50 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text" value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Cari kode order / pelanggan..."
                            className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Dari:</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none" />
                        <label className="text-xs text-slate-500">S/d:</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-rose-500 focus:outline-none" />
                    </div>
                    <button type="submit"
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition">
                        Filter
                    </button>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Kode Order</th>
                                <th className="px-4 py-2.5">Sesi</th>
                                <th className="px-4 py-2.5">Kasir</th>
                                <th className="px-4 py-2.5">Pelanggan</th>
                                <th className="px-4 py-2.5">Lokasi</th>
                                <th className="px-4 py-2.5">Pembayaran</th>
                                <th className="px-4 py-2.5 text-right">Grand Total</th>
                                <th className="px-4 py-2.5 text-right">Tunai</th>
                                <th className="px-4 py-2.5 text-right">Kembalian</th>
                                <th className="px-4 py-2.5">Waktu</th>
                                <th className="px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-4 py-10 text-center text-slate-400">
                                        Belum ada transaksi pada periode ini.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-rose-700">{o.id}</td>
                                        <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">{o.pos_session_id}</td>
                                        <td className="px-4 py-2.5">{o.cashier_name}</td>
                                        <td className="px-4 py-2.5">{o.customer_name}</td>
                                        <td className="px-4 py-2.5 text-slate-500">{o.location_code}</td>
                                        <td className="px-4 py-2.5">{paymentBadge(o.payment_method)}</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRp(o.grand_total)}</td>
                                        <td className="px-4 py-2.5 text-right">{formatRp(o.cash_tendered)}</td>
                                        <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">{formatRp(o.change_given)}</td>
                                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{o.paid_at}</td>
                                        <td className="px-4 py-2.5">
                                            <Link href={route('pos.orders.show', o.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                                                Struk <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
                        <span className="text-xs text-slate-500">
                            {orders.from}–{orders.to} dari {orders.total} transaksi
                        </span>
                        <div className="flex gap-1">
                            {orders.links?.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url}
                                        className={`px-2.5 py-1 rounded text-xs font-medium ${link.active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="px-2.5 py-1 rounded text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PosLayout>
    );
}

