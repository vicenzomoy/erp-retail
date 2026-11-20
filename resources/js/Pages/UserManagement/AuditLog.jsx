import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserManagementLayout from '@/Layouts/UserManagementLayout';
import { History, Search, Lock } from 'lucide-react';
import { ACTION_LABELS } from '@/Components/UserManagement/constants';

const FIELD_LABELS = {
    name: 'Nama',
    email: 'Username/Email',
    role_id: 'Peran',
    is_active: 'Status',
    password: 'Password',
    modul: 'Modul',
};

const formatValue = (field, value) => {
    if (field === 'is_active') return value ? 'Aktif' : 'Nonaktif';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '(tidak ada)';
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
};

function ChangeDiff({ oldValue, newValue }) {
    const fields = Array.from(new Set([...Object.keys(oldValue || {}), ...Object.keys(newValue || {})]));
    if (fields.length === 0) return <span className="text-slate-400">—</span>;

    return (
        <div className="space-y-0.5">
            {fields.map((f) => (
                <div key={f} className="text-[11px]">
                    <span className="font-semibold text-slate-600">{FIELD_LABELS[f] || f}:</span>{' '}
                    {oldValue && f in oldValue && (
                        <>
                            <span className="text-rose-700 line-through">{formatValue(f, oldValue[f])}</span>
                            <span className="text-slate-400"> → </span>
                        </>
                    )}
                    <span className="text-emerald-700 font-semibold">{formatValue(f, newValue?.[f])}</span>
                </div>
            ))}
        </div>
    );
}

export default function UserManagementAuditLog({ logs, filters = {} }) {
    const [search, setSearch] = useState(filters?.search || '');
    const rows = logs?.data || [];

    return (
        <UserManagementLayout
            breadcrumbs={[
                { label: 'Daftar Pengguna', href: route('user-management.index') },
                { label: 'Riwayat Perubahan' },
            ]}
        >
            <Head title="Riwayat Perubahan — Manajemen User" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <History className="h-4 w-4 text-fuchsia-600" /> Riwayat Perubahan Pengguna
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Audit Trail bersifat append-only: catatan tidak dapat diubah atau dihapus,
                        termasuk oleh Super Admin.
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(route('user-management.audit-log'), { search }, { preserveState: true });
                    }}
                    className="relative"
                >
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari pelaku, pengguna, catatan..."
                        className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none w-64"
                    />
                </form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Waktu</th>
                                <th className="px-4 py-2.5">Aksi</th>
                                <th className="px-4 py-2.5">Pelaku</th>
                                <th className="px-4 py-2.5">Pengguna Target</th>
                                <th className="px-4 py-2.5">Perubahan</th>
                                <th className="px-4 py-2.5">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        Belum ada perubahan yang tercatat.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((log) => {
                                    const meta = ACTION_LABELS[log.action] || {
                                        label: log.action,
                                        style: 'bg-slate-100 text-slate-700 border-slate-200',
                                    };
                                    return (
                                        <tr key={log.id} className="align-top hover:bg-slate-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-mono text-slate-700">{log.created_at}</div>
                                                <div className="text-[11px] text-slate-400">{log.time_ago}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ${meta.style}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-semibold text-slate-800">{log.actor_username}</div>
                                                <div className="text-[11px] text-slate-400">{log.actor_role}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="font-semibold text-slate-800">{log.target_name || `User #${log.target_id}`}</div>
                                                <div className="font-mono text-[11px] text-slate-400">{log.target_email}</div>
                                            </td>
                                            <td className="px-4 py-3 min-w-[240px]">
                                                <ChangeDiff oldValue={log.old_value} newValue={log.new_value} />
                                                {log.notes && <p className="mt-1 text-[11px] text-slate-500">{log.notes}</p>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                                {log.ip_address || '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

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

            <div className="mt-3 text-[11px] text-slate-400">
                Seluruh catatan ini juga terlihat oleh peran Auditor di modul{' '}
                <span className="font-semibold text-slate-500">Audit Trail</span>.
            </div>
        </UserManagementLayout>
    );
}
