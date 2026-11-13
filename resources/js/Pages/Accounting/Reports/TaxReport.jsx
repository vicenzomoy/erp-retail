import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    Percent,
    FileCheck2,
    FileSpreadsheet,
    RotateCcw,
    ArrowUpRight,
    Scale,
    CreditCard,
    CheckCircle2,
    Clock,
    Landmark,
    X,
    AlertCircle,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function TaxReport({ report, flash }) {
    const policy     = report?.tax_policy || {};
    const summary    = report?.summary || {};
    const invoices   = report?.invoices || [];
    const creditNotes = report?.credit_notes || [];
    const vendorBills = report?.vendor_bills || [];
    const taxPayments = report?.tax_payments || [];

    const [showPayVatModal, setShowPayVatModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount:       '',
        payment_date: new Date().toISOString().split('T')[0],
        notes:        '',
    });

    const handlePayVat = (e) => {
        e.preventDefault();
        post(route('accounting.reports.tax.pay-vat'), {
            onSuccess: () => {
                setShowPayVatModal(false);
                reset();
            },
        });
    };

    return (
        <AccountingLayout
            title="Laporan Pajak"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Laporan' },
                { label: 'Laporan Pajak' },
            ]}
        >
            <Head title="Laporan Pajak (PPN) — Accounting" />

            <div className="space-y-6">
                {/* Flash Success */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {/* Header & Tax Policy Banner */}
                <div className="flex flex-col justify-between gap-4 rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-emerald-600" />
                            <h1 className="text-lg font-bold text-slate-900">
                                Laporan Pajak Pertambahan Nilai (PPN Keluaran vs PPN Masukan)
                            </h1>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Skema Pajak: <strong className="text-slate-700">{policy.tax_id}</strong>{' '}
                            (Tarif Formal {policy.formal_rate} &bull; DPP Nilai Lain{' '}
                            {policy.tax_base_factor} &bull; Tarif Efektif{' '}
                            <strong className="text-emerald-700">{policy.effective_rate}</strong> &bull;{' '}
                            {policy.rounding_policy})
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowPayVatModal(true)}
                            className="inline-flex items-center gap-1.5 rounded border border-amber-400 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
                        >
                            <Landmark className="h-3.5 w-3.5" />
                            <span>Bayar PPN ke Negara</span>
                        </button>
                        <Link
                            href={route('accounting.reports.general-ledger', { account: '2200' })}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Buku Besar Pajak</span>
                        </Link>
                    </div>
                </div>

                {/* 5 KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* PPN Keluaran Total */}
                    <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                PPN Keluaran (Total)
                            </p>
                            <Link
                                href={route('accounting.reports.general-ledger', { account: '2200' })}
                                className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-0.5"
                            >
                                <span>GL 2200</span>
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-amber-700">
                            {formatRp(summary.output_vat_total)}
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700">
                            Faktur: {formatRp(summary.invoice_tax_total)}{summary.credit_note_tax > 0 ? ` • Retur: -${formatRp(summary.credit_note_tax)}` : ''}
                        </p>
                    </div>

                    {/* Sudah Dibayar ke Negara */}
                    <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 shadow-xs">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                                Sudah Dibayar ke Negara
                            </p>
                        </div>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-700">
                            {formatRp(summary.output_vat_paid)}
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-700">
                            {taxPayments.length} kali pembayaran tercatat
                        </p>
                    </div>

                    {/* Sisa Terutang */}
                    <div className={`rounded-sm border p-4 shadow-xs ${(summary.output_vat_remaining || 0) > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center gap-1.5">
                            <Clock className={`h-3.5 w-3.5 ${(summary.output_vat_remaining || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`} />
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${(summary.output_vat_remaining || 0) > 0 ? 'text-rose-800' : 'text-slate-700'}`}>
                                Sisa Belum Dibayar
                            </p>
                        </div>
                        <p className={`mt-1.5 font-mono text-xl font-extrabold ${(summary.output_vat_remaining || 0) > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                            {formatRp(summary.output_vat_remaining)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Terutang ke kas negara
                        </p>
                    </div>

                    {/* PPN Masukan */}
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                                PPN Masukan (Akun 1300)
                            </p>
                            <Link
                                href={route('accounting.reports.general-ledger', { account: '1300' })}
                                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                                <span>GL 1300</span>
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <p className="mt-1.5 font-mono text-xl font-extrabold text-emerald-700">
                            {formatRp(summary.input_vat_gl)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Kredit dari {vendorBills.length} Tagihan Pemasok
                        </p>
                    </div>

                    {/* Posisi PPN Bersih */}
                    <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                            Posisi Rekonsiliasi Bersih
                        </p>
                        <p
                            className={`mt-1.5 font-mono text-xl font-extrabold ${
                                (summary.net_tax_payable || 0) > 0
                                    ? 'text-rose-700'
                                    : 'text-emerald-700'
                            }`}
                        >
                            {formatRp(Math.abs(summary.net_tax_payable || 0))}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-700">
                            {summary.status_label}
                        </p>
                    </div>
                </div>

                {/* Tabel 1: Daftar Faktur Pelanggan (PPN Keluaran) */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="h-4 w-4 text-amber-600" />
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                1. Rincian PPN Keluaran — Faktur Penjualan Pelanggan (Customer Invoices)
                            </h2>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-800">
                            Total PPN Faktur: {formatRp(summary.invoice_tax_total)}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                                <tr>
                                    <th className="px-4 py-2.5">No. Faktur</th>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5">Pelanggan</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5 text-right">DPP (Sebelum Pajak)</th>
                                    <th className="px-4 py-2.5 text-right">PPN Keluaran (11%)</th>
                                    <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                                            Belum ada Faktur Pelanggan berstatus Posted/Paid.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                                                <Link href={inv.url} className="hover:underline">
                                                    {inv.id}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-600">{inv.date}</td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-900">{inv.partner_name}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatRp(inv.subtotal_before_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700">{formatRp(inv.total_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatRp(inv.grand_total)}</td>
                                        </tr>
                                    ))
                                )}
                                {invoices.length > 0 && (
                                    <tr className="bg-amber-50 font-bold">
                                        <td colSpan={5} className="px-4 py-2.5 text-right text-xs uppercase text-amber-800">Total PPN Keluaran</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-amber-800">{formatRp(summary.invoice_tax_total)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-800">{formatRp(invoices.reduce((s, i) => s + i.grand_total, 0))}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabel 2: Nota Kredit Pengurang PPN Keluaran (jika ada) */}
                {creditNotes.length > 0 && (
                    <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-rose-600" />
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                    2. Pengurang PPN Keluaran — Nota Kredit Retur (Credit Notes)
                                </h2>
                            </div>
                            <span className="text-[11px] font-semibold text-rose-700">
                                Total Koreksi PPN: -{formatRp(summary.credit_note_tax)}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                                    <tr>
                                        <th className="px-4 py-2.5">No. Nota Kredit</th>
                                        <th className="px-4 py-2.5">Tanggal</th>
                                        <th className="px-4 py-2.5">Pelanggan</th>
                                        <th className="px-4 py-2.5 text-right">DPP Retur</th>
                                        <th className="px-4 py-2.5 text-right">Koreksi PPN</th>
                                        <th className="px-4 py-2.5 text-right">Total Kredit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {creditNotes.map((cn) => (
                                        <tr key={cn.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-rose-700">
                                                <Link href={cn.url} className="hover:underline">{cn.id}</Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-600">{cn.date}</td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-900">{cn.partner_name}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">-{formatRp(cn.subtotal_before_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-700">-{formatRp(cn.total_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">-{formatRp(cn.grand_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tabel 3: Daftar Tagihan Pemasok (PPN Masukan) */}
                <div className="rounded-sm border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                                {creditNotes.length > 0 ? '3.' : '2.'} Rincian PPN Masukan — Tagihan Pembelian Pemasok (Vendor Bills)
                            </h2>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800">
                            Total PPN Masukan: {formatRp(summary.bill_tax_total)}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold uppercase text-slate-500 text-[11px]">
                                <tr>
                                    <th className="px-4 py-2.5">No. Tagihan</th>
                                    <th className="px-4 py-2.5">Tanggal</th>
                                    <th className="px-4 py-2.5">Pemasok (Vendor)</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5 text-right">DPP Pembelian</th>
                                    <th className="px-4 py-2.5 text-right">PPN Masukan (11%)</th>
                                    <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vendorBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                                            Belum ada Tagihan Pemasok berstatus Posted/Paid.
                                        </td>
                                    </tr>
                                ) : (
                                    vendorBills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">
                                                <Link href={bill.url} className="hover:underline">{bill.id}</Link>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-slate-600">{bill.date}</td>
                                            <td className="px-4 py-2.5 font-semibold text-slate-900">{bill.partner_name}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{formatRp(bill.subtotal_before_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">{formatRp(bill.total_tax)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatRp(bill.grand_total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabel 4: Riwayat Pembayaran PPN ke Negara */}
                {taxPayments.length > 0 && (
                    <div className="rounded-sm border border-amber-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-amber-700" />
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                                    {creditNotes.length > 0 ? '4.' : '3.'} Riwayat Pembayaran PPN Keluaran ke Negara
                                </h2>
                            </div>
                            <span className="text-[11px] font-semibold text-amber-800">
                                Total Dibayar: {formatRp(taxPayments.reduce((s, p) => s + p.amount, 0))}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                                <thead className="bg-amber-50 font-semibold uppercase text-amber-800 text-[11px]">
                                    <tr>
                                        <th className="px-4 py-2.5">No. Jurnal</th>
                                        <th className="px-4 py-2.5">Tanggal Bayar</th>
                                        <th className="px-4 py-2.5">Keterangan</th>
                                        <th className="px-4 py-2.5 text-right">Jumlah Dibayar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {taxPayments.map((tp, idx) => (
                                        <tr key={idx} className="hover:bg-amber-50 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-amber-700">{tp.entry_no}</td>
                                            <td className="px-4 py-2.5 font-mono text-slate-600">{tp.date}</td>
                                            <td className="px-4 py-2.5 text-slate-700">{tp.description}</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-800">{formatRp(tp.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Bayar PPN ke Negara */}
            {showPayVatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-sm border border-slate-200 bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-amber-700" />
                                <h3 className="text-sm font-extrabold text-amber-900">Bayar PPN Keluaran ke Negara</h3>
                            </div>
                            <button
                                onClick={() => { setShowPayVatModal(false); reset(); }}
                                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Info box */}
                        <div className="mx-5 mt-4 flex items-start gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">Jurnal yang akan dibuat:</p>
                                <p className="mt-0.5">Dr 2200 (PPN Keluaran) — mengurangi kewajiban pajak</p>
                                <p>Cr 1020 (Bank) — uang keluar ke kas negara</p>
                                {(summary.output_vat_remaining || 0) > 0 && (
                                    <p className="mt-1 font-semibold text-amber-800">
                                        Sisa terutang: {formatRp(summary.output_vat_remaining)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handlePayVat} className="space-y-4 p-5">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Jumlah PPN yang Dibayar (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder={`Maks. ${formatRp(summary.output_vat_remaining)}`}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    required
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Tanggal Pembayaran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    required
                                />
                                {errors.payment_date && (
                                    <p className="mt-1 text-xs text-rose-600">{errors.payment_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Keterangan / Catatan
                                </label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Contoh: Masa pajak Oktober 2026"
                                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-xs text-rose-600">{errors.notes}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowPayVatModal(false); reset(); }}
                                    className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    disabled={processing}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition"
                                >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    {processing ? 'Memproses...' : 'Konfirmasi Pembayaran PPN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AccountingLayout>
    );
}
