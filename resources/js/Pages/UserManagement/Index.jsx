import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import UserManagementLayout from '@/Layouts/UserManagementLayout';
import {
    Users,
    UserCheck,
    UserX,
    History,
    Search,
    Plus,
    Edit3,
    KeyRound,
    X,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    ArrowRight,
} from 'lucide-react';
import { ROLE_BADGE_STYLES, ACTION_LABELS } from '@/Components/UserManagement/constants';

const inputClass =
    'w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500';

function Field({ label, error, hint, children }) {
    return (
        <div>
            <label className="block font-semibold text-slate-700 mb-1">{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
            {error && <p className="mt-1 text-rose-600">{error}</p>}
        </div>
    );
}

function ModalShell({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function AuditNotice() {
    return (
        <div className="flex items-start gap-2 rounded border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-[11px] text-fuchsia-800">
            <History className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Perubahan ini akan dicatat di Audit Trail atas nama Anda dan tidak dapat dihapus.</span>
        </div>
    );
}

function RoleAccessPreview({ role }) {
    if (!role) return null;
    return (
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Modul yang dapat diakses peran ini:</p>
            <div className="flex flex-wrap gap-1">
                {role.apps.map((app) => (
                    <span key={app} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {app}
                    </span>
                ))}
            </div>
        </div>
    );
}

function FormFooter({ onCancel, processing, label }) {
    return (
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
                type="button"
                onClick={onCancel}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
                Batal
            </button>
            <button
                type="submit"
                disabled={processing}
                className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
                {processing ? 'Menyimpan...' : label}
            </button>
        </div>
    );
}

export default function UserManagementIndex({ users = [], roles = [], filters = {}, counts = {}, recentLogs = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [showCreate, setShowCreate] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [passwordUser, setPasswordUser] = useState(null);

    const activeRole = filters?.role || 'all';
    const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));

    const createForm = useForm({
        name: '',
        email: '',
        role_id: 'sales',
        password: '',
        password_confirmation: '',
        is_active: true,
    });

    const editForm = useForm({ name: '', email: '', role_id: '', is_active: true });
    const passwordForm = useForm({ password: '', password_confirmation: '' });

    const applyFilter = (params) =>
        router.get(route('user-management.index'), { role: activeRole, search, ...params }, { preserveState: true });

    const openEdit = (user) => {
        editForm.clearErrors();
        editForm.setData({ name: user.name, email: user.email, role_id: user.role_id, is_active: user.is_active });
        setEditingUser(user);
    };

    const openPassword = (user) => {
        passwordForm.reset();
        passwordForm.clearErrors();
        setPasswordUser(user);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('user-management.users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('user-management.users.update', editingUser.id), {
            preserveScroll: true,
            onSuccess: () => setEditingUser(null),
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('user-management.users.password', passwordUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPasswordUser(null);
                passwordForm.reset();
            },
        });
    };

    const kpis = [
        { label: 'Total Pengguna', value: `${counts.total ?? 0} Akun`, icon: Users, tone: 'bg-slate-100 text-slate-700' },
        { label: 'Akun Aktif', value: `${counts.active ?? 0} Aktif`, icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600' },
        { label: 'Akun Nonaktif', value: `${counts.inactive ?? 0} Nonaktif`, icon: UserX, tone: 'bg-rose-50 text-rose-600' },
        { label: 'Perubahan Tercatat', value: `${counts.changes ?? 0} Log`, icon: History, tone: 'bg-fuchsia-50 text-fuchsia-600' },
    ];

    return (
        <UserManagementLayout breadcrumbs={[{ label: 'Daftar Pengguna' }]}>
            <Head title="Manajemen User" />

            {/* Control Panel */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">Manajemen User</h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Ubah username, reset password, serta atur peran &amp; status akun seluruh pengguna
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({});
                        }}
                        className="flex items-center gap-2"
                    >
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none w-52"
                            />
                        </div>
                        <select
                            value={activeRole}
                            onChange={(e) => applyFilter({ role: e.target.value })}
                            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
                        >
                            <option value="all">Semua Peran</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.display_name} ({r.users_count})
                                </option>
                            ))}
                        </select>
                    </form>

                    <button
                        type="button"
                        onClick={() => {
                            createForm.clearErrors();
                            setShowCreate(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Pengguna
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {kpis.map((k) => {
                    const Icon = k.icon;
                    return (
                        <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{k.label}</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{k.value}</p>
                            </div>
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.tone}`}>
                                <Icon className="h-4.5 w-4.5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabel Pengguna */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden mb-5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Nama</th>
                                <th className="px-4 py-2.5">Username (Email Login)</th>
                                <th className="px-4 py-2.5">Peran / Hak Akses</th>
                                <th className="px-4 py-2.5">Modul</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        Tidak ada pengguna yang sesuai dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase">
                                                    {u.name ? u.name.substring(0, 2) : 'US'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {u.name}
                                                        {u.is_self && (
                                                            <span className="ml-1.5 rounded bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-700">
                                                                Anda
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">Diubah: {u.updated_at}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{u.email}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-bold ${
                                                    ROLE_BADGE_STYLES[u.role_id] || 'bg-slate-100 text-slate-800 border-slate-300'
                                                }`}
                                            >
                                                {u.role_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {u.apps.map((app) => (
                                                    <span key={app} className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                                        {app}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                                                    <XCircle className="h-3 w-3" /> Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(u)}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                                    title="Ubah username, peran & status"
                                                >
                                                    <Edit3 className="h-3 w-3" /> Ubah
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openPassword(u)}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                                    title="Reset password"
                                                >
                                                    <KeyRound className="h-3 w-3" /> Password
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Perubahan Terakhir */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                    <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-fuchsia-600" /> Perubahan Terakhir (Audit Trail)
                    </h2>
                    <Link
                        href={route('user-management.audit-log')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-700 hover:text-fuchsia-900"
                    >
                        Lihat semua <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                {recentLogs.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">Belum ada perubahan pengguna yang tercatat.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {recentLogs.map((log) => {
                            const meta = ACTION_LABELS[log.action] || { label: log.action, style: 'bg-slate-100 text-slate-700 border-slate-200' };
                            return (
                                <li key={log.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs">
                                    <span className={`inline-flex w-fit shrink-0 items-center rounded border px-2 py-0.5 text-[10px] font-bold ${meta.style}`}>
                                        {meta.label}
                                    </span>
                                    <span className="flex-1 text-slate-700">{log.notes}</span>
                                    <span className="shrink-0 text-[11px] text-slate-400" title={log.created_at}>
                                        {log.time_ago}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal: Tambah Pengguna */}
            {showCreate && (
                <ModalShell title="Tambah Pengguna Baru" onClose={() => setShowCreate(false)}>
                    <form onSubmit={submitCreate} className="space-y-3.5 text-xs">
                        <Field label="Nama Lengkap" error={createForm.errors.name}>
                            <input
                                type="text"
                                required
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Username (Email Login)" error={createForm.errors.email}>
                            <input
                                type="email"
                                required
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                className={`${inputClass} font-mono`}
                                placeholder="nama@barawear.com"
                            />
                        </Field>
                        <Field label="Peran (Hak Akses)" error={createForm.errors.role_id}>
                            <select
                                value={createForm.data.role_id}
                                onChange={(e) => createForm.setData('role_id', e.target.value)}
                                className={`${inputClass} font-semibold`}
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.display_name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <RoleAccessPreview role={roleById[createForm.data.role_id]} />
                        <Field label="Password" error={createForm.errors.password} hint="Minimal 8 karakter.">
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData('password', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Konfirmasi Password" error={createForm.errors.password_confirmation}>
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={createForm.data.password_confirmation}
                                onChange={(e) => createForm.setData('password_confirmation', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <label className="flex items-center gap-2 font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={createForm.data.is_active}
                                onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                            />
                            Akun Aktif (Diizinkan Login)
                        </label>
                        <AuditNotice />
                        <FormFooter onCancel={() => setShowCreate(false)} processing={createForm.processing} label="Simpan Pengguna" />
                    </form>
                </ModalShell>
            )}

            {/* Modal: Ubah Pengguna */}
            {editingUser && (
                <ModalShell title={`Ubah Pengguna — ${editingUser.name}`} onClose={() => setEditingUser(null)}>
                    <form onSubmit={submitEdit} className="space-y-3.5 text-xs">
                        <Field label="Nama Lengkap" error={editForm.errors.name}>
                            <input
                                type="text"
                                required
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Username (Email Login)" error={editForm.errors.email}>
                            <input
                                type="email"
                                required
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData('email', e.target.value)}
                                className={`${inputClass} font-mono`}
                            />
                        </Field>
                        <Field
                            label="Peran (Hak Akses)"
                            error={editForm.errors.role_id}
                            hint={editingUser.is_self ? 'Peran akun Anda sendiri tidak dapat diubah.' : null}
                        >
                            <select
                                value={editForm.data.role_id}
                                disabled={editingUser.is_self}
                                onChange={(e) => editForm.setData('role_id', e.target.value)}
                                className={`${inputClass} font-semibold`}
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.display_name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <RoleAccessPreview role={roleById[editForm.data.role_id]} />
                        <div>
                            <label className="flex items-center gap-2 font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={editForm.data.is_active}
                                    disabled={editingUser.is_self}
                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                />
                                Akun Aktif (Diizinkan Login)
                            </label>
                            {editForm.errors.is_active && <p className="mt-1 text-rose-600">{editForm.errors.is_active}</p>}
                            {!editForm.data.is_active && !editingUser.is_self && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    Pengguna akan langsung dikeluarkan dari seluruh sesi login.
                                </p>
                            )}
                        </div>
                        <AuditNotice />
                        <FormFooter onCancel={() => setEditingUser(null)} processing={editForm.processing} label="Simpan Perubahan" />
                    </form>
                </ModalShell>
            )}

            {/* Modal: Reset Password */}
            {passwordUser && (
                <ModalShell title={`Reset Password — ${passwordUser.name}`} onClose={() => setPasswordUser(null)}>
                    <form onSubmit={submitPassword} className="space-y-3.5 text-xs">
                        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-mono text-slate-700">{passwordUser.email}</span>
                        </div>
                        <Field label="Password Baru" error={passwordForm.errors.password} hint="Minimal 8 karakter.">
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Konfirmasi Password Baru" error={passwordForm.errors.password_confirmation}>
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <p className="text-[11px] text-slate-500">
                            {passwordUser.is_self
                                ? 'Sesi login Anda di perangkat lain akan diputus.'
                                : 'Seluruh sesi login pengguna ini akan diputus dan harus login ulang dengan password baru.'}
                        </p>
                        <AuditNotice />
                        <FormFooter onCancel={() => setPasswordUser(null)} processing={passwordForm.processing} label="Reset Password" />
                    </form>
                </ModalShell>
            )}
        </UserManagementLayout>
    );
}
