import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ArrowLeft,
    Package,
    Save,
    MapPin,
    Tag,
    DollarSign,
    Layers,
    History,
    Building2,
    CheckCircle2,
    ShieldCheck,
    Truck,
} from 'lucide-react';

export default function Show({ product, locationStock = [], recentMoves = [] }) {
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'attributes' | 'moves'
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, put, processing, errors, isDirty, reset } = useForm({
        name: product.name || '',
        sales_price: product.sales_price || 0,
        cost: product.cost || 0,
        color: product.color || '',
        size: product.size || '',
    });

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('inventory.products.update', product.variant_sku), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    const handleCancelEdit = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <InventoryLayout
            title={`Produk: ${product.variant_sku}`}
            breadcrumbs={[
                { label: 'Produk', href: route('inventory.products.index') },
                { label: 'Produk & Varian', href: route('inventory.products.index') },
                { label: product.variant_sku },
            ]}
        >
            <Head title={`${product.variant_sku} — ${product.name} | Bara Wear`} />

            {/* Odoo Form Action Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('inventory.products.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Produk"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(true);
                                setActiveTab('attributes');
                            }}
                            className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-900 transition cursor-pointer"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            Edit Atribut Varian (T-08)
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    )}

                    <Link
                        href={route('inventory.products.stock-by-location')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        Matriks Semua Lokasi
                    </Link>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>SR-21: Independensi Varian SKU Terjamin</span>
                </div>
            </div>

            {/* Odoo Form Sheet Container */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {/* Header Sheet with Smart Buttons */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        {/* Title & SKU Badge */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1 rounded bg-slate-900 text-white px-2.5 py-0.5 text-xs font-mono font-bold">
                                    {product.variant_sku}
                                </span>
                                <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium border border-slate-200">
                                    Satuan: {product.unit || 'PCS'}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {product.name}
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Varian: <span className="font-semibold text-slate-700">Warna {product.color}</span> | <span className="font-semibold text-slate-700">Ukuran {product.size}</span>
                                {product.vendor_name && (
                                    <> &bull; Default Vendor: <span className="font-semibold text-slate-700">{product.vendor_name} ({product.default_vendor})</span></>
                                )}
                            </p>
                        </div>

                        {/* Odoo Smart Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <OdooSmartButton
                                icon={Package}
                                label="Total On Hand"
                                value={`${product.total_on_hand} ${product.unit}`}
                                active={true}
                            />
                            <OdooSmartButton
                                icon={Layers}
                                label="Tereservasi (SO)"
                                value={`${product.total_reserved} ${product.unit}`}
                                active={product.total_reserved > 0}
                            />
                            <OdooSmartButton
                                icon={CheckCircle2}
                                label="Available (ATP)"
                                value={`${product.total_available} ${product.unit}`}
                                active={product.total_available > 0}
                            />
                            <OdooSmartButton
                                icon={DollarSign}
                                label="Valuasi Total"
                                value={formatRp(product.total_valuation)}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('stock')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition cursor-pointer ${
                            activeTab === 'stock'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Stok per Lokasi (T-07)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('attributes')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition cursor-pointer ${
                            activeTab === 'attributes'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Tag className="h-4 w-4" />
                        Atribut & Pengaturan Harga (T-08)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('moves')}
                        className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition cursor-pointer ${
                            activeTab === 'moves'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <History className="h-4 w-4" />
                        Riwayat Mutasi Terkini
                    </button>
                </div>

                {/* Tab 1: Stock by Location (T-07) */}
                {activeTab === 'stock' && (
                    <div className="p-6">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-800">
                                Rincian Persediaan Fisik per Gudang / Toko
                            </h2>
                            <p className="text-xs text-slate-500">
                                Memenuhi Skenario T-07: Verifikasi On Hand di WH-PKU dan TOKO-PKU beserta valuasi standar.
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-xs">
                                <thead className="bg-slate-50 font-semibold text-slate-700">
                                    <tr>
                                        <th className="py-2.5 px-3 text-left">Kode Lokasi</th>
                                        <th className="py-2.5 px-3 text-left">Nama Lokasi</th>
                                        <th className="py-2.5 px-3 text-left">Kota</th>
                                        <th className="py-2.5 px-3 text-right">On Hand (Fisik)</th>
                                        <th className="py-2.5 px-3 text-right">Reserved (Terikat SO)</th>
                                        <th className="py-2.5 px-3 text-right">Available (ATP)</th>
                                        <th className="py-2.5 px-3 text-right">Nilai Valuasi (Cost)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {locationStock.map((loc) => (
                                        <tr key={loc.location_code} className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                                {loc.location_code}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                                                {loc.location_name}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500">
                                                {loc.city}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                                                {loc.on_hand} {product.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-amber-700 font-medium">
                                                {loc.reserved} {product.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                                {loc.available} {product.unit}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                                                {formatRp(loc.valuation)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total Summary Row */}
                                    <tr className="bg-slate-100/70 font-bold border-t border-slate-300">
                                        <td colSpan={3} className="py-3 px-3 text-slate-800 text-right">
                                            Total Perusahaan (PT Bara Ritel Nusantara):
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-900">
                                            {product.total_on_hand} {product.unit}
                                        </td>
                                        <td className="py-3 px-3 text-right text-amber-800">
                                            {product.total_reserved} {product.unit}
                                        </td>
                                        <td className="py-3 px-3 text-right text-emerald-800">
                                            {product.total_available} {product.unit}
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-900">
                                            {formatRp(product.total_valuation)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: Attributes & Edit Form (T-08) */}
                {activeTab === 'attributes' && (
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
                            <div className="rounded border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900">
                                <span className="font-bold">Independensi SKU (SR-21 & Skenario T-08):</span> Perubahan nama, harga jual, cost, warna, atau ukuran pada SKU ini bersifat independen dan dijamin tidak akan mengubah data varian lain.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama Produk Varian
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                    />
                                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Warna
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                    />
                                    {errors.color && <p className="text-red-600 text-xs mt-1">{errors.color}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Ukuran (Size)
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={data.size}
                                        onChange={(e) => setData('size', e.target.value)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                    />
                                    {errors.size && <p className="text-red-600 text-xs mt-1">{errors.size}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Harga Jual Konsumen (Sales Price - IDR)
                                    </label>
                                    <input
                                        type="number"
                                        disabled={!isEditing}
                                        value={data.sales_price}
                                        onChange={(e) => setData('sales_price', parseFloat(e.target.value) || 0)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                    />
                                    {errors.sales_price && <p className="text-red-600 text-xs mt-1">{errors.sales_price}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Biaya Pokok Standar (Cost / HPP - IDR)
                                    </label>
                                    <input
                                        type="number"
                                        disabled={!isEditing}
                                        value={data.cost}
                                        onChange={(e) => setData('cost', parseFloat(e.target.value) || 0)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                    />
                                    {errors.cost && <p className="text-red-600 text-xs mt-1">{errors.cost}</p>}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Tab 3: Recent Stock Moves */}
                {activeTab === 'moves' && (
                    <div className="p-6">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-800">
                                Riwayat 10 Mutasi Terakhir Produk {product.variant_sku}
                            </h2>
                        </div>

                        {recentMoves.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Belum ada catatan mutasi untuk SKU ini.</p>
                        ) : (
                            <div className="overflow-x-auto rounded border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-xs">
                                    <thead className="bg-slate-50 font-semibold text-slate-700">
                                        <tr>
                                            <th className="py-2.5 px-3 text-left">Waktu</th>
                                            <th className="py-2.5 px-3 text-left">Jenis Dokumen</th>
                                            <th className="py-2.5 px-3 text-left">Referensi</th>
                                            <th className="py-2.5 px-3 text-left">Dari</th>
                                            <th className="py-2.5 px-3 text-left">Ke</th>
                                            <th className="py-2.5 px-3 text-right">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {recentMoves.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/50">
                                                <td className="py-2.5 px-3 text-slate-600">{m.date}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">{m.type}</td>
                                                <td className="py-2.5 px-3 font-mono text-slate-700">{m.ref}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{m.from || '-'}</td>
                                                <td className="py-2.5 px-3 text-slate-600">{m.to || '-'}</td>
                                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">{m.qty} {product.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </InventoryLayout>
    );
}

