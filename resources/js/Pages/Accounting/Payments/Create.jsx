import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function PaymentCreate({
    preselected,
    customerInvoices,
    vendorBills,
    purchaseOrders,
    bankAccounts,
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
        // Cari yang masih memiliki residual > 0 terlebih dahulu
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
        reference: firstDoc ? `PAY-REF-${firstDoc.id}` : '',
        notes: 'Rekonsiliasi pembayaran faktur/tagihan ke Buku Besar Bank Operasional (1020)',
        idempotency_key: firstDoc ? `IDEMP-PAY-${firstDoc.id}-01` : `IDEMP-PAY-${Date.now()}`,
    });

    const activeList = useMemo(() => getDocList(data.document_type), [
        data.document_type,
        customerInvoices,
        vendorBills,
        purchaseOrders,
    ]);

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
            reference: doc ? `PAY-REF-${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-01` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const handleDocChange = (newDocId) => {
        const doc = activeList.find((d) => d.id === newDocId);
        setData((prev) => ({
            ...prev,
            document_id: newDocId,
            amount: doc ? Number(doc.amount_residual || doc.grand_total || 0) : 0,
            reference: doc ? `PAY-REF-${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-01` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const handleSetPartial200k = () => {
        setData('amount', 200000);
    };

    const handleSetFullResidual = () => {
        if (!selectedDoc) return;
        const full = Number(selectedDoc.amount_residual || selectedDoc.grand_total || 0);
        setData('amount', full);
    };

    const projectedResidual = selectedDoc
        ? Math.max(0, Number(selectedDoc.amount_residual ?? selectedDoc.grand_total ?? 0) - Number(data.amount || 0))
        : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('accounting.payments.store'), { preserveScroll: true });
    };

    return (
        <AccountingLayout
            title="Register Payment (S-13 / F-15)"
            breadcrumbs={[
                { label: 'Accounting', href: route('accounting.overview') },
                { label: 'Payments (S-13)', href: route('accounting.payments.index') },
                { label: 'Register Payment' },
            ]}
        >
            <Head title="Register Payment (S-13) — Accounting" />

            <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
                {/* Action Bar & Status Pipe */}
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing || !data.document_id}
                            className="inline-flex items-center gap-1.5 rounded bg-odoo-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-odoo-purple-dark disabled:opacity-50"
                        >
                            Konfirmasi & Rekonsiliasi Pembayaran
                        </button>
                        <button
                            type="button"
                            onClick={handleSetPartial200k}
                            className="rounded border border-indigo-600 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                        >
                            Preset Bayar Parsial Rp 200.000 (Skenario T-25)
                        </button>
                        <button
                            type="button"
                            onClick={handleSetFullResidual}
                            className="rounded border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                            Preset Lunasi Penuh 100% (Skenario T-26)
                        </button>
                        <Link
                            href={route('accounting.payments.index')}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                    </div>

                    <OdooStatusBar
                        steps={[
                            { key: 'draft', label: 'Draft' },
                            { key: 'reconciled', label: 'Reconciled' },
                        ]}
                        current="draft"
                    />
                </div>

                {/* Error Alert (T-20 / Validasi Pembayaran) */}
                {(errors.payment_block || errors.amount || errors.document_id) && (
                    <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                                !
                            </span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-red-900">
                                    Transaksi Pembayaran Ditolak oleh Sistem Kontrol Akuntansi
                                </h4>
                                <p className="text-xs text-red-800">
                                    {errors.payment_block || errors.amount || errors.document_id}
                                </p>
                                <p className="text-[11px] font-medium text-red-700">
                                    Jejak penolakan telah dicatat pada <code className="font-mono font-bold">AuditLog (REJECTED)</code>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Sheet */}
                <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
                    {/* Pilihan Tipe Dokumen */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                            1. Pilih Jenis Transaksi Pembayaran (S-13)
                        </label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => handleDocTypeChange('customer_invoice')}
                                className={`rounded-lg border p-3.5 text-left transition-all ${
                                    data.document_type === 'customer_invoice'
                                        ? 'border-odoo-purple bg-purple-50/60 ring-1 ring-odoo-purple'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="text-xs font-bold text-gray-900">
                                    Penerimaan Pelanggan (Inbound AR)
                                </div>
                                <div className="mt-1 text-[11px] text-gray-600">
                                    Debit Bank (1020) / Kredit Piutang (1100) — Skenario T-25
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDocTypeChange('vendor_bill')}
                                className={`rounded-lg border p-3.5 text-left transition-all ${
                                    data.document_type === 'vendor_bill'
                                        ? 'border-odoo-purple bg-purple-50/60 ring-1 ring-odoo-purple'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="text-xs font-bold text-gray-900">
                                    Pelunasan Tagihan Vendor (Outbound AP)
                                </div>
                                <div className="mt-1 text-[11px] text-gray-600">
                                    Debit Utang (2100) / Kredit Bank (1020) — Skenario T-26
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDocTypeChange('purchase_order')}
                                className={`rounded-lg border p-3.5 text-left transition-all ${
                                    data.document_type === 'purchase_order'
                                        ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className="text-xs font-bold text-red-900">
                                    Uji Bayar Langsung PO Tanpa Bill/Receipt
                                </div>
                                <div className="mt-1 text-[11px] text-red-700">
                                    Menguji penolakan pembayaran tanpa penerimaan (Skenario T-20)
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Kolom Kiri: Dokumen & Nominal */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                    2. Pilih Dokumen Tagihan / Faktur
                                </label>
                                <select
                                    value={data.document_id}
                                    onChange={(e) => handleDocChange(e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 text-sm font-semibold focus:border-odoo-purple focus:ring-odoo-purple"
                                >
                                    {activeList.length === 0 && (
                                        <option value="">-- Tidak ada dokumen tersedia --</option>
                                    )}
                                    {activeList.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.id} — {doc.party_name} ({doc.party_id}) | Residual: {formatRp(doc.amount_residual ?? doc.grand_total)} [{doc.status?.toUpperCase()}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedDoc && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Mitra Bisnis:</span>
                                        <span className="font-bold text-gray-900">
                                            {selectedDoc.party_name} ({selectedDoc.party_id})
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Grand Total Dokumen:</span>
                                        <span className="font-mono font-semibold text-gray-900">
                                            {formatRp(selectedDoc.grand_total)}
                                        </span>
                                    </div>
                                    {selectedDoc.amount_paid !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Sudah Dibayar Sebelumnya:</span>
                                            <span className="font-mono font-semibold text-emerald-700">
                                                {formatRp(selectedDoc.amount_paid)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-200 pt-1.5">
                                        <span className="font-bold text-gray-700">Sisa Tagihan Saat Ini (Residual):</span>
                                        <span className="font-mono text-sm font-extrabold text-indigo-700">
                                            {formatRp(selectedDoc.amount_residual ?? selectedDoc.grand_total)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                    3. Nominal Pembayaran (Rp) — Mendukung Parsial & Penuh (F-15)
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value === '' ? '' : Number(e.target.value))}
                                    className="mt-1 block w-full rounded border-gray-300 font-mono text-base font-bold text-gray-900 focus:border-odoo-purple focus:ring-odoo-purple"
                                />
                                {selectedDoc && (
                                    <div className="mt-1.5 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">
                                            Estimasi Sisa Tagihan (Residual) Setelah Pembayaran Ini:
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700">
                                            {formatRp(projectedResidual)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan: Akun Bank, Tanggal, Idempotency Key */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                    4. Pilih Jurnal / Akun Kas & Bank
                                </label>
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
                                    className="mt-1 block w-full rounded border-gray-300 text-sm font-semibold focus:border-odoo-purple focus:ring-odoo-purple"
                                >
                                    {(bankAccounts || []).map((acc) => (
                                        <option key={acc.code} value={acc.code}>
                                            {acc.name} — Saldo GL Saat Ini: {formatRp(acc.balance)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                        Tanggal Pembayaran
                                    </label>
                                    <input
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 text-sm focus:border-odoo-purple focus:ring-odoo-purple"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                        Memo / Referensi Bank
                                    </label>
                                    <input
                                        type="text"
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 font-mono text-xs focus:border-odoo-purple focus:ring-odoo-purple"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    5. Kunci Idempotensi Anti-Duplikasi (SR-17 & SR-20 / Skenario T-26)
                                </label>
                                <input
                                    type="text"
                                    value={data.idempotency_key}
                                    onChange={(e) => setData('idempotency_key', e.target.value)}
                                    className="block w-full rounded border-indigo-300 bg-white font-mono text-xs font-bold text-indigo-900 focus:border-odoo-purple focus:ring-odoo-purple"
                                />
                                <p className="text-[11px] text-indigo-800">
                                    Jika permintaan pembayaran dikirim ulang dengan <code className="font-mono font-bold">idempotency_key</code> yang sama, sistem menjamin saldo Bank tidak terpotong dua kali dan tidak membuat jurnal ganda.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Catatan Rekonsiliasi
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 text-xs focus:border-odoo-purple focus:ring-odoo-purple"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AccountingLayout>
    );
}

