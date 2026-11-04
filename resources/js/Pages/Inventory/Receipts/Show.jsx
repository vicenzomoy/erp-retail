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
    ArrowDownLeft,
    Package,
    Layers,
    FileText,
    AlertTriangle,
    Printer,
    DollarSign,
    ShieldCheck,
} from 'lucide-react';

export default function Show({ receipt, stockMoves = [], relatedDocs = [], auditLogs = [] }) {
    const isValidated = receipt.status === 'validated';

    const { data, setData, post, processing, errors } = useForm({
        lines: receipt.lines.map((l) => ({
            id: l.id,
            qty_accepted: isValidated ? l.qty_accepted : l.qty_accepted,
            qty_rejected: isValidated ? l.qty_rejected : l.qty_rejected,
            rejection_reason: l.rejection_reason || '',
        })),
        idempotency_key: `val_${receipt.id}_${Date.now()}`,
    });

    const handleLineChange = (lineId, field, val) => {
        const value = field === 'rejection_reason' ? val : (parseFloat(val) || 0);
        setData('lines', data.lines.map((item) =>
            item.id === lineId ? { ...item, [field]: value } : item
        ));
    };

    const handleValidate = (e) => {
        e.preventDefault();
        post(route('inventory.receipts.validate', receipt.id), {
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

    const totalExpected = receipt.lines.reduce((a, b) => a + b.qty_expected, 0);
    const totalAccepted = receipt.lines.reduce((a, b) => a + b.qty_accepted, 0);
    const totalRejected = receipt.lines.reduce((a, b) => a + b.qty_rejected, 0);
    const totalValue = receipt.lines.reduce((a, b) => a + b.accepted_value, 0);

    return (
        <InventoryLayout
            title={`Penerimaan ${receipt.id}`}
            breadcrumbs={[
                { label: 'Operasi', href: route('inventory.overview') },
                { label: 'Penerimaan', href: route('inventory.receipts.index') },
                { label: receipt.id },
            ]}
        >
            <Head title={`Penerimaan ${receipt.id} — Bara Wear`} />

            {/* Odoo Form Action Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('inventory.receipts.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {!isValidated ? (
                        <button
                            type="button"
                            onClick={handleValidate}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {processing ? 'Memvalidasi QC...' : 'Validasi Penerimaan (QC)'}
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Penerimaan Tervalidasi
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Bukti Penerimaan
                    </button>
                </div>

                {/* Status Bar / Breadcrumb Pipa */}
                <OdooStatusBar
                    status={receipt.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'ready', label: 'Siap QC (Ready)' },
                        { key: 'validated', label: 'Tervalidasi (Done)' },
                    ]}
                />
            </div>

            {/* Error notifications */}
            {errors.quantity && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Penolakan Three-Way Match & QC (Aturan SR-12 / Skenario T-22):</span>
                        <p className="mt-1">{errors.quantity}</p>
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
                                {receipt.id}
                            </h1>
                            <OdooBadge status={receipt.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Bukti Penerimaan Barang & Pemeriksaan Kualitas (QC Inspection)
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex items-center gap-2">
                        <OdooSmartButton
                            icon={Layers}
                            count={stockMoves.length}
                            label="Stock Moves"
                        />
                        {isValidated && (
                            <OdooSmartButton
                                icon={DollarSign}
                                count={formatRp(totalValue)}
                                label="Persediaan Masuk"
                            />
                        )}
                    </div>
                </div>

                {/* General Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-32 font-semibold text-slate-500">Purchase Order (PO):</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {receipt.purchase_order_id}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-32 font-semibold text-slate-500">Vendor / Pemasok:</span>
                            <div>
                                <span className="font-bold text-slate-900">{receipt.vendor_name}</span>
                                {receipt.vendor_city && (
                                    <span className="text-slate-500 ml-1">({receipt.vendor_city})</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Gudang Tujuan:</span>
                            <span className="font-semibold text-slate-900 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                {receipt.location_to} ({receipt.location_to_name})
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Tanggal Penerimaan:</span>
                            <span className="text-slate-800 font-medium">
                                {receipt.receipt_date || '-'}
                            </span>
                        </div>
                        {isValidated && (
                            <div className="flex items-baseline">
                                <span className="w-36 font-semibold text-slate-500">Divalidasi Oleh:</span>
                                <span className="text-slate-700 font-medium">
                                    {receipt.validated_by || 'Warehouse User'} ({receipt.validated_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* QC Inspection Instructions / Rules */}
                {!isValidated && (
                    <div className="mb-6 rounded-md border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Ketentuan Quality Control (Skenario T-21 & T-22):</span>
                                <p className="mt-0.5 text-blue-800">
                                    Petugas memeriksa barang yang datang. Masukkan kuantitas yang lolos (<strong>Accepted</strong>) dan barang cacat/rusak (<strong>Rejected</strong>). Hanya barang Accepted yang akan menambah stok siap jual di gudang.
                                    <br />
                                    <em>Aturan SR-12: Total Accepted + Rejected <strong>TIDAK BOLEH</strong> melebihi kuantitas PO awal.</em>
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
                            Rincian Pemeriksaan Fisik Barang (QC Lines)
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {receipt.lines.length} Baris
                        </span>
                    </div>

                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                <th className="px-4 py-2.5 text-center">Stok Awal</th>
                                <th className="px-4 py-2.5 text-center">Ekspektasi PO</th>
                                <th className="px-4 py-2.5 text-center">Diterima Baik (Accepted)</th>
                                <th className="px-4 py-2.5 text-center">Ditolak / Rusak (Rejected)</th>
                                <th className="px-4 py-2.5">Alasan Penolakan QC</th>
                                <th className="px-4 py-2.5 text-right">Nilai Masuk Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {receipt.lines.map((line, idx) => {
                                const currentInput = data.lines.find((x) => x.id === line.id);
                                return (
                                    <tr key={line.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">
                                                {line.product_name} ({line.size} / {line.color})
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                            {line.current_on_hand} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                                            {line.qty_expected} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!isValidated ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={currentInput ? currentInput.qty_accepted : line.qty_accepted}
                                                    onChange={(e) => handleLineChange(line.id, 'qty_accepted', e.target.value)}
                                                    className="w-20 text-center rounded border border-emerald-300 bg-emerald-50/40 py-1 text-xs font-bold text-emerald-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                                />
                                            ) : (
                                                <span className="font-black text-emerald-700 text-sm">
                                                    {line.qty_accepted} {line.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!isValidated ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={currentInput ? currentInput.qty_rejected : line.qty_rejected}
                                                    onChange={(e) => handleLineChange(line.id, 'qty_rejected', e.target.value)}
                                                    className="w-20 text-center rounded border border-rose-300 bg-rose-50/40 py-1 text-xs font-bold text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                                />
                                            ) : (
                                                <span className="font-bold text-rose-600">
                                                    {line.qty_rejected > 0 ? `${line.qty_rejected} ${line.unit}` : '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {!isValidated ? (
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Jahitan cacat / rusak..."
                                                    value={currentInput ? currentInput.rejection_reason : (line.rejection_reason || '')}
                                                    onChange={(e) => handleLineChange(line.id, 'rejection_reason', e.target.value)}
                                                    className="w-full rounded border border-slate-300 py-1 px-2 text-xs text-slate-800 placeholder-slate-400"
                                                />
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">
                                                    {line.rejection_reason || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                                            {formatRp(isValidated ? line.accepted_value : ((currentInput?.qty_accepted || 0) * line.unit_cost))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50/70 font-semibold text-slate-800">
                            <tr>
                                <td colSpan="2" className="px-4 py-2.5 text-right uppercase text-[11px]">
                                    Total:
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold">
                                    {totalExpected} pcs
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-emerald-800">
                                    {isValidated ? `${totalAccepted} pcs` : `${data.lines.reduce((a, b) => a + Number(b.qty_accepted || 0), 0)} pcs`}
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-rose-700">
                                    {isValidated ? (totalRejected > 0 ? `${totalRejected} pcs` : '-') : `${data.lines.reduce((a, b) => a + Number(b.qty_rejected || 0), 0)} pcs`}
                                </td>
                                <td></td>
                                <td className="px-4 py-2.5 text-right font-black text-slate-900">
                                    {formatRp(isValidated ? totalValue : data.lines.reduce((a, b, idx) => a + (Number(b.qty_accepted || 0) * (receipt.lines[idx]?.unit_cost || 0)), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stock Moves Audit Section (If Done) */}
                {stockMoves.length > 0 && (
                    <div className="border-t border-slate-200 pt-5 mt-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Mutasi Persediaan & Jurnal Penerimaan (Audit Trail)
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
                                        <span className="text-slate-600">Diterima Baik: <strong>+{sm.qty} pcs</strong></span>
                                        <span className="text-slate-500">|</span>
                                        <span className="text-slate-600">Nilai Persediaan: <strong>+{formatRp(sm.total_value)}</strong></span>
                                    </div>
                                    {sm.journal_entry_no && (
                                        <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                            Jurnal Penerimaan: {sm.journal_entry_no} (Debit 1200 Persediaan / Kredit 1400 Stock Interim)
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="receipt"
                documentId={receipt.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </InventoryLayout>
    );
}

