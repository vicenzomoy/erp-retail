import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Crown,
    LayoutDashboard,
    Percent,
    ShoppingCart,
    Users,
    ReceiptText,
    Store,
    Menu,
    ChevronDown,
    Building2,
    CheckCircle2,
    AlertCircle,
    Info,
    User,
    LogOut,
    ArrowUpRight,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function OwnerLayout({ title, breadcrumbs = [], pendingCount = 0, children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Eksekutif',
            items: [
                {
                    name: 'Executive Dashboard',
                    route: 'owner.dashboard',
                    icon: LayoutDashboard,
                    active: route().current('owner.dashboard') || route().current('owner.'),
                },
            ],
        },
        {
            group: 'Persetujuan & Kebijakan',
            items: [
                {
                    name: 'Persetujuan Diskon',
                    route: 'owner.approvals.discounts',
                    icon: Percent,
                    active: route().current('owner.approvals.discounts*'),
                    badge: pendingCount > 0 ? pendingCount : null,
                },
            ],
        },
        {
            group: 'Akses Cepat Modul',
            items: [
                {
                    name: 'Sales & Penawaran',
                    route: 'sales.overview',
                    icon: ShoppingCart,
                    external: true,
                },
                {
                    name: 'CRM Prospek',
                    route: 'crm.overview',
                    icon: Users,
                    external: true,
                },
                {
                    name: 'Invoicing & Kas',
                    route: 'invoicing.overview',
                    icon: ReceiptText,
                    external: true,
                },
                {
                    name: 'Point of Sale (Kasir)',
                    route: 'pos.overview',
                    icon: Store,
                    external: true,
                },
            ],
        },
    ];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800 flex flex-col">
            {/* Odoo Web Top Bar (Odoo 17 Dark Navigation Header) */}
            <header className="h-12 bg-slate-900 border-b border-amber-900/30 text-white flex items-center justify-between px-3 sticky top-0 z-40 select-none shadow-sm">
                <div className="flex items-center gap-3">
                    {/* App Switcher (Odoo 9-dots icon) */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('home'))}
                        title="Kembali ke Beranda Aplikasi"
                        className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-slate-200 hover:bg-amber-600 hover:text-white transition cursor-pointer"
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

                    {/* Toggle Sidebar */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    <span className="h-4 w-px bg-slate-700"></span>

                    {/* App Name */}
                    <Link
                        href={route('owner.dashboard')}
                        className="flex items-center gap-2 font-bold tracking-tight text-white hover:text-amber-400 transition"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Dashboard</span>
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
                                            className="hover:text-amber-300 transition font-medium"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-200 font-semibold truncate max-w-[220px]">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Right Profile & Company */}
                <TopBarUserMenu />
            </header>

            {/* Flash Messages Alert */}
            {flash?.success && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span className="font-medium">{flash.error}</span>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Collapsible Left Sidebar */}
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0'
                    } transition-all duration-200 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shrink-0 overflow-y-auto select-none`}
                >
                    <div className="p-3 space-y-4">
                        {navigation.map((section, sIdx) => (
                            <div key={sIdx}>
                                <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {section.group}
                                </h3>
                                <ul className="mt-1 space-y-0.5">
                                    {section.items.map((item, iIdx) => {
                                        const Icon = item.icon;
                                        return (
                                            <li key={iIdx}>
                                                <Link
                                                    href={route(item.route)}
                                                    className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition ${
                                                        item.active
                                                            ? 'bg-amber-600 text-white shadow-xs font-semibold'
                                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 truncate">
                                                        <Icon
                                                            className={`h-4 w-4 shrink-0 ${
                                                                item.active
                                                                    ? 'text-white'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        />
                                                        <span className="truncate">{item.name}</span>
                                                    </div>
                                                    {item.badge && (
                                                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.external && (
                                                        <ArrowUpRight className="h-3 w-3 text-slate-500 shrink-0" />
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-3 border-t border-slate-800 text-[11px] text-slate-500">
                        <p className="font-semibold text-slate-400">Executive Control Room</p>
                        <p className="text-[10px] text-slate-500">Odoo 17 Web Standard ERP</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}

