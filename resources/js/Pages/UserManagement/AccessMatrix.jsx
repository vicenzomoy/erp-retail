import React, { useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import UserManagementLayout from '@/Layouts/UserManagementLayout';
import { ShieldCheck, Lock, RotateCcw, Save, History, Info } from 'lucide-react';
import { ROLE_BADGE_STYLES } from '@/Components/UserManagement/constants';

// Ubah { role: { app: bool } } menjadi { role: [app, ...] } untuk dikirim ke server
const toPayload = (matrix) =>
    Object.fromEntries(
        Object.entries(matrix).map(([roleId, apps]) => [
            roleId,
            Object.entries(apps)
                .filter(([, allowed]) => allowed)
                .map(([key]) => key),
        ])
    );

export default function UserManagementAccessMatrix({ roles = [], apps = [], matrix = {}, defaults = {}, locked = {} }) {
    const form = useForm({ matrix: toPayload(matrix) });

    const has = (roleId, appKey) => (form.data.matrix[roleId] || []).includes(appKey);

    const toggle = (roleId, appKey) => {
        if (locked[roleId]?.[appKey]) return;
        const current = form.data.matrix[roleId] || [];
        const next = current.includes(appKey) ? current.filter((k) => k !== appKey) : [...current, appKey];
        form.setData('matrix', { ...form.data.matrix, [roleId]: next });
    };

    const resetRole = (roleId) =>
        form.setData('matrix', { ...form.data.matrix, [roleId]: toPayload({ [roleId]: defaults[roleId] })[roleId] });

    const resetAll = () => form.setData('matrix', toPayload(defaults));

    // Sel yang berbeda dari yang tersimpan (belum disimpan)
    const dirtyCount = useMemo(() => {
        let n = 0;
        roles.forEach((r) =>
            apps.forEach((a) => {
                if (Boolean(matrix[r.id]?.[a.key]) !== has(r.id, a.key)) n += 1;
            })
        );
        return n;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.matrix, matrix, roles, apps]);

    const submit = (e) => {
        e.preventDefault();
        form.put(route('user-management.access.update'), { preserveScroll: true });
    };

    return (
        <UserManagementLayout breadcrumbs={[{ label: 'Hak Akses Modul' }]}>
            <Head title="Hak Akses Modul — Manajemen User" />

            <form onSubmit={submit}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                    <div>
                        <h1 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-fuchsia-600" /> Hak Akses Modul per Peran
                        </h1>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Centang modul yang boleh dibuka setiap peran. Berlaku untuk seluruh pengguna dengan peran tersebut
                            pada request berikutnya.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {dirtyCount > 0 && (
                            <span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800">
                                {dirtyCount} perubahan belum disimpan
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={resetAll}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Kembalikan Semua ke Bawaan
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || dirtyCount === 0}
                            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-3.5 w-3.5" /> {form.processing ? 'Menyimpan...' : 'Simpan Hak Akses'}
                        </button>
                    </div>
                </div>

                {form.errors.matrix && (
                    <div className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{form.errors.matrix}</div>
                )}

                <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-slate-700">
                            <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                    <th className="px-4 py-2.5 text-left sticky left-0 bg-slate-100 z-10 min-w-[180px]">Peran</th>
                                    {apps.map((a) => (
                                        <th key={a.key} className="px-2 py-2.5 text-center whitespace-nowrap" title={a.desc}>
                                            {a.name}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-2.5 sticky left-0 bg-white z-10 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${
                                                    ROLE_BADGE_STYLES[r.id] || 'bg-slate-100 text-slate-800 border-slate-300'
                                                }`}
                                            >
                                                {r.display_name}
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{r.users_count} pengguna</div>
                                        </td>
                                        {apps.map((a) => {
                                            const isLocked = locked[r.id]?.[a.key];
                                            const checked = has(r.id, a.key);
                                            const changed = Boolean(matrix[r.id]?.[a.key]) !== checked;
                                            return (
                                                <td key={a.key} className={`px-2 py-2.5 text-center ${changed ? 'bg-amber-50' : ''}`}>
                                                    {isLocked ? (
                                                        <span
                                                            className="inline-flex items-center justify-center"
                                                            title="Dikunci sistem (tidak dapat diubah)"
                                                        >
                                                            <input type="checkbox" checked={checked} disabled className="rounded border-slate-300 opacity-50" />
                                                            <Lock className="h-3 w-3 text-slate-400 ml-0.5" />
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggle(r.id, a.key)}
                                                            aria-label={`${r.display_name} — ${a.name}`}
                                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                            {r.id !== 'superadmin' && (
                                                <button
                                                    type="button"
                                                    onClick={() => resetRole(r.id)}
                                                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                                                    title="Kembalikan baris ini ke bawaan"
                                                >
                                                    Bawaan
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>

            <div className="mt-4 grid gap-3 md:grid-cols-2 text-[11px] text-slate-600">
                <div className="rounded border border-slate-200 bg-white p-3 flex gap-2">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p>
                            <span className="font-semibold">Dikunci:</span> modul Manajemen User selalu khusus Super Admin,
                            peran Super Admin selalu memiliki seluruh modul bawaannya, dan peran Auditor selalu memiliki
                            modul Audit Trail.
                        </p>
                        <p>
                            Mengatur di sini hanya membuka/menutup <span className="font-semibold">modul</span>. Aturan di dalam
                            modul tetap berlaku, mis. Inventory hanya-baca untuk Sales &amp; Procurement, dan persetujuan
                            diskon/PO hanya untuk peran yang berwenang.
                        </p>
                    </div>
                </div>
                <div className="rounded border border-fuchsia-200 bg-fuchsia-50 p-3 flex gap-2 text-fuchsia-800">
                    <History className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p>
                        Setiap peran yang berubah dicatat di Audit Trail atas nama Anda (modul yang ditambah &amp; dicabut),
                        dan terlihat di menu Riwayat Perubahan.
                    </p>
                </div>
            </div>
        </UserManagementLayout>
    );
}
