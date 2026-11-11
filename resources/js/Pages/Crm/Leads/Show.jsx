import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    FileText,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Package,
    Clock,
    DollarSign,
    Save,
    ExternalLink,
    Plus,
    Trash2,
    AlertCircle,
    Info,
    Edit3,
} from 'lucide-react';
import CrmLayout from '@/Layouts/CrmLayout';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const CRM_STAGES = [
    { key: 'new', label: 'Baru' },
    { key: 'qualified', label: 'Terkualifikasi' },
    { key: 'won', label: 'Menang' },
];

function createEmptyItem() {
    return {
        _id: 'item-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
        variant_sku: '',
        qty_interest: 1,
        unit_price: 0,
    };
}

export default function LeadShow({ lead, customers = [], products = [], users = [], auditLogs = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');

    const initialItems = () => {
        if (lead.interest_items && Array.isArray(lead.interest_items) && lead.interest_items.length > 0) {
            return lead.interest_items.map((item, idx) => ({
                _id: 'item-' + idx + '-' + Date.now(),
                variant_sku: item.variant_sku || '',
                qty_interest: parseInt(item.qty_interest, 10) || 1,
                unit_price: parseFloat(item.unit_price) || 0,
            }));
        }
        if (lead.variant_sku) {
            return [
                {
                    _id: 'item-0-' + Date.now(),
                    variant_sku: lead.variant_sku,
                    qty_interest: parseInt(lead.qty_interest, 10) || 1,
                    unit_price: parseFloat(lead.product_price) || 0,
                },
            ];
        }
        return [createEmptyItem()];
    };

    const { data, setData, put, processing, errors, reset } = useForm({
        customer_id: lead.customer_id,
        contact_name: lead.contact_name || '',
        assigned_user_id: lead.assigned_user_id || '',
        notes: lead.notes || '',
        items: initialItems(),
    });

    const selectedSkus = data.items.map((it) => it.variant_sku).filter(Boolean);

    const handleAddItem = () => {
        setDuplicateError('');
        setData('items', [...data.items, createEmptyItem()]);
    };

    const handleRemoveItem = (id) => {
        setDuplicateError('');
        if (data.items.length <= 1) {
            setData('items', [createEmptyItem()]);
            return;
        }
        setData('items', data.items.filter((it) => it._id !== id));
    };

    const handleProductSelect = (id, sku) => {
        if (!sku) {
            setData(
                'items',
                data.items.map((it) => (it._id === id ? { ...it, variant_sku: '', unit_price: 0 } : it))
            );
            return;
        }

        // Cek duplikasi produk
        const isDuplicate = data.items.some((it) => it._id !== id && it.variant_sku === sku);
        if (isDuplicate) {
            setDuplicateError('Produk ini sudah dipilih pada baris lain. Untuk menambah jumlah, silakan sesuaikan kuantitas pada baris produk yang sama.');
            return;
        }

        setDuplicateError('');
        const product = products.find((p) => p.variant_sku === sku);
        const price = product ? parseFloat(product.sales_price) || 0 : 0;

        setData(
            'items',
            data.items.map((it) => {
                if (it._id !== id) return it;
                return {
                    ...it,
                    variant_sku: sku,
                    unit_price: price,
                };
            })
        );
    };

    const handleQtyChange = (id, rawValue) => {
        let val = parseInt(rawValue, 10);
        if (isNaN(val) || val < 1) {
            val = 1;
        }

        setData(
            'items',
            data.items.map((it) => {
                if (it._id !== id) return it;
                return {
                    ...it,
                    qty_interest: val,
                };
            })
        );
    };

    const totalEditQty = data.items.reduce((acc, it) => acc + (parseInt(it.qty_interest, 10) || 0), 0);
    const totalEditRevenue = data.items.reduce((acc, it) => {
        const qty = parseInt(it.qty_interest, 10) || 0;
        const price = parseFloat(it.unit_price) || 0;
        return acc + qty * price;
    }, 0);

    const handleSave = (e) => {
        e.preventDefault();

        const filledSkus = data.items.map((it) => it.variant_sku).filter(Boolean);
        const uniqueSkus = new Set(filledSkus);
        if (uniqueSkus.size !== filledSkus.length) {
            setDuplicateError('Terdapat produk yang dipilih lebih dari satu kali. Silakan gabungkan jumlah unit pada satu baris.');
            return;
        }

        put(route('crm.leads.update', lead.id), {
            onSuccess: () => {
                setIsEditing(false);
                setDuplicateError('');
            },
        });
    };

    const firstQuotationId = lead.quotations?.[0]?.id;
    const hasQuotations = (lead.quotations?.length ?? 0) > 0;

    // Items peminatan untuk mode tampilan
    const displayItems = lead.interest_items && lead.interest_items.length > 0
        ? lead.interest_items
        : [
              {
                  variant_sku: lead.variant_sku,
                  product_name: lead.product_name,
                  qty_interest: lead.qty_interest || 1,
                  unit_price: lead.product_price || 0,
              },
          ];

    const displayTotalQty = displayItems.reduce((acc, it) => acc + (parseInt(it.qty_interest, 10) || 0), 0);

    return (
        <CrmLayout
            title={`Prospek ${lead.id}`}
            breadcrumbs={[
                { label: 'Pipeline CRM', href: route('crm.pipeline') },
                { label: lead.id },
            ]}
        >
            <Head title={`${lead.id} — ${lead.customer_name || 'Detail Prospek'}`} />

            {/* ── Top Bar Header Aksi (Persis seperti Modul Inventaris) ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Link
                        href={route('crm.pipeline')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Pipeline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {!isEditing ? (
                        lead.stage !== 'won' && lead.stage !== 'lost' && (
                            <>
                                {/* Tombol Utama: Buat Penawaran (Quotation) */}
                                <Link
                                    href={route('sales.orders.create', { lead_id: lead.id })}
                                    className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <FileText className="h-4 w-4" />
                                    Buat Penawaran (Quotation)
                                </Link>

                                {/* Tombol Ubah Data */}
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                                    Edit Data
                                </button>
                            </>
                        )
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setDuplicateError('');
                                    setIsEditing(false);
                                }}
                                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Status Bar / Breadcrumb Pipa (Odoo Style) */}
                <OdooStatusBar status={lead.stage} stages={CRM_STAGES} />
            </div>

            {/* Banner Peringatan Duplikat pada Mode Edit */}
            {isEditing && (duplicateError || errors.items) && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Perhatian Pengisian Formulir:</p>
                        <p className="text-[11px] mt-0.5">{duplicateError || errors.items}</p>
                    </div>
                </div>
            )}

            {/* ── Sheet Card (Konsisten dengan Form CRUD Inventaris) ── */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6">
                {/* Sheet Top: ID Dokumen & Smart Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                {lead.id}
                            </h1>
                            <span
                                className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                    lead.stage === 'won'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : lead.stage === 'qualified'
                                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                            >
                                {lead.stage === 'won' ? 'Menang' : lead.stage === 'qualified' ? 'Terkualifikasi' : 'Baru'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Dokumen Prospek CRM / Peminatan Pembeli
                        </p>
                    </div>

                    {/* Smart Button Odoo */}
                    <div className="flex items-center gap-2">
                        <OdooSmartButton
                            icon={FileText}
                            count={lead.quotations?.length ?? 0}
                            label="Penawaran (SO)"
                            href={firstQuotationId ? route('sales.orders.show', firstQuotationId) : null}
                            active={lead.quotations?.length > 0}
                        />
                    </div>
                </div>

                {/* ── Mode Tampil (View Mode) ── */}
                {!isEditing ? (
                    <div>
                        {/* Grid Informasi Umum (Format 2 Kolom Persis Inventaris) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 mb-6 text-xs">
                            <div className="space-y-3">
                                <div className="flex items-baseline">
                                    <span className="w-36 font-semibold text-slate-500">Calon Pelanggan:</span>
                                    <Link
                                        href={route('crm.customers.show', lead.customer_id)}
                                        className="font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition"
                                    >
                                        {lead.customer_name} ({lead.customer_id}) &rarr;
                                    </Link>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="w-36 font-semibold text-slate-500">Sales Ditugaskan:</span>
                                    <span className="font-semibold text-slate-900">{lead.assigned_name}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-baseline">
                                    <span className="w-40 font-semibold text-slate-500">Total Estimasi Nilai:</span>
                                    <span className="text-base font-bold font-mono text-slate-900">
                                        {formatRp(lead.expected_revenue)}
                                    </span>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="w-40 font-semibold text-slate-500">Tanggal Dibuat:</span>
                                    <span className="text-slate-700">{lead.created_at} oleh {lead.created_by_name}</span>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="w-40 font-semibold text-slate-500">Catatan Prospek:</span>
                                    <span className="text-slate-700">{lead.notes || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Detail Peminatan Produk (Lines Table Persis Inventaris) */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Barang yang Diminati ({displayItems.length} jenis produk)
                                </span>
                            </div>
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                                        <th className="py-2.5 px-3">Produk / SKU Varian</th>
                                        <th className="py-2.5 px-3 w-36 text-right">Harga Satuan</th>
                                        <th className="py-2.5 px-3 w-32 text-center">Qty Minat</th>
                                        <th className="py-2.5 px-3 w-40 text-right">Subtotal Estimasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayItems.map((item, idx) => {
                                        const sub = (parseInt(item.qty_interest, 10) || 0) * (parseFloat(item.unit_price) || 0);
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/60">
                                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                                    <span className="font-mono font-bold text-slate-900">{item.variant_sku}</span>
                                                    <span className="text-slate-400 mx-1.5">—</span>
                                                    <span>{item.product_name || item.variant_sku}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                                    {formatRp(item.unit_price)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                                                    {item.qty_interest} unit
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(sub)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Footer Ringkasan Kartu Tabel */}
                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                <div className="text-slate-600 flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>
                                        Total <strong>{displayItems.length}</strong> jenis produk (<strong>{displayTotalQty}</strong> unit peminatan).
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className="text-slate-500">Estimasi Pendapatan:</span>
                                    <span className="text-sm font-bold font-mono text-slate-900">
                                        {formatRp(lead.expected_revenue)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Mode Edit (Formulir CRUD Persis Inventaris) ── */
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
                            {/* Pelanggan: Bisa diedit jika belum ada Quotation; terkunci jika sudah ada Quotation */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Calon Pelanggan *
                                </label>
                                {hasQuotations ? (
                                    <>
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value={`${lead.customer_id} — ${lead.customer_name || ''}`}
                                            className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Pelanggan tidak dapat diubah karena sudah terdapat Quotation.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <select
                                            required
                                            value={data.customer_id}
                                            onChange={(e) => setData('customer_id', e.target.value)}
                                            className={`w-full rounded border px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                                                errors.customer_id ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.id} — {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.customer_id && (
                                            <p className="text-rose-600 text-[11px] mt-1">{errors.customer_id}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Sales Person Ditugaskan (Tidak Bisa Diedit) */}
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Sales Person Ditugaskan
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={lead.assigned_name || '—'}
                                    className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Catatan */}
                            <div className="md:col-span-2">
                                <label className="block font-bold text-slate-700 mb-1">
                                    Catatan Prospek
                                </label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Contoh: Permintaan katalog, jadwal kunjungan, dsb."
                                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                                />
                            </div>
                        </div>

                        {/* Tabel Edit Produk yang Diminati (Multi-Item) */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Barang yang Diminati (Items of Interest)
                                </span>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="inline-flex items-center gap-1 rounded bg-slate-200 hover:bg-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition cursor-pointer"
                                >
                                    <Plus className="h-3 w-3" /> Tambah Baris
                                </button>
                            </div>

                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                    <tr>
                                        <th className="px-3 py-2 text-center w-12">No</th>
                                        <th className="px-3 py-2">Produk / SKU Varian *</th>
                                        <th className="px-3 py-2 w-36 text-right">Harga Satuan</th>
                                        <th className="px-3 py-2 w-32 text-center">Qty Minat *</th>
                                        <th className="px-3 py-2 w-40 text-right">Subtotal Estimasi</th>
                                        <th className="px-3 py-2 w-14 text-center">Hapus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.items.map((item, idx) => {
                                        const subtotal = (parseInt(item.qty_interest, 10) || 0) * (parseFloat(item.unit_price) || 0);
                                        const itemSkuError = errors[`items.${idx}.variant_sku`];
                                        const itemQtyError = errors[`items.${idx}.qty_interest`];

                                        return (
                                            <tr key={item._id} className="hover:bg-slate-50/60">
                                                <td className="px-3 py-2 text-center text-slate-400 font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.variant_sku}
                                                        onChange={(e) => handleProductSelect(item._id, e.target.value)}
                                                        className={`w-full rounded border px-2.5 py-1 text-xs text-slate-800 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${
                                                            itemSkuError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        <option value="">-- Pilih Produk --</option>
                                                        {products.map((p) => {
                                                            const isSelectedElsewhere = selectedSkus.includes(p.variant_sku) && p.variant_sku !== item.variant_sku;
                                                            return (
                                                                <option
                                                                    key={p.variant_sku}
                                                                    value={p.variant_sku}
                                                                    disabled={isSelectedElsewhere}
                                                                >
                                                                    {p.variant_sku} — {p.name || p.variant_name} ({formatRp(p.sales_price)})
                                                                    {isSelectedElsewhere ? ' (Sudah dipilih)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    {itemSkuError && (
                                                        <p className="text-rose-600 text-[10px] mt-0.5">{itemSkuError}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-600">
                                                    {formatRp(item.unit_price)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.qty_interest}
                                                        onChange={(e) => handleQtyChange(item._id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === '-') {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`w-24 text-center rounded border py-1 text-xs font-bold text-slate-900 ${
                                                            itemQtyError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                                                        }`}
                                                    />
                                                    {itemQtyError && (
                                                        <p className="text-rose-600 text-[10px] mt-0.5">{itemQtyError}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                                                    {formatRp(subtotal)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item._id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                                        title="Hapus baris"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Footer Ringkasan Kartu Tabel */}
                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                <div className="text-slate-600 flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>
                                        Total <strong>{data.items.length}</strong> jenis produk (<strong>{totalEditQty}</strong> unit peminatan).
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 font-semibold">
                                    <span className="text-slate-500">Estimasi Pendapatan:</span>
                                    <span className="text-sm font-bold font-mono text-slate-900">
                                        {formatRp(totalEditRevenue)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ── Dokumen Penawaran Terkait (Quotation & Sales Order) ── */}
                <div className="mt-8 border-t border-slate-200 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-700" />
                        Dokumen Penawaran Terkait (Quotation &amp; Sales Order)
                    </h3>

                    {lead.quotations && lead.quotations.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2.5">No. Sales Order</th>
                                        <th className="px-4 py-2.5">Status</th>
                                        <th className="px-4 py-2.5 text-right">Grand Total</th>
                                        <th className="px-4 py-2.5">Tanggal Dibuat</th>
                                        <th className="px-4 py-2.5 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lead.quotations.map((quo) => (
                                        <tr key={quo.id} className="hover:bg-slate-50/60 transition">
                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                                                {quo.id}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        quo.status === 'confirmed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : quo.status === 'done'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {quo.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                {formatRp(quo.grand_total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">
                                                {quo.created_at}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Link
                                                    href={route('sales.orders.show', quo.id)}
                                                    className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                                                >
                                                    Lihat Dokumen
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                            Belum ada dokumen penawaran (Quotation) yang dibuat untuk prospek ini.
                        </div>
                    )}
                </div>

                {/* ── Catatan Aktivitas & Riwayat Sistem ── */}
                <div className="mt-8 border-t border-slate-200 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        Catatan Aktivitas &amp; Riwayat Sistem
                    </h3>

                    <div className="space-y-2">
                        {auditLogs && auditLogs.length > 0 ? (
                            auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 rounded border border-slate-100 bg-slate-50/50 p-2.5 text-xs"
                                >
                                    <div className="rounded-full bg-slate-200 p-1 text-slate-600 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-800">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-[11px] mt-0.5">{log.notes}</p>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            Oleh: {log.actor_username || 'Sistem'} ({log.actor_role})
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada riwayat aktivitas tercatat.</p>
                        )}
                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
