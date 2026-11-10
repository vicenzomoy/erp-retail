import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, LogOut } from 'lucide-react';

/**
 * Komponen Sisi Kanan Top Navbar Odoo 17 (Company Badge + User & Role Dropdown).
 * Digunakan bersama di seluruh Layout Modul agar warna avatar, badge role,
 * dan menu dropdown 100% konsisten saat berpindah antar modul.
 */
export default function TopBarUserMenu() {
    const { auth, company } = usePage().props || {};
    const [open, setOpen] = useState(false);

    const user = auth?.user;
    const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'US';
    const roleLabel = user?.role_name || (user?.role_id ? user.role_id.toUpperCase() : 'User');

    return (
        <div className="flex items-center gap-2 sm:gap-4">
            {/* Company Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-sm bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700/60">
                <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-medium truncate max-w-[170px]">
                    {company?.name || 'PT Bara Ritel Nusantara'}
                </span>
            </div>

            {/* User Profile & Role Dropdown */}
            {user && (
                <div className="relative">
                    <button
                        type="button"
                        data-testid="user-menu"
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 rounded-sm bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white uppercase shrink-0">
                            {initials}
                        </div>
                        <span className="hidden md:inline font-medium text-slate-200 truncate max-w-[120px]">
                            {user.name}
                        </span>
                        <span className="hidden lg:inline text-[10px] bg-emerald-900/80 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-700/50">
                            {roleLabel}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {open && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 z-50 w-56 rounded-md bg-white p-2 shadow-xl ring-1 ring-black/5 border border-slate-200 text-slate-800">
                                <div className="border-b border-slate-100 px-3 py-2">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {user.email}
                                    </p>
                                    <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        Role: {roleLabel}
                                    </span>
                                </div>

                                <div className="pt-1">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        onClick={() => setOpen(false)}
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
            )}
        </div>
    );
}

