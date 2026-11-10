import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function GeneralLedgerIndex({
    summary,
    selectedAccount,
    ledgerRows,
    stockMoves,
    filters,
}) {
    const handleSelectAccount = (account) => {
        router.get(
            route('accounting.reports.general-ledger'),
            { account, entry_type: filters?.entry_type || 'all' },
            { preserveState: true }
        );
    };

    const quickAccounts = [
        { code: 'all', label: 'Semua Akun (Trial Balance)' },
        { code: '1020', label: '1020 — Bank Operasional' },
        { code: '1100', label: '1100 — Piutang Usaha (AR)' },
        { code: '1200', label: '1200 — Persediaan Barang' },
        { code: '2100', label: '2100 — Utang Usaha (AP)' },
        { code: '4000', label: '4000 — Pendapatan Penjualan' },
        { code: '5000', label: '5000 — Beban Pokok Penjualan / COGS' },
    ];

    return (
        <AccountingLayout
            title="Buku Besar Umum (General Ledger)"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Buku Besar Umum' },
            ]}
            actions={
                <Link
                    href={route('accounting.journals.index')}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Lihat Daftar Journal Entries →
                </Link>
            }
        >
            <Head title="General Ledger — Accounting" />

            <div className="space-y-5 p-4 md:p-6">
                {/* Quick Filter Akun Buku Besar */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">
                                Filter Akun Buku Besar (General Ledger)
                            </h2>
                            <p className="text-xs text-gray-500">
                                Pilih akun spesifik untuk memeriksa mutasi kronologis dan saldo berjalan (running balance).
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-extrabold text-emerald-800 border border-emerald-300">
                                Trial Balance: Debit {formatRp(summary?.total_debit)} = Kredit {formatRp(summary?.total_credit)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {quickAccounts.map((acc) => {
                            const active = (filters?.account || 'all') === acc.code;
                            return (
                                <button
                                    key={acc.code}
                                    type="button"
                                    onClick={() => handleSelectAccount(acc.code)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-odoo-purple text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {acc.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tabel Neraca Saldo (Chart of Accounts Summary) */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            1. Ringkasan Saldo Akun (Chart of Accounts & Trial Balance)
                        </h3>
                        <span className="text-[11px] text-gray-500">
                            Klik baris akun untuk memfilter rincian mutasi di bawah
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                <tr>
                                    <th className="px-4 py-2.5">Kode</th>
                                    <th className="px-4 py-2.5">Nama Akun</th>
                                    <th className="px-4 py-2.5">Kategori</th>
                                    <th className="px-4 py-2.5 text-right">Total Debit</th>
                                    <th className="px-4 py-2.5 text-right">Total Kredit</th>
                                    <th className="px-4 py-2.5 text-right">Saldo Akhir (Normal Balance)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(summary?.accounts || []).map((acc) => {
                                    const isSelected = filters?.account === acc.code;
                                    return (
                                        <tr
                                            key={acc.code}
                                            onClick={() => handleSelectAccount(acc.code)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected ? 'bg-purple-50 font-semibold' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-4 py-2.5 font-mono font-bold text-odoo-purple">
                                                {acc.code}
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-gray-900">
                                                {acc.account_name}
                                            </td>
                                            <td className="px-4 py-2.5 uppercase text-[11px] text-gray-500">
                                                {acc.account_type}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                                                {formatRp(acc.total_debit)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                                                {formatRp(acc.total_credit)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                                                {formatRp(acc.balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 font-extrabold text-gray-900">
                                <tr>
                                    <td colSpan={3} className="px-4 py-2.5 text-right">
                                        Total Keseimbangan Buku Besar (Debit = Kredit):
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-emerald-800">
                                        {formatRp(summary?.total_debit)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-amber-800">
                                        {formatRp(summary?.total_credit)}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-indigo-800">
                                        {summary?.is_balanced ? 'SEIMBANG' : 'SELISIH'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Tabel Rincian Mutasi Buku Besar (General Ledger Rows) */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                2. Rincian Mutasi Buku Besar:{' '}
                                {selectedAccount
                                    ? `${selectedAccount.code} — ${selectedAccount.account_name}`
                                    : 'Semua Akun'}
                            </h3>
                        </div>
                        {selectedAccount && (
                            <span className="rounded bg-indigo-100 px-3 py-1 font-mono text-xs font-extrabold text-indigo-900">
                                Saldo Akhir {selectedAccount.code}: {formatRp(selectedAccount.balance)}
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                <tr>
                                    <th className="px-3 py-2.5">Tanggal</th>
                                    <th className="px-3 py-2.5">No. Jurnal</th>
                                    <th className="px-3 py-2.5">Tipe</th>
                                    <th className="px-3 py-2.5">Dokumen Sumber</th>
                                    <th className="px-3 py-2.5">Akun</th>
                                    <th className="px-3 py-2.5">Keterangan</th>
                                    <th className="px-3 py-2.5 text-right">Debit</th>
                                    <th className="px-3 py-2.5 text-right">Kredit</th>
                                    <th className="px-3 py-2.5 text-right">Saldo Berjalan (Akun)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(ledgerRows || []).map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="px-3 py-2 font-mono text-gray-600">{row.entry_date}</td>
                                        <td className="px-3 py-2 font-mono font-bold text-odoo-purple">
                                            <Link
                                                href={route('accounting.journals.show', row.journal_entry_id)}
                                                className="hover:underline"
                                            >
                                                {row.entry_no}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-gray-700">
                                                {row.entry_type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 font-mono font-semibold text-gray-800">
                                            {row.source_document_id}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-indigo-700">
                                            {row.account_code} — {row.account_name}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{row.description}</td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                                            {row.debit > 0 ? formatRp(row.debit) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700">
                                            {row.credit > 0 ? formatRp(row.credit) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                            {formatRp(row.running_balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabel Stock Move Terkait Valuasi Persediaan & COGS */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            3. Entri Stock Move Terkait Valuasi Persediaan (1200) &amp; COGS (5000)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                <tr>
                                    <th className="px-4 py-2">ID Move</th>
                                    <th className="px-4 py-2">Dokumen Sumber</th>
                                    <th className="px-4 py-2">SKU / Produk</th>
                                    <th className="px-4 py-2">Dari → Ke</th>
                                    <th className="px-4 py-2 text-center">Qty Done</th>
                                    <th className="px-4 py-2 text-right">Harga Pokok (Cost)</th>
                                    <th className="px-4 py-2 text-right">Total Nilai (COGS / Persediaan)</th>
                                    <th className="px-4 py-2">Waktu Selesai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(stockMoves || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                            Belum ada mutasi Stock Move berstatus Done.
                                        </td>
                                    </tr>
                                ) : (
                                    stockMoves.map((sm) => (
                                        <tr key={sm.id}>
                                            <td className="px-4 py-2 font-mono font-bold text-gray-700">#{sm.id}</td>
                                            <td className="px-4 py-2 font-mono font-bold text-odoo-purple">
                                                {sm.source_document_id}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="font-mono font-bold text-gray-900">{sm.variant_sku}</span>{' '}
                                                <span className="text-gray-500">— {sm.product_name}</span>
                                            </td>
                                            <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                                                {sm.location_from} → {sm.location_to}
                                            </td>
                                            <td className="px-4 py-2 text-center font-mono font-bold">{sm.qty_done}</td>
                                            <td className="px-4 py-2 text-right font-mono">{formatRp(sm.unit_cost)}</td>
                                            <td className="px-4 py-2 text-right font-mono font-extrabold text-indigo-700">
                                                {formatRp(sm.total_value)}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500">{sm.done_at}</td>
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

