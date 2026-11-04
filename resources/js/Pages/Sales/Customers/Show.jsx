import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Users,
    CreditCard,
    DollarSign,
    ShieldAlert,
    Building2,
    Calendar,
    FileText,
    ReceiptText,
    ArrowLeft,
    Check,
    AlertCircle,
} from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const SO_STATUS_BADGE = {
    draft: 'bg-slate-100 text-slate-600',
    confirmed: 'bg-blue-100 text-blue-700',
    done: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

const INV_STATUS_BADGE = {
    draft: 'bg-slate-100 text-slate-600',
    posted: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function SalesCustomerShow({ customer, sales_orders = [], invoices = [] }) {
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        credit_limit: customer.credit_limit,
        payment_terms: customer.payment_terms || 'NET14',
    });

    const handleSave = (e) => {
        e.preventDefault();
        put(route('sales.customers.update', customer.id), {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const headroom = Math.max(0, (parseFloat(customer.credit_limit) || 0) - (parseFloat(customer.open_ar) || 0));
    const utilPct = parseFloat(customer.credit_utilization) || 0;

    return (
        <SalesLayout
            title={customer.name}
            breadcrumbs={[
                { label: 'Pelanggan', href: route('sales.customers.index') },
                { label: customer.name },
            ]}
        >
            <Head title={`${customer.name} — Detail Pelanggan`} />

            {/* Back link */}
            <div className="mb-4">
                <Link
                    href={route('sales.customers.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Daftar Pelanggan
                </Link>
            </div>

            {/* Top Customer Info Card */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg">
                            {customer.id}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
                                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold border ${
                                    customer.type === 'B2B'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {customer.type || 'Umum'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>Kota: {customer.city || '—'}</span>
                                <span>•</span>
                                <span>ID: <span className="font-mono font-semibold">{customer.id}</span></span>
                            </p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="rounded bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition self-start"
                        >
                            Ubah Plafon / Termin
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 self-start">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing}
                                className="rounded bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Simpan
                            </button>
                        </div>
                    )}
                </div>

                {/* Edit Form or Display */}
                {isEditing ? (
                    <form onSubmit={handleSave} className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Plafon Limit Kredit (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="100000"
                                value={data.credit_limit}
                                onChange={(e) => setData('credit_limit', e.target.value)}
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            {errors.credit_limit && (
                                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.credit_limit}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Termin Pembayaran
                            </label>
                            <select
                                value={data.payment_terms}
                                onChange={(e) => setData('payment_terms', e.target.value)}
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="CASH">CASH — Pembayaran Langsung</option>
                                <option value="NET14">NET14 — Jatuh tempo 14 hari</option>
                                <option value="NET30">NET30 — Jatuh tempo 30 hari</option>
                            </select>
                            {errors.payment_terms && (
                                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.payment_terms}</p>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded border border-slate-100 bg-slate-50/70 p-3">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Limit Kredit
                            </span>
                            <span className="text-base font-bold text-slate-900 tabular-nums">
                                {formatRp(customer.credit_limit)}
                            </span>
                        </div>
                        <div className="rounded border border-slate-100 bg-slate-50/70 p-3">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Piutang Terbuka (AR)
                            </span>
                            <span className="text-base font-bold text-rose-600 tabular-nums">
                                {formatRp(customer.open_ar)}
                            </span>
                        </div>
                        <div className="rounded border border-slate-100 bg-slate-50/70 p-3">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Sisa Plafon (Headroom)
                            </span>
                            <span className="text-base font-bold text-emerald-600 tabular-nums">
                                {formatRp(headroom)}
                            </span>
                        </div>
                        <div className="rounded border border-slate-100 bg-slate-50/70 p-3">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Termin Pembayaran
                            </span>
                            <span className="text-base font-bold text-slate-800">
                                {customer.payment_terms || 'CASH'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-700">Utilisasi Limit Kredit</span>
                        <span className="font-bold tabular-nums text-slate-900">{customer.credit_utilization}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className={`h-full ${
                                utilPct >= 90
                                    ? 'bg-rose-500'
                                    : utilPct >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, utilPct))}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sales Orders Table */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Riwayat Sales Order ({sales_orders.length})
                    </h3>
                    <Link
                        href={route('sales.orders.create')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                        + Buat Quotation
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">No. Order</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5">Item</th>
                                <th className="px-4 py-2.5 text-right">Grand Total</th>
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales_orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-slate-400">
                                        Belum ada Sales Order untuk pelanggan ini.
                                    </td>
                                </tr>
                            ) : (
                                sales_orders.map((so) => (
                                    <tr key={so.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                            {so.id}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                so.credit_hold
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : SO_STATUS_BADGE[so.status] || 'bg-slate-100'
                                            }`}>
                                                {so.credit_hold ? '⚠ Kredit Hold' : so.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                            {so.lines_count} baris
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                                            {formatRp(so.grand_total)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {so.created_at ? new Date(so.created_at).toLocaleDateString('id-ID') : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Link
                                                href={route('sales.orders.show', so.id)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                Lihat →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ReceiptText className="h-4 w-4 text-emerald-600" />
                        Faktur Piutang / Customer Invoices ({invoices.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">No. Invoice</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5">Tgl Faktur</th>
                                <th className="px-4 py-2.5">Jatuh Tempo</th>
                                <th className="px-4 py-2.5 text-right">Sisa Tagihan (AR)</th>
                                <th className="px-4 py-2.5 text-right">Grand Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-slate-400">
                                        Belum ada Faktur Pelanggan untuk kontak ini.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                            {inv.id}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                INV_STATUS_BADGE[inv.status] || 'bg-slate-100'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {inv.invoice_date || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {inv.due_date || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-rose-600 tabular-nums">
                                            {formatRp(inv.amount_residual)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                                            {formatRp(inv.grand_total)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SalesLayout>
    );
}

