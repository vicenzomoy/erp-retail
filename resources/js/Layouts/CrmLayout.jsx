import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Users,
    Columns3,
    ListFilter,
    PlusCircle,
    ShoppingCart,
    Building2,
    ChevronDown,
    Menu,
    LogOut,
    User,
    CheckCircle2,
    AlertCircle,
    Info,
    TrendingUp,
} from 'lucide-react';

export default function CrmLayout({ title, breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Pipeline & Penjualan',
            items: [
                {
                    name: 'Pipeline (Kanban)',
                    route: 'crm.pipeline',
                    icon: Columns3,
                    active: route().current('crm.pipeline') || route().current('crm.overview'),
                },
                {
                    name: 'Daftar Prospek (List)',
                    route: 'crm.leads.index',
                    icon: ListFilter,
                    active: route().current('crm.leads.index'),
                },
                {
                    name: 'Tambah Prospek',
                    route: 'crm.leads.create',
                    icon: PlusCircle,
                    active: route().current('crm.leads.create'),
                },
            ],
        },
        {
            group: 'Aplikasi Terkait',
            items: [
                {
                    name: 'Sales Order & Quotation',
                    route: 'sales.orders.index',
                    icon: ShoppingCart,
                    active: false,
                },
                {
                    name: 'Daftar Pelanggan',
                    route: 'sales.customers.index',
                    icon: Users,
                    active: false,
                },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* ========================================================= */}
            {/* TOP NAVBAR (Odoo 17 Style) */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
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

                    {/* App Name: CRM */}
                    <Link
                        href={route('crm.pipeline')}
                        className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-sky-400 transition"
                    >
                        <Users className="h-4 w-4 text-sky-400" />
                        <span className="text-sm font-semibold tracking-wide">CRM</span>
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
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-[11px] font-bold text-white uppercase">
                                {auth?.user?.name ? auth.user.name.substring(0, 2) : 'SA'}
                            </div>
                            <span className="hidden md:inline font-medium text-slate-200 truncate max-w-[120px]">
                                {auth?.user?.name || 'Sales User'}
                            </span>
                            <span className="hidden lg:inline text-[10px] bg-sky-900/80 text-sky-300 font-semibold px-1.5 py-0.5 rounded border border-sky-700/50">
                                {auth?.user?.role_name || 'Sales'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {userDropdownOpen && (
                            <div
                                className="absolute right-0 mt-1 w-52 rounded-md bg-white py-1 shadow-lg border border-slate-200 z-50 text-slate-700 text-xs animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setUserDropdownOpen(false)}
                            >
                                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                                    <p className="font-semibold text-slate-900 truncate">{auth?.user?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{auth?.user?.email}</p>
                                    <div className="mt-1 flex items-center gap-1">
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wide">
                                            Peran: {auth?.user?.role_id}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href={route('home')}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 text-slate-700 transition"
                                >
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    Beranda Aplikasi
                                </Link>

                                <Link
                                    href={route('profile.edit')}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 text-slate-700 transition"
                                >
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Profil Pengguna
                                </Link>

                                <div className="border-t border-slate-100 my-1"></div>

                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition font-medium"
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
                {/* Odoo Style Left Sidebar Navigation */}
                <aside
                    className={`border-r border-slate-200 bg-white transition-all duration-200 flex flex-col shrink-0 ${
                        sidebarOpen ? 'w-56' : 'w-0 -translate-x-full md:w-0'
                    } overflow-hidden`}
                >
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xs">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-slate-900 tracking-tight">CRM Pipeline</h2>
                                <p className="text-[10px] text-slate-500">Lead &amp; Opportunity</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-2 space-y-4">
                        {navigation.map((group, gIdx) => (
                            <div key={gIdx}>
                                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {group.group}
                                </div>
                                <div className="space-y-0.5">
                                    {group.items.map((item, iIdx) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={iIdx}
                                                href={route(item.route)}
                                                className={`flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition ${
                                                    item.active
                                                        ? 'bg-sky-50 text-sky-800 font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon
                                                    className={`h-4 w-4 ${
                                                        item.active ? 'text-sky-600' : 'text-slate-400'
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

                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                        Odoo 17.0 CRM Pipeline · F-05
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
                    {/* Flash Message Notifications */}
                    {flash?.success && (
                        <div className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 shadow-2xs">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800 shadow-2xs">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {flash?.info && (
                        <div className="mb-4 flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-800 shadow-2xs">
                            <Info className="h-4 w-4 text-sky-600 shrink-0" />
                            <span>{flash.info}</span>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}

