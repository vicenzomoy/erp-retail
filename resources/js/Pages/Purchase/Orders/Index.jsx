import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    ShoppingBag,
    Filter,
    ArrowRight,
    Building2,
    Calendar,
    Truck,
    Receipt,
} from 'lucide-react';

export default function Index({ orders, filters = {}, counts = {}, vendors = [] }) {
    const handleStatusFilter = (status) => {
        router.get(
            route('purchase.orders.index'),
            { ...filters, status },
            { preserveState: true }
        );
    };

    const handleVendorFilter = (vendor_id) => {
        router.get(
            route('purchase.orders.index'),
            { ...filters, vendor_id: vendor_id || undefined },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const search = e.target.search.value;
        router.get(
            route('purchase.orders.index'),
            { ...filters, search: search || undefined },
            { preserveState: true }
        );
    };

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    return (
        <PurchaseLayout
            title="Pesanan Pembelian"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pesanan Pembelian (PO)' },
            ]}
        >
            <Head title="Pesanan Pembelian (Purchase Orders) — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('purchase.orders.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Buat RFQ (New)
                    </Link>
                    <span className="text-sm font-bold text-slate-800">
                        Permintaan Penawaran & Pesanan Pembelian
                    </span>
                </div>

                {/* Search Bar & Vendor Dropdown */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={filters.vendor_id || ''}
                        onChange={(e) => handleVendorFilter(e.target.value)}
                        className="rounded border border-slate-300 bg-white py-1.5 px-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="">Semua Pemasok</option>
                        {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.raw_name} ({v.id})
                            </option>
                        ))}
                    </select>

                    <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={filters.search}
                                placeholder="Cari nomor PO, vendor..."
                                className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-52 sm:w-60"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>
                </div>
            </div>

            {/* Filter Pills Bar (Odoo Style) */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase tracking-wider">
                    <Filter className="h-3 w-3" /> Status:
                </span>
                <button
                    onClick={() => handleStatusFilter('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        !filters.status || filters.status === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua ({counts.all || 0})
                </button>
                <button
                    onClick={() => handleStatusFilter('rfq')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'rfq'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    RFQ / Draft ({counts.rfq || 0})
                </button>
                <button
                    onClick={() => handleStatusFilter('confirmed')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'confirmed'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    PO Dikonfirmasi ({counts.confirmed || 0})
                </button>
                <button
                    onClick={() => handleStatusFilter('done')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'done'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Selesai ({counts.done || 0})
                </button>
                <button
                    onClick={() => handleStatusFilter('cancelled')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        filters.status === 'cancelled'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Dibatalkan ({counts.cancelled || 0})
                </button>
            </div>

            {/* Orders Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Nomor Dokumen</th>
                                <th className="py-3 px-4">Pemasok (Vendor)</th>
                                <th className="py-3 px-4">Termin</th>
                                <th className="py-3 px-4 text-center">Dipesan</th>
                                <th className="py-3 px-4 text-center">Diterima</th>
                                <th className="py-3 px-4 text-center">Ditagih</th>
                                <th className="py-3 px-4 text-right">Total Tagihan</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-slate-400 italic">
                                        Tidak ada pesanan pembelian yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((po) => (
                                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                            <Link
                                                href={route('purchase.orders.show', po.id)}
                                                className="text-amber-700 hover:underline flex items-center gap-1.5"
                                            >
                                                {po.id}
                                                {po.source_doc_no && (
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                        ({po.source_doc_no})
                                                    </span>
                                                )}
                                            </Link>
                                            <div className="text-[10px] text-slate-400 font-normal">
                                                {po.created_at}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-800">
                                            <div className="font-semibold text-slate-900">{po.vendor_name}</div>
                                            <div className="text-[10px] text-slate-500">{po.vendor_city}</div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                                            {po.payment_terms}
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                                            {po.total_ordered} pcs
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                po.total_received >= po.total_ordered && po.total_ordered > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : po.total_received > 0
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'text-slate-400'
                                            }`}>
                                                {po.total_received} pcs
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                po.total_billed >= po.total_ordered && po.total_ordered > 0
                                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                    : po.total_billed > 0
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'text-slate-400'
                                            }`}>
                                                {po.total_billed} pcs
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-slate-900">
                                            {formatRp(po.grand_total)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <OdooBadge status={po.status} />
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Link
                                                href={route('purchase.orders.show', po.id)}
                                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                Buka <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {orders.links && orders.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs text-slate-500">
                            Menampilkan <span className="font-semibold">{orders.from || 0}</span> s/d{' '}
                            <span className="font-semibold">{orders.to || 0}</span> dari{' '}
                            <span className="font-semibold">{orders.total}</span> data
                        </div>
                        <div className="flex items-center gap-1">
                            {orders.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`rounded px-2.5 py-1 text-xs ${
                                        link.active
                                            ? 'bg-slate-900 text-white font-bold'
                                            : link.url
                                            ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                            : 'text-slate-400 cursor-not-allowed opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PurchaseLayout>
    );
}

