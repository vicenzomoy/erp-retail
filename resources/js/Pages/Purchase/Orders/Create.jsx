import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    ShoppingBag,
    AlertCircle,
    Info,
    CheckCircle2,
} from 'lucide-react';

export default function Create({
    nextId,
    vendors = [],
    products = [],
    paymentTerms = [],
    defaultVendorId,
    defaultSku,
}) {
    // Urutkan vendor berdasarkan kode ID (V01 hingga V04)
    const sortedVendors = useMemo(() => {
        return [...vendors].sort((a, b) => a.id.localeCompare(b.id));
    }, [vendors]);

    // Vendor awal hanya jika datang dari link katalog dengan defaultVendorId
    const initialVendor = defaultVendorId
        ? vendors.find((v) => v.id === defaultVendorId)
        : null;

    // Helper: Periksa apakah produk disediakan oleh vendor tertentu
    const isProductSuppliedByVendor = (prod, vId) => {
        if (!prod || !vId) return false;
        if (prod.default_vendor === vId) return true;
        if (Array.isArray(prod.vendor_ids) && prod.vendor_ids.includes(vId)) return true;
        return false;
    };

    // Helper: Ambil harga beli satuan dari pricelist vendor (fallback ke master cost)
    const getVendorUnitPrice = (prod, vId) => {
        if (!prod) return 0;
        if (vId && prod.vendor_prices && prod.vendor_prices[vId] !== undefined) {
            return Number(prod.vendor_prices[vId]);
        }
        return Number(prod.cost || 0);
    };

    // Produk awal hanya jika datang dari link katalog dengan defaultSku yang valid
    const initialVendorProducts = initialVendor
        ? products.filter((p) => isProductSuppliedByVendor(p, initialVendor.id))
        : [];
    const initialProduct = defaultSku
        ? initialVendorProducts.find((p) => p.variant_sku === defaultSku)
        : null;

    // Form state: Tanpa autofill vendor, tanpa autofill payment terms, tanpa autofill baris produk
    const { data, setData, post, processing, errors } = useForm({
        id: nextId,
        vendor_id: initialVendor?.id || '',
        payment_terms: initialVendor?.payment_terms || '',
        source_doc_no: '',
        notes: '',
        lines: initialProduct
            ? [
                {
                    variant_sku: initialProduct.variant_sku,
                    qty_ordered: 1,
                    unit_price: getVendorUnitPrice(initialProduct, initialVendor?.id),
                    tax_id: 'VAT-NONLUX',
                },
            ]
            : [],
    });

    // Produk yang disediakan oleh vendor yang sedang dipilih
    const currentVendorProducts = useMemo(() => {
        if (!data.vendor_id) return [];
        return products.filter((p) => isProductSuppliedByVendor(p, data.vendor_id));
    }, [products, data.vendor_id]);

    // Set SKU yang sudah dipilih di baris saat ini
    const selectedSkus = useMemo(() => {
        return new Set(data.lines.map((l) => l.variant_sku).filter(Boolean));
    }, [data.lines]);

    // Produk berikutnya yang belum dipilih
    const nextAvailableProduct = useMemo(() => {
        return currentVendorProducts.find((p) => !selectedSkus.has(p.variant_sku));
    }, [currentVendorProducts, selectedSkus]);

    // Semua produk vendor ini sudah dimasukkan ke baris order?
    const isAllVendorProductsSelected =
        currentVendorProducts.length > 0 &&
        selectedSkus.size >= currentVendorProducts.length;

    // Handler ganti vendor: sesuaikan payment terms & bersihkan baris produk yang tidak valid untuk vendor baru
    const handleVendorChange = (vendorId) => {
        const found = vendors.find((v) => v.id === vendorId);

        if (!vendorId) {
            setData({
                ...data,
                vendor_id: '',
                payment_terms: '',
                lines: [],
            });
            return;
        }

        const validSkusForNewVendor = new Set(
            products
                .filter((p) => isProductSuppliedByVendor(p, vendorId))
                .map((p) => p.variant_sku)
        );

        // Hanya pertahankan baris produk yang memang disediakan oleh vendor baru dan perbarui harga sesuai pricelist vendor baru
        const filteredLines = data.lines
            .filter((l) => validSkusForNewVendor.has(l.variant_sku))
            .map((l) => {
                const prod = products.find((p) => p.variant_sku === l.variant_sku);
                return {
                    ...l,
                    unit_price: getVendorUnitPrice(prod, vendorId),
                };
            });

        setData({
            ...data,
            vendor_id: vendorId,
            payment_terms: found?.payment_terms || '',
            lines: filteredLines,
        });
    };

    // Tambah baris baru (ambil item pertama yang belum dipilih dari vendor tersebut)
    const addLine = () => {
        if (!data.vendor_id || !nextAvailableProduct) return;

        setData('lines', [
            ...data.lines,
            {
                variant_sku: nextAvailableProduct.variant_sku,
                qty_ordered: 1, // Minimal 1 dan integer
                unit_price: getVendorUnitPrice(nextAvailableProduct, data.vendor_id),
                tax_id: 'VAT-NONLUX',
            },
        ]);
    };

    // Hapus baris produk
    const removeLine = (index) => {
        setData(
            'lines',
            data.lines.filter((_, idx) => idx !== index)
        );
    };

    // Perbarui field baris
    const updateLine = (index, field, value) => {
        const updated = [...data.lines];

        // Validasi Kuantitas: harus bilangan bulat (integer) dan minimal 1
        if (field === 'qty_ordered') {
            const intVal = parseInt(value, 10);
            value = isNaN(intVal) || intVal < 1 ? 1 : intVal;
        }

        // Jika mengubah SKU, update unit price dari pricelist vendor / master cost
        if (field === 'variant_sku') {
            const prod = currentVendorProducts.find((p) => p.variant_sku === value);
            if (prod) {
                updated[index].unit_price = getVendorUnitPrice(prod, data.vendor_id);
            }
        }

        updated[index][field] = value;
        setData('lines', updated);
    };

    // Kalkulasi Subtotal, PPN (11% bulat), dan Grand Total
    const subtotal = data.lines.reduce((sum, line) => {
        const qty = parseInt(line.qty_ordered, 10) || 0;
        const price = parseFloat(line.unit_price) || 0;
        return sum + qty * price;
    }, 0);

    const taxAmount = Math.round(subtotal * 0.11);
    const grandTotal = subtotal + taxAmount;

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const isSubmitDisabled =
        processing || !data.vendor_id || data.lines.length === 0;

    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        post(route('purchase.orders.store'));
    };

    return (
        <PurchaseLayout
            title="Buat Permintaan Penawaran (RFQ)"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pesanan Pembelian', href: route('purchase.orders.index') },
                { label: 'Baru' },
            ]}
        >
            <Head title="Buat Permintaan Penawaran (RFQ) — Bara Wear" />

            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.orders.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-amber-600" />
                            Buat Permintaan Penawaran (RFQ) Baru
                        </h1>
                        <span className="text-xs text-slate-500 font-mono">
                            ID Terjadwal: {data.id}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className={`inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold shadow-xs transition-all duration-150 ${isSubmitDisabled
                            ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'border border-slate-900 bg-slate-900 text-white hover:bg-black hover:border-black hover:shadow-md active:scale-[0.98] cursor-pointer'
                            }`}
                        title={
                            !data.vendor_id
                                ? 'Pilih vendor terlebih dahulu'
                                : data.lines.length === 0
                                    ? 'Tambahkan minimal 1 baris produk sebelum menyimpan'
                                    : 'Simpan sebagai Draft RFQ'
                        }
                    >
                        <Save className="h-4 w-4 transition-colors" />
                        Simpan Draft (RFQ)
                    </button>
                </div>
            </div>

            {/* Error notifications */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 shadow-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        Periksa Kesalahan Pengisian Form:
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5">
                        {Object.entries(errors).map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Form Sheet Card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                {/* Header Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-200 text-xs">
                    {/* Nomor PO & ID — DIKUNCI (Auto-generated oleh sistem, tidak bisa diketik manual) */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Nomor Dokumen PO / RFQ
                            </label>
                        </div>
                        <input
                            type="text"
                            value={data.id}
                            readOnly
                            disabled
                            className="w-full rounded border border-slate-200 bg-slate-100 font-mono font-bold text-slate-600 py-1.5 px-3 cursor-not-allowed select-none focus:outline-none"
                            title="Nomor dokumen PO dibuat secara otomatis oleh sistem (tidak dapat diedit manual)"
                        />
                    </div>

                    {/* Pemasok (Vendor) — Diurutkan V01 hingga V04 & Tanpa Autofill */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Pemasok (Vendor)
                        </label>
                        <select
                            value={data.vendor_id}
                            onChange={(e) => handleVendorChange(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white font-medium text-slate-900 py-1.5 px-3 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                            <option value="">-- Pilih Pemasok (Vendor) --</option>
                            {sortedVendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.id} — {v.raw_name || v.name} ({v.city})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Termin Pembayaran — Tanpa Autofill Default */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Termin Pembayaran
                        </label>
                        <select
                            value={data.payment_terms}
                            onChange={(e) => setData('payment_terms', e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white font-medium text-slate-900 py-1.5 px-3 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        >
                            <option value="">-- Pilih Termin Pembayaran --</option>
                            {paymentTerms.map((pt) => (
                                <option key={pt.term_id} value={pt.term_id}>
                                    {pt.term_id} — {pt.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Referensi Dokumen Sumber */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Referensi Dokumen Sumber (Opsional)
                        </label>
                        <input
                            type="text"
                            value={data.source_doc_no}
                            onChange={(e) => setData('source_doc_no', e.target.value)}
                            placeholder="Contoh: SO000X"
                            className="w-full rounded border border-slate-300 bg-white py-1.5 px-3 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        />
                    </div>

                    {/* Catatan Internal */}
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Catatan Pengadaan / Instruksi Pengiriman
                        </label>
                        <input
                            type="text"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Catatan pengadaan, estimasi tiba di gudang..."
                            className="w-full rounded border border-slate-300 bg-white py-1.5 px-3 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        />
                    </div>
                </div>

                {/* Line Items Table Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Baris Produk (Order Lines)
                            </h3>
                            {data.vendor_id ? (
                                <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium border border-slate-200">
                                    {currentVendorProducts.length} produk tersedia dari vendor ini
                                </span>
                            ) : (
                                <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium border border-amber-200">
                                    Pilih vendor terlebih dahulu
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={addLine}
                            disabled={
                                !data.vendor_id ||
                                currentVendorProducts.length === 0 ||
                                isAllVendorProductsSelected
                            }
                            className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${!data.vendor_id ||
                                isAllVendorProductsSelected ||
                                currentVendorProducts.length === 0
                                ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'border border-slate-300 bg-slate-200 text-slate-800 hover:bg-slate-300 hover:border-slate-400 hover:text-slate-900 cursor-pointer'
                                }`}
                            title={
                                !data.vendor_id
                                    ? 'Pilih vendor terlebih dahulu sebelum menambah produk'
                                    : isAllVendorProductsSelected
                                        ? 'Seluruh produk dari vendor ini sudah dimasukkan ke rincian'
                                        : 'Tambah baris produk baru'
                            }
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {!data.vendor_id
                                ? 'Pilih Vendor Terlebih Dahulu'
                                : isAllVendorProductsSelected
                                    ? 'Semua Produk Sudah Ditambahkan'
                                    : 'Tambah Baris Produk'}
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-600 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                                    <th className="py-2.5 px-3">Produk &amp; Varian</th>
                                    <th className="py-2.5 px-3 text-center w-28">Kuantitas</th>
                                    <th className="py-2.5 px-3 text-right w-40">Harga Beli Satuan (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-24">Pajak</th>
                                    <th className="py-2.5 px-3 text-right w-40">Total DPP</th>
                                    <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            {!data.vendor_id ? (
                                                <>
                                                    <p className="font-medium text-slate-600">
                                                        Pemasok (Vendor) Belum Dipilih.
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        Silakan pilih Pemasok (Vendor) pada kolom di atas untuk menampilkan produk yang dapat dipesan.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-medium text-slate-600">
                                                        Belum ada produk yang ditambahkan.
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        Klik tombol{' '}
                                                        <strong className="text-amber-800">
                                                            "Tambah Baris Produk"
                                                        </strong>{' '}
                                                        di atas untuk memilih produk dari vendor ini.
                                                    </p>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    data.lines.map((line, idx) => {
                                        const qty = parseInt(line.qty_ordered, 10) || 0;
                                        const price = parseFloat(line.unit_price) || 0;
                                        const lineSubtotal = qty * price;

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                                    {idx + 1}
                                                </td>

                                                {/* Dropdown Produk — Hanya Produk Vendor Ini & Non-Duplikat */}
                                                <td className="py-2.5 px-3">
                                                    <select
                                                        value={line.variant_sku}
                                                        onChange={(e) =>
                                                            updateLine(idx, 'variant_sku', e.target.value)
                                                        }
                                                        className="w-full rounded border border-slate-300 bg-white py-1 px-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                                    >
                                                        {currentVendorProducts.map((p) => {
                                                            const isAlreadySelectedElsewhere =
                                                                data.lines.some(
                                                                    (otherLine, otherIdx) =>
                                                                        otherIdx !== idx &&
                                                                        otherLine.variant_sku ===
                                                                        p.variant_sku
                                                                );

                                                            return (
                                                                <option
                                                                    key={p.variant_sku}
                                                                    value={p.variant_sku}
                                                                    disabled={isAlreadySelectedElsewhere}
                                                                >
                                                                    {p.name}
                                                                    {isAlreadySelectedElsewhere
                                                                        ? ' (Sudah dipilih di baris lain)'
                                                                        : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </td>

                                                {/* Kuantitas — Minimal 1 & Integer (Tidak bisa desimal) */}
                                                <td className="py-2.5 px-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={line.qty_ordered}
                                                        onKeyDown={(e) => {
                                                            // Cegah pengetikan karakter desimal atau minus
                                                            if (
                                                                e.key === '.' ||
                                                                e.key === ',' ||
                                                                e.key === '-' ||
                                                                e.key === 'e' ||
                                                                e.key === '+'
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        onChange={(e) =>
                                                            updateLine(idx, 'qty_ordered', e.target.value)
                                                        }
                                                        className="w-full rounded border border-slate-300 py-1 px-2 text-center font-bold text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                                        title="Kuantitas harus berupa bilangan bulat minimal 1"
                                                    />
                                                </td>

                                                {/* Harga Beli Satuan — Dikunci (sesuai pricelist vendor / master produk) */}
                                                <td className="py-2.5 px-3 text-right">
                                                    <div
                                                        className="w-full rounded border border-slate-200 bg-slate-50 py-1.5 px-3 text-right font-mono font-semibold text-slate-700 cursor-not-allowed select-none"
                                                        title="Harga beli satuan dikunci otomatis sesuai harga vendor (tidak dapat diedit)"
                                                    >
                                                        {formatRp(line.unit_price)}
                                                    </div>
                                                </td>

                                                {/* PPN */}
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold border border-slate-200">
                                                        PPN 11%
                                                    </span>
                                                </td>

                                                {/* Total DPP Baris */}
                                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                                    {formatRp(lineSubtotal)}
                                                </td>

                                                {/* Hapus Baris */}
                                                <td className="py-2.5 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(idx)}
                                                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                        title="Hapus Baris"
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
                </div>

                {/* Financial Summary Calculation (Right-aligned) */}
                <div className="flex flex-col sm:flex-row justify-end items-end gap-6 pt-4 border-t border-slate-200">
                    <div className="w-full sm:w-80 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                            <span>Dasar Pengenaan Pajak (DPP):</span>
                            <span className="font-mono font-semibold text-slate-600">
                                {formatRp(subtotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Pajak Pertambahan Nilai (PPN 11%):</span>
                            <span className="font-mono font-semibold text-slate-600">
                                {formatRp(taxAmount)}
                            </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                            <span>Total Tagihan:</span>
                            <span className="font-mono text-base text-slate-900">
                                {formatRp(grandTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </PurchaseLayout>
    );
}
