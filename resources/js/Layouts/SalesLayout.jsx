import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingCart,
    FileText,
    Plus,
    Users,
    BarChart3,
    RotateCcw,
    Menu,
    ChevronDown,
    Building2,
    CheckCircle2,
    AlertCircle,
    Info,
    User,
    LogOut,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function SalesLayout({ title, breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Ringkasan',
            items: [
                {
                    name: 'Overview',
                    route: 'sales.overview',
                    icon: LayoutDashboard,
                    active: route().current('sales.overview'),
                },
            ],
        },
        {
            group: 'Penjualan',
            items: [
                {
                    name: 'Quotation & Order',
                    route: 'sales.orders.index',
                    icon: FileText,
                    active: route().current('sales.orders.*'),
                },
                {
                    name: 'Retur Pelanggan (RMA)',
                    route: 'sales.returns.index',
                    icon: RotateCcw,
                    active: route().current('sales.returns.*'),
                },
            ],
        },
        {
            group: 'Pelanggan',
            items: [
                {
                    name: 'Daftar Pelanggan',
                    route: 'sales.customers.index',
                    icon: Users,
                    active: route().current('sales.customers.*'),
                },
            ],
        },
        {
            group: 'Laporan',
            items: [
                {
                    name: 'Riwayat Order',
                    route: 'sales.reporting.orders',
                    icon: BarChart3,
                    active: route().current('sales.reporting.*'),
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* ========================================================= */}
            {/* TOP NAVBAR (Odoo 17 Style) */}
            {/* Kiri: Apps | Sales   Kanan: User / Company */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                {/* Sisi Kiri: Apps Switcher | Sales & Breadcrumbs */}
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
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    {/* Divider */}
                    <span className="h-4 w-px bg-slate-700"></span>

                    {/* App Name: Sales */}
                    <Link
                        href={route('sales.overview')}
                        className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-blue-400 transition"
                    >
                        <ShoppingCart className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-semibold tracking-wide">Sales</span>
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
                <TopBarUserMenu />
            </header>

            {/* ========================================================= */}
            {/* BODY CONTAINER: SIDEBAR + CONTENT */}
            {/* ========================================================= */}
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR NAVIGATION */}
                <aside
                    className={`${sidebarOpen ? 'w-60' : 'w-0 -translate-x-full'
                        } transition-all duration-200 ease-in-out shrink-0 bg-white border-r border-slate-200 flex flex-col z-30 overflow-y-auto shadow-xs`}
                >
                    <div className="p-3">
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
                                                    className={`group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-all ${item.active
                                                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`h-4 w-4 shrink-0 transition-colors ${item.active
                                                            ? 'text-blue-400'
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
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span>Modul Penjualan</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Bara Wear
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
                        <div className="mb-4 flex items-center justify-between rounded border border-blue-300 bg-blue-50 px-4 py-3 text-xs text-blue-800 shadow-xs animate-fadeIn">
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
