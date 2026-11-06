import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    ArrowRight,
    Package,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    CalendarDays,
} from 'lucide-react';

// ── Status badge ────────────────────────────────────────────────
const StatusBadge = ({ state }) => {
    switch (state) {
        case 'done':
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-[11px] font-semibold border border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Selesai
                </span>
            );
        case 'draft':
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-semibold border border-slate-200">
                    <Clock className="h-3 w-3" />
                    Draft
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[11px] font-semibold border border-red-200">
                    <XCircle className="h-3 w-3" />
                    Dibatalkan
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-semibold border border-slate-200">
                    {state}
                </span>
            );
    }
};

// ── Doc type label ───────────────────────────────────────────────
const docTypeLabel = (type) => {
    const map = {
        receipt:           'Penerimaan',
        delivery_order:    'Pengiriman',
        internal_transfer: 'Transfer Internal',
        pos_order:         'POS Order',
        credit_note:       'Retur',
        adjustment:        'Penyesuaian',
    };
    return map[type] ?? type;
};

// ── Main Page ────────────────────────────────────────────────────
export default function StockMoves({ moves, filters = {}, products = [], locations = [] }) {
    const handleFilter = (field, value) => {
        router.get(
            route('inventory.reporting.moves'),
            { ...filters, [field]: value, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const totalCount = moves?.total ?? 0;
    const rows       = moves?.data  ?? [];

    return (
        <InventoryLayout
            title="Riwayat Pergerakan Stok"
            breadcrumbs={[
                { label: 'Laporan', href: route('inventory.overview') },
                { label: 'Riwayat Pergerakan Stok' },
            ]}
        >
            <Head title="Riwayat Pergerakan Stok — Bara Wear" />

            {/* ── Control Panel ── */}
            <div className="mb-4 flex flex-col gap-3 pb-3 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                            Riwayat Pergerakan Stok
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                            {totalCount} pergerakan
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search/SKU */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <select
                            value={filters.sku || 'all'}
                            onChange={(e) => handleFilter('sku', e.target.value)}
                            className="rounded border border-slate-300 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        >
                            <option value="all">Semua Produk</option>
                            {products.map((p) => (
                                <option key={p.variant_sku} value={p.variant_sku}>
                                    {p.variant_sku} — {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Doc type */}
                    <select
                        value={filters.doc_type || 'all'}
                        onChange={(e) => handleFilter('doc_type', e.target.value)}
                        className="rounded border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                        <option value="all">Semua Tipe Dokumen</option>
                        <option value="receipt">Penerimaan (PO)</option>
                        <option value="delivery_order">Pengiriman (DO)</option>
                        <option value="internal_transfer">Transfer Internal</option>
                        <option value="pos_order">POS Order</option>
                        <option value="credit_note">Retur</option>
                    </select>

                    {/* Status */}
                    <select
                        value={filters.status || 'all'}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="rounded border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                        <option value="all">Semua Status</option>
                        <option value="done">Selesai</option>
                        <option value="draft">Draft</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>

                    {/* Date from */}
                    <div className="relative">
                        <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleFilter('date_from', e.target.value)}
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                            placeholder="Dari tanggal"
                        />
                    </div>

                    {/* Date to */}
                    <input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => handleFilter('date_to', e.target.value)}
                        className="rounded border border-slate-300 bg-white pl-3 pr-3 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Sampai tanggal"
                    />

                    {/* Reset */}
                    {(filters.sku !== 'all' || filters.status !== 'all' || filters.doc_type !== 'all' || filters.date_from || filters.date_to) && (
                        <button
                            type="button"
                            onClick={() => router.get(route('inventory.reporting.moves'))}
                            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wide text-[10px]">
                            <tr>
                                <th className="py-3 px-4 text-left">Tanggal & Waktu</th>
                                <th className="py-3 px-4 text-left">Referensi</th>
                                <th className="py-3 px-4 text-left">Produk</th>
                                <th className="py-3 px-4 text-left">Dari</th>
                                <th className="py-3 px-4 text-center w-6"></th>
                                <th className="py-3 px-4 text-left">Ke</th>
                                <th className="py-3 px-4 text-right">Kuantitas</th>
                                <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <Package className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-500">Tidak ada pergerakan stok</p>
                                        <p className="text-xs text-slate-400 mt-1">Coba ubah filter pencarian</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((m) => (
                                    <tr key={m.id} className="hover:bg-violet-50/40 transition-colors">
                                        {/* Tanggal & Waktu */}
                                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                            {m.date || '—'}
                                        </td>

                                        {/* Referensi */}
                                        <td className="py-3 px-4">
                                            <div className="font-mono font-semibold text-violet-700">
                                                {m.reference}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {docTypeLabel(m.doc_type)}
                                            </div>
                                        </td>

                                        {/* Produk */}
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                {m.product_name}
                                            </div>
                                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                                {m.variant_sku}
                                            </div>
                                        </td>

                                        {/* Dari */}
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700 font-semibold">
                                                {m.location_from}
                                            </span>
                                            {m.location_from_name && m.location_from_name !== m.location_from && (
                                                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                                    {m.location_from_name}
                                                </div>
                                            )}
                                        </td>

                                        {/* Arrow */}
                                        <td className="py-3 px-2 text-center">
                                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 mx-auto" />
                                        </td>

                                        {/* Ke */}
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700 font-semibold">
                                                {m.location_to}
                                            </span>
                                            {m.location_to_name && m.location_to_name !== m.location_to && (
                                                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                                    {m.location_to_name}
                                                </div>
                                            )}
                                        </td>

                                        {/* Kuantitas */}
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-bold text-sm text-slate-900">
                                                {m.qty_done % 1 === 0 ? Math.round(m.qty_done) : m.qty_done}
                                            </span>
                                            <span className="text-slate-400 ml-1 text-[10px]">pcs</span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4 text-center">
                                            <StatusBadge state={m.state} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {moves?.links && moves.links.length > 3 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
                        <span className="text-slate-500">
                            Menampilkan {moves.from ?? 0}–{moves.to ?? 0} dari {moves.total} pergerakan
                        </span>
                        <div className="flex items-center gap-1">
                            {moves.links.map((link, idx) => {
                                const isFirst = idx === 0;
                                const isLast  = idx === moves.links.length - 1;
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`inline-flex items-center justify-center rounded px-2.5 py-1 transition ${
                                            link.active
                                                ? 'bg-violet-600 text-white font-bold'
                                                : link.url
                                                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                                : 'text-slate-300 cursor-not-allowed pointer-events-none'
                                        }`}
                                    >
                                        {isFirst ? (
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        ) : isLast ? (
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </InventoryLayout>
    );
}
