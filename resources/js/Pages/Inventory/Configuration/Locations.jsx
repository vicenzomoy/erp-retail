import React from 'react';
import { Head, Link } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    Warehouse,
    Store,
    MapPin,
    DollarSign,
    Package,
    ShieldAlert,
    ExternalLink,
    Building2,
} from 'lucide-react';

export default function Locations({ locations = [] }) {
    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    const totalValuation = locations.reduce((acc, loc) => acc + (loc.valuation || 0), 0);

    return (
        <InventoryLayout
            title="Lokasi & Gudang"
            breadcrumbs={[
                { label: 'Konfigurasi', href: route('inventory.overview') },
                { label: 'Gudang & Lokasi' },
            ]}
        >
            <Head title="Gudang & Lokasi Penyimpanan — Bara Wear" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                        Master Gudang & Lokasi Penyimpanan
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                        {locations.length} Lokasi Operasional
                    </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Master Data Baseline Terkunci (Read-Only)</span>
                </div>
            </div>

            {/* Total Valuation Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total Valuasi Persediaan di Seluruh Fasilitas
                    </h3>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                        {formatRp(totalValuation)}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('inventory.products.stock-by-location')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                        <Package className="h-3.5 w-3.5" />
                        Buka Matriks Stok Lengkap
                    </Link>
                </div>
            </div>

            {/* Locations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((loc) => {
                    const isWarehouse = loc.type === 'warehouse' || loc.location_code.includes('WH');

                    return (
                        <div
                            key={loc.location_code}
                            className="bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${
                                        isWarehouse ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {isWarehouse ? (
                                            <Warehouse className="h-6 w-6" />
                                        ) : (
                                            <Store className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                {loc.location_code}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                {loc.type || 'Internal'}
                                            </span>
                                        </div>
                                        <h2 className="text-base font-bold text-slate-800 mt-1">
                                            {loc.location_name}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-3 text-xs bg-slate-50/50">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        Kota / Wilayah:
                                    </span>
                                    <span className="font-semibold text-slate-800">{loc.city}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                        Valuasi Persediaan di Lokasi:
                                    </span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        {formatRp(loc.valuation)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                                <Link
                                    href={route('inventory.reporting.moves', { location: loc.location_code })}
                                    className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                                >
                                    Lihat Riwayat Mutasi
                                    <ExternalLink className="h-3 w-3" />
                                </Link>

                                <Link
                                    href={route('inventory.reporting.forecast', { location: loc.location_code })}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                                >
                                    Cek ATP Lokasi Ini
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </InventoryLayout>
    );
}

