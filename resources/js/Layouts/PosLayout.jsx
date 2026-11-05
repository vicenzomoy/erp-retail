import React, { useState } from 'react';
import { Link, usePage , router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Store,
    ShoppingCart,
    Receipt,
    BarChart3,
    CalendarDays,
    Menu,
    ChevronDown,
    Building2,
    CheckCircle2,
    AlertCircle,
    Info,
    X,
    User,
    LogOut,
    Play,
} from 'lucide-react';

export default function PosLayout({ title, breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Ringkasan',
            items: [
                {
                    name: 'Overview POS',
                    route: 'pos.overview',
                    icon: LayoutDashboard,
                    active: route().current('pos.overview'),
                },
            ],
        },
        {
            group: 'Operasi',
            items: [
                {
                    name: 'Buka Kasir (Checkout)',
                    route: 'pos.orders.create',
                    icon: ShoppingCart,
                    active: route().current('pos.orders.create'),
                },
                {
                    name: 'Riwayat Transaksi',
                    route: 'pos.orders.index',
                    icon: Receipt,
                    active: route().current('pos.orders.index') || route().current('pos.orders.show'),
                },
                {
                    name: 'Sesi Kasir',
                    route: 'pos.sessions.index',
                    icon: Play,
                    active: route().current('pos.sessions.*'),
                },
            ],
        },
        {
            group: 'Laporan',
            items: [
                {
                    name: 'Ringkasan Harian',
                    route: 'pos.reporting.daily-summary',
                    icon: CalendarDays,
                    active: route().current('pos.reporting.daily-summary'),
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* TOP NAVBAR */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* App Switcher 9-dots */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('home'))}
                        title="Beranda (Aplikasi ERP)"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                    >
                        <div className="grid grid-cols-3 gap-0.5 p-1">
                            {[...Array(9)].map((_, i) => (
                                <span key={i} className="h-1 w-1 rounded-full bg-white" />
                            ))}
                        </div>
                    </button>

                    {/* Toggle Sidebar */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    <span className="h-4 w-px bg-slate-700" />

                    {/* App Name */}
                    <Link
                        href={route('pos.overview')}
                        className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-rose-400 transition"
                    >
                        <Store className="h-4 w-4 text-rose-400" />
                        <span className="text-sm font-semibold tracking-wide">Point of Sale</span>
                    </Link>

                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                            {breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <span className="text-slate-600">/</span>
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-slate-200 transition font-medium">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-200 font-semibold truncate max-w-[200px]">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Company Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 rounded-sm bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700/60">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        <span className="font-medium truncate max-w-[170px]">
                            {company?.name || 'PT Bara Ritel Nusantara'}
                        </span>
                    </div>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 rounded-sm bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-700 text-[11px] font-bold text-white uppercase">
                                {auth?.user?.name ? auth.user.name.substring(0, 2) : 'KS'}
                            </div>
                            <span className="hidden md:inline font-medium text-slate-200 truncate max-w-[120px]">
                                {auth?.user?.name || 'Kasir'}
                            </span>
                            <span className="hidden lg:inline text-[10px] bg-rose-900/80 text-rose-300 font-semibold px-1.5 py-0.5 rounded border border-rose-700/50">
                                {auth?.user?.role_name || 'Cashier'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {userDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 z-50 w-56 rounded-md bg-white p-2 shadow-xl ring-1 ring-black/5 border border-slate-200 text-slate-800">
                                    <div className="border-b border-slate-100 px-3 py-2">
                                        <p className="text-xs font-bold text-slate-900">{auth?.user?.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{auth?.user?.email}</p>
                                        <span className="mt-1 inline-block text-[10px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                            Role: {auth?.user?.role_name}
                                        </span>
                                    </div>
                                    <div className="py-1">
                                        <Link
                                            href={route('profile.edit')}
                                            onClick={() => setUserDropdownOpen(false)}
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
                                            onClick={() => setUserDropdownOpen(false)}
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

            {/* BODY: SIDEBAR + CONTENT */}
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0 -translate-x-full'
                    } transition-all duration-200 ease-in-out shrink-0 bg-white border-r border-slate-200 flex flex-col z-30 overflow-y-auto shadow-xs`}
                >
                    <div className="p-3">
                        <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Modul POS</span>
                            <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Bara Wear
                            </span>
                        </div>

                        <nav className="space-y-4">
                            {navigation.map((section) => (
                                <div key={section.group} className="space-y-1">
                                    <div className="px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        {section.group}
                                    </div>
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={route(item.route)}
                                                    className={`group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-all ${
                                                        item.active
                                                            ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`h-4 w-4 shrink-0 transition-colors ${
                                                            item.active
                                                                ? 'text-rose-400'
                                                                : 'text-slate-400 group-hover:text-slate-700'
                                                        }`}
                                                    />
                                                    <span className="truncate">{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Bottom Sidebar Info */}
                    <div className="mt-auto border-t border-slate-100 p-3 bg-slate-50/50 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium mb-0.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>Lokasi: TOKO-PKU</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Gerai Utama Pekanbaru</div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 flex items-center justify-between rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="font-medium">{flash.success}</span>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 flex items-center justify-between rounded border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-xs">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                <span className="font-medium">{flash.error}</span>
                            </div>
                        </div>
                    )}

                    {flash?.info && (
                        <div className="mb-4 flex items-center justify-between rounded border border-blue-300 bg-blue-50 px-4 py-3 text-xs text-blue-800 shadow-xs">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                <span className="font-medium">{flash.info}</span>
                            </div>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}

