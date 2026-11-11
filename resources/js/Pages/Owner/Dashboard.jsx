import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    BarChart3,
    Percent,
    AlertTriangle,
    CheckCircle2,
    Store,
    ShoppingCart,
    Award,
    ShieldAlert,
    ExternalLink,
    Clock,
    X,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function OwnerDashboard({
    kpis,
    pendingApprovals = [],
    channels,
    topProducts = [],
    salesTeam = [],
}) {
    const [approvalModal, setApprovalModal] = useState({ open: false, order: null });
    const [rejectModal, setRejectModal] = useState({ open: false, order: null, reason: '', adjustedDiscount: 10 });
    const [processing, setProcessing] = useState(false);

    const handleApprove = () => {
        if (!approvalModal.order) return;
        setProcessing(true);
        router.post(
            route('owner.approvals.discounts.approve', approvalModal.order.id),
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setApprovalModal({ open: false, order: null });
                },
            }
        );
    };

    const handleReject = () => {
        if (!rejectModal.order) return;
        setProcessing(true);
        router.post(
            route('owner.approvals.discounts.reject', rejectModal.order.id),
            {
                reason: rejectModal.reason,
                adjusted_discount: rejectModal.adjustedDiscount,
            },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectModal({ open: false, order: null, reason: '', adjustedDiscount: 10 });
                },
            }
        );
    };

    return (
        <OwnerLayout
            title="Executive Dashboard"
            pendingCount={kpis.pending_discounts_count}
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Executive Dashboard' },
            ]}
        >
            <Head title="Executive Dashboard - PT Bara Ritel Nusantara" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                            Executive Dashboard
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Realtime PT Bara Ritel Nusantara
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Laporan metrik operasional, profitabilitas, kas, piutang, dan pusat kendali persetujuan diskon penjualan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('owner.approvals.discounts')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition"
                        >
                            <Percent className="h-3.5 w-3.5 text-amber-400" />
                            <span>Persetujuan Diskon</span>
                            {kpis.pending_discounts_count > 0 && (
                                <span className="ml-1 bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                                    {kpis.pending_discounts_count}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* 6 High-Level Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* 1. Pendapatan Hari Ini */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Omset Hari Ini</span>
                            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.today_revenue)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Kombinasi POS Kasir &amp; SO
                        </p>
                    </div>

                    {/* 2. Pendapatan Bulan Ini (MTD) */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Omset Bulan Ini</span>
                            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                                <BarChart3 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.mtd_revenue)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            {kpis.growth_pct >= 0 ? (
                                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                                    <TrendingUp className="h-3 w-3 mr-0.5" />
                                    +{kpis.growth_pct}%
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-[11px] font-semibold text-rose-600">
                                    <TrendingDown className="h-3 w-3 mr-0.5" />
                                    {kpis.growth_pct}%
                                </span>
                            )}
                            <span className="text-[10px] text-slate-400">vs bulan lalu</span>
                        </div>
                    </div>

                    {/* 3. Estimasi Laba Kotor */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Est. Laba Kotor</span>
                            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                                <Award className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.estimated_gross_profit)}
                        </p>
                        <p className="text-[11px] font-medium text-amber-700 mt-1">
                            Margin: <span className="font-bold">{kpis.gross_margin_pct}%</span>
                        </p>
                    </div>

                    {/* 4. Kas & Bank Likuid */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kas &amp; Bank</span>
                            <div className="p-1.5 rounded-md bg-teal-50 text-teal-600">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.cash_bank_balance)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Akun 1010 Kas + 1020 Bank
                        </p>
                    </div>

                    {/* 5. Piutang Usaha (Open AR) */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Piutang (AR)</span>
                            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.open_ar)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Tagihan Pelanggan Terbuka
                        </p>
                    </div>

                    {/* 6. Utang Usaha (Open AP) */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Utang (AP)</span>
                            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
                                <ArrowDownLeft className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatRp(kpis.open_ap)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Kewajiban Tagihan Vendor
                        </p>
                    </div>
                </div>

                {/* Priority Section: Pending Discount Approvals Action Hub */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-500 text-white shadow-xs">
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Pusat Persetujuan Diskon Penjualan (&gt; 10%)
                                    </h2>
                                    {pendingApprovals.length > 0 ? (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                                            {pendingApprovals.length} Butuh Approval
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Semua Disetujui
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Kebijakan Perusahaan: Sales hanya berhak memberikan diskon maks 10%. Diskon di atas 10% wajib disetujui Owner sebelum dapat dikonfirmasi menjadi Sales Order.
                                </p>
                            </div>
                        </div>

                        {pendingApprovals.length > 0 && (
                            <Link
                                href={route('owner.approvals.discounts')}
                                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition shrink-0"
                            >
                                <span>Lihat Semua Antrian</span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>

                    {pendingApprovals.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                Tidak Ada Antrian Persetujuan Diskon
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                Semua penawaran saat ini berada di bawah batas 10% atau telah mendapatkan persetujuan Owner.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">No. Penawaran</th>
                                        <th className="px-4 py-3">Pelanggan</th>
                                        <th className="px-4 py-3">Salesperson</th>
                                        <th className="px-4 py-3 text-center">Diskon Diminta</th>
                                        <th className="px-4 py-3 text-right">Total Normal</th>
                                        <th className="px-4 py-3 text-right">Potongan Diskon</th>
                                        <th className="px-4 py-3 text-right">Total Akhir</th>
                                        <th className="px-4 py-3 text-center">Tindakan Owner</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingApprovals.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                <Link
                                                    href={route('sales.orders.show', order.id)}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
                                                >
                                                    <span>{order.id}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-900">{order.customer_name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    Limit: {formatRp(order.customer_credit_limit)} | AR: {formatRp(order.customer_open_ar)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {order.salesperson_name}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200">
                                                    {order.max_discount_pct}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-500">
                                                {formatRp(order.total_undiscounted)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">
                                                -{formatRp(order.discount_savings)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                {formatRp(order.grand_total)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setApprovalModal({ open: true, order })}
                                                        className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                                                    >
                                                        Setujui
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectModal({ open: true, order, reason: '', adjustedDiscount: 10 })}
                                                        className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-2xs"
                                                    >
                                                        Tolak / Sesuaikan
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Grid 2 Columns: Omnichannel Breakdown & Sales Team Performance vs Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Omnichannel Breakdown & Sales Leaderboard */}
                    <div className="space-y-6">
                        {/* Omnichannel Channel Breakdown */}
                        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
                                <span className="flex items-center gap-2">
                                    <Store className="h-4 w-4 text-slate-600" />
                                    Komposisi Kanal Penjualan (Omnichannel MTD)
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                    Total: {formatRp(channels.total_omset)}
                                </span>
                            </h2>

                            <div className="mt-4 space-y-4">
                                {/* Visual Progress Bar */}
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                    <div
                                        style={{ width: `${channels.retail_pos.share_pct}%` }}
                                        className="bg-rose-500 h-full transition-all"
                                        title={`Retail POS: ${channels.retail_pos.share_pct}%`}
                                    ></div>
                                    <div
                                        style={{ width: `${channels.wholesale_so.share_pct}%` }}
                                        className="bg-indigo-600 h-full transition-all"
                                        title={`B2B Wholesale: ${channels.wholesale_so.share_pct}%`}
                                    ></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                                                <Store className="h-3.5 w-3.5" /> Retail POS Kasir
                                            </span>
                                            <span className="text-xs font-bold text-rose-700">
                                                {channels.retail_pos.share_pct}%
                                            </span>
                                        </div>
                                        <p className="text-base font-bold text-slate-900 mt-2">
                                            {formatRp(channels.retail_pos.omset)}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {channels.retail_pos.orders_count} transaksi toko
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
                                                <ShoppingCart className="h-3.5 w-3.5" /> B2B Wholesale SO
                                            </span>
                                            <span className="text-xs font-bold text-indigo-700">
                                                {channels.wholesale_so.share_pct}%
                                            </span>
                                        </div>
                                        <p className="text-base font-bold text-slate-900 mt-2">
                                            {formatRp(channels.wholesale_so.omset)}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {channels.wholesale_so.orders_count} pesanan grosir
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Team Performance & Average Discount */}
                        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
                                <span className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-slate-600" />
                                    Kinerja Sales &amp; Rata-rata Diskon Diberikan
                                </span>
                                <span className="text-xs text-slate-400">Monitoring Disiplin Margin</span>
                            </h2>

                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5">Nama Sales</th>
                                            <th className="px-3 py-2.5 text-center">Jumlah Order</th>
                                            <th className="px-3 py-2.5 text-right">Total Omset</th>
                                            <th className="px-3 py-2.5 text-center">Rata-rata Diskon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {salesTeam.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                                                    Belum ada data penjualan oleh sales.
                                                </td>
                                            </tr>
                                        ) : (
                                            salesTeam.map((rep, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition">
                                                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                                                        {rep.name}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-slate-700">
                                                        {rep.orders_count}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                                                        {formatRp(rep.total_omset)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span
                                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                rep.avg_discount_pct > 8
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                        >
                                                            {rep.avg_discount_pct}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Top Selling Products */}
                    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs flex flex-col">
                        <h2 className="text-sm font-semibold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
                            <span className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-slate-600" />
                                Top 5 Produk Terlaris (Kontribusi Omset)
                            </span>
                            <span className="text-xs text-slate-400">B2B Wholesale</span>
                        </h2>

                        <div className="mt-3 flex-1 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Produk &amp; SKU</th>
                                        <th className="px-3 py-2.5 text-center">Qty Terjual</th>
                                        <th className="px-3 py-2.5 text-right">Total Kontribusi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                                                Belum ada data penjualan produk terkonfirmasi.
                                            </td>
                                        </tr>
                                    ) : (
                                        topProducts.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition">
                                                <td className="px-3 py-3">
                                                    <p className="font-semibold text-slate-900">{p.name}</p>
                                                    <p className="text-[11px] text-slate-500 font-mono">{p.variant_sku}</p>
                                                </td>
                                                <td className="px-3 py-3 text-center font-bold text-slate-800">
                                                    {p.qty_sold} pcs
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(p.total_revenue)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>
                                Data peringkat produk otomatis diperbarui secara realtime setiap kali Sales Order dikonfirmasi atau divalidasi.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Setujui Diskon */}
            {approvalModal.open && approvalModal.order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Setujui Pengajuan Diskon &gt; 10%
                            </h3>
                            <button
                                type="button"
                                onClick={() => setApprovalModal({ open: false, order: null })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                            <p>
                                Anda akan menyetujui pengajuan diskon sebesar{' '}
                                <span className="font-bold text-rose-600">
                                    {approvalModal.order.max_discount_pct}%
                                </span>{' '}
                                untuk penawaran{' '}
                                <span className="font-bold text-slate-900">{approvalModal.order.id}</span>{' '}
                                ({approvalModal.order.customer_name}).
                            </p>
                            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1 font-mono text-xs">
                                <div className="flex justify-between">
                                    <span>Total Normal:</span>
                                    <span>{formatRp(approvalModal.order.total_undiscounted)}</span>
                                </div>
                                <div className="flex justify-between text-rose-600 font-semibold">
                                    <span>Potongan Diskon:</span>
                                    <span>-{formatRp(approvalModal.order.discount_savings)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                                    <span>Total Disetujui:</span>
                                    <span>{formatRp(approvalModal.order.grand_total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setApprovalModal({ open: false, order: null })}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleApprove}
                                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {processing ? 'Memproses...' : 'Ya, Setujui Diskon'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Tolak Diskon */}
            {rejectModal.open && rejectModal.order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                                Tolak / Sesuaikan Diskon
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRejectModal({ open: false, order: null, reason: '', adjustedDiscount: 10 })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-700">
                            <p>
                                Pengajuan diskon sebesar{' '}
                                <span className="font-bold text-rose-600">{rejectModal.order.max_discount_pct}%</span>{' '}
                                pada order <span className="font-bold">{rejectModal.order.id}</span> akan ditolak dan disesuaikan kembali ke batas maksimum yang diizinkan.
                            </p>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Sesuaikan Diskon Maksimum Menjadi (%):
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="1"
                                    value={rejectModal.adjustedDiscount}
                                    onChange={(e) => setRejectModal({ ...rejectModal, adjustedDiscount: parseFloat(e.target.value) || 0 })}
                                    className="w-full rounded border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Maksimal 10% (sesuai kewenangan standar sales tanpa persetujuan).
                                </p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Alasan Penolakan (Catatan untuk Sales):
                                </label>
                                <textarea
                                    rows={2}
                                    value={rejectModal.reason}
                                    onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                    placeholder="Contoh: Margin terlalu tipis untuk kuantitas pesanan ini."
                                    className="w-full rounded border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRejectModal({ open: false, order: null, reason: '', adjustedDiscount: 10 })}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleReject}
                                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                            >
                                {processing ? 'Memproses...' : 'Tolak & Sesuaikan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

