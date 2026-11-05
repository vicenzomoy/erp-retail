import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    Scale,
    ShieldAlert,
    ShieldCheck,
    ArrowUpRight,
    RefreshCw,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Show({
    bill,
    matchMatrix = null,
    mismatchReport = null,
    apLedger = { balance: 0, rows: [] },
    relatedDocs = [],
    auditLogs = [],
}) {
    const isDraft = bill.status === 'draft';
    const isPosted = bill.status === 'posted';
    const isPaid = bill.status === 'paid';

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
            title={`Vendor Bill ${bill.id}`}
            breadcrumbs={[
                { label: 'Vendor Bills (S-12)', href: route('accounting.bills.index') },
                { label: bill.id },
            ]}
        >
            <Head title={`Vendor Bill ${bill.id} — Bara Wear`} />

            {/* Action Bar & Status Pipe */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.bills.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {isDraft && (
                        <button
                            type="button"
                            onClick={handlePostBill}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {processing ? 'Memvalidasi Three-Way Match...' : 'Post Vendor Bill'}
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
                            Register Payment (S-13)
                        </Link>
                    )}

                    {(isPosted || isPaid) && (
                        <button
                            type="button"
                            onClick={handlePostBill}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Uji Idempotensi Posting Ulang (SR-17)"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                            Uji Post Ulang (Idempotent)
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak
                    </button>
                </div>

                <OdooStatusBar
                    status={bill.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'posted', label: 'Posted (Terbit AP)' },
                        { key: 'paid', label: 'Paid (Lunas)' },
                    ]}
                />
            </div>

            {/* Error / Mismatch Banner (T-24) */}
            {(errors.three_way_match || mismatchReport) && (
                <div className="mb-5 rounded-lg border-2 border-rose-400 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs">
                    <div className="flex items-start gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-black uppercase">
                                Pemblokiran Three-Way Match (SR-06 &amp; SR-13 / Skenario T-24):
                            </span>
                            <p className="mt-1 font-medium">
                                {errors.three_way_match || mismatchReport?.reason}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Odoo White Sheet */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Header & Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {bill.id}
                            </h1>
                            <OdooBadge status={bill.status} />
                            {bill.receipt_id && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Three-Way Match Verified ({bill.receipt_id})
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Faktur Tagihan Pemasok (Vendor Bill) &bull; PPN 11% Per Baris (F-14 &amp; F-23)
                        </p>
                    </div>

                    {/* Smart Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {bill.receipt_id && (
                            <OdooSmartButton
                                icon={PackageCheck}
                                count={bill.receipt_id}
                                label="Accepted Receipt"
                                href={route('inventory.receipts.show', bill.receipt_id)}
                            />
                        )}
                        {bill.journal_entry_id && (
                            <OdooSmartButton
                                icon={BookOpen}
                                count={bill.journal_entry_no || 'Jurnal AP'}
                                label="Journal Entry"
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
                                    : undefined
                            }
                        />
                        <OdooSmartButton
                            icon={Scale}
                            count={formatRp(apLedger.balance)}
                            label="Ledger AP (2100)"
                            href={route('accounting.ledger', { account: '2100' })}
                        />
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-xs">
                    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Informasi Pemasok (Vendor)
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                            {bill.vendor_name} ({bill.vendor_id})
                        </div>
                        <div className="text-slate-600">
                            Kota: {bill.vendor_city || 'Indonesia'} &bull; Termin: <strong>{bill.payment_terms}</strong>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Referensi Three-Way Match
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Purchase Order:</span>
                            <span className="font-mono font-bold text-slate-900">
                                {bill.purchase_order_id || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Accepted Receipt:</span>
                            {bill.receipt_id ? (
                                <Link
                                    href={route('inventory.receipts.show', bill.receipt_id)}
                                    className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 hover:underline"
                                >
                                    <span>{bill.receipt_id}</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                </Link>
                            ) : (
                                <span className="font-mono text-slate-400">—</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Tanggal &amp; Status Posting
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Tanggal Bill / Tempo:</span>
                            <span className="font-semibold text-slate-800">
                                {bill.bill_date || '—'} / {bill.due_date || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Jurnal Terposting:</span>
                            {bill.journal_entry_id ? (
                                <Link
                                    href={route('accounting.journals.show', bill.journal_entry_id)}
                                    className="font-mono font-bold text-teal-700 hover:underline"
                                >
                                    {bill.journal_entry_no}
                                </Link>
                            ) : (
                                <span className="text-slate-400 italic">Belum diposting</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items & Three-Way Match Table */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Rincian Baris Tagihan &amp; Bukti Three-Way Match (PO &mdash; Receipt &mdash; Bill)
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2.5">SKU / Produk</th>
                                    <th className="px-3 py-2.5 text-center">PO Qty</th>
                                    <th className="px-3 py-2.5 text-center bg-emerald-50/70 text-emerald-900">
                                        Receipt Accepted
                                    </th>
                                    <th className="px-3 py-2.5 text-center bg-rose-50/70 text-rose-900">
                                        Receipt Rejected
                                    </th>
                                    <th className="px-3 py-2.5 text-center">Qty Ditagih (Bill)</th>
                                    <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                                    <th className="px-3 py-2.5 text-right">DPP (Untaxed)</th>
                                    <th className="px-3 py-2.5 text-right">PPN 11%</th>
                                    <th className="px-3 py-2.5 text-right">Total Baris</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bill.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-6 text-center text-slate-400 italic">
                                            Dokumen saldo awal (Opening Balance AP) — nilai total tercantum pada ringkasan di bawah.
                                        </td>
                                    </tr>
                                ) : (
                                    bill.lines.map((l) => {
                                        const draftLine = data.lines.find((dl) => dl.variant_sku === l.variant_sku);
                                        return (
                                            <tr key={l.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-3">
                                                    <div className="font-bold text-slate-900">{l.product_name}</div>
                                                    <div className="font-mono text-[11px] text-slate-500">{l.variant_sku}</div>
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono">{l.qty_ordered} {l.unit}</td>
                                                <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                                    {l.qty_accepted} {l.unit}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono text-rose-600 bg-rose-50/40">
                                                    {l.qty_rejected} {l.unit}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono font-black text-slate-900">
                                                    {isDraft ? (
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            value={draftLine?.qty_billed ?? l.qty_billed}
                                                            onChange={(e) => handleDraftQtyChange(l.variant_sku, e.target.value)}
                                                            className="w-20 rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs font-bold"
                                                        />
                                                    ) : (
                                                        `${l.qty_billed} ${l.unit}`
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono">{formatRp(l.unit_price)}</td>
                                                <td className="px-3 py-3 text-right font-mono font-semibold">
                                                    {formatRp(l.subtotal_before_tax)}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono text-teal-700 font-semibold">
                                                    {formatRp(l.tax_amount)}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
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

                {/* Totals & Payment Reconciliation Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-100 pt-5">
                    <div className="text-xs text-slate-600 space-y-1 max-w-md">
                        <div className="font-bold text-slate-800">Catatan Dokumen:</div>
                        <p>{bill.notes || '—'}</p>
                    </div>

                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>DPP (Subtotal Belum Pajak):</span>
                            <span className="font-mono font-semibold text-slate-900">
                                {formatRp(bill.subtotal_before_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN Masukan (11%):</span>
                            <span className="font-mono font-semibold text-teal-700">
                                {formatRp(bill.total_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Total Tagihan (Grand Total):</span>
                            <span className="font-mono">{formatRp(bill.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Telah Dibayar (Paid):</span>
                            <span className="font-mono">{formatRp(bill.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-amber-800">
                            <span>Sisa Utang (Amount Residual):</span>
                            <span className="font-mono">{formatRp(bill.amount_residual)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BUKTI WAJIB T-23: LEDGER AP (2100 - UTANG USAHA) */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Buku Besar Utang Usaha / Ledger AP (Akun 2100)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Bukti mutasi peningkatan Utang Usaha (AP) sebesar nilai tagihan terposting (T-23)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
                            Saldo Akhir AP (2100): {formatRp(apLedger.balance)}
                        </span>
                        <Link
                            href={route('accounting.ledger', { account: '2100' })}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                            Buka General Ledger Lengkap
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2">No. Jurnal</th>
                                <th className="px-3 py-2">Tanggal</th>
                                <th className="px-3 py-2">Dokumen Sumber</th>
                                <th className="px-3 py-2">Keterangan</th>
                                <th className="px-3 py-2 text-right">Debit (Pelunasan)</th>
                                <th className="px-3 py-2 text-right">Kredit (Tagihan AP)</th>
                                <th className="px-3 py-2 text-right">Saldo Berjalan AP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {apLedger.rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className={r.source_document_id === bill.id ? 'bg-teal-50/70 font-semibold' : ''}
                                >
                                    <td className="px-3 py-2 font-mono font-bold text-teal-700">
                                        <Link href={route('accounting.journals.show', r.journal_entry_id)} className="hover:underline">
                                            {r.entry_no}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">{r.entry_date}</td>
                                    <td className="px-3 py-2 font-mono text-slate-800">{r.source_document_id}</td>
                                    <td className="px-3 py-2 text-slate-700">{r.description}</td>
                                    <td className="px-3 py-2 text-right font-mono text-emerald-700">
                                        {r.debit > 0 ? formatRp(r.debit) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-amber-800 font-bold">
                                        {r.credit > 0 ? formatRp(r.credit) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                        {formatRp(r.running_balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Odoo Form Footer: Related Docs, Log Notes, Audit Trail */}
            <OdooFormFooter
                documentType="vendor_bill"
                documentId={bill.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </AccountingLayout>
    );
}

