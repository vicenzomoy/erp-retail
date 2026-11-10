import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function JournalEntryIndex({ entries, filters, glSummary }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilterType = (entry_type) => {
        router.get(route('accounting.journals.index'), { entry_type, search }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('accounting.journals.index'),
            { entry_type: filters?.entry_type || 'all', search },
            { preserveState: true }
        );
    };

    const typeTabs = [
        { key: 'all', label: 'Semua Jurnal' },
        { key: 'cogs', label: 'COGS / HPP' },
        { key: 'sales_invoice', label: 'Customer Invoice' },
        { key: 'vendor_bill', label: 'Vendor Bill' },
        { key: 'payment_in', label: 'Payment In' },
        { key: 'payment_out', label: 'Payment Out' },
        { key: 'stock_transfer', label: 'Mutasi Stok / Receipt' },
        { key: 'opening_balance', label: 'Saldo Awal' },
    ];

    return (
        <AccountingLayout
            title="Journal Entries"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Journal Entries' },
            ]}
            actions={
                <Link
                    href={route('accounting.gl.index')}
                    className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-odoo-purple-dark"
                >
                    Buka General Ledger (Buku Besar) →
                </Link>
            }
        >
            <Head title="Journal Entries — Accounting" />

            <div className="space-y-4 p-4 md:p-6">
                {/* Banner Keseimbangan Jurnal */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Status Keseimbangan Buku Besar
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                                {glSummary?.is_balanced ? 'SEIMBANG (DEBIT = KREDIT)' : 'TIDAK SEIMBANG'}
                            </span>
                            <span className="text-xs font-semibold text-emerald-800">
                                {glSummary?.total_count || 0} Entri Jurnal
                            </span>
                        </div>
                        <div className="mt-1.5 font-mono text-xs text-emerald-900">
                            Total D: {formatRp(glSummary?.total_debit)} | Total K: {formatRp(glSummary?.total_credit)}
                        </div>
                    </div>

                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            Pengakuan Beban Pokok Penjualan / COGS
                        </div>
                        <div className="mt-1 font-mono text-lg font-extrabold text-indigo-800">
                            {glSummary?.cogs_count || 0} Jurnal COGS Aktif
                        </div>
                        <div className="mt-1 text-xs text-indigo-700">
                            Debit 5000 (Beban Pokok Penjualan) / Kredit 1200 (Persediaan)
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                Proteksi Anti-Jurnal Ganda
                            </div>
                            <p className="mt-1 text-xs text-gray-600">
                                Setiap instruksi <code className="font-mono">Post</code> ulang dijamin idempotent dan tidak menggandakan baris jurnal.
                            </p>
                        </div>
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => handleFilterType('cogs')}
                                className="text-xs font-bold text-odoo-purple hover:underline"
                            >
                                Filter Jurnal COGS / HPP →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {typeTabs.map((tab) => {
                            const active = (filters?.entry_type || 'all') === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterType(tab.key)}
                                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-odoo-purple text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari No Jurnal, Dokumen (WH/OUT/0001)..."
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

                {/* Daftar Journal Entries Beserta Rincian Baris */}
                <div className="space-y-4">
                    {entries?.data?.length === 0 ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                            Tidak ada entri jurnal yang cocok dengan filter saat ini.
                        </div>
                    ) : (
                        entries?.data?.map((je) => (
                            <div
                                key={je.id}
                                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                            >
                                {/* Header Entri Jurnal */}
                                <div className="flex flex-col justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 md:flex-row md:items-center">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <Link
                                            href={route('accounting.journals.show', je.id)}
                                            className="font-mono text-sm font-extrabold text-odoo-purple hover:underline"
                                        >
                                            {je.entry_no}
                                        </Link>
                                        <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-indigo-800">
                                            {je.entry_type}
                                        </span>
                                        <OdooBadge status={je.status} />
                                        {je.is_balanced && (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                                Debit = Kredit ({formatRp(je.total_debit)})
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                        <span>
                                            Dokumen Sumber:{' '}
                                            <strong className="font-mono text-gray-900">
                                                {je.source_document_id}
                                            </strong>
                                        </span>
                                        <span>Tanggal: {je.entry_date}</span>
                                        <Link
                                            href={route('accounting.journals.show', je.id)}
                                            className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                        >
                                            Buka Detail & Stock Move →
                                        </Link>
                                    </div>
                                </div>

                                {/* Deskripsi & Tabel Baris Debit/Kredit */}
                                <div className="px-4 py-2 text-xs text-gray-600 bg-white border-b border-gray-100">
                                    {je.description}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                                        <thead className="bg-gray-50/60 font-semibold uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2 w-28">Kode Akun</th>
                                                <th className="px-4 py-2 w-64">Nama Akun</th>
                                                <th className="px-4 py-2">Keterangan Baris</th>
                                                <th className="px-4 py-2 text-right w-40">Debit</th>
                                                <th className="px-4 py-2 text-right w-40">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(je.lines || []).map((line) => (
                                                <tr key={line.id}>
                                                    <td className="px-4 py-2 font-mono font-bold text-indigo-700">
                                                        {line.account_code}
                                                    </td>
                                                    <td className="px-4 py-2 font-semibold text-gray-900">
                                                        {line.account_name}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600">{line.description}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-700">
                                                        {line.debit > 0 ? formatRp(line.debit) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono font-semibold text-amber-700">
                                                        {line.credit > 0 ? formatRp(line.credit) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AccountingLayout>
    );
}

