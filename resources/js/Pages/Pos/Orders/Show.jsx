import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import OdooFormFooter from '@/Components/Odoo/OdooFormFooter';
import {
    Receipt,
    CheckCircle2,
    DollarSign,
    Package,
    User,
    BookOpen,
    ExternalLink,
    Printer,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function OrderShow({ order, journal_lines, relatedDocs = [], audit_logs = [] }) {
    const paymentLabel = { cash: 'Tunai', qris: 'QRIS', card: 'Kartu Debit/Kredit' };

    return (
        <PosLayout
            title={`Struk ${order.id}`}
            breadcrumbs={[
                { label: 'Riwayat Transaksi', href: route('pos.orders.index') },
                { label: order.id },
            ]}
        >
            <Head title={`Struk ${order.id} — POS Bara Wear`} />

            <div className="print:hidden">
            {/* Smart Buttons */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Lunas
                </div>
                <Link
                    href={route('pos.sessions.show', order.pos_session_id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-rose-300 hover:text-rose-700 transition"
                >
                    <Receipt className="h-3.5 w-3.5 text-rose-500" />
                    Sesi: {order.pos_session_id}
                    <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                    onClick={() => window.print()}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak Struk
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Receipt Card */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Header Info */}
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Detail Transaksi</h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                            </span>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Kode Order</p>
                                <p className="text-sm font-mono font-bold text-rose-700">{order.id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Waktu Transaksi</p>
                                <p className="text-sm font-semibold text-slate-900">{order.paid_at}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Kasir</p>
                                <p className="text-sm font-semibold text-slate-900">{order.cashier_name}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Lokasi Gerai</p>
                                <p className="text-sm font-semibold text-slate-900">{order.location_code}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Pelanggan</p>
                                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    {order.customer_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Metode Bayar</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {paymentLabel[order.payment_method] ?? order.payment_method}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3">
                            <h2 className="text-sm font-bold text-slate-900">Item Pembelian</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2.5">Produk / SKU</th>
                                        <th className="px-4 py-2.5 text-right">Qty</th>
                                        <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                        <th className="px-4 py-2.5 text-right">DPP</th>
                                        <th className="px-4 py-2.5 text-right">PPN (11%)</th>
                                        <th className="px-4 py-2.5 text-right">Total</th>
                                        <th className="px-4 py-2.5 text-right">HPP (COGS)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5">
                                                <p className="font-semibold text-slate-900">{line.product_name}</p>
                                                <p className="text-[11px] text-slate-500">{line.size} / {line.color}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{line.variant_sku}</p>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold">{line.qty}</td>
                                            <td className="px-4 py-2.5 text-right">{formatRp(line.unit_price)}</td>
                                            <td className="px-4 py-2.5 text-right">{formatRp(line.subtotal_before_tax)}</td>
                                            <td className="px-4 py-2.5 text-right">{formatRp(line.tax_amount)}</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRp(line.line_total)}</td>
                                            <td className="px-4 py-2.5 text-right text-amber-700 font-semibold">{formatRp(line.cogs_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Summary */}
                        <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                            <div className="max-w-xs ml-auto space-y-2">
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>Subtotal (DPP)</span>
                                    <span className="font-semibold">{formatRp(order.subtotal_before_tax)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>PPN (11%)</span>
                                    <span className="font-semibold">{formatRp(order.total_tax)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                                    <span>GRAND TOTAL</span>
                                    <span className="text-rose-700">{formatRp(order.grand_total)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>Tunai Diterima</span>
                                    <span className="font-semibold">{formatRp(order.cash_tendered)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-emerald-700 border-t border-slate-200 pt-2">
                                    <span>KEMBALIAN</span>
                                    <span className="text-base">{formatRp(order.change_given)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Odoo Form Footer: Related Docs | Log Notes | Audit / History (khusus Auditor) */}
                <div className="lg:col-span-3">
                    <OdooFormFooter
                        documentType="pos_order"
                        documentId={order.id}
                        relatedDocs={relatedDocs}
                        auditLogs={audit_logs}
                    />
                </div>
            </div>
            </div>

            {/* ===== PRINTABLE POS RECEIPT (Struk Kasir Asli) ===== */}
            <div className="hidden print:block mx-auto w-full max-w-[82mm] py-2 font-mono text-[11px] leading-snug text-slate-950">
                {/* Store Header */}
                <div className="text-center border-b border-dashed border-slate-900 pb-2.5 mb-2.5">
                    <p className="text-sm font-black tracking-wider uppercase">BARA WEAR BOUTIQUE</p>
                    <p className="text-[10px] font-bold">PT Bara Ritel Nusantara</p>
                    <p className="text-[10px]">Gerai: {order.location_code} — Pekanbaru</p>
                    <p className="text-[9px] text-slate-700">Jl. Jend. Sudirman No. 88, Pekanbaru</p>
                    <p className="text-[9px] text-slate-700">NPWP: 01.234.567.8-216.000</p>
                </div>

                {/* Receipt Metadata */}
                <div className="space-y-0.5 border-b border-dashed border-slate-900 pb-2.5 mb-2.5 text-[10px]">
                    <div className="flex justify-between">
                        <span>No. Struk</span>
                        <span className="font-bold">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Sesi Kasir</span>
                        <span>{order.pos_session_id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Waktu</span>
                        <span>{order.paid_at}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kasir</span>
                        <span>{order.cashier_name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pelanggan</span>
                        <span className="truncate max-w-[45mm] text-right">{order.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pembayaran</span>
                        <span className="font-semibold uppercase">
                            {paymentLabel[order.payment_method] ?? order.payment_method}
                        </span>
                    </div>
                </div>

                {/* Purchased Items */}
                <div className="space-y-2 border-b border-dashed border-slate-900 pb-2.5 mb-2.5">
                    {order.lines.map((line) => (
                        <div key={line.id}>
                            <div className="font-bold text-slate-950">
                                {line.product_name} ({line.size}/{line.color})
                            </div>
                            <div className="text-[9px] text-slate-600">{line.variant_sku}</div>
                            <div className="flex justify-between text-[10px] mt-0.5">
                                <span>
                                    {line.qty} x {formatRp(line.unit_price)}
                                </span>
                                <span className="font-bold">{formatRp(line.subtotal_before_tax)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 border-b border-dashed border-slate-900 pb-2.5 mb-2.5 text-[10px]">
                    <div className="flex justify-between">
                        <span>Subtotal (DPP)</span>
                        <span>{formatRp(order.subtotal_before_tax)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>PPN (11%)</span>
                        <span>{formatRp(order.total_tax)}</span>
                    </div>
                    {order.grand_total - (order.subtotal_before_tax + order.total_tax) !== 0 && (
                        <div className="flex justify-between">
                            <span>Pembulatan</span>
                            <span>
                                {formatRp(order.grand_total - (order.subtotal_before_tax + order.total_tax))}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs font-black border-t border-dashed border-slate-900 pt-1.5 mt-1">
                        <span>GRAND TOTAL</span>
                        <span>{formatRp(order.grand_total)}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                        <span>Tunai / Diterima</span>
                        <span>{formatRp(order.cash_tendered)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>KEMBALIAN</span>
                        <span>{formatRp(order.change_given)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center space-y-1 text-[9px]">
                    <p className="font-black text-[10px] tracking-widest">*** LUNAS / PAID ***</p>
                    <p>Terima kasih telah berbelanja di</p>
                    <p className="font-bold">Bara Wear Boutique</p>
                    <p className="text-[8px] text-slate-600 pt-1">
                        Harga sudah termasuk PPN 11%. Simpan struk ini sebagai bukti pembayaran yang sah.
                    </p>
                </div>
            </div>
        </PosLayout>
    );
}

