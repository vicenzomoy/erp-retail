import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    ArrowLeft,
    Wallet,
    Printer,
    FileText,
    BookOpen,
    Scale,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function PaymentShow({
    payment,
    bankLedger,
    relatedDocs = [],
    auditLogs = [],
}) {
    const firstAlloc = (payment.allocations || [])[0] || null;

    return (
        <AccountingLayout
            title={`Bukti Pembayaran ${payment.id}`}
            breadcrumbs={[
                { label: 'Kas & Pembayaran', href: route('accounting.payments.index') },
                { label: 'Pembayaran', href: route('accounting.payments.index') },
                { label: payment.id },
            ]}
        >
            <Head title={`Bukti Pembayaran ${payment.id} — Bara Wear`} />

            {/* Odoo Form Action Header Bar (Persis Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.payments.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Pembayaran"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {firstAlloc && firstAlloc.amount_residual > 0 && (
                        <Link
                            href={route('accounting.payments.create', {
                                document_type: firstAlloc.document_type,
                                document_id: firstAlloc.document_id,
                            })}
                            className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                        >
                            <Wallet className="h-4 w-4" />
                            Lunasi Sisa Tagihan ({formatRp(firstAlloc.amount_residual)})
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Bukti
                    </button>
                </div>

                <OdooStatusBar
                    status={payment.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'reconciled', label: 'Lunas (Reconciled)' },
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
                                {payment.id}
                            </h1>
                            <OdooBadge status={payment.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {payment.payment_type === 'inbound'
                                ? 'Bukti Penerimaan Pembayaran Pelanggan (Inbound AR)'
                                : 'Bukti Pelunasan Tagihan Pemasok (Outbound AP)'}
                        </p>
                    </div>

                    {/* Smart Buttons Odoo */}
                    <div className="flex flex-wrap items-center gap-2">
                        {firstAlloc && (
                            <OdooSmartButton
                                icon={FileText}
                                count={firstAlloc.document_id}
                                label={firstAlloc.document_label}
                                href={firstAlloc.document_url}
                            />
                        )}
                        {payment.journal_entry_id && (
                            <OdooSmartButton
                                icon={BookOpen}
                                count={payment.journal_entry_no || 'Jurnal'}
                                label="Jurnal Akuntansi"
                                href={route('accounting.journals.show', payment.journal_entry_id)}
                            />
                        )}
                        <OdooSmartButton
                            icon={Scale}
                            count={bankLedger?.account_code || '1020'}
                            label="Buku Besar Bank"
                            href={route('accounting.gl.index', {
                                account: bankLedger?.account_code || '1020',
                            })}
                        />
                    </div>
                </div>

                {/* General Information Grid (2 Kolom seperti Modul Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500">
                                {payment.party_type === 'customer'
                                    ? 'Pelanggan:'
                                    : 'Pemasok (Vendor):'}
                            </span>
                            <span className="font-bold text-slate-900">
                                {payment.party_name}{' '}
                                <span className="text-slate-400 font-normal">
                                    ({payment.party_id})
                                </span>
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500">
                                Akun Kas / Bank:
                            </span>
                            <span className="font-semibold text-slate-800">
                                {payment.bank_account_code} — {payment.bank_account_name}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500">
                                Metode Pembayaran:
                            </span>
                            <span className="font-semibold text-slate-800 uppercase">
                                {payment.payment_method}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500">
                                Tanggal Pembayaran:
                            </span>
                            <span className="text-slate-800 font-medium">
                                {payment.payment_date || '-'}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500">
                                Referensi / Memo:
                            </span>
                            <span className="font-mono text-slate-800 font-medium">
                                {payment.reference || '-'}
                            </span>
                        </div>
                        {payment.posted_at && (
                            <div className="flex items-baseline">
                                <span className="w-40 font-semibold text-slate-500">
                                    Dicatat Oleh:
                                </span>
                                <span className="text-slate-700 font-medium">
                                    {payment.posted_by || 'Finance'} ({payment.posted_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabel Alokasi Dokumen Tagihan */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="h-4 w-4 text-slate-500" />
                            Dokumen Tagihan yang Dilunasi
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            Total Alokasi: {(payment.allocations || []).length} Dokumen
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Jenis Dokumen</th>
                                    <th className="px-4 py-2.5">No. Dokumen</th>
                                    <th className="px-4 py-2.5">Mitra Bisnis</th>
                                    <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                    <th className="px-4 py-2.5 text-right">Dibayar di Sini</th>
                                    <th className="px-4 py-2.5 text-right">Sisa Tagihan</th>
                                    <th className="px-4 py-2.5 text-center">Status Tagihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(payment.allocations || []).map((alloc) => (
                                    <tr key={alloc.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            {alloc.document_label}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                            <Link
                                                href={alloc.document_url}
                                                className="hover:underline"
                                            >
                                                {alloc.document_id} &rarr;
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {alloc.party_name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(alloc.grand_total)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                            {formatRp(alloc.amount_allocated)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(alloc.amount_residual)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <OdooBadge status={alloc.document_status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Notes Summary */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-100 pt-5">
                    <div className="text-xs text-slate-600 space-y-2 max-w-md">
                        <div>
                            <div className="font-bold text-slate-800">Catatan Pembayaran:</div>
                            <p className="mt-0.5">{payment.notes || '—'}</p>
                        </div>
                        {payment.journal_entry_no && (
                            <div className="pt-1">
                                <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                                    Jurnal Terposting: {payment.journal_entry_no}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Akun Kas / Bank:</span>
                            <span className="font-semibold text-slate-900">
                                {payment.bank_account_code}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-emerald-800">
                            <span>Total Nominal Dibayar:</span>
                            <span className="font-mono">{formatRp(payment.amount)}</span>
                        </div>
                        {firstAlloc && (
                            <div className="flex justify-between text-slate-600 pt-1">
                                <span>Sisa Tagihan Dokumen:</span>
                                <span className="font-mono font-bold text-slate-900">
                                    {formatRp(firstAlloc.amount_residual)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History */}
            <OdooFormFooter
                documentType="payment"
                documentId={payment.id}
                relatedDocs={relatedDocs}
                auditLogs={auditLogs}
            />
        </AccountingLayout>
    );
}
