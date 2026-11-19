import React from 'react';

/**
 * Label status quotation / Sales Order untuk riwayat penawaran di CRM.
 * Kredit Hold / Diskon Hold hanya tampil selama quotation masih draft;
 * setelah dibatalkan atau dikonfirmasi, status akhir yang ditampilkan.
 */
export function quotationStatus(quo) {
    if (quo.status === 'draft' && quo.credit_hold) {
        return { label: 'Kredit Hold', cls: 'bg-amber-100 text-amber-800' };
    }
    if (quo.status === 'draft' && quo.discount_hold) {
        return { label: 'Diskon Hold', cls: 'bg-rose-100 text-rose-700' };
    }
    const map = {
        draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-700' },
        confirmed: { label: 'Terkonfirmasi', cls: 'bg-blue-100 text-blue-800' },
        done: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' },
        cancelled: { label: 'Dibatalkan', cls: 'bg-rose-100 text-rose-700' },
    };
    return map[quo.status] ?? { label: quo.status, cls: 'bg-slate-100 text-slate-700' };
}

export default function QuotationStatusBadge({ quotation, className = '' }) {
    const { label, cls } = quotationStatus(quotation);
    return (
        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${cls} ${className}`}>
            {label}
        </span>
    );
}
