import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    FileText,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    Clock,
    User,
    Printer,
    Package,
    MapPin,
    Tag,
} from 'lucide-react';

export default function StockMoves({ moves, filters = {}, products = [], locations = [] }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleFilterChange = (field, value) => {
        router.get(
            route('inventory.reporting.moves'),
            { ...filters, [field]: value, page: 1 },
            { preserveState: true }
        );
    };

    const getMoveTypeBadge = (type) => {
        switch (type) {
            case 'receipt':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                        <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                        Penerimaan (In)
                    </span>
                );
            case 'delivery':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold border border-rose-200">
                        <ArrowUpRight className="h-3 w-3 text-rose-600" />
                        Pengiriman (Out)
                    </span>
                );
            case 'transfer_in':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                        <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                        Transfer In
                    </span>
                );
            case 'transfer_out':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[10px] font-bold border border-indigo-200">
                        <ArrowRightLeft className="h-3 w-3 text-indigo-600" />
                        Transfer Out
                    </span>
                );
            case 'opening':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 text-slate-800 px-2 py-0.5 text-[10px] font-bold border border-slate-300">
                        Saldo Awal
                    </span>
                );
            default:
                return (
                    <span className="rounded bg-slate-100 text-slate-800 px-2 py-0.5 text-[10px] font-bold">
                        {type}
                    </span>
                );
        }
    };

    return (
        <InventoryLayout
            title="Riwayat Mutasi Stok (Ledger)"
            breadcrumbs={[
                { label: 'Laporan', href: route('inventory.overview') },
                { label: 'Riwayat Mutasi Stok' },
            ]}
        >
            <Head title="Riwayat Mutasi Stok (Stock Ledger) — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        Kartu Stok & Audit Ledger Persediaan (F-20)
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                        {moves.total} Entri Tercatat
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter SKU */}
                    <select
                        value={filters.sku || 'all'}
                        onChange={(e) => handleFilterChange('sku', e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 max-w-xs"
                    >
                        <option value="all">Semua SKU Produk</option>
                        {products.map((p) => (
                            <option key={p.variant_sku} value={p.variant_sku}>
                                {p.variant_sku} - {p.name}
                            </option>
                        ))}
                    </select>

                    {/* Filter Location */}
                    <select
                        value={filters.location || 'all'}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                        <option value="all">Semua Lokasi</option>
                        {locations.map((l) => (
                            <option key={l.location_code} value={l.location_code}>
                                {l.location_code}
                            </option>
                        ))}
                    </select>

                    {/* Filter Move Type */}
                    <select
                        value={filters.move_type || 'all'}
                        onChange={(e) => handleFilterChange('move_type', e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                        <option value="all">Semua Tipe Mutasi</option>
                        <option value="receipt">Penerimaan (PO)</option>
                        <option value="delivery">Pengiriman (DO)</option>
                        <option value="transfer_in">Transfer Masuk</option>
                        <option value="transfer_out">Transfer Keluar</option>
                        <option value="opening">Saldo Awal</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Ledger
                    </button>
                </div>
            </div>

            {/* Stock Moves Ledger Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-700">
                            <tr>
                                <th className="py-2.5 px-3 text-left">Waktu & Tanggal</th>
                                <th className="py-2.5 px-3 text-left">SKU Varian</th>
                                <th className="py-2.5 px-3 text-left">Lokasi</th>
                                <th className="py-2.5 px-3 text-center">Tipe Transaksi</th>
                                <th className="py-2.5 px-3 text-left">Dokumen Referensi</th>
                                <th className="py-2.5 px-3 text-right">Perubahan Qty</th>
                                <th className="py-2.5 px-3 text-right">Saldo Akhir</th>
                                <th className="py-2.5 px-3 text-right">Perubahan Nilai</th>
                                <th className="py-2.5 px-3 text-left">Aktor (Petugas)</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {moves.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400">
                                        Tidak ada catatan mutasi yang cocok dengan kriteria filter.
                                    </td>
                                </tr>
                            ) : (
                                moves.data.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                            {m.created_at}
                                        </td>

                                        <td className="py-2.5 px-3">
                                            <div className="font-mono font-bold text-slate-900">
                                                <Link
                                                    href={route('inventory.products.show', m.variant_sku)}
                                                    className="hover:underline"
                                                >
                                                    {m.variant_sku}
                                                </Link>
                                            </div>
                                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                                {m.product_name}
                                            </div>
                                        </td>

                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                            {m.location_code}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                            {getMoveTypeBadge(m.move_type)}
                                        </td>

                                        <td className="py-2.5 px-3 font-mono text-slate-700">
                                            <span className="text-slate-400 text-[10px] mr-1 uppercase">
                                                [{m.source_document_type}]
                                            </span>
                                            <span className="font-semibold">{m.source_document_id}</span>
                                        </td>

                                        <td className={`py-2.5 px-3 text-right font-bold text-sm ${
                                            m.qty_change > 0 ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                            {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
                                        </td>

                                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                                            {m.qty_on_hand_after}
                                        </td>

                                        <td className={`py-2.5 px-3 text-right font-medium ${
                                            m.total_value_change > 0 ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                            {m.total_value_change > 0 ? `+${formatRp(m.total_value_change)}` : formatRp(m.total_value_change)}
                                        </td>

                                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{m.moved_by_name}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {moves.links && moves.links.length > 3 && (
                    <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50 text-xs">
                        <span className="text-slate-500">
                            Menampilkan {moves.from || 0} - {moves.to || 0} dari {moves.total} catatan
                        </span>
                        <div className="flex items-center gap-1">
                            {moves.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-2.5 py-1 rounded text-xs transition ${
                                        link.active
                                            ? 'bg-slate-900 text-white font-bold'
                                            : link.url
                                            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                            : 'text-slate-400 cursor-not-allowed'
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

