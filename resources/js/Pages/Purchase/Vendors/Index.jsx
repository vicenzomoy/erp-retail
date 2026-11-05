import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    Plus,
    Search,
    Users,
    Building2,
    ArrowRight,
    MapPin,
    CreditCard,
    DollarSign,
} from 'lucide-react';

export default function Index({ vendors, filters = {}, totalCount = 0 }) {
    const handleSearch = (e) => {
        e.preventDefault();
        const search = e.target.search.value;
        router.get(
            route('purchase.vendors.index'),
            { search: search || undefined },
            { preserveState: true }
        );
    };

    const formatRp = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num || 0);
    };

    return (
        <PurchaseLayout
            title="Daftar Pemasok (Vendors)"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pemasok (Vendors)' },
            ]}
        >
            <Head title="Pemasok (Vendors) — Bara Wear" />

            {/* Header Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('purchase.vendors.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Vendor (New)
                    </Link>
                    <span className="text-sm font-bold text-slate-800">
                        Daftar Pemasok & Mitra Pengadaan ({totalCount} Vendor)
                    </span>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Cari kode vendor, nama, kota..."
                            className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-60"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Cari
                    </button>
                </form>
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.data.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-400">
                        Tidak ada vendor yang cocok dengan kriteria pencarian.
                    </div>
                ) : (
                    vendors.data.map((v) => (
                        <div
                            key={v.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-amber-300 hover:shadow-md transition flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        {v.id}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        Termin: {v.payment_terms}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 mb-1">
                                    {v.name}
                                </h3>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{v.city}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 block uppercase">Total Transaksi</span>
                                    <span className="font-bold text-slate-900 font-mono">
                                        {formatRp(v.total_spent)}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                        {v.purchase_orders_count} Pesanan
                                    </span>
                                </div>

                                <Link
                                    href={route('purchase.vendors.show', v.id)}
                                    className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 text-xs font-semibold transition"
                                >
                                    Detail <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {vendors.links && vendors.links.length > 3 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white rounded-lg p-3 mt-4">
                    <div className="text-xs text-slate-500">
                        Menampilkan {vendors.from || 0} - {vendors.to || 0} dari {vendors.total} vendor
                    </div>
                    <div className="flex items-center gap-1">
                        {vendors.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded px-2.5 py-1 text-xs ${
                                    link.active
                                        ? 'bg-slate-900 text-white font-bold'
                                        : link.url
                                        ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                        : 'text-slate-400 cursor-not-allowed opacity-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </PurchaseLayout>
    );
}

