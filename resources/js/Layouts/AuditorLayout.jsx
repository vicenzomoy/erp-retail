import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShieldCheck, Lock, FileSearch, ArrowLeft } from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function AuditorLayout({ title = 'Audit Trail & Traceability', breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            <Head title={title} />

            {/* TOP NAVBAR (Odoo 17 Style) */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => router.visit(route('home'))}
                        title="Beranda (Aplikasi ERP)"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                    >
                        <div className="grid grid-cols-3 gap-0.5 p-1">
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                        </div>
                    </button>

                    <Link href={route('auditor.index')} className="flex items-center gap-2 font-bold text-sm tracking-tight text-white">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>Audit Trail</span>
                    </Link>

                    <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                        <Lock className="h-3 w-3" />
                        Read-Only Mode
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden md:inline text-xs text-slate-400">
                        {company?.name ?? 'PT Bara Ritel Nusantara'}
                    </span>
                    <TopBarUserMenu user={auth?.user} />
                </div>
            </header>

            {/* SUB-HEADER / BREADCRUMBS */}
            <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                    <Link
                        href={route('home')}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Beranda
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                        <FileSearch className="h-3.5 w-3.5 text-slate-600" />
                        {title}
                    </span>
                    {breadcrumbs.map((b, i) => (
                        <React.Fragment key={i}>
                            <span className="text-slate-300">/</span>
                            {b.href ? (
                                <Link href={b.href} className="text-slate-600 hover:text-slate-900">
                                    {b.label}
                                </Link>
                            ) : (
                                <span className="font-semibold text-slate-900">{b.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Seluruh modul & dokumen hanya dapat dibaca (tanpa hak ubah)
                </span>
            </div>

            {flash?.error && (
                <div className="mx-4 sm:mx-6 mt-4 rounded border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800">
                    {flash.error}
                </div>
            )}

            <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
                {children}
            </main>
        </div>
    );
}

