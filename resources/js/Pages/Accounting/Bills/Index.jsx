import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    Plus,
    Search,
    FileSpreadsheet,
    Wallet,
    Scale,
    ArrowUpRight,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function Index({ bills, filters, counts }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (newStatus) => {
        router.get(
            route('accounting.bills.index'),
            { status: newStatus, search },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.bills.index'),
            { status: filters.status, search },
            { preserveState: true, replace: true }
        );
    };

    const tabs = [
        { key: 'all', label: 'Semua Tagihan', count: counts.all },
        { key: 'draft', label: 'Draft', count: counts.draft },
        { key: 'posted', label: 'Posted (Utang Terbuka)', count: counts.posted },
        { key: 'paid', label: 'Lunas (Paid)', count: counts.paid },
    ];

    return (
        <AccountingLayout
            title="Vendor Bills (S-12)"
            breadcrumbs={[{ label: 'Vendor Bills (S-12)' }]}
        >
            <Head title="Vendor Bills (S-12) — Bara Wear" />

            {/* Top Action Bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Vendor Bills / Tagihan Pemasok (S-12)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Validasi Three-Way Match (PO vs Accepted QC Receipt vs Vendor Bill) &amp; PPN 11% Per Baris (F-14, F-23)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('accounting.ledger', { account: '2100' })}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Scale className="h-3.5 w-3.5 text-teal-600" />
                        Ledger AP (2100): {formatRp(counts.gl_ap_bal)}
                    </Link>

                    <Link
                        href={route('accounting.bills.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Buat Vendor Bill Baru
                    </Link>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleFilter(tab.key)}
                            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                filters.status === tab.key
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                    filters.status === tab.key
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari No. Bill, PO, Receipt, Vendor..."
                        className="w-full rounded border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-teal-600 focus:outline-none focus:ring-0"
                    />
                </form>
            </div>

            {/* List View Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">No. Vendor Bill</th>
                                <th className="px-4 py-3">Pemasok (Vendor)</th>
                                <th className="px-4 py-3">Dokumen PO &amp; Receipt</th>
                                <th className="px-4 py-3">Tgl Bill / Tempo</th>
                                <th className="px-4 py-3 text-right">DPP (Untaxed)</th>
                                <th className="px-4 py-3 text-right">PPN 11%</th>
                                <th className="px-4 py-3 text-right">Grand Total</th>
                                <th className="px-4 py-3 text-right">Sisa Utang (Residual)</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bills.data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                                        Tidak ada dokumen Vendor Bill ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                bills.data.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-teal-700">
                                            <Link href={route('accounting.bills.show', b.id)} className="hover:underline">
                                                {b.id}
                                            </Link>
                                            {b.journal_entry_no && (
                                                <div className="text-[10px] font-normal text-slate-400">
                                                    {b.journal_entry_no}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{b.vendor_name}</div>
                                            <div className="text-[10px] text-slate-400">Kode: {b.vendor_id} &bull; Termin: {b.payment_terms}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {b.purchase_order_id ? (
                                                <div className="space-y-0.5">
                                                    <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 border border-amber-200 mr-1">
                                                        PO: {b.purchase_order_id}
                                                    </span>
                                                    {b.receipt_id && (
                                                        <Link
                                                            href={route('inventory.receipts.show', b.receipt_id)}
                                                            className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                                        >
                                                            RCP: {b.receipt_id}
                                                            <ArrowUpRight className="h-2.5 w-2.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">Saldo Awal (Opening)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div>{b.bill_date || '—'}</div>
                                            <div className="text-[10px] text-slate-400">Jatuh Tempo: {b.due_date || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(b.subtotal_before_tax)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(b.total_tax)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(b.grand_total)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                                            {formatRp(b.amount_residual)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <OdooBadge status={b.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <Link
                                                    href={route('accounting.bills.show', b.id)}
                                                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Buka
                                                </Link>
                                                {b.status === 'posted' && b.amount_residual > 0 && (
                                                    <Link
                                                        href={route('accounting.payments.create', {
                                                            document_type: 'vendor_bill',
                                                            document_id: b.id,
                                                        })}
                                                        className="inline-flex items-center gap-1 rounded bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800"
                                                    >
                                                        <Wallet className="h-3 w-3" />
                                                        Bayar
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AccountingLayout>
    );
}

