import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function PaymentShow({
    payment,
    bankLedger,
    subLedgerBalances,
    relatedDocs,
    auditLogs,
}) {
    const [sendingDuplicate, setSendingDuplicate] = useState(false);

    const firstAlloc = (payment.allocations || [])[0] || null;

    // Simulasi klik ganda / kirim ulang instruksi bayar dengan idempotency_key yang sama (Skenario T-26)
    const handleSimulateDuplicatePayment = () => {
        if (!firstAlloc) return;
        setSendingDuplicate(true);
        router.post(
            route('accounting.payments.store'),
            {
                document_type: firstAlloc.document_type,
                document_id: firstAlloc.document_id,
                amount: payment.amount,
                payment_method: payment.payment_method,
                bank_account_code: payment.bank_account_code,
                payment_date: payment.payment_date,
                reference: payment.reference,
                idempotency_key: payment.idempotency_key,
            },
            {
                preserveScroll: true,
                onFinish: () => setSendingDuplicate(false),
            }
        );
    };

    const totalDebit = (payment.journal_lines || []).reduce((acc, l) => acc + Number(l.debit || 0), 0);
    const totalCredit = (payment.journal_lines || []).reduce((acc, l) => acc + Number(l.credit || 0), 0);

    return (
        <AccountingLayout
            title={`Bukti Pembayaran ${payment.id}`}
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Payments (S-13)', href: route('accounting.payments.index') },
                { label: payment.id },
            ]}
        >
            <Head title={`${payment.id} — Register Payment`} />

            <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
                {/* Action Bar & Status Pipe */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        {firstAlloc && (
                            <button
                                type="button"
                                onClick={handleSimulateDuplicatePayment}
                                disabled={sendingDuplicate}
                                className="inline-flex items-center gap-1.5 rounded border-2 border-indigo-600 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-900 shadow-xs hover:bg-indigo-100 disabled:opacity-50"
                            >
                                Kirim Ulang Pembayaran (Key Sama — Uji Anti-Duplikasi T-26)
                            </button>
                        )}

                        {firstAlloc && firstAlloc.amount_residual > 0 && (
                            <Link
                                href={route('accounting.payments.create', {
                                    document_type: firstAlloc.document_type,
                                    document_id: firstAlloc.document_id,
                                })}
                                className="rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                                Lunasi Sisa Residual ({formatRp(firstAlloc.amount_residual)})
                            </Link>
                        )}

                        <Link
                            href={route('accounting.payments.index')}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Daftar Pembayaran
                        </Link>
                    </div>

                    <OdooStatusBar
                        steps={[
                            { key: 'draft', label: 'Draft' },
                            { key: 'reconciled', label: 'Reconciled' },
                        ]}
                        current={payment.status}
                    />
                </div>

                {/* Sheet Utama */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Smart Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-50/70 px-6 py-3">
                        {firstAlloc && (
                            <OdooSmartButton
                                label={firstAlloc.document_label}
                                value={`${firstAlloc.document_id} (Residual: ${formatRp(firstAlloc.amount_residual)})`}
                                href={firstAlloc.document_url}
                            />
                        )}
                        {payment.journal_entry_id && (
                            <OdooSmartButton
                                label="Jurnal Kas/Bank"
                                value={payment.journal_entry_no}
                                href={route('accounting.journals.show', payment.journal_entry_id)}
                            />
                        )}
                        <OdooSmartButton
                            label={`Saldo GL ${bankLedger?.account_code}`}
                            value={formatRp(bankLedger?.balance)}
                            href={route('accounting.gl.index', { account: bankLedger?.account_code || '1020' })}
                        />
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    {payment.payment_type === 'inbound'
                                        ? 'Inbound Customer Payment (Penerimaan Piutang — T-25)'
                                        : 'Outbound Vendor Payment (Pelunasan Utang — T-26)'}
                                </div>
                                <h1 className="mt-0.5 font-mono text-2xl font-extrabold text-gray-900">
                                    {payment.id}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <OdooBadge status={payment.status} />
                                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-indigo-800">
                                        Idempotency Key: {payment.idempotency_key}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-right">
                                <div className="text-xs font-semibold text-emerald-800">
                                    Nominal Pembayaran Direkonsiliasi
                                </div>
                                <div className="mt-0.5 font-mono text-2xl font-extrabold text-emerald-700">
                                    {formatRp(payment.amount)}
                                </div>
                                <div className="mt-1 text-[11px] font-medium text-emerald-900">
                                    Akun: {payment.bank_account_code} — {payment.bank_account_name}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Pembayaran */}
                        <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 text-xs md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mitra Bisnis ({payment.party_type}):</span>
                                    <span className="font-bold text-gray-900">
                                        {payment.party_name} ({payment.party_id})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Metode Pembayaran:</span>
                                    <span className="font-semibold text-gray-800">{payment.payment_method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal Pembayaran:</span>
                                    <span className="font-mono text-gray-900">{payment.payment_date}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Referensi / Memo:</span>
                                    <span className="font-mono text-gray-800">{payment.reference || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nomor Jurnal Buku Besar:</span>
                                    <span className="font-mono font-bold text-indigo-700">
                                        {payment.journal_entry_no}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Diposting Oleh:</span>
                                    <span className="text-gray-800">
                                        {payment.posted_by || 'System'} ({payment.posted_at})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Status Alokasi Tagihan / Faktur (Bukti Wajib T-25 & T-26) */}
                        <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                                1. Status Rekonsiliasi & Residual Faktur/Tagihan (Bukti Skenario T-25 & T-26)
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                    <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2.5">Jenis Dokumen</th>
                                            <th className="px-4 py-2.5">No. Dokumen</th>
                                            <th className="px-4 py-2.5">Mitra</th>
                                            <th className="px-4 py-2.5 text-right">Grand Total Dokumen</th>
                                            <th className="px-4 py-2.5 text-right">Dialokasikan di Sini</th>
                                            <th className="px-4 py-2.5 text-right">Total Terbayar</th>
                                            <th className="px-4 py-2.5 text-right">Sisa Tagihan (Residual)</th>
                                            <th className="px-4 py-2.5 text-center">Status Dokumen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(payment.allocations || []).map((alloc) => (
                                            <tr key={alloc.id}>
                                                <td className="px-4 py-2.5 font-semibold text-gray-700">
                                                    {alloc.document_label}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono font-bold text-odoo-purple">
                                                    <Link href={alloc.document_url} className="hover:underline">
                                                        {alloc.document_id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2.5">{alloc.party_name}</td>
                                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                                    {formatRp(alloc.grand_total)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                                    {formatRp(alloc.amount_allocated)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
                                                    {formatRp(alloc.amount_paid)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-extrabold text-indigo-700">
                                                    {formatRp(alloc.amount_residual)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <OdooBadge status={alloc.document_status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabel Jurnal Pembayaran */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    2. Entri Jurnal Pembayaran ({payment.journal_entry_no})
                                </h3>
                                <span className="font-mono text-xs font-bold text-emerald-700">
                                    Debit {formatRp(totalDebit)} = Kredit {formatRp(totalCredit)}
                                </span>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                    <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2">Kode Akun</th>
                                            <th className="px-4 py-2">Nama Akun</th>
                                            <th className="px-4 py-2">Deskripsi</th>
                                            <th className="px-4 py-2 text-right">Debit</th>
                                            <th className="px-4 py-2 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(payment.journal_lines || []).map((jl) => (
                                            <tr key={jl.id}>
                                                <td className="px-4 py-2 font-mono font-bold text-indigo-700">
                                                    {jl.account_code}
                                                </td>
                                                <td className="px-4 py-2 font-semibold text-gray-900">
                                                    {jl.account_name}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">{jl.description}</td>
                                                <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-700">
                                                    {jl.debit > 0 ? formatRp(jl.debit) : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-semibold text-amber-700">
                                                    {jl.credit > 0 ? formatRp(jl.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabel Ledger Bank (Bukti Wajib T-25 & T-26) */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    3. Buku Besar Akun {bankLedger?.account_code} ({bankLedger?.account_name}) — Bukti Wajib Skenario T-25 & T-26
                                </h3>
                                <span className="rounded bg-emerald-100 px-2.5 py-1 font-mono text-xs font-extrabold text-emerald-900">
                                    Saldo Akhir Bank ({bankLedger?.account_code}): {formatRp(bankLedger?.balance)}
                                </span>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                    <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-3 py-2">No. Jurnal</th>
                                            <th className="px-3 py-2">Dokumen Sumber</th>
                                            <th className="px-3 py-2">Keterangan Mutasi</th>
                                            <th className="px-3 py-2 text-right">Debit (Uang Masuk)</th>
                                            <th className="px-3 py-2 text-right">Kredit (Uang Keluar)</th>
                                            <th className="px-3 py-2 text-right">Saldo Berjalan Bank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(bankLedger?.rows || []).map((row) => (
                                            <tr
                                                key={row.id}
                                                className={
                                                    row.source_document_id === payment.id
                                                        ? 'bg-emerald-50/70 font-semibold'
                                                        : ''
                                                }
                                            >
                                                <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                                                    {row.entry_no}
                                                </td>
                                                <td className="px-3 py-2 font-mono">{row.source_document_id}</td>
                                                <td className="px-3 py-2 text-gray-700">{row.line_description}</td>
                                                <td className="px-3 py-2 text-right font-mono text-emerald-700">
                                                    {row.debit > 0 ? formatRp(row.debit) : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-amber-700">
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
                    </div>
                </div>

                {/* Chatter & Audit Log Footer (Menampilkan bukti DUPLICATE pada T-26) */}
                <OdooFormFooter
                    documentType="payment"
                    documentId={payment.id}
                    relatedDocs={relatedDocs}
                    auditLogs={auditLogs}
                />
            </div>
        </AccountingLayout>
    );
}

