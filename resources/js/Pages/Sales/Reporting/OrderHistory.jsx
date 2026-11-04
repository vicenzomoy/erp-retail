import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    ShoppingBag,
    Search,
    Filter,
    Calendar,
    User,
    DollarSign,
    Package,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Eye,
    ReceiptText,
} from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function getStatusBadge(status, creditHold) {
    if (creditHold) {
        return {
            cls: 'bg-amber-100 text-amber-800 border border-amber-300',
            label: 'Kredit Hold',
            icon: AlertCircle,
        };
    }
    const map = {
        draft: {
            cls: 'bg-slate-100 text-slate-700 border border-slate-300',
            label: 'Draft',
            icon: Clock,
        },
        confirmed: {
            cls: 'bg-blue-100 text-blue-800 border border-blue-300',
            label: 'Terkonfirmasi',
            icon: CheckCircle2,
        },
        done: {
            cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
            label: 'Selesai',
            icon: CheckCircle2,
        },
        cancelled: {
            cls: 'bg-rose-100 text-rose-800 border border-rose-300',
            label: 'Dibatalkan',
            icon: XCircle,
        },
    };
    return map[status] ?? { cls: 'bg-slate-100 text-slate-700 border border-slate-300', label: status, icon: Clock };
}

export default function OrderHistory({ orders, customers = [], summary = {}, filters = {} }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search,
            status,
            customer_id: customerId,
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        };

        // Bersihkan parameter kosong
        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === '' || queryParams[key] === 'all' || queryParams[key] === null) {
                delete queryParams[key];
            }
        });

        router.get(route('sales.reporting.orders'), queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setCustomerId('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('sales.reporting.orders'), {}, { preserveState: false });
    };

    const data = orders?.data ?? [];
    const links = orders?.links ?? [];
    const totalRecords = orders?.total ?? data.length;

    return (
        <SalesLayout
            title="Laporan Riwayat Order Penjualan"
            breadcrumbs={[{ label: 'Laporan' }, { label: 'Riwayat Order' }]}
        >
            <Head title="Laporan Riwayat Order Penjualan" />

            {/* ── Page Header ── */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-slate-800" />
                        Laporan Riwayat Order Penjualan
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Rekapitulasi lengkap seluruh quotation dan sales order, realisasi omzet, serta pemenuhan barang.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('sales.orders.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                    >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Buat Quotation Baru
                    </Link>
                </div>
            </div>

            {/* ── Summary KPI Cards ── */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Total Order */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Order</span>
                        <div className="rounded bg-slate-100 p-2 text-slate-700">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{summary.total_orders ?? 0}</span>
                        <span className="text-xs text-slate-500">dokumen</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                        Berdasarkan kriteria filter aktif
                    </div>
                </div>

                {/* KPI 2: Total Omzet Kotor */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Nilai Order</span>
                        <div className="rounded bg-blue-50 p-2 text-blue-700">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl font-bold text-blue-900">
                            {formatRp(summary.total_grand_total)}
                        </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                        Grand total termasuk PPN
                    </div>
                </div>

                {/* KPI 3: DPP & PPN Breakdown */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">DPP &amp; PPN 11%</span>
                        <div className="rounded bg-emerald-50 p-2 text-emerald-700">
                            <ReceiptText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-0.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">DPP:</span>
                            <span className="font-semibold text-slate-800">{formatRp(summary.total_dpp)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">PPN:</span>
                            <span className="font-semibold text-emerald-700">{formatRp(summary.total_tax)}</span>
                        </div>
                    </div>
                </div>

                {/* KPI 4: Kuantitas Unit */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Pemenuhan Fisik</span>
                        <div className="rounded bg-indigo-50 p-2 text-indigo-700">
                            <Package className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                        <div className="rounded bg-slate-50 p-1">
                            <div className="text-[10px] text-slate-400">Order</div>
                            <div className="text-xs font-bold text-slate-800">{summary.total_qty_ordered ?? 0}</div>
                        </div>
                        <div className="rounded bg-amber-50 p-1">
                            <div className="text-[10px] text-amber-700">Kirim</div>
                            <div className="text-xs font-bold text-amber-800">{summary.total_qty_delivered ?? 0}</div>
                        </div>
                        <div className="rounded bg-emerald-50 p-1">
                            <div className="text-[10px] text-emerald-700">Faktur</div>
                            <div className="text-xs font-bold text-emerald-800">{summary.total_qty_invoiced ?? 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filters Section ── */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                <form onSubmit={handleSearchSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {/* Search Bar */}
                        <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Pencarian Order</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nomor SO / Nama Pelanggan..."
                                    className="w-full rounded border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Status Order</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
                            >
                                <option value="all">Semua Status</option>
                                <option value="draft">Draft (Quotation)</option>
                                <option value="confirmed">Terkonfirmasi (Sales Order)</option>
                                <option value="done">Selesai (Done)</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>

                        {/* Customer Filter */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Pelanggan</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
                            >
                                <option value="all">Semua Pelanggan</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From & To */}
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Periode Tanggal</label>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
                                />
                                <span className="text-slate-400 text-xs">-</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="text-xs text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-800">{data.length}</span> dari{' '}
                            <span className="font-semibold text-slate-800">{totalRecords}</span> order
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Reset Filter
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                            >
                                <Filter className="h-3 w-3" />
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Table / List View ── */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
                {data.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">Tidak ada riwayat order ditemukan</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Coba ubah kata kunci pencarian atau bersihkan filter tanggal/status.
                        </p>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="mt-3 inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Bersihkan Filter
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">No. Order</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Termin</th>
                                    <th className="px-4 py-3">Ringkasan Item</th>
                                    <th className="px-4 py-3 text-center">Qty (Ord/Krm/Fkt)</th>
                                    <th className="px-4 py-3 text-right">DPP (Subtotal)</th>
                                    <th className="px-4 py-3 text-right">PPN 11%</th>
                                    <th className="px-4 py-3 text-right">Grand Total</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((so) => {
                                    const badge = getStatusBadge(so.status, so.credit_hold);
                                    const BadgeIcon = badge.icon;

                                    return (
                                        <tr
                                            key={so.id}
                                            onClick={() => router.visit(route('sales.orders.show', so.id))}
                                            className="hover:bg-slate-50 cursor-pointer transition"
                                        >
                                            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-slate-900">{so.id}</span>
                                                    {so.credit_hold && (
                                                        <span
                                                            title="Kredit Hold Aktif"
                                                            className="inline-block h-2 w-2 rounded-full bg-amber-500"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                <div>{so.created_at ?? '—'}</div>
                                                {so.confirmed_at && (
                                                    <div className="text-[10px] text-slate-400">
                                                        Komp: {so.confirmed_at}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-medium">
                                                <div className="line-clamp-1">{so.customer_name}</div>
                                                <div className="text-[10px] text-slate-400">{so.customer_id}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                                    {so.payment_terms ?? 'NET30'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                                                <span
                                                    className="line-clamp-2 text-[11px]"
                                                    title={so.items_summary}
                                                >
                                                    {so.items_summary || 'Tidak ada baris'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="font-mono text-[11px]">
                                                    <span className="font-semibold text-slate-800">{so.total_qty_ordered}</span>
                                                    {' / '}
                                                    <span className="text-amber-700 font-semibold">{so.total_qty_delivered}</span>
                                                    {' / '}
                                                    <span className="text-emerald-700 font-semibold">{so.total_qty_invoiced}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums whitespace-nowrap">
                                                {formatRp(so.subtotal_before_tax)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums whitespace-nowrap">
                                                {formatRp(so.total_tax)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                                                {formatRp(so.grand_total)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                                                >
                                                    <BadgeIcon className="h-3 w-3" />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td
                                                className="px-4 py-3 text-center whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link
                                                    href={route('sales.orders.show', so.id)}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                                                >
                                                    <Eye className="h-3 w-3 text-slate-500" />
                                                    Buka
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {links.length > 3 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {links.map((link, idx) => {
                        if (link.label === '&laquo; Previous') {
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            );
                        }
                        if (link.label === 'Next &raquo;') {
                            return (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            );
                        }
                        return (
                            <button
                                key={idx}
                                onClick={() => link.url && router.visit(link.url)}
                                disabled={!link.url}
                                className={`flex h-8 w-8 items-center justify-center rounded text-xs font-semibold transition ${
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            )}
        </SalesLayout>
    );
}

