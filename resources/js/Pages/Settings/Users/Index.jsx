import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import {
    Users,
    ShieldCheck,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Edit3,
    X,
} from 'lucide-react';

const ROLE_BADGE_STYLES = {
    owner: 'bg-amber-50 text-amber-800 border-amber-300',
    finance: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    sales: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    warehouse: 'bg-teal-50 text-teal-800 border-teal-300',
    procurement: 'bg-orange-50 text-orange-800 border-orange-300',
    cashier: 'bg-rose-50 text-rose-800 border-rose-300',
};

export default function SettingsUsersIndex({
    users = [],
    roles = [],
    filters = {},
    counts = {},
}) {
    const { auth } = usePage().props;
    const isOwner = auth?.user?.role_id === 'owner';

    const [search, setSearch] = useState(filters?.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const activeRole = filters?.role || 'all';

    const createForm = useForm({
        name: '',
        email: '',
        role_id: 'sales',
        password: 'password',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        role_id: 'sales',
        is_active: true,
    });

    const handleFilterRole = (role) => {
        router.get(
            route('settings.users.index'),
            { role, search },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('settings.users.index'),
            { role: activeRole, search },
            { preserveState: true }
        );
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            role_id: user.role_id,
            is_active: user.is_active,
        });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('settings.users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingUser) return;
        editForm.put(route('settings.users.update', editingUser.id), {
            preserveScroll: true,
            onSuccess: () => setEditingUser(null),
        });
    };

    return (
        <SettingsLayout
            title="Pengguna (Users)"
            breadcrumbs={[
                { label: 'Pengguna & Akses' },
                { label: 'Pengguna (Users)' },
            ]}
        >
            <Head title="Pengguna (Users) — Settings" />

            {/* Odoo Control Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div>
                    <h1 className="text-sm font-bold text-slate-800">
                        Daftar Pengguna Sistem (Users)
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Daftar akun pegawai beserta peran dan akses modul aplikasi pada PT Bara Ritel Nusantara
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, email, atau peran..."
                                className="rounded border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 w-56"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>

                    <Link
                        href={route('settings.roles.index')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                        Lihat Matriks Hak Akses
                    </Link>

                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Pengguna
                        </button>
                    )}
                </div>
            </div>

            {/* Top Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            Total Pengguna Terdaftar
                        </p>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                            {counts?.total_users || users.length} Akun
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Seluruh staf operasional &amp; manajemen
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <Users className="h-5 w-5" />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            Status Akun Aktif
                        </p>
                        <p className="text-xl font-bold text-emerald-700 mt-1">
                            {counts?.active_users || 0} Aktif
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Dapat login sesuai hak akses peran
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            Peran &amp; Hak Akses (Roles)
                        </p>
                        <p className="text-xl font-bold text-violet-700 mt-1">
                            {counts?.total_roles || 6} Peran
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Sales, Warehouse, Finance, Cashier, Procurement, Owner
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Pills Bar per Role */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold uppercase">
                    <Filter className="h-3 w-3" /> Peran:
                </span>
                <button
                    type="button"
                    onClick={() => handleFilterRole('all')}
                    className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                        activeRole === 'all'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    Semua Peran ({counts?.total_users || users.length})
                </button>
                {[
                    { id: 'sales', label: 'Sales' },
                    { id: 'warehouse', label: 'Warehouse' },
                    { id: 'finance', label: 'Finance' },
                    { id: 'cashier', label: 'Cashier' },
                    { id: 'procurement', label: 'Procurement' },
                    { id: 'owner', label: 'Owner' },
                ].map((r) => {
                    const roleInfo = roles.find((item) => item.id === r.id);
                    const count = roleInfo ? roleInfo.users_count : 0;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => handleFilterRole(r.id)}
                            className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                                activeRole === r.id
                                    ? 'bg-slate-900 text-white font-semibold'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {r.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Tabel Pengguna */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">Nama Pengguna</th>
                                <th className="px-4 py-2.5">Email Login</th>
                                <th className="px-4 py-2.5">Peran (Role)</th>
                                <th className="px-4 py-2.5">Modul Aplikasi yang Dapat Diakses</th>
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
                                users.map((u) => {
                                    const badgeStyle =
                                        ROLE_BADGE_STYLES[u.role_id] ||
                                        'bg-slate-100 text-slate-800 border-slate-300';
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase">
                                                        {u.name ? u.name.substring(0, 2) : 'US'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">
                                                            {u.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {u.role_tagline}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                                                {u.email}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-bold ${badgeStyle}`}
                                                >
                                                    {u.role_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(u.allowed_apps || []).map((app) => (
                                                        <span
                                                            key={app.key}
                                                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border ${
                                                                app.read_only
                                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {app.name}
                                                            {app.read_only && (
                                                                <span className="text-[10px] font-bold text-amber-700">
                                                                    (Read-Only)
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                                                        <XCircle className="h-3 w-3" />
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2">
                                                    <Link
                                                        href={route('settings.roles.index', {
                                                            role: u.role_id,
                                                        })}
                                                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                    >
                                                        Detail Hak Akses
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                    {isOwner && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(u)}
                                                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                                            title="Ubah Peran / Status"
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Pengguna (Khusus Owner) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                            <h3 className="text-sm font-bold text-slate-900">
                                Tambah Pengguna Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
                                    placeholder="Contoh: Rina Wulandari"
                                />
                                {createForm.errors.name && (
                                    <p className="mt-1 text-rose-600">{createForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Email Login
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
                                    placeholder="rina@barawear.com"
                                />
                                {createForm.errors.email && (
                                    <p className="mt-1 text-rose-600">{createForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Peran (Role)
                                </label>
                                <select
                                    value={createForm.data.role_id}
                                    onChange={(e) => createForm.setData('role_id', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold focus:border-slate-500 focus:outline-none"
                                >
                                    <option value="sales">Sales</option>
                                    <option value="warehouse">Warehouse</option>
                                    <option value="finance">Finance</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="procurement">Procurement</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Password Awal
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 font-mono text-xs focus:border-slate-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                                >
                                    Simpan Pengguna
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ubah Peran Pengguna (Khusus Owner) */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                            <h3 className="text-sm font-bold text-slate-900">
                                Ubah Pengguna &amp; Peran
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Peran (Role)
                                </label>
                                <select
                                    value={editForm.data.role_id}
                                    onChange={(e) => editForm.setData('role_id', e.target.value)}
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold focus:border-slate-500 focus:outline-none"
                                >
                                    <option value="sales">Sales</option>
                                    <option value="warehouse">Warehouse</option>
                                    <option value="finance">Finance</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="procurement">Procurement</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_active_edit"
                                    checked={editForm.data.is_active}
                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                />
                                <label htmlFor="is_active_edit" className="font-semibold text-slate-700">
                                    Akun Aktif (Diizinkan Login)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}

