import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import { Package, Search, Filter, MapPin, ArrowRight } from 'lucide-react';

export default function Index({ products, filters, availableColors, availableSizes }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const search = e.target.search.value;
        router.get(
            route('inventory.products.index'),
            { ...filters, search },
            { preserveState: true }
        );
    };

    const handleFilterChange = (field, val) => {
        router.get(
            route('inventory.products.index'),
            { ...filters, [field]: val },
            { preserveState: true }
        );
    };

    return (
        <InventoryLayout
            title="Produk & SKU Varian"
            breadcrumbs={[
                { label: 'Produk' },
                { label: 'Produk & Varian' },
            ]}
        >
            <Head title="Produk & SKU Varian — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        Katalog Produk & SKU Varian (Fashion Retail)
                    </span>
                    <Link
                        href={route('inventory.products.stock-by-location')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        Lihat Stok per Lokasi (Matrix)
                    </Link>
                </div>

                {/* Search & Filter Bar */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Cari SKU atau nama produk..."
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-60"
                        />
                    </div>

                    <select
                        value={filters.color}
                        onChange={(e) => handleFilterChange('color', e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                    >
                        <option value="all">Semua Warna</option>
                        {availableColors.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.size}
                        onChange={(e) => handleFilterChange('size', e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                    >
                        <option value="all">Semua Ukuran</option>
                        {availableSizes.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* List View Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">SKU Varian</th>
                                <th className="px-4 py-2.5">Nama Produk</th>
                                <th className="px-4 py-2.5 text-center">Ukuran</th>
                                <th className="px-4 py-2.5 text-center">Warna</th>
                                <th className="px-4 py-2.5 text-right">Harga Jual</th>
                                <th className="px-4 py-2.5 text-right">Biaya Pokok (Cost)</th>
                                <th className="px-4 py-2.5 text-center">On Hand (Fisik)</th>
                                <th className="px-4 py-2.5 text-center">Available (ATP)</th>
                                <th className="px-4 py-2.5 text-right">Nilai Valuasi</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-4 py-10 text-center text-slate-400">
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr
                                        key={p.variant_sku}
                                        className="hover:bg-slate-50 transition cursor-pointer group"
                                        onClick={() => router.visit(route('inventory.products.show', p.variant_sku))}
                                    >
                                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                                            <span>{p.variant_sku}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                            {p.name}
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                                                {p.size}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="text-slate-700">{p.color}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                            {formatRp(p.sales_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                                            {formatRp(p.cost)}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                                            {p.on_hand} {p.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                {p.available} {p.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                                            {formatRp(p.valuation)}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <Link
                                                href={route('inventory.products.show', p.variant_sku)}
                                                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Detail
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </InventoryLayout>
    );
}

