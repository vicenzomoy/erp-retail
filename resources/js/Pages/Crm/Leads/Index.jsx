import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Columns3,
    List,
    Plus,
    Search,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Users,
    FileText,
    Eye,
    Package,
} from 'lucide-react';
import CrmLayout from '@/Layouts/CrmLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function getStageBadge(stage) {
    const map = {
        new: { cls: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Baru' },
        qualified: { cls: 'bg-sky-100 text-sky-800 border-sky-300', label: 'Terkualifikasi' },
        won: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Menang' },
        lost: { cls: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Kalah' },
    };
    return map[stage] ?? { cls: 'bg-slate-100 text-slate-700 border-slate-300', label: stage };
}

export default function LeadsIndex({ leads, filters = {}, customers = [] }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [stage, setStage] = useState(filters.stage ?? 'all');
    const [type, setType] = useState(filters.type ?? 'all');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? 'all');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search,
            stage,
            type,
            customer_id: customerId,
            ...overrides,
        };

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === '' || queryParams[key] === 'all' || queryParams[key] === null) {
                delete queryParams[key];
            }
        });

        router.get(route('crm.leads.index'), queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStage('all');
        setType('all');
        setCustomerId('all');
        router.get(route('crm.leads.index'), {}, { preserveState: false });
    };

    const data = leads?.data ?? [];
    const links = leads?.links ?? [];
    const totalRecords = leads?.total ?? data.length;

    return (
        <CrmLayout title="Daftar Prospek CRM" breadcrumbs={[{ label: 'Prospek' }]}>
            <Head title="Daftar Prospek CRM - Odoo List" />

            {/* ── Top Header ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-sky-600" />
                        Daftar Prospek CRM
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Tabel daftar seluruh Lead dan Opportunity dalam sistem.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher: Kanban vs List */}
                    <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <Link
                            href={route('crm.pipeline')}
                            className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Tampilan Kanban"
                        >
                            <Columns3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Kanban</span>
                        </Link>
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xs"
                            title="Tampilan List / Tabel"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">List</span>
                        </button>
                    </div>

                    <Link
                        href={route('crm.leads.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Prospek
                    </Link>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari ID, kontak, pelanggan, atau SKU..."
                            className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white focus:outline-none"
                        />
                    </div>

                    <select
                        value={stage}
                        onChange={(e) => {
                            setStage(e.target.value);
                            applyFilters({ stage: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Tahap</option>
                        <option value="new">Baru</option>
                        <option value="qualified">Terkualifikasi</option>
                        <option value="won">Menang</option>
                        <option value="lost">Kalah</option>
                    </select>

                    <select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            applyFilters({ type: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="lead">Lead</option>
                        <option value="opportunity">Opportunity</option>
                    </select>

                    <select
                        value={customerId}
                        onChange={(e) => {
                            setCustomerId(e.target.value);
                            applyFilters({ customer_id: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Pelanggan</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                        >
                            <Filter className="h-3 w-3" />
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                            title="Reset Filter"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Table View ── */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
                {data.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">Tidak ada prospek ditemukan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">ID Prospek</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Kontak</th>
                                    <th className="px-4 py-3">Peminatan Produk</th>
                                    <th className="px-4 py-3 text-right">Expected Revenue</th>
                                    <th className="px-4 py-3 text-center">Tipe</th>
                                    <th className="px-4 py-3 text-center">Tahap</th>
                                    <th className="px-4 py-3">Sales Person</th>
                                    <th className="px-4 py-3">Dibuat</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((lead) => {
                                    const badge = getStageBadge(lead.stage);

                                    return (
                                        <tr
                                            key={lead.id}
                                            onClick={() => router.visit(route('crm.leads.show', lead.id))}
                                            className="hover:bg-slate-50 cursor-pointer transition"
                                        >
                                            <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {lead.id}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                <div>{lead.customer_name}</div>
                                                <div className="text-[10px] text-slate-400">{lead.customer_id}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {lead.contact_name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {lead.variant_sku ? (
                                                    <div className="flex items-center gap-1 text-[11px]">
                                                        <Package className="h-3 w-3 text-slate-400" />
                                                        <span>{lead.qty_interest}x {lead.variant_sku}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-sky-950 tabular-nums whitespace-nowrap">
                                                {formatRp(lead.expected_revenue)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        lead.type === 'opportunity'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {lead.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {lead.assigned_name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {lead.created_at ?? '—'}
                                            </td>
                                            <td
                                                className="px-4 py-3 text-center whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link
                                                    href={route('crm.leads.show', lead.id)}
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
        </CrmLayout>
    );
}

