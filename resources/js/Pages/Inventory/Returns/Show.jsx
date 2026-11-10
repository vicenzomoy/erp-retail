import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    RotateCcw,
    AlertCircle,
    Warehouse,
    ShieldCheck,
    Check,
    Eye,
} from 'lucide-react';

export default function Show({ customerReturn }) {
    const { auth } = usePage().props;
    const isReadOnlyRole = ['procurement', 'sales'].includes(auth?.user?.role_id);
    const isPending = customerReturn.status === 'pending_inspection';

    const { data, setData, post, processing, errors } = useForm({
        inspection_notes: customerReturn.inspection_notes || 'Pemeriksaan fisik barang retur telah diverifikasi oleh tim gudang.',
        lines: customerReturn.lines.map((l) => ({
            id: l.id,
            variant_sku: l.variant_sku,
            product_name: l.product_name,
            qty_requested: l.qty_requested,
            qty_inspected: l.qty_inspected > 0 ? l.qty_inspected : l.qty_requested,
            qty_accepted: l.qty_accepted > 0 ? l.qty_accepted : l.qty_requested,
            qty_damaged: l.qty_damaged || 0,
            condition: l.condition || 'saleable',
            notes: l.notes || '',
        })),
    });

    const handleQtyAcceptedChange = (idx, value) => {
        const updated = [...data.lines];
        const accepted = Math.max(0, parseInt(value, 10) || 0);
        const inspected = updated[idx].qty_inspected;
        updated[idx].qty_accepted = Math.min(accepted, inspected);
        updated[idx].qty_damaged = Math.max(0, inspected - updated[idx].qty_accepted);
        updated[idx].condition = updated[idx].qty_damaged > 0 ? 'damaged' : 'saleable';
        setData('lines', updated);
    };

    const handleQtyInspectedChange = (idx, value) => {
        const updated = [...data.lines];
        const inspected = Math.max(0, parseInt(value, 10) || 0);
        updated[idx].qty_inspected = inspected;
        if (updated[idx].qty_accepted > inspected) {
            updated[idx].qty_accepted = inspected;
        }
        updated[idx].qty_damaged = Math.max(0, inspected - updated[idx].qty_accepted);
        setData('lines', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.returns.validate', customerReturn.id));
    };

    return (
        <InventoryLayout
            title={`Inspeksi Retur ${customerReturn.id}`}
            breadcrumbs={[
                { label: 'Inventory', href: route('inventory.overview') },
                { label: 'Inspeksi Retur', href: route('inventory.returns.index') },
                { label: customerReturn.id },
            ]}
        >
            <Head title={`Inspeksi Retur ${customerReturn.id} — Bara Wear`} />

            <form onSubmit={handleSubmit} className="space-y-4 max-w-5xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('inventory.returns.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Daftar Inspeksi
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {isPending ? (
                            !isReadOnlyRole && (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                                >
                                    <Check className="h-4 w-4" />
                                    <span>Validasi Stok Retur (QC Selesai)</span>
                                </button>
                            )
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 text-xs font-bold">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                Stok Masuk Telah Divalidasi
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Card */}
                <div className="rounded border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Return Inspection (QC Fisik Gudang)
                            </span>
                            <h2 className="text-2xl font-bold font-mono text-slate-900">
                                {customerReturn.id}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pelanggan: <span className="font-semibold text-slate-700">{customerReturn.customer_name}</span> • Faktur: <span className="font-mono text-teal-700">{customerReturn.customer_invoice_id}</span>
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                                Lokasi Restok: WH-PKU (Gudang Pusat)
                            </span>
                        </div>
                    </div>

                    {/* Metadata & Sales Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="rounded bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                            <span className="font-bold text-slate-700 block">Alasan Pengajuan oleh Sales:</span>
                            <p className="text-slate-600 leading-relaxed italic">{customerReturn.reason}</p>
                            <span className="text-[11px] text-slate-400 block pt-1">
                                Diajukan: {customerReturn.sales_user_name} ({customerReturn.return_date})
                            </span>
                        </div>

                        <div className="rounded bg-slate-50 p-3.5 border border-slate-200 space-y-2">
                            <label className="font-bold text-slate-700 block">
                                Catatan Hasil Pemeriksaan Gudang:
                            </label>
                            {isPending ? (
                                <textarea
                                    rows="2"
                                    value={data.inspection_notes}
                                    onChange={(e) => setData('inspection_notes', e.target.value)}
                                    placeholder="Tuliskan catatan kondisi fisik kemasan atau barang..."
                                    className="w-full rounded border border-slate-300 py-1.5 px-2.5 text-xs bg-white focus:border-emerald-500 focus:outline-none"
                                ></textarea>
                            ) : (
                                <p className="text-slate-600 leading-relaxed">
                                    {customerReturn.inspection_notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Inspection Lines Table */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Item Barang Retur &amp; Hasil Pemeriksaan Fisik
                            </h3>
                            <span className="text-[11px] text-slate-500">
                                Hanya kuantitas yang berstatus "Layak Masuk Stok" yang akan ditambahkan ke On-Hand gudang
                            </span>
                        </div>

                        <div className="overflow-hidden rounded border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5">SKU / Varian</th>
                                        <th className="px-4 py-2.5">Nama Produk</th>
                                        <th className="px-4 py-2.5 text-center">Diajukan</th>
                                        <th className="px-4 py-2.5 text-center w-32">Diterima Fisik</th>
                                        <th className="px-4 py-2.5 text-center w-36">Layak Masuk Stok (Accepted)</th>
                                        <th className="px-4 py-2.5 text-center w-32">Barang Rusak (Damaged)</th>
                                        <th className="px-4 py-2.5">Catatan QC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.lines.map((line, idx) => (
                                        <tr key={line.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                                {line.variant_sku}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                {line.product_name}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-600">
                                                {line.qty_requested} pcs
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isPending ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={line.qty_inspected}
                                                        onChange={(e) => handleQtyInspectedChange(idx, e.target.value)}
                                                        className="w-20 rounded border border-slate-300 py-1 text-center text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-slate-800">{line.qty_inspected} pcs</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isPending ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={line.qty_inspected}
                                                        value={line.qty_accepted}
                                                        onChange={(e) => handleQtyAcceptedChange(idx, e.target.value)}
                                                        className="w-24 rounded border border-emerald-400 bg-emerald-50/40 py-1 text-center text-xs font-bold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                        +{line.qty_accepted} pcs
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${line.qty_damaged > 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-slate-400'}`}>
                                                    {line.qty_damaged} pcs
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 italic">
                                                {line.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </form>
        </InventoryLayout>
    );
}

