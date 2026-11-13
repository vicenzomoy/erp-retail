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
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

const formatMethod = (method) => {
    if (method === 'cash') return 'Tunai (Cash)';
    if (method === 'bank_transfer') return 'Transfer Bank';
    return method || '—';
};

export default function PaymentShow({
    payment,
    bankLedger,
    relatedDocs = [],
    auditLogs = [],
}) {
    const firstAlloc = (payment.allocations || [])[0] || null;
    const isInbound = payment.payment_type === 'inbound';

    return (
        <AccountingLayout
            title={`Bukti Pembayaran ${payment.id}`}
            breadcrumbs={[
                { label: 'Kas & Pembayaran', href: route('accounting.payments.index') },
                { label: 'Pembayaran & Penerimaan', href: route('accounting.payments.index') },
                { label: payment.id },
            ]}
        >
            <Head title={`Bukti Pembayaran ${payment.id} — Bara Wear`} />

            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.payments.index')}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition"
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
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                        >
                            <Wallet className="h-4 w-4" />
                            Lunasi Sisa Tagihan ({formatRp(firstAlloc.amount_residual)})
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Bukti
                    </button>
                </div>

                <OdooStatusBar
                    status={payment.status}
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'reconciled', label: 'Selesai' },
                    ]}
                />
            </div>

            {/* White Sheet Form View */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs mb-6">
                {/* Top Summary + Smart Buttons */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {isInbound ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                    <ArrowDownLeft className="h-3 w-3" />
                                    Uang Masuk &bull; Dari Pelanggan
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                    <ArrowUpRight className="h-3 w-3" />
                                    Uang Keluar &bull; Ke Pemasok
                                </span>
                            )}
                            <OdooBadge status={payment.status} />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                            {payment.id}
                        </h1>
                        <div className="mt-1 text-lg font-black font-mono text-slate-900">
                            <span className={isInbound ? 'text-emerald-700' : 'text-slate-900'}>
                                {isInbound ? '+' : '-'} {formatRp(payment.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Smart Buttons */}
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

                {/* General Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                {payment.party_type === 'customer' ? 'Pelanggan:' : 'Pemasok:'}
                            </span>
                            <span className="font-bold text-slate-900">
                                {payment.party_name}{' '}
                                <span className="text-slate-400 font-normal">
                                    ({payment.party_id})
                                </span>
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Akun Kas / Bank:
                            </span>
                            <span className="font-semibold text-slate-800">
                                {payment.bank_account_name}{' '}
                                <span className="text-slate-400 font-mono font-normal">
                                    ({payment.bank_account_code})
                                </span>
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Metode:
                            </span>
                            <span className="font-semibold text-slate-800">
                                {formatMethod(payment.payment_method)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                Tanggal:
                            </span>
                            <span className="text-slate-800 font-medium">
                                {payment.payment_date || '—'}
                            </span>
                        </div>
                        <div className="flex items-baseline">
                            <span className="w-36 font-semibold text-slate-500 shrink-0">
                                No. Referensi:
                            </span>
                            <span className="font-mono text-slate-800 font-medium">
                                {payment.reference || '—'}
                            </span>
                        </div>
                        {payment.posted_at && (
                            <div className="flex items-baseline">
                                <span className="w-36 font-semibold text-slate-500 shrink-0">
                                    Dicatat Oleh:
                                </span>
                                <span className="text-slate-700 font-medium">
                                    {payment.posted_by || 'Finance'} ({payment.posted_at})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabel Dokumen Tagihan yang Dibayar */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="h-4 w-4 text-slate-500" />
                            Dokumen Tagihan yang Dibayar
                        </h3>
                        <span className="text-[11px] text-slate-500">
                            {(payment.allocations || []).length} Dokumen
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-2.5">Dokumen</th>
                                    <th className="px-4 py-2.5">Mitra</th>
                                    <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                    <th className="px-4 py-2.5 text-right">Dibayar di Sini</th>
                                    <th className="px-4 py-2.5 text-right">Sisa Tagihan</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(payment.allocations || []).map((alloc) => (
                                    <tr key={alloc.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={alloc.document_url}
                                                className="font-mono font-bold text-slate-900 hover:underline"
                                            >
                                                {alloc.document_id} &rarr;
                                            </Link>
                                            <div className="text-[11px] text-slate-500">
                                                {alloc.document_label}
                                            </div>
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

                {/* Catatan */}
                {(payment.notes || payment.journal_entry_no) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 border border-slate-200/80 px-4 py-3 text-xs text-slate-600">
                        <div>
                            <span className="font-bold text-slate-800">Catatan: </span>
                            <span>{payment.notes || '—'}</span>
                        </div>
                        {payment.journal_entry_no && (
                            <span className="inline-flex items-center gap-1.5 rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                Jurnal: {payment.journal_entry_no}
                            </span>
                        )}
                    </div>
                )}
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
