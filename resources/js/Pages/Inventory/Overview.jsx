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
    Plus,
    Clock,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    ExternalLink,
    ArrowRight,
    XCircle,
} from 'lucide-react';

export default function Overview({ kpis = {}, recentMoves = [], lowStockAlerts = [] }) {
    const getDocTypeBadge = (type) => {
        switch (type) {
            case 'receipt':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold border border-blue-200">
                        <ArrowDownLeft className="h-3 w-3" />
                        Penerimaan (PO)
                    </span>
                );
            case 'delivery_order':
            case 'delivery':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-purple-50 text-purple-700 px-2 py-0.5 text-[11px] font-semibold border border-purple-200">
                        <Truck className="h-3 w-3" />
                        Pengiriman (DO)
                    </span>
                );
            case 'internal_transfer':
            case 'transfer':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold border border-emerald-200">
                        <ArrowRightLeft className="h-3 w-3" />
                        Transfer Internal
                    </span>
                );
            case 'pos_order':
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-semibold border border-amber-200">
                        POS Penjualan
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-semibold border border-slate-200">
                        {type?.replace('_', ' ')}
                    </span>
                );
        }
    };

    const getAlertBadge = (status) => {
        switch (status) {
            case 'out_of_stock':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[11px] font-bold border border-rose-200">
                        <XCircle className="h-3 w-3" />
                        Stok Habis (0 pcs)
                    </span>
                );
            case 'critical':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-2.5 py-0.5 text-[11px] font-bold border border-orange-200">
                        <AlertTriangle className="h-3 w-3" />
                        Kritis (&le; 5 pcs)
                    </span>
                );
            case 'warning':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold border border-amber-200">
                        <AlertCircle className="h-3 w-3" />
                        Menipis (&le; 10 pcs)
                    </span>
                );
        }
    };

    const lowStockCount = kpis?.low_stock_count ?? lowStockAlerts.length;
    const outOfStockCount = kpis?.out_of_stock_count ?? lowStockAlerts.filter(a => a.available <= 0).length;

    return (
        <InventoryLayout
            title="Inventory Overview"
            breadcrumbs={[{ label: 'Ringkasan Operasi' }]}
        >
            <Head title="Inventory Overview — Bara Wear" />

            {/* Top Operational KPI Cards Bar (Warehouse-Centric) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                {/* 1. Total On Hand */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Total Stok Fisik (On Hand)
                        </span>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                        {(kpis?.total_on_hand ?? 0).toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-slate-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Total fisik di seluruh gudang & toko
                    </p>
                </div>

                {/* 2. Total Reserved */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Terkunci Pesanan (Reserved)
                        </span>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-600">
                        {(kpis?.total_reserved ?? 0).toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-amber-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Sudah direservasi pesanan penjualan (SO)
                    </p>
                </div>

                {/* 3. Available (ATP) */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            Siap Kirim / Jual (ATP)
                        </span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                        {(kpis?.total_available ?? 0).toLocaleString('id-ID')}
                        <span className="text-xs font-medium text-emerald-500 ml-1">pcs</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Stok bebas siap diproses / ditransfer
                    </p>
                </div>

                {/* 4. Peringatan Stok Menipis (Menggantikan Nilai Persediaan untuk Personil Gudang) */}
                <div className={`rounded-lg border p-4 shadow-xs ${
                    lowStockCount > 0 
                        ? 'border-amber-300 bg-amber-50/40' 
                        : 'border-slate-200 bg-white'
                }`}>
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                            Peringatan Stok Menipis
                        </span>
                        <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                            {lowStockCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">SKU perlu restock</span>
                    </div>
                    <p className="text-[11px] mt-1 font-medium">
                        {lowStockCount > 0 ? (
                            <span className="text-rose-600">
                                {outOfStockCount > 0 ? `${outOfStockCount} SKU stok habis (0 pcs)` : 'Mendekati ambang batas minimum'}
                            </span>
                        ) : (
                            <span className="text-emerald-600">Semua stok dalam batas aman (&gt; 10 pcs)</span>
                        )}
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
                        </div>

                        <div className="flex items-baseline justify-between mb-4">
                            <Link
                                href={route('inventory.receipts.index', { status: 'to_process' })}
                                className="group flex items-baseline gap-2 cursor-pointer"
                            >
                                <span className="text-3xl font-black text-blue-600 group-hover:underline">
                                    {kpis?.receipts?.to_process ?? 0}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700">
                                    Siap Diproses
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {kpis?.receipts?.done ?? 0} Selesai
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
                                    {kpis?.deliveries?.to_process ?? 0}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-purple-700">
                                    Siap Dikirim
                                </span>
                            </Link>
                            <div className="flex items-center gap-2 text-xs">
                                {(kpis?.deliveries?.backorders ?? 0) > 0 && (
                                    <Link
                                        href={route('inventory.deliveries.index', { status: 'backorders' })}
                                        className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                                    >
                                        {kpis.deliveries.backorders} Backorders
                                    </Link>
                                )}
                                <span className="text-slate-400">
                                    {kpis?.deliveries?.done ?? 0} Selesai
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
                                    Mutasi stok WH-PKU &amp; TOKO-PKU
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
                                    {kpis?.transfers?.to_process ?? 0}
                                </span>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">
                                    Siap Transfer
                                </span>
                            </Link>
                            <span className="text-xs text-slate-400">
                                {kpis?.transfers?.done ?? 0} Selesai
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

            {/* Peringatan Stok Menipis & Kritis (Low Stock Alert Widget) */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                            Peringatan Stok Menipis &amp; Kritis
                        </h3>
                        {lowStockAlerts.length > 0 && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-200">
                                {lowStockAlerts.length} SKU Perlu Perhatian
                            </span>
                        )}
                    </div>
                    <Link
                        href={route('inventory.reporting.forecast')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                        Monitoring Perkiraan Stok (ATP) &rarr;
                    </Link>
                </div>

                {lowStockAlerts.length === 0 ? (
                    <div className="p-6 text-center">
                        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-semibold text-slate-800">
                            Semua stok dalam kondisi aman
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Tidak ada produk dengan stok siap jual di bawah ambang batas minimum (&le; 10 pcs).
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">SKU Varian</th>
                                    <th className="px-4 py-2.5">Nama Produk</th>
                                    <th className="px-4 py-2.5 text-center">Ukuran / Warna</th>
                                    <th className="px-4 py-2.5 text-center">Fisik (On Hand)</th>
                                    <th className="px-4 py-2.5 text-center">Tereservasi (SO)</th>
                                    <th className="px-4 py-2.5 text-center">Siap Jual (ATP)</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lowStockAlerts.map((item) => (
                                    <tr key={item.sku} className="hover:bg-amber-50/30 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {item.sku}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700 text-[11px]">
                                                {item.size}
                                            </span>
                                            <span className="ml-1 text-slate-500 text-[11px]">
                                                {item.color}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                                            {item.on_hand} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-bold text-amber-700 whitespace-nowrap">
                                            {item.reserved > 0 ? `${item.reserved} ${item.unit}` : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                            <span className={`font-black text-xs px-2 py-0.5 rounded border ${
                                                item.available <= 0 
                                                    ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                                    : item.available <= 5 
                                                    ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}>
                                                {item.available} {item.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                            {getAlertBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                            <Link
                                                href={route('inventory.products.show', item.sku)}
                                                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[11px] font-semibold transition"
                                            >
                                                Lihat Stok
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Stock Moves Table (Aktivitas Pergerakan Gudang - Tanpa Nilai Uang) */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                            Aktivitas Pergerakan Stok Terakhir
                        </h3>
                        <span className="text-xs font-medium text-slate-400">
                            (Log Operasi Pergudangan Real-time)
                        </span>
                    </div>
                    <Link
                        href={route('inventory.reporting.moves')}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        Lihat Semua Riwayat Pergerakan &rarr;
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Waktu</th>
                                <th className="px-4 py-2.5">Referensi Dokumen</th>
                                <th className="px-4 py-2.5">Tipe Operasi</th>
                                <th className="px-4 py-2.5">Produk / SKU</th>
                                <th className="px-4 py-2.5">Dari</th>
                                <th className="px-4 py-2.5">Ke</th>
                                <th className="px-4 py-2.5 text-right">Kuantitas</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentMoves.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                                        Belum ada pergerakan stok tercatat.
                                    </td>
                                </tr>
                            ) : (
                                recentMoves.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                                            {m.date}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                            {m.reference}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            {getDocTypeBadge(m.type)}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span className="font-semibold text-slate-800">{m.sku}</span>
                                            <span className="text-slate-400 ml-1.5">({m.product_name})</span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-600">
                                            {m.from}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-600">
                                            {m.to}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                            {m.qty % 1 === 0 ? Math.round(m.qty) : m.qty} pcs
                                        </td>
                                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Selesai
                                            </span>
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
