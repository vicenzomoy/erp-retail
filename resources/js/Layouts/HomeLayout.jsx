import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, User, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HomeLayout({ breadcrumbs = [], fullscreen = false, children }) {
    const { auth, company, flash } = usePage().props;
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    return (
        <div className={`min-h-screen text-slate-800 flex flex-col font-sans ${fullscreen ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950' : 'bg-[#f8fafc]'}`}>
            {/* TOP NAVBAR (Odoo 17 Style) — sama dengan modul lain */}
            <header className={`sticky top-0 z-40 flex h-12 w-full items-center justify-between px-3 sm:px-4 text-white ${fullscreen ? 'bg-black/20 backdrop-blur-sm border-b border-white/10' : 'border-b border-slate-200 bg-slate-900 shadow-sm'}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href={route('home')}
                        title="Beranda"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                        <div className="grid grid-cols-3 gap-0.5 p-1">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <span key={i} className="h-1 w-1 rounded-full bg-white"></span>
                            ))}
                        </div>
                    </Link>
                    <span className="h-4 w-px bg-slate-700"></span>
                    <Link href={route('home')} className="text-sm font-semibold tracking-wide text-white hover:text-blue-400 transition">
                        Bara Wear ERP
                    </Link>
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            <span className="text-slate-600 text-xs">/</span>
                            <span className="text-xs font-semibold text-slate-200">{crumb.label}</span>
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-1.5 rounded-sm bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700/60">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        <span className="font-medium truncate max-w-[170px]">{company?.name || 'PT Bara Ritel Nusantara'}</span>
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            data-testid="user-menu"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 rounded-sm bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white uppercase">
                                {auth?.user?.name ? auth.user.name.substring(0, 2) : 'US'}
                            </div>
                            <span className="hidden md:inline font-medium text-slate-200 truncate max-w-[120px]">{auth?.user?.name}</span>
                            <span className="hidden lg:inline text-[10px] bg-blue-900/80 text-blue-300 font-semibold px-1.5 py-0.5 rounded border border-blue-700/50">
                                {auth?.user?.role_name}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {userDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>
                                <div className="absolute right-0 mt-2 z-50 w-56 rounded-md bg-white p-2 shadow-xl ring-1 ring-black/5 border border-slate-200 text-slate-800">
                                    <div className="border-b border-slate-100 px-3 py-2">
                                        <p className="text-xs font-bold text-slate-900">{auth?.user?.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{auth?.user?.email}</p>
                                        <span className="mt-1 inline-block text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                                            Role: {auth?.user?.role_name}
                                        </span>
                                    </div>
                                    <div className="py-1">
                                        <Link
                                            href={route('profile.edit')}
                                            className="flex items-center gap-2 rounded px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                            Profil Saya
                                        </Link>
                                    </div>
                                    <div className="border-t border-slate-100 pt-1">
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                        >
                                            <LogOut className="h-3.5 w-3.5 text-rose-500" />
                                            Log Out
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className={`flex-1 p-4 sm:p-6 ${fullscreen ? '' : 'bg-[#f8fafc]'}`}>
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

