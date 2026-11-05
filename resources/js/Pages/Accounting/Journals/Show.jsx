import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function JournalEntryShow({ entry, stockMoves, relatedDocs, auditLogs }) {
    return (
        <AccountingLayout
            title={`Journal Entry ${entry.entry_no}`}
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Journal Entries (S-14)', href: route('accounting.journals.index') },
                { label: entry.entry_no },
            ]}
        >
            <Head title={`${entry.entry_no} — Journal Entry`} />

            <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
                {/* Action Bar & Status Pipe */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        {entry.source_url && (
                            <Link
                                href={entry.source_url}
                                className="rounded bg-odoo-purple px-3.5 py-1.5 text-xs font-bold text-white hover:bg-odoo-purple-dark"
                            >
                                Buka Dokumen Sumber ({entry.source_document_id})
                            </Link>
                        )}
                        <Link
                            href={route('accounting.gl.index')}
                            className="rounded border border-indigo-300 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                        >
                            Lihat di General Ledger (S-14)
                        </Link>
                        <Link
                            href={route('accounting.journals.index')}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Kembali ke Daftar Jurnal
                        </Link>
                    </div>

                    <OdooStatusBar
                        steps={[
                            { key: 'draft', label: 'Draft' },
                            { key: 'posted', label: 'Posted' },
                        ]}
                        current={entry.status}
                    />
                </div>

                {/* Sheet Utama */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Smart Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-50/70 px-6 py-3">
                        {entry.source_url && (
                            <OdooSmartButton
                                label="Dokumen Sumber"
                                value={entry.source_document_id}
                                href={entry.source_url}
                            />
                        )}
                        <OdooSmartButton
                            label="Jurnal Dokumen Ini"
                            value={`${entry.same_source_journal_count} Entri (T-28)`}
                            href={route('accounting.journals.index', { search: entry.source_document_id })}
                        />
                        <OdooSmartButton
                            label="Stock Moves"
                            value={`${(stockMoves || []).length} Mutasi (T-27)`}
                            href={route('accounting.gl.index', { account: '5000' })}
                        />
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Journal Entry — Buku Besar Akuntansi (S-14 / F-16)
                                </div>
                                <h1 className="mt-0.5 font-mono text-2xl font-extrabold text-gray-900">
                                    {entry.entry_no}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <OdooBadge status={entry.status} />
                                    <span className="rounded bg-indigo-100 px-2.5 py-0.5 font-mono text-xs font-bold uppercase text-indigo-800">
                                        {entry.entry_type}
                                    </span>
                                    {entry.is_balanced && (
                                        <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-extrabold text-emerald-800 border border-emerald-300">
                                            SEIMBANG: Debit = Kredit ({formatRp(entry.total_debit)})
                                        </span>
                                    )}
                                    <span className="rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
                                        Jumlah Jurnal untuk Dokumen Sumber Ini: {entry.same_source_journal_count}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 text-right text-xs space-y-1">
                                <div>
                                    <span className="text-gray-500">Tanggal Jurnal: </span>
                                    <span className="font-mono font-bold text-gray-900">{entry.entry_date}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Dokumen Sumber: </span>
                                    <span className="font-mono font-bold text-odoo-purple">
                                        {entry.source_document_type} / {entry.source_document_id}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Diposting Oleh: </span>
                                    <span className="font-semibold text-gray-800">
                                        {entry.posted_by || 'System'} ({entry.posted_at})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-700">
                            <span className="font-bold text-gray-900">Keterangan Jurnal: </span>
                            {entry.description}
                        </div>

                        {/* Tabel Rincian Baris Jurnal */}
                        <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                                1. Rincian Baris Jurnal (Journal Items — Bukti Keseimbangan Debit = Kredit T-27 & T-28)
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                    <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2.5">Kode Akun</th>
                                            <th className="px-4 py-2.5">Nama Akun (CoA)</th>
                                            <th className="px-4 py-2.5">Tipe</th>
                                            <th className="px-4 py-2.5">SKU Produk</th>
                                            <th className="px-4 py-2.5">Deskripsi Baris</th>
                                            <th className="px-4 py-2.5 text-right">Debit</th>
                                            <th className="px-4 py-2.5 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(entry.lines || []).map((line) => (
                                            <tr key={line.id}>
                                                <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                                    <Link
                                                        href={route('accounting.gl.index', { account: line.account_code })}
                                                        className="hover:underline"
                                                    >
                                                        {line.account_code}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-gray-900">
                                                    {line.account_name}
                                                </td>
                                                <td className="px-4 py-2.5 uppercase text-[11px] text-gray-500">
                                                    {line.account_type}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-gray-700">
                                                    {line.variant_sku || '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-600">{line.description}</td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                                    {line.debit > 0 ? formatRp(line.debit) : '-'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700">
                                                    {line.credit > 0 ? formatRp(line.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-extrabold text-gray-900">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-2.5 text-right">
                                                Total Keseimbangan Jurnal (Debit = Kredit):
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-emerald-800">
                                                {formatRp(entry.total_debit)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-amber-800">
                                                {formatRp(entry.total_credit)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Tabel Entri Stock Move Terkait (Bukti Wajib Skenario T-27 COGS) */}
                        <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                                2. Entri Stock Move Terkait (Bukti Keterlacakan Valuasi Persediaan & COGS — Skenario T-27)
                            </h3>
                            {(stockMoves || []).length === 0 ? (
                                <div className="rounded border border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                                    Jurnal ini berasal dari transaksi finansial murni (tidak memiliki mutasi fisik Stock Move langsung).
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                        <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
                                            <tr>
                                                <th className="px-4 py-2">ID Move</th>
                                                <th className="px-4 py-2">Dokumen</th>
                                                <th className="px-4 py-2">SKU / Produk</th>
                                                <th className="px-4 py-2">Rute Lokasi</th>
                                                <th className="px-4 py-2 text-center">Qty Done</th>
                                                <th className="px-4 py-2 text-right">Harga Pokok Satuan (Cost)</th>
                                                <th className="px-4 py-2 text-right">Total Nilai Persediaan / COGS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {stockMoves.map((sm) => (
                                                <tr key={sm.id}>
                                                    <td className="px-4 py-2 font-mono font-bold text-gray-700">
                                                        #{sm.id}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono font-semibold text-odoo-purple">
                                                        {sm.source_document_id}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="font-mono font-bold text-gray-900">
                                                            {sm.variant_sku}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500">{sm.product_name}</div>
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                                                        {sm.location_from} → {sm.location_to}
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono font-bold text-gray-900">
                                                        {sm.qty_done} pcs
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                                                        {formatRp(sm.unit_cost)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono font-extrabold text-indigo-700">
                                                        {formatRp(sm.total_value)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chatter & Audit Log Footer */}
                <OdooFormFooter
                    documentType="journal_entry"
                    documentId={entry.entry_no}
                    relatedDocs={relatedDocs}
                    auditLogs={auditLogs}
                />
            </div>
        </AccountingLayout>
    );
}

