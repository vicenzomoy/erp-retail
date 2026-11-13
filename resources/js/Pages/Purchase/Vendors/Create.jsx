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

export default function Create({ nextId, paymentTerms = [], products = [] }) {
    // Generate idempotency key unik untuk mencegah pengiriman ganda (double submit)
    const idempotencyKey = useMemo(() => {
        return 'vend_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    }, []);

    const submittingRef = useRef(false);

    // Form state: Tanpa autofill produk & harga (bersih)
    const { data, setData, post, processing, errors } = useForm({
        idempotency_key: idempotencyKey,
        name: '',
        city: '',
        payment_terms: paymentTerms[0]?.term_id || 'NET30',
        lines: [
            {
                variant_sku: '',
                min_qty: 1,
                unit_price: '',
            },
        ],
    });

    // Tambah baris barang kosong baru (tanpa autofill)
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

    // Hapus baris barang
    const handleRemoveLine = (index) => {
        if (data.lines.length <= 1) return;
        const newLines = data.lines.filter((_, i) => i !== index);
        setData('lines', newLines);
    };

    // Update field pada baris tanpa autofill harga
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
        post(route('purchase.vendors.store'), {
            onFinish: () => {
                submittingRef.current = false;
            },
        });
    };

    return (
        <PurchaseLayout
            title="Tambah Vendor Baru"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pemasok (Vendors)', href: route('purchase.vendors.index') },
                { label: 'Baru' },
            ]}
        >
            <Head title="Tambah Vendor Baru — Bara Wear" />

            {/* Header Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Vendor"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="h-5 w-5 text-amber-600" />
                            Tambah Pemasok (Vendor) Baru
                        </h1>
                        <p className="text-xs text-slate-500">
                            ID Vendor dibuat otomatis oleh sistem: <span className="font-mono font-bold text-amber-700">{nextId}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.index')}
                        className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Batal
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Vendor'}
                    </button>
                </div>
            </div>

            {/* Form Sheet Card */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bagian 1: Informasi Pokok Pemasok */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <h2 className="text-sm font-bold text-slate-900">
                            Informasi Profil Pemasok
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Kode Vendor (Auto-generated & Locked) */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Kode Vendor (ID)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nextId}
                                    readOnly
                                    disabled
                                    className="w-full rounded border border-slate-200 bg-slate-100 font-mono font-bold text-slate-500 py-2 pl-3 pr-8 cursor-not-allowed select-none"
                                />
                                <Lock className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Digenerate otomatis oleh sistem secara berurutan (tidak dapat diedit manual).
                            </p>
                        </div>

                        {/* Nama Pemasok */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Nama Perusahaan / Pemasok <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Contoh: PT Tekstil Jaya Abadi"
                                className="w-full rounded border border-slate-300 py-2 px-3 text-slate-900 font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            {errors.name && <p className="text-rose-600 text-[11px] mt-1">{errors.name}</p>}
                        </div>

                        {/* Kota Domisili / Pabrik */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Kota Domisili / Lokasi Pabrik <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                required
                                placeholder="Contoh: Bandung / Solo / Jakarta"
                                className="w-full rounded border border-slate-300 py-2 px-3 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            {errors.city && <p className="text-rose-600 text-[11px] mt-1">{errors.city}</p>}
                        </div>

                        {/* Termin Pembayaran Standar */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Termin Pembayaran Standar <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.payment_terms}
                                onChange={(e) => setData('payment_terms', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                {paymentTerms.map((pt) => (
                                    <option key={pt.term_id} value={pt.term_id}>
                                        {pt.term_id} — {pt.description}
                                    </option>
                                ))}
                            </select>
                            {errors.payment_terms && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.payment_terms}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bagian 2: Barang yang Dijual Vendor & Pricelist (Wajib) */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-amber-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Katalog Barang yang Dijual Vendor (Vendor Pricelist)
                                </h2>
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                    Wajib Diisi (Min. 1 Barang)
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Daftarkan produk yang disuplai oleh vendor ini beserta kuantitas minimum order (MOQ) dan harga beli satuan per unit.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddLine}
                            disabled={products.length > 0 && data.lines.length >= products.length}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-3.5 w-3.5 text-slate-500" />
                            Tambah Barang
                        </button>
                    </div>

                    {/* Pesan Kesalahan Garis (Validation Error Banner) */}
                    {errors.lines && (
                        <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{errors.lines}</span>
                        </div>
                    )}

                    {/* Tabel Pricelist Baris Barang (Tanpa kolom Est. Nilai Min. Order) */}
                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                                    <th className="py-2.5 px-3">Produk &amp; Varian SKU <span className="text-rose-500">*</span></th>
                                    <th className="py-2.5 px-3 w-40 text-center">Min. Qty Order <span className="text-rose-500">*</span></th>
                                    <th className="py-2.5 px-3 w-56 text-right">Harga Satuan (Price per Unit) <span className="text-rose-500">*</span></th>
                                    <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            Belum ada barang yang ditambahkan. Klik tombol <strong>"Tambah Barang"</strong> di atas.
                                        </td>
                                    </tr>
                                ) : (
                                    data.lines.map((line, idx) => {
                                        const selectedProduct = products.find((p) => p.variant_sku === line.variant_sku);
                                        const lineErrorSku = errors[`lines.${idx}.variant_sku`];
                                        const lineErrorQty = errors[`lines.${idx}.min_qty`];
                                        const lineErrorPrice = errors[`lines.${idx}.unit_price`];

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/60 transition">
                                                <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <select
                                                        value={line.variant_sku}
                                                        onChange={(e) => handleUpdateLine(idx, 'variant_sku', e.target.value)}
                                                        required
                                                        className={`w-full rounded border py-1.5 px-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                                            lineErrorSku ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        <option value="">-- Pilih Produk --</option>
                                                        {products.map((p) => {
                                                            const isSelectedElsewhere = selectedSkus.includes(p.variant_sku) && p.variant_sku !== line.variant_sku;
                                                            return (
                                                                <option
                                                                    key={p.variant_sku}
                                                                    value={p.variant_sku}
                                                                    disabled={isSelectedElsewhere}
                                                                >
                                                                    [{p.variant_sku}] {p.name} — Size {p.size}, {p.color}
                                                                    {isSelectedElsewhere ? ' (Sudah dipilih)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    {lineErrorSku && (
                                                        <p className="text-rose-600 text-[10px] mt-0.5">{lineErrorSku}</p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={line.min_qty}
                                                            onChange={(e) =>
                                                                handleUpdateLine(
                                                                    idx,
                                                                    'min_qty',
                                                                    Math.max(1, parseInt(e.target.value, 10) || 1)
                                                                )
                                                            }
                                                            required
                                                            className={`w-20 rounded border py-1.5 px-2 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                                                lineErrorQty ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                                                            }`}
                                                        />
                                                        <span className="text-[11px] text-slate-500 font-medium">
                                                            {selectedProduct?.unit || 'pcs'}
                                                        </span>
                                                    </div>
                                                    {lineErrorQty && (
                                                        <p className="text-rose-600 text-[10px] mt-0.5 text-center">{lineErrorQty}</p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400 select-none">
                                                            Rp
                                                        </span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={
                                                                line.unit_price === '' || line.unit_price === null || line.unit_price === undefined
                                                                    ? ''
                                                                    : Number(line.unit_price).toLocaleString('id-ID')
                                                            }
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                handleUpdateLine(
                                                                    idx,
                                                                    'unit_price',
                                                                    raw === '' ? '' : parseInt(raw, 10)
                                                                );
                                                            }}
                                                            required
                                                            placeholder="0"
                                                            className={`w-full rounded border py-1.5 pl-8 pr-2.5 text-right text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                                                lineErrorPrice ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                                                            }`}
                                                        />
                                                    </div>
                                                    {lineErrorPrice && (
                                                        <p className="text-rose-600 text-[10px] mt-0.5 text-right">{lineErrorPrice}</p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLine(idx)}
                                                        disabled={data.lines.length <= 1}
                                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={data.lines.length <= 1 ? 'Minimal 1 barang wajib didaftarkan' : 'Hapus baris'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Total: <strong>{data.lines.length}</strong> produk didaftarkan untuk vendor ini.
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Harga beli satuan ini akan digunakan sebagai harga default saat membuat RFQ / PO untuk vendor ini.
                        </span>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-end gap-2">
                    <Link
                        href={route('purchase.vendors.index')}
                        className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Vendor & Pricelist'}
                    </button>
                </div>
            </form>
        </PurchaseLayout>
    );
}
