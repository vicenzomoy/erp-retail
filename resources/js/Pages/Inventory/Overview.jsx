import React from 'react';
import { Head, Link } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    ArrowDownLeft,
    Truck,
    ArrowRightLeft,
    Package,
    ShieldCheck,
    Layers,
    DollarSign,
    Plus,
    Clock,
    CheckCircle2,
    RotateCcw,
    ExternalLink,
} from 'lucide-react';

export default function Overview({ kpis, recentMoves = [] }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <InventoryLayout
            title="Inventory Overview"
            breadcrumbs={[{ label: 'Ringkasan Operasi' }]}
        >
            <Head title="Inventory Overview — Bara Wear" />

            {/* Top KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Total On Hand
                        </span>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                        {kpis.total_on_hand.toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-slate-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Fisik di WH-PKU & TOKO-PKU
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Total Reserved
                        </span>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-600">
                        {kpis.total_reserved.toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-amber-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Terkunci pesanan (SO)
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Available (ATP)
                        </span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                        {kpis.total_available.toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-emerald-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Siap jual / ditransfer
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Nilai Persediaan
                        </span>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                        {formatRp(kpis.total_valuation)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Valuasi standar aktiva lancar
                    </p>
                </div>
            </div>

            {/* Odoo 17 Operation Cards (Kanban Cards) */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-slate-500" />
                        Kartu Operasional Gudang (Operations Types)
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. RECEIPTS CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-blue-50 text-blue-600">
                                        <ArrowDownLeft className="h-4 w-4" />
                                    </div>
                                    Penerimaan (Receipts)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Penerimaan barang dari PO / Vendor
                                </p>
                            </div>
                            <Link
                                href={route('inventory.receipts.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('inventory.receipts.index', { status: 'to_process' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-blue-600 group-hover:underline">
                                    {kpis.receipts.to_process}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700">
                                    Siap Diproses
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {kpis.receipts.done} Selesai
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('inventory.receipts.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                                Buka Daftar Penerimaan
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* 2. DELIVERY ORDERS CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-purple-50 text-purple-600">
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    Pengiriman (Deliveries)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Surat jalan pesanan penjualan (SO)
                                </p>
                            </div>
                            <Link
                                href={route('inventory.deliveries.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('inventory.deliveries.index', { status: 'to_process' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-purple-600 group-hover:underline">
                                    {kpis.deliveries.to_process}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-purple-700">
                                    Siap Dikirim
                                </span>
                            </Link>
                            <div className="flex items-center gap-2 text-xs">
                                {kpis.deliveries.backorders > 0 && (
                                    <Link
                                        href={route('inventory.deliveries.index', { status: 'backorders' })}
                                        className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                                    >
                                        {kpis.deliveries.backorders} Backorders
                                    </Link>
                                )}
                                <span className="text-slate-400">
                                    {kpis.deliveries.done} Done
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('inventory.deliveries.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
                            >
                                Buka Daftar Pengiriman
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* 3. INTERNAL TRANSFERS CARD */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </div>
                                    Transfer Antar Lokasi
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mutasi stok WH-PKU & TOKO-PKU
                                </p>
                            </div>
                            <Link
                                href={route('inventory.transfers.create')}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat
                            </Link>
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('inventory.transfers.index', { status: 'to_process' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-emerald-600 group-hover:underline">
                                    {kpis.transfers.to_process}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">
                                    Siap Transfer
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {kpis.transfers.done} Selesai
                            </span>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <Link
                                href={route('inventory.transfers.index')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                            >
                                Buka Daftar Transfer
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Stock Moves Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                            Aktivitas Mutasi Stok Terakhir
                        </h3>
                        <span className="text-xs font-medium text-slate-400">
                            (Buku Besar Persediaan Real-time)
                        </span>
                    </div>
                    <Link
                        href={route('inventory.reporting.moves')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        Lihat Semua Riwayat →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Waktu</th>
                                <th className="px-4 py-2.5">Referensi Dokumen</th>
                                <th className="px-4 py-2.5">Tipe Mutasi</th>
                                <th className="px-4 py-2.5">Produk / SKU</th>
                                <th className="px-4 py-2.5">Dari</th>
                                <th className="px-4 py-2.5">Ke</th>
                                <th className="px-4 py-2.5 text-right">Kuantitas</th>
                                <th className="px-4 py-2.5 text-right">Nilai Mutasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentMoves.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                        Belum ada mutasi stok tercatat selain saldo awal.
                                    </td>
                                </tr>
                            ) : (
                                recentMoves.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                            {m.date}
                                        </td>
                                        <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                            {m.reference}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span className="capitalize text-slate-600 font-medium">
                                                {m.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span className="font-semibold text-slate-800">{m.sku}</span>
                                            <span className="text-slate-400 ml-1.5">({m.product_name})</span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                                            {m.from}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                                            {m.to}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                            {m.qty} pcs
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-medium text-slate-700 whitespace-nowrap">
                                            {formatRp(m.total_value)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </InventoryLayout>
    );
}

