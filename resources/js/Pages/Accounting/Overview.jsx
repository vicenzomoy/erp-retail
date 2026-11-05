import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Landmark,
    Wallet,
    FileSpreadsheet,
    FileCheck2,
    BookOpen,
    Scale,
    ArrowUpRight,
    Plus,
    CheckCircle2,
    Package,
    TrendingUp,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Overview({ kpis, recentBills = [], recentInvoices = [], recentJournals = [] }) {
    return (
        <AccountingLayout title="Overview Akuntansi">
            <Head title="Accounting Overview — Bara Wear" />

            {/* Header Bar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Accounting &amp; General Ledger
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kendali Faktur Pemasok (Three-Way Match), Faktur Pelanggan, Rekonsiliasi Kas/Bank, dan Buku Besar Seimbang
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.bills.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Vendor Bill (S-12)
                    </Link>
                    <Link
                        href={route('accounting.payments.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <Wallet className="h-3.5 w-3.5" />
                        Register Payment (S-13)
                    </Link>
                    <Link
                        href={route('accounting.ledger')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Scale className="h-3.5 w-3.5 text-teal-600" />
                        General Ledger (S-14)
                    </Link>
                </div>
            </div>

            {/* KPI Cards Row 1: Financial Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Link
                    href={route('accounting.ledger', { account: '1020' })}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-teal-400 transition group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Saldo Bank (1020)
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                            <Landmark className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatRp(kpis.bank_balance)}</p>
                    <p className="text-[11px] text-teal-700 font-medium mt-1 flex items-center gap-1">
                        <span>Lihat Buku Besar Bank</span>
                        <ArrowUpRight className="h-3 w-3" />
                    </p>
                </Link>

                <Link
                    href={route('accounting.invoices.index')}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-400 transition group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Open AR / Piutang (1100)
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                            <FileCheck2 className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatRp(kpis.open_ar)}</p>
                    <p className="text-[11px] text-indigo-700 font-medium mt-1 flex items-center gap-1">
                        <span>{kpis.customer_invoices_count} Faktur Pelanggan</span>
                        <ArrowUpRight className="h-3 w-3" />
                    </p>
                </Link>

                <Link
                    href={route('accounting.bills.index')}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-400 transition group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Open AP / Utang (2100)
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                            <FileSpreadsheet className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatRp(kpis.open_ap)}</p>
                    <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                        <span>{kpis.vendor_bills_count} Tagihan Vendor</span>
                        <ArrowUpRight className="h-3 w-3" />
                    </p>
                </Link>

                <Link
                    href={route('accounting.ledger', { account: '5000' })}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-400 transition group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            COGS / HPP (5000) &amp; Stok (1200)
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                            <Package className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatRp(kpis.cogs_total)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Persediaan (1200): <strong className="text-slate-800">{formatRp(kpis.inventory_value)}</strong>
                    </p>
                </Link>
            </div>

            {/* Keseimbangan Jurnal Banner (F-16) */}
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                                Status Keseimbangan Buku Besar (F-16 Double-Entry Check)
                            </h3>
                            <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                                {kpis.gl_is_balanced ? 'SEIMBANG (DEBIT = KREDIT)' : 'TIDAK SEIMBANG'}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                            Total Debit Terposting: <strong>{formatRp(kpis.gl_total_debit)}</strong> &bull; Total Kredit Terposting: <strong>{formatRp(kpis.gl_total_credit)}</strong> &bull; {kpis.journal_entries_count} Entri Jurnal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('accounting.journals')}
                        className="inline-flex items-center gap-1.5 rounded bg-white border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        Buka Journal Entries
                    </Link>
                </div>
            </div>

            {/* Two-column tables: Vendor Bills & Customer Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Recent Vendor Bills */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Vendor Bills Terbaru (S-12)
                            </h2>
                            <p className="text-[11px] text-slate-500">Validasi Three-Way Match (PO - Receipt - Bill)</p>
                        </div>
                        <Link
                            href={route('accounting.bills.index')}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5">No. Bill</th>
                                    <th className="px-4 py-2.5">Vendor / PO</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                    <th className="px-4 py-2.5 text-right">Residual</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentBills.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-bold text-teal-700">
                                            <Link href={route('accounting.bills.show', b.id)} className="hover:underline">
                                                {b.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-800">{b.vendor_name}</div>
                                            {b.purchase_order_id && (
                                                <div className="text-[10px] text-slate-400">
                                                    PO: {b.purchase_order_id} {b.receipt_id ? `• RCP: ${b.receipt_id}` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                            {formatRp(b.grand_total)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-amber-700 font-semibold">
                                            {formatRp(b.amount_residual)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <OdooBadge status={b.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Customer Invoices */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Customer Invoices Terbaru
                            </h2>
                            <p className="text-[11px] text-slate-500">Penagihan Berbasis Pengiriman &amp; PPN 11% Bulat Rupiah</p>
                        </div>
                        <Link
                            href={route('accounting.invoices.index')}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2.5">No. Faktur</th>
                                    <th className="px-4 py-2.5">Pelanggan / SO</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                    <th className="px-4 py-2.5 text-right">Residual</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                            <Link href={route('accounting.invoices.show', inv.id)} className="hover:underline">
                                                {inv.id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                                            {inv.sales_order_id && (
                                                <div className="text-[10px] text-slate-400">SO: {inv.sales_order_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                            {formatRp(inv.grand_total)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-indigo-700 font-semibold">
                                            {formatRp(inv.amount_residual)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <OdooBadge status={inv.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Journal Entries */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Jurnal Akuntansi Terbaru (S-14)
                        </h2>
                        <p className="text-[11px] text-slate-500">Pencatatan otomatis COGS, Faktur, Tagihan, dan Kas/Bank</p>
                    </div>
                    <Link
                        href={route('accounting.journals')}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                    >
                        Semua Journal Entries
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2.5">No. Jurnal</th>
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Tipe</th>
                                <th className="px-4 py-2.5">Dokumen Sumber</th>
                                <th className="px-4 py-2.5">Keterangan</th>
                                <th className="px-4 py-2.5 text-right">Debit</th>
                                <th className="px-4 py-2.5 text-right">Kredit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentJournals.map((je) => (
                                <tr key={je.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 font-mono font-bold text-teal-700">
                                        <Link href={route('accounting.journals.show', je.id)} className="hover:underline">
                                            {je.entry_no}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600">{je.entry_date}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                            {je.entry_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-slate-700">{je.source_document_id}</td>
                                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{je.description}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                                        {formatRp(je.total_debit)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                                        {formatRp(je.total_credit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AccountingLayout>
    );
}

