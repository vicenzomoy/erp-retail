import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    CheckCircle2,
    ArrowRightLeft,
    Package,
    Layers,
    FileText,
    AlertTriangle,
    Printer,
    DollarSign,
    MapPin,
} from 'lucide-react';

export default function Show({ transfer, stockMoves = [], relatedDocs = [], auditLogs = [] }) {
    const isDone = transfer.status === 'done';

    const { data, setData, post, processing, errors } = useForm({
        lines: transfer.lines.map((l) => ({
            id: l.id,
            qty_done: isDone ? l.qty_done : (l.qty_done > 0 ? l.qty_done : l.qty_demand),
        })),
        idempotency_key: `val_${transfer.id}_${Date.now()}`,
    });

    const handleLineQtyChange = (lineId, val) => {
        const num = parseFloat(val) || 0;
        setData('lines', data.lines.map((item) =>
            item.id === lineId ? { ...item, qty_done: num } : item
        ));
    };

    const handleValidate = (e) => {
        e.preventDefault();
        post(route('inventory.transfers.validate', transfer.id), {
            preserveScroll: true,
        });
    };

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const totalDemand = transfer.lines.reduce((a, b) => a + b.qty_demand, 0);
    const totalDone = transfer.lines.reduce((a, b) => a + b.qty_done, 0);

    return (
        <InventoryLayout
            title={`Transfer ${transfer.id}`}
            breadcrumbs={[
                { label: 'Operasi', href: route('inventory.overview') },
                { label: 'Transfer Internal', href: route('inventory.transfers.index') },
                { label: transfer.id },
            ]}
        >
            <Head title={`Transfer ${transfer.id} — Bara Wear`} />

            {/* Odoo Form Action Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('inventory.transfers.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {!isDone ? (
                        <button
                            type="button"
                            onClick={handleValidate}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {processing ? 'Memvalidasi...' : 'Validasi Transfer'}
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Transfer Selesai (Done)
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Bukti Transfer
                    </button>
                </div>

                {/* Status Bar / Breadcrumb Pipa */}
                <OdooStatusBar
                    status={transfer.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'ready', label: 'Siap Transfer (Ready)' },
                        { key: 'done', label: 'Selesai (Done)' },
                    ]}
                />
            </div>

            {/* Error notifications (T-36) */}
            {errors.stock && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Penolakan Mutasi Stok (Aturan SR-16 / Skenario T-36):</span>
                        <p className="mt-1">{errors.stock}</p>
                    </div>
                </div>
            )}

            {/* Odoo White Sheet Form View */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Sheet Top: Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {transfer.id}
                            </h1>
                            <OdooBadge status={transfer.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Dokumen Pemindahan Barang Antar-Lokasi (Internal Transfer)
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex items-center gap-2">
                        <OdooSmartButton
                            icon={Layers}
                            count={stockMoves.length}
                            label="Stock Moves"
                        />
                    </div>
                </div>

                {/* General Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Lokasi Asal (From):</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                {transfer.location_from} — {transfer.location_from_name}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Lokasi Tujuan (To):</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                                {transfer.location_to} — {transfer.location_to_name}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Tanggal Pengiriman:</span>
                            <span className="text-slate-800 font-medium">
                                {transfer.scheduled_date || '-'}
                            </span>
                        </div>
                        {isDone && (
                            <div className="flex items-baseline">
                                <span className="w-36 font-semibold text-slate-500">Divalidasi Oleh:</span>
                                <span className="text-slate-700 font-medium">
                                    {transfer.validated_by || 'Warehouse User'} ({transfer.validated_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rule notice */}
                {!isDone && (
                    <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                        <div className="flex items-start gap-2">
                            <ArrowRightLeft className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Ketentuan Transfer Persediaan (Skenario T-35 & T-36):</span>
                                <p className="mt-0.5 text-slate-600">
                                    Transfer hanya dapat divalidasi jika kuantitas barang yang ditransfer <strong>tidak melebihi stok Available (ATP)</strong> di lokasi asal ({transfer.location_from}). Perpindahan ini tidak mengubah total persediaan atau total nilai aset perusahaan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lines Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-slate-500" />
                            Daftar Barang yang Ditransfer
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {transfer.lines.length} Baris
                        </span>
                    </div>

                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                <th className="px-4 py-2.5 text-center">Stok Asal ({transfer.location_from})</th>
                                <th className="px-4 py-2.5 text-center">Available Asal (ATP)</th>
                                <th className="px-4 py-2.5 text-center">Permintaan (Demand)</th>
                                <th className="px-4 py-2.5 text-center">Ditransfer (Done)</th>
                                <th className="px-4 py-2.5 text-center">Stok Tujuan ({transfer.location_to})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transfer.lines.map((line, idx) => {
                                const currentInput = data.lines.find((x) => x.id === line.id);
                                return (
                                    <tr key={line.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">
                                                {line.product_name} ({line.size} / {line.color})
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700 font-medium">
                                            {line.from_on_hand} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                {line.from_available} {line.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                                            {line.qty_demand} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!isDone ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={currentInput ? currentInput.qty_done : line.qty_demand}
                                                    onChange={(e) => handleLineQtyChange(line.id, e.target.value)}
                                                    className="w-20 text-center rounded border border-slate-300 py-1 text-xs font-bold text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                                                />
                                            ) : (
                                                <span className="font-black text-emerald-700 text-sm">
                                                    {line.qty_done} {line.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700 font-medium">
                                            {line.to_on_hand} {line.unit}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50/70 font-semibold text-slate-800">
                            <tr>
                                <td colSpan="3" className="px-4 py-2.5 text-right uppercase text-[11px]">
                                    Total:
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold">
                                    {totalDemand} pcs
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-emerald-800">
                                    {isDone ? `${totalDone} pcs` : `${data.lines.reduce((a, b) => a + Number(b.qty_done || 0), 0)} pcs`}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stock Moves Audit Section (If Done) */}
                {stockMoves.length > 0 && (
                    <div className="border-t border-slate-200 pt-5 mt-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Mutasi Persediaan Tercatat (Stock Ledger)
                        </h4>
                        <div className="space-y-2">
                            {stockMoves.map((sm) => (
                                <div
                                    key={sm.id}
                                    className="flex items-center justify-between rounded border border-slate-200 bg-slate-50/50 p-2.5 text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{sm.sku}</span>
                                        <span className="text-slate-500">|</span>
                                        <span className="text-slate-600">Dari: <strong>{sm.from}</strong></span>
                                        <span className="text-slate-500">➔</span>
                                        <span className="text-slate-600">Ke: <strong>{sm.to}</strong></span>
                                        <span className="text-slate-500">|</span>
                                        <span className="text-slate-600">Kuantitas: <strong>{sm.qty} pcs</strong></span>
                                    </div>
                                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        Nilai Standard: {formatRp(sm.total_value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="internal_transfer"
                documentId={transfer.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </InventoryLayout>
    );
}

