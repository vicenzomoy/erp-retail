import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ArrowLeft,
    Users,
    MapPin,
    CreditCard,
    DollarSign,
    ShoppingBag,
    FileText,
    Receipt,
    Plus,
    Trash2,
    ExternalLink,
    AlertTriangle,
    X,
} from 'lucide-react';

export default function Show({ vendor, pricelists = [], orders = [], bills = [], stats = {} }) {
    const [activeTab, setActiveTab] = useState('pricelist'); // 'pricelist' | 'orders' | 'bills'
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleConfirmDelete = () => {
        if (isDeleting) return;
        setIsDeleting(true);
        router.delete(route('purchase.vendors.destroy', vendor.id), {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteModal(false);
            },
        });
    };

    return (
        <PurchaseLayout
            title={`Vendor ${vendor.name}`}
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pemasok (Vendors)', href: route('purchase.vendors.index') },
                { label: vendor.name },
            ]}
        >
            <Head title={`Pemasok ${vendor.name} — Bara Wear`} />

            {/* Header Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Vendor"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {vendor.id}
                            </span>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {vendor.name}
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {vendor.city} • Termin Standar: <span className="font-mono font-semibold text-slate-800">{vendor.payment_terms}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                        title="Hapus Vendor"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        Hapus Vendor
                    </button>
                    <Link
                        href={route('purchase.orders.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Buat RFQ untuk Vendor Ini
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Total Pesanan PO</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        {stats.total_orders || 0}
                    </div>
                    <span className="text-[11px] text-slate-400">Akumulasi dokumen PO</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Total Nilai Pembelian</span>
                    <div className="text-2xl font-black text-amber-900 font-mono mt-1">
                        {formatRp(stats.total_spent)}
                    </div>
                    <span className="text-[11px] text-slate-400">PO Confirmed & Done</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Sisa Tagihan Terbuka (AP)</span>
                    <div className="text-2xl font-black text-indigo-900 font-mono mt-1">
                        {formatRp(stats.open_bills_amount)}
                    </div>
                    <span className="text-[11px] text-slate-400">Vendor Bill berstatus Posted</span>
                </div>
            </div>

            {/* Content Tabs Card */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Tab Navigation Header */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pricelist')}
                        className={`py-2 px-3 rounded-t-md border-t border-x cursor-pointer transition ${
                            activeTab === 'pricelist'
                                ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Daftar Harga Beli (Pricelist) ({pricelists.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`py-2 px-3 rounded-t-md border-t border-x cursor-pointer transition ${
                            activeTab === 'orders'
                                ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Pesanan Pembelian ({orders.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('bills')}
                        className={`py-2 px-3 rounded-t-md border-t border-x cursor-pointer transition ${
                            activeTab === 'bills'
                                ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Faktur Tagihan ({bills.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {/* TAB 1: PRICELIST */}
                    {activeTab === 'pricelist' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3">SKU Varian</th>
                                            <th className="py-2.5 px-3">Nama Produk</th>
                                            <th className="py-2.5 px-3 text-center">Ukuran</th>
                                            <th className="py-2.5 px-3 text-center">Warna</th>
                                            <th className="py-2.5 px-3 text-center">Min. Order</th>
                                            <th className="py-2.5 px-3 text-right">Harga Satuan (HPP)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pricelists.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                                                    Tidak ada pricelist terdaftar untuk vendor ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            pricelists.map((pl) => (
                                                <tr key={pl.id} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                        {pl.variant_sku}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                                                        {pl.product_name}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center text-slate-600">
                                                        {pl.size}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center text-slate-600">
                                                        {pl.color}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                                        {pl.min_qty} {pl.unit}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                        {formatRp(pl.unit_price)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ORDERS */}
                    {activeTab === 'orders' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3">Nomor PO</th>
                                            <th className="py-2.5 px-3">Waktu</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-center">Dipesan</th>
                                            <th className="py-2.5 px-3 text-right">Grand Total</th>
                                            <th className="py-2.5 px-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                                                    Belum ada riwayat pesanan pembelian untuk vendor ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map((po) => (
                                                <tr key={po.id} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                        {po.id}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600">
                                                        {po.created_at}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <OdooBadge status={po.status} />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                                        {po.total_ordered} pcs
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                        {formatRp(po.grand_total)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <Link
                                                            href={route('purchase.orders.show', po.id)}
                                                            className="inline-flex items-center gap-1 text-amber-700 hover:underline"
                                                        >
                                                            Buka <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: BILLS */}
                    {activeTab === 'bills' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3">Nomor Tagihan</th>
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-right">Grand Total</th>
                                            <th className="py-2.5 px-3 text-right">Sisa Tagihan</th>
                                            <th className="py-2.5 px-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {bills.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                                                    Belum ada tagihan vendor untuk vendor ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            bills.map((b) => (
                                                <tr key={b.id} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                        {b.id}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600">
                                                        {b.created_at}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <OdooBadge status={b.status} />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                        {formatRp(b.grand_total)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                                                        {formatRp(b.amount_residual)}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <Link
                                                            href={route('accounting.bills.show', b.id)}
                                                            className="inline-flex items-center gap-1 text-indigo-700 hover:underline"
                                                        >
                                                            Buka di Accounting <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Vendor */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                                Konfirmasi Hapus Vendor
                            </h3>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setShowDeleteModal(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                            <p className="font-medium text-slate-900">
                                Yakin ingin menghapus vendor ini?
                            </p>
                            <div className="rounded bg-slate-50 border border-slate-200 px-3 py-2 text-slate-700">
                                <span className="font-mono font-bold text-slate-900">{vendor.id}</span> —{' '}
                                <span className="font-semibold">{vendor.name}</span>
                            </div>
                            <p className="text-rose-600 font-medium">
                                Tindakan ini tidak bisa di-undo.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setShowDeleteModal(false)}
                                className="px-3.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PurchaseLayout>
    );
}

