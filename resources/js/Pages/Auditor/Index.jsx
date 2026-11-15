import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuditorLayout from '@/Layouts/AuditorLayout';
import {
    Search,
    Filter,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    ShieldCheck,
    Clock,
    FileText,
} from 'lucide-react';

export default function AuditorIndex({
    logs,
    documentTypes = [],
    actorRoles = [],
    summary = {},
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [documentType, setDocumentType] = useState(filters.document_type ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [actorRole, setActorRole] = useState(filters.actor_role ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [expandedId, setExpandedId] = useState(null);

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(
            route('auditor.index'),
            {
                search: search || undefined,
                document_type: documentType || undefined,
                status: status || undefined,
                actor_role: actorRole || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const resetFilters = () => {
        setSearch('');
        setDocumentType('');
        setStatus('');
        setActorRole('');
        setDateFrom('');
        setDateTo('');
        router.get(route('auditor.index'), {}, { preserveState: false, replace: true });
    };

    const rows = logs?.data ?? [];

    return (
        <AuditorLayout title="Audit Trail & Telusur Dokumen">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Log Audit</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{summary.total ?? 0}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Aksi Berhasil (SUCCESS)</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">{summary.success ?? 0}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Ditolak / Anomali (REJECTED)</div>
                    <div className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">{summary.rejected ?? 0}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Aktivitas Hari Ini</div>
                    <div className="mt-1 text-2xl font-bold text-indigo-700 tabular-nums">{summary.today ?? 0}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={applyFilters} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs mb-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <span>Filter Jejak Audit Lintas Modul</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cari Dokumen / Aktor / Aksi</label>
                        <div className="relative">
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Contoh: SO-0001, INV-, Siti..."
                                className="w-full rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Dokumen</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                        >
                            <option value="">Semua Tipe</option>
                            {documentTypes.map((dt) => (
                                <option key={dt} value={dt}>{dt}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Peran Aktor</label>
                        <select
                            value={actorRole}
                            onChange={(e) => setActorRole(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                        >
                            <option value="">Semua Peran</option>
                            {actorRoles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="flex-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                            Terapkan
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            title="Reset Filter"
                            className="rounded border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                        />
                    </div>
                </div>
            </form>

            {/* Audit Trail Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-slate-700" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Daftar Jejak Audit Sistem (Global Audit Trail)
                        </h2>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Menampilkan {rows.length} dari {logs?.total ?? 0} entri
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Tidak ada entri audit log yang cocok dengan filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Waktu</th>
                                    <th className="px-4 py-2.5">Aktor & Peran</th>
                                    <th className="px-4 py-2.5">Aksi</th>
                                    <th className="px-4 py-2.5">Dokumen</th>
                                    <th className="px-4 py-2.5">Keterangan</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                    <th className="px-4 py-2.5 text-right">Detail & Relasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((log) => {
                                    const isExpanded = expandedId === log.id;
                                    const isRejected = log.status === 'REJECTED';

                                    return (
                                        <React.Fragment key={log.id}>
                                            <tr className={`hover:bg-slate-50/70 ${isRejected ? 'bg-rose-50/20' : ''}`}>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="font-mono text-[11px] text-slate-700">{log.created_at}</div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {log.time_ago}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="font-bold text-slate-900">{log.actor_username}</div>
                                                    <span className="inline-block mt-0.5 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                                        {log.actor_role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                                                    {log.action}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                                                        {log.document_type ?? '—'}
                                                    </div>
                                                    <div className="font-mono font-bold text-slate-900">
                                                        {log.document_id ?? '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 max-w-md">
                                                    {log.notes || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                                            isRejected
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                    >
                                                        {isRejected ? (
                                                            <AlertCircle className="h-3 w-3" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        )}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {log.document_url && (
                                                            <Link
                                                                href={log.document_url}
                                                                className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                Buka Dokumen
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                                        >
                                                            Payload
                                                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50">
                                                    <td colSpan={7} className="px-4 py-3 border-t border-slate-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                                            <div>
                                                                <div className="font-bold text-slate-600 mb-1">Nilai Sebelum (old_value)</div>
                                                                <pre className="rounded border border-slate-200 bg-white p-2.5 overflow-x-auto font-mono text-[11px] text-slate-700">
                                                                    {log.old_value ? JSON.stringify(log.old_value, null, 2) : '—'}
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-600 mb-1">Nilai Sesudah (new_value)</div>
                                                                <pre className="rounded border border-slate-200 bg-white p-2.5 overflow-x-auto font-mono text-[11px] text-slate-700">
                                                                    {log.new_value ? JSON.stringify(log.new_value, null, 2) : '—'}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        {log.ip_address && (
                                                            <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                                                IP Address: {log.ip_address}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {logs?.links && logs.links.length > 3 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                            Halaman {logs.current_page} dari {logs.last_page}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {logs.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                                        link.active
                                            ? 'bg-slate-900 text-white'
                                            : link.url
                                            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuditorLayout>
    );
}

