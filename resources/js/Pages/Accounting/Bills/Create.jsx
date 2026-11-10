import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ArrowLeft,
    CheckCircle2,
    Save,
    Package,
    ArrowDownLeft,
    AlertTriangle,
    Check,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

function calcLineClient(qty, unitPrice) {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(unitPrice) || 0;
    const dpp = Math.round(q * p);
    const ppn = Math.round(dpp * 0.11);
    return {
        subtotal_before_tax: dpp,
        tax_amount: ppn,
        line_total: dpp + ppn,
    };
}

export default function VendorBillCreate({
    selectedPoId,
    poMatrices = {},
    mismatchReport = null,
}) {
    const allMatrices = Object.values(poMatrices || {});
    const readyPos = allMatrices.filter(
        (m) => m.has_validated_receipt && Number(m.total_billable) > 0
    );
    const otherPos = allMatrices.filter(
        (m) => !m.has_validated_receipt || Number(m.total_billable) <= 0
    );

    const initialMatrix =
        (selectedPoId && poMatrices[selectedPoId]) ||
        readyPos[0] ||
        allMatrices[0] ||
        null;

    const buildInitialLines = (matrix) => {
        if (!matrix || !matrix.lines) return [];
        return matrix.lines.map((l) => ({
            po_line_id: l.po_line_id,
            receipt_line_id: l.receipt_line_id,
            variant_sku: l.variant_sku,
            product_name: l.product_name,
            unit: l.unit || 'pcs',
            qty_ordered: Number(l.qty_ordered),
            qty_accepted: Number(l.qty_accepted),
            qty_rejected: Number(l.qty_rejected),
            qty_already_billed: Number(l.qty_already_billed),
            max_billable_qty: Number(l.max_billable_qty),
            qty_billed: Number(l.max_billable_qty > 0 ? l.max_billable_qty : l.qty_ordered),
            unit_price: Number(l.unit_price),
        }));
    };

    const { data, setData, processing, errors } = useForm({
        purchase_order_id: initialMatrix?.purchase_order_id || '',
        receipt_id: initialMatrix?.primary_receipt_id || '',
        bill_date: new Date().toISOString().slice(0, 10),
        notes: initialMatrix
            ? `Tagihan Pemasok atas PO ${initialMatrix.purchase_order_id}`
            : '',
        auto_post: true,
        idempotency_key: `bill_${Date.now()}`,
        lines: buildInitialLines(initialMatrix),
    });

    const currentMatrix = poMatrices[data.purchase_order_id] || initialMatrix;

    const handlePoChange = (poId) => {
        const m = poMatrices[poId];
        setData({
            ...data,
            purchase_order_id: poId,
            receipt_id: m?.primary_receipt_id || '',
            notes: `Tagihan Pemasok atas PO ${poId}`,
            idempotency_key: `bill_${poId}_${Date.now()}`,
            lines: buildInitialLines(m),
        });
    };

    const handleQtyChange = (sku, newQty) => {
        setData(
            'lines',
            data.lines.map((l) =>
                l.variant_sku === sku
                    ? { ...l, qty_billed: newQty === '' ? '' : Number(newQty) }
                    : l
            )
        );
    };

    const submitBill = (autoPost) => {
        router.post(
            route('accounting.bills.store'),
            {
                ...data,
                auto_post: autoPost,
            },
            { preserveScroll: true }
        );
    };

    const computedLines = data.lines.map((l) => {
        const c = calcLineClient(l.qty_billed, l.unit_price);
        const isOverflow = (parseFloat(l.qty_billed) || 0) > l.max_billable_qty;
        return { ...l, ...c, isOverflow };
    });

    const totalDpp = computedLines.reduce((acc, l) => acc + l.subtotal_before_tax, 0);
    const totalPpn = computedLines.reduce((acc, l) => acc + l.tax_amount, 0);
    const grandTotal = computedLines.reduce((acc, l) => acc + l.line_total, 0);

    return (
        <AccountingLayout
            title="Buat Tagihan Pemasok"
            breadcrumbs={[
                { label: 'Pemasok', href: route('accounting.bills.index') },
                { label: 'Tagihan Pemasok', href: route('accounting.bills.index') },
                { label: 'Buat Tagihan Baru' },
            ]}
        >
            <Head title="Buat Tagihan Pemasok (Vendor Bill) — Bara Wear" />

            {/* Odoo Form Action Header Bar (Persis Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.bills.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Tagihan"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => submitBill(true)}
                        disabled={processing || !data.purchase_order_id}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {processing ? 'Memproses...' : 'Simpan & Posting Tagihan'}
                    </button>

                    <button
                        type="button"
                        onClick={() => submitBill(false)}
                        disabled={processing || !data.purchase_order_id}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                    >
                        <Save className="h-3.5 w-3.5 text-slate-500" />
                        Simpan sebagai Draft
                    </button>
                </div>

                <OdooStatusBar
                    status="draft"
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'posted', label: 'Posted (Terbit)' },
                        { key: 'paid', label: 'Lunas (Paid)' },
                    ]}
                />
            </div>

            {/* Pesan Validasi Penerimaan Gudang (Three-Way Match) */}
            {(errors.three_way_match || mismatchReport) && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">
                            Tagihan Ditolak (Melebihi Jumlah Barang Diterima Gudang):
                        </span>
                        <p className="mt-1">{errors.three_way_match || mismatchReport?.reason}</p>
                    </div>
                </div>
            )}

            {/* Pilihan Cepat Purchase Order yang Perlu Ditagih */}
            {readyPos.length > 0 && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <div className="text-xs font-bold text-emerald-950 mb-2">
                        Pilih Purchase Order yang Perlu Diurus Tagihannya ({readyPos.length} PO Siap Ditagih):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {readyPos.map((po) => {
                            const isSelected = data.purchase_order_id === po.purchase_order_id;
                            return (
                                <button
                                    key={po.purchase_order_id}
                                    type="button"
                                    onClick={() => handlePoChange(po.purchase_order_id)}
                                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition cursor-pointer ${
                                        isSelected
                                            ? 'border-emerald-700 bg-emerald-700 text-white font-bold shadow-xs'
                                            : 'border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50 font-medium'
                                    }`}
                                >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                    <span className="font-mono font-bold">{po.purchase_order_id}</span>
                                    <span>&bull;</span>
                                    <span>{po.vendor_name}</span>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-emerald-100 text-emerald-900'
                                        }`}
                                    >
                                        Siap Tagih: {po.total_billable} pcs
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Odoo White Sheet Form View (Persis Modul Inventaris) */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Sheet Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Tagihan Pemasok Baru (Vendor Bill)
                            </h1>
                            <OdooBadge status="draft" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tagihan pemasok dicocokkan dengan jumlah barang yang diterima baik (Lolos QC) di gudang
                        </p>
                    </div>

                    {currentMatrix?.primary_receipt_id && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('inventory.receipts.show', currentMatrix.primary_receipt_id)}
                                className="inline-flex items-center gap-1.5 rounded bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                            >
                                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                Penerimaan Gudang: {currentMatrix.primary_receipt_id} (Tervalidasi QC)
                            </Link>
                        </div>
                    )}
                </div>

                {/* General Information Grid (2 Kolom Rapi seperti Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Purchase Order (PO):
                            </span>
                            <select
                                value={data.purchase_order_id}
                                onChange={(e) => handlePoChange(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                            >
                                {readyPos.length > 0 && (
                                    <optgroup label="Perlu Ditagih (Sudah Diterima & Lolos QC Gudang)">
                                        {readyPos.map((m) => (
                                            <option key={m.purchase_order_id} value={m.purchase_order_id}>
                                                {m.purchase_order_id} — {m.vendor_name} (Siap Ditagih: {m.total_billable} pcs)
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {otherPos.length > 0 && (
                                    <optgroup label="Purchase Order Lainnya (Sudah Ditagih / Belum Diterima Gudang)">
                                        {otherPos.map((m) => (
                                            <option key={m.purchase_order_id} value={m.purchase_order_id}>
                                                {m.purchase_order_id} — {m.vendor_name} (
                                                {m.has_validated_receipt
                                                    ? 'Sudah Selesai Ditagih'
                                                    : 'Belum Diterima Gudang'})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Pemasok (Vendor):
                            </span>
                            <span className="font-bold text-slate-900">
                                {currentMatrix?.vendor_name || '—'}{' '}
                                {currentMatrix?.vendor_id && (
                                    <span className="text-slate-400 font-normal">
                                        ({currentMatrix.vendor_id})
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Termin Pembayaran:
                            </span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {currentMatrix?.payment_terms || 'CASH'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Tanggal Tagihan:
                            </span>
                            <input
                                type="date"
                                value={data.bill_date}
                                onChange={(e) => setData('bill_date', e.target.value)}
                                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Status QC Gudang:
                            </span>
                            {currentMatrix?.has_validated_receipt ? (
                                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Diterima Baik {currentMatrix.total_accepted} pcs dari {currentMatrix.total_ordered} pcs
                                    {currentMatrix.total_rejected > 0 && (
                                        <span className="text-rose-600 font-bold">
                                            (Ditolak QC: {currentMatrix.total_rejected} pcs)
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="font-semibold text-rose-600">
                                    Belum ada penerimaan barang tervalidasi di gudang
                                </span>
                            )}
                        </div>

                        <div className="flex items-center">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Catatan:
                            </span>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan tagihan pemasok..."
                                className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabel Rincian Barang yang Ditagih (Senada dengan Tabel Barang di Inventaris) */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-slate-500" />
                            Daftar Barang pada Tagihan Pemasok
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {computedLines.length} Baris
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                    <th className="px-4 py-2.5 text-center">Dipesan (PO)</th>
                                    <th className="px-4 py-2.5 text-center">Diterima Baik (QC)</th>
                                    <th className="px-4 py-2.5 text-center">Siap Ditagih</th>
                                    <th className="px-4 py-2.5 text-center">Qty Ditagih</th>
                                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                    <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {computedLines.map((line) => (
                                    <tr
                                        key={line.variant_sku}
                                        className={line.isOverflow ? 'bg-rose-50/50' : 'hover:bg-slate-50'}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">{line.product_name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                            {line.qty_ordered} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-bold text-emerald-700">
                                                {line.qty_accepted} {line.unit}
                                            </span>
                                            {line.qty_rejected > 0 && (
                                                <div className="text-[10px] font-semibold text-rose-600">
                                                    Ditolak QC: {line.qty_rejected} {line.unit}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                                                {line.max_billable_qty} {line.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={line.qty_billed}
                                                onChange={(e) =>
                                                    handleQtyChange(line.variant_sku, e.target.value)
                                                }
                                                className={`w-20 text-center rounded border py-1 text-xs font-bold focus:outline-none ${
                                                    line.isOverflow
                                                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                                                        : 'border-emerald-300 bg-emerald-50/40 text-emerald-900 focus:border-emerald-500'
                                                }`}
                                            />
                                            {line.isOverflow && (
                                                <div className="mt-0.5 text-[10px] font-bold text-rose-600">
                                                    Maks: {line.max_billable_qty}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(line.unit_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                            {formatRp(line.tax_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(line.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ringkasan Total Tagihan */}
                <div className="flex justify-end">
                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal (Sebelum Pajak):</span>
                            <span className="font-mono font-semibold text-slate-900">{formatRp(totalDpp)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN (11%):</span>
                            <span className="font-mono font-semibold text-slate-800">{formatRp(totalPpn)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Total Tagihan:</span>
                            <span className="font-mono text-emerald-800">{formatRp(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}
