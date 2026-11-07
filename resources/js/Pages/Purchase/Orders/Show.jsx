import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    CheckCircle2,
    ShoppingBag,
    FileText,
    Truck,
    Receipt,
    Printer,
    DollarSign,
    Ban,
    AlertTriangle,
    ExternalLink,
    Building2,
    Calendar,
    Clock,
    Shield,
} from 'lucide-react';

export default function Show({
    order,
    receipts = [],
    vendorBills = [],
    relatedDocs = [],
    auditLogs = [],
}) {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const isRfq = order.status === 'rfq';
    const isConfirmed = order.status === 'confirmed';
    const isDone = order.status === 'done';
    const isCancelled = order.status === 'cancelled';

    // Status pipeline untuk OdooStatusBar (Draft -> Confirmed -> Done)
    const statusSteps = [
        { key: ['rfq', 'draft'], label: 'Draft' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'done', label: 'Done' },
    ];

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleConfirm = () => {
        router.post(route('purchase.orders.confirm', order.id));
    };

    const handleCreateBill = () => {
        router.post(route('purchase.orders.create-bill', order.id));
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        router.post(route('purchase.orders.cancel', order.id), {
            reason: cancelReason,
        }, {
            onSuccess: () => setCancelModalOpen(false),
        });
    };

    return (
        <PurchaseLayout
            title={`Pesanan Pembelian ${order.id}`}
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pesanan Pembelian', href: route('purchase.orders.index') },
                { label: order.id },
            ]}
        >
            <Head title={`PO ${order.id} — ${order.vendor_name} — Bara Wear`} />

            {/* Odoo Form Action Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.orders.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {/* Tombol Konfirmasi (jika RFQ) */}
                    {isRfq && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Konfirmasi Order (PO)
                        </button>
                    )}

                    {/* Tombol Terima Produk (jika Confirmed) */}
                    {isConfirmed && receipts.length > 0 && (
                        <Link
                            href={route('inventory.receipts.show', receipts[0].id)}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
                        >
                            <Truck className="h-4 w-4" />
                            Terima Produk ({receipts[0].id})
                        </Link>
                    )}

                    {/* Tombol Buat Tagihan (Three-Way Match) */}
                    {(isConfirmed || isDone) && (
                        <button
                            type="button"
                            onClick={handleCreateBill}
                            className="inline-flex items-center gap-1.5 rounded bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-800 transition cursor-pointer"
                            title="Buat Tagihan Vendor berdasarkan barang diterima (Three-Way Match)"
                        >
                            <Receipt className="h-4 w-4" />
                            Buat Tagihan (Bill)
                        </button>
                    )}

                    {/* Tombol Batalkan (jika belum done & belum cancelled) */}
                    {!isDone && !isCancelled && (
                        <button
                            type="button"
                            onClick={() => setCancelModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        >
                            <Ban className="h-3.5 w-3.5" />
                            Batalkan
                        </button>
                    )}

                    {/* Cetak PO */}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Cetak PDF
                    </button>
                </div>

                {/* Status Bar (Odoo Breadcrumbs Pipe) */}
                <div className="flex items-center gap-2">
                    {isCancelled ? (
                        <span className="rounded bg-rose-100 text-rose-800 font-bold px-3 py-1 text-xs border border-rose-300">
                            Dibatalkan (Cancelled)
                        </span>
                    ) : (
                        <OdooStatusBar
                            status={order.status}
                            stages={statusSteps}
                        />
                    )}
                </div>
            </div>

            {/* Form Sheet Card */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-6">
                {/* Top Section: Smart Buttons & Document Header */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b border-slate-200">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                            {isRfq ? 'Permintaan Penawaran (RFQ)' : 'Pesanan Pembelian (Purchase Order)'}
                        </span>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                            {order.id}
                            <OdooBadge status={order.status} />
                        </h1>
                        {order.source_doc_no && (
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Ref Dokumen: {order.source_doc_no}
                            </p>
                        )}
                    </div>

                    {/* Odoo Smart Buttons (Right Header) */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                        {/* Smart Button Receipts */}
                        <OdooSmartButton
                            icon={Truck}
                            count={receipts.length}
                            label="Penerimaan"
                            href={
                                receipts.length === 1
                                    ? route('inventory.receipts.show', receipts[0].id)
                                    : route('inventory.receipts.index', { search: order.id })
                            }
                            highlight={receipts.length > 0}
                        />

                        {/* Smart Button Vendor Bills */}
                        <OdooSmartButton
                            icon={Receipt}
                            count={vendorBills.length}
                            label="Tagihan Vendor"
                            href={
                                vendorBills.length === 1
                                    ? route('accounting.bills.show', vendorBills[0].id)
                                    : route('accounting.bills.index', { search: order.id })
                            }
                            highlight={vendorBills.length > 0}
                        />
                    </div>
                </div>

                {/* Document Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-100 text-xs">
                    {/* Vendor Information */}
                    <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Pemasok (Vendor)
                        </span>
                        <div className="text-sm font-bold text-slate-900">
                            <Link
                                href={route('purchase.vendors.show', order.vendor_id)}
                                className="text-amber-800 hover:underline flex items-center gap-1"
                            >
                                {order.vendor_name}
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="text-slate-500 mt-0.5">{order.vendor_city}</div>
                        <span className="inline-block mt-1 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            ID: {order.vendor_id}
                        </span>
                    </div>

                    {/* Payment Terms */}
                    <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Termin Pembayaran
                        </span>
                        <div className="font-semibold text-slate-900 font-mono text-sm">
                            {order.payment_terms}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                            {order.payment_term_desc || 'Sesuai kesepakatan pemasok'}
                        </div>
                    </div>

                    {/* Order Dates & Creator */}
                    <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Waktu & Pembuat
                        </span>
                        <div className="text-slate-700">
                            Dibuat: <span className="font-semibold text-slate-900">{order.created_at}</span>
                        </div>
                        {order.confirmed_at && (
                            <div className="text-emerald-700 mt-0.5">
                                Dikonfirmasi: <span className="font-semibold">{order.confirmed_at}</span>
                            </div>
                        )}
                        <div className="text-slate-500 text-[11px] mt-0.5">
                            Oleh: {order.confirmed_by || order.created_by || 'Staf Pengadaan'}
                        </div>
                    </div>

                    {/* Notes / Instructions */}
                    <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Instruksi / Catatan
                        </span>
                        <div className="text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-200">
                            {order.notes || 'Tidak ada catatan khusus.'}
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                        Rincian Produk Dipesan (Purchase Order Lines)
                    </h3>
                    <div className="overflow-x-auto rounded border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Produk & Varian (SKU)</th>
                                    <th className="py-2.5 px-3 text-center">Dipesan</th>
                                    <th className="py-2.5 px-3 text-center">Diterima Baik</th>
                                    <th className="py-2.5 px-3 text-center">Ditolak QC</th>
                                    <th className="py-2.5 px-3 text-center">Ditagih</th>
                                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                                    <th className="py-2.5 px-3 text-center">Pajak</th>
                                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                                    <th className="py-2.5 px-3 text-right">Total Baris</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.lines.map((l) => (
                                    <tr key={l.id} className="hover:bg-slate-50/50">
                                        <td className="py-3 px-3">
                                            <div className="font-mono font-bold text-slate-900">{l.variant_sku}</div>
                                            <div className="text-slate-600 font-medium">
                                                {l.product_name} {l.size && `• Size: ${l.size}`} {l.color && `• Warna: ${l.color}`}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                                            {l.qty_ordered} {l.unit}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                l.qty_received >= l.qty_ordered && l.qty_ordered > 0
                                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                                    : l.qty_received > 0
                                                    ? 'bg-amber-100 text-amber-800 font-bold'
                                                    : 'text-slate-400'
                                            }`}>
                                                {l.qty_received} {l.unit}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {l.qty_rejected > 0 ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                                    {l.qty_rejected} {l.unit}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                l.qty_billed >= l.qty_ordered && l.qty_ordered > 0
                                                    ? 'bg-teal-100 text-teal-800 font-bold'
                                                    : l.qty_billed > 0
                                                    ? 'bg-blue-100 text-blue-800 font-bold'
                                                    : 'text-slate-400'
                                            }`}>
                                                {l.qty_billed} {l.unit}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                                            {formatRp(l.unit_price)}
                                        </td>
                                        <td className="py-3 px-3 text-center font-mono text-slate-500 text-[10px]">
                                            PPN 11%
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                                            {formatRp(l.subtotal_before_tax)}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(l.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary Box */}
                <div className="flex flex-col sm:flex-row justify-end items-end gap-6 pt-2 pb-4">
                    <div className="w-full sm:w-80 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Dasar Pengenaan Pajak (DPP):</span>
                            <span className="font-mono font-bold text-slate-900">
                                {formatRp(order.subtotal_before_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Pajak Pertambahan Nilai (PPN 11%):</span>
                            <span className="font-mono font-bold text-amber-700">
                                {formatRp(order.total_tax)}
                            </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                            <span>Total Pesanan Pembelian:</span>
                            <span className="font-mono text-base text-amber-900">
                                {formatRp(order.grand_total)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog Batalkan PO */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="flex items-center gap-2 text-rose-600 font-bold mb-3">
                            <AlertTriangle className="h-5 w-5" />
                            Batalkan Purchase Order {order.id}?
                        </div>
                        <p className="text-xs text-slate-600 mb-4">
                            Tindakan ini akan membatalkan PO dan dokumen penerimaan fisik gudang yang belum divalidasi.
                        </p>
                        <form onSubmit={handleCancelSubmit}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Alasan Pembatalan:
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                required
                                rows={3}
                                className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 focus:border-rose-500 focus:outline-none mb-4"
                                placeholder="Contoh: Kesalahan kuantitas / vendor tidak sanggup kirim..."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOpen(false)}
                                    className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                >
                                    Konfirmasi Batalkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="purchase_order"
                documentId={order.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </PurchaseLayout>
    );
}

