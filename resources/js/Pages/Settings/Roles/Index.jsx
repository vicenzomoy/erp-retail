import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import {
    ShieldCheck,
    Users,
    Filter,
    CheckCircle2,
    XCircle,
    Eye,
    Lock,
    ShieldAlert,
} from 'lucide-react';

const ROLE_HEADER_STYLES = {
    sales: {
        badge: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        border: 'border-t-indigo-600',
    },
    warehouse: {
        badge: 'bg-teal-50 text-teal-800 border-teal-300',
        border: 'border-t-teal-600',
    },
    finance: {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        border: 'border-t-emerald-600',
    },
    cashier: {
        badge: 'bg-rose-50 text-rose-800 border-rose-300',
        border: 'border-t-rose-600',
    },
    procurement: {
        badge: 'bg-orange-50 text-orange-800 border-orange-300',
        border: 'border-t-orange-600',
    },
    owner: {
        badge: 'bg-amber-50 text-amber-800 border-amber-300',
        border: 'border-t-amber-600',
    },
};

export default function SettingsRolesIndex({
    roles = [],
    appCatalog = [],
    selectedRole = 'all',
    accessDeniedLogs = [],
}) {
    const handleSelectRole = (roleKey) => {
        router.get(
            route('settings.roles.index'),
            { role: roleKey },
            { preserveState: true }
        );
    };

    const visibleRoles =
        selectedRole === 'all'
            ? roles
            : roles.filter((r) => r.id === selectedRole);

    const roleOrder = [
        { id: 'sales', label: 'Sales' },
        { id: 'warehouse', label: 'Warehouse' },
        { id: 'finance', label: 'Finance' },
        { id: 'cashier', label: 'Cashier' },
        { id: 'procurement', label: 'Procurement' },
        { id: 'owner', label: 'Owner' },
    ];

    return (
        <SettingsLayout
            title="Hak Akses (Access Rights)"
            breadcrumbs={[
                { label: 'Pengguna & Akses', href: route('settings.users.index') },
                { label: 'Hak Akses (Access Rights)' },
            ]}
        >
            <Head title="Hak Akses Peran — Settings" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Hak Akses &amp; Wewenang Peran (Role-Based Access Control)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Rincian hak akses modul aplikasi dan batasan wewenang operasional untuk Sales, Warehouse, Finance, Cashier, Procurement, dan Owner
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('settings.users.index')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        Daftar Pengguna
                    </Link>
                </div>
            </div>

            {/* Filter Pills Bar (Pilih Peran) */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase">
                    <Filter className="h-3 w-3" /> Lihat Hak Akses:
                </span>
                <button
                    type="button"
                    onClick={() => handleSelectRole('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        selectedRole === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua Peran (6)
                </button>
                {roleOrder.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRole(r.id)}
                        className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                            selectedRole === r.id
                                ? 'bg-slate-900 text-white font-semibold'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Tabel Matriks Akses Modul Aplikasi Lintas 6 Peran */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-violet-600" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Matriks Akses Modul Aplikasi per Peran
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Akses Penuh
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-amber-600" /> Read-Only
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5 text-slate-300" /> Tidak Ada Akses
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Modul Aplikasi ERP</th>
                                {roleOrder.map((col) => (
                                    <th
                                        key={col.id}
                                        className={`px-3 py-2.5 text-center cursor-pointer hover:bg-slate-200/60 transition ${
                                            selectedRole === col.id ? 'bg-violet-50 text-violet-900' : ''
                                        }`}
                                        onClick={() => handleSelectRole(col.id)}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {appCatalog.map((app) => (
                                <tr key={app.key} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5">
                                        <div className="font-bold text-slate-900">{app.name}</div>
                                        <div className="text-[11px] text-slate-500">{app.desc}</div>
                                    </td>
                                    {roleOrder.map((col) => {
                                        const hasAccess = (app.roles || []).includes(col.id);
                                        const isReadOnly =
                                            ['procurement', 'sales'].includes(col.id) &&
                                            app.key === 'inventory';
                                        return (
                                            <td
                                                key={col.id}
                                                className={`px-3 py-2.5 text-center whitespace-nowrap ${
                                                    selectedRole === col.id ? 'bg-violet-50/30' : ''
                                                }`}
                                            >
                                                {isReadOnly ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                                        <Eye className="h-3 w-3 text-amber-600" />
                                                        Read-Only
                                                    </span>
                                                ) : hasAccess ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                        Akses
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center text-slate-300">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rincian Hak Akses & Wewenang Operasional untuk Setiap Peran */}
            <div className="space-y-5 mb-6">
                {visibleRoles.map((role) => {
                    const style = ROLE_HEADER_STYLES[role.id] || ROLE_HEADER_STYLES.sales;
                    return (
                        <div
                            key={role.id}
                            className={`rounded-lg border border-slate-200 border-t-4 ${style.border} bg-white p-5 shadow-xs`}
                        >
                            {/* Header Peran */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${style.badge}`}
                                        >
                                            {role.display_name}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-600">
                                            {role.tagline}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1.5 max-w-3xl">
                                        {role.summary}
                                    </p>
                                </div>

                                {/* Daftar Akun Pengguna pada Peran Ini */}
                                <div className="shrink-0">
                                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 sm:text-right">
                                        Pengguna Aktif ({role.users_count})
                                    </div>
                                    <div className="flex flex-wrap sm:justify-end gap-1.5">
                                        {(role.users || []).map((u) => (
                                            <span
                                                key={u.id}
                                                className="inline-flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800"
                                            >
                                                <Users className="h-3 w-3 text-slate-500" />
                                                {u.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tabel Hak Akses & Wewenang Operasional Peran */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <tr>
                                            <th className="px-4 py-2 w-44">Modul Terkait</th>
                                            <th className="px-4 py-2">Wewenang &amp; Aturan Operasional</th>
                                            <th className="px-4 py-2 w-40 text-center">Hak Akses</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(role.capabilities || []).map((cap, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                                                    {cap.module}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">
                                                    {cap.action}
                                                </td>
                                                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                                    {cap.allowed ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                            Diizinkan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                                                            <XCircle className="h-3 w-3 text-rose-600" />
                                                            Tidak Diizinkan
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabel Log Audit Percobaan Akses yang Ditolak (Security & RBAC Audit Log) */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Log Audit Percobaan Akses yang Ditolak (RBAC Security Audit)
                        </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        {accessDeniedLogs.length} Percobaan Tercatat
                    </span>
                </div>

                {accessDeniedLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                        Belum ada percobaan akses tidak sah yang tercatat pada Audit Log.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5">Waktu</th>
                                    <th className="px-4 py-2.5">Pengguna</th>
                                    <th className="px-4 py-2.5">Peran</th>
                                    <th className="px-4 py-2.5">Modul / Aksi Target</th>
                                    <th className="px-4 py-2.5">Keterangan Audit</th>
                                    <th className="px-4 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accessDeniedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-rose-50/20">
                                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                            {log.created_at}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                                            {log.actor_username}
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
                                                {log.actor_role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                                            {log.document_id}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                            {log.notes}
                                        </td>
                                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 uppercase">
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
}
