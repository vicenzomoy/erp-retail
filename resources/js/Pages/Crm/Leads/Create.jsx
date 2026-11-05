import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Users,
    ArrowLeft,
    Save,
    Building2,
    Package,
    DollarSign,
    User,
    Sparkles,
} from 'lucide-react';
import CrmLayout from '@/Layouts/CrmLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function LeadCreate({ customers = [], products = [], users = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: customers[0]?.id || '',
        contact_name: '',
        type: 'lead',
        stage: 'new',
        variant_sku: products[0]?.variant_sku || '',
        qty_interest: 1,
        expected_revenue: products[0] ? products[0].sales_price : 0,
        assigned_user_id: users[0]?.id || '',
        notes: '',
    });

    const handleProductChange = (sku) => {
        const product = products.find((p) => p.variant_sku === sku);
        const price = product ? product.sales_price : 0;
        const total = price * (parseFloat(data.qty_interest) || 1);

        setData((prev) => ({
            ...prev,
            variant_sku: sku,
            expected_revenue: total,
        }));
    };

    const handleQtyChange = (qty) => {
        const numQty = parseFloat(qty) || 0;
        const product = products.find((p) => p.variant_sku === data.variant_sku);
        const price = product ? product.sales_price : 0;
        const total = price * numQty;

        setData((prev) => ({
            ...prev,
            qty_interest: numQty,
            expected_revenue: total,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('crm.leads.store'));
    };

    return (
        <CrmLayout
            title="Tambah Prospek CRM"
            breadcrumbs={[
                { label: 'Pipeline', href: route('crm.pipeline') },
                { label: 'Tambah Prospek' },
            ]}
        >
            <Head title="Tambah Prospek CRM Baru" />

            {/* ── Top Bar ── */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('crm.pipeline')}
                        className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Tambah Prospek CRM Baru</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Formulir pendaftaran Lead atau Opportunity baru ke dalam pipeline penjualan.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Form Card ── */}
            <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                    <div className="border-b border-slate-100 pb-3">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-sky-600" />
                            Informasi Prospek &amp; Pelanggan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer */}
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                                Pelanggan <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                            >
                                <option value="">-- Pilih Pelanggan --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.id})
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.customer_id}</p>
                            )}
                        </div>

                        {/* Contact Name */}
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                                Nama Kontak Person
                            </label>
                            <input
                                type="text"
                                value={data.contact_name}
                                onChange={(e) => setData('contact_name', e.target.value)}
                                placeholder="Contoh: Ibu Dewi / Bpk. Rudi"
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                            />
                            {errors.contact_name && (
                                <p className="text-rose-600 text-[11px] mt-1">{errors.contact_name}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                                Tipe Prospek
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                            >
                                <option value="lead">Lead (Prospek Awal)</option>
                                <option value="opportunity">Opportunity (Peluang Matang)</option>
                            </select>
                        </div>

                        {/* Initial Stage */}
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                                Tahap Awal (Stage)
                            </label>
                            <select
                                value={data.stage}
                                onChange={(e) => setData('stage', e.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                            >
                                <option value="new">Baru (New)</option>
                                <option value="qualified">Terkualifikasi (Qualified)</option>
                                <option value="proposition">Peluang / Proposal (Proposition)</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-3">
                            <Package className="h-4 w-4 text-sky-600" />
                            Peminatan Produk &amp; Potensi Nilai
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Product */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Produk SKU
                                </label>
                                <select
                                    value={data.variant_sku}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {products.map((p) => (
                                        <option key={p.variant_sku} value={p.variant_sku}>
                                            {p.variant_sku} - {p.variant_name} ({formatRp(p.sales_price)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Qty */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Jumlah Peminatan (Qty)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.qty_interest}
                                    onChange={(e) => handleQtyChange(e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Expected Revenue */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Estimasi Pendapatan / Expected Revenue (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.expected_revenue}
                                    onChange={(e) => setData('expected_revenue', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white font-mono font-bold"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Otomatis dihitung dari harga satuan produk × kuantitas (dapat disesuaikan).
                                </p>
                            </div>

                            {/* Assigned Sales */}
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">
                                    Sales Person Ditugaskan
                                </label>
                                <select
                                    value={data.assigned_user_id}
                                    onChange={(e) => setData('assigned_user_id', e.target.value)}
                                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:bg-white"
                                >
                                    <option value="">-- Belum Ditugaskan --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.role_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <Link
                            href={route('crm.pipeline')}
                            className="rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded bg-sky-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-600 transition disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            Simpan Prospek
                        </button>
                    </div>
                </form>
            </div>
        </CrmLayout>
    );
}

