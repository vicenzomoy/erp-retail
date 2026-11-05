import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function CustomerInvoiceIndex({ invoices, filters, counts }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilterStatus = (status) => {
        router.get(route('accounting.invoices.index'), { status, search }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('accounting.invoices.index'), { status: filters?.status || 'all', search }, { preserveState: true });
    };

    const statusTabs = [
        { key: 'all', label: 'Semua Faktur', count: counts?.all || 0 },
        { key: 'draft', label: 'Draft', count: counts?.draft || 0 },
        { key: 'posted', label: 'Posted (Open AR)', count: counts?.posted || 0 },
        { key: 'paid', label: 'Paid (Lunas)', count: counts?.paid || 0 },
    ];

    return (
        <AccountingLayout
            title="Customer Invoices"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Customer Invoices' },
            ]}
            actions={
                <Link
                    href={route('accounting.invoices.create')}
                    className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-odoo-purple-dark transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Buat Customer Invoice (F-10 / F-23)
                </Link>
            }
        >
            <Head title="Customer Invoices — Accounting" />

            <div className="space-y-4 p-4 md:p-6">
                {/* Summary Banner AR */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Open Piutang Pelanggan (Sub-Ledger AR)
                        </div>
                        <div className="mt-1 text-xl font-bold text-indigo-700">
                            {formatRp(counts?.open_ar)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Total sisa tagihan faktur berstatus Posted
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Saldo Buku Besar Akun 1100 (Piutang Usaha)
                        </div>
                        <div className="mt-1 text-xl font-bold text-gray-900">
                            {formatRp(counts?.gl_ar_bal)}
                        </div>
                        <div className="mt-1 text-xs text-emerald-700 font-medium">
                            Tersinkronisasi dengan General Ledger (S-14)
                        </div>
                    </div>

                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                                Kebijakan Delivered-Based & PPN 11% (F-10 & F-23)
                            </div>
                            <p className="mt-1 text-xs text-indigo-800">
                                Kuantitas faktur dibatasi pada unit terkirim (<code className="font-mono">WH/OUT Done</code>). PPN 11% dihitung & dibulatkan per baris ke Rupiah terdekat.
                            </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Link
                                href={route('accounting.invoices.create', { sales_order_id: 'SO-0001' })}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
                            >
                                Buat Faktur dari SO-0001 (T-17 / T-18) →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {statusTabs.map((tab) => {
                            const active = (filters?.status || 'all') === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterStatus(tab.key)}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-odoo-purple text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                            active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari No Faktur, SO, atau Pelanggan..."
                            className="w-64 rounded border-gray-300 text-xs focus:border-odoo-purple focus:ring-odoo-purple"
                        />
                        <button
                            type="submit"
                            className="rounded bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* Tabel Faktur */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">No. Faktur</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Ref. Sales Order</th>
                                    <th className="px-4 py-3">Tgl Faktur / Jatuh Tempo</th>
                                    <th className="px-4 py-3 text-right">DPP (Sebelum Pajak)</th>
                                    <th className="px-4 py-3 text-right">PPN 11% (F-23)</th>
                                    <th className="px-4 py-3 text-right">Grand Total</th>
                                    <th className="px-4 py-3 text-right">Sisa Piutang (Residual)</th>
                                    <th className="px-4 py-3 text-center">Jurnal</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {invoices?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada data Customer Invoice yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices?.data?.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-odoo-purple">
                                                <Link href={route('accounting.invoices.show', inv.id)} className="hover:underline">
                                                    {inv.id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{inv.customer_name}</div>
                                                <div className="text-[11px] text-gray-500">{inv.customer_id}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-700">
                                                {inv.sales_order_id || 'Saldo Awal'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div>{inv.invoice_date}</div>
                                                <div className="text-[11px] text-gray-400">Due: {inv.due_date}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-700">
                                                {formatRp(inv.subtotal_before_tax)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-700">
                                                {formatRp(inv.total_tax)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                                                {formatRp(inv.grand_total)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                                                {formatRp(inv.amount_residual)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-[11px] text-gray-600">
                                                {inv.journal_entry_no || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <OdooBadge status={inv.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        href={route('accounting.invoices.show', inv.id)}
                                                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Buka
                                                    </Link>
                                                    {inv.status === 'posted' && inv.amount_residual > 0 && (
                                                        <Link
                                                            href={route('accounting.payments.create', {
                                                                document_type: 'customer_invoice',
                                                                document_id: inv.id,
                                                            })}
                                                            className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            Terima Bayar
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
            </div>
        </AccountingLayout>
    );
}

