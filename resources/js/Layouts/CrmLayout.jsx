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
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function CrmLayout({ title, breadcrumbs = [], children }) {
    const { auth, company, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            group: 'Pipeline',
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
            group: 'Pelanggan',
            items: [
                {
                    name: 'Daftar Pelanggan',
                    route: 'crm.customers.index',
                    icon: Users,
                    active: route().current('crm.customers.*'),
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
                <TopBarUserMenu />
            </header>

            {/* ========================================================= */}
            {/* BODY WRAPPER: SIDEBAR + MAIN CONTENT */}
            {/* ========================================================= */}
            <div className="flex flex-1 overflow-hidden">
                {/* Odoo Style Left Sidebar Navigation */}
                <aside
                    className={`${sidebarOpen ? 'w-60' : 'w-0 -translate-x-full'
                        } transition-all duration-200 ease-in-out shrink-0 bg-white border-r border-slate-200 flex flex-col z-30 overflow-y-auto shadow-xs`}
                >
                                                    < div className="p-3">
                                                <nav className="space-y-4">
                                                    {navigation.map((group, gIdx) => (
                                                        <div key={gIdx} className="space-y-1">
                                                            <div className="px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                {group.group}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                {group.items.map((item, iIdx) => {
                                                                    const Icon = item.icon;
                                                                    return (
                                                                        <Link
                                                                            key={iIdx}
                                                                            href={route(item.route)}
                                                                            className={`group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-all ${item.active
                                                                                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                                                }`}
                                                                                    >
                                                    <Icon
                                                        className={`h-4 w-4 shrink-0 transition-colors ${
                                                            item.active
                                                                ? 'text-sky-400'
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

                        {/* Bottom Sidebar Info (Konsisten dengan modul lain) */}
                        <div className="mt-auto border-t border-slate-100 p-3 bg-slate-50/50 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium mb-0.5">
                                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                                <span>Modul CRM</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                                Pipeline Peluang &amp; Akuisisi Pelanggan
                            </div>
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

