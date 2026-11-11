import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OwnerLayout from '@/Layouts/OwnerLayout';
import ReportNavTabs from './ReportNavTabs';
import {
    ArrowDownLeft,
    Building2,
    FileText,
    ShoppingCart,
    Search,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronDown,
    ChevronUp,
    Package,
    ShieldAlert,
    Receipt,
} from 'lucide-react';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function Payables({ kpiSummary, report }) {
    const [activeTab, setActiveTab] = useState('vendors'); // 'vendors', 'bills'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedVendors, setExpandedVendors] = useState({});
    const [expandedBills, setExpandedBills] = useState({});
    const [onlyUnpaid, setOnlyUnpaid] = useState(true);

    const toggleVendorExpand = (vendorId) => {
        setExpandedVendors((prev) => ({ ...prev, [vendorId]: !prev[vendorId] }));
    };

    const toggleBillExpand = (billId) => {
        setExpandedBills((prev) => ({ ...prev, [billId]: !prev[billId] }));
    };

    const filteredVendors = (report.vendors || []).filter((v) => {
        const matchesSearch =
            v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.city.toLowerCase().includes(searchQuery.toLowerCase());
        if (onlyUnpaid) {
            return matchesSearch && v.total_residual > 0;
        }
        return matchesSearch;
    });

    const filteredBills = (report.bills || []).filter((b) => {
        const matchesSearch =
            b.bill_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.purchase_order_id && b.purchase_order_id.toLowerCase().includes(searchQuery.toLowerCase()));
        if (onlyUnpaid) {
            return matchesSearch && b.amount_residual > 0;
        }
        return matchesSearch;
    });

    return (
        <OwnerLayout
            title="Rincian Utang Usaha (AP)"
            breadcrumbs={[
                { label: 'Dashboard', href: route('owner.dashboard') },
                { label: 'Laporan Eksekutif', href: route('owner.dashboard') },
                { label: 'Utang Usaha' },
            ]}
        >
            <Head title="Rincian Utang Usaha (AP) - Executive Dashboard" />

            {/* Nav Tabs */}
            <ReportNavTabs
                currentTab="payables"
                title="Rincian Utang Usaha ke Vendor (AP)"
                subtitle="PO dan Tagihan apa saja yang belum dibayar, daftar PT Vendor pemasok, dan rincian besaran utang kita ke setiap PT."
            />

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                <div className="rounded-lg border border-rose-200 bg-linear-to-br from-rose-50 to-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Total Utang Usaha (AP)</p>
                    <p className="text-xl font-black text-rose-900 mt-1">{formatRp(report.kpis.total_open_ap)}</p>
                    <p className="text-[10px] text-rose-600 mt-0.5">Tagihan vendor yang belum dilunasi</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-linear-to-br from-amber-50 to-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Utang Jatuh Tempo</p>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-xl font-bold text-amber-700 mt-1">{formatRp(report.kpis.total_overdue_ap)}</p>
                    <p className="text-[10px] text-amber-700/80 mt-0.5">Melewati batas termin vendor</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PT Vendor Kita Utangi</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{report.kpis.vendors_with_ap_count} Perusahaan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vendor dengan saldo utang aktif</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tagihan Belum Lunas</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">{report.kpis.unpaid_bills_count} Tagihan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Menunggu pembayaran</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Pembelian Tagihan</p>
                    <p className="text-xl font-bold text-slate-700 mt-1">{formatRp(report.kpis.total_billed)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{report.bills.length} total tagihan vendor</p>
                </div>
            </div>

            {/* Tab Switches & Filter Bar */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs mb-5 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('vendors')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'vendors'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Building2 className="h-3.5 w-3.5 text-rose-600" />
                        <span>Rincian Utang per PT Vendor ({report.vendors.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('bills')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 ${
                            activeTab === 'bills'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>Tagihan PO Belum Lunas ({report.bills.length})</span>
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                            type="checkbox"
                            checked={onlyUnpaid}
                            onChange={(e) => setOnlyUnpaid(e.target.checked)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                        />
                        <span>Hanya yang Belum Lunas</span>
                    </label>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari PT vendor, no PO, atau bill..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                        />
                    </div>
                </div>
            </div>

            {/* TAB 1: VENDORS BREAKDOWN (Rincian Utang Kita ke Setiap PT) */}
            {activeTab === 'vendors' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Rincian Besaran Utang Kita ke Setiap PT Vendor
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan nama PT Vendor, termin pembayaran, nomor PO terkait, barang yang dibeli, dan berapa utang kita.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredVendors.length} PT Vendor
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredVendors.length > 0 ? (
                            filteredVendors.map((v) => {
                                const isExpanded = !!expandedVendors[v.vendor_id];
                                return (
                                    <div key={v.vendor_id} className="transition hover:bg-slate-50/50">
                                        {/* Vendor Header */}
                                        <div
                                            onClick={() => toggleVendorExpand(v.vendor_id)}
                                            className="px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    className="mt-0.5 p-1 rounded hover:bg-slate-200 text-slate-500"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {v.vendor_name}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                            Termin: {v.payment_terms}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            • {v.city}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                                        <span>PO Terkait:</span>
                                                        {v.purchase_orders.length > 0 ? (
                                                            v.purchase_orders.map((pId) => (
                                                                <Link
                                                                    key={pId}
                                                                    href={route('purchase.orders.show', pId)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="font-mono text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                                                >
                                                                    {pId}
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                        <span className="text-slate-400">•</span>
                                                        <span>{v.unpaid_bills} tagihan belum lunas</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 self-end md:self-center pl-8 md:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Tagihan</p>
                                                    <p className="text-xs font-semibold text-slate-700">{formatRp(v.total_billed)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sudah Dibayar</p>
                                                    <p className="text-xs font-semibold text-emerald-700">{formatRp(v.total_paid)}</p>
                                                </div>
                                                <div className="text-right min-w-[130px]">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Utang Kita ke PT Ini</p>
                                                    <p className={`text-base font-black ${
                                                        v.total_residual > 0 ? 'text-rose-700' : 'text-slate-400'
                                                    }`}>
                                                        {formatRp(v.total_residual)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible Products & Active POs List */}
                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-rose-600" />
                                                    <span>Rincian Barang yang Dibeli dari {v.vendor_name}:</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {v.products.length > 0 ? (
                                                        v.products.map((p) => (
                                                            <div key={p.sku} className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-semibold text-xs text-slate-900">{p.name}</p>
                                                                    <p className="font-mono text-[10px] text-slate-400">{p.sku}</p>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                                                    {p.qty} pcs
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-xs text-slate-400 py-1">
                                                            Tidak ada data rincian barang.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Tidak ada data utang vendor yang cocok dengan filter.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: BILLS WITH PO LINK & ITEM BREAKDOWN */}
            {activeTab === 'bills' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Daftar Tagihan Purchase Order (Vendor Bills) & Rincian Produk
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Menampilkan PO apa saja yang belum dibayar, dari PT apa saja, rincian barang yang dibeli, dan sisa utang.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                            {filteredBills.length} Tagihan
                        </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                        {filteredBills.length > 0 ? (
                            filteredBills.map((b) => {
                                const isExpanded = !!expandedBills[b.bill_id];
                                return (
                                    <div key={b.bill_id} className="transition hover:bg-slate-50/50">
                                        {/* Bill Row Header */}
                                        <div
                                            onClick={() => toggleBillExpand(b.bill_id)}
                                            className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    type="button"
                                                    className="mt-0.5 p-1 rounded hover:bg-slate-200 text-slate-500"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-rose-700">
                                                            {b.bill_id}
                                                        </span>
                                                        {b.purchase_order_id && (
                                                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                                Ref PO: {b.purchase_order_id}
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {b.vendor_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            (Termin: {b.payment_terms})
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Tgl Tagihan: <span className="font-medium text-slate-700">{b.bill_date}</span> • Jatuh Tempo: <span className="font-medium text-slate-700">{b.due_date}</span> • Total Barang: <span className="font-bold text-slate-800">{b.total_qty} pcs</span> ({b.items.length} ragam item)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Financials & Status */}
                                            <div className="flex flex-wrap items-center gap-5 self-end lg:self-center pl-8 lg:pl-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Tagihan</p>
                                                    <p className="text-xs font-bold text-slate-800">{formatRp(b.grand_total)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sudah Dibayar</p>
                                                    <p className="text-xs font-semibold text-emerald-700">{formatRp(b.amount_paid)}</p>
                                                </div>
                                                <div className="text-right min-w-[120px]">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sisa Utang Kita</p>
                                                    <p className={`text-sm font-black ${
                                                        b.amount_residual > 0
                                                            ? b.is_overdue
                                                                ? 'text-rose-700'
                                                                : 'text-amber-700'
                                                            : 'text-emerald-700'
                                                    }`}>
                                                        {formatRp(b.amount_residual)}
                                                    </p>
                                                </div>
                                                <div>
                                                    {b.status === 'paid' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Lunas</span>
                                                        </span>
                                                    )}
                                                    {b.status === 'overdue' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            <span>Jatuh Tempo</span>
                                                        </span>
                                                    )}
                                                    {b.status === 'open' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                            <Clock className="h-3 w-3" />
                                                            <span>Belum Lunas</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Link
                                                        href={b.view_url}
                                                        className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                                                    >
                                                        Tagihan
                                                    </Link>
                                                    {b.po_view_url && (
                                                        <Link
                                                            href={b.po_view_url}
                                                            className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                                        >
                                                            PO
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible Line Items Detail */}
                                        {isExpanded && (
                                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                                                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="h-3.5 w-3.5 text-rose-600" />
                                                        <span>Rincian Barang yang Dibeli pada Tagihan Ini:</span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500">
                                                        Vendor: <strong className="text-slate-900">{b.vendor_name}</strong>
                                                    </span>
                                                </div>
                                                <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                                                            <tr>
                                                                <th className="py-2 px-3">SKU</th>
                                                                <th className="py-2 px-3">Nama Produk / Barang</th>
                                                                <th className="py-2 px-2 text-center">Ukuran / Warna</th>
                                                                <th className="py-2 px-3 text-right">Kuantitas</th>
                                                                <th className="py-2 px-3 text-right">Harga Satuan</th>
                                                                <th className="py-2 px-3 text-right font-bold text-slate-900">Total Harga</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {b.items.map((it, idx) => (
                                                                <tr key={`${it.sku}-${idx}`} className="hover:bg-slate-50">
                                                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                                                        {it.sku}
                                                                    </td>
                                                                    <td className="py-2 px-3 font-medium text-slate-900">
                                                                        {it.product_name}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-center text-slate-500">
                                                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                                                                            {it.size} / {it.color}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-semibold text-slate-800">
                                                                        {it.qty} pcs
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right text-slate-600">
                                                                        {formatRp(it.unit_price)}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-bold text-rose-700">
                                                                        {formatRp(it.line_total)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                Tidak ada data tagihan vendor ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

