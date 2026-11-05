import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PurchaseLayout from '@/Layouts/PurchaseLayout';
import {
    ArrowLeft,
    Save,
    Users,
    Building2,
    MapPin,
    CreditCard,
    AlertCircle,
} from 'lucide-react';

export default function Create({ nextId, paymentTerms = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        id: nextId,
        name: '',
        city: '',
        payment_terms: paymentTerms[0]?.term_id || 'NET30',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('purchase.vendors.store'));
    };

    return (
        <PurchaseLayout
            title="Tambah Vendor Baru"
            breadcrumbs={[
                { label: 'Purchase', href: route('purchase.overview') },
                { label: 'Pemasok (Vendors)', href: route('purchase.vendors.index') },
                { label: 'Baru' },
            ]}
        >
            <Head title="Tambah Vendor Baru — Bara Wear" />

            <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('purchase.vendors.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="h-5 w-5 text-amber-600" />
                            Tambah Pemasok (Vendor) Baru
                        </h1>
                        <span className="text-xs text-slate-500 font-mono">
                            Kode Vendor: {data.id}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={processing}
                    className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    Simpan Vendor
                </button>
            </div>

            {/* Form Sheet Card */}
            <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Kode Vendor <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.id}
                            onChange={(e) => setData('id', e.target.value)}
                            required
                            className="w-full rounded border border-slate-300 bg-slate-50 font-mono font-bold text-slate-900 py-2 px-3 focus:border-amber-500 focus:bg-white focus:outline-none"
                            placeholder="V05"
                        />
                        {errors.id && <p className="text-rose-600 text-[11px] mt-1">{errors.id}</p>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Nama Perusahaan / Pemasok <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            className="w-full rounded border border-slate-300 py-2 px-3 text-slate-900 focus:border-amber-500 focus:outline-none font-medium"
                            placeholder="Contoh: PT Tekstil Jaya Abadi"
                        />
                        {errors.name && <p className="text-rose-600 text-[11px] mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Kota Domisili / Pabrik <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            required
                            className="w-full rounded border border-slate-300 py-2 px-3 text-slate-900 focus:border-amber-500 focus:outline-none"
                            placeholder="Contoh: Bandung / Solo / Jakarta"
                        />
                        {errors.city && <p className="text-rose-600 text-[11px] mt-1">{errors.city}</p>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Termin Pembayaran Standar <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={data.payment_terms}
                            onChange={(e) => setData('payment_terms', e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white py-2 px-3 text-slate-900 focus:border-amber-500 focus:outline-none"
                        >
                            {paymentTerms.map((pt) => (
                                <option key={pt.term_id} value={pt.term_id}>
                                    {pt.term_id} — {pt.description}
                                </option>
                            ))}
                        </select>
                        {errors.payment_terms && (
                            <p className="text-rose-600 text-[11px] mt-1">{errors.payment_terms}</p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <Link
                            href={route('purchase.vendors.index')}
                            className="rounded border border-slate-300 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Pemasok'}
                        </button>
                    </div>
                </form>
            </div>
        </PurchaseLayout>
    );
}

