import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    FileSpreadsheet,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

/**
 * Kalkulasi PPN 11% per baris bulat Rupiah di sisi klien (cerminan TaxCalculationService F-23).
 */
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

export default function Create({
    selectedPoId,
    poMatrices = {},
    mismatchReport = null,
    recentRejections = [],
}) {
    const initialMatrix = poMatrices[selectedPoId] || Object.values(poMatrices)[0] || null;

    const buildInitialLines = (matrix) => {
        if (!matrix || !matrix.lines) return [];
        return matrix.lines.map((l) => ({
            po_line_id: l.po_line_id,
            receipt_line_id: l.receipt_line_id,
            variant_sku: l.variant_sku,
            product_name: l.product_name,
            unit: l.unit,
            qty_ordered: l.qty_ordered,
            qty_accepted: l.qty_accepted,
            qty_rejected: l.qty_rejected,
            qty_already_billed: l.qty_already_billed,
            max_billable_qty: l.max_billable_qty,
            qty_billed: l.max_billable_qty > 0 ? l.max_billable_qty : l.qty_ordered,
            unit_price: l.unit_price,
        }));
    };

    const { data, setData, post, processing, errors } = useForm({
        purchase_order_id: initialMatrix?.purchase_order_id || '',
        receipt_id: initialMatrix?.primary_receipt_id || '',
        bill_date: new Date().toISOString().slice(0, 10),
        notes: initialMatrix ? `Tagihan Pemasok atas PO ${initialMatrix.purchase_order_id}` : '',
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
                l.variant_sku === sku ? { ...l, qty_billed: newQty } : l
            )
        );
    };

    const applyScenarioPreset = (mode) => {
        setData(
            'lines',
            data.lines.map((l) => ({
                ...l,
                qty_billed: mode === 'normal_t23' ? l.max_billable_qty : l.qty_ordered,
            }))
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('accounting.bills.store'), {
            preserveScroll: true,
        });
    };

    // Hitung total dari seluruh baris aktif
    const computedLines = data.lines.map((l) => {
        const c = calcLineClient(l.qty_billed, l.unit_price);
        const isOverflow = (parseFloat(l.qty_billed) || 0) > l.max_billable_qty;
        return { ...l, ...c, isOverflow };
    });

    const totalDpp = computedLines.reduce((acc, l) => acc + l.subtotal_before_tax, 0);
    const totalPpn = computedLines.reduce((acc, l) => acc + l.tax_amount, 0);
    const grandTotal = computedLines.reduce((acc, l) => acc + l.line_total, 0);
    const hasClientOverflow = computedLines.some((l) => l.isOverflow);

    return (
        <AccountingLayout
            title="Buat Vendor Bill (S-12)"
            breadcrumbs={[
                { label: 'Vendor Bills (S-12)', href: route('accounting.bills.index') },
                { label: 'Buat Vendor Bill Baru' },
            ]}
        >
            <Head title="Buat Vendor Bill (Three-Way Match) — Bara Wear" />

            {/* Top Action Header */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('accounting.bills.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            Pencatatan Vendor Bill dengan Three-Way Match (S-12 / F-14)
                        </h1>
                        <p className="text-xs text-slate-500">
                            Mencocokkan Kuantitas Pesanan (PO) &bull; Kuantitas Diterima Lolos QC (Accepted Receipt) &bull; Tagihan Vendor
                        </p>
                    </div>
                </div>

                {/* Preset Uji Cepat T-23 & T-24 */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => applyScenarioPreset('normal_t23')}
                        className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Set Normal Flow T-23 (Sesuai Accepted QC)
                    </button>
                    <button
                        type="button"
                        onClick={() => applyScenarioPreset('overflow_t24')}
                        className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition cursor-pointer"
                    >
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                        Simulasi Skenario T-24 (Tagih Penuh 10 Unit PO)
                    </button>
                </div>
            </div>

            {/* BANNER LAPORAN KETIDAKCOCOKAN THREE-WAY MATCH (BUKTI WAJIB T-24 & T-20) */}
            {(errors.three_way_match || mismatchReport) && (
                <div
                    data-testid="three-way-match-error"
                    className="mb-6 rounded-lg border-2 border-rose-400 bg-rose-50 p-5 shadow-sm animate-fadeIn"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-black uppercase tracking-wide text-rose-900">
                                        Status Pemblokiran: Three-Way Match Menolak Posting Tagihan
                                    </span>
                                    <span className="rounded bg-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                        DIBLOKIR (SR-06 &amp; SR-13 / SKENARIO T-24)
                                    </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-rose-800">
                                    {errors.three_way_match || mismatchReport?.reason}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Laporan Ketidakcocokan (Mismatch) PO - Receipt - Bill */}
                    {mismatchReport?.items && (
                        <div className="mt-4 overflow-x-auto rounded border border-rose-300 bg-white">
                            <div className="bg-rose-100/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-900 border-b border-rose-200">
                                Laporan Ketidakcocokan (Mismatch Report) PO &mdash; Receipt &mdash; Vendor Bill
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2">SKU Produk</th>
                                        <th className="px-3 py-2 text-right">PO Ordered</th>
                                        <th className="px-3 py-2 text-right">Receipt Accepted (QC Baik)</th>
                                        <th className="px-3 py-2 text-right">Receipt Rejected (Cacat)</th>
                                        <th className="px-3 py-2 text-right">Maks. Dapat Ditagih</th>
                                        <th className="px-3 py-2 text-right">Diajukan Vendor Bill</th>
                                        <th className="px-3 py-2 text-right">Selisih Berlebih (Excess)</th>
                                        <th className="px-3 py-2 text-center">Keputusan Sistem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mismatchReport.items.map((item, idx) => (
                                        <tr key={idx} className="bg-rose-50/30">
                                            <td className="px-3 py-2 font-mono font-bold text-slate-900">
                                                {item.variant_sku} &mdash; {item.product_name}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono">{item.po_ordered_qty} pcs</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                                                {item.receipt_accepted} pcs
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-rose-600">
                                                {item.receipt_rejected} pcs
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                {item.max_billable_qty} pcs
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-rose-700">
                                                {item.requested_bill_qty} pcs
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-black text-rose-700">
                                                +{item.excess_qty} pcs
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className="inline-block rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                                    REJECTED / BLOCKED
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Header Sheet */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Pilih Purchase Order (PO)
                            </label>
                            <select
                                value={data.purchase_order_id}
                                onChange={(e) => handlePoChange(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:outline-none"
                            >
                                {Object.values(poMatrices).map((m) => (
                                    <option key={m.purchase_order_id} value={m.purchase_order_id}>
                                        {m.purchase_order_id} &mdash; {m.vendor_name} ({m.has_validated_receipt ? `Receipt: ${m.primary_receipt_id}` : 'Belum Ada Receipt Tervalidasi'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Pemasok &amp; Dokumen Penerimaan (Receipt)
                            </label>
                            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                <div className="font-bold text-slate-900">
                                    {currentMatrix?.vendor_name || '—'} ({currentMatrix?.vendor_id})
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                                    {currentMatrix?.has_validated_receipt ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Receipt Tervalidasi: {currentMatrix.primary_receipt_id}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Belum ada Accepted Receipt!{' '}
                                            <Link href={route('inventory.receipts.index')} className="underline">
                                                Validasi di Gudang
                                            </Link>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Tanggal Tagihan (Bill Date)
                            </label>
                            <input
                                type="date"
                                value={data.bill_date}
                                onChange={(e) => setData('bill_date', e.target.value)}
                                className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Rincian Baris & Matriks Three-Way Match */}
                    <div className="mt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Baris Tagihan &amp; Pemeriksaan Three-Way Match (F-14 &amp; F-23)
                            </h3>
                            <span className="text-[11px] text-slate-500">
                                PPN efektif 11% (VAT-NONLUX) dihitung &amp; dibulatkan ke Rupiah terdekat per baris
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Produk / SKU</th>
                                        <th className="px-3 py-2.5 text-center">PO Ordered</th>
                                        <th className="px-3 py-2.5 text-center bg-emerald-50/70 text-emerald-900">
                                            QC Accepted
                                        </th>
                                        <th className="px-3 py-2.5 text-center bg-rose-50/70 text-rose-900">
                                            QC Rejected
                                        </th>
                                        <th className="px-3 py-2.5 text-center">Maks. Billable</th>
                                        <th className="px-3 py-2.5 text-center w-32">Qty Ditagih (Bill)</th>
                                        <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                                        <th className="px-3 py-2.5 text-right">DPP (Untaxed)</th>
                                        <th className="px-3 py-2.5 text-right">PPN 11%</th>
                                        <th className="px-3 py-2.5 text-right">Total Baris</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {computedLines.map((line) => (
                                        <tr
                                            key={line.variant_sku}
                                            className={line.isOverflow ? 'bg-rose-50/60' : 'hover:bg-slate-50'}
                                        >
                                            <td className="px-3 py-3">
                                                <div className="font-bold text-slate-900">{line.product_name}</div>
                                                <div className="font-mono text-[11px] text-slate-500">{line.variant_sku}</div>
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-slate-700">
                                                {line.qty_ordered} {line.unit}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                                {line.qty_accepted} {line.unit}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-rose-600 bg-rose-50/40">
                                                {line.qty_rejected} {line.unit}
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-black text-teal-800">
                                                {line.max_billable_qty} {line.unit}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    value={line.qty_billed}
                                                    onChange={(e) => handleQtyChange(line.variant_sku, e.target.value)}
                                                    className={`w-24 rounded border px-2 py-1 text-center font-mono text-xs font-bold focus:outline-none ${
                                                        line.isOverflow
                                                            ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-400'
                                                            : 'border-slate-300 bg-white text-slate-900 focus:border-teal-600'
                                                    }`}
                                                />
                                                {line.isOverflow && (
                                                    <div className="mt-1 text-[10px] font-bold text-rose-600">
                                                        Melebihi Accepted ({line.max_billable_qty})!
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-slate-700">
                                                {formatRp(line.unit_price)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                                                {formatRp(line.subtotal_before_tax)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-teal-700 font-semibold">
                                                {formatRp(line.tax_amount)}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                                                {formatRp(line.line_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Summary & Submit */}
                    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-t border-slate-100 pt-5">
                        <div className="w-full sm:w-1/2 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Catatan Tagihan
                                </label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                                />
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.auto_post}
                                    onChange={(e) => setData('auto_post', e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span>Langsung Post ke Buku Besar Utang Usaha (AP 2100) apabila lolos Three-Way Match</span>
                            </label>
                        </div>

                        <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>DPP / Subtotal Belum Pajak:</span>
                                <span className="font-mono font-semibold text-slate-900">{formatRp(totalDpp)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>PPN Masukan (11% Bulat Rupiah):</span>
                                <span className="font-mono font-semibold text-teal-700">{formatRp(totalPpn)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                                <span>Total Tagihan (AP):</span>
                                <span className="font-mono">{formatRp(grandTotal)}</span>
                            </div>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                                        hasClientOverflow
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-teal-700 hover:bg-teal-800'
                                    }`}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {processing
                                        ? 'Memvalidasi Three-Way Match...'
                                        : hasClientOverflow
                                        ? 'Ajukan & Uji Validasi Three-Way Match (T-24)'
                                        : 'Validasi Three-Way Match & Posting Bill'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Riwayat Log Penolakan Three-Way Match Terbaru (Bukti Audit T-24) */}
            {recentRejections.length > 0 && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-3">
                        Rekam Jejak Audit Pemblokiran Three-Way Match Terbaru (Skenario T-24 / SR-13)
                    </h3>
                    <div className="space-y-2">
                        {recentRejections.map((r) => (
                            <div
                                key={r.id}
                                className="rounded border border-rose-200 bg-rose-50/50 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                                <div>
                                    <span className="font-mono font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded mr-2">
                                        {r.action} ({r.status})
                                    </span>
                                    <span className="font-semibold text-slate-800">Dokumen: {r.document_id}</span>
                                    <p className="text-slate-700 mt-1">{r.notes}</p>
                                </div>
                                <div className="text-[11px] text-slate-500 shrink-0">
                                    {r.actor_username} ({r.actor_role}) &bull; {r.created_at}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AccountingLayout>
    );
}

