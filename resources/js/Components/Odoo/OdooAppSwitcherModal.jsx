import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ShoppingCart,
    Users,
    Package,
    ShoppingBag,
    ReceiptText,
    Store,
    Settings,
    X,
} from 'lucide-react';

export default function OdooAppSwitcherModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const apps = [
        {
            name: 'Inventory',
            desc: 'Gudang & Persediaan',
            href: route('inventory.overview'),
            icon: Package,
            color: 'bg-emerald-600 text-white',
            active: true,
        },
        {
            name: 'Sales',
            desc: 'Penjualan & Penawaran',
            href: '#',
            icon: ShoppingCart,
            color: 'bg-indigo-600 text-white',
            active: false,
        },
        {
            name: 'CRM',
            desc: 'Lead & Peluang',
            href: '#',
            icon: Users,
            color: 'bg-blue-600 text-white',
            active: false,
        },
        {
            name: 'Purchase',
            desc: 'Pembelian & Vendor',
            href: '#',
            icon: ShoppingBag,
            color: 'bg-amber-600 text-white',
            active: false,
        },
        {
            name: 'Accounting',
            desc: 'Faktur & Buku Besar',
            href: '#',
            icon: ReceiptText,
            color: 'bg-teal-600 text-white',
            active: false,
        },
        {
            name: 'Point of Sale',
            desc: 'Kasir Retail Omnichannel',
            href: '#',
            icon: Store,
            color: 'bg-rose-600 text-white',
            active: false,
        },
        {
            name: 'Settings',
            desc: 'Pengaturan & Hak Akses',
            href: '#',
            icon: Settings,
            color: 'bg-slate-700 text-white',
            active: false,
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs pt-16 px-4 animate-fadeIn">
            <div
                className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-slate-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="grid grid-cols-3 gap-0.5 rounded bg-slate-900 p-1.5 text-white">
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                            <span className="h-1 w-1 rounded-full bg-white"></span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Aplikasi ERP Bara Wear
                            </h3>
                            <p className="text-xs text-slate-500">
                                PT Bara Ritel Nusantara — Omnichannel Retail
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-6">
                    {apps.map((app) => {
                        const Icon = app.icon;
                        return (
                            <Link
                                key={app.name}
                                href={app.href}
                                onClick={onClose}
                                className={`flex flex-col items-center justify-center rounded-xl p-4 text-center transition-all border ${
                                    app.active
                                        ? 'border-emerald-300 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-xs'
                                }`}
                            >
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${app.color} shadow-sm mb-2.5`}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-semibold text-slate-800">
                                    {app.name}
                                </span>
                                <span className="text-[11px] text-slate-400 line-clamp-1">
                                    {app.desc}
                                </span>
                                {app.active && (
                                    <span className="mt-1.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        Aktif
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="border-t border-slate-100 pt-3 text-center">
                    <p className="text-xs text-slate-400">
                        Odoo Web 17.0 Architecture Replica · Laravel 13 & React
                    </p>
                </div>
            </div>
        </div>
    );
}

