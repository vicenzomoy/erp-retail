import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Plus,
    Users,
    BarChart3,
    Menu,
    ChevronDown,
    Building2,
    CheckCircle2,
    AlertCircle,
    Info,
    User,
    LogOut,
} from 'lucide-react';

export default function PurchaseLayout({ title, breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Ringkasan',
            items: [
                {
                    name: 'Overview',
                    route: 'purchase.overview',
                    icon: LayoutDashboard,
                    active: route().current('purchase.overview'),
                },
            ],
        },
        {
            group: 'Pesanan',
            items: [
                {
                    name: 'Pesanan Pembelian (PO)',
                    route: 'purchase.orders.index',
                    icon: ShoppingBag,
                    active: route().current('purchase.orders.*'),
                },
                {
                    name: 'Buat RFQ Baru',
                    route: 'purchase.orders.create',
                    icon: Plus,
                    active: route().current('purchase.orders.create'),
                },
                {
                    name: 'Pemasok (Vendors)',
                    route: 'purchase.vendors.index',
                    icon: Users,
                    active: route().current('purchase.vendors.*'),
                },
            ],
        },
        {
            group: 'Laporan',
            items: [
                {
                    name: 'Analisis Pembelian',
                    route: 'purchase.reporting.index',
                    icon: BarChart3,
                    active: route().current('purchase.reporting.*'),
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* ========================================================= */}
            {/* TOP NAVBAR (Odoo 17 Style) */}
            {/* Kiri: Apps | Purchase   Kanan: User / Company */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                {/* Sisi Kiri: Apps Switcher | Purchase & Breadcrumbs */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* App Switcher 9-dots button */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('home'))}
                        title="Beranda (Aplikasi ERP)"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                    >
                        <div className="grid grid-cols-3 gap-0.5 p-1">
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
                    </button>

                    {/* Toggle Sidebar button */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    {/* Divider */}
                    <span className="h-4 w-px bg-slate-700"></span>

                    {/* App Name: Purchase */}
                    <Link
                        href={route('purchase.overview')}
                        className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-amber-400 transition"
                    >
                        <ShoppingBag className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-semibold tracking-wide">Purchase</span>
                    </Link>

                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                            {breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <span className="text-slate-600">/</span>
                                    {crumb.href ? (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-slate-200 transition font-medium"
                                        >
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

                {/* Sisi Kanan: Company & User profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Company Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 rounded-sm bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 border border-slate-700/60">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        <span className="font-medium truncate max-w-[170px]">
                            {company?.name || 'PT Bara Ritel Nusantara'}
                        </span>
                    </div>

                    {/* User Profile & Role Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 rounded-sm bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white uppercase">
                                {auth?.user?.name ? auth.user.name.substring(0, 2) : 'PR'}
                            </div>
                            <span className="hidden md:inline font-medium text-slate-200 truncate max-w-[120px]">
                                {auth?.user?.name || 'Procurement User'}
                            </span>
                            <span className="hidden lg:inline text-[10px] bg-amber-900/80 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-700/50">
                                {auth?.user?.role_name || auth?.user?.role_id || 'Procurement'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md bg-white py-1 shadow-lg border border-slate-200 z-50 text-slate-700">
                                <div className="px-3 py-2 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-900">{auth?.user?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{auth?.user?.email}</p>
                                    <span className="mt-1 inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                        Peran: {auth?.user?.role_id}
                                    </span>
                                </div>

                                <Link
                                    href={route('home')}
                                    className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                                >
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    Beranda Aplikasi
                                </Link>

                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                                >
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Profil Pengguna
                                </Link>

                                <div className="border-t border-slate-100 my-1"></div>

                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-50 text-rose-600"
                                >
                                    <LogOut className="h-3.5 w-3.5 text-rose-500" />
                                    Keluar (Logout)
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ========================================================= */}
            {/* BODY WRAPPER: SIDEBAR + MAIN CONTENT */}
            {/* ========================================================= */}
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR NAVIGATION (Odoo 17 Menu Tree) */}
                <aside
                    className={`${
                        sidebarOpen ? 'w-56' : 'w-0'
                    } shrink-0 border-r border-slate-200 bg-white transition-all duration-200 overflow-hidden flex flex-col justify-between`}
                >
                    <div className="py-3 overflow-y-auto">
                        <nav className="space-y-4 px-2">
                            {navigation.map((section) => (
                                <div key={section.group}>
                                    <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                                                                ? 'text-amber-400'
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
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Modul Pembelian (Purchase)</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            PT Bara Ritel Nusantara
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT WRAPPER */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
                    {/* Flash messages banner */}
                    {flash?.success && (
                        <div className="mb-4 flex items-center justify-between rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-xs animate-fadeIn">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="font-medium">{flash.success}</span>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 flex items-center justify-between rounded border border-rose-300 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-xs animate-fadeIn">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                <span className="font-medium">{flash.error}</span>
                            </div>
                        </div>
                    )}

                    {flash?.info && (
                        <div className="mb-4 flex items-center justify-between rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-xs animate-fadeIn">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-amber-600 shrink-0" />
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
