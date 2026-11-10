import React from 'react';
import { Head, Link } from '@inertiajs/react';
import InvoicingLayout from '@/Layouts/InvoicingLayout';
import {
    ArrowLeft,
    ReceiptText,
    CheckCircle2,
    FileText,
    RotateCcw,
    Scale,
    BookOpen,
    User,
    Calendar,
    ArrowUpRight,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Show({ creditNote }) {
    return (
        <InvoicingLayout
            title={`Nota Kredit ${creditNote.id}`}
            breadcrumbs={[
                { label: 'Invoicing', href: route('invoicing.overview') },
                { label: 'Nota Kredit', href: route('invoicing.credit-notes.index') },
                { label: creditNote.id },
            ]}
        >
            <Head title={`Nota Kredit ${creditNote.id} — Bara Wear`} />

            <div className="space-y-4 max-w-5xl mx-auto">
                {/* Top Action Bar with Smart Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('accounting.credit-notes.index')}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Daftar Nota Kredit
                        </Link>

                        {/* Smart Button: Faktur Pelanggan */}
                        <Link
                            href={route('accounting.invoices.show', creditNote.original_invoice_id)}
                            className="inline-flex items-center gap-1.5 rounded border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                        >
                            <FileText className="h-3.5 w-3.5 text-teal-600" />
                            <span>Faktur: {creditNote.original_invoice_id}</span>
                        </Link>

                        {/* Smart Button: Dokumen Retur */}
                        {creditNote.customer_return_id && (
                            <Link
                                href={route('sales.returns.show', creditNote.customer_return_id)}
                                className="inline-flex items-center gap-1.5 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition"
                            >
                                <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Retur: {creditNote.customer_return_id}</span>
                            </Link>
                        )}

                        {/* Smart Button: Buku Besar Piutang */}
                        <Link
                            href={route('accounting.ledger', { account: '1100' })}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Buku Besar Piutang (1100)</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            AR Adjusted (Piutang Terpotong)
                        </span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="rounded border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Nota Kredit Pelanggan (Credit Note)
                            </span>
                            <h2 className="text-2xl font-bold font-mono text-slate-900">
                                {creditNote.id}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Diposting oleh: <span className="font-semibold text-slate-700">{creditNote.posted_by_name || 'Finance User'}</span> pada {creditNote.posted_at}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="text-xs text-slate-400 block">Total Pengurangan Piutang:</span>
                            <span className="text-2xl font-bold font-mono text-teal-800">
                                {formatRp(creditNote.grand_total)}
                            </span>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Pelanggan</span>
                            <span className="font-bold text-slate-800 text-sm">{creditNote.customer_name}</span>
                        </div>

                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Faktur Pelanggan</span>
                            <span className="font-mono font-bold text-teal-700 block">{creditNote.original_invoice_id}</span>
                        </div>

                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Dokumen Retur Asal</span>
                            <span className="font-mono font-bold text-indigo-700 block">{creditNote.customer_return_id || '-'}</span>
                        </div>

                        <div className="rounded bg-slate-50 p-3 border border-slate-100 space-y-1">
                            <span className="text-slate-400 font-semibold block">Usia Faktur Saat Retur</span>
                            <span className="font-bold text-slate-800 block">{creditNote.days_since_invoice} Hari (≤ 14 Hari)</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {creditNote.notes && (
                        <div className="rounded border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Keterangan: </span>
                            {creditNote.notes}
                        </div>
                    )}

                    {/* Line Items Table */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Rincian Barang Yang Dikreditkan
                        </h3>

                        <div className="overflow-hidden rounded border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5">SKU</th>
                                        <th className="px-4 py-2.5">Nama Produk</th>
                                        <th className="px-4 py-2.5 text-center">Kondisi</th>
                                        <th className="px-4 py-2.5 text-center">Qty Dikreditkan</th>
                                        <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                        <th className="px-4 py-2.5 text-right">Subtotal DPP</th>
                                        <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                        <th className="px-4 py-2.5 text-right">Total Kredit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {creditNote.lines.map((l) => (
                                        <tr key={l.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                                                {l.variant_sku}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                {l.product_name}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {l.condition}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-900">
                                                {l.qty_returned} pcs
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {formatRp(l.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-800">
                                                {formatRp(l.subtotal_before_tax)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {formatRp(l.tax_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-teal-800">
                                                {formatRp(l.line_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Accounting Journal Entry (AR Adjustments) Box */}
                    {creditNote.journal_entry && (
                        <div className="rounded border border-slate-200 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-teal-600" />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Jurnal Penyesuaian Akuntansi (AR Adjustment) — {creditNote.journal_entry.entry_no}
                                    </h4>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Jurnal Seimbang (Balanced)
                                </span>
                            </div>

                            <div className="overflow-hidden rounded border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Kode Akun</th>
                                            <th className="px-3 py-2">Nama Akun</th>
                                            <th className="px-3 py-2">Deskripsi Baris</th>
                                            <th className="px-3 py-2 text-right">Debit (Rp)</th>
                                            <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {creditNote.journal_entry.lines.map((jl, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/70 font-mono text-xs">
                                                <td className="px-3 py-2 font-bold text-slate-800">
                                                    {jl.account_code}
                                                </td>
                                                <td className="px-3 py-2 font-sans font-medium text-slate-700">
                                                    {jl.account_name}
                                                </td>
                                                <td className="px-3 py-2 font-sans text-slate-500">
                                                    {jl.description}
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-slate-900">
                                                    {jl.debit > 0 ? formatRp(jl.debit) : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-teal-800">
                                                    {jl.credit > 0 ? formatRp(jl.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </InvoicingLayout>
    );
}

