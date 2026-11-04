import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingBag,
    FileText,
    CheckCircle2,
    CheckCircle,
    AlertTriangle,
    Plus,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const STATUS_BADGE = {
    draft: 'bg-slate-100 text-slate-600',
    confirmed: 'bg-blue-100 text-blue-700',
    done: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    credit_hold: 'bg-amber-100 text-amber-700',
};

const STATUS_LABEL = {
    draft: 'Draft',
    confirmed: 'Terkonfirmasi',
    done: 'Selesai',
    cancelled: 'Dibatalkan',
    credit_hold: 'Kredit Hold',
};

function getStatusBadge(status, creditHold) {
    if (creditHold) {
        return { cls: STATUS_BADGE.credit_hold, label: '⚠ Kredit Hold' };
    }
    return { cls: STATUS_BADGE[status] ?? STATUS_BADGE.draft, label: STATUS_LABEL[status] ?? status };
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, iconClass, label, value, pulse = false }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`text-2xl font-bold text-slate-900 ${pulse ? 'animate-pulse text-amber-600' : ''}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function SalesOverview({ kpis }) {
    const {
        total_orders = 0,
        draft_orders = 0,
        confirmed_orders = 0,
        done_orders = 0,
        credit_hold_orders = 0,
        total_confirmed_value = 0,
        recent_orders = [],
    } = kpis ?? {};

    return (
        <SalesLayout title="Sales Overview" breadcrumbs={[{ label: 'Ringkasan Penjualan' }]}>
            <Head title="Sales Overview" />

            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-lg font-bold text-slate-900">Ringkasan Penjualan</h1>
                <p className="text-xs text-slate-500 mt-0.5">Overview performa penjualan Bara Wear</p>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <KpiCard
                    icon={ShoppingBag}
                    iconClass="bg-slate-100 text-slate-600"
                    label="Total Order"
                    value={total_orders}
                />
                <KpiCard
                    icon={FileText}
                    iconClass="bg-slate-100 text-slate-500"
                    label="Draft / Quotation"
                    value={draft_orders}
                />
                <KpiCard
                    icon={CheckCircle2}
                    iconClass="bg-blue-50 text-blue-600"
                    label="Terkonfirmasi"
                    value={confirmed_orders}
                />
                <KpiCard
                    icon={CheckCircle}
                    iconClass="bg-emerald-50 text-emerald-600"
                    label="Selesai"
                    value={done_orders}
                />
                <KpiCard
                    icon={AlertTriangle}
                    iconClass="bg-amber-50 text-amber-600"
                    label="Kredit Hold"
                    value={credit_hold_orders}
                    pulse={credit_hold_orders > 0}
                />
            </div>

            {/* ── Confirmed Value Card ── */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 shadow-xs p-4 mb-6 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                        Nilai Order Terkonfirmasi
                    </p>
                    <p className="text-2xl font-bold text-blue-800">{formatRp(total_confirmed_value)}</p>
                </div>
            </div>

            {/* ── Operation Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Buat Quotation Baru</p>
                        <p className="text-xs text-slate-500 mt-0.5">Tambah order penjualan baru</p>
                    </div>
                    <Link
                        href={route('sales.orders.create')}
                        className="flex items-center gap-1.5 rounded bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat
                    </Link>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Lihat Semua Order</p>
                        <p className="text-xs text-slate-500 mt-0.5">Daftar seluruh quotation &amp; order</p>
                    </div>
                    <Link
                        href={route('sales.orders.index')}
                        className="flex items-center gap-1.5 rounded border border-slate-300 bg-white text-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition"
                    >
                        Lihat
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* ── Recent Orders Table ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Order Terbaru</h2>
                    <Link
                        href={route('sales.orders.index')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                        Lihat semua →
                    </Link>
                </div>

                {recent_orders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                        <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-30" />
                        Belum ada order penjualan
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. Order</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Pelanggan</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Grand Total</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recent_orders.map((order) => {
                                const { cls, label } = getStatusBadge(order.status, order.credit_hold);
                                return (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50 transition cursor-pointer"
                                        onClick={() => window.location.href = route('sales.orders.show', order.id)}
                                    >
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{order.id}</td>
                                        <td className="px-4 py-2.5 text-slate-700">{order.customer?.name ?? '—'}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
                                                {label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                                            {formatRp(order.grand_total)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </SalesLayout>
    );
}
