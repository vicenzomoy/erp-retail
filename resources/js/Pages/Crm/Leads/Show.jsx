import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Users,
    FileText,
    ArrowLeft,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Building2,
    Mail,
    Phone,
    Package,
    Calendar,
    Clock,
    DollarSign,
    Save,
    RotateCcw,
    Sparkles,
    ShieldAlert,
    ExternalLink,
} from 'lucide-react';
import CrmLayout from '@/Layouts/CrmLayout';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const CRM_STAGES = [
    { key: 'new', label: 'Baru' },
    { key: 'qualified', label: 'Terkualifikasi' },
    { key: 'proposition', label: 'Peluang / Proposal' },
    { key: 'won', label: 'Menang' },
];

export default function LeadShow({ lead, customers = [], products = [], users = [], auditLogs = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showLostModal, setShowLostModal] = useState(false);
    const [lostReason, setLostReason] = useState('');

    const { data, setData, put, processing, errors, reset } = useForm({
        customer_id: lead.customer_id,
        contact_name: lead.contact_name || '',
        variant_sku: lead.variant_sku || '',
        qty_interest: lead.qty_interest || 1,
        expected_revenue: lead.expected_revenue || 0,
        assigned_user_id: lead.assigned_user_id || '',
    });

    const handleProductChange = (sku) => {
        const product = products.find((p) => p.variant_sku === sku);
        const price = product ? product.sales_price : 0;
        const total = price * (data.qty_interest || 1);

        setData((prev) => ({
            ...prev,
            variant_sku: sku,
            expected_revenue: total,
        }));
    };

    const handleQtyChange = (qty) => {
        const numQty = parseFloat(qty) || 0;
        const product = products.find((p) => p.variant_sku === data.variant_sku);
        const price = product ? product.sales_price : (lead.product_price || 0);
        const total = price * numQty;

        setData((prev) => ({
            ...prev,
            qty_interest: numQty,
            expected_revenue: total,
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        put(route('crm.leads.update', lead.id), {
            onSuccess: () => setIsEditing(false),
        });
    };

    // Actions
    const handleConvert = () => {
        if (confirm(`Konversi Lead ${lead.id} menjadi Opportunity?`)) {
            router.post(route('crm.leads.convert', lead.id));
        }
    };

    const handleCreateQuotation = () => {
        router.post(route('crm.leads.create-quotation', lead.id));
    };

    const handleMarkWon = () => {
        router.post(route('crm.leads.won', lead.id));
    };

    const handleMarkLost = (e) => {
        e.preventDefault();
        router.post(route('crm.leads.lost', lead.id), { reason: lostReason }, {
            onSuccess: () => setShowLostModal(false),
        });
    };

    const firstQuotationId = lead.quotations?.[0]?.id;

    return (
        <CrmLayout
            title={`Prospek ${lead.id}`}
            breadcrumbs={[
                { label: 'Pipeline', href: route('crm.pipeline') },
                { label: lead.id },
            ]}
        >
            <Head title={`${lead.id} - ${lead.customer_name}`} />

            {/* ── Top Bar: Back & Actions ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('crm.pipeline')}
                        className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 font-mono">{lead.id}</h1>
                            <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    lead.type === 'opportunity'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                            >
                                {lead.type}
                            </span>
                            {lead.stage === 'lost' && (
                                <span className="rounded bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 text-[10px] font-bold">
                                    Kalah / Lost
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {lead.customer_name} ({lead.customer_id})
                        </p>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* T-09: Convert to Opportunity button */}
                    {lead.type === 'lead' && (
                        <button
                            type="button"
                            onClick={handleConvert}
                            className="inline-flex items-center gap-1.5 rounded bg-sky-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-600 transition"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Konversi ke Opportunity (T-09)
                        </button>
                    )}

                    {/* T-10: Create Quotation button */}
                    <button
                        type="button"
                        onClick={handleCreateQuotation}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Buat Penawaran / Quotation (T-10)
                    </button>

                    {/* Won button */}
                    {lead.stage !== 'won' && (
                        <button
                            type="button"
                            onClick={handleMarkWon}
                            className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Menang (Won)
                        </button>
                    )}

                    {/* Lost button */}
                    {lead.stage !== 'lost' && (
                        <button
                            type="button"
                            onClick={() => setShowLostModal(true)}
                            className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition shadow-2xs"
                        >
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            Kalah (Lost)
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Sheet (Odoo 17 Form Sheet) ── */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs mb-6">
                {/* Sheet Top: Smart Buttons (Right) & Status Bar */}
                <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                    {/* Status Pipe */}
                    <div>
                        <OdooStatusBar
                            status={lead.stage === 'opportunity' ? 'proposition' : lead.stage}
                            stages={CRM_STAGES}
                        />
                    </div>

                    {/* Smart Buttons */}
                    <div className="flex items-center gap-2">
                        <OdooSmartButton
                            icon={FileText}
                            count={lead.quotations?.length ?? 0}
                            label="Penawaran (SO)"
                            href={firstQuotationId ? route('sales.orders.show', firstQuotationId) : null}
                            active={lead.quotations?.length > 0}
                        />
                    </div>
                </div>

                {/* Form Content / View */}
                {!isEditing ? (
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Detail Peluang &amp; Prospek
                                </span>
                                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                                    {lead.contact_name || lead.customer_name}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                            >
                                Edit Data
                            </button>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Pelanggan</span>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        <Link
                                            href={route('sales.customers.show', lead.customer_id)}
                                            className="text-sky-700 hover:underline font-bold"
                                        >
                                            {lead.customer_name} ({lead.customer_id})
                                        </Link>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 block mb-0.5">Kontak Person</span>
                                    <div className="font-medium text-slate-800">
                                        {lead.contact_name || '—'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 block mb-0.5">Peminatan Produk / SKU</span>
                                    <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                        <Package className="h-4 w-4 text-slate-400" />
                                        <span>
                                            {lead.qty_interest}x{' '}
                                            <span className="font-bold">{lead.variant_sku}</span> — {lead.product_name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Estimasi Pendapatan (Expected Revenue)</span>
                                    <div className="text-xl font-bold text-sky-950 tabular-nums">
                                        {formatRp(lead.expected_revenue)}
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {lead.qty_interest} unit × {formatRp(lead.product_price)}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 block mb-0.5">Sales Person Ditugaskan</span>
                                    <div className="font-semibold text-slate-800">
                                        {lead.assigned_name}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 block mb-0.5">Riwayat Waktu</span>
                                    <div className="text-[11px] text-slate-500 space-y-0.5">
                                        <div>Dibuat: {lead.created_at} oleh {lead.created_by_name}</div>
                                        {lead.converted_at && (
                                            <div className="text-sky-700 font-medium">
                                                Dikonversi ke Opportunity: {lead.converted_at}
                                            </div>
                                        )}
                                        {lead.won_at && (
                                            <div className="text-emerald-700 font-medium">
                                                Dimenangkan (Won): {lead.won_at}
                                            </div>
                                        )}
                                        {lead.lost_at && (
                                            <div className="text-rose-700 font-medium">
                                                Hilang (Lost): {lead.lost_at}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Edit Form */
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-900">Ubah Data Prospek</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setIsEditing(false);
                                    }}
                                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 transition disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Pelanggan</label>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                >
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Kontak Person</label>
                                <input
                                    type="text"
                                    value={data.contact_name}
                                    onChange={(e) => setData('contact_name', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Produk Peminatan</label>
                                <select
                                    value={data.variant_sku}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {products.map((p) => (
                                        <option key={p.variant_sku} value={p.variant_sku}>
                                            {p.variant_sku} - {p.variant_name} ({formatRp(p.sales_price)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Jumlah Peminatan (Qty)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.qty_interest}
                                    onChange={(e) => handleQtyChange(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Expected Revenue (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.expected_revenue}
                                    onChange={(e) => setData('expected_revenue', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Sales Person</label>
                                <select
                                    value={data.assigned_user_id}
                                    onChange={(e) => setData('assigned_user_id', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                >
                                    <option value="">-- Belum Ditugaskan --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                )}

                {/* ── Linked Quotations / Sales Orders Section ── */}
                <div className="mt-8 border-t border-slate-200 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-700" />
                        Dokumen Penawaran Terkait (Quotation &amp; Sales Order)
                    </h3>

                    {lead.quotations && lead.quotations.length > 0 ? (
                        <div className="overflow-x-auto rounded border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5">No. Sales Order</th>
                                        <th className="px-4 py-2.5">Status</th>
                                        <th className="px-4 py-2.5 text-right">Grand Total</th>
                                        <th className="px-4 py-2.5">Tanggal Dibuat</th>
                                        <th className="px-4 py-2.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lead.quotations.map((quo) => (
                                        <tr key={quo.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                                {quo.id}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        quo.status === 'confirmed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : quo.status === 'done'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {quo.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                                                {formatRp(quo.grand_total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-500">
                                                {quo.created_at}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Link
                                                    href={route('sales.orders.show', quo.id)}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 transition"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Buka Order
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                            Belum ada penawaran harga (Quotation) yang dibuat untuk prospek ini.
                            Gunakan tombol <strong>"Buat Penawaran / Quotation"</strong> di atas.
                        </div>
                    )}
                </div>

                {/* ── Audit Trail / Log Notes Section (Chatter Odoo) ── */}
                <div className="mt-8 border-t border-slate-200 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        Log Aktivitas &amp; Audit Jejak (Chatter)
                    </h3>

                    {auditLogs && auditLogs.length > 0 ? (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-2.5 rounded border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                                >
                                    <div className="rounded-full bg-slate-200 p-1 text-slate-600 mt-0.5">
                                        <CheckCircle2 className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800 font-mono text-[11px]">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-[11px] mt-0.5">{log.notes}</p>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            Aktor: <span className="font-semibold text-slate-600">{log.actor_username}</span> ({log.actor_role})
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400">Belum ada riwayat aktivitas tercatat.</p>
                    )}
                </div>
            </div>

            {/* ── Modal Tandai Kalah (Lost) ── */}
            {showLostModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200 text-xs">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-rose-600" />
                            Tandai Prospek Sebagai Kalah (Lost)
                        </h3>
                        <p className="text-slate-500 mb-3 text-xs">
                            Masukkan alasan mengapa prospek {lead.id} tidak berhasil ditutup atau dibatalkan.
                        </p>
                        <form onSubmit={handleMarkLost}>
                            <textarea
                                required
                                rows="3"
                                value={lostReason}
                                onChange={(e) => setLostReason(e.target.value)}
                                placeholder="Contoh: Harga kompetitor lebih murah, anggaran klien ditunda..."
                                className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:bg-white focus:outline-none mb-3"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLostModal(false)}
                                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                                >
                                    Konfirmasi Kalah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CrmLayout>
    );
}

