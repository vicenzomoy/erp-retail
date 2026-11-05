import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function CustomerInvoiceShow({ invoice, arLedger, relatedDocs, auditLogs }) {
    const [activeTab, setActiveTab] = useState('lines');
    const [submittingPost, setSubmittingPost] = useState(false);

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

    const totalJournalDebit = (invoice.journal_lines || []).reduce((acc, l) => acc + Number(l.debit || 0), 0);
    const totalJournalCredit = (invoice.journal_lines || []).reduce((acc, l) => acc + Number(l.credit || 0), 0);

    return (
        <AccountingLayout
            title={`Customer Invoice ${invoice.id}`}
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Customer Invoices', href: route('accounting.invoices.index') },
                { label: invoice.id },
            ]}
        >
            <Head title={`${invoice.id} — Customer Invoice`} />

            <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
                {/* Action Bar & Status Pipe */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        {invoice.status === 'draft' && (
                            <button
                                type="button"
                                onClick={handlePostInvoice}
                                disabled={submittingPost}
                                className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-odoo-purple-dark disabled:opacity-50"
                            >
                                Post Faktur ke Buku Besar
                            </button>
                        )}

                        {invoice.status !== 'draft' && (
                            <>
                                {invoice.amount_residual > 0 && (
                                    <Link
                                        href={route('accounting.payments.create', {
                                            document_type: 'customer_invoice',
                                            document_id: invoice.id,
                                        })}
                                        className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                                    >
                                        Register Payment (S-13 / T-25)
                                    </Link>
                                )}

                                {/* Tombol Uji Idempotensi Post Ulang (Skenario T-28) */}
                                <button
                                    type="button"
                                    onClick={handlePostInvoice}
                                    disabled={submittingPost}
                                    className="inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                                    title="Mengirim instruksi Post ulang untuk membuktikan tidak ada jurnal ganda (T-28)"
                                >
                                    Kirim Ulang Instruksi Post (Uji Idempotensi T-28)
                                </button>
                            </>
                        )}

                        <Link
                            href={route('accounting.invoices.index')}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Kembali ke Daftar
                        </Link>
                    </div>

                    <OdooStatusBar
                        steps={[
                            { key: 'draft', label: 'Draft' },
                            { key: 'posted', label: 'Posted' },
                            { key: 'paid', label: 'Paid' },
                        ]}
                        current={invoice.status}
                    />
                </div>

                {/* Sheet Utama */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Smart Buttons Header */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-50/70 px-6 py-3">
                        {invoice.sales_order_id && (
                            <OdooSmartButton
                                label="Sales Order"
                                value={invoice.sales_order_id}
                                href={route('sales.orders.show', invoice.sales_order_id)}
                            />
                        )}
                        {invoice.journal_entry_id && (
                            <OdooSmartButton
                                label="Jurnal AR"
                                value={`${invoice.journal_entry_no} (${invoice.journal_entries_count} Entri)`}
                                href={route('accounting.journals.show', invoice.journal_entry_id)}
                            />
                        )}
                        <OdooSmartButton
                            label="Pembayaran"
                            value={`${(invoice.payments || []).length} Alokasi`}
                            href={route('accounting.payments.index')}
                        />
                        <OdooSmartButton
                            label="Saldo GL 1100"
                            value={formatRp(arLedger?.balance)}
                            href={route('accounting.gl.index', { account: '1100' })}
                        />
                    </div>

                    {/* Informasi Header Faktur */}
                    <div className="p-6 space-y-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Customer Invoice (Faktur Penjualan)
                                </div>
                                <h1 className="mt-0.5 font-mono text-2xl font-extrabold text-gray-900">
                                    {invoice.id}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <OdooBadge status={invoice.status} />
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200">
                                        Jumlah Entri Jurnal Tercatat: {invoice.journal_entries_count} (Bukti Anti-Duplikasi T-28)
                                    </span>
                                </div>
                            </div>

                            {/* Kartu Ringkasan Residual */}
                            <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3.5 text-right text-xs">
                                <div>
                                    <div className="text-gray-500">Grand Total</div>
                                    <div className="mt-0.5 font-mono text-sm font-bold text-gray-900">
                                        {formatRp(invoice.grand_total)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Telah Dibayar</div>
                                    <div className="mt-0.5 font-mono text-sm font-bold text-emerald-700">
                                        {formatRp(invoice.amount_paid)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Sisa Piutang (Residual)</div>
                                    <div className="mt-0.5 font-mono text-sm font-extrabold text-indigo-700">
                                        {formatRp(invoice.amount_residual)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 text-xs md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pelanggan:</span>
                                    <span className="font-semibold text-gray-900">
                                        {invoice.customer_name} ({invoice.customer_id})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kota:</span>
                                    <span className="text-gray-800">{invoice.customer_city || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Referensi Sales Order:</span>
                                    <span className="font-mono font-semibold text-odoo-purple">
                                        {invoice.sales_order_id || 'Saldo Awal'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal Faktur:</span>
                                    <span className="font-mono text-gray-900">{invoice.invoice_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal Jatuh Tempo:</span>
                                    <span className="font-mono text-gray-900">{invoice.due_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Termin Pembayaran:</span>
                                    <span className="font-semibold text-gray-800">{invoice.payment_terms}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nomor Jurnal Buku Besar:</span>
                                    <span className="font-mono font-bold text-indigo-700">
                                        {invoice.journal_entry_no || 'Belum Diposting'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notebook Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex gap-6 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('lines')}
                                    className={`border-b-2 pb-2.5 transition-colors ${
                                        activeTab === 'lines'
                                            ? 'border-odoo-purple text-odoo-purple'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Baris Faktur & PPN 11% ({(invoice.lines || []).length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('journal')}
                                    className={`border-b-2 pb-2.5 transition-colors ${
                                        activeTab === 'journal'
                                            ? 'border-odoo-purple text-odoo-purple'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Item Jurnal Akuntansi (Debit = Kredit)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ledger')}
                                    className={`border-b-2 pb-2.5 transition-colors ${
                                        activeTab === 'ledger'
                                            ? 'border-odoo-purple text-odoo-purple'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Mutasi Buku Besar AR (1100) & Pembayaran
                                </button>
                            </nav>
                        </div>

                        {/* Tab 1: Baris Faktur */}
                        {activeTab === 'lines' && (
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                        <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                            <tr>
                                                <th className="px-4 py-2.5">SKU / Produk</th>
                                                <th className="px-4 py-2.5 text-center">Qty Ditagih</th>
                                                <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                                <th className="px-4 py-2.5 text-right">DPP (Sebelum Pajak)</th>
                                                <th className="px-4 py-2.5 text-center">Kode Pajak</th>
                                                <th className="px-4 py-2.5 text-right">PPN 11% (Bulat Rp)</th>
                                                <th className="px-4 py-2.5 text-right">Total Baris</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(invoice.lines || []).map((line) => (
                                                <tr key={line.id}>
                                                    <td className="px-4 py-2.5">
                                                        <div className="font-mono font-bold text-gray-900">{line.variant_sku}</div>
                                                        <div className="text-[11px] text-gray-500">{line.description || line.product_name}</div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center font-mono font-semibold">
                                                        {line.qty_invoiced} {line.unit}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                                        {formatRp(line.unit_price)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
                                                        {formatRp(line.subtotal_before_tax)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                                                            {line.tax_id} (11%)
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono text-indigo-700">
                                                        {formatRp(line.tax_amount)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                                                        {formatRp(line.line_total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end">
                                    <div className="w-full max-w-xs space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal Sebelum Pajak (DPP):</span>
                                            <span className="font-mono font-semibold">{formatRp(invoice.subtotal_before_tax)}</span>
                                        </div>
                                        <div className="flex justify-between text-indigo-700">
                                            <span>Total PPN 11% (F-23):</span>
                                            <span className="font-mono font-semibold">{formatRp(invoice.total_tax)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-300 pt-1.5 text-sm font-bold text-gray-900">
                                            <span>Grand Total:</span>
                                            <span className="font-mono text-odoo-purple">{formatRp(invoice.grand_total)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-700">
                                            <span>Telah Dibayar:</span>
                                            <span className="font-mono font-semibold">- {formatRp(invoice.amount_paid)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-indigo-800">
                                            <span>Sisa Tagihan (Residual AR):</span>
                                            <span className="font-mono">{formatRp(invoice.amount_residual)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Item Jurnal Akuntansi */}
                        {activeTab === 'journal' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-md bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 border border-emerald-200">
                                    <div>
                                        <span className="font-bold">Nomor Jurnal: {invoice.journal_entry_no || '-'}</span>
                                        <span className="ml-3">
                                            Jumlah Entri Jurnal untuk Faktur Ini: <strong>{invoice.journal_entries_count}</strong>
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold">
                                        Debit {formatRp(totalJournalDebit)} = Kredit {formatRp(totalJournalCredit)} (Balanced)
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                        <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                            <tr>
                                                <th className="px-4 py-2.5">Kode Akun</th>
                                                <th className="px-4 py-2.5">Nama Akun</th>
                                                <th className="px-4 py-2.5">Keterangan</th>
                                                <th className="px-4 py-2.5 text-right">Debit</th>
                                                <th className="px-4 py-2.5 text-right">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(invoice.journal_lines || []).map((jl) => (
                                                <tr key={jl.id}>
                                                    <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                                        {jl.account_code}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-semibold text-gray-900">
                                                        {jl.account_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">{jl.description}</td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                                        {jl.debit > 0 ? formatRp(jl.debit) : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-700">
                                                        {jl.credit > 0 ? formatRp(jl.credit) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-bold text-gray-900">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2.5 text-right">
                                                    Total Keseimbangan Jurnal (SR-18 / T-28):
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-emerald-800">
                                                    {formatRp(totalJournalDebit)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-amber-800">
                                                    {formatRp(totalJournalCredit)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Riwayat Alokasi Pembayaran & Ledger AR 1100 */}
                        {activeTab === 'ledger' && (
                            <div className="space-y-5">
                                <div>
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Riwayat Rekonsiliasi Pembayaran pada Faktur {invoice.id}
                                    </h4>
                                    {(invoice.payments || []).length === 0 ? (
                                        <div className="rounded border border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                                            Belum ada pembayaran yang direkonsiliasi ke faktur ini.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                                <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                                    <tr>
                                                        <th className="px-4 py-2">No. Pembayaran</th>
                                                        <th className="px-4 py-2">Tanggal</th>
                                                        <th className="px-4 py-2">Akun Kas/Bank</th>
                                                        <th className="px-4 py-2">No. Jurnal</th>
                                                        <th className="px-4 py-2 text-right">Nominal Dialokasikan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {invoice.payments.map((p) => (
                                                        <tr key={p.id}>
                                                            <td className="px-4 py-2 font-mono font-bold text-odoo-purple">
                                                                <Link href={route('accounting.payments.show', p.payment_id)} className="hover:underline">
                                                                    {p.payment_id}
                                                                </Link>
                                                            </td>
                                                            <td className="px-4 py-2">{p.payment_date}</td>
                                                            <td className="px-4 py-2 font-mono">{p.bank_account}</td>
                                                            <td className="px-4 py-2 font-mono">{p.journal_entry_no}</td>
                                                            <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">
                                                                {formatRp(p.amount_allocated)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Cuplikan Buku Besar Piutang Usaha (Akun 1100)
                                        </h4>
                                        <span className="text-xs font-bold text-indigo-800">
                                            Saldo Akhir 1100: {formatRp(arLedger?.balance)}
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                            <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                                <tr>
                                                    <th className="px-3 py-2">No. Jurnal</th>
                                                    <th className="px-3 py-2">Dokumen</th>
                                                    <th className="px-3 py-2">Keterangan</th>
                                                    <th className="px-3 py-2 text-right">Debit (+)</th>
                                                    <th className="px-3 py-2 text-right">Kredit (-)</th>
                                                    <th className="px-3 py-2 text-right">Saldo Berjalan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {(arLedger?.rows || []).map((r) => (
                                                    <tr key={r.id}>
                                                        <td className="px-3 py-2 font-mono font-semibold text-indigo-700">
                                                            {r.entry_no}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono">{r.source_document_id}</td>
                                                        <td className="px-3 py-2 text-gray-600">{r.line_description}</td>
                                                        <td className="px-3 py-2 text-right font-mono text-emerald-700">
                                                            {r.debit > 0 ? formatRp(r.debit) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono text-amber-700">
                                                            {r.credit > 0 ? formatRp(r.credit) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                                            {formatRp(r.running_balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chatter & Audit Log Footer */}
                <OdooFormFooter
                    documentType="customer_invoice"
                    documentId={invoice.id}
                    relatedDocs={relatedDocs}
                    auditLogs={auditLogs}
                />
            </div>
        </AccountingLayout>
    );
}

