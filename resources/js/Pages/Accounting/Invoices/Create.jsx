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
    Truck,
    AlertTriangle,
    Check,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function CustomerInvoiceCreate({ selectedSoId, soMatrices = {} }) {
    const allMatrices = Object.values(soMatrices || {});
    const readySos = allMatrices.filter(
        (m) => m.has_done_delivery && Number(m.total_invoiceable) > 0
    );
    const otherSos = allMatrices.filter(
        (m) => !m.has_done_delivery || Number(m.total_invoiceable) <= 0
    );

    const initialSo =
        selectedSoId && soMatrices[selectedSoId]
            ? selectedSoId
            : readySos[0]?.sales_order_id || allMatrices[0]?.sales_order_id || '';

    const buildLinesForSo = (soId) => {
        const matrix = soMatrices?.[soId];
        if (!matrix || !matrix.lines) return [];
        return matrix.lines.map((line) => ({
            so_line_id: line.so_line_id,
            delivery_order_line_id: line.delivery_order_line_id,
            variant_sku: line.variant_sku,
            product_name: line.product_name,
            size: line.size,
            color: line.color,
            unit: line.unit || 'pcs',
            qty_ordered: Number(line.qty_ordered),
            qty_delivered: Number(line.qty_delivered),
            qty_already_invoiced: Number(line.qty_already_invoiced),
            max_invoiceable_qty: Number(line.max_invoiceable_qty),
            qty_invoiced: Number(
                line.max_invoiceable_qty > 0 ? line.max_invoiceable_qty : line.qty_delivered
            ),
            unit_price: Number(line.unit_price),
            discount_pct: Number(line.discount_pct || 0),
        }));
    };

    const { data, setData, processing, errors } = useForm({
        sales_order_id: initialSo,
        invoice_date: new Date().toISOString().slice(0, 10),
        notes: initialSo ? `Faktur Penjualan atas Sales Order ${initialSo}` : '',
        idempotency_key: `INV-${initialSo}-${Date.now()}`,
        auto_post: true,
        lines: buildLinesForSo(initialSo),
    });

    const currentMatrix = soMatrices?.[data.sales_order_id] || null;

    const handleSelectSo = (newSoId) => {
        setData((prev) => ({
            ...prev,
            sales_order_id: newSoId,
            notes: `Faktur Penjualan atas Sales Order ${newSoId}`,
            idempotency_key: `INV-${newSoId}-${Date.now()}`,
            lines: buildLinesForSo(newSoId),
        }));
    };

    const handleQtyChange = (idx, val) => {
        const updated = [...data.lines];
        updated[idx].qty_invoiced = val === '' ? '' : Number(val);
        setData('lines', updated);
    };

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

    const submitInvoice = (autoPost) => {
        router.post(
            route('accounting.invoices.store'),
            {
                ...data,
                auto_post: autoPost,
            },
            { preserveScroll: true }
        );
    };

    return (
        <AccountingLayout
            title="Buat Faktur Pelanggan"
            breadcrumbs={[
                { label: 'Pelanggan', href: route('accounting.invoices.index') },
                { label: 'Faktur Pelanggan', href: route('accounting.invoices.index') },
                { label: 'Buat Faktur Baru' },
            ]}
        >
            <Head title="Buat Faktur Pelanggan — Bara Wear" />

            {/* Odoo Form Action Header Bar (Persis Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.invoices.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Faktur"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => submitInvoice(true)}
                        disabled={processing || !data.sales_order_id}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {processing ? 'Memproses...' : 'Terbitkan & Posting Faktur'}
                    </button>

                    <button
                        type="button"
                        onClick={() => submitInvoice(false)}
                        disabled={processing || !data.sales_order_id}
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

            {/* Pesan Validasi Pengiriman */}
            {(errors.delivery_policy || errors.lines) && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Faktur Tidak Dapat Diterbitkan:</span>
                        <p className="mt-1">{errors.delivery_policy || errors.lines}</p>
                    </div>
                </div>
            )}

            {/* Pilihan Cepat Sales Order yang Perlu Difakturkan */}
            {readySos.length > 0 && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <div className="text-xs font-bold text-emerald-950 mb-2">
                        Pilih Sales Order yang Perlu Diurus Tagihannya ({readySos.length} SO Siap Difakturkan):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {readySos.map((so) => {
                            const isSelected = data.sales_order_id === so.sales_order_id;
                            return (
                                <button
                                    key={so.sales_order_id}
                                    type="button"
                                    onClick={() => handleSelectSo(so.sales_order_id)}
                                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition cursor-pointer ${
                                        isSelected
                                            ? 'border-emerald-700 bg-emerald-700 text-white font-bold shadow-xs'
                                            : 'border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50 font-medium'
                                    }`}
                                >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                    <span className="font-mono font-bold">{so.sales_order_id}</span>
                                    <span>&bull;</span>
                                    <span>{so.customer_name}</span>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-emerald-100 text-emerald-900'
                                        }`}
                                    >
                                        Siap Tagih: {so.total_invoiceable} pcs
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
                                Faktur Pelanggan Baru
                            </h1>
                            <OdooBadge status="draft" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tagihan diterbitkan sesuai jumlah barang yang telah dikirim oleh gudang
                        </p>
                    </div>

                    {currentMatrix?.primary_delivery_id && (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                <Truck className="h-4 w-4 text-emerald-600" />
                                Surat Jalan Gudang: {currentMatrix.primary_delivery_id} (Terkirim)
                            </span>
                        </div>
                    )}
                </div>

                {/* General Information Grid (2 Kolom Rapi seperti Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Sales Order (SO):
                            </span>
                            <select
                                value={data.sales_order_id}
                                onChange={(e) => handleSelectSo(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                            >
                                {readySos.length > 0 && (
                                    <optgroup label="Perlu Difakturkan (Barang Sudah Dikirim Gudang)">
                                        {readySos.map((m) => (
                                            <option key={m.sales_order_id} value={m.sales_order_id}>
                                                {m.sales_order_id} — {m.customer_name} (Siap Ditagih: {m.total_invoiceable} pcs)
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {otherSos.length > 0 && (
                                    <optgroup label="Sales Order Lainnya (Sudah Difakturkan / Belum Dikirim)">
                                        {otherSos.map((m) => (
                                            <option key={m.sales_order_id} value={m.sales_order_id}>
                                                {m.sales_order_id} — {m.customer_name} (
                                                {m.has_done_delivery ? 'Sudah Habis Difakturkan' : 'Belum Dikirim Gudang'})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Pelanggan:
                            </span>
                            <span className="font-bold text-slate-900">
                                {currentMatrix?.customer_name || '—'}{' '}
                                {currentMatrix?.customer_id && (
                                    <span className="text-slate-400 font-normal">
                                        ({currentMatrix.customer_id})
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
                                Tanggal Faktur:
                            </span>
                            <input
                                type="date"
                                value={data.invoice_date}
                                onChange={(e) => setData('invoice_date', e.target.value)}
                                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Status Pengiriman:
                            </span>
                            {currentMatrix?.has_done_delivery ? (
                                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Terkirim {currentMatrix.total_delivered} pcs dari {currentMatrix.total_ordered} pcs
                                </span>
                            ) : (
                                <span className="font-semibold text-rose-600">
                                    Belum ada pengiriman dari gudang
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
                                placeholder="Catatan tambahan faktur..."
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
                            Daftar Barang yang Ditagihkan
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
                                    <th className="px-4 py-2.5 text-center">Dipesan (SO)</th>
                                    <th className="px-4 py-2.5 text-center">Terkirim Gudang</th>
                                    <th className="px-4 py-2.5 text-center">Siap Ditagih</th>
                                    <th className="px-4 py-2.5 text-center">Qty Ditagih</th>
                                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                    <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {computedLines.map((line, index) => (
                                    <tr
                                        key={line.variant_sku}
                                        className={line.isOverDelivered ? 'bg-rose-50/50' : 'hover:bg-slate-50'}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">
                                                {line.product_name}
                                                {line.discount_pct > 0 && (
                                                    <span className="ml-1.5 text-amber-700 font-semibold">
                                                        (Diskon {line.discount_pct}%)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                            {line.qty_ordered} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-700">
                                            {line.qty_delivered} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                                                {line.max_invoiceable_qty} {line.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={line.qty_invoiced}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                className={`w-20 text-center rounded border py-1 text-xs font-bold focus:outline-none ${
                                                    line.isOverDelivered
                                                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                                                        : 'border-emerald-300 bg-emerald-50/40 text-emerald-900 focus:border-emerald-500'
                                                }`}
                                            />
                                            {line.isOverDelivered && (
                                                <div className="mt-0.5 text-[10px] font-bold text-rose-600">
                                                    Maks: {line.max_invoiceable_qty}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(line.unit_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                            {formatRp(line.ppn)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(line.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ringkasan Total Faktur */}
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
                            <span>Total Faktur:</span>
                            <span className="font-mono text-emerald-800">{formatRp(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AccountingLayout>
    );
}
