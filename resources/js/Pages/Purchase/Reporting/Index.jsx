import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    ShoppingBag,
    CheckCircle2,
    Clock,
    DollarSign,
    Layers,
} from 'lucide-react';

export default function Index({
    vendorBreakdown = [],
    productBreakdown = [],
    statusSummary = {},
    totals = {},
}) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    return (
        <PurchaseLayout
            title="Analisis & Laporan Pembelian"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Laporan', href: route('purchase.reporting.index') },
                { label: 'Analisis Pembelian' },
            ]}
        >
            <Head title="Analisis Pembelian — Bara Wear" />

            {/* Header Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-amber-600" />
                        Analisis & Laporan Pembelian (Purchase Analysis)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Rekapitulasi pengadaan barang, performa pemasok (Vendor), dan rasio pemenuhan kuantitas pesanan.
                    </p>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Total Nilai Pembelian (PO)</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-1">
                        {formatRp(totals.total_po_value)}
                    </div>
                    <span className="text-[11px] text-slate-400">Dari {totals.total_po_count} PO terkonfirmasi/selesai</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Total Kuantitas Dipesan</span>
                    <div className="text-xl font-black text-slate-900 font-mono mt-1">
                        {totals.total_ordered_qty} pcs
                    </div>
                    <span className="text-[11px] text-slate-400">Seluruh item PO yang diterbitkan</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Total Kuantitas Diterima Baik</span>
                    <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                        {totals.total_received_qty} pcs
                    </div>
                    <span className="text-[11px] text-slate-400">Telah lolos inspeksi QC gudang</span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-slate-500 text-xs uppercase font-medium">Tingkat Pemenuhan (Fulfillment)</span>
                    <div className="text-xl font-black text-amber-700 font-mono mt-1">
                        {totals.total_ordered_qty > 0
                            ? Math.round((totals.total_received_qty / totals.total_ordered_qty) * 100)
                            : 0} %
                    </div>
                    <span className="text-[11px] text-slate-400">Rasio diterima vs dipesan</span>
                </div>
            </div>

            {/* Status Breakdown Pills */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Distribusi Status Siklus Dokumen Pembelian (Procure to Pay)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
                        <span className="text-slate-500 block text-[11px]">Draft / RFQ</span>
                        <span className="text-lg font-black text-slate-900">{statusSummary.rfq || 0}</span>
                    </div>
                    <div className="rounded-md border border-amber-100 bg-amber-50/50 p-3">
                        <span className="text-amber-700 block text-[11px]">PO Dikonfirmasi</span>
                        <span className="text-lg font-black text-amber-900">{statusSummary.confirmed || 0}</span>
                    </div>
                    <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
                        <span className="text-emerald-700 block text-[11px]">Selesai (Done)</span>
                        <span className="text-lg font-black text-emerald-900">{statusSummary.done || 0}</span>
                    </div>
                    <div className="rounded-md border border-rose-100 bg-rose-50/50 p-3">
                        <span className="text-rose-700 block text-[11px]">Dibatalkan</span>
                        <span className="text-lg font-black text-rose-900">{statusSummary.cancelled || 0}</span>
                    </div>
                </div>
            </div>

            {/* Split Tables: Vendor Breakdown & Product Breakdown */}
            <div className="space-y-6">
                {/* 1. Pembelian per Pemasok (Vendor) */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-amber-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rekapitulasi Pembelian Berdasarkan Pemasok (Vendor Breakdown)
                            </h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4">Pemasok</th>
                                    <th className="py-2.5 px-4 text-center">Jumlah PO</th>
                                    <th className="py-2.5 px-4 text-right">DPP (Dasar Pajak)</th>
                                    <th className="py-2.5 px-4 text-right">PPN 11%</th>
                                    <th className="py-2.5 px-4 text-right">Total Pembelian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendorBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 italic">
                                            Belum ada data transaksi pembelian terkonfirmasi.
                                        </td>
                                    </tr>
                                ) : (
                                    vendorBreakdown.map((vb) => (
                                        <tr key={vb.id} className="hover:bg-slate-50/50">
                                            <td className="py-3 px-4">
                                                <Link
                                                    href={route('purchase.vendors.show', vb.id)}
                                                    className="font-bold text-amber-800 hover:underline flex items-center gap-1.5"
                                                >
                                                    <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                                                        {vb.id}
                                                    </span>
                                                    {vb.name}
                                                    <span className="text-slate-400 font-normal">({vb.city})</span>
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                                                {vb.orders_count} PO
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                                                {formatRp(vb.total_dpp)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-amber-700">
                                                {formatRp(vb.total_tax)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                                {formatRp(vb.grand_total)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Pembelian per Produk / SKU */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rekapitulasi Pembelian Berdasarkan Produk & SKU Varian
                            </h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-4">SKU & Nama Varian</th>
                                    <th className="py-2.5 px-4 text-center">Ukuran / Warna</th>
                                    <th className="py-2.5 px-4 text-center">Total Dipesan</th>
                                    <th className="py-2.5 px-4 text-center">Total Diterima</th>
                                    <th className="py-2.5 px-4 text-center">Total Ditagih</th>
                                    <th className="py-2.5 px-4 text-right">Nilai Pembelian Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {productBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                                            Belum ada data baris produk yang dipesan.
                                        </td>
                                    </tr>
                                ) : (
                                    productBreakdown.map((pb) => (
                                        <tr key={pb.variant_sku} className="hover:bg-slate-50/50">
                                            <td className="py-3 px-4">
                                                <div className="font-mono font-bold text-slate-900">{pb.variant_sku}</div>
                                                <div className="text-slate-600 text-[11px]">{pb.name}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-600">
                                                {pb.size} • {pb.color}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                                                {parseFloat(pb.total_ordered)} {pb.unit}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-emerald-700">
                                                {parseFloat(pb.total_received)} {pb.unit}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-teal-700">
                                                {parseFloat(pb.total_billed)} {pb.unit}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                                {formatRp(pb.total_value)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PurchaseLayout>
    );
}

