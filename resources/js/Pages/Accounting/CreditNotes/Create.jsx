import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InvoicingLayout from '@/Layouts/InvoicingLayout';
import {
    ArrowLeft,
    ReceiptText,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Scale,
    FileText,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Create({ inspectedReturns = [], selectedReturnId = '' }) {
    const [selectedId, setSelectedId] = useState(
        selectedReturnId || inspectedReturns[0]?.id || ''
    );

    const activeReturn = inspectedReturns.find((r) => r.id === selectedId);

    const { data, setData, post, processing, errors } = useForm({
        customer_return_id: selectedId,
        notes: activeReturn ? `Nota kredit atas retur ${activeReturn.id} (Faktur ${activeReturn.customer_invoice_id})` : '',
    });

    const handleReturnChange = (retId) => {
        setSelectedId(retId);
        const ret = inspectedReturns.find((r) => r.id === retId);
        setData({
            customer_return_id: retId,
            notes: ret ? `Nota kredit atas retur ${ret.id} (Faktur ${ret.customer_invoice_id})` : '',
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('accounting.credit-notes.store'));
    };

    const totalLinesAmount = (activeReturn?.lines || []).reduce((acc, l) => acc + l.line_total, 0);

    return (
        <InvoicingLayout
            title="Proses Nota Kredit"
            breadcrumbs={[
                { label: 'Invoicing', href: route('invoicing.overview') },
                { label: 'Nota Kredit', href: route('invoicing.credit-notes.index') },
                { label: 'Proses Nota Kredit Baru' },
            ]}
        >
            <Head title="Proses Nota Kredit & AR Adjustment — Bara Wear" />

            <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl mx-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <ReceiptText className="h-5 w-5 text-teal-600" />
                            <span>Proses Nota Kredit &amp; AR Adjustment (Finance)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Menerbitkan Nota Kredit dari barang retur yang telah diverifikasi gudang, memotong saldo piutang faktur pelanggan, dan membalik pendapatan serta PPN.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('accounting.credit-notes.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali
                        </Link>

                        <button
                            type="submit"
                            disabled={processing || !activeReturn}
                            className={`inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold text-white shadow-xs transition ${
                                !activeReturn
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-teal-700 hover:bg-teal-800 cursor-pointer'
                            }`}
                        >
                            <ReceiptText className="h-3.5 w-3.5" />
                            <span>Terbitkan Nota Kredit &amp; Eksekusi AR Adjustment</span>
                        </button>
                    </div>
                </div>

                {inspectedReturns.length === 0 ? (
                    <div className="rounded border border-amber-300 bg-amber-50 p-6 text-center text-xs text-amber-800 space-y-2">
                        <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                        <h3 className="font-bold text-sm text-amber-900">
                            Tidak Ada Dokumen Retur Yang Siap Diterbitkan Nota Kredit
                        </h3>
                        <p className="max-w-md mx-auto text-slate-600">
                            Semua dokumen retur telah selesai diproses atau masih menunggu pemeriksaan fisik oleh tim gudang (Return Inspection).
                        </p>
                        <div className="pt-2">
                            <Link
                                href={route('sales.returns.index')}
                                className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Lihat Daftar Retur Pelanggan
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Selector Card */}
                        <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                                Dokumen Retur Pelanggan (Hasil Inspeksi Gudang)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Pilih Retur Yang Diinspeksi
                                    </label>
                                    <select
                                        value={selectedId}
                                        onChange={(e) => handleReturnChange(e.target.value)}
                                        className="w-full rounded border border-slate-300 py-1.5 px-2 text-xs font-mono font-semibold text-teal-800 focus:border-teal-500 focus:outline-none"
                                    >
                                        {inspectedReturns.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.id} — {r.customer_name} (Faktur: {r.customer_invoice_id})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.customer_return_id && (
                                        <p className="text-[11px] text-rose-600 mt-1">{errors.customer_return_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Faktur Pelanggan Terkait (AR Target)
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={activeReturn ? `${activeReturn.customer_invoice_id} (${activeReturn.customer_name})` : '-'}
                                        className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-700 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Total Nilai Kredit (Estimasi)
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={formatRp(totalLinesAmount)}
                                        className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-bold text-teal-800 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Catatan / Keterangan Nota Kredit
                                </label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Keterangan pada nota kredit..."
                                    className="w-full rounded border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Barang Retur Yang Diterima Gudang (Accepted QC)
                                </h3>
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                    ✓ Nilai kredit dihitung otomatis berdasarkan kuantitas yang lolos inspeksi
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100/60 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">SKU / Varian</th>
                                            <th className="px-4 py-2.5">Nama Produk</th>
                                            <th className="px-4 py-2.5 text-center">Qty Diterima Gudang</th>
                                            <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                            <th className="px-4 py-2.5 text-right">Subtotal DPP</th>
                                            <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                            <th className="px-4 py-2.5 text-right">Total Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeReturn?.lines || []).map((l) => {
                                            const subtotal = Math.round(l.qty_accepted * l.unit_price);
                                            const tax = Math.round(subtotal * 0.11);
                                            const total = subtotal + tax;

                                            return (
                                                <tr key={l.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                                        {l.variant_sku}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-700">
                                                        {l.product_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                                                        {l.qty_accepted} pcs
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700">
                                                        {formatRp(l.unit_price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                        {formatRp(subtotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600">
                                                        {formatRp(tax)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-teal-800">
                                                        {formatRp(total)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </form>
        </InvoicingLayout>
    );
}

