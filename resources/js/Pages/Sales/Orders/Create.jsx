import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const TAX_RATE = 0.11;

function calcLine(line) {
    const qty = parseFloat(line?.qty_ordered) || 0;
    const price = parseFloat(line?.unit_price) || 0;
    const disc = parseFloat(line?.discount_pct) || 0;
    const dpp = qty * price * (1 - disc / 100);
    const ppn = Math.round(dpp * TAX_RATE);
    const total = dpp + ppn;
    return { dpp, ppn, total };
}

function blankLine() {
    return {
        _id: Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
        variant_sku: '',
        qty_ordered: 1,
        unit_price: 0,
        discount_pct: 0,
    };
}

// ─── Input Error ────────────────────────────────────────────────────────────
function InputError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-[11px] text-rose-600 font-medium">{message}</p>;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function SalesOrderCreate({
    customers = [],
    products = [],
    payment_terms = [],
    paymentTerms = [],
}) {
    const rawTerms = payment_terms?.length > 0 ? payment_terms : paymentTerms;
    const termsList = Array.isArray(rawTerms) ? rawTerms : [];

    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        payment_terms: '',
        notes: '',
        lines: [blankLine()],
    });

    const lines = data.lines || [];

    // Auto-fill payment terms when customer changes
    const handleCustomerChange = (customerId) => {
        const customer = customers.find((c) => String(c.id) === String(customerId));
        setSelectedCustomer(customer ?? null);
        setData((prev) => ({
            ...prev,
            customer_id: customerId,
            payment_terms: customer?.payment_terms || prev.payment_terms || '',
        }));
    };

    // Line helpers
    const addLine = () => {
        setData('lines', [...lines, blankLine()]);
    };

    const updateLine = (id, field, value) => {
        setData(
            'lines',
            lines.map((l) => {
                if (l._id !== id) return l;
                const updated = { ...l, [field]: value };
                // Auto-fill price from product
                if (field === 'variant_sku') {
                    const product = products.find(
                        (p) => String(p.variant_sku || p.sku) === String(value)
                    );
                    if (product) {
                        updated.unit_price =
                            product.sales_price ?? product.selling_price ?? product.price ?? 0;
                    }
                }
                return updated;
            })
        );
    };

    const removeLine = (id) => {
        if (lines.length <= 1) return;
        setData(
            'lines',
            lines.filter((l) => l._id !== id)
        );
    };

    // Totals
    const totals = lines.reduce(
        (acc, line) => {
            const { dpp, ppn, total } = calcLine(line);
            return { dpp: acc.dpp + dpp, ppn: acc.ppn + ppn, total: acc.total + total };
        },
        { dpp: 0, ppn: 0, total: 0 }
    );

    // Credit info
    const creditLimit = parseFloat(selectedCustomer?.credit_limit) || 0;
    const openAr = parseFloat(selectedCustomer?.open_ar) || 0;
    const headroom = creditLimit - openAr;
    const utilPct = creditLimit > 0 ? Math.min((openAr / creditLimit) * 100, 100) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('sales.orders.store'));
    };

    const stages = [
        { key: 'draft', label: 'Draft' },
        { key: 'confirmed', label: 'Dikonfirmasi' },
        { key: 'done', label: 'Selesai' },
    ];

    return (
        <SalesLayout
            title="Buat Quotation Baru"
            breadcrumbs={[
                { label: 'Orders', href: route('sales.orders.index') },
                { label: 'Buat Quotation Baru' },
            ]}
        >
            <Head title="Buat Quotation Baru — Sales Bara Wear" />

            {/* Back link */}
            <div className="mb-4">
                <Link
                    href={route('sales.orders.index')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke Daftar Order
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Form Header ── */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <OdooStatusBar status="draft" stages={stages} />
                        <h1 className="text-lg font-bold text-slate-900">Quotation Baru</h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={route('sales.orders.index')}
                            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60 transition"
                        >
                            {processing ? 'Menyimpan…' : 'Simpan sebagai Draft'}
                        </button>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
                        {/* Left column */}
                        <div className="space-y-4">
                            {/* Pelanggan */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Pelanggan <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                    className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white"
                                >
                                    <option value="">— Pilih Pelanggan —</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.id} — {c.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.customer_id} />
                            </div>

                            {/* Termin Pembayaran */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Termin Pembayaran
                                </label>
                                <select
                                    value={data.payment_terms}
                                    onChange={(e) => setData('payment_terms', e.target.value)}
                                    className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white"
                                >
                                    <option value="">— Pilih Termin —</option>
                                    {termsList.map((pt, idx) => {
                                        const termId =
                                            typeof pt === 'object' && pt !== null ? pt.term_id : pt;
                                        const termLabel =
                                            typeof pt === 'object' && pt !== null
                                                ? `${pt.term_id}${pt.description ? ` — ${pt.description}` : ''}`
                                                : pt;
                                        return (
                                            <option key={termId || idx} value={termId}>
                                                {termLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                                <InputError message={errors.payment_terms} />
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Catatan
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Catatan tambahan untuk order ini…"
                                    className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none"
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </div>

                        {/* Right column: credit info */}
                        <div className="space-y-4">
                            {selectedCustomer ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <p className="text-xs font-bold text-slate-700">
                                        Informasi Kredit Pelanggan ({selectedCustomer.name})
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded bg-white border border-slate-200 p-2">
                                            <p className="text-[10px] text-slate-500 font-medium">Limit Kredit</p>
                                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                                                {formatRp(creditLimit)}
                                            </p>
                                        </div>
                                        <div className="rounded bg-white border border-slate-200 p-2">
                                            <p className="text-[10px] text-slate-500 font-medium">AR Terbuka</p>
                                            <p className="text-xs font-bold text-rose-600 mt-0.5">
                                                {formatRp(openAr)}
                                            </p>
                                        </div>
                                        <div className="rounded bg-white border border-slate-200 p-2">
                                            <p className="text-[10px] text-slate-500 font-medium">Headroom</p>
                                            <p
                                                className={`text-xs font-bold mt-0.5 ${
                                                    headroom < 0 ? 'text-rose-600' : 'text-emerald-600'
                                                }`}
                                            >
                                                {formatRp(headroom)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Utilization bar */}
                                    <div>
                                        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                                            <span>Utilisasi Kredit</span>
                                            <span>{(isNaN(utilPct) ? 0 : utilPct).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    utilPct > 90
                                                        ? 'bg-rose-500'
                                                        : utilPct > 70
                                                        ? 'bg-amber-400'
                                                        : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(100, Math.max(0, utilPct))}%` }}
                                            />
                                        </div>
                                        {utilPct > 90 && (
                                            <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                                                <AlertTriangle className="h-3 w-3" />
                                                Limit kredit hampir penuh atau terlampaui!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                                    Pilih pelanggan untuk melihat informasi kredit dan sisa headroom.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Order Lines ── */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Baris Order</h2>
                        <button
                            type="button"
                            onClick={addLine}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Baris
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200">
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 min-w-[200px]">
                                        Produk / SKU
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 w-20">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-32">
                                        Harga Satuan
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-24">
                                        Disc %
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-28">
                                        DPP
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-24">
                                        PPN (11%)
                                    </th>
                                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 w-28">
                                        Total
                                    </th>
                                    <th className="px-3 py-2.5 w-10 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line) => {
                                    const { dpp, ppn, total } = calcLine(line);
                                    return (
                                        <tr key={line._id} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2">
                                                {products.length > 0 ? (
                                                    <select
                                                        value={line.variant_sku}
                                                        onChange={(e) =>
                                                            updateLine(line._id, 'variant_sku', e.target.value)
                                                        }
                                                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-blue-400 focus:outline-none bg-white"
                                                    >
                                                        <option value="">— Pilih Produk —</option>
                                                        {products.map((p) => {
                                                            const sku = p.variant_sku || p.sku;
                                                            const spec = [p.size, p.color]
                                                                .filter(Boolean)
                                                                .join('/');
                                                            return (
                                                                <option key={sku} value={sku}>
                                                                    {sku} — {p.name} {spec ? `(${spec})` : ''} -{' '}
                                                                    {formatRp(p.sales_price ?? p.selling_price ?? 0)}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={line.variant_sku}
                                                        onChange={(e) =>
                                                            updateLine(line._id, 'variant_sku', e.target.value)
                                                        }
                                                        placeholder="SKU produk"
                                                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-blue-400 focus:outline-none"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0.001"
                                                    step="any"
                                                    value={line.qty_ordered}
                                                    onChange={(e) =>
                                                        updateLine(line._id, 'qty_ordered', e.target.value)
                                                    }
                                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right tabular-nums text-slate-800 focus:border-blue-400 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={line.unit_price}
                                                    onChange={(e) =>
                                                        updateLine(line._id, 'unit_price', e.target.value)
                                                    }
                                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right tabular-nums text-slate-800 focus:border-blue-400 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    value={line.discount_pct}
                                                    onChange={(e) =>
                                                        updateLine(line._id, 'discount_pct', e.target.value)
                                                    }
                                                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-right tabular-nums text-slate-800 focus:border-blue-400 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-slate-700 font-medium whitespace-nowrap">
                                                {formatRp(dpp)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-slate-500 whitespace-nowrap">
                                                {formatRp(ppn)}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                                                {formatRp(total)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {lines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(line._id)}
                                                        className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                                                        title="Hapus Baris"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals footer */}
                    <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
                        <div className="w-72 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal (DPP)</span>
                                <span className="tabular-nums font-medium">{formatRp(totals.dpp)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>PPN (11%)</span>
                                <span className="tabular-nums font-medium">{formatRp(totals.ppn)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                                <span>Grand Total</span>
                                <span className="tabular-nums text-sm">{formatRp(totals.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <InputError message={errors.lines} />

                {/* ── Bottom Actions ── */}
                <div className="flex gap-2 justify-end mt-4">
                    <Link
                        href={route('sales.orders.index')}
                        className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60 transition cursor-pointer"
                    >
                        {processing ? 'Menyimpan…' : 'Simpan sebagai Draft'}
                    </button>
                </div>
            </form>
        </SalesLayout>
    );
}
