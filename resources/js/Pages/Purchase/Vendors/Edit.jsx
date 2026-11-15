import React, { useRef, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    ArrowLeft,
    Save,
    Users,
    Building2,
    Lock,
    Plus,
    Trash2,
    Package,
    AlertCircle,
} from 'lucide-react';

export default function Edit({ vendor, pricelists = [], paymentTerms = [], products = [] }) {
    const submittingRef = useRef(false);

    const { data, setData, put, processing, errors } = useForm({
        name: vendor.name ?? '',
        city: vendor.city ?? '',
        payment_terms: vendor.payment_terms || paymentTerms[0]?.term_id || 'NET30',
        lines:
            pricelists.length > 0
                ? pricelists.map((p) => ({
                      variant_sku: p.variant_sku,
                      min_qty: p.min_qty ?? 1,
                      unit_price: p.unit_price ?? '',
                  }))
                : [
                      {
                          variant_sku: '',
                          min_qty: 1,
                          unit_price: '',
                      },
                  ],
    });

    const selectedSkus = useMemo(() => {
        return data.lines.map((l) => l.variant_sku).filter(Boolean);
    }, [data.lines]);

    const handleAddLine = () => {
        if (products.length > 0 && data.lines.length >= products.length) return;
        setData('lines', [
            ...data.lines,
            {
                variant_sku: '',
                min_qty: 1,
                unit_price: '',
            },
        ]);
    };

    const handleRemoveLine = (index) => {
        if (data.lines.length <= 1) return;
        const newLines = data.lines.filter((_, i) => i !== index);
        setData('lines', newLines);
    };

    const handleUpdateLine = (index, field, value) => {
        if (field === 'variant_sku' && value) {
            const isDuplicate = data.lines.some((l, i) => i !== index && l.variant_sku === value);
            if (isDuplicate) return;
        }
        const newLines = [...data.lines];
        newLines[index] = {
            ...newLines[index],
            [field]: value,
        };
        setData('lines', newLines);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submittingRef.current || processing) return;

        submittingRef.current = true;
        put(route('purchase.vendors.update', vendor.id), {
            onFinish: () => {
                submittingRef.current = false;
            },
        });
    };

    return (
        <PurchaseLayout
            title={`Edit Vendor ${vendor.name}`}
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pemasok (Vendors)', href: route('purchase.vendors.index') },
                { label: vendor.name, href: route('purchase.vendors.show', vendor.id) },
                { label: 'Edit' },
            ]}
        >
            <Head title={`Edit Vendor ${vendor.name} — Bara Wear`} />

            {/* Header Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.show', vendor.id)}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Detail Vendor"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Edit Pemasok (Vendor) — {vendor.id}
                        </h1>
                        <p className="text-xs text-slate-500">
                            Perbarui profil perusahaan, termin pembayaran, dan daftar barang pricelist.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.show', vendor.id)}
                        className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Batal
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Card Profil Vendor */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Users className="h-4 w-4 text-slate-700" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Informasi Profil Pemasok
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Kode Vendor (ID)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={vendor.id}
                                    readOnly
                                    disabled
                                    className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono font-bold text-slate-700 cursor-not-allowed pr-8"
                                />
                                <Lock className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Nama Perusahaan / Pemasok <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Kota Domisili / Pabrik <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                    required
                                />
                            </div>
                            {errors.city && (
                                <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.city}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Termin Pembayaran Standar <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.payment_terms}
                                onChange={(e) => setData('payment_terms', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                required
                            >
                                {paymentTerms.map((t) => (
                                    <option key={t.term_id} value={t.term_id}>
                                        {t.term_id} — {t.description}
                                    </option>
                                ))}
                            </select>
                            {errors.payment_terms && (
                                <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.payment_terms}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Card Daftar Barang Vendor (Pricelist) */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-700" />
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Katalog Barang & Pricelist Vendor
                                </h2>
                                <p className="text-[11px] text-slate-400">
                                    Daftarkan produk yang dapat dibeli dari pemasok ini beserta harga kontraknya.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddLine}
                            disabled={products.length > 0 && data.lines.length >= products.length}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Barang
                        </button>
                    </div>

                    {errors.lines && (
                        <div className="mb-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{errors.lines}</span>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                                    <th className="px-3 py-2.5 min-w-[260px]">Produk / SKU Barang *</th>
                                    <th className="px-3 py-2.5 w-32 text-right">Min. Qty Order *</th>
                                    <th className="px-3 py-2.5 w-48 text-right">Harga Beli / Unit (Rp) *</th>
                                    <th className="px-3 py-2.5 w-16 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.map((line, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <select
                                                value={line.variant_sku}
                                                onChange={(e) => handleUpdateLine(index, 'variant_sku', e.target.value)}
                                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                                required
                                            >
                                                <option value="">-- Pilih Produk --</option>
                                                {products.map((p) => {
                                                    const isTaken = selectedSkus.includes(p.variant_sku) && line.variant_sku !== p.variant_sku;
                                                    return (
                                                        <option
                                                            key={p.variant_sku}
                                                            value={p.variant_sku}
                                                            disabled={isTaken}
                                                        >
                                                            [{p.variant_sku}] {p.name} ({p.size}/{p.color})
                                                            {isTaken ? ' — Sudah dipilih' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {errors[`lines.${index}.variant_sku`] && (
                                                <p className="mt-1 text-[10px] text-rose-600">{errors[`lines.${index}.variant_sku`]}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={line.min_qty}
                                                onChange={(e) => handleUpdateLine(index, 'min_qty', e.target.value)}
                                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-right font-semibold text-slate-900 focus:border-slate-500 focus:outline-none"
                                                required
                                            />
                                            {errors[`lines.${index}.min_qty`] && (
                                                <p className="mt-1 text-[10px] text-rose-600">{errors[`lines.${index}.min_qty`]}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={line.unit_price}
                                                onChange={(e) => handleUpdateLine(index, 'unit_price', e.target.value)}
                                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-right font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                                                required
                                            />
                                            {errors[`lines.${index}.unit_price`] && (
                                                <p className="mt-1 text-[10px] text-rose-600">{errors[`lines.${index}.unit_price`]}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLine(index)}
                                                disabled={data.lines.length <= 1}
                                                className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                                title="Hapus Baris"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </PurchaseLayout>
    );
}

