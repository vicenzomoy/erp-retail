import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    MapPin,
    Package,
    Search,
    Printer,
    Download,
    ArrowRight,
    Building2,
    DollarSign,
    Layers,
    CheckCircle2,
} from 'lucide-react';

export default function StockByLocation({ matrix = [], locations = [], summary = {} }) {
    const [search, setSearch] = useState('');
    const [selectedLocFilter, setSelectedLocFilter] = useState('all');

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const filteredMatrix = matrix.filter((item) => {
        const matchesSearch =
            item.variant_sku.toLowerCase().includes(search.toLowerCase()) ||
            item.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <InventoryLayout
            title="Stok per Lokasi (Matrix)"
            breadcrumbs={[
                { label: 'Produk', href: route('inventory.products.index') },
                { label: 'Stok per Lokasi' },
            ]}
        >
            <Head title="Stok per Lokasi (Matriks Persediaan) — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        Matriks Persediaan Multi-Lokasi (T-07)
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                        {filteredMatrix.length} SKU Varian
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari SKU atau nama produk..."
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-60"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Top KPI Cards (Summary Perusahaan) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Total Stok Fisik (On Hand)</span>
                        <Package className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                        {summary.total_on_hand} <span className="text-xs font-normal text-slate-500">PCS</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Tereservasi SO (Reserved)</span>
                        <Layers className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-800">
                        {summary.total_reserved} <span className="text-xs font-normal text-amber-600">PCS</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Siap Jual (Available / ATP)</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                        {summary.total_available} <span className="text-xs font-normal text-emerald-600">PCS</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Valuasi HPP Standar</span>
                        <DollarSign className="h-4 w-4 text-slate-700" />
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                        {formatRp(summary.total_valuation)}
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-700">
                            <tr>
                                <th rowSpan={2} className="py-3 px-3 text-left border-r border-slate-200 bg-slate-100/50">
                                    SKU & Produk
                                </th>
                                <th rowSpan={2} className="py-3 px-3 text-center border-r border-slate-200">
                                    Varian (Warna / Size)
                                </th>
                                <th rowSpan={2} className="py-3 px-3 text-right border-r border-slate-200">
                                    Biaya Standar
                                </th>
                                {locations.map((loc) => (
                                    <th
                                        key={loc.location_code}
                                        colSpan={3}
                                        className="py-2 px-3 text-center border-r border-slate-200 bg-slate-100/40"
                                    >
                                        <div className="font-bold text-slate-900">{loc.location_code}</div>
                                        <div className="text-[10px] text-slate-500 font-normal">
                                            {loc.location_name} ({loc.city})
                                        </div>
                                    </th>
                                ))}
                                <th colSpan={4} className="py-2 px-3 text-center bg-slate-200/50">
                                    <div className="font-bold text-slate-900">Total Perusahaan (PT Bara Ritel Nusantara)</div>
                                    <div className="text-[10px] text-slate-600 font-normal">Konsolidasi Seluruh Lokasi</div>
                                </th>
                                <th rowSpan={2} className="py-3 px-3 text-center">
                                    Aksi
                                </th>
                            </tr>
                            <tr className="border-t border-slate-200 text-[11px] text-slate-600">
                                {locations.map((loc) => (
                                    <React.Fragment key={`sub_${loc.location_code}`}>
                                        <th className="py-1.5 px-2 text-right">Fisik</th>
                                        <th className="py-1.5 px-2 text-right text-amber-700">Rsv</th>
                                        <th className="py-1.5 px-2 text-right text-emerald-700 border-r border-slate-200">ATP</th>
                                    </React.Fragment>
                                ))}
                                <th className="py-1.5 px-2 text-right font-bold text-slate-800">On Hand</th>
                                <th className="py-1.5 px-2 text-right text-amber-700 font-bold">Rsv</th>
                                <th className="py-1.5 px-2 text-right text-emerald-700 font-bold">Available</th>
                                <th className="py-1.5 px-2 text-right font-bold text-slate-900">Valuasi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredMatrix.map((item) => (
                                <tr key={item.variant_sku} className="hover:bg-slate-50/70 transition">
                                    <td className="py-2.5 px-3 border-r border-slate-200">
                                        <div className="font-mono font-bold text-slate-900">
                                            {item.variant_sku}
                                        </div>
                                        <div className="text-slate-600 truncate max-w-xs" title={item.name}>
                                            {item.name}
                                        </div>
                                    </td>

                                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 mr-1">
                                            {item.color}
                                        </span>
                                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                            {item.size}
                                        </span>
                                    </td>

                                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 border-r border-slate-200">
                                        {formatRp(item.cost)}
                                    </td>

                                    {/* Per Location Breakdown */}
                                    {locations.map((loc) => {
                                        const locData = item.locations[loc.location_code] || {
                                            on_hand: 0,
                                            reserved: 0,
                                            available: 0,
                                        };
                                        return (
                                            <React.Fragment key={`${item.variant_sku}_${loc.location_code}`}>
                                                <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                                                    {locData.on_hand}
                                                </td>
                                                <td className="py-2.5 px-2 text-right text-amber-700">
                                                    {locData.reserved > 0 ? locData.reserved : '-'}
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-semibold text-emerald-700 border-r border-slate-200">
                                                    {locData.available}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Company Totals */}
                                    <td className="py-2.5 px-2 text-right font-bold text-slate-900 bg-slate-50/50">
                                        {item.company_total_qty} {item.unit}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-bold text-amber-800 bg-slate-50/50">
                                        {item.company_reserved_qty > 0 ? item.company_reserved_qty : '-'}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-bold text-emerald-800 bg-slate-50/50">
                                        {item.company_available_qty} {item.unit}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-bold text-slate-900 bg-slate-50/50">
                                        {formatRp(item.standard_value)}
                                    </td>

                                    {/* Action Link */}
                                    <td className="py-2.5 px-3 text-center">
                                        <Link
                                            href={route('inventory.products.show', item.variant_sku)}
                                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[11px] font-semibold transition"
                                        >
                                            Detail
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {/* Summary Footer Row */}
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td colSpan={3} className="py-3 px-3 text-slate-900 text-right border-r border-slate-200">
                                    TOTAL KONSOLIDASI PERSADAAN:
                                </td>
                                {locations.map((loc) => {
                                    const totalOnHandLoc = filteredMatrix.reduce(
                                        (acc, row) => acc + (row.locations[loc.location_code]?.on_hand || 0),
                                        0
                                    );
                                    const totalReservedLoc = filteredMatrix.reduce(
                                        (acc, row) => acc + (row.locations[loc.location_code]?.reserved || 0),
                                        0
                                    );
                                    const totalAvailLoc = filteredMatrix.reduce(
                                        (acc, row) => acc + (row.locations[loc.location_code]?.available || 0),
                                        0
                                    );
                                    return (
                                        <React.Fragment key={`tot_${loc.location_code}`}>
                                            <td className="py-3 px-2 text-right text-slate-900">
                                                {totalOnHandLoc}
                                            </td>
                                            <td className="py-3 px-2 text-right text-amber-800">
                                                {totalReservedLoc}
                                            </td>
                                            <td className="py-3 px-2 text-right text-emerald-800 border-r border-slate-200">
                                                {totalAvailLoc}
                                            </td>
                                        </React.Fragment>
                                    );
                                })}
                                <td className="py-3 px-2 text-right text-slate-900 bg-slate-200/60">
                                    {summary.total_on_hand} PCS
                                </td>
                                <td className="py-3 px-2 text-right text-amber-900 bg-slate-200/60">
                                    {summary.total_reserved} PCS
                                </td>
                                <td className="py-3 px-2 text-right text-emerald-900 bg-slate-200/60">
                                    {summary.total_available} PCS
                                </td>
                                <td className="py-3 px-2 text-right text-slate-900 bg-slate-200/60">
                                    {formatRp(summary.total_valuation)}
                                </td>
                                <td className="py-3 px-3"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </InventoryLayout>
    );
}

