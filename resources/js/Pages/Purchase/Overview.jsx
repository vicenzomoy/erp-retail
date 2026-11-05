import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ShoppingBag,
    FileText,
    Plus,
    Clock,
    Truck,
    Receipt,
    TrendingUp,
    Users,
    ArrowRight,
    Building2,
    DollarSign,
} from 'lucide-react';

export default function Overview({ kpis = {}, recentOrders = [], topVendors = [] }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    return (
        <PurchaseLayout
            title="Overview Pembelian"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Overview' },
            ]}
        >
            <Head title="Overview Pembelian — Bara Wear" />

            {/* Top Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6 text-amber-600" />
                        Ringkasan Pembelian & Pengadaan (Purchase)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pengelolaan RFQ, Pesanan Pembelian (PO), Penerimaan Fisik Barang, dan Tagihan Vendor (3-Way Matching).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.orders.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Buat RFQ Baru
                    </Link>
                    <Link
                        href={route('purchase.vendors.index')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Users className="h-4 w-4 text-slate-500" />
                        Kelola Pemasok
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* KPI 1: Total Pembelian Bulan Ini */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">Total Pembelian (Bulan Ini)</span>
                        <div className="rounded bg-amber-50 p-2 text-amber-600 border border-amber-100">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                        {formatRp(kpis?.total_purchases_month)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Akumulasi PO berstatus Confirmed & Done
                    </p>
                </div>

                {/* KPI 2: RFQ Menunggu Konfirmasi */}
                <Link
                    href={route('purchase.orders.index', { status: 'rfq' })}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300 transition block group"
                >
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider group-hover:text-amber-700 transition">
                            RFQ Menunggu Konfirmasi
                        </span>
                        <div className="rounded bg-sky-50 p-2 text-sky-600 border border-sky-100">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition">
                        {kpis?.rfq_count ?? 0} Dokumen
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        Permintaan penawaran draft <ArrowRight className="h-3 w-3 inline" />
                    </p>
                </Link>

                {/* KPI 3: Menunggu Penerimaan Fisik */}
                <Link
                    href={route('inventory.receipts.index', { status: 'to_process' })}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300 transition block group"
                >
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider group-hover:text-emerald-700 transition">
                            Siap Diterima Gudang
                        </span>
                        <div className="rounded bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                            <Truck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition">
                        {kpis?.waiting_receipts_count ?? 0} Order
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        Penerimaan barang & inspeksi QC <ArrowRight className="h-3 w-3 inline" />
                    </p>
                </Link>

                {/* KPI 4: Menunggu Tagihan Vendor */}
                <Link
                    href={route('accounting.bills.index', { status: 'draft' })}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition block group"
                >
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider group-hover:text-indigo-700 transition">
                            Tagihan Tertunda
                        </span>
                        <div className="rounded bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                            <Receipt className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition">
                        {kpis?.waiting_bill_count ?? 0} Order
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        Siap diproses Three-Way Match <ArrowRight className="h-3 w-3 inline" />
                    </p>
                </Link>
            </div>

            {/* Split Grid: Recent Orders & Top Vendors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders Table (2 Cols) */}
                <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <h2 className="text-sm font-bold text-slate-800">Pesanan Pembelian Terbaru</h2>
                        </div>
                        <Link
                            href={route('purchase.orders.index')}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                        >
                            Lihat Semua <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4">Nomor PO</th>
                                    <th className="py-2.5 px-4">Pemasok</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                    <th className="py-2.5 px-4 text-center">Dipesan</th>
                                    <th className="py-2.5 px-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                                            Belum ada pesanan pembelian tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((po) => (
                                        <tr key={po.id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                <Link
                                                    href={route('purchase.orders.show', po.id)}
                                                    className="text-amber-700 hover:underline"
                                                >
                                                    {po.id}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">
                                                <div className="font-medium text-slate-900">{po.vendor_name}</div>
                                                <div className="text-[10px] text-slate-400">{po.vendor_city}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <OdooBadge status={po.status} />
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-slate-700">
                                                {po.total_ordered} pcs
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                                                {formatRp(po.grand_total)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Vendors Card (1 Col) */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-500" />
                            <h2 className="text-sm font-bold text-slate-800">Pemasok Teratas</h2>
                        </div>
                        <Link
                            href={route('purchase.vendors.index')}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                        >
                            Kelola <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="p-4 space-y-3">
                        {topVendors.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">Belum ada data vendor.</p>
                        ) : (
                            topVendors.map((v) => (
                                <Link
                                    key={v.id}
                                    href={route('purchase.vendors.show', v.id)}
                                    className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-slate-100/70 transition block"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                                {v.id}
                                            </span>
                                            {v.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {v.city} • Termin: {v.payment_terms} • {v.orders_count} Pesanan
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-900">
                                            {formatRp(v.total_spent)}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </PurchaseLayout>
    );
}

