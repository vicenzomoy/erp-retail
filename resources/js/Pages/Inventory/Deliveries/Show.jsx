import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    CheckCircle2,
    Truck,
    Package,
    Layers,
    FileText,
    Receipt,
    AlertTriangle,
    Printer,
    DollarSign,
    Eye,
} from 'lucide-react';

export default function Show({
    delivery,
    backorders = [],
    stockMoves = [],
    relatedDocs = [],
    auditLogs = [],
}) {
    const { auth } = usePage().props;
    const isReadOnlyRole = ['procurement', 'sales'].includes(auth?.user?.role_id);
    // Form for partial or full delivery validation
    const { data, setData, post, processing, errors } = useForm({
        lines: delivery.lines.map((l) => ({
            id: l.id,
            qty_done: delivery.status === 'done' ? l.qty_done : (l.qty_done > 0 ? l.qty_done : l.qty_demand),
        })),
        idempotency_key: `val_${delivery.id}_${Date.now()}`,
    });

    const isDone = delivery.status === 'done';

    const handleLineQtyChange = (lineId, val) => {
        const num = parseFloat(val) || 0;
        setData('lines', data.lines.map((item) =>
            item.id === lineId ? { ...item, qty_done: num } : item
        ));
    };

    const handleValidate = (e) => {
        e.preventDefault();
        post(route('inventory.deliveries.validate', delivery.id), {
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

    const totalDemand = delivery.lines.reduce((acc, l) => acc + l.qty_demand, 0);
    const totalDone = delivery.lines.reduce((acc, l) => acc + l.qty_done, 0);
    const totalCogs = delivery.lines.reduce((acc, l) => acc + l.cogs_total, 0);

    return (
        <InventoryLayout
            title={`Pengiriman ${delivery.id}`}
            breadcrumbs={[
                { label: 'Operasi', href: route('inventory.overview') },
                { label: 'Pengiriman', href: route('inventory.deliveries.index') },
                { label: delivery.id },
            ]}
        >
            <Head title={`Pengiriman ${delivery.id} — Bara Wear`} />

            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-rose-900">Validasi Pengiriman Gagal:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                {Object.values(errors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Odoo Form Action Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('inventory.deliveries.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {!isDone ? (
                        !isReadOnlyRole && (
                            <button
                                type="button"
                                onClick={handleValidate}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {processing ? 'Memvalidasi...' : 'Validasi Pengiriman'}
                            </button>
                        )
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Telah Tervalidasi (Done)
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Surat Jalan
                    </button>
                </div>

                {/* Status Bar / Breadcrumb Pipa */}
                <OdooStatusBar
                    status={delivery.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'ready', label: 'Siap (Ready)' },
                        { key: 'done', label: 'Selesai (Done)' },
                    ]}
                />
            </div>

            {/* Odoo White Sheet Form View */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Sheet Top: Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {delivery.id}
                            </h1>
                            <OdooBadge status={delivery.status} />
                            {delivery.is_backorder && (
                                <span className="rounded bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 border border-purple-300">
                                    Backorder
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Surat Jalan Pengiriman Barang Pesanan Penjualan
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex items-center gap-2">
                        <OdooSmartButton
                            icon={Layers}
                            count={stockMoves.length}
                            label="Stock Moves"
                        />
                        {backorders.length > 0 && (
                            <OdooSmartButton
                                icon={Truck}
                                count={backorders.length}
                                label="Backorders"
                                href={route('inventory.deliveries.show', backorders[0].id)}
                                active={true}
                            />
                        )}
                        {isDone && (
                            <OdooSmartButton
                                icon={DollarSign}
                                count={formatRp(totalCogs)}
                                label="COGS Diakui"
                            />
                        )}
                    </div>
                </div>

                {/* General Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-32 font-semibold text-slate-500">Sales Order Terkait:</span>
                            <Link
                                href={route('sales.orders.show', delivery.sales_order_id)}
                                className="font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition"
                            >
                                {delivery.sales_order_id} &rarr;
                            </Link>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-32 font-semibold text-slate-500">Pelanggan:</span>
                            <div>
                                <span className="font-bold text-slate-900">{delivery.customer_name}</span>
                                {delivery.customer_city && (
                                    <span className="text-slate-500 ml-1">({delivery.customer_city})</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-32 font-semibold text-slate-500">Alamat Tujuan:</span>
                            <span className="text-slate-700">{delivery.location_to || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Lokasi Gudang Asal:</span>
                            <span className="font-semibold text-slate-900 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                {delivery.location_from} ({delivery.location_from_name})
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Tanggal Pengiriman:</span>
                            <span className="text-slate-800 font-medium">
                                {delivery.scheduled_date || '-'}
                            </span>
                        </div>
                        {isDone && (
                            <div className="flex items-baseline">
                                <span className="w-36 font-semibold text-slate-500">Divalidasi Oleh / Pada:</span>
                                <span className="text-slate-700 font-medium">
                                    {delivery.validated_by || 'Warehouse User'} ({delivery.validated_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Warning / Notice for Partial Delivery & Backorder */}
                {!isDone && (
                    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Pengujian Pengiriman Parsial & Backorder (Skenario T-15):</span>
                                <p className="mt-0.5 text-amber-800">
                                    Ubah kolom <strong>"Terkirim (Done)"</strong> di bawah jika gudang hanya mengirimkan sebagian barang (misal 2 dari 4 kaos). Sistem akan secara otomatis mengurangkan stok on-hand sesuai jumlah terkirim, mengakui COGS untuk unit tersebut, dan membuat dokumen <strong>Backorder</strong> untuk sisa item secara otomatis.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Operations Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-slate-500" />
                            Daftar Barang yang Dikirim (Operations Lines)
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {delivery.lines.length} Baris
                        </span>
                    </div>

                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                <th className="px-4 py-2.5">Ukuran / Warna</th>
                                <th className="px-4 py-2.5 text-center">Stok On Hand</th>
                                <th className="px-4 py-2.5 text-center">Permintaan (Demand)</th>
                                <th className="px-4 py-2.5 text-center">Terkirim (Done)</th>
                                {isDone && (
                                    <>
                                        <th className="px-4 py-2.5 text-right">Biaya/Unit (Cost)</th>
                                        <th className="px-4 py-2.5 text-right">Pengakuan COGS</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {delivery.lines.map((line, idx) => {
                                const currentInput = data.lines.find((x) => x.id === line.id);
                                return (
                                    <tr key={line.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">{line.product_name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {line.size} / {line.color}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-medium text-slate-700">
                                                {line.current_on_hand} {line.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                                            {line.qty_demand} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!isDone && !isReadOnlyRole ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={line.qty_demand}
                                                    step="1"
                                                    value={currentInput ? currentInput.qty_done : line.qty_demand}
                                                    onChange={(e) => handleLineQtyChange(line.id, e.target.value)}
                                                    className="w-24 text-center rounded border border-slate-300 py-1 text-xs font-bold text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                                                />
                                            ) : (
                                                <span className="font-black text-emerald-700 text-sm">
                                                    {line.qty_done} {line.unit}
                                                </span>
                                            )}
                                        </td>
                                        {isDone && (
                                            <>
                                                <td className="px-4 py-3 text-right text-slate-600 font-medium">
                                                    {formatRp(line.cogs_per_unit)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                    {formatRp(line.cogs_total)}
                                                </td>
                                            </>
                                        )}
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
                                {isDone && (
                                    <>
                                        <td></td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900">
                                            {formatRp(totalCogs)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stock Moves Audit Section (If Done) */}
                {stockMoves.length > 0 && (
                    <div className="border-t border-slate-200 pt-5 mt-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-slate-500" />
                            Mutasi Persediaan & Jurnal Terkait (Audit Trail)
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
                                        <span className="text-slate-600">Kuantitas: <strong>{sm.qty} pcs</strong></span>
                                        <span className="text-slate-500">|</span>
                                        <span className="text-slate-600">Nilai: <strong>{formatRp(sm.total_value)}</strong></span>
                                    </div>
                                    {sm.journal_entry_no && (
                                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            Jurnal COGS: {sm.journal_entry_no} (Debit 5000 / Kredit 1200)
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
                documentType="delivery_order"
                documentId={delivery.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </InventoryLayout>
    );
}

