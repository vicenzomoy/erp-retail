import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function HomeLayout({ breadcrumbs = [], children }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* TOP NAVBAR (Odoo 17 Style — Konsisten dengan seluruh modul) */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href={route('home')}
                        title="Beranda (Aplikasi ERP)"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                        <div className="grid grid-cols-3 gap-0.5 p-1">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <span key={i} className="h-1 w-1 rounded-full bg-white"></span>
                            ))}
                        </div>
                    </Link>
                    <span className="h-4 w-px bg-slate-700"></span>
                    <Link
                        href={route('home')}
                        className="text-sm font-semibold tracking-wide text-white hover:text-emerald-400 transition"
                    >
                        Bara Wear ERP
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <span className="text-slate-600 text-xs">/</span>
                            <span className="text-xs font-semibold text-slate-200">
                                {crumb.label}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                <TopBarUserMenu />
            </header>

            <main className="flex-1 p-4 sm:p-6 bg-[#f8fafc]">
                {flash?.success && (
                    <div className="mb-4 flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 flex items-center gap-2 rounded border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span className="font-medium">{flash.error}</span>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
