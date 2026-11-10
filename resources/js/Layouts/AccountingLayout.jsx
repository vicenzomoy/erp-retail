import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Scale,
    BookOpen,
    FileCheck2,
    FileSpreadsheet,
    RotateCcw,
    Wallet,
    Menu,
    CheckCircle2,
    AlertCircle,
    Info,
    Landmark,
    TrendingUp,
    ArrowLeftRight,
    TableProperties,
    Percent,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function AccountingLayout({ title, breadcrumbs = [], children }) {
    const { flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Struktur Menu Odoo 17 Accounting (Bersih, Rapi, Terintegrasi AR + AP + Kas + GL + Laporan)
    const navigation = [
        {
            group: 'Ringkasan',
            items: [
                {
                    name: 'Overview',
                    route: 'accounting.overview',
                    icon: LayoutDashboard,
                    active:
                        route().current('accounting.overview') ||
                        route().current('invoicing.overview'),
                },
            ],
        },
        {
            group: 'Pelanggan (Customers)',
            items: [
                {
                    name: 'Faktur Pelanggan (Invoices)',
                    route: 'accounting.invoices.index',
                    icon: FileCheck2,
                    active:
                        route().current('accounting.invoices.*') ||
                        route().current('invoicing.invoices.*'),
                },
                {
                    name: 'Nota Kredit (Credit Notes)',
                    route: 'accounting.credit-notes.index',
                    icon: RotateCcw,
                    active:
                        route().current('accounting.credit-notes.*') ||
                        route().current('invoicing.credit-notes.*'),
                },
            ],
        },
        {
            group: 'Pemasok (Vendors)',
            items: [
                {
                    name: 'Tagihan Pemasok (Bills)',
                    route: 'accounting.bills.index',
                    icon: FileSpreadsheet,
                    active:
                        route().current('accounting.bills.*') ||
                        route().current('invoicing.bills.*'),
                },
            ],
        },
        {
            group: 'Kas & Pembayaran',
            items: [
                {
                    name: 'Pembayaran (Payments)',
                    route: 'accounting.payments.index',
                    icon: Wallet,
                    active:
                        route().current('accounting.payments.*') ||
                        route().current('invoicing.payments.*'),
                },
            ],
        },
        {
            group: 'Akuntansi (GL)',
            items: [
                {
                    name: 'Jurnal Umum (Journal Entries)',
                    route: 'accounting.journals',
                    icon: BookOpen,
                    active:
                        route().current('accounting.journals') ||
                        route().current('accounting.journals.*'),
                },
            ],
        },
        {
            group: 'Laporan',
            items: [
                {
                    name: 'Neraca Keuangan',
                    route: 'accounting.reports.balance-sheet',
                    icon: Landmark,
                    active: route().current('accounting.reports.balance-sheet'),
                },
                {
                    name: 'Laba dan Rugi',
                    route: 'accounting.reports.profit-loss',
                    icon: TrendingUp,
                    active: route().current('accounting.reports.profit-loss'),
                },
                {
                    name: 'Arus Kas',
                    route: 'accounting.reports.cash-flow',
                    icon: ArrowLeftRight,
                    active: route().current('accounting.reports.cash-flow'),
                },
                {
                    name: 'Neraca Saldo',
                    route: 'accounting.reports.trial-balance',
                    icon: TableProperties,
                    active: route().current('accounting.reports.trial-balance'),
                },
                {
                    name: 'Buku Besar Umum',
                    route: 'accounting.reports.general-ledger',
                    icon: Scale,
                    active:
                        route().current('accounting.reports.general-ledger') ||
                        route().current('accounting.ledger') ||
                        route().current('accounting.gl.*'),
                },
                {
                    name: 'Laporan Pajak',
                    route: 'accounting.reports.tax',
                    icon: Percent,
                    active: route().current('accounting.reports.tax'),
                },
            ],
        },
    ];

    // Normalisasi label breadcrumb lama "Invoicing" menjadi "Accounting"
    const normalizedBreadcrumbs = breadcrumbs.map((crumb) => {
        if (crumb.label === 'Invoicing') {
            return {
                ...crumb,
                label: 'Accounting',
                href: crumb.href ? route('accounting.overview') : undefined,
            };
        }
        return crumb;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            {/* TOP NAVBAR (Odoo 17 Style) */}
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
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    >
                        <Menu className="h-4 w-4" />
                    </button>

                    <span className="h-4 w-px bg-slate-700"></span>

                    {/* App Name: Accounting */}
                    <Link
                        href={route('accounting.overview')}
                        className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-emerald-400 transition"
                    >
                        <Scale className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold tracking-wide">Accounting</span>
                    </Link>

                    {/* Breadcrumbs */}
                    {normalizedBreadcrumbs.length > 0 && (
                        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                            {normalizedBreadcrumbs.map((crumb, idx) => (
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
                                        <span className="text-slate-200 font-semibold truncate max-w-[220px]">
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

            {/* BODY CONTAINER */}
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR NAVIGATION */}
                <aside
                    className={`${
                        sidebarOpen ? 'w-60' : 'w-0 -translate-x-full'
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
                                                    className={`group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-all ${
                                                        item.active
                                                            ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <Icon
                                                        className={`h-4 w-4 shrink-0 transition-colors ${
                                                            item.active
                                                                ? 'text-emerald-400'
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

                    <div className="mt-auto border-t border-slate-100 p-3 bg-slate-50/50 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium mb-0.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Akuntansi &amp; Invoicing Terpadu</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            AR, AP, Rekonsiliasi Kas &amp; Buku Besar
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
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
