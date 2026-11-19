import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import {
    Banknote,
    AlertTriangle,
    CheckCircle2,
    History,
    Search,
    User,
    Clock,
    Store,
    X,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

const emptyModal = { open: false, session: null, notes: '' };

export default function PosCashShortagesIndex({ outstanding = [], history = [], canSettle = false }) {
    const [activeTab, setActiveTab] = useState('outstanding');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(emptyModal);
    const [processing, setProcessing] = useState(false);

    const q = search.toLowerCase();
    const matches = (s) => s.id.toLowerCase().includes(q) || (s.cashier_name || '').toLowerCase().includes(q);
    const filteredOutstanding = outstanding.filter(matches);
    const filteredHistory = history.filter(matches);
    const totalOutstanding = outstanding.reduce((sum, s) => sum + s.shortage, 0);

    const handleSettle = () => {
        if (!modal.session) return;
        setProcessing(true);
        router.post(
            route('accounting.pos-cash-shortages.settle', modal.session.id),
            { notes: modal.notes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setModal(emptyModal);
                },
            }
        );
    };

    return (
        <AccountingLayout
            title="Selisih Kas POS"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Selisih Kas POS' },
            ]}
        >
            <Head title="Selisih Kas POS — Bara Wear" />

            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Selisih Kurang Kas POS</h1>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                            Sesi kasir yang ditutup dengan kas fisik lebih sedikit dari kas seharusnya (kas awal + penjualan
                            tunai). Kekurangan dicatat sebagai piutang kasir (akun 1150). Setelah kasir mengganti uangnya,
                            tandai di sini agar kas dijurnal kembali.
                        </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari sesi atau kasir..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`rounded-lg border p-4 shadow-xs ${outstanding.length > 0 ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white'}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Belum Diganti</p>
                        <p className="text-2xl font-black text-rose-700 mt-1">{outstanding.length} sesi</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Kekurangan Kas</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{formatRp(totalOutstanding)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sudah Diganti (terakhir)</p>
                        <p className="text-xs text-slate-700 mt-2">
                            {history.length > 0
                                ? `${history[0].id} • ${formatRp(history[0].shortage)} • ${history[0].settled_at}`
                                : 'Belum ada penggantian.'}
                        </p>
                    </div>
                </div>

                {!canSettle && (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Mode baca saja: hanya Finance dan Owner yang dapat menandai kekurangan kas sudah diganti.
                    </div>
                )}

                <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
                    {[
                        { key: 'outstanding', label: 'Belum Diganti', icon: AlertTriangle, count: outstanding.length, red: true },
                        { key: 'history', label: 'Sudah Diganti', icon: History, count: history.length },
                    ].map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition cursor-pointer ${
                                activeTab === t.key
                                    ? 'border-slate-900 text-slate-900 font-bold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <t.icon className="h-4 w-4" />
                            <span>{t.label}</span>
                            <span className={`px-1.5 rounded-full text-[10px] font-bold ${t.red && t.count > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Sesi</th>
                                    <th className="px-4 py-3">Kasir</th>
                                    <th className="px-4 py-3">Ditutup</th>
                                    <th className="px-4 py-3 text-right">Kas Seharusnya</th>
                                    <th className="px-4 py-3 text-right">Kas Fisik</th>
                                    <th className="px-4 py-3 text-right">Kekurangan</th>
                                    {activeTab === 'outstanding' ? (
                                        <th className="px-4 py-3 text-center">Aksi</th>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3">Ditandai Oleh</th>
                                            <th className="px-4 py-3">Catatan</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(activeTab === 'outstanding' ? filteredOutstanding : filteredHistory).length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                            {activeTab === 'outstanding' ? (
                                                <span className="inline-flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                                    Tidak ada kekurangan kas yang belum diganti.
                                                </span>
                                            ) : (
                                                'Belum ada riwayat penggantian.'
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'outstanding' ? filteredOutstanding : filteredHistory).map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-slate-900">{s.id}</span>
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Store className="h-3 w-3" /> {s.location_code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 font-semibold text-slate-800">
                                                    <User className="h-3 w-3 text-slate-400" /> {s.cashier_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {s.closed_at}
                                                {activeTab === 'outstanding' && s.waiting_for && (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-600">
                                                        <Clock className="h-3 w-3" /> {s.waiting_for}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-700">{formatRp(s.expected_cash)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-700">{formatRp(s.counted_cash)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-black text-rose-700">{formatRp(s.shortage)}</td>
                                            {activeTab === 'outstanding' ? (
                                                <td className="px-4 py-3 text-center">
                                                    {canSettle ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setModal({ open: true, session: s, notes: '' })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer whitespace-nowrap"
                                                        >
                                                            <Banknote className="h-3.5 w-3.5" />
                                                            Tandai Sudah Diganti
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">—</span>
                                                    )}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-slate-700">
                                                        <span className="font-semibold">{s.settled_by || '-'}</span>
                                                        <span className="block text-[10px] text-slate-400">{s.settled_at}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 max-w-[240px]">{s.notes || '-'}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modal.open && modal.session && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-emerald-600" />
                                Kekurangan kas sudah diganti?
                            </h3>
                            <button type="button" onClick={() => setModal(emptyModal)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-700">
                            <p>
                                Kasir <strong>{modal.session.cashier_name}</strong> telah mengganti kekurangan kas sesi{' '}
                                <span className="font-mono font-bold">{modal.session.id}</span> sebesar{' '}
                                <strong className="text-rose-700">{formatRp(modal.session.shortage)}</strong>.
                            </p>
                            <div className="rounded bg-slate-50 border border-slate-200 p-2.5 font-mono text-[11px] text-slate-600">
                                Dr 1010 Kas {formatRp(modal.session.shortage)}
                                <br />
                                &nbsp;&nbsp;Cr 1150 Piutang Karyawan {formatRp(modal.session.shortage)}
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan (Opsional):</label>
                                <textarea
                                    rows={2}
                                    value={modal.notes}
                                    onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                                    placeholder="Contoh: Diganti tunai oleh kasir, diterima 20/11."
                                    className="w-full rounded border-slate-300 text-xs focus:ring-slate-500 focus:border-slate-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setModal(emptyModal)}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleSettle}
                                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {processing ? 'Memproses...' : 'Ya, Sudah Diganti'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AccountingLayout>
    );
}
