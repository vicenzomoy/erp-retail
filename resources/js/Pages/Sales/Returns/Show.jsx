import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SalesLayout from '@/Layouts/SalesLayout';
import {
    ArrowLeft,
    RotateCcw,
    CheckCircle2,
    Clock,
    FileText,
    ReceiptText,
    Warehouse,
    AlertCircle,
    User,
    Calendar,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Show({ customerReturn }) {
    const steps = [
        { key: 'pending_inspection', label: '1. Diajukan Sales' },
        { key: 'inspected', label: '2. QC Gudang Selesai' },
        { key: 'completed', label: '3. Credit Note Selesai' },
    ];

    const currentStepIndex =
        customerReturn.status === 'completed'
            ? 2
            : customerReturn.status === 'inspected'
            ? 1
            : 0;

    return (
        <SalesLayout
            title={`Retur ${customerReturn.id}`}
            breadcrumbs={[
                { label: 'Penjualan', href: route('sales.orders.index') },
                { label: 'Retur Pelanggan', href: route('sales.returns.index') },
                { label: customerReturn.id },
            ]}
        >
            <Head title={`Retur ${customerReturn.id} — Bara Wear`} />

            <div className="space-y-4 max-w-5xl mx-auto">
                {/* Top Action Bar with Smart Buttons & Status Pipe */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('sales.returns.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Daftar Retur
                        </Link>

                        {/* Smart Button ke Customer Invoice */}
                        <Link
                            href={route('accounting.invoices.show', customerReturn.customer_invoice_id)}
                            className="inline-flex items-center gap-1.5 rounded border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                        >
                            <FileText className="h-3.5 w-3.5 text-teal-600" />
                            <span>Faktur: {customerReturn.customer_invoice_id}</span>
                        </Link>

                        {/* Smart Button ke Credit Note jika sudah dibuat */}
                        {customerReturn.credit_note_id && (
                            <Link
                                href={route('accounting.credit-notes.show', customerReturn.credit_note_id)}
                                className="inline-flex items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition"
                            >
                                <ReceiptText className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Credit Note: {customerReturn.credit_note_id}</span>
                            </Link>
                        )}
                    </div>

                    {/* Odoo Status Pipeline */}
                    <div className="flex items-center gap-1 text-xs font-semibold">
                        {steps.map((st, idx) => (
                            <div
                                key={st.key}
                                className={`flex items-center px-2.5 py-1 rounded-sm text-[11px] ${
                                    idx === currentStepIndex
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : idx < currentStepIndex
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                <span>{st.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                <div className="rounded border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Dokumen Retur Pelanggan
                            </span>
                            <h2 className="text-2xl font-bold font-mono text-slate-900">
                                {customerReturn.id}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Diajukan oleh: <span className="font-semibold text-slate-700">{customerReturn.sales_user_name}</span> pada {customerReturn.created_at}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Batas SOP: {customerReturn.days_since_invoice} Hari (Aman ≤ 14 Hari)
                            </span>
                        </div>
                    </div>

                    {/* Key Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Pelanggan</span>
                            <span className="font-bold text-slate-800 text-sm">{customerReturn.customer_name}</span>
                            <span className="text-[11px] text-slate-500 block">ID: {customerReturn.customer_id}</span>
                        </div>

                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Faktur &amp; Sales Order</span>
                            <span className="font-mono font-bold text-slate-800 block">{customerReturn.customer_invoice_id}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">SO: {customerReturn.sales_order_id || '-'}</span>
                        </div>

                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Status Return Inspection</span>
                            {customerReturn.inspected_by_name ? (
                                <>
                                    <span className="font-semibold text-emerald-700 block">
                                        Diperiksa oleh {customerReturn.inspected_by_name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block">{customerReturn.inspected_at}</span>
                                </>
                            ) : (
                                <span className="font-semibold text-amber-700 block">
                                    Menunggu Pengecekan Fisik oleh Gudang
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Reason & Inspection Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="rounded border border-slate-200 p-3 bg-white space-y-1">
                            <span className="font-bold text-slate-700 block">Alasan Retur (Sales):</span>
                            <p className="text-slate-600 leading-relaxed italic">{customerReturn.reason}</p>
                        </div>

                        <div className="rounded border border-slate-200 p-3 bg-white space-y-1">
                            <span className="font-bold text-slate-700 block">Catatan Pemeriksaan Gudang:</span>
                            <p className="text-slate-600 leading-relaxed">
                                {customerReturn.inspection_notes || 'Gudang belum menyelesaikan inspeksi fisik barang retur.'}
                            </p>
                        </div>
                    </div>

                    {/* Return Lines Table */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Rincian Barang Yang Diretur
                        </h3>

                        <div className="overflow-hidden rounded border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5">SKU</th>
                                        <th className="px-4 py-2.5">Nama Produk</th>
                                        <th className="px-4 py-2.5 text-center">Ukuran / Warna</th>
                                        <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                        <th className="px-4 py-2.5 text-center">Diajukan</th>
                                        <th className="px-4 py-2.5 text-center">Diterima Gudang</th>
                                        <th className="px-4 py-2.5 text-center">Kondisi Cacat</th>
                                        <th className="px-4 py-2.5">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customerReturn.lines.map((l) => (
                                        <tr key={l.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                                {l.variant_sku}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                {l.product_name}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600">
                                                {l.size || '-'} / {l.color || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                {formatRp(l.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-900">
                                                {l.qty_requested} pcs
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-700">
                                                {l.qty_accepted} pcs
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-rose-600">
                                                {l.qty_damaged} pcs
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 italic">
                                                {l.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </SalesLayout>
    );
}

