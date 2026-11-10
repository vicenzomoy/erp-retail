import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import CrmLayout from '@/Layouts/CrmLayout';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Info } from 'lucide-react';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function createEmptyItem() {
    return {
        _id: 'item-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
        variant_sku: '',
        qty_interest: 1,
        unit_price: 0,
    };
}

export default function LeadCreate({ customers = [], products = [], users = [] }) {
    // Form dimulai tanpa autofill barang maupun pelanggan
    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        contact_name: '',
        assigned_user_id: users[0]?.id || '',
        notes: '',
        items: [createEmptyItem()],
    });

    const [duplicateError, setDuplicateError] = useState('');

    // Daftar SKU yang sudah terpilih di baris manapun
    const selectedSkus = data.items.map((it) => it.variant_sku).filter(Boolean);

    // Tambah baris peminatan baru
    const handleAddItem = () => {
        setDuplicateError('');
        setData('items', [...data.items, createEmptyItem()]);
    };

    // Hapus baris peminatan
    const handleRemoveItem = (id) => {
        setDuplicateError('');
        if (data.items.length <= 1) {
            setData('items', [createEmptyItem()]);
            return;
        }
        setData('items', data.items.filter((item) => item._id !== id));
    };

    // Ubah produk pada baris tertentu dan cegah produk kembar (duplikat)
    const handleProductSelect = (id, sku) => {
        if (!sku) {
            setData(
                'items',
                data.items.map((item) => {
                    if (item._id !== id) return item;
                    return { ...item, variant_sku: '', unit_price: 0 };
                })
            );
            return;
        }

        // Cek apakah produk ini sudah dipilih pada baris lain
        const isDuplicate = data.items.some((item) => item._id !== id && item.variant_sku === sku);
        if (isDuplicate) {
            setDuplicateError('Produk ini sudah dipilih pada baris lain. Untuk menambah jumlah, silakan sesuaikan kuantitas pada baris produk yang sama.');
            return;
        }

        setDuplicateError('');
        const product = products.find((p) => p.variant_sku === sku);
        const price = product ? parseFloat(product.sales_price) || 0 : 0;

        setData(
            'items',
            data.items.map((item) => {
                if (item._id !== id) return item;
                return {
                    ...item,
                    variant_sku: sku,
                    unit_price: price,
                };
            })
        );
    };

    // Ubah kuantitas (wajib bilangan bulat dan minimal 1)
    const handleQtyChange = (id, rawValue) => {
        let val = parseInt(rawValue, 10);
        if (isNaN(val) || val < 1) {
            val = 1;
        }

        setData(
            'items',
            data.items.map((item) => {
                if (item._id !== id) return item;
                return {
                    ...item,
                    qty_interest: val,
                };
            })
        );
    };

    // Hitung total ringkasan
    const totalQty = data.items.reduce((acc, it) => acc + (parseInt(it.qty_interest, 10) || 0), 0);
    const totalRevenue = data.items.reduce((acc, it) => {
        const qty = parseInt(it.qty_interest, 10) || 0;
        const price = parseFloat(it.unit_price) || 0;
        return acc + qty * price;
    }, 0);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validasi frontend sebelum submit: pastikan tidak ada produk duplikat
        const filledSkus = data.items.map((it) => it.variant_sku).filter(Boolean);
        const uniqueSkus = new Set(filledSkus);
        if (uniqueSkus.size !== filledSkus.length) {
            setDuplicateError('Terdapat produk yang dipilih lebih dari satu kali. Silakan gabungkan jumlah unit pada satu baris.');
            return;
        }

        post(route('crm.leads.store'));
    };

    return (
        <CrmLayout
            title="Tambah Prospek CRM"
            breadcrumbs={[
                { label: 'Pipeline CRM', href: route('crm.pipeline') },
                { label: 'Prospek Baru' },
            ]}
        >
            <Head title="Tambah Prospek Baru — CRM" />

            <form onSubmit={handleSubmit}>
                {/* Header Top Bar (Konsisten dengan Modul Inventaris) */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('crm.pipeline')}
                            className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Kembali ke Pipeline"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-sm font-bold text-slate-800">
                            Buat Prospek Baru (Lead CRM)
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('crm.pipeline')}
                            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Prospek'}
                        </button>
                    </div>
                </div>

                {/* Banner Peringatan Duplikat atau Validasi */}
                {(duplicateError || errors.items) && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold">Perhatian Pengisian Formulir:</p>
                            <p className="text-[11px] mt-0.5">{duplicateError || errors.items}</p>
                        </div>
                    </div>
                )}

                {/* Form Sheet Card (Konsisten dengan CRUD Inventaris) */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                        {/* Pelanggan */}
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Calon Pelanggan *
                            </label>
                            <select
                                required
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className={`w-full rounded border px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                                    errors.customer_id ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                                }`}
                            >
                                <option value="">-- Pilih Pelanggan --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.id} — {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.customer_id}</p>
                            )}
                        </div>

                        {/* Kontak Person (PIC) */}
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Kontak Person / PIC Calon Pembeli
                            </label>
                            <input
                                type="text"
                                value={data.contact_name}
                                onChange={(e) => setData('contact_name', e.target.value)}
                                placeholder="Contoh: Ibu Dewi (Purchasing) / Bpk. Rudi"
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            />
                            {errors.contact_name && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.contact_name}</p>
                            )}
                        </div>

                        {/* Sales Person Ditugaskan */}
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Sales Person Ditugaskan
                            </label>
                            <select
                                value={data.assigned_user_id}
                                onChange={(e) => setData('assigned_user_id', e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            >
                                <option value="">-- Pilih Sales Person --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role_id})
                                    </option>
                                ))}
                            </select>
                            {errors.assigned_user_id && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.assigned_user_id}</p>
                            )}
                        </div>

                        {/* Catatan Kebutuhan */}
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Catatan Prospek
                            </label>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Contoh: Permintaan katalog, jadwal kunjungan, dsb."
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                            />
                        </div>
                    </div>

                    {/* Tabel Produk yang Diminati (Lines) */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Barang yang Diminati (Items of Interest)
                            </span>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1 rounded bg-slate-200 hover:bg-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition cursor-pointer"
                            >
                                <Plus className="h-3 w-3" /> Tambah Baris
                            </button>
                        </div>

                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                    <th className="px-3 py-2 text-center w-12">No</th>
                                    <th className="px-3 py-2">Produk / SKU Varian *</th>
                                    <th className="px-3 py-2 w-36 text-right">Harga Satuan</th>
                                    <th className="px-3 py-2 w-32 text-center">Qty Minat *</th>
                                    <th className="px-3 py-2 w-40 text-right">Subtotal Estimasi</th>
                                    <th className="px-3 py-2 w-14 text-center">Hapus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.items.map((item, idx) => {
                                    const subtotal = (parseInt(item.qty_interest, 10) || 0) * (parseFloat(item.unit_price) || 0);
                                    const itemSkuError = errors[`items.${idx}.variant_sku`];
                                    const itemQtyError = errors[`items.${idx}.qty_interest`];

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/60">
                                            <td className="px-3 py-2 text-center text-slate-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={item.variant_sku}
                                                    onChange={(e) => handleProductSelect(item._id, e.target.value)}
                                                    className={`w-full rounded border px-2.5 py-1 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                                                        itemSkuError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <option value="">-- Pilih Produk --</option>
                                                    {products.map((p) => {
                                                        const isSelectedElsewhere = selectedSkus.includes(p.variant_sku) && p.variant_sku !== item.variant_sku;
                                                        return (
                                                            <option
                                                                key={p.variant_sku}
                                                                value={p.variant_sku}
                                                                disabled={isSelectedElsewhere}
                                                            >
                                                                {p.variant_sku} — {p.name || p.variant_name} ({formatRp(p.sales_price)})
                                                                {isSelectedElsewhere ? ' (Sudah dipilih)' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {itemSkuError && (
                                                    <p className="text-rose-600 text-[10px] mt-0.5">{itemSkuError}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                                                {formatRp(item.unit_price)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.qty_interest}
                                                    onChange={(e) => handleQtyChange(item._id, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        // Cegah input desimal, koma, minus, eksponensial
                                                        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === '-') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={`w-24 text-center rounded border py-1 text-xs font-bold text-slate-900 ${
                                                        itemQtyError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                                                    }`}
                                                />
                                                {itemQtyError && (
                                                    <p className="text-rose-600 text-[10px] mt-0.5">{itemQtyError}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                {formatRp(subtotal)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item._id)}
                                                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Footer Ringkasan di Dalam Card Tabel */}
                        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                            <div className="text-slate-600 flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>
                                    Total <strong>{data.items.length}</strong> jenis produk terpilih (<strong>{totalQty}</strong> unit peminatan).
                                </span>
                            </div>

                            <div className="flex items-center gap-2 font-semibold">
                                <span className="text-slate-500">Estimasi Pendapatan:</span>
                                <span className="text-sm font-bold font-mono text-slate-900">
                                    {formatRp(totalRevenue)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </CrmLayout>
    );
}
