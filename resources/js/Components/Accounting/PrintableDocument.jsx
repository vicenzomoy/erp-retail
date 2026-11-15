import React from 'react';

/**
 * Template cetak resmi berstandar A4 untuk seluruh dokumen Accounting:
 * Customer Invoice, Vendor Bill, Bukti Pembayaran/Penerimaan, Credit Note, dan Journal Entry.
 * Hanya muncul saat mode cetak (hidden print:block).
 */
export default function PrintableDocument({
    docTitle,
    docNumber,
    statusLabel,
    partnerLabel = 'Rekanan',
    partnerName = '—',
    partnerSub = '',
    metaRows = [],
    columns = [],
    rows = [],
    summaryRows = [],
    notes = '',
    signatures = [
        { title: 'Dibuat Oleh', name: 'Bagian Keuangan' },
        { title: 'Disetujui Oleh', name: 'Finance / Manager' },
        { title: 'Diterima Oleh', name: 'Pihak Terkait' },
    ],
}) {
    const printedAt = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="hidden print:block w-full bg-white text-slate-900 text-[11px] leading-relaxed font-sans">
            {/* Kop Surat Perusahaan & Header Dokumen */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
                <div>
                    <div className="text-lg font-black tracking-tight text-slate-900 uppercase">
                        PT BARA RITEL NUSANTARA
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">
                        Bara Wear — Retail Fashion &amp; Apparel
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                        Jl. Jenderal Sudirman No. 128, Pekanbaru, Riau 28116
                    </div>
                    <div className="text-[10px] text-slate-500">
                        NPWP: 01.234.567.8-211.000 &bull; Telp: (0761) 555-0192
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Dokumen Resmi Akuntansi
                    </div>
                    <h1 className="text-base font-black uppercase tracking-tight text-slate-900 mt-0.5">
                        {docTitle}
                    </h1>
                    <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {docNumber}
                    </div>
                    {statusLabel && (
                        <div className="mt-1 inline-block rounded border border-slate-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                            Status: {statusLabel}
                        </div>
                    )}
                </div>
            </div>

            {/* Informasi Rekanan & Metadata Dokumen */}
            <div className="grid grid-cols-2 gap-6 mb-5">
                <div className="rounded border border-slate-300 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {partnerLabel}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{partnerName}</div>
                    {partnerSub && (
                        <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                            {partnerSub}
                        </div>
                    )}
                </div>

                <div className="rounded border border-slate-300 p-3">
                    <table className="w-full text-[11px]">
                        <tbody>
                            {metaRows.map((m, idx) => (
                                <tr key={idx}>
                                    <td className="py-0.5 text-slate-500 font-medium w-36">
                                        {m.label}
                                    </td>
                                    <td className="py-0.5 text-slate-900 font-semibold text-right font-mono">
                                        {m.value || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabel Rincian Item / Baris */}
            {columns.length > 0 && (
                <table className="w-full border-collapse border border-slate-300 mb-5 text-[11px]">
                    <thead>
                        <tr className="bg-slate-100 text-slate-800">
                            <th className="border border-slate-300 px-2.5 py-1.5 text-center w-8 font-bold">
                                No
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`border border-slate-300 px-2.5 py-1.5 font-bold ${
                                        col.align === 'right'
                                            ? 'text-right'
                                            : col.align === 'center'
                                            ? 'text-center'
                                            : 'text-left'
                                    }`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                                >
                                    Tidak ada rincian baris.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                    <td className="border border-slate-300 px-2.5 py-1.5 text-center text-slate-600">
                                        {rIdx + 1}
                                    </td>
                                    {columns.map((col, cIdx) => (
                                        <td
                                            key={cIdx}
                                            className={`border border-slate-300 px-2.5 py-1.5 ${
                                                col.align === 'right'
                                                    ? 'text-right tabular-nums'
                                                    : col.align === 'center'
                                                    ? 'text-center tabular-nums'
                                                    : 'text-left'
                                            } ${col.mono ? 'font-mono' : ''} ${
                                                col.bold ? 'font-bold text-slate-900' : ''
                                            }`}
                                        >
                                            {row[col.key] ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* Catatan & Ringkasan Nominal */}
            <div className="grid grid-cols-12 gap-6 mb-8 items-start">
                <div className="col-span-7">
                    {notes && (
                        <div className="rounded border border-slate-300 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Keterangan / Catatan
                            </div>
                            <div className="text-[11px] text-slate-800 whitespace-pre-line">
                                {notes}
                            </div>
                        </div>
                    )}
                </div>

                {summaryRows.length > 0 && (
                    <div className="col-span-5">
                        <table className="w-full border-collapse border border-slate-300 text-[11px]">
                            <tbody>
                                {summaryRows.map((s, idx) => (
                                    <tr
                                        key={idx}
                                        className={s.highlight ? 'bg-slate-100' : ''}
                                    >
                                        <td
                                            className={`border border-slate-300 px-2.5 py-1.5 ${
                                                s.bold ? 'font-bold text-slate-900' : 'text-slate-600'
                                            }`}
                                        >
                                            {s.label}
                                        </td>
                                        <td
                                            className={`border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums ${
                                                s.bold ? 'font-black text-slate-900 text-xs' : 'font-semibold text-slate-800'
                                            }`}
                                        >
                                            {s.value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Area Tanda Tangan */}
            <div className="grid grid-cols-3 gap-8 pt-4 text-center">
                {signatures.map((sig, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <div className="text-[10px] font-semibold text-slate-600 mb-14">
                            {sig.title}
                        </div>
                        <div className="w-40 border-b border-slate-800 pb-0.5 text-[11px] font-bold text-slate-900">
                            {sig.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                            Tanggal: ..../..../........
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Cetakan */}
            <div className="mt-8 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
                <span>Dicetak otomatis oleh Sistem ERP PT Bara Ritel Nusantara</span>
                <span>Waktu cetak: {printedAt}</span>
            </div>
        </div>
    );
}

