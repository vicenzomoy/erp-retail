import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Truck,
    ReceiptText,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    Plus,
    Check,
    X,
    Lock,
    Percent,
    ShieldAlert,
} from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function getStatusBadge(status, creditHold, discountHold) {
    if (creditHold) return { cls: 'bg-amber-100 text-amber-700', label: '⚠ Kredit Hold' };
    if (discountHold) return { cls: 'bg-rose-100 text-rose-700', label: '⚠ Menunggu Approval Diskon' };
    const map = {
        draft: { cls: 'bg-slate-100 text-slate-600', label: 'Quotation (Draft)' },
        confirmed: { cls: 'bg-blue-100 text-blue-700', label: 'Sales Order' },
        done: { cls: 'bg-emerald-100 text-emerald-700', label: 'Selesai' },
        cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
    };
    return map[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
}

const DELIVERY_STATUS = {
    draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    ready: { cls: 'bg-blue-100 text-blue-700', label: 'Siap' },
    done: { cls: 'bg-emerald-100 text-emerald-700', label: 'Selesai' },
    cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
};

const INVOICE_STATUS = {
    draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    posted: { cls: 'bg-blue-100 text-blue-700', label: 'Diposting' },
    paid: { cls: 'bg-emerald-100 text-emerald-700', label: 'Lunas' },
    cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function SalesOrderShow({ order, products = [] }) {
    const { auth, flash } = usePage().props;
    const isOwner = auth?.user?.role_id === 'owner';

    const isDraft = order.status === 'draft';

    // State for editing lines (only allowed when in draft)
    const [editingLineId, setEditingLineId] = useState(null);
    const [editQty, setEditQty] = useState(1);
    const [editDisc, setEditDisc] = useState(0);
    const [isSavingLine, setIsSavingLine] = useState(false);

    // State for adding a line
    const [isAddingLine, setIsAddingLine] = useState(false);
    const [newLineSku, setNewLineSku] = useState('');
    const [newLineQty, setNewLineQty] = useState(1);
    const [newLineDisc, setNewLineDisc] = useState(0);

    const stages = [
        { key: 'draft', label: 'Quotation' },
        { key: 'confirmed', label: 'Sales Order' },
        { key: 'done', label: 'Selesai' },
    ];

    const handleConfirm = () => {
        if (order.discount_hold && !isOwner) {
            alert('Quotation ini memiliki diskon di atas 10% dan sedang menunggu persetujuan Owner. Hubungi Owner untuk menyetujui diskon terlebih dahulu.');
            return;
        }
        if (confirm('Konfirmasi Quotation ini menjadi Sales Order resmi? Stok akan direservasi dan dokumen akan dikunci.')) {
            router.post(route('sales.orders.confirm', order.id));
        }
    };

    const handleCancel = () => {
        if (confirm('Batalkan order ini?')) {
            router.post(route('sales.orders.cancel', order.id));
        }
    };

    const handleStartEditLine = (line) => {
        if (!isDraft) return;
        setEditingLineId(line.id);
        setEditQty(Math.round(line.qty_ordered) || 1);
        setEditDisc(parseFloat(line.discount_pct || 0));
    };

    const handleSaveLine = (lineId) => {
        if (!isDraft) return;
        const finalQty = Math.max(1, Math.round(Number(editQty) || 1));
        const finalDisc = Math.min(100, Math.max(0, parseFloat(editDisc) || 0));

        setIsSavingLine(true);
        router.put(
            route('sales.orders.lines.update', [order.id, lineId]),
            {
                qty_ordered: finalQty,
                discount_pct: finalDisc,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingLineId(null);
                },
                onFinish: () => {
                    setIsSavingLine(false);
                },
            }
        );
    };

    const handleDeleteLine = (lineId) => {
        if (!isDraft) return;
        if (order.lines?.length <= 1) {
            alert('Quotation harus memiliki minimal 1 baris produk.');
            return;
        }

        if (confirm('Hapus baris produk ini dari Quotation?')) {
            router.delete(route('sales.orders.lines.remove', [order.id, lineId]), {
                preserveScroll: true,
            });
        }
    };

    const handleAddLineSubmit = (e) => {
        e.preventDefault();
        if (!isDraft || !newLineSku) return;

        setIsSavingLine(true);
        router.post(
            route('sales.orders.lines.add', order.id),
            {
                variant_sku: newLineSku,
                qty_ordered: Math.max(1, Math.round(Number(newLineQty) || 1)),
                discount_pct: Math.min(100, Math.max(0, parseFloat(newLineDisc) || 0)),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddingLine(false);
                    setNewLineSku('');
                    setNewLineQty(1);
                    setNewLineDisc(0);
                },
                onFinish: () => {
                    setIsSavingLine(false);
                },
            }
        );
    };

    const { cls: statusCls, label: statusLabel } = getStatusBadge(order.status, order.credit_hold, order.discount_hold);

    const deliveryList = order.deliveryOrders ?? order.delivery_orders ?? [];
    const invoiceList = order.customerInvoices ?? order.customer_invoices ?? [];

    const creditLimit = order.customer?.credit_limit ?? 0;
    const openAr = order.customer?.open_ar ?? 0;
    const headroom = creditLimit - openAr;
    const utilPct = creditLimit > 0 ? Math.min((openAr / creditLimit) * 100, 100) : 0;

    return (
        <SalesLayout
            breadcrumbs={[
                { label: 'Orders', href: route('sales.orders.index') },
                { label: order.id },
            ]}
        >
            <Head title={order.id} />

            {/* ── Smart Buttons ── */}
            <div className="mb-4 flex flex-wrap gap-2">
                <OdooSmartButton
                    icon={Truck}
                    count={deliveryList.length}
                    label="Pengiriman"
                    href={
                        deliveryList.length === 1
                            ? route('inventory.deliveries.show', deliveryList[0].id)
                            : deliveryList.length > 1
                                ? route('inventory.deliveries.index', { search: order.id })
                                : null
                    }
                    active={deliveryList.length > 0}
                />
                <OdooSmartButton
                    icon={ReceiptText}
                    count={invoiceList.length}
                    label="Invoice"
                    href={
                        invoiceList.length === 1
                            ? route('accounting.invoices.show', invoiceList[0].id)
                            : invoiceList.length > 1
                                ? route('accounting.invoices.index', { search: order.id })
                                : null
                    }
                    active={invoiceList.length > 0}
                />
            </div>

            {/* ── Form Header ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <OdooStatusBar status={order.status === 'credit_hold' ? 'confirmed' : order.status} stages={stages} />
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">
                                {order.id}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                                {statusLabel}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {isDraft && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="flex items-center gap-1.5 rounded bg-blue-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Konfirmasi Order
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Batalkan
                                </button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Batalkan
                            </button>
                        )}
                    </div>
                </div>

                {/* Credit Hold Warning */}
                {order.credit_hold && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>⚠ Order Ditahan:</strong> Limit kredit pelanggan terlampaui. Order tidak dapat diproses sampai limit kredit disesuaikan atau piutang dilunasi.
                        </span>
                    </div>
                )}

                {/* Discount Hold Warning & Actions */}
                {order.discount_hold && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                        <div className="flex items-start gap-2.5">
                            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-rose-900">
                                    Diskon Di Atas 10% Menunggu Persetujuan Owner
                                </p>
                                <p className="text-slate-600 mt-0.5">
                                    Sales hanya memiliki batas wewenang diskon maks 10%. Dokumen ini ditahan (Discount Hold) sampai Owner memberikan persetujuan.
                                </p>
                            </div>
                        </div>

                        {isOwner && isDraft && (
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Setujui pengajuan diskon > 10% untuk Quotation ini?')) {
                                            router.post(route('sales.orders.approve-discount', order.id));
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                                >
                                    Setujui Diskon
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const reason = prompt('Masukkan alasan penolakan diskon (diskon akan disesuaikan ke 10%):');
                                        if (reason !== null) {
                                            router.post(route('sales.orders.reject-discount', order.id), {
                                                reason,
                                                adjusted_discount: 10,
                                            });
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 transition shadow-2xs cursor-pointer"
                                >
                                    Tolak / Sesuaikan
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Discount Approved Badge */}
                {!order.discount_hold && order.discount_approved_by && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                            <strong>Diskon Disetujui Owner:</strong> Pengajuan diskon &gt; 10% telah disetujui resmi oleh Owner.
                        </span>
                    </div>
                )}
            </div>

            {/* ── Detail Form ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-3 text-xs">
                        <div>
                            <p className="text-slate-500 font-medium mb-0.5">Pelanggan</p>
                            <p className="font-bold text-slate-900 text-sm">{order.customer?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium mb-0.5">Termin Pembayaran</p>
                            <p className="text-slate-800">{order.payment_terms ?? '—'}</p>
                        </div>
                        {order.source_doc_no && (
                            <div>
                                <p className="text-slate-500 font-medium mb-0.5">Dokumen Sumber</p>
                                <p className="font-mono text-slate-800 font-semibold">{order.source_doc_no}</p>
                            </div>
                        )}
                        {order.notes && (
                            <div>
                                <p className="text-slate-500 font-medium mb-0.5">Catatan</p>
                                <p className="text-slate-700 whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-3 text-xs">
                        {/* Credit info */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                            <p className="font-semibold text-slate-700">Informasi Kredit</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">Limit</p>
                                    <p className="font-bold text-slate-900">{formatRp(creditLimit)}</p>
                                </div>
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">AR Terbuka</p>
                                    <p className="font-bold text-rose-600">{formatRp(openAr)}</p>
                                </div>
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">Headroom</p>
                                    <p className={`font-bold ${headroom < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRp(headroom)}</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${utilPct > 90 ? 'bg-rose-500' : utilPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${utilPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="space-y-1">
                            {order.confirmed_at && (
                                <div>
                                    <p className="text-slate-500 font-medium">Dikonfirmasi oleh</p>
                                    <p className="text-slate-800">
                                        {(order.confirmed_by?.name ?? order.confirmedBy?.name) ? (
                                            `${order.confirmed_by?.name ?? order.confirmedBy?.name} · `
                                        ) : ''}
                                        {new Date(order.confirmed_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-slate-500 font-medium">Dibuat</p>
                                <p className="text-slate-800">{order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Order Lines ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">Baris Order</h2>
                        {isDraft && (
                            <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                                Diskon &amp; Quantity Dapat Diubah
                            </span>
                        )}
                    </div>
                    {isDraft && !isAddingLine && (
                        <button
                            type="button"
                            onClick={() => setIsAddingLine(true)}
                            className="flex items-center gap-1 rounded bg-slate-900 text-white px-2.5 py-1 text-xs font-semibold hover:bg-slate-700 transition"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Produk
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Produk</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">SKU</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-28">Qty</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Harga Satuan</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-28">Disc %</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">DPP</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">PPN (11%)</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Total</th>
                                {isDraft && (
                                    <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 w-24">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.lines ?? []).map((line) => {
                                const isEditingThis = editingLineId === line.id;
                                const lineQty = Math.round(Number(line.qty_ordered));

                                if (isEditingThis) {
                                    const unitPrice = parseFloat(line.unit_price) || 0;
                                    const curQty = Math.max(1, Math.round(Number(editQty) || 1));
                                    const curDisc = Math.min(100, Math.max(0, parseFloat(editDisc) || 0));
                                    const dpp = curQty * unitPrice * (1 - curDisc / 100);
                                    const ppn = Math.round(dpp * 0.11);
                                    const total = dpp + ppn;

                                    return (
                                        <tr key={line.id} className="bg-sky-50/60">
                                            <td className="px-4 py-2.5 font-medium text-slate-900">
                                                {line.product?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-500">
                                                {line.variant_sku}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={editQty}
                                                    onChange={(e) => setEditQty(e.target.value)}
                                                    className="w-20 rounded border border-sky-400 bg-white px-2 py-1 text-right text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                                                {formatRp(line.unit_price)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="inline-flex items-center gap-1 justify-end">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={editDisc}
                                                        onChange={(e) => setEditDisc(e.target.value)}
                                                        className="w-16 rounded border border-sky-400 bg-white px-2 py-1 text-right text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                    />
                                                    <span className="text-slate-500 text-xs">%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                                                {formatRp(dpp)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                                                {formatRp(ppn)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">
                                                {formatRp(total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveLine(line.id)}
                                                        disabled={isSavingLine}
                                                        className="rounded bg-emerald-600 p-1 text-white hover:bg-emerald-700 transition"
                                                        title="Simpan Perubahan"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingLineId(null)}
                                                        className="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-100 transition"
                                                        title="Batal"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={line.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-medium text-slate-900">
                                            {line.product?.name ?? '—'}
                                            {line.product?.size && <span className="text-slate-400"> · {line.product.size}</span>}
                                            {line.product?.color && <span className="text-slate-400">/{line.product.color}</span>}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-slate-500">{line.variant_sku}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">
                                            {lineQty}
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatRp(line.unit_price)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 font-medium">
                                            {parseFloat(line.discount_pct ?? 0)}%
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatRp(line.subtotal_before_tax)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatRp(line.tax_amount)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">{formatRp(line.line_total)}</td>
                                        {isDraft && (
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEditLine(line)}
                                                        className="rounded p-1 text-sky-600 hover:bg-sky-50 transition"
                                                        title="Ubah Qty & Diskon"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLine(line.id)}
                                                        className="rounded p-1 text-rose-500 hover:bg-rose-50 transition"
                                                        title="Hapus Baris"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Form Tambah Baris (Hanya saat status Draft) */}
                {isDraft && isAddingLine && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold text-slate-800 mb-2.5">Tambah Produk Baru ke Quotation</div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-6">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Produk</label>
                                <select
                                    value={newLineSku}
                                    onChange={(e) => setNewLineSku(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="">— Pilih Produk —</option>
                                    {products.map((p) => {
                                        const sku = p.variant_sku || p.sku;
                                        return (
                                            <option key={sku} value={sku}>
                                                {sku} — {p.name} ({formatRp(p.sales_price ?? p.selling_price ?? 0)})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty (Bulat)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={newLineQty}
                                    onChange={(e) => setNewLineQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diskon %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={newLineDisc}
                                    onChange={(e) => setNewLineDisc(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-right text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2 flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleAddLineSubmit}
                                    disabled={!newLineSku || isSavingLine}
                                    className="flex-1 rounded bg-sky-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-sky-500 disabled:opacity-50 transition"
                                >
                                    Tambah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingLine(false)}
                                    className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Totals */}
                <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
                    <div className="w-72 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal (DPP)</span>
                            <span className="tabular-nums font-medium">{formatRp(order.subtotal_before_tax)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN (11%)</span>
                            <span className="tabular-nums font-medium">{formatRp(order.total_tax)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                            <span>Grand Total</span>
                            <span className="tabular-nums text-sm">{formatRp(order.grand_total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delivery Orders ── */}
            {(order.deliveryOrders?.length > 0 || order.delivery_orders?.length > 0) && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Delivery Orders ({order.deliveryOrders?.length ?? order.delivery_orders?.length})
                        </h2>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. DO</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.deliveryOrders ?? order.delivery_orders ?? []).map((do_) => {
                                const { cls, label } = DELIVERY_STATUS[do_.status] ?? { cls: 'bg-slate-100 text-slate-600', label: do_.status };
                                return (
                                    <tr key={do_.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{do_.id}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Customer Invoices ── */}
            {(order.customerInvoices?.length > 0 || order.customer_invoices?.length > 0) && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Customer Invoices ({order.customerInvoices?.length ?? order.customer_invoices?.length})
                        </h2>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. Invoice</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Grand Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.customerInvoices ?? order.customer_invoices ?? []).map((inv) => {
                                const { cls, label } = INVOICE_STATUS[inv.status] ?? { cls: 'bg-slate-100 text-slate-600', label: inv.status };
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{inv.id}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">{formatRp(inv.grand_total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </SalesLayout>
    );
}
