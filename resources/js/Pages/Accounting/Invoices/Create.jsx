import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function CustomerInvoiceCreate({ selectedSoId, soMatrices }) {
    const soKeys = Object.keys(soMatrices || {});
    const initialSo = selectedSoId && soMatrices[selectedSoId] ? selectedSoId : (soKeys[0] || '');

    const buildLinesForSo = (soId, useOrderedQty = false) => {
        const matrix = soMatrices?.[soId];
        if (!matrix || !matrix.lines) return [];
        return matrix.lines.map((line) => ({
            so_line_id: line.so_line_id,
            delivery_order_line_id: line.delivery_order_line_id,
            variant_sku: line.variant_sku,
            product_name: line.product_name,
            unit: line.unit,
            qty_ordered: Number(line.qty_ordered),
            qty_delivered: Number(line.qty_delivered),
            qty_already_invoiced: Number(line.qty_already_invoiced),
            max_invoiceable_qty: Number(line.max_invoiceable_qty),
            qty_invoiced: useOrderedQty
                ? Number(line.qty_ordered)
                : Number(line.max_invoiceable_qty > 0 ? line.max_invoiceable_qty : line.qty_delivered),
            unit_price: Number(line.unit_price),
            discount_pct: Number(line.discount_pct || 0),
        }));
    };

    const { data, setData, post, processing, errors } = useForm({
        sales_order_id: initialSo,
        invoice_date: new Date().toISOString().slice(0, 10),
        notes: 'Faktur Penjualan B2B berbasis barang terkirim (Delivered-Based Policy)',
        idempotency_key: `INV-${initialSo}-${Date.now()}`,
        auto_post: true,
        lines: buildLinesForSo(initialSo, false),
    });

    const currentMatrix = soMatrices?.[data.sales_order_id] || null;

    const handleSelectSo = (newSoId) => {
        setData((prev) => ({
            ...prev,
            sales_order_id: newSoId,
            idempotency_key: `INV-${newSoId}-${Date.now()}`,
            lines: buildLinesForSo(newSoId, false),
        }));
    };

    const handleSetPresetDelivered = () => {
        setData('lines', buildLinesForSo(data.sales_order_id, false));
    };

    const handleSetPresetOverInvoice = () => {
        setData('lines', buildLinesForSo(data.sales_order_id, true));
    };

    const handleQtyChange = (idx, val) => {
        const updated = [...data.lines];
        updated[idx].qty_invoiced = val === '' ? '' : Number(val);
        setData('lines', updated);
    };

    // Perhitungan PPN 11% per baris (dibulatkan ke Rupiah terdekat sesuai F-23 & SR-13)
    const computedLines = data.lines.map((line) => {
        const qty = Number(line.qty_invoiced || 0);
        const price = Number(line.unit_price || 0);
        const discPct = Number(line.discount_pct || 0);
        const gross = Math.round(qty * price);
        const disc = Math.round(gross * (discPct / 100));
        const dpp = gross - disc;
        const ppn = Math.round(dpp * 0.11);
        const total = dpp + ppn;
        const isOverDelivered = qty > Number(line.max_invoiceable_qty);

        return {
            ...line,
            dpp,
            ppn,
            total,
            isOverDelivered,
        };
    });

    const totalDpp = computedLines.reduce((acc, l) => acc + l.dpp, 0);
    const totalPpn = computedLines.reduce((acc, l) => acc + l.ppn, 0);
    const grandTotal = totalDpp + totalPpn;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('accounting.invoices.store'), { preserveScroll: true });
    };

    return (
        <AccountingLayout
            title="Buat Customer Invoice (F-10 / F-23)"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Customer Invoices', href: route('accounting.invoices.index') },
                { label: 'Buat Faktur' },
            ]}
        >
            <Head title="Buat Customer Invoice — Accounting" />

            <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
                {/* Header Control & Status Pipe */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-odoo-purple-dark disabled:opacity-50"
                        >
                            {data.auto_post ? 'Terbitkan & Post Faktur (T-17)' : 'Simpan Draft Faktur'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSetPresetDelivered}
                            className="rounded border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                            Isi Sesuai Terkirim (Valid T-17: 2 pcs)
                        </button>
                        <button
                            type="button"
                            onClick={handleSetPresetOverInvoice}
                            className="rounded border border-amber-600 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                        >
                            Uji Penagihan Melebihi Terkirim (Uji Blokir T-18: 4 pcs)
                        </button>
                        <Link
                            href={route('accounting.invoices.index')}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                    </div>

                    <OdooStatusBar
                        steps={[
                            { key: 'draft', label: 'Draft' },
                            { key: 'posted', label: 'Posted' },
                            { key: 'paid', label: 'Paid' },
                        ]}
                        current="draft"
                    />
                </div>

                {/* Error Alert Delivered-Based Policy (T-18) */}
                {(errors.delivery_policy || errors.lines) && (
                    <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                                !
                            </span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-red-900">
                                    Penagihan Ditolak oleh Kebijakan Delivered-Based Invoicing (SR-06 / Skenario T-18)
                                </h4>
                                <p className="text-xs text-red-800">
                                    {errors.delivery_policy || errors.lines}
                                </p>
                                <p className="text-[11px] font-medium text-red-700">
                                    Bukti Audit Log berstatus <code className="font-mono font-bold">REJECTED</code> telah dicatat otomatis oleh sistem.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Sheet */}
                <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Pilih Sales Order Referensi
                                </label>
                                <select
                                    value={data.sales_order_id}
                                    onChange={(e) => handleSelectSo(e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 text-sm font-semibold focus:border-odoo-purple focus:ring-odoo-purple"
                                >
                                    {soKeys.map((soId) => {
                                        const m = soMatrices[soId];
                                        return (
                                            <option key={soId} value={soId}>
                                                {soId} — {m.customer_name} ({m.payment_terms})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {currentMatrix && (
                                <div className="rounded-md border border-gray-200 bg-gray-50 p-3.5 text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Pelanggan:</span>
                                        <span className="font-semibold text-gray-900">
                                            {currentMatrix.customer_name} ({currentMatrix.customer_id})
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Termin Pembayaran:</span>
                                        <span className="font-mono font-semibold text-indigo-700">
                                            {currentMatrix.payment_terms}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Kebijakan Faktur:</span>
                                        <span className="font-semibold text-emerald-700">
                                            Delivered Quantities (Hanya Barang Terkirim)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                        Tanggal Faktur
                                    </label>
                                    <input
                                        type="date"
                                        value={data.invoice_date}
                                        onChange={(e) => setData('invoice_date', e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 text-sm focus:border-odoo-purple focus:ring-odoo-purple"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                        Kunci Idempotensi (SR-17)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.idempotency_key}
                                        onChange={(e) => setData('idempotency_key', e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 font-mono text-xs focus:border-odoo-purple focus:ring-odoo-purple"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    id="auto_post"
                                    type="checkbox"
                                    checked={data.auto_post}
                                    onChange={(e) => setData('auto_post', e.target.checked)}
                                    className="rounded border-gray-300 text-odoo-purple focus:ring-odoo-purple"
                                />
                                <label htmlFor="auto_post" className="text-xs font-semibold text-gray-700">
                                    Langsung Post ke Buku Besar AR (Debit 1100 Piutang / Kredit 4000 Penjualan & 2200 PPN Keluaran)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Matriks Rekonsiliasi Pengiriman vs Faktur */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Matriks Rekonsiliasi Pengiriman & Rincian Baris Faktur (PPN 11% Per Baris — F-23)
                            </h3>
                            <span className="text-[11px] text-gray-500">
                                Rumus PPN: <code className="font-mono">round(DPP_baris * 11%, 0)</code>
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                    <tr>
                                        <th className="px-3 py-2.5">SKU / Produk</th>
                                        <th className="px-3 py-2.5 text-center">Dipesan (SO)</th>
                                        <th className="px-3 py-2.5 text-center">Terkirim (WH/OUT Done)</th>
                                        <th className="px-3 py-2.5 text-center">Sudah Difakturkan</th>
                                        <th className="px-3 py-2.5 text-center">Maks Dapat Ditagih</th>
                                        <th className="px-3 py-2.5 text-center w-28">Qty Ditagih</th>
                                        <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                                        <th className="px-3 py-2.5 text-right">DPP Baris</th>
                                        <th className="px-3 py-2.5 text-right">PPN 11%</th>
                                        <th className="px-3 py-2.5 text-right">Total Baris</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {computedLines.map((line, index) => (
                                        <tr
                                            key={line.variant_sku}
                                            className={line.isOverDelivered ? 'bg-amber-50/70' : ''}
                                        >
                                            <td className="px-3 py-2.5">
                                                <div className="font-mono font-bold text-gray-900">{line.variant_sku}</div>
                                                <div className="text-[11px] text-gray-500">{line.product_name}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono text-gray-600">
                                                {line.qty_ordered} {line.unit}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono font-semibold text-emerald-700">
                                                {line.qty_delivered} {line.unit}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono text-gray-500">
                                                {line.qty_already_invoiced} {line.unit}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono font-bold text-indigo-700">
                                                {line.max_invoiceable_qty} {line.unit}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    value={line.qty_invoiced}
                                                    onChange={(e) => handleQtyChange(index, e.target.value)}
                                                    className={`w-20 rounded text-center font-mono text-xs font-bold ${
                                                        line.isOverDelivered
                                                            ? 'border-red-500 bg-red-50 text-red-800 focus:border-red-600 focus:ring-red-600'
                                                            : 'border-gray-300 focus:border-odoo-purple focus:ring-odoo-purple'
                                                    }`}
                                                />
                                                {line.isOverDelivered && (
                                                    <div className="mt-0.5 text-[10px] font-bold text-red-600">
                                                        &gt; Terkirim ({line.max_invoiceable_qty})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                                                {formatRp(line.unit_price)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900">
                                                {formatRp(line.dpp)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-indigo-700">
                                                {formatRp(line.ppn)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                                                {formatRp(line.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Ringkasan Pajak & Total */}
                    <div className="flex flex-col justify-between gap-4 border-t border-gray-200 pt-4 md:flex-row">
                        <div className="max-w-md flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                Catatan Faktur
                            </label>
                            <textarea
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 text-xs focus:border-odoo-purple focus:ring-odoo-purple"
                            />
                        </div>

                        <div className="w-full max-w-xs space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal Sebelum Pajak (DPP):</span>
                                <span className="font-mono font-semibold text-gray-900">{formatRp(totalDpp)}</span>
                            </div>
                            <div className="flex justify-between text-indigo-700">
                                <span>PPN 11% (VAT-NONLUX — F-23):</span>
                                <span className="font-mono font-semibold">{formatRp(totalPpn)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-bold text-gray-900">
                                <span>Grand Total Faktur:</span>
                                <span className="font-mono text-odoo-purple">{formatRp(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AccountingLayout>
    );
}

