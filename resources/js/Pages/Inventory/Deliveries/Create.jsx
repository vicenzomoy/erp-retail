import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { ArrowLeft, Plus, Trash2, Save, Truck } from 'lucide-react';

export default function Create({ salesOrders, locations, products }) {
    const { data, setData, post, processing, errors } = useForm({
        sales_order_id: salesOrders[0]?.id || '',
        location_from: 'WH-PKU',
        location_to: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        notes: '',
        lines: [
            {
                variant_sku: products[0]?.variant_sku || '',
                qty_demand: 1,
            },
        ],
    });

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            { variant_sku: products[0]?.variant_sku || '', qty_demand: 1 },
        ]);
    };

    const removeLine = (idx) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, i) => i !== idx));
    };

    const updateLine = (idx, field, val) => {
        const updated = [...data.lines];
        updated[idx][field] = val;
        setData('lines', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.deliveries.store'));
    };

    return (
        <InventoryLayout
            title="Buat Pengiriman Baru"
            breadcrumbs={[
                { label: 'Operasi', href: route('inventory.overview') },
                { label: 'Pengiriman', href: route('inventory.deliveries.index') },
                { label: 'Baru' },
            ]}
        >
            <Head title="Buat Delivery Order — Bara Wear" />

            <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('inventory.deliveries.index')}
                            className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-sm font-bold text-slate-800">
                            Buat Dokumen Pengiriman (Delivery Order)
                        </h2>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Dokumen'}
                    </button>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Rujukan Sales Order (SO) *
                            </label>
                            <select
                                value={data.sales_order_id}
                                onChange={(e) => setData('sales_order_id', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            >
                                {salesOrders.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.id} — {s.customer_name}
                                    </option>
                                ))}
                            </select>
                            {errors.sales_order_id && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.sales_order_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Lokasi Gudang Asal *
                            </label>
                            <select
                                value={data.location_from}
                                onChange={(e) => setData('location_from', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            >
                                {locations.map((l) => (
                                    <option key={l.location_code} value={l.location_code}>
                                        {l.location_code} — {l.location_name}
                                    </option>
                                ))}
                            </select>
                            {errors.location_from && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.location_from}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Alamat Tujuan Pengiriman
                            </label>
                            <input
                                type="text"
                                value={data.location_to}
                                onChange={(e) => setData('location_to', e.target.value)}
                                placeholder="Contoh: Jl. Sudirman No. 45, Pekanbaru"
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Tanggal Jadwal
                            </label>
                            <input
                                type="date"
                                value={data.scheduled_date}
                                onChange={(e) => setData('scheduled_date', e.target.value)}
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            />
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Rincian Barang yang Diminta (Demand)
                            </span>
                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center gap-1 rounded bg-slate-200 hover:bg-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                            >
                                <Plus className="h-3 w-3" /> Tambah Baris
                            </button>
                        </div>

                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-2">Produk / SKU Varian</th>
                                    <th className="px-4 py-2 w-36 text-center">Permintaan (Demand)</th>
                                    <th className="px-4 py-2 w-16 text-center">Hapus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.map((l, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2">
                                            <select
                                                value={l.variant_sku}
                                                onChange={(e) => updateLine(idx, 'variant_sku', e.target.value)}
                                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                                            >
                                                {products.map((p) => (
                                                    <option key={p.variant_sku} value={p.variant_sku}>
                                                        {p.variant_sku} — {p.name} ({p.size}/{p.color})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={l.qty_demand}
                                                onChange={(e) => updateLine(idx, 'qty_demand', e.target.value)}
                                                className="w-24 text-center rounded border border-slate-300 py-1 text-xs font-bold text-slate-900"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(idx)}
                                                className="text-slate-400 hover:text-rose-600 p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </InventoryLayout>
    );
}

