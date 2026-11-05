import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function PaymentIndex({ payments, filters, balances }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleFilterType = (type) => {
        router.get(route('accounting.payments.index'), { type, search }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('accounting.payments.index'), { type: filters?.type || 'all', search }, { preserveState: true });
    };

    const typeTabs = [
        { key: 'all', label: 'Semua Pembayaran' },
        { key: 'inbound', label: 'Inbound (Pelanggan / AR — T-25)' },
        { key: 'outbound', label: 'Outbound (Vendor / AP — T-26)' },
    ];

    return (
        <AccountingLayout
            title="Register Payment & Rekonsiliasi (S-13)"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Payments (S-13)' },
            ]}
            actions={
                <Link
                    href={route('accounting.payments.create')}
                    className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-odoo-purple-dark transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Register Payment Baru (S-13 / F-15)
                </Link>
            }
        >
            <Head title="Payments (S-13) — Accounting" />

            <div className="space-y-4 p-4 md:p-6">
                {/* KPI Cards Kas, Bank, AR, AP */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Saldo Bank Operasional (1020)
                        </div>
                        <div className="mt-1 font-mono text-xl font-extrabold text-emerald-700">
                            {formatRp(balances?.bank_1020)}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                            Saldo Awal: Rp 50.000.000 (Bukti T-25 & T-26)
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Saldo Kas Tunai / POS (1010)
                        </div>
                        <div className="mt-1 font-mono text-xl font-extrabold text-gray-900">
                            {formatRp(balances?.cash_1010)}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                            Mutasi penjualan tunai POS
                        </div>
                    </div>

                    <div className="rounded-lg border border-indigo-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Open Piutang Pelanggan (AR 1100)
                        </div>
                        <div className="mt-1 font-mono text-xl font-extrabold text-indigo-700">
                            {formatRp(balances?.open_ar_1100)}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                            Total residual Customer Invoice Posted
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Open Utang Usaha Vendor (AP 2100)
                        </div>
                        <div className="mt-1 font-mono text-xl font-extrabold text-amber-700">
                            {formatRp(balances?.open_ap_2100)}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                            Total residual Vendor Bill Posted
                        </div>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {typeTabs.map((tab) => {
                            const active = (filters?.type || 'all') === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterType(tab.key)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
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
                            placeholder="Cari ID Pembayaran, Pihak, Referensi..."
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

                {/* Tabel Pembayaran */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 font-semibold uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">No. Pembayaran</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3">Pelanggan / Vendor</th>
                                    <th className="px-4 py-3">Dokumen Alokasi</th>
                                    <th className="px-4 py-3">Akun Kas/Bank</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3 text-right">Nominal</th>
                                    <th className="px-4 py-3">Kunci Idempotensi (T-26)</th>
                                    <th className="px-4 py-3 text-center">No. Jurnal</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {payments?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                            Belum ada transaksi pembayaran tercatat. Klik "Register Payment Baru" untuk memproses pembayaran parsial (T-25) atau pelunasan vendor (T-26).
                                        </td>
                                    </tr>
                                ) : (
                                    payments?.data?.map((pay) => (
                                        <tr key={pay.id} className="hover:bg-gray-50/80">
                                            <td className="px-4 py-3 font-mono font-bold text-odoo-purple">
                                                <Link href={route('accounting.payments.show', pay.id)} className="hover:underline">
                                                    {pay.id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {pay.payment_type === 'inbound' ? (
                                                    <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        Inbound (AR +)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                                        Outbound (AP -)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{pay.party_name}</div>
                                                <div className="text-[11px] text-gray-500">{pay.party_id}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                                                {pay.document_id || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-700">
                                                {pay.bank_account_code} — {pay.bank_account_name}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{pay.payment_date}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                                                {formatRp(pay.amount)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                                                {pay.idempotency_key}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-[11px] text-indigo-700">
                                                {pay.journal_entry_no || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <OdooBadge status={pay.status} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={route('accounting.payments.show', pay.id)}
                                                    className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    Detail & Bukti
                                                </Link>
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

