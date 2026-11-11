import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import {
    Percent,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
    Clock,
    User,
    Building2,
    ChevronRight,
    Search,
    History,
    X,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function DiscountApprovals({
    pendingApprovals = [],
    history = [],
}) {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [approvalModal, setApprovalModal] = useState({ open: false, order: null, notes: '' });
    const [rejectModal, setRejectModal] = useState({ open: false, order: null, reason: '', adjustedDiscount: 10 });
    const [processing, setProcessing] = useState(false);

    const filteredPending = pendingApprovals.filter((order) => {
        const query = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(query) ||
            order.customer_name.toLowerCase().includes(query) ||
            order.salesperson_name.toLowerCase().includes(query)
        );
    });

    const filteredHistory = history.filter((item) => {
        const query = searchTerm.toLowerCase();
        return (
            item.id.toLowerCase().includes(query) ||
            item.customer_name.toLowerCase().includes(query) ||
            item.salesperson_name.toLowerCase().includes(query)
        );
    });

    const handleApprove = () => {
        if (!approvalModal.order) return;
        setProcessing(true);
        router.post(
            route('owner.approvals.discounts.approve', approvalModal.order.id),
            { notes: approvalModal.notes },
            {
                onFinish: () => {
                    setProcessing(false);
                    setApprovalModal({ open: false, order: null, notes: '' });
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
            title="Persetujuan Diskon"
            pendingCount={pendingApprovals.length}
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Persetujuan Diskon' },
            ]}
        >
            <Head title="Persetujuan Diskon Penjualan - PT Bara Ritel Nusantara" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            Persetujuan Diskon Penjualan
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Batas Sales: Maks 10%
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Sesuai SOP Perusahaan, setiap diskon yang melampaui 10% (baik tingkat order maupun per baris produk) wajib ditinjau dan disetujui langsung oleh Owner.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari order, pelanggan, sales..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${activeTab === 'pending'
                                ? 'border-slate-900 text-slate-900 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Menunggu Persetujuan</span>
                        {pendingApprovals.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                {pendingApprovals.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${activeTab === 'history'
                                ? 'border-slate-900 text-slate-900 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <History className="h-4 w-4" />
                        <span>Riwayat Persetujuan</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                            {history.length}
                        </span>
                    </button>
                </div>

                {/* Tab Content: Pending */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {filteredPending.length === 0 ? (
                            <div className="bg-white rounded-lg p-12 text-center border border-slate-200 shadow-xs">
                                <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Tidak Ada Pengajuan Diskon Menunggu Persetujuan
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                    Semua dokumen penawaran saat ini telah disetujui atau berada dalam batas kewenangan sales (maksimal 10%).
                                </p>
                            </div>
                        ) : (
                            filteredPending.map((order) => {
                                const headroom = order.customer_credit_limit - order.customer_open_ar;
                                return (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden hover:border-slate-300 transition"
                                    >
                                        {/* Card Top Banner */}
                                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-rose-100 text-rose-700 font-bold text-sm">
                                                    {order.max_discount_pct}%
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('sales.orders.show', order.id)}
                                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
                                                        >
                                                            <span>{order.id}</span>
                                                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                                        </Link>
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                            Draft Quotation
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3 text-slate-400" />
                                                            Pelanggan: <strong className="text-slate-900">{order.customer_name}</strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                            Diajukan oleh: <strong className="text-slate-900">{order.salesperson_name}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setApprovalModal({ open: true, order, notes: '' })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span>Setujui Diskon</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRejectModal({
                                                            open: true,
                                                            order,
                                                            reason: '',
                                                            adjustedDiscount: 10,
                                                        })
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition cursor-pointer"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    <span>Tolak / Sesuaikan</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Items Table with high discount */}
                                            <div className="lg:col-span-2 space-y-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Item Penawaran dengan Diskon Di Atas 10%
                                                </h4>
                                                <div className="overflow-x-auto border border-slate-200 rounded-md">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                                            <tr>
                                                                <th className="px-3 py-2">SKU &amp; Produk</th>
                                                                <th className="px-3 py-2 text-center">Qty</th>
                                                                <th className="px-3 py-2 text-right">Harga Satuan</th>
                                                                <th className="px-3 py-2 text-center">Diskon Diminta</th>
                                                                <th className="px-3 py-2 text-right">Subtotal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {order.high_discount_lines.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-3 py-2 text-slate-500 italic">
                                                                        Diskon berlaku di level dokumen order ({order.order_discount_pct}%).
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                order.high_discount_lines.map((line, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50">
                                                                        <td className="px-3 py-2">
                                                                            <span className="font-semibold text-slate-900">
                                                                                {line.product_name}
                                                                            </span>
                                                                            <span className="block text-[10px] text-slate-500 font-mono">
                                                                                {line.variant_sku}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center font-bold text-slate-800">
                                                                            {line.qty_ordered}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                                                                            {formatRp(line.unit_price)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                                                                                {line.discount_pct}%
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                                            {formatRp(line.line_total)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {order.notes && (
                                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
                                                        <span className="font-semibold text-slate-900">Catatan Sales:</span> {order.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Financial Impact & Credit Risk */}
                                            <div className="space-y-4 bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-xs">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                        Dampak Finansial Order
                                                    </h4>
                                                    <div className="space-y-1.5 font-mono">
                                                        <div className="flex justify-between text-slate-600">
                                                            <span>Total Normal:</span>
                                                            <span>{formatRp(order.total_undiscounted)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-rose-600 font-semibold">
                                                            <span>Potongan Diskon:</span>
                                                            <span>-{formatRp(order.discount_savings)}</span>
                                                        </div>
                                                        <div className="flex justify-between font-bold text-slate-900 text-sm pt-1.5 border-t border-slate-200">
                                                            <span>Nilai Akhir Order:</span>
                                                            <span className="text-slate-900">{formatRp(order.grand_total)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200">
                                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                                        Status Kredit Pelanggan
                                                    </h4>
                                                    <div className="space-y-1 text-[11px]">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Credit Limit:</span>
                                                            <span className="font-semibold text-slate-800">{formatRp(order.customer_credit_limit)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Piutang Terbuka (AR):</span>
                                                            <span className="font-semibold text-rose-600">{formatRp(order.customer_open_ar)}</span>
                                                        </div>
                                                        <div className="flex justify-between font-semibold">
                                                            <span className="text-slate-500">Sisa Plafon Kredit:</span>
                                                            <span className={headroom >= 0 ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
                                                                {formatRp(headroom)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Tab Content: History */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Riwayat Penawaran yang Telah Disetujui Owner
                            </h3>
                            <span className="text-xs text-slate-400">Total {filteredHistory.length} transaksi</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">No. Penawaran</th>
                                        <th className="px-4 py-3">Status Dokumen</th>
                                        <th className="px-4 py-3">Pelanggan</th>
                                        <th className="px-4 py-3">Salesperson</th>
                                        <th className="px-4 py-3">Disetujui Oleh</th>
                                        <th className="px-4 py-3">Waktu Persetujuan</th>
                                        <th className="px-4 py-3 text-right">Nilai Akhir Order</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                Belum ada riwayat persetujuan diskon.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    <Link
                                                        href={route('sales.orders.show', item.id)}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono"
                                                    >
                                                        <span>{item.id}</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${item.status === 'confirmed'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : item.status === 'done'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-slate-100 text-slate-800'
                                                            }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {item.customer_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {item.salesperson_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-800 font-semibold">
                                                    {item.approved_by_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {item.approved_at
                                                        ? new Date(item.approved_at).toLocaleString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(item.grand_total)}
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
                                onClick={() => setApprovalModal({ open: false, order: null, notes: '' })}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-700">
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

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Catatan Persetujuan Owner (Opsional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={approvalModal.notes}
                                    onChange={(e) => setApprovalModal({ ...approvalModal, notes: e.target.value })}
                                    placeholder="Contoh: Disetujui khusus untuk promo kemitraan Q4."
                                    className="w-full rounded border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setApprovalModal({ open: false, order: null, notes: '' })}
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
                                pada order <span className="font-bold">{rejectModal.order.id}</span> akan ditolak dan disesuaikan kembali.
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

