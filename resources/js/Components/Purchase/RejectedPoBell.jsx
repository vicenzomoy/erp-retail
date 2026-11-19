import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Bell, XCircle, ArrowRight, CheckCheck } from 'lucide-react';

const formatRp = (val) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val ?? 0);

/**
 * Lonceng notifikasi modul Purchase: PO yang pengajuannya ditolak Finance.
 * Notifikasi hilang setelah dibuka (dibaca), ditandai dibaca, diajukan ulang, atau dibatalkan.
 */
export function markAllPoNotificationsRead(onDone) {
    router.post(route('purchase.notifications.read-all'), {}, {
        preserveScroll: true,
        preserveState: true,
        onFinish: onDone,
    });
}

export default function RejectedPoBell({ notifications = [], canMarkRead = true }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const count = notifications.length;

    const markAllRead = () => markAllPoNotificationsRead(() => setOpen(false));

    useEffect(() => {
        if (!open) return undefined;
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                title={count > 0 ? `${count} PO ditolak Finance` : 'Tidak ada notifikasi'}
                className="relative flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
                <Bell className="h-4 w-4" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold leading-4 text-white text-center">
                        {count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white text-slate-800 shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50 text-xs">
                        <span className="font-bold text-slate-700">Notifikasi Pembelian</span>
                        {count > 0 && canMarkRead && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    {count === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-slate-400">
                            Tidak ada notifikasi baru.
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                            {notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={route('purchase.orders.show', n.id)}
                                    onClick={() => setOpen(false)}
                                    className="flex gap-2.5 px-3 py-2.5 hover:bg-rose-50/60 transition"
                                >
                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-500" />
                                    <div className="min-w-0 text-xs">
                                        <p className="text-slate-800">
                                            <span className="font-mono font-bold">{n.id}</span> ditolak oleh{' '}
                                            <span className="font-semibold">{n.rejected_by}</span>
                                        </p>
                                        <p className="text-slate-500 truncate">
                                            {n.vendor_name} • {formatRp(n.grand_total)}
                                        </p>
                                        {n.reason && (
                                            <p className="mt-0.5 italic text-rose-700 line-clamp-2">"{n.reason}"</p>
                                        )}
                                        <p className="mt-0.5 text-[10px] text-slate-400">{n.time_ago}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    {count > 0 && (
                        <Link
                            href={route('purchase.orders.index', { status: 'rfq' })}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-1 px-3 py-2 border-t border-slate-100 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                        >
                            Lihat semua RFQ / Draft <ArrowRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
