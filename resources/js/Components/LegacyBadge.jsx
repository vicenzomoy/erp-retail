import React from 'react';
import { History, Info } from 'lucide-react';

/**
 * Penanda transaksi historis (data sebelum go-live ERP).
 * Order historis tampil di riwayat & analisis, tetapi tidak memiliki
 * pengiriman, faktur, stock move, maupun jurnal di ERP.
 */
export default function LegacyBadge({ className = '' }) {
    return (
        <span
            title="Data historis sebelum go-live ERP — hanya untuk riwayat & analisis"
            className={`inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-600 whitespace-nowrap ${className}`}
        >
            <History className="h-3 w-3" />
            Historis
        </span>
    );
}

export function LegacyNotice({ kind = 'order' }) {
    const text =
        kind === 'so'
            ? 'Sales Order ini adalah data historis sebelum go-live ERP. Pengiriman dan faktur sudah diselesaikan di sistem lama, sehingga tidak ada dokumen pengiriman, invoice, maupun jurnal di ERP. Data ini dipakai untuk riwayat dan analisis penjualan.'
            : kind === 'session'
            ? 'Sesi kasir ini adalah data historis sebelum go-live ERP. Kas sudah direkap di sistem lama dan tercermin di saldo awal, sehingga tidak ada jurnal penutupan sesi di ERP.'
            : 'Struk ini adalah data historis sebelum go-live ERP. Stok dan kas sudah tercermin di saldo awal, sehingga tidak ada jurnal maupun mutasi stok di ERP. Data ini dipakai untuk riwayat dan analisis penjualan.';

    return (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-700">
            <Info className="h-4 w-4 mt-px shrink-0 text-slate-500" />
            <span>
                <b>Data historis.</b> {text}
            </span>
        </div>
    );
}
