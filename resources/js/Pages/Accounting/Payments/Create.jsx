import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Check,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

export default function PaymentCreate({
    preselected,
    customerInvoices = [],
    vendorBills = [],
    purchaseOrders = [],
    bankAccounts = [],
}) {
    const initialType = preselected?.document_type || 'customer_invoice';

    const getDocList = (docType) => {
        if (docType === 'customer_invoice') return customerInvoices || [];
        if (docType === 'vendor_bill') return vendorBills || [];
        return purchaseOrders || [];
    };

    const resolveInitialDoc = (docType, prefId) => {
        const list = getDocList(docType);
        if (prefId) {
            const found = list.find((d) => d.id === prefId);
            if (found) return found;
        }
        const openDoc = list.find((d) => Number(d.amount_residual ?? d.grand_total) > 0);
        return openDoc || list[0] || null;
    };

    const firstDoc = resolveInitialDoc(initialType, preselected?.document_id);

    const { data, setData, post, processing, errors } = useForm({
        document_type: initialType,
        document_id: firstDoc?.id || '',
        amount: firstDoc ? Number(firstDoc.amount_residual || firstDoc.grand_total || 0) : 0,
        payment_method: 'bank_transfer',
        bank_account_code: '1020',
        payment_date: new Date().toISOString().slice(0, 10),
        reference: firstDoc ? `PAY-${firstDoc.id}` : '',
        notes: firstDoc ? `Pembayaran atas dokumen ${firstDoc.id}` : '',
        idempotency_key: firstDoc ? `IDEMP-PAY-${firstDoc.id}-${Date.now()}` : `IDEMP-PAY-${Date.now()}`,
    });

    // Gabungan seluruh dokumen yang masih memiliki sisa tagihan (belum lunas) untuk tombol pilihan cepat
    const allPendingDocs = useMemo(() => {
        const openInvs = (customerInvoices || [])
            .filter((d) => Number(d.amount_residual) > 0)
            .map((d) => ({ ...d, doc_type: 'customer_invoice', type_label: 'Piutang (AR)' }));
        const openBls = (vendorBills || [])
            .filter((d) => Number(d.amount_residual) > 0)
            .map((d) => ({ ...d, doc_type: 'vendor_bill', type_label: 'Utang (AP)' }));
        return [...openInvs, ...openBls];
    }, [customerInvoices, vendorBills]);

    const activeList = useMemo(
        () => getDocList(data.document_type),
        [data.document_type, customerInvoices, vendorBills, purchaseOrders]
    );

    const unpaidList = useMemo(
        () => activeList.filter((d) => Number(d.amount_residual ?? d.grand_total) > 0),
        [activeList]
    );

    const paidList = useMemo(
        () => activeList.filter((d) => Number(d.amount_residual ?? d.grand_total) <= 0),
        [activeList]
    );

    const selectedDoc = useMemo(
        () => activeList.find((d) => d.id === data.document_id) || null,
        [activeList, data.document_id]
    );

    const handleDocTypeChange = (newType) => {
        const doc = resolveInitialDoc(newType, '');
        setData((prev) => ({
            ...prev,
            document_type: newType,
            document_id: doc?.id || '',
            amount: doc ? Number(doc.amount_residual || doc.grand_total || 0) : 0,
            reference: doc ? `PAY-${doc.id}` : '',
            notes: doc ? `Pembayaran atas dokumen ${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-${Date.now()}` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const handleDocChange = (newDocId) => {
        const doc = activeList.find((d) => d.id === newDocId);
        setData((prev) => ({
            ...prev,
            document_id: newDocId,
            amount: doc ? Number(doc.amount_residual || doc.grand_total || 0) : 0,
            reference: doc ? `PAY-${doc.id}` : '',
            notes: doc ? `Pembayaran atas dokumen ${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-${Date.now()}` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const handleQuickSelectDoc = (docType, docId) => {
        const list = getDocList(docType);
        const doc = list.find((d) => d.id === docId);
        setData((prev) => ({
            ...prev,
            document_type: docType,
            document_id: docId,
            amount: doc ? Number(doc.amount_residual || doc.grand_total || 0) : 0,
            reference: doc ? `PAY-${doc.id}` : '',
            notes: doc ? `Pembayaran atas dokumen ${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-${Date.now()}` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const currentResidual = selectedDoc
        ? Number(selectedDoc.amount_residual ?? selectedDoc.grand_total ?? 0)
        : 0;

    const projectedResidual = Math.max(0, currentResidual - Number(data.amount || 0));

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        post(route('accounting.payments.store'), { preserveScroll: true });
    };

    return (
        <AccountingLayout
            title="Catat Pembayaran Baru"
            breadcrumbs={[
                { label: 'Kas & Pembayaran', href: route('accounting.payments.index') },
                { label: 'Pembayaran', href: route('accounting.payments.index') },
                { label: 'Catat Pembayaran' },
            ]}
        >
            <Head title="Catat Pembayaran — Bara Wear" />

            {/* Odoo Form Action Header Bar (Persis Modul Inventaris) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('accounting.payments.index')}
                        className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Kembali ke Daftar Pembayaran"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing || !data.document_id}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {processing ? 'Memproses...' : 'Konfirmasi & Catat Pembayaran'}
                    </button>
                </div>

                <OdooStatusBar
                    status="draft"
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'reconciled', label: 'Lunas (Reconciled)' },
                    ]}
                />
            </div>

            {/* Pesan Validasi Pembayaran */}
            {(errors.payment_block || errors.amount || errors.document_id) && (
                <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Pembayaran Tidak Dapat Diproses:</span>
                        <p className="mt-1">
                            {errors.payment_block || errors.amount || errors.document_id}
                        </p>
                    </div>
                </div>
            )}

            {/* Pilihan Cepat Dokumen Faktur / Tagihan yang Perlu Dibayar */}
            {allPendingDocs.length > 0 && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <div className="text-xs font-bold text-emerald-950 mb-2">
                        Pilih Cepat Tagihan yang Menunggu Pembayaran ({allPendingDocs.length} Dokumen Belum Lunas):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allPendingDocs.map((doc) => {
                            const isSelected =
                                data.document_type === doc.doc_type && data.document_id === doc.id;
                            return (
                                <button
                                    key={`${doc.doc_type}-${doc.id}`}
                                    type="button"
                                    onClick={() => handleQuickSelectDoc(doc.doc_type, doc.id)}
                                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition cursor-pointer ${
                                        isSelected
                                            ? 'border-emerald-700 bg-emerald-700 text-white font-bold shadow-xs'
                                            : 'border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50 font-medium'
                                    }`}
                                >
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                    <span className="font-mono font-bold">{doc.id}</span>
                                    <span>&bull;</span>
                                    <span>{doc.party_name}</span>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : doc.doc_type === 'customer_invoice'
                                                ? 'bg-emerald-100 text-emerald-900'
                                                : 'bg-amber-100 text-amber-900'
                                        }`}
                                    >
                                        {doc.type_label}: {formatRp(doc.amount_residual)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Odoo White Sheet Form View (Senada Modul Inventaris & Faktur/Bill) */}
            <form
                onSubmit={handleSubmit}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-6"
            >
                {/* Sheet Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Catat Pembayaran Kas / Bank
                            </h1>
                            <OdooBadge status="draft" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih dokumen faktur pelanggan atau tagihan pemasok yang akan dilunasi
                        </p>
                    </div>

                    {/* Toggle Cepat Inbound vs Outbound */}
                    <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => handleDocTypeChange('customer_invoice')}
                            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-semibold transition cursor-pointer ${
                                data.document_type === 'customer_invoice'
                                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                            Terima Pembayaran Pelanggan (AR)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDocTypeChange('vendor_bill')}
                            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-semibold transition cursor-pointer ${
                                data.document_type === 'vendor_bill'
                                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" />
                            Bayar Tagihan Pemasok (AP)
                        </button>
                    </div>
                </div>

                {/* General Information Grid (2 Kolom Rapi seperti Inventaris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-xs">
                    {/* Kolom Kiri */}
                    <div className="space-y-3.5">
                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                {data.document_type === 'customer_invoice'
                                    ? 'Faktur Pelanggan:'
                                    : 'Tagihan Pemasok:'}
                            </span>
                            <select
                                value={data.document_id}
                                onChange={(e) => handleDocChange(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                            >
                                {activeList.length === 0 && (
                                    <option value="">-- Tidak ada dokumen tersedia --</option>
                                )}
                                {unpaidList.length > 0 && (
                                    <optgroup label="Perlu Dibayar (Belum Lunas)">
                                        {unpaidList.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.id} — {doc.party_name} (Sisa Tagihan:{' '}
                                                {formatRp(doc.amount_residual ?? doc.grand_total)})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {paidList.length > 0 && (
                                    <optgroup label="Sudah Lunas (Paid)">
                                        {paidList.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.id} — {doc.party_name} (Sudah Lunas)
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                {data.document_type === 'customer_invoice'
                                    ? 'Pelanggan:'
                                    : 'Pemasok (Vendor):'}
                            </span>
                            <span className="font-bold text-slate-900">
                                {selectedDoc?.party_name || '—'}{' '}
                                {selectedDoc?.party_id && (
                                    <span className="text-slate-400 font-normal">
                                        ({selectedDoc.party_id})
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Akun Kas / Bank:
                            </span>
                            <select
                                value={data.bank_account_code}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    setData((prev) => ({
                                        ...prev,
                                        bank_account_code: code,
                                        payment_method: code === '1010' ? 'cash' : 'bank_transfer',
                                    }));
                                }}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-slate-500 focus:outline-none"
                            >
                                {(bankAccounts || []).map((acc) => (
                                    <option key={acc.code} value={acc.code}>
                                        {acc.name} (Saldo: {formatRp(acc.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-baseline">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Jatuh Tempo Dokumen:
                            </span>
                            <span className="font-medium text-slate-700">
                                {selectedDoc?.due_date || '—'}
                            </span>
                        </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-3.5">
                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Nominal Pembayaran:
                            </span>
                            <div className="flex w-full items-center gap-2">
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData(
                                            'amount',
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded border border-emerald-400 bg-emerald-50/40 px-2.5 py-1.5 font-mono text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                                />
                                {selectedDoc && Number(data.amount) !== currentResidual && (
                                    <button
                                        type="button"
                                        onClick={() => setData('amount', currentResidual)}
                                        className="shrink-0 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Bayar Penuh
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Tanggal Pembayaran:
                            </span>
                            <input
                                type="date"
                                value={data.payment_date}
                                onChange={(e) => setData('payment_date', e.target.value)}
                                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Referensi / Memo:
                            </span>
                            <input
                                type="text"
                                value={data.reference}
                                onChange={(e) => setData('reference', e.target.value)}
                                placeholder="No. Bukti Transfer / Referensi..."
                                className="w-full rounded border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center">
                            <span className="w-40 font-semibold text-slate-500 shrink-0">
                                Catatan:
                            </span>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan tambahan pembayaran..."
                                className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabel Ringkasan Dokumen yang Dibayar (Senada Tabel Barang di Inventaris) */}
                {selectedDoc && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet className="h-4 w-4 text-slate-500" />
                                Rincian Alokasi Pembayaran Dokumen
                            </h3>
                            <span className="text-[11px] text-slate-500">
                                {data.document_type === 'customer_invoice'
                                    ? 'Penerimaan Piutang Pelanggan (Inbound)'
                                    : 'Pelunasan Utang Pemasok (Outbound)'}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2.5">No. Dokumen</th>
                                        <th className="px-4 py-2.5">Mitra Bisnis</th>
                                        <th className="px-4 py-2.5 text-right">Total Tagihan</th>
                                        <th className="px-4 py-2.5 text-right">Sudah Dibayar</th>
                                        <th className="px-4 py-2.5 text-right">Sisa Tagihan Saat Ini</th>
                                        <th className="px-4 py-2.5 text-right">Dibayar Sekarang</th>
                                        <th className="px-4 py-2.5 text-right">Sisa Setelah Bayar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                            {selectedDoc.id}
                                            {selectedDoc.source_order_id && (
                                                <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                                                    ({selectedDoc.source_order_id})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {selectedDoc.party_name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                                            {formatRp(selectedDoc.grand_total)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                                            {formatRp(selectedDoc.amount_paid || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                                            {formatRp(currentResidual)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                            {formatRp(data.amount || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                            {formatRp(projectedResidual)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Ringkasan Total Pembayaran */}
                <div className="flex justify-end">
                    <div className="w-full sm:w-80 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Sisa Tagihan Sebelumnya:</span>
                            <span className="font-mono font-semibold text-slate-900">
                                {formatRp(currentResidual)}
                            </span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Nominal Pembayaran Ini:</span>
                            <span className="font-mono">{formatRp(data.amount || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                            <span>Sisa Tagihan Akhir:</span>
                            <span className="font-mono text-emerald-800">
                                {formatRp(projectedResidual)}
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </AccountingLayout>
    );
}
