import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileSearch,
    ArrowLeft,
    Home,
    LogIn,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function NotFound({
    status = 404,
    title = 'Halaman Tidak Ditemukan',
    message = 'Maaf, halaman atau dokumen yang Anda cari tidak ditemukan atau telah dipindahkan.',
    attemptedPath = '',
}) {
    const pageProps = usePage().props || {};
    const auth = pageProps.auth;
    const company = pageProps.company;
    const isAuthenticated = Boolean(auth?.user);

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(isAuthenticated ? route('home') : route('login'));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            <Head title="404 - Halaman Tidak Ditemukan" />

            {/* Top Navbar Odoo 17 Style */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href={isAuthenticated ? route('home') : route('login')}
                        title="Beranda (Bara Wear ERP)"
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
                        href={isAuthenticated ? route('home') : route('login')}
                        className="text-sm font-semibold tracking-wide text-white hover:text-emerald-400 transition"
                    >
                        Bara Wear ERP
                    </Link>
                    <span className="text-slate-600 text-xs">/</span>
                    <span className="text-xs font-semibold text-slate-300">
                        404 Tidak Ditemukan
                    </span>
                </div>

                <TopBarUserMenu />
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="mx-auto w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 sm:p-12 shadow-xs text-center">
                    <div className="mx-auto max-w-md space-y-5">
                        {/* Icon */}
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            <FileSearch className="h-8 w-8" />
                        </div>

                        {/* Status & Title */}
                        <div className="space-y-2">
                            <span className="inline-block rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-800 border border-amber-200">
                                Error {status}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                {title}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                {message}
                            </p>
                            {attemptedPath && (
                                <div className="pt-1">
                                    <code className="inline-block rounded bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-600 border border-slate-200">
                                        {attemptedPath}
                                    </code>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Kembali</span>
                            </button>

                            {isAuthenticated ? (
                                <Link
                                    href={route('home')}
                                    className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                                >
                                    <Home className="h-4 w-4" />
                                    <span>Ke Beranda Aplikasi</span>
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span>Ke Halaman Login</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

