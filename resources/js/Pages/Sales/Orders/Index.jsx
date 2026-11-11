import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function getStatusBadge(status, creditHold, discountHold) {
    if (creditHold) return { cls: 'bg-amber-100 text-amber-700', label: '⚠ Kredit Hold' };
    if (discountHold) return { cls: 'bg-rose-100 text-rose-700', label: '⚠ Diskon Hold' };
    const map = {
        draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
        confirmed: { cls: 'bg-blue-100 text-blue-700', label: 'Terkonfirmasi' },
        done: { cls: 'bg-emerald-100 text-emerald-700', label: 'Selesai' },
        cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
    };
    return map[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
}

const STATUS_FILTERS = [
    { key: '', label: 'Semua' },
    { key: 'draft', label: 'Draft' },
    { key: 'confirmed', label: 'Terkonfirmasi' },
    { key: 'done', label: 'Selesai' },
    { key: 'credit_hold', label: 'Kredit Hold' },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function SalesOrderIndex({ orders, filters = {} }) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('sales.orders.index'), { ...filters, search: e.target.value }, { preserveState: true });
        }
    };

    const handleStatusFilter = (status) => {
        router.get(route('sales.orders.index'), { ...filters, status, search }, { preserveState: true });
    };

    const data = orders?.data ?? [];
    const links = orders?.links ?? [];
    const meta = orders?.meta ?? {};

    // Count stats from current page (or use meta if available)
    const currentStatus = filters.status ?? '';

    return (
        <SalesLayout title="Daftar Order Penjualan" breadcrumbs={[{ label: 'Quotation & Sales Order' }]}>
            <Head title="Daftar Order Penjualan" />

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Quotation &amp; Sales Order</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {meta.total != null ? `${meta.total} order ditemukan` : ''}
                    </p>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Status filter chips */}
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => handleStatusFilter(f.key)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${currentStatus === f.key
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search input */}
                <div className="ml-auto flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari no. order / pelanggan…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="bg-transparent outline-none placeholder-slate-400 w-48 text-xs"
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                {data.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-25" />
                        <p className="text-sm font-medium">Belum ada order penjualan</p>
                        <p className="text-xs mt-1">Buat quotation pertama Anda</p>
                        <Link
                            href={route('sales.orders.create')}
                            className="mt-4 inline-flex items-center gap-1.5 rounded bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Buat Quotation
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="w-8 px-4 py-2.5">
                                    <input type="checkbox" className="rounded border-slate-300" />
                                </th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. Order</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Pelanggan</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Termin</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Grand Total</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Tgl. Konfirmasi</th>
                                <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((order) => {
                                const { cls, label } = getStatusBadge(order.status, order.credit_hold, order.discount_hold);
                                return (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50 transition cursor-pointer"
                                        onClick={() => router.visit(route('sales.orders.show', order.id))}
                                    >
                                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="rounded border-slate-300" />
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">
                                            {order.id}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-700">
                                            {order.customer?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {order.payment_terms ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
                                                {label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                                            {formatRp(order.grand_total)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {order.confirmed_at
                                                ? new Date(order.confirmed_at).toLocaleDateString('id-ID')
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Link
                                                href={route('sales.orders.show', order.id)}
                                                className="rounded border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                Lihat
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Pagination ── */}
            {links.length > 3 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {links.map((link, idx) => {
                        if (link.label === '&laquo; Previous') {
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            );
                        }
                        if (link.label === 'Next &raquo;') {
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            );
                        }
                        return (
                            <button
                                key={idx}
                                onClick={() => link.url && router.visit(link.url)}
                                disabled={!link.url}
                                className={`flex h-8 w-8 items-center justify-center rounded text-xs font-semibold transition ${link.active
                                        ? 'bg-slate-900 text-white'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            )}
        </SalesLayout>
    );
}
