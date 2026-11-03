import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    BarChart3,
    Layers,
    Package,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Plus,
    X,
    Trash2,
    Search,
    ChevronDown,
    ChevronRight,
    MapPin,
    ShoppingCart,
} from 'lucide-react';

export default function StockForecast({
    report = [],
    selectedLocation = 'WH-PKU',
    locations = [],
    salesOrders = [],
}) {
    const [search, setSearch] = useState('');
    const [showReserveModal, setShowReserveModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    // Reservation Form
    const { data, setData, post, processing, errors, reset } = useForm({
        sales_order_id: '',
        so_line_id: '',
        variant_sku: '',
        location_code: selectedLocation === 'all' ? (locations[0]?.location_code || 'WH-PKU') : selectedLocation,
        qty_reserved: 1,
    });

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

    const handleSoSelect = (soId) => {
        const selectedSo = salesOrders.find((so) => so.id === soId);
        setData((prev) => ({
            ...prev,
            sales_order_id: soId,
            so_line_id: selectedSo?.lines[0]?.id || '',
            variant_sku: selectedSo?.lines[0]?.sku || '',
            qty_reserved: selectedSo?.lines[0] ? (selectedSo.lines[0].qty_ordered - selectedSo.lines[0].qty_delivered) : 1,
        }));
    };

    const handleLineSelect = (lineId) => {
        const selectedSo = salesOrders.find((so) => so.id === data.sales_order_id);
        const line = selectedSo?.lines.find((l) => l.id === parseInt(lineId));
        if (line) {
            setData((prev) => ({
                ...prev,
                so_line_id: line.id,
                variant_sku: line.sku,
                qty_reserved: line.qty_ordered - line.qty_delivered,
            }));
        }
    };

    const handleReserveSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.reporting.reserve'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowReserveModal(false);
                reset();
            },
        });
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
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:border-slate-500 focus:outline-none"
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
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-52"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowReserveModal(true)}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Simulasi Reservasi SO (T-13 / T-14)
                    </button>
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
                        Daftar Produk & Status Available to Promise (Lokasi: {selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation})
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

            {/* Modal Simulasi Reservasi SO (T-13 & T-14) */}
            {showReserveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Simulasi Reservasi Sales Order
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Uji Skenario T-13 (Reservasi Sukses) & T-14 (Blokir Jika Kurang ATP)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReserveModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReserveSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Pilih Dokumen Sales Order
                                </label>
                                <select
                                    value={data.sales_order_id}
                                    onChange={(e) => handleSoSelect(e.target.value)}
                                    required
                                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                                >
                                    <option value="">-- Pilih Sales Order --</option>
                                    {salesOrders.map((so) => (
                                        <option key={so.id} value={so.id}>
                                            {so.id} &bull; Pelanggan: {so.customer} ({so.lines.length} baris barang)
                                        </option>
                                    ))}
                                </select>
                                {errors.sales_order_id && (
                                    <p className="text-red-600 text-xs mt-1">{errors.sales_order_id}</p>
                                )}
                            </div>

                            {data.sales_order_id && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Pilih Baris Item Pesanan
                                    </label>
                                    <select
                                        value={data.so_line_id}
                                        onChange={(e) => handleLineSelect(e.target.value)}
                                        required
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                                    >
                                        {salesOrders
                                            .find((so) => so.id === data.sales_order_id)
                                            ?.lines.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    SKU: {l.sku} &bull; {l.product_name} (Order: {l.qty_ordered}, Belum Kirim: {l.qty_ordered - l.qty_delivered})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Lokasi Gudang / Toko
                                    </label>
                                    <select
                                        value={data.location_code}
                                        onChange={(e) => setData('location_code', e.target.value)}
                                        required
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                                    >
                                        {locations.map((loc) => (
                                            <option key={loc.location_code} value={loc.location_code}>
                                                {loc.location_code} ({loc.location_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Qty Reservasi
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={data.qty_reserved}
                                        onChange={(e) => setData('qty_reserved', parseFloat(e.target.value) || 0)}
                                        required
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                                    />
                                    {errors.qty_reserved && (
                                        <p className="text-red-600 text-xs mt-1">{errors.qty_reserved}</p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    Aturan Validasi ATP (T-13 & T-14):
                                </div>
                                <div>
                                    Sistem akan memeriksa stok <code>Available = On Hand - Active Reservations</code> di lokasi yang dipilih. Jika Qty diminta melebihi ATP, sistem akan menolak transaksi secara otomatis tanpa partial leak.
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowReserveModal(false)}
                                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {processing ? 'Memproses...' : 'Terapkan Reservasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </InventoryLayout>
    );
}

