import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    CheckCircle2,
    Wallet,
    Printer,
    BookOpen,
    PackageCheck,
    Package,
    AlertTriangle,
    FileText,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function VendorBillShow({
    bill,
    mismatchReport = null,
    relatedDocs = [],
    auditLogs = [],
}) {
    const isDraft = bill.status === 'draft';
    const isPosted = bill.status === 'posted';

    const { data, setData, post, processing, errors } = useForm({
        lines: bill.lines.map((l) => ({
            id: l.id,
            variant_sku: l.variant_sku,
            qty_billed: l.qty_billed,
        })),
        idempotency_key: `post_${bill.id}`,
    });

    const handlePostBill = (e) => {
        e.preventDefault();
        post(route('accounting.bills.post', bill.id), {
            preserveScroll: true,
        });
    };

    const handleDraftQtyChange = (sku, val) => {
        setData(
            'lines',
            data.lines.map((l) =>
                l.variant_sku === sku ? { ...l, qty_billed: parseFloat(val) || 0 } : l
            )
        );
    };

    return (
        <AccountingLayout
            title={`Tagihan ${bill.id}`}
            breadcrumbs={[
                { label: 'Pemasok', href: route('accounting.bills.index') },
                { label: 'Tagihan Pemasok', href: route('accounting.bills.index') },
                { label: bill.id },
            ]}
        >
            <Head title={`Tagihan ${bill.id} — Bara Wear`} />

            {/* Odoo Form Action Header Bar (Persis Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.bills.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Tagihan"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {isDraft && (
                        <button
                            type="button"
                            onClick={handlePostBill}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {processing ? 'Memvalidasi...' : 'Posting Tagihan'}
                        </button>
                    )}

                    {isPosted && bill.amount_residual > 0 && (
                        <Link
                            href={route('accounting.payments.create', {
                                document_type: 'vendor_bill',
                                document_id: bill.id,
                            })}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                        >
                            <Wallet className="h-4 w-4" />
                            Bayar Tagihan
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Tagihan
                    </button>
                </div>

                <OdooStatusBar
                    status={bill.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'posted', label: 'Posted (Terbit)' },
                        { key: 'paid', label: 'Lunas (Paid)' },
                    ]}
                />
            </div>

            {/* Error / Mismatch Banner */}
            {(errors.three_way_match || mismatchReport) && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Tagihan Tidak Dapat Diposting:</span>
                        <p className="mt-1">{errors.three_way_match || mismatchReport?.reason}</p>
                    </div>
                </div>
            )}

            {/* Odoo White Sheet Form View */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Header & Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                {bill.id}
                            </h1>
                            <OdooBadge status={bill.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tagihan Pembelian Pemasok (Vendor Bill)
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex flex-wrap items-center gap-2">
                        {bill.receipt_id && (
                            <OdooSmartButton
                                icon={PackageCheck}
                                count={bill.receipt_id}
                                label="Penerimaan Gudang"
                                href={route('inventory.receipts.show', bill.receipt_id)}
                            />
                        )}
                        {bill.journal_entry_id && (
                            <OdooSmartButton
                                icon={BookOpen}
                                count={bill.journal_entry_no || 'Jurnal'}
                                label="Jurnal Akuntansi"
                                href={route('accounting.journals.show', bill.journal_entry_id)}
                            />
                        )}
                        <OdooSmartButton
                            icon={Wallet}
                            count={bill.payments?.length ?? 0}
                            label="Pembayaran"
                            href={
                                bill.payments?.length > 0
                                    ? route('accounting.payments.show', bill.payments[0].payment_id)
                                    : route('accounting.payments.index')
                            }
                        />
                    </div>
                </div>

                {/* General Information Grid (2 Kolom seperti Modul Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Purchase Order (PO):</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                {bill.purchase_order_id || 'Saldo Awal'}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Pemasok (Vendor):</span>
                            <div>
                                <span className="font-bold text-slate-900">{bill.vendor_name}</span>
                                {bill.vendor_city && (
                                    <span className="text-slate-500 ml-1">({bill.vendor_city})</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Penerimaan Gudang:</span>
                            {bill.receipt_id ? (
                                <Link
                                    href={route('inventory.receipts.show', bill.receipt_id)}
                                    className="font-bold text-emerald-700 hover:underline font-mono"
                                >
                                    {bill.receipt_id} (Tervalidasi QC) &rarr;
                                </Link>
                            ) : (
                                <span className="text-slate-500">—</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Tanggal Tagihan:</span>
                            <span className="text-slate-800 font-medium">{bill.bill_date || '—'}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Jatuh Tempo:</span>
                            <span className="text-slate-800 font-medium">{bill.due_date || '—'}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Termin Pembayaran:</span>
                            <span className="font-semibold text-slate-800">{bill.payment_terms || 'CASH'}</span>
                        </div>
                    </div>
                </div>

                {/* Tabel Rincian Barang Tagihan */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-slate-500" />
                            Daftar Barang pada Tagihan Pemasok
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {bill.lines.length} Baris
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                    <th className="px-4 py-2.5 text-center">Dipesan (PO)</th>
                                    <th className="px-4 py-2.5 text-center">Diterima Baik (QC)</th>
                                    <th className="px-4 py-2.5 text-center">Qty Ditagih</th>
                                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                    <th className="px-4 py-2.5 text-right">DPP (Sebelum Pajak)</th>
                                    <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bill.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-slate-400 italic">
                                            Dokumen saldo awal — nilai total tercantum pada ringkasan di bawah.
                                        </td>
                                    </tr>
                                ) : (
                                    bill.lines.map((l) => {
                                        const draftLine = data.lines.find(
                                            (dl) => dl.variant_sku === l.variant_sku
                                        );
                                        return (
                                            <tr key={l.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-900">{l.variant_sku}</div>
                                                    <div className="text-slate-500 text-[11px]">{l.product_name}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                                    {l.qty_ordered} {l.unit}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-emerald-700">
                                                    {l.qty_accepted} {l.unit}
                                                    {l.qty_rejected > 0 && (
                                                        <div className="text-[10px] font-semibold text-rose-600">
                                                            Ditolak QC: {l.qty_rejected} {l.unit}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-900">
                                                    {isDraft ? (
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            value={draftLine?.qty_billed ?? l.qty_billed}
                                                            onChange={(e) =>
                                                                handleDraftQtyChange(l.variant_sku, e.target.value)
                                                            }
                                                            className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs font-bold"
                                                        />
                                                    ) : (
                                                        `${l.qty_billed} ${l.unit}`
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700">
                                                    {formatRp(l.unit_price)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                                                    {formatRp(l.subtotal_before_tax)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                    {formatRp(l.tax_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(l.line_total)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Payment Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-100 pt-5">
                    <div className="text-xs text-slate-600 space-y-2 max-w-md">
                        <div>
                            <div className="font-bold text-slate-800">Catatan Tagihan:</div>
                            <p className="mt-0.5">{bill.notes || '—'}</p>
                        </div>
                        {bill.journal_entry_no && (
                            <div className="pt-1">
                                <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                                    Jurnal Terposting: {bill.journal_entry_no}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal (Sebelum Pajak):</span>
                            <span className="font-mono font-semibold text-slate-900">
                                {formatRp(bill.subtotal_before_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN (11%):</span>
                            <span className="font-mono font-semibold text-slate-800">
                                {formatRp(bill.total_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Total Tagihan:</span>
                            <span className="font-mono">{formatRp(bill.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Telah Dibayar:</span>
                            <span className="font-mono">{formatRp(bill.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-amber-800">
                            <span>Sisa Utang:</span>
                            <span className="font-mono">{formatRp(bill.amount_residual)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="vendor_bill"
                documentId={bill.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </AccountingLayout>
    );
}
