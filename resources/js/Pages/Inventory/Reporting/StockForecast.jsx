import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    BarChart3,
    Layers,
    Package,
    CheckCircle2,
    Trash2,
    Search,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

export default function StockForecast({
    report = [],
    selectedLocation = 'WH-PKU',
    locations = [],
}) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (sku) => {
        setExpandedRows((prev) => ({
            ...prev,
            [sku]: !prev[sku],
        }));
    };

    const handleLocationFilter = (loc) => {
        router.get(
            route('inventory.reporting.forecast'),
            { location: loc },
            { preserveState: true }
        );
    };

    const handleReleaseReservation = (resId) => {
        if (confirm('Apakah Anda yakin ingin melepaskan reservasi stok ini?')) {
            router.post(route('inventory.reporting.release-reservation', resId), {}, {
                preserveScroll: true,
            });
        }
    };

    const filteredReport = report.filter((item) => {
        const matchesSearch =
            item.variant_sku.toLowerCase().includes(search.toLowerCase()) ||
            item.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const totalOnHand = filteredReport.reduce((acc, r) => acc + r.on_hand, 0);
    const totalReserved = filteredReport.reduce((acc, r) => acc + r.reserved, 0);
    const totalAvailable = filteredReport.reduce((acc, r) => acc + r.available, 0);

    return (
        <InventoryLayout
            title="Perkiraan Stok (ATP)"
            breadcrumbs={[
                { label: 'Laporan', href: route('inventory.overview') },
                { label: 'Perkiraan Stok (ATP)' },
            ]}
        >
            <Head title="Perkiraan Stok & ATP (Available to Promise) — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        Monitoring Available to Promise (ATP)
                    </span>
                    <select
                        value={selectedLocation}
                        onChange={(e) => handleLocationFilter(e.target.value)}
                        className="rounded border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                        <option value="all">Semua Lokasi Konsol</option>
                        {locations.map((l) => (
                            <option key={l.location_code} value={l.location_code}>
                                {l.location_code} ({l.location_name})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari SKU / nama..."
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-52 sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* ATP Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Total Stok Fisik (On Hand)</span>
                        <Package className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {totalOnHand} <span className="text-xs font-normal text-slate-500">PCS</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Stok yang ada di lokasi fisik saat ini</div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Total Komitmen Reservasi SO</span>
                        <Layers className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700">
                        {totalReserved} <span className="text-xs font-normal text-amber-600">PCS</span>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-1">Mengikat stok agar tidak terjual ganda</div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Stok Siap Dijual (Available / ATP)</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                        {totalAvailable} <span className="text-xs font-normal text-emerald-600">PCS</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1">Rumus: On Hand &minus; Reserved</div>
                </div>
            </div>

            {/* ATP Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                        Daftar Produk &amp; Status Available to Promise (Lokasi: {selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation})
                    </span>
                    <span className="text-xs text-slate-500">
                        Klik panah untuk melihat rincian Sales Order yang mereservasi stok
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-100/60 font-semibold text-slate-700">
                            <tr>
                                <th className="w-8 py-2.5 px-3"></th>
                                <th className="py-2.5 px-3 text-left">SKU Varian</th>
                                <th className="py-2.5 px-3 text-left">Nama Produk</th>
                                <th className="py-2.5 px-3 text-center">Warna / Size</th>
                                <th className="py-2.5 px-3 text-right">Stok Fisik (On Hand)</th>
                                <th className="py-2.5 px-3 text-right text-amber-700">Tereservasi SO</th>
                                <th className="py-2.5 px-3 text-right text-emerald-700 font-bold">Siap Jual (ATP)</th>
                                <th className="py-2.5 px-3 text-center">Status Stok</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredReport.map((item) => {
                                const hasReservations = item.reservations && item.reservations.length > 0;
                                const isExpanded = !!expandedRows[item.variant_sku];

                                return (
                                    <React.Fragment key={item.variant_sku}>
                                        <tr className="hover:bg-slate-50/70 transition">
                                            <td className="py-2.5 px-3 text-center">
                                                {hasReservations && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRow(item.variant_sku)}
                                                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                                        title="Lihat Reservasi SO"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-amber-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                <Link
                                                    href={route('inventory.products.show', item.variant_sku)}
                                                    className="hover:underline text-slate-900"
                                                >
                                                    {item.variant_sku}
                                                </Link>
                                            </td>

                                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                                                {item.name}
                                            </td>

                                            <td className="py-2.5 px-3 text-center text-slate-600">
                                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold mr-1">
                                                    {item.color}
                                                </span>
                                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">
                                                    {item.size}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                                                {item.on_hand} {item.unit}
                                            </td>

                                            <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                                                {item.reserved > 0 ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        {item.reserved} {item.unit}
                                                        {hasReservations && (
                                                            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2">
                                                                {item.reservations.length} SO
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>

                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 text-sm">
                                                {item.available} {item.unit}
                                            </td>

                                            <td className="py-2.5 px-3 text-center">
                                                {item.available > 5 ? (
                                                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold">
                                                        Aman
                                                    </span>
                                                ) : item.available > 0 ? (
                                                    <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold">
                                                        Menipis
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-[10px] font-semibold">
                                                        Habis (OOS)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Sub-row: Active reservations breakdown */}
                                        {hasReservations && isExpanded && (
                                            <tr className="bg-amber-50/40 border-t border-b border-amber-200">
                                                <td colSpan={8} className="py-3 px-6">
                                                    <div className="text-xs font-bold text-amber-900 mb-2">
                                                        Rincian Komitmen Reservasi Sales Order untuk SKU {item.variant_sku}:
                                                    </div>
                                                    <div className="overflow-x-auto rounded border border-amber-200 bg-white">
                                                        <table className="min-w-full divide-y divide-amber-200 text-xs">
                                                            <thead className="bg-amber-50/80 text-amber-900 font-semibold">
                                                                <tr>
                                                                    <th className="py-1.5 px-3 text-left">No. Sales Order</th>
                                                                    <th className="py-1.5 px-3 text-left">Pelanggan</th>
                                                                    <th className="py-1.5 px-3 text-left">Lokasi Reservasi</th>
                                                                    <th className="py-1.5 px-3 text-right">Qty Terikat</th>
                                                                    <th className="py-1.5 px-3 text-left">Waktu Reservasi</th>
                                                                    <th className="py-1.5 px-3 text-center">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-amber-100">
                                                                {item.reservations.map((res) => (
                                                                    <tr key={res.id}>
                                                                        <td className="py-1.5 px-3 font-mono font-bold text-slate-800">
                                                                            {res.sales_order_id}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 text-slate-700">
                                                                            {res.customer_name}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 font-mono text-slate-700">
                                                                            {res.location_code}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 text-right font-bold text-amber-800">
                                                                            {res.qty_reserved} {item.unit}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 text-slate-500">
                                                                            {res.reserved_at}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 text-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleReleaseReservation(res.id)}
                                                                                className="inline-flex items-center gap-1 rounded text-red-600 hover:text-red-800 text-[10px] font-semibold hover:underline cursor-pointer"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                                Lepas
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </InventoryLayout>
    );
}
