import React from 'react';

const formatTanggal = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Surat Jalan (Delivery Note) A4 untuk Delivery Order.
 * Hanya tampil saat dicetak (hidden print:block). Kuantitas yang dicetak:
 * - pengiriman sudah divalidasi -> kuantitas terkirim (qty_done)
 * - belum divalidasi -> kuantitas yang akan dikirim (input saat ini / permintaan)
 */
export default function SuratJalanPrint({ delivery, lines = [], companyName = 'PT Bara Ritel Nusantara' }) {
    const items = lines.filter((l) => Number(l.qty) > 0);
    const totalQty = items.reduce((sum, l) => sum + Number(l.qty), 0);

    return (
        <div className="hidden print:block w-full bg-white text-slate-900 text-[11px] leading-relaxed font-sans">
            {/* Kop surat */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
                <div>
                    <div className="text-lg font-black tracking-tight uppercase">{companyName}</div>
                    <div className="text-[11px] font-semibold text-slate-700">Bara Wear — Retail Fashion &amp; Apparel</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                        Gudang: {delivery.location_from_name || delivery.location_from} &bull; Jl. Jenderal Sudirman No. 128, Pekanbaru, Riau 28116
                    </div>
                    <div className="text-[10px] text-slate-600">Telp: (0761) 555-0192 &bull; NPWP: 01.234.567.8-211.000</div>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-black uppercase tracking-wider">Surat Jalan</h1>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Delivery Note</div>
                </div>
            </div>

            {/* Tujuan & info dokumen */}
            <div className="grid grid-cols-2 gap-5 mb-4">
                <div className="rounded border border-slate-400 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Kepada Yth. / Dikirim Kepada
                    </div>
                    <div className="text-sm font-bold">{delivery.customer_name}</div>
                    {delivery.customer_address ? (
                        <>
                            <div className="mt-0.5 whitespace-pre-line">{delivery.customer_address}</div>
                            {delivery.customer_city && !delivery.customer_address.includes(delivery.customer_city) && (
                                <div>{delivery.customer_city}</div>
                            )}
                        </>
                    ) : (
                        // Alamat pelanggan belum diisi di master: gunakan alamat tujuan dari dokumen pengiriman
                        <div className="mt-0.5 whitespace-pre-line">
                            {delivery.location_to || delivery.customer_city || '—'}
                        </div>
                    )}
                </div>
                <div className="rounded border border-slate-400 p-3">
                    <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="py-0.5 text-slate-500 w-32">No. Surat Jalan</td>
                                <td className="py-0.5 font-mono font-bold">: {delivery.id}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5 text-slate-500">Tanggal Kirim</td>
                                <td className="py-0.5 font-semibold">: {formatTanggal(delivery.scheduled_date)}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5 text-slate-500">No. Pesanan (SO)</td>
                                <td className="py-0.5 font-mono font-semibold">: {delivery.sales_order_id}</td>
                            </tr>
                            {delivery.is_backorder && delivery.parent_delivery_id && (
                                <tr>
                                    <td className="py-0.5 text-slate-500">Lanjutan dari</td>
                                    <td className="py-0.5 font-mono">: {delivery.parent_delivery_id} (Backorder)</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mb-2">Dengan hormat, bersama ini kami kirimkan barang-barang sebagai berikut:</p>

            {/* Daftar barang */}
            <table className="w-full border-collapse border border-slate-500 mb-3">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-500 px-2 py-1.5 w-8 text-center">No</th>
                        <th className="border border-slate-500 px-2 py-1.5 text-left w-32">Kode Barang</th>
                        <th className="border border-slate-500 px-2 py-1.5 text-left">Nama Barang</th>
                        <th className="border border-slate-500 px-2 py-1.5 text-center w-16">Qty</th>
                        <th className="border border-slate-500 px-2 py-1.5 text-center w-16">Satuan</th>
                        <th className="border border-slate-500 px-2 py-1.5 text-left w-36">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="border border-slate-500 px-2 py-4 text-center text-slate-500">
                                Tidak ada barang yang dikirim.
                            </td>
                        </tr>
                    ) : (
                        items.map((l, idx) => (
                            <tr key={l.id}>
                                <td className="border border-slate-500 px-2 py-1.5 text-center">{idx + 1}</td>
                                <td className="border border-slate-500 px-2 py-1.5 font-mono">{l.variant_sku}</td>
                                <td className="border border-slate-500 px-2 py-1.5">
                                    {l.product_name}
                                    {(l.size || l.color) && (
                                        <span className="text-slate-600">
                                            {' '}— {[l.size && `Ukuran ${l.size}`, l.color].filter(Boolean).join(', ')}
                                        </span>
                                    )}
                                </td>
                                <td className="border border-slate-500 px-2 py-1.5 text-center font-bold tabular-nums">{l.qty}</td>
                                <td className="border border-slate-500 px-2 py-1.5 text-center">{l.unit || 'pcs'}</td>
                                <td className="border border-slate-500 px-2 py-1.5"></td>
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-bold">
                        <td colSpan={3} className="border border-slate-500 px-2 py-1.5 text-right uppercase">Total</td>
                        <td className="border border-slate-500 px-2 py-1.5 text-center tabular-nums">{totalQty}</td>
                        <td colSpan={2} className="border border-slate-500 px-2 py-1.5"></td>
                    </tr>
                </tfoot>
            </table>

            {delivery.notes && (
                <div className="mb-3">
                    <span className="font-semibold">Catatan:</span> {delivery.notes}
                </div>
            )}

            <p className="mb-6 text-[10px] text-slate-600 italic">
                Barang telah diterima dalam keadaan baik dan jumlah sesuai. Mohon periksa barang sebelum menandatangani surat jalan ini.
            </p>

            {/* Tanda tangan */}
            <div className="grid grid-cols-3 gap-6 text-center break-inside-avoid">
                {[
                    { title: 'Diterima Oleh', sub: delivery.customer_name },
                    { title: 'Pengirim / Sopir', sub: '' },
                    { title: 'Hormat Kami', sub: companyName },
                ].map((sig) => (
                    <div key={sig.title} className="flex flex-col items-center">
                        <div className="font-semibold">{sig.title}</div>
                        <div className="text-[10px] text-slate-500 min-h-[14px]">{sig.sub}</div>
                        <div className="h-16" />
                        <div className="w-44 border-b border-slate-800" />
                        <div className="text-[10px] text-slate-500 mt-0.5">Nama jelas &amp; tanda tangan</div>
                        <div className="text-[10px] text-slate-500">Tanggal: ____/____/______</div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-400">
                <span>Lembar 1: Pelanggan &bull; Lembar 2: Gudang &bull; Lembar 3: Arsip</span>
                <span>Dicetak dari Sistem ERP {companyName}</span>
            </div>
        </div>
    );
}
