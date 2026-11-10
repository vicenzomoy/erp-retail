import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    CheckCircle2,
    Wallet,
    Printer,
    FileText,
    BookOpen,
    Package,
    ShoppingBag,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function CustomerInvoiceShow({ invoice, relatedDocs = [], auditLogs = [] }) {
    const [submittingPost, setSubmittingPost] = useState(false);

    const isDraft = invoice.status === 'draft';
    const isPosted = invoice.status === 'posted';

    const handlePostInvoice = () => {
        setSubmittingPost(true);
        router.post(
            route('accounting.invoices.post', invoice.id),
            { idempotency_key: `POST-${invoice.id}` },
            {
                preserveScroll: true,
                onFinish: () => setSubmittingPost(false),
            }
        );
    };

    return (
        <AccountingLayout
            title={`Faktur ${invoice.id}`}
            breadcrumbs={[
                { label: 'Pelanggan', href: route('accounting.invoices.index') },
                { label: 'Faktur Pelanggan', href: route('accounting.invoices.index') },
                { label: invoice.id },
            ]}
        >
            <Head title={`Faktur ${invoice.id} — Bara Wear`} />

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

                    {isDraft && (
                        <button
                            type="button"
                            onClick={handlePostInvoice}
                            disabled={submittingPost}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {submittingPost ? 'Memposting...' : 'Posting Faktur'}
                        </button>
                    )}

                    {!isDraft && invoice.amount_residual > 0 && (
                        <Link
                            href={route('accounting.payments.create', {
                                document_type: 'customer_invoice',
                                document_id: invoice.id,
                            })}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                        >
                            <Wallet className="h-4 w-4" />
                            Terima Pembayaran
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Faktur
                    </button>
                </div>

                <OdooStatusBar
                    status={invoice.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'posted', label: 'Posted (Terbit)' },
                        { key: 'paid', label: 'Lunas (Paid)' },
                    ]}
                />
            </div>

            {/* Odoo White Sheet Form View */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Sheet Top: Title & Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                {invoice.id}
                            </h1>
                            <OdooBadge status={invoice.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Faktur Penjualan Pelanggan (Customer Invoice)
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex flex-wrap items-center gap-2">
                        {invoice.sales_order_id && (
                            <OdooSmartButton
                                icon={ShoppingBag}
                                count={invoice.sales_order_id}
                                label="Sales Order"
                                href={route('sales.orders.show', invoice.sales_order_id)}
                            />
                        )}
                        {invoice.journal_entry_id && (
                            <OdooSmartButton
                                icon={BookOpen}
                                count={invoice.journal_entry_no || 'Jurnal'}
                                label="Jurnal Akuntansi"
                                href={route('accounting.journals.show', invoice.journal_entry_id)}
                            />
                        )}
                        <OdooSmartButton
                            icon={Wallet}
                            count={(invoice.payments || []).length}
                            label="Pembayaran"
                            href={
                                invoice.payments?.length > 0
                                    ? route('accounting.payments.show', invoice.payments[0].payment_id)
                                    : route('accounting.payments.index')
                            }
                        />
                    </div>
                </div>

                {/* General Information Grid (2 Kolom seperti Modul Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Sales Order Terkait:</span>
                            {invoice.sales_order_id ? (
                                <Link
                                    href={route('sales.orders.show', invoice.sales_order_id)}
                                    className="font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition font-mono"
                                >
                                    {invoice.sales_order_id} &rarr;
                                </Link>
                            ) : (
                                <span className="text-slate-600">Saldo Awal</span>
                            )}
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Pelanggan:</span>
                            <div>
                                <span className="font-bold text-slate-900">{invoice.customer_name}</span>
                                {invoice.customer_city && (
                                    <span className="text-slate-500 ml-1">({invoice.customer_city})</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Termin Pembayaran:</span>
                            <span className="font-semibold text-slate-800">{invoice.payment_terms || 'CASH'}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Tanggal Faktur:</span>
                            <span className="text-slate-800 font-medium">{invoice.invoice_date || '-'}</span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500">Jatuh Tempo:</span>
                            <span className="text-slate-800 font-medium">{invoice.due_date || '-'}</span>
                        </div>
                        {invoice.posted_at && (
                            <div className="flex items-baseline">
                                <span className="w-36 font-semibold text-slate-500">Diposting Oleh:</span>
                                <span className="text-slate-700 font-medium">
                                    {invoice.posted_by || 'Finance'} ({invoice.posted_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabel Rincian Barang Faktur */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-slate-500" />
                            Daftar Barang pada Faktur
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Item: {(invoice.lines || []).length} Baris
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Produk / SKU Varian</th>
                                    <th className="px-4 py-2.5 text-center">Qty Ditagih</th>
                                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                    <th className="px-4 py-2.5 text-right">DPP (Sebelum Pajak)</th>
                                    <th className="px-4 py-2.5 text-right">PPN 11%</th>
                                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(invoice.lines || []).map((line) => (
                                    <tr key={line.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{line.variant_sku}</div>
                                            <div className="text-slate-500 text-[11px]">
                                                {line.description || line.product_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                                            {line.qty_invoiced} {line.unit}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(line.unit_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                                            {formatRp(line.subtotal_before_tax)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                            {formatRp(line.tax_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(line.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Payment Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-100 pt-5">
                    <div className="text-xs text-slate-600 space-y-2 max-w-md">
                        <div>
                            <div className="font-bold text-slate-800">Catatan Faktur:</div>
                            <p className="mt-0.5">{invoice.notes || '—'}</p>
                        </div>
                        {invoice.journal_entry_no && (
                            <div className="pt-1">
                                <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                                    Jurnal Terposting: {invoice.journal_entry_no}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal (Sebelum Pajak):</span>
                            <span className="font-mono font-semibold text-slate-900">
                                {formatRp(invoice.subtotal_before_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN (11%):</span>
                            <span className="font-mono font-semibold text-slate-800">
                                {formatRp(invoice.total_tax)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Grand Total:</span>
                            <span className="font-mono">{formatRp(invoice.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Telah Dibayar:</span>
                            <span className="font-mono">{formatRp(invoice.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-emerald-800">
                            <span>Sisa Piutang:</span>
                            <span className="font-mono">{formatRp(invoice.amount_residual)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="customer_invoice"
                documentId={invoice.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </AccountingLayout>
    );
}
