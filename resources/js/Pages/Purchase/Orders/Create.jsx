import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    ShoppingBag,
    DollarSign,
    Calculator,
    AlertCircle,
} from 'lucide-react';

export default function Create({ nextId, vendors = [], products = [], paymentTerms = [] }) {
    const defaultVendor = vendors[0] || {};

    const { data, setData, post, processing, errors } = useForm({
        id: nextId,
        vendor_id: defaultVendor.id || '',
        payment_terms: defaultVendor.payment_terms || 'NET30',
        source_doc_no: '',
        notes: '',
        auto_confirm: false,
        lines: [
            {
                variant_sku: products[0]?.variant_sku || '',
                qty_ordered: 10,
                unit_price: products[0]?.cost || 0,
                tax_id: 'VAT-NONLUX',
            },
        ],
    });

    const handleVendorChange = (vendorId) => {
        const found = vendors.find((v) => v.id === vendorId);
        setData({
            ...data,
            vendor_id: vendorId,
            payment_terms: found?.payment_terms || data.payment_terms,
        });
    };

    const addLine = () => {
        const defaultProd = products[0] || {};
        setData('lines', [
            ...data.lines,
            {
                variant_sku: defaultProd.variant_sku || '',
                qty_ordered: 1,
                unit_price: defaultProd.cost || 0,
                tax_id: 'VAT-NONLUX',
            },
        ]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, idx) => idx !== index));
    };

    const updateLine = (index, field, value) => {
        const updated = [...data.lines];
        updated[index][field] = value;

        // Jika mengubah SKU, update unit price dari master cost
        if (field === 'variant_sku') {
            const prod = products.find((p) => p.variant_sku === value);
            if (prod) {
                updated[index].unit_price = prod.cost || 0;
            }
        }

        setData('lines', updated);
    };

    // Kalkulasi Subtotal, PPN (11% bulat), dan Grand Total
    const subtotal = data.lines.reduce((sum, line) => {
        const qty = parseFloat(line.qty_ordered) || 0;
        const price = parseFloat(line.unit_price) || 0;
        return sum + (qty * price);
    }, 0);

    const taxAmount = Math.round(subtotal * 0.11);
    const grandTotal = subtotal + taxAmount;

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleSubmit = (autoConfirm = false) => {
        post(route('purchase.orders.store'), {
            transform: (currentData) => ({
                ...currentData,
                auto_confirm: autoConfirm,
            }),
        });
    };

    return (
        <PurchaseLayout
            title="Buat Permintaan Penawaran (RFQ)"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pesanan Pembelian', href: route('purchase.orders.index') },
                { label: 'Baru' },
            ]}
        >
            <Head title="Buat Permintaan Penawaran (RFQ) — Bara Wear" />

            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.orders.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-amber-600" />
                            Buat Permintaan Penawaran (RFQ) Baru
                        </h1>
                        <span className="text-xs text-slate-500 font-mono">
                            ID Terjadwal: {data.id}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleSubmit(false)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                    >
                        <Save className="h-4 w-4 text-slate-600" />
                        Simpan Draft (RFQ)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Konfirmasi Langsung (PO)
                    </button>
                </div>
            </div>

            {/* Error notifications */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 shadow-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        Periksa Kesalahan Pengisian Form:
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5">
                        {Object.entries(errors).map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Form Sheet Card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                {/* Header Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-200 text-xs">
                    {/* Nomor PO & ID */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Nomor Dokumen PO / RFQ
                        </label>
                        <input
                            type="text"
                            value={data.id}
                            onChange={(e) => setData('id', e.target.value)}
                            className="w-full rounded border border-slate-300 bg-slate-50 font-mono font-bold text-slate-900 py-1.5 px-3 focus:border-amber-500 focus:bg-white focus:outline-none"
                            placeholder="PO-0001"
                        />
                    </div>

                    {/* Pemasok (Vendor) */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Pemasok (Vendor) <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={data.vendor_id}
                            onChange={(e) => handleVendorChange(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white font-medium text-slate-900 py-1.5 px-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            {vendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Termin Pembayaran */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Termin Pembayaran
                        </label>
                        <select
                            value={data.payment_terms}
                            onChange={(e) => setData('payment_terms', e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white font-medium text-slate-900 py-1.5 px-3 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            {paymentTerms.map((pt) => (
                                <option key={pt.term_id} value={pt.term_id}>
                                    {pt.term_id} — {pt.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Referensi Dokumen Sumber */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Referensi Dokumen Sumber (Opsional)
                        </label>
                        <input
                            type="text"
                            value={data.source_doc_no}
                            onChange={(e) => setData('source_doc_no', e.target.value)}
                            placeholder="Contoh: P00007 / Penawaran Vendor..."
                            className="w-full rounded border border-slate-300 bg-white py-1.5 px-3 focus:border-amber-500 focus:outline-none"
                        />
                    </div>

                    {/* Catatan Internal */}
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Catatan Pengadaan / Instruksi Pengiriman
                        </label>
                        <input
                            type="text"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Catatan pengadaan, estimasi tiba di gudang..."
                            className="w-full rounded border border-slate-300 bg-white py-1.5 px-3 focus:border-amber-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Line Items Table Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Rincian Baris Produk (Order Lines)
                        </h3>
                        <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Baris Produk
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                                    <th className="py-2.5 px-3">Produk & Varian (SKU)</th>
                                    <th className="py-2.5 px-3 text-center w-28">Kuantitas</th>
                                    <th className="py-2.5 px-3 text-right w-40">Harga Beli Satuan (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-28">Pajak</th>
                                    <th className="py-2.5 px-3 text-right w-40">Total DPP</th>
                                    <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.map((line, idx) => {
                                    const lineSubtotal = (parseFloat(line.qty_ordered) || 0) * (parseFloat(line.unit_price) || 0);

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <select
                                                    value={line.variant_sku}
                                                    onChange={(e) => updateLine(idx, 'variant_sku', e.target.value)}
                                                    className="w-full rounded border border-slate-300 bg-white py-1 px-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                                                >
                                                    {products.map((p) => (
                                                        <option key={p.variant_sku} value={p.variant_sku}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="0.001"
                                                    step="any"
                                                    value={line.qty_ordered}
                                                    onChange={(e) => updateLine(idx, 'qty_ordered', e.target.value)}
                                                    className="w-full rounded border border-slate-300 py-1 px-2 text-center font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={line.unit_price}
                                                    onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                                                    className="w-full rounded border border-slate-300 py-1 px-2 text-right font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold border border-slate-200">
                                                    PPN 11%
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                                {formatRp(lineSubtotal)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(idx)}
                                                    disabled={data.lines.length <= 1}
                                                    className="text-slate-400 hover:text-rose-600 transition disabled:opacity-30 cursor-pointer"
                                                    title="Hapus Baris"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary Calculation (Right-aligned) */}
                <div className="flex flex-col sm:flex-row justify-end items-end gap-6 pt-4 border-t border-slate-200">
                    <div className="w-full sm:w-80 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Dasar Pengenaan Pajak (DPP):</span>
                            <span className="font-mono font-bold text-slate-900">{formatRp(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Pajak Pertambahan Nilai (PPN 11%):</span>
                            <span className="font-mono font-bold text-amber-700">{formatRp(taxAmount)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                            <span>Total Perkiraan Tagihan:</span>
                            <span className="font-mono text-base text-amber-900">{formatRp(grandTotal)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">
                            * Pajak dihitung per baris dan dibulatkan ke rupiah terdekat (F-23).
                        </p>
                    </div>
                </div>
            </div>
        </PurchaseLayout>
    );
}

