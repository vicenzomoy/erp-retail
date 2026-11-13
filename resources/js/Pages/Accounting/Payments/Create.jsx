import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AccountingLayout from '@/Layouts/AccountingLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    Landmark,
    Calendar,
} from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

const formatThousands = (val) => {
    if (val === '' || val === null || val === undefined || Number(val) === 0) {
        return '';
    }
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(Number(val));
};

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

    const isInbound = data.document_type === 'customer_invoice';

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

    const applyDocToForm = (docType, doc) => {
        setData((prev) => ({
            ...prev,
            document_type: docType,
            document_id: doc?.id || '',
            amount: doc ? Number(doc.amount_residual || doc.grand_total || 0) : 0,
            reference: doc ? `PAY-${doc.id}` : '',
            notes: doc ? `Pembayaran atas dokumen ${doc.id}` : '',
            idempotency_key: doc ? `IDEMP-PAY-${doc.id}-${Date.now()}` : `IDEMP-PAY-${Date.now()}`,
        }));
    };

    const handleDocTypeChange = (newType) => {
        const doc = resolveInitialDoc(newType, '');
        applyDocToForm(newType, doc);
    };

    const handleDocChange = (newDocId) => {
        const doc = activeList.find((d) => d.id === newDocId) || null;
        applyDocToForm(data.document_type, doc);
    };

    const handleAmountInput = (rawValue) => {
        const digits = rawValue.replace(/\D/g, '');
        setData('amount', digits === '' ? 0 : Number(digits));
    };

    const currentResidual = selectedDoc
        ? Number(selectedDoc.amount_residual ?? selectedDoc.grand_total ?? 0)
        : 0;

    const numericAmount = Number(data.amount || 0);
    const projectedResidual = Math.max(0, currentResidual - numericAmount);
    const isOverpaying = selectedDoc && numericAmount > currentResidual;
    const isPartial = selectedDoc && numericAmount > 0 && numericAmount < currentResidual;

    const selectedBankAccount = useMemo(
        () => (bankAccounts || []).find((acc) => acc.code === data.bank_account_code) || null,
        [bankAccounts, data.bank_account_code]
    );
    const availableBalance = Number(selectedBankAccount?.balance ?? 0);
    const isInsufficientBalance = !isInbound && numericAmount > 0 && numericAmount > availableBalance;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        post(route('accounting.payments.store'), { preserveScroll: true });
    };

    return (
        <AccountingLayout
            title={isInbound ? 'Terima Pembayaran Pelanggan' : 'Bayar Tagihan Pemasok'}
            breadcrumbs={[
                { label: 'Kas & Pembayaran', href: route('accounting.payments.index') },
                { label: 'Pembayaran & Penerimaan', href: route('accounting.payments.index') },
                { label: isInbound ? 'Terima Pembayaran' : 'Bayar Tagihan' },
            ]}
        >
            <Head
                title={`${isInbound ? 'Terima Pembayaran' : 'Bayar Tagihan'} — Bara Wear`}
            />

            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                    <Link
                        href={route('accounting.payments.index')}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 transition"
                        title="Kembali ke Daftar Pembayaran"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-base font-bold text-slate-900">
                            {isInbound ? 'Terima Pembayaran Pelanggan' : 'Bayar Tagihan Pemasok'}
                        </h1>
                        <p className="text-[11px] text-slate-500">
                            {isInbound
                                ? 'Catat uang masuk dari pelunasan faktur penjualan.'
                                : 'Catat pengeluaran kas/bank untuk membayar tagihan pemasok.'}
                        </p>
                    </div>
                </div>

                <OdooStatusBar
                    status="draft"
                    stages={[
                        { key: 'draft', label: 'Draft' },
                        { key: 'reconciled', label: 'Selesai' },
                    ]}
                />
            </div>

            {/* Pesan Validasi Error */}
            {(errors.payment_block || errors.amount || errors.document_id) && (
                <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Pembayaran Tidak Dapat Diproses: </span>
                        <span>{errors.payment_block || errors.amount || errors.document_id}</span>
                    </div>
                </div>
            )}

            {/* Step 1: Pilih Jenis Transaksi (2 Kartu Jelas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                    type="button"
                    onClick={() => handleDocTypeChange('customer_invoice')}
                    className={`flex items-center gap-3.5 rounded-lg border p-4 text-left transition cursor-pointer ${
                        isInbound
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-400 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            isInbound
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                        <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-900">
                            Terima Pembayaran (Uang Masuk)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            Pelanggan membayar faktur penjualan
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleDocTypeChange('vendor_bill')}
                    className={`flex items-center gap-3.5 rounded-lg border p-4 text-left transition cursor-pointer ${
                        !isInbound
                            ? 'border-slate-800 bg-slate-100/80 ring-1 ring-slate-400 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            !isInbound
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                        <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-900">
                            Bayar Tagihan (Uang Keluar)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            Membayar tagihan pembelian ke pemasok
                        </div>
                    </div>
                </button>
            </div>

            {/* Main 2-Column Form + Sticky Summary */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* Kolom Kiri: Form Input */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Card 1: Pilih Dokumen */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                1. Pilih {isInbound ? 'Faktur Pelanggan' : 'Tagihan Pemasok'}
                            </h2>
                        </div>

                        <select
                            value={data.document_id}
                            onChange={(e) => handleDocChange(e.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-slate-500 focus:outline-none"
                        >
                            {activeList.length === 0 && (
                                <option value="">-- Tidak ada dokumen tersedia --</option>
                            )}
                            {unpaidList.length > 0 && (
                                <optgroup label="Belum Lunas (Perlu Dibayar)">
                                    {unpaidList.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.id} — {doc.party_name} (Sisa:{' '}
                                            {formatRp(doc.amount_residual ?? doc.grand_total)})
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {paidList.length > 0 && (
                                <optgroup label="Sudah Lunas">
                                    {paidList.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.id} — {doc.party_name} (Lunas)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>

                        {/* Pilihan Cepat hanya untuk tipe transaksi yang aktif */}
                        {unpaidList.length > 0 && (
                            <div className="mt-3">
                                <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                                    Pilihan cepat belum lunas:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {unpaidList.slice(0, 6).map((doc) => {
                                        const isSelected = data.document_id === doc.id;
                                        return (
                                            <button
                                                key={doc.id}
                                                type="button"
                                                onClick={() => handleDocChange(doc.id)}
                                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition cursor-pointer ${
                                                    isSelected
                                                        ? isInbound
                                                            ? 'border-emerald-700 bg-emerald-700 text-white font-bold'
                                                            : 'border-slate-900 bg-slate-900 text-white font-bold'
                                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span className="font-mono font-bold">{doc.id}</span>
                                                <span className="opacity-75">&bull;</span>
                                                <span className="truncate max-w-[140px]">
                                                    {doc.party_name}
                                                </span>
                                                <span className="font-mono opacity-90">
                                                    ({formatRp(doc.amount_residual)})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Nominal & Akun Kas / Bank */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                2. Nominal &amp; Akun Kas / Bank
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Nominal Pembayaran
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatThousands(data.amount)}
                                            onChange={(e) => handleAmountInput(e.target.value)}
                                            placeholder="0"
                                            className={`w-full rounded-md border pl-9 pr-3 py-2 font-mono text-sm font-bold text-slate-900 focus:outline-none ${
                                                isOverpaying || isInsufficientBalance
                                                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600'
                                                    : 'border-slate-300 bg-white focus:border-slate-600'
                                            }`}
                                        />
                                    </div>
                                    {selectedDoc && numericAmount !== currentResidual && currentResidual > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setData('amount', currentResidual)}
                                            className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                        >
                                            Bayar Penuh
                                        </button>
                                    )}
                                </div>
                                {isPartial && (
                                    <p className="mt-1 text-[11px] text-amber-700">
                                        Pembayaran sebagian — sisa tagihan tetap tercatat belum lunas.
                                    </p>
                                )}
                                {isOverpaying && (
                                    <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                                        Nominal melebihi sisa tagihan ({formatRp(currentResidual)}).
                                    </p>
                                )}
                                {isInsufficientBalance && (
                                    <p className="mt-1 text-[11px] text-rose-600 font-semibold">
                                        Saldo {selectedBankAccount?.name || 'Kas/Bank'} tidak mencukupi (tersedia:{' '}
                                        {formatRp(Math.max(0, availableBalance))}).
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    {isInbound ? 'Masuk ke Akun Kas / Bank' : 'Bayar dari Akun Kas / Bank'}
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
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-slate-500 focus:outline-none"
                                >
                                    {(bankAccounts || []).map((acc) => (
                                        <option key={acc.code} value={acc.code}>
                                            {acc.name} (Saldo: {formatRp(acc.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Tanggal & Keterangan */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                3. Tanggal &amp; Keterangan
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Tanggal Pembayaran
                                </label>
                                <input
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    No. Referensi / Bukti Transfer
                                </label>
                                <input
                                    type="text"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    placeholder="Contoh: TRF-BCA-001"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Catatan (Opsional)
                            </label>
                            <input
                                type="text"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan tambahan pembayaran..."
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Ringkasan Tagihan & Tombol Konfirmasi */}
                <div className="lg:col-span-1 rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Ringkasan Tagihan
                        </h3>
                    </div>

                    {selectedDoc ? (
                        <div className="space-y-3 text-xs">
                            <div className="rounded-md bg-slate-50 border border-slate-200/80 p-3">
                                <div className="text-[11px] text-slate-500">
                                    {isInbound ? 'Pelanggan' : 'Pemasok'}
                                </div>
                                <div className="font-bold text-slate-900 text-sm mt-0.5">
                                    {selectedDoc.party_name}
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="font-mono font-semibold text-slate-700">
                                        {selectedDoc.id}
                                    </span>
                                    <span>Jatuh tempo: {selectedDoc.due_date || '—'}</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <div className="flex justify-between text-slate-600">
                                    <span>Total Tagihan</span>
                                    <span className="font-mono">
                                        {formatRp(selectedDoc.grand_total)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Sudah Dibayar</span>
                                    <span className="font-mono">
                                        {formatRp(selectedDoc.amount_paid || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">
                                    <span>Sisa Tagihan Saat Ini</span>
                                    <span className="font-mono">{formatRp(currentResidual)}</span>
                                </div>
                                <div
                                    className={`flex justify-between font-bold ${
                                        isInbound ? 'text-emerald-700' : 'text-slate-900'
                                    }`}
                                >
                                    <span>Dibayar Sekarang</span>
                                    <span className="font-mono">{formatRp(numericAmount)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                    Sisa Setelah Bayar
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-black text-slate-900">
                                        {formatRp(projectedResidual)}
                                    </span>
                                    {projectedResidual === 0 && numericAmount > 0 && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                            LUNAS
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                            Pilih dokumen tagihan terlebih dahulu untuk melihat rincian.
                        </div>
                    )}

                    {isInsufficientBalance && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700 font-medium">
                            Pembayaran tidak dapat diproses karena saldo{' '}
                            <span className="font-bold">{selectedBankAccount?.name}</span> hanya{' '}
                            <span className="font-mono font-bold">{formatRp(Math.max(0, availableBalance))}</span>.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={processing || !data.document_id || numericAmount <= 0 || isOverpaying || isInsufficientBalance}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isInbound
                                ? 'bg-emerald-700 hover:bg-emerald-800'
                                : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {processing
                            ? 'Menyimpan...'
                            : isInbound
                            ? 'Konfirmasi Terima Pembayaran'
                            : 'Konfirmasi Bayar Tagihan'}
                    </button>
                </div>
            </form>
        </AccountingLayout>
    );
}
