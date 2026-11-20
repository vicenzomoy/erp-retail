import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Users,
    Search,
    ArrowRight,
    ShieldAlert,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    X,
    AlertTriangle,
} from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';
import CrmLayout from '@/Layouts/CrmLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const CUSTOMER_TYPES = ['B2B', 'Umum', 'Reseller'];

export default function SalesCustomerIndex({
    customers = [],
    deletedCustomers = [],
    paymentTerms = [],
    nextId = 'C001',
    inCrm = false,
}) {
    const { auth } = usePage().props;
    const isOwner = Boolean(auth?.user?.is_owner_level);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCrm = inCrm || route().current('crm.*');
    const LayoutComponent = isCrm ? CrmLayout : SalesLayout;
    const showRouteName = isCrm ? 'crm.customers.show' : 'sales.customers.show';
    const storeRouteName = isCrm ? 'crm.customers.store' : 'sales.customers.store';
    const updateRouteName = isCrm ? 'crm.customers.update' : 'sales.customers.update';
    const destroyRouteName = isCrm ? 'crm.customers.destroy' : 'sales.customers.destroy';
    const restoreRouteName = isCrm ? 'crm.customers.restore' : 'sales.customers.restore';

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'Umum',
        city: '',
        address: '',
        credit_limit: 0,
        payment_terms: paymentTerms[0]?.term_id ?? 'CASH',
        from_index: true,
    });

    const openCreateModal = () => {
        clearErrors();
        setEditingCustomer(null);
        setData({
            name: '',
            type: 'Umum',
            city: '',
            address: '',
            credit_limit: 0,
            payment_terms: paymentTerms[0]?.term_id ?? 'CASH',
            from_index: true,
        });
        setModalOpen(true);
    };

    const openEditModal = (cust) => {
        clearErrors();
        setEditingCustomer(cust);
        setData({
            name: cust.name ?? '',
            type: cust.type ?? 'Umum',
            city: cust.city ?? '',
            address: cust.address ?? '',
            credit_limit: parseInt(cust.credit_limit, 10) || 0,
            payment_terms: cust.payment_terms ?? (paymentTerms[0]?.term_id ?? 'CASH'),
            from_index: true,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCustomer) {
            put(route(updateRouteName, editingCustomer.id), {
                onSuccess: () => {
                    setModalOpen(false);
                    setEditingCustomer(null);
                    reset();
                },
            });
        } else {
            post(route(storeRouteName), {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget || isDeleting) return;
        setIsDeleting(true);
        router.delete(route(destroyRouteName, deleteTarget.id), {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleRestore = (custId) => {
        router.post(route(restoreRouteName, custId));
    };

    const filteredCustomers = customers.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.id?.toLowerCase().includes(q) ||
            c.name?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q) ||
            c.type?.toLowerCase().includes(q)
        );
    });

    const getUtilizationColor = (pct) => {
        const val = parseFloat(pct) || 0;
        if (val >= 90) return { bar: 'bg-rose-500', text: 'text-rose-700 bg-rose-50 border-rose-200' };
        if (val >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    };

    return (
        <LayoutComponent
            title="Daftar Pelanggan"
            breadcrumbs={[{ label: 'Pelanggan' }, { label: 'Daftar Pelanggan' }]}
        >
            <Head title={`Daftar Pelanggan — ${isCrm ? 'CRM' : 'Sales'} Bara Wear`} />

            {/* Header section */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Daftar Pelanggan & Limit Kredit
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Monitoring saldo piutang (AR), limit kredit, dan termin pembayaran pelanggan.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari ID, nama, atau kota..."
                            className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Pelanggan
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-4 py-2.5">ID</th>
                                <th className="px-4 py-2.5">Nama Pelanggan</th>
                                <th className="px-4 py-2.5">Tipe</th>
                                <th className="px-4 py-2.5">Kota</th>
                                <th className="px-4 py-2.5">Termin</th>
                                <th className="px-4 py-2.5 text-right">Limit Kredit</th>
                                <th className="px-4 py-2.5 text-right">Piutang (AR)</th>
                                <th className="px-4 py-2.5 text-center">Utilisasi Kredit</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                                        Tidak ada data pelanggan yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((cust) => {
                                    const utilStyle = getUtilizationColor(cust.credit_utilization);
                                    const utilVal = Math.min(100, Math.max(0, parseFloat(cust.credit_utilization) || 0));

                                    return (
                                        <tr key={cust.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                {cust.id}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                                <Link
                                                    href={route(showRouteName, cust.id)}
                                                    className="hover:text-blue-600 hover:underline"
                                                >
                                                    {cust.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold border ${
                                                    cust.type === 'B2B'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {cust.type || 'Umum'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {cust.city || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                                                {cust.payment_terms || 'CASH'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap tabular-nums">
                                                {formatRp(cust.credit_limit)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                                                {formatRp(cust.open_ar)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="inline-flex flex-col items-center gap-1 w-32">
                                                    <div className="flex w-full items-center justify-between text-[10px] text-slate-500">
                                                        <span>{cust.credit_utilization}%</span>
                                                        {parseFloat(cust.credit_utilization) >= 90 && (
                                                            <ShieldAlert className="h-3 w-3 text-rose-500" />
                                                        )}
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                                        <div
                                                            className={`h-full ${utilStyle.bar}`}
                                                            style={{ width: `${utilVal}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(cust)}
                                                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                        title="Edit Pelanggan"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(cust)}
                                                        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                                                        title="Hapus Pelanggan (Soft Delete)"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                    <Link
                                                        href={route(showRouteName, cust.id)}
                                                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                                                    >
                                                        Detail
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
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

            {/* Arsip Pelanggan Terhapus (Khusus Admin / Owner untuk Restore) */}
            {isOwner && deletedCustomers.length > 0 && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                Arsip Pelanggan Terhapus (Soft Delete)
                            </h2>
                            <p className="text-[11px] text-amber-700">
                                Hanya Admin/Owner yang dapat memulihkan data pelanggan yang telah dihapus.
                            </p>
                        </div>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            {deletedCustomers.length} Terhapus
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-2">ID</th>
                                    <th className="px-4 py-2">Nama Pelanggan</th>
                                    <th className="px-4 py-2">Tipe</th>
                                    <th className="px-4 py-2">Kota</th>
                                    <th className="px-4 py-2">Dihapus Pada</th>
                                    <th className="px-4 py-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deletedCustomers.map((dc) => (
                                    <tr key={dc.id} className="bg-slate-50/40">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-500">{dc.id}</td>
                                        <td className="px-4 py-2.5 font-semibold text-slate-700">{dc.name}</td>
                                        <td className="px-4 py-2.5">{dc.type}</td>
                                        <td className="px-4 py-2.5">{dc.city}</td>
                                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{dc.deleted_at}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRestore(dc.id)}
                                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                Pulihkan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Tambah / Edit Pelanggan */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">
                                {editingCustomer ? `Edit Pelanggan (${editingCustomer.id})` : 'Tambah Pelanggan Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pelanggan (Otomatis)</label>
                                <input
                                    type="text"
                                    value={editingCustomer ? editingCustomer.id : nextId}
                                    readOnly
                                    disabled
                                    className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: PT Busana Jaya / Andi Pratama"
                                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                />
                                {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe *</label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                    >
                                        {CUSTOMER_TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    {errors.type && <p className="mt-1 text-[11px] text-rose-600">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kota *</label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="Pekanbaru"
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                    />
                                    {errors.city && <p className="mt-1 text-[11px] text-rose-600">{errors.city}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                                <textarea
                                    rows={2}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Jl. Riau No. 45, Kel. Padang Terubuk, Kec. Senapelan"
                                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                />
                                <p className="mt-0.5 text-[10px] text-slate-400">Dipakai sebagai alamat pengiriman di Surat Jalan.</p>
                                {errors.address && <p className="mt-1 text-[11px] text-rose-600">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Termin Pembayaran *</label>
                                    <select
                                        value={data.payment_terms}
                                        onChange={(e) => setData('payment_terms', e.target.value)}
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                                    >
                                        {paymentTerms.map((pt) => (
                                            <option key={pt.term_id} value={pt.term_id}>
                                                {pt.term_id} — {pt.description}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.payment_terms && <p className="mt-1 text-[11px] text-rose-600">{errors.payment_terms}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Limit Kredit (Rp) *</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={data.credit_limit ? new Intl.NumberFormat('id-ID').format(data.credit_limit) : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setData('credit_limit', raw ? parseInt(raw, 10) : 0);
                                        }}
                                        placeholder="0"
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-right font-semibold text-slate-900 tabular-nums focus:border-slate-500 focus:outline-none"
                                    />
                                    {errors.credit_limit && <p className="mt-1 text-[11px] text-rose-600">{errors.credit_limit}</p>}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : editingCustomer ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Soft Delete */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="rounded-full bg-rose-100 p-2 text-rose-600 shrink-0">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Hapus Pelanggan?</h3>
                                <p className="text-xs text-slate-600 mt-1">
                                    Yakin ingin menghapus pelanggan <strong>{deleteTarget.name}</strong>?
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="rounded bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </LayoutComponent>
    );
}
