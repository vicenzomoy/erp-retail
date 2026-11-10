import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import SalesLayout from '@/Layouts/SalesLayout';
import {
    ArrowLeft,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ShieldAlert,
    Info,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Create({ invoices = [], selectedInvoiceId = '' }) {
    const [selectedId, setSelectedId] = useState(
        selectedInvoiceId || invoices.find((i) => i.is_eligible_14_days)?.id || invoices[0]?.id || ''
    );

    const activeInvoice = invoices.find((i) => i.id === selectedId);

    const { data, setData, post, processing, errors } = useForm({
        customer_invoice_id: selectedId,
        reason: 'Barang tidak sesuai / salah ukuran',
        lines: (activeInvoice?.lines || []).map((l) => ({
            customer_invoice_line_id: l.id,
            variant_sku: l.variant_sku,
            product_name: l.product_name,
            qty_invoiced: l.qty_invoiced,
            qty_requested: 1, // default 1 pcs
            unit_price: l.unit_price,
            notes: '',
        })),
    });

    const handleInvoiceChange = (invId) => {
        setSelectedId(invId);
        const inv = invoices.find((i) => i.id === invId);
        setData({
            ...data,
            customer_invoice_id: invId,
            lines: (inv?.lines || []).map((l) => ({
                customer_invoice_line_id: l.id,
                variant_sku: l.variant_sku,
                product_name: l.product_name,
                qty_invoiced: l.qty_invoiced,
                qty_requested: 1,
                unit_price: l.unit_price,
                notes: '',
            })),
        });
    };

    const handleLineQtyChange = (index, value) => {
        const updated = [...data.lines];
        const num = Math.max(0, parseInt(value, 10) || 0);
        const maxQty = updated[index].qty_invoiced;
        updated[index].qty_requested = Math.min(num, maxQty);
        setData('lines', updated);
    };

    const handleLineNotesChange = (index, value) => {
        const updated = [...data.lines];
        updated[index].notes = value;
        setData('lines', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('sales.returns.store'));
    };

    const isOver14Days = activeInvoice && !activeInvoice.is_eligible_14_days;

    return (
        <SalesLayout
            title="Ajukan Retur Pelanggan"
            breadcrumbs={[
                { label: 'Penjualan', href: route('sales.orders.index') },
                { label: 'Retur Pelanggan', href: route('sales.returns.index') },
                { label: 'Buat Retur Baru' },
            ]}
        >
            <Head title="Ajukan Retur Pelanggan (Maks 14 Hari) — Bara Wear" />

            <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl mx-auto">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-indigo-600" />
                            <span>Pengajuan Retur Barang Pelanggan (Sales)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Aturan SOP PT Bara Ritel Nusantara: Permintaan retur wajib diajukan maksimal 14 hari kalender sejak faktur/pengiriman.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('sales.returns.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali
                        </Link>

                        <button
                            type="submit"
                            disabled={processing || isOver14Days}
                            className={`inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold text-white shadow-xs transition ${
                                isOver14Days
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                            }`}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Kirim Permintaan Retur ke Gudang</span>
                        </button>
                    </div>
                </div>

                {/* 14 Days Policy Alert */}
                {isOver14Days && (
                    <div className="rounded border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-rose-900">
                                Permintaan Retur Tidak Diizinkan (&gt; 14 Hari)
                            </h4>
                            <p className="mt-0.5 leading-relaxed">
                                Faktur <span className="font-mono font-semibold">{activeInvoice?.id}</span> telah diterbitkan pada {activeInvoice?.invoice_date} ({activeInvoice?.days_since_invoice} hari yang lalu). Berdasarkan ketentuan SOP perusahaan, barang tidak dapat diretur jika telah melewati batas maksimal 14 hari.
                            </p>
                        </div>
                    </div>
                )}

                {activeInvoice && !isOver14Days && (
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                                Memenuhi Syarat Batas Retur: Faktur diterbitkan {activeInvoice.days_since_invoice} hari yang lalu (Batas maksimal: 14 hari).
                            </span>
                        </div>
                        <span className="font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px]">
                            VALID ≤ 14 HARI
                        </span>
                    </div>
                )}

                {/* Invoice & Customer Info Card */}
                <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                        Pilih Faktur Pelanggan Yang Akan Diretur
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Faktur Pelanggan (Customer Invoice)
                            </label>
                            <select
                                value={selectedId}
                                onChange={(e) => handleInvoiceChange(e.target.value)}
                                className="w-full rounded border border-slate-300 py-1.5 px-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                            >
                                {invoices.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.id} — {inv.customer_name} ({inv.invoice_date} • {inv.days_since_invoice} hari {inv.is_eligible_14_days ? '✓' : '✗ Lewat 14 Hari'})
                                    </option>
                                ))}
                            </select>
                            {errors.customer_invoice_id && (
                                <p className="text-[11px] text-rose-600 mt-1">{errors.customer_invoice_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Pelanggan
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={activeInvoice ? `${activeInvoice.customer_name} (${activeInvoice.customer_id})` : '-'}
                                className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Sales Order Terkait
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={activeInvoice?.sales_order_id || '-'}
                                className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-mono text-slate-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                            Alasan Pengajuan Retur Pelanggan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows="2"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            placeholder="Jelaskan alasan retur (contoh: Ukuran kekecilan, cacat jahitan pabrik, tidak sesuai pesanan)..."
                            className="w-full rounded border border-slate-300 py-1.5 px-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                        ></textarea>
                        {errors.reason && (
                            <p className="text-[11px] text-rose-600 mt-1">{errors.reason}</p>
                        )}
                    </div>
                </div>

                {/* Items to Return Table */}
                <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Pilih Produk &amp; Jumlah Yang Mau Diretur
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Jumlah retur tidak boleh melebihi jumlah faktur asli
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/60 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5">SKU / Varian</th>
                                    <th className="px-4 py-2.5">Nama Produk</th>
                                    <th className="px-4 py-2.5 text-right">Harga Jual</th>
                                    <th className="px-4 py-2.5 text-center">Qty di Faktur</th>
                                    <th className="px-4 py-2.5 text-center w-36">Qty Diretur <span className="text-rose-500">*</span></th>
                                    <th className="px-4 py-2.5">Catatan Kerusakan / Alasan Spesifik</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.map((line, idx) => (
                                    <tr key={line.variant_sku} className="hover:bg-slate-50/70">
                                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                            {line.variant_sku}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            {line.product_name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                                            {formatRp(line.unit_price)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-slate-600">
                                            {line.qty_invoiced} pcs
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                max={line.qty_invoiced}
                                                value={line.qty_requested}
                                                onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                                                className="w-24 rounded border border-slate-300 py-1 px-2 text-center text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={line.notes}
                                                onChange={(e) => handleLineNotesChange(idx, e.target.value)}
                                                placeholder="Contoh: Jahitan lepas di lengan..."
                                                className="w-full rounded border border-slate-200 py-1 px-2 text-xs focus:border-indigo-500 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </SalesLayout>
    );
}

