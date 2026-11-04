import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
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

export default function OrderShow({ order, journal_lines, audit_logs }) {
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
                {order.journal_entry_no && (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        Jurnal: {order.journal_entry_no}
                    </div>
                )}
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

                    {/* Journal Entries */}
                    {journal_lines.length > 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">Jurnal Akuntansi</h2>
                                {order.journal_entry_no && (
                                    <span className="text-xs font-mono text-slate-500">({order.journal_entry_no})</span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-slate-700">
                                    <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                        <tr>
                                            <th className="px-4 py-2.5">Akun</th>
                                            <th className="px-4 py-2.5">Keterangan</th>
                                            <th className="px-4 py-2.5 text-right">Debit</th>
                                            <th className="px-4 py-2.5 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {journal_lines.map((jl, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-mono font-semibold">{jl.account_code}</td>
                                                <td className="px-4 py-2.5 text-slate-600">{jl.description}</td>
                                                <td className="px-4 py-2.5 text-right text-blue-700 font-semibold">
                                                    {jl.debit > 0 ? formatRp(jl.debit) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-rose-700 font-semibold">
                                                    {jl.credit > 0 ? formatRp(jl.credit) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-300 bg-slate-100/50">
                                        <tr>
                                            <td colSpan="2" className="px-4 py-2 text-xs font-black text-slate-700">TOTAL</td>
                                            <td className="px-4 py-2 text-right text-xs font-black text-blue-800">
                                                {formatRp(journal_lines.reduce((s, jl) => s + jl.debit, 0))}
                                            </td>
                                            <td className="px-4 py-2 text-right text-xs font-black text-rose-800">
                                                {formatRp(journal_lines.reduce((s, jl) => s + jl.credit, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Audit Log */}
                <div>
                    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                            <h2 className="text-sm font-bold text-slate-900">Riwayat Aktivitas</h2>
                        </div>
                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {audit_logs.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">Belum ada log.</p>
                            ) : (
                                audit_logs.map((log) => (
                                    <div key={log.id} className="flex gap-2.5">
                                        <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                            <CheckCircle2 className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</p>
                                            {log.notes && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{log.notes}</p>}
                                            <p className="text-[11px] text-slate-400 mt-1">{log.created_at}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PosLayout>
    );
}

