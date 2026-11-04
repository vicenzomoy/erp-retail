import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Truck, ReceiptText, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import SalesLayout from '@/Layouts/SalesLayout';
import OdooStatusBar from '@/Components/Odoo/OdooStatusBar';
import OdooSmartButton from '@/Components/Odoo/OdooSmartButton';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

function getStatusBadge(status, creditHold) {
    if (creditHold) return { cls: 'bg-amber-100 text-amber-700', label: '⚠ Kredit Hold' };
    const map = {
        draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
        confirmed: { cls: 'bg-blue-100 text-blue-700', label: 'Terkonfirmasi' },
        done: { cls: 'bg-emerald-100 text-emerald-700', label: 'Selesai' },
        cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
    };
    return map[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
}

const DELIVERY_STATUS = {
    draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    ready: { cls: 'bg-blue-100 text-blue-700', label: 'Siap' },
    done: { cls: 'bg-emerald-100 text-emerald-700', label: 'Selesai' },
    cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
};

const INVOICE_STATUS = {
    draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    posted: { cls: 'bg-blue-100 text-blue-700', label: 'Diposting' },
    paid: { cls: 'bg-emerald-100 text-emerald-700', label: 'Lunas' },
    cancelled: { cls: 'bg-rose-100 text-rose-700', label: 'Dibatalkan' },
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function SalesOrderShow({ order }) {
    const { flash } = usePage().props;

    const stages = [
        { key: 'draft', label: 'Draft' },
        { key: 'confirmed', label: 'Dikonfirmasi' },
        { key: 'done', label: 'Selesai' },
    ];

    const handleConfirm = () => {
        if (confirm('Konfirmasi order ini? Stock akan direservasi.')) {
            router.post(route('sales.orders.confirm', order.id));
        }
    };

    const handleCancel = () => {
        if (confirm('Batalkan order ini?')) {
            router.post(route('sales.orders.cancel', order.id));
        }
    };

    const { cls: statusCls, label: statusLabel } = getStatusBadge(order.status, order.credit_hold);

    const creditLimit = order.customer?.credit_limit ?? 0;
    const openAr = order.customer?.open_ar ?? 0;
    const headroom = creditLimit - openAr;
    const utilPct = creditLimit > 0 ? Math.min((openAr / creditLimit) * 100, 100) : 0;

    return (
        <SalesLayout
            breadcrumbs={[
                { label: 'Orders', href: route('sales.orders.index') },
                { label: order.id },
            ]}
        >
            <Head title={`Order ${order.id}`} />

            {/* ── Smart Buttons ── */}
            <div className="mb-4 flex flex-wrap gap-2">
                <OdooSmartButton
                    icon={Truck}
                    count={order.deliveryOrders?.length ?? order.delivery_orders?.length ?? 0}
                    label="Pengiriman"
                />
                <OdooSmartButton
                    icon={ReceiptText}
                    count={order.customerInvoices?.length ?? order.customer_invoices?.length ?? 0}
                    label="Invoice"
                />
            </div>

            {/* ── Form Header ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <OdooStatusBar status={order.status === 'credit_hold' ? 'confirmed' : order.status} stages={stages} />
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">{order.id}</h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                                {statusLabel}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {order.status === 'draft' && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="flex items-center gap-1.5 rounded bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Konfirmasi Order
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Batalkan
                                </button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Batalkan
                            </button>
                        )}
                    </div>
                </div>

                {/* Credit Hold Warning */}
                {order.credit_hold && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>⚠ Order Ditahan:</strong> Limit kredit pelanggan terlampaui. Order tidak dapat diproses sampai limit kredit disesuaikan atau piutang dilunasi.
                        </span>
                    </div>
                )}
            </div>

            {/* ── Detail Form ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-3 text-xs">
                        <div>
                            <p className="text-slate-500 font-medium mb-0.5">Pelanggan</p>
                            <p className="font-bold text-slate-900 text-sm">{order.customer?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium mb-0.5">Termin Pembayaran</p>
                            <p className="text-slate-800">{order.payment_terms ?? '—'}</p>
                        </div>
                        {order.notes && (
                            <div>
                                <p className="text-slate-500 font-medium mb-0.5">Catatan</p>
                                <p className="text-slate-700 whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-3 text-xs">
                        {/* Credit info */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                            <p className="font-semibold text-slate-700">Informasi Kredit</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">Limit</p>
                                    <p className="font-bold text-slate-900">{formatRp(creditLimit)}</p>
                                </div>
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">AR Terbuka</p>
                                    <p className="font-bold text-rose-600">{formatRp(openAr)}</p>
                                </div>
                                <div className="rounded bg-white border border-slate-200 p-2">
                                    <p className="text-[10px] text-slate-500">Headroom</p>
                                    <p className={`font-bold ${headroom < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRp(headroom)}</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${utilPct > 90 ? 'bg-rose-500' : utilPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${utilPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="space-y-1">
                            {order.confirmed_at && (
                                <div>
                                    <p className="text-slate-500 font-medium">Dikonfirmasi oleh</p>
                                    <p className="text-slate-800">
                                        {(order.confirmed_by?.name ?? order.confirmedBy?.name) ? (
                                            `${order.confirmed_by?.name ?? order.confirmedBy?.name} · `
                                        ) : ''}
                                        {new Date(order.confirmed_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-slate-500 font-medium">Dibuat</p>
                                <p className="text-slate-800">{order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Order Lines ── */}
            <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Baris Order</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Produk</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">SKU</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Qty Order</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 text-emerald-700">Qty Kirim</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 text-blue-700">Qty Invoice</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Harga</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Disc %</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">DPP</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">PPN</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.lines ?? []).map((line) => (
                                <tr key={line.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 font-medium text-slate-900">
                                        {line.product?.name ?? '—'}
                                        {line.product?.size && <span className="text-slate-400"> · {line.product.size}</span>}
                                        {line.product?.color && <span className="text-slate-400">/{line.product.color}</span>}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-slate-500">{line.variant_sku}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{line.qty_ordered}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700">{line.qty_delivered ?? 0}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-blue-700">{line.qty_invoiced ?? 0}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatRp(line.unit_price)}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{line.discount_pct ?? 0}%</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatRp(line.subtotal_before_tax)}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatRp(line.tax_amount)}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">{formatRp(line.line_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
                    <div className="w-72 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal (DPP)</span>
                            <span className="tabular-nums font-medium">{formatRp(order.subtotal_before_tax)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>PPN (11%)</span>
                            <span className="tabular-nums font-medium">{formatRp(order.total_tax)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                            <span>Grand Total</span>
                            <span className="tabular-nums text-sm">{formatRp(order.grand_total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delivery Orders ── */}
            {(order.deliveryOrders?.length > 0 || order.delivery_orders?.length > 0) && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Delivery Orders ({order.deliveryOrders?.length ?? order.delivery_orders?.length})
                        </h2>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. DO</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.deliveryOrders ?? order.delivery_orders ?? []).map((do_) => {
                                const { cls, label } = DELIVERY_STATUS[do_.status] ?? { cls: 'bg-slate-100 text-slate-600', label: do_.status };
                                return (
                                    <tr key={do_.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{do_.id}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Customer Invoices ── */}
            {(order.customerInvoices?.length > 0 || order.customer_invoices?.length > 0) && (
                <div className="rounded-lg border border-slate-200 bg-white shadow-xs mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Customer Invoices ({order.customerInvoices?.length ?? order.customer_invoices?.length})
                        </h2>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">No. Invoice</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Grand Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(order.customerInvoices ?? order.customer_invoices ?? []).map((inv) => {
                                const { cls, label } = INVOICE_STATUS[inv.status] ?? { cls: 'bg-slate-100 text-slate-600', label: inv.status };
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{inv.id}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">{formatRp(inv.grand_total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </SalesLayout>
    );
}
