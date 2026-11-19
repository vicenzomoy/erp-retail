import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Building2,
    User,
    Clock,
    Search,
    History,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

const emptyApprove = { open: false, order: null, notes: '' };
const emptyReject = { open: false, order: null, reason: '' };

export default function PurchaseApprovalsIndex({
    pendingApprovals = [],
    history = [],
    threshold = 5000000,
    canApprove = false,
}) {
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [expanded, setExpanded] = useState({});
    const [approveModal, setApproveModal] = useState(emptyApprove);
    const [rejectModal, setRejectModal] = useState(emptyReject);
    const [rejectError, setRejectError] = useState('');
    const [processing, setProcessing] = useState(false);

    const query = searchTerm.toLowerCase();
    const matches = (item) =>
        item.id.toLowerCase().includes(query) ||
        (item.vendor_name || '').toLowerCase().includes(query) ||
        (item.requested_by || '').toLowerCase().includes(query);

    const filteredPending = pendingApprovals.filter(matches);
    const filteredHistory = history.filter(matches);
    const totalPendingValue = pendingApprovals.reduce((sum, po) => sum + po.grand_total, 0);

    const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleApprove = () => {
        if (!approveModal.order) return;
        setProcessing(true);
        router.post(
            route('accounting.purchase-approvals.approve', approveModal.order.id),
            { notes: approveModal.notes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setApproveModal(emptyApprove);
                },
            }
        );
    };

    const handleReject = () => {
        if (!rejectModal.order) return;
        if (rejectModal.reason.trim().length < 5) {
            setRejectError('Alasan penolakan minimal 5 karakter.');
            return;
        }
        setProcessing(true);
        router.post(
            route('accounting.purchase-approvals.reject', rejectModal.order.id),
            { reason: rejectModal.reason },
            {
                preserveScroll: true,
                onSuccess: () => setRejectModal(emptyReject),
                onError: (errors) => setRejectError(errors.reason || 'Gagal menolak pengajuan.'),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AccountingLayout
            title="Persetujuan Purchase Order"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Persetujuan PO' },
            ]}
        >
            <Head title="Persetujuan Purchase Order — Bara Wear" />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
                            Persetujuan Purchase Order
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Batas tanpa persetujuan: {formatRp(threshold)}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                            PO dengan total (termasuk PPN) di atas {formatRp(threshold)} wajib disetujui Finance sebelum
                            dikonfirmasi. Setelah disetujui, PO langsung berstatus Confirmed dan dokumen penerimaan gudang
                            disiapkan. Jika ditolak, PO kembali ke Draft beserta alasannya.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari PO, vendor, pengaju..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                        />
                    </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`rounded-lg border p-4 shadow-xs ${pendingApprovals.length > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menunggu Persetujuan</p>
                        <p className="text-2xl font-black text-amber-700 mt-1">{pendingApprovals.length} PO</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Nilai Diajukan</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{formatRp(totalPendingValue)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Keputusan Terakhir</p>
                        <p className="text-xs text-slate-700 mt-2">
                            {history.length > 0
                                ? `${history[0].id} ${history[0].decision === 'approved' ? 'disetujui' : 'ditolak'} oleh ${history[0].decided_by || '-'} (${history[0].decided_at})`
                                : 'Belum ada keputusan.'}
                        </p>
                    </div>
                </div>

                {!canApprove && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Mode baca saja: hanya Finance dan Owner yang dapat menyetujui atau menolak pengajuan.
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
                            activeTab === 'pending'
                                ? 'border-slate-900 text-slate-900 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Menunggu Persetujuan</span>
                        {pendingApprovals.length > 0 && (
                            <span className="px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                {pendingApprovals.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
                            activeTab === 'history'
                                ? 'border-slate-900 text-slate-900 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <History className="h-4 w-4" />
                        <span>Riwayat Keputusan</span>
                        <span className="px-1.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">{history.length}</span>
                    </button>
                </div>

                {/* Pending */}
                {activeTab === 'pending' && (
                    <div className="space-y-3">
                        {filteredPending.length === 0 ? (
                            <div className="bg-white rounded-lg p-12 text-center border border-slate-200 shadow-xs">
                                <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Tidak Ada PO yang Menunggu Persetujuan
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Semua pengajuan pembelian sudah diproses.
                                </p>
                            </div>
                        ) : (
                            filteredPending.map((po) => {
                                const isOpen = expanded[po.id] ?? true;
                                return (
                                    <div key={po.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-bold font-mono text-slate-900">{po.id}</span>
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                        Menunggu Persetujuan
                                                    </span>
                                                    <span className="text-base font-black text-slate-900 font-mono">
                                                        {formatRp(po.grand_total)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3 text-slate-400" />
                                                        Vendor: <strong className="text-slate-900">{po.vendor_name}</strong>
                                                        {po.vendor_city && <span className="text-slate-400">({po.vendor_city})</span>}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-slate-400" />
                                                        Diajukan oleh: <strong className="text-slate-900">{po.requested_by || '-'}</strong>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        {po.requested_at} {po.waiting_for && <span className="text-slate-400">({po.waiting_for})</span>}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => toggle(po.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                                >
                                                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    Rincian
                                                </button>
                                                {canApprove && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setApproveModal({ open: true, order: po, notes: '' })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Setujui
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRejectError('');
                                                                setRejectModal({ open: true, order: po, reason: '' });
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition cursor-pointer"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Tolak
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                <div className="lg:col-span-2 space-y-2">
                                                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                                                <tr>
                                                                    <th className="px-3 py-2">Produk (SKU)</th>
                                                                    <th className="px-3 py-2 text-center">Qty</th>
                                                                    <th className="px-3 py-2 text-right">Harga Satuan</th>
                                                                    <th className="px-3 py-2 text-right">Total Baris</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {po.lines.map((l) => (
                                                                    <tr key={l.variant_sku}>
                                                                        <td className="px-3 py-2">
                                                                            <span className="font-semibold text-slate-900">{l.product_name}</span>
                                                                            <span className="block text-[10px] text-slate-500 font-mono">
                                                                                {l.variant_sku}
                                                                                {l.size && ` • ${l.size}`}
                                                                                {l.color && ` • ${l.color}`}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center font-bold text-slate-800">
                                                                            {l.qty_ordered} {l.unit}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                                                                            {formatRp(l.unit_price)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                                            {formatRp(l.line_total)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {po.notes && (
                                                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
                                                            <span className="font-semibold text-slate-900">Catatan Procurement:</span> {po.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-xs font-mono h-fit">
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>DPP:</span>
                                                        <span>{formatRp(po.subtotal_before_tax)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>PPN 11%:</span>
                                                        <span>{formatRp(po.total_tax)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-1.5 border-t border-slate-200">
                                                        <span>Total PO:</span>
                                                        <span>{formatRp(po.grand_total)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-500 pt-1.5 border-t border-slate-200 font-sans">
                                                        <span>Termin Pembayaran:</span>
                                                        <span className="font-mono font-semibold text-slate-800">{po.payment_terms}</span>
                                                    </div>
                                                    <div className="flex justify-between text-rose-700 font-sans">
                                                        <span>Melebihi batas sebesar:</span>
                                                        <span className="font-mono font-semibold">{formatRp(po.grand_total - threshold)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* History */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">No. PO</th>
                                        <th className="px-4 py-3">Keputusan</th>
                                        <th className="px-4 py-3">Vendor</th>
                                        <th className="px-4 py-3">Diajukan Oleh</th>
                                        <th className="px-4 py-3">Diputuskan Oleh</th>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Catatan / Alasan</th>
                                        <th className="px-4 py-3 text-right">Total PO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                                Belum ada riwayat persetujuan PO.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.id}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            item.decision === 'approved'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {item.decision === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{item.vendor_name}</td>
                                                <td className="px-4 py-3 text-slate-600">{item.requested_by || '-'}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{item.decided_by || '-'}</td>
                                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.decided_at}</td>
                                                <td className="px-4 py-3 text-slate-600 max-w-[260px]">{item.notes || '-'}</td>
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

            {/* Modal Setujui */}
            {approveModal.open && approveModal.order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Setujui {approveModal.order.id}?
                            </h3>
                            <button type="button" onClick={() => setApproveModal(emptyApprove)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-700">
                            <p>
                                PO ke <strong>{approveModal.order.vendor_name}</strong> senilai{' '}
                                <strong className="font-mono">{formatRp(approveModal.order.grand_total)}</strong> akan langsung
                                dikonfirmasi dan dokumen penerimaan gudang disiapkan.
                            </p>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Catatan Persetujuan (Opsional):
                                </label>
                                <textarea
                                    rows={2}
                                    value={approveModal.notes}
                                    onChange={(e) => setApproveModal({ ...approveModal, notes: e.target.value })}
                                    placeholder="Contoh: Sesuai anggaran restock bulan ini."
                                    className="w-full rounded border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setApproveModal(emptyApprove)}
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
                                {processing ? 'Memproses...' : 'Ya, Setujui PO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tolak */}
            {rejectModal.open && rejectModal.order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                                Tolak {rejectModal.order.id}?
                            </h3>
                            <button type="button" onClick={() => setRejectModal(emptyReject)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-700">
                            <p>PO akan dikembalikan ke Draft. Procurement akan melihat alasan penolakan di halaman PO.</p>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Alasan Penolakan (wajib):
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectModal.reason}
                                    onChange={(e) => {
                                        setRejectError('');
                                        setRejectModal({ ...rejectModal, reason: e.target.value });
                                    }}
                                    placeholder="Contoh: Anggaran pembelian bulan ini sudah habis, kurangi kuantitas."
                                    className={`w-full rounded text-xs focus:ring-slate-500 focus:border-slate-500 ${rejectError ? 'border-rose-400' : 'border-slate-300'}`}
                                />
                                {rejectError && <p className="text-[11px] text-rose-600 mt-1">{rejectError}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRejectModal(emptyReject)}
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
                                {processing ? 'Memproses...' : 'Tolak Pengajuan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AccountingLayout>
    );
}
