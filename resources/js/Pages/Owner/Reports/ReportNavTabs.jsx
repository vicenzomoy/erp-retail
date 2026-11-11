import React from 'react';
import { Link } from '@inertiajs/react';
import {
    DollarSign,
    BarChart3,
    Award,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeft,
} from 'lucide-react';

export default function ReportNavTabs({ currentTab, title, subtitle, dateBadge }) {
    const tabs = [
        {
            key: 'omset-today',
            name: 'Omset Hari Ini',
            route: 'owner.reports.omset-today',
            icon: DollarSign,
            activeColor: 'bg-emerald-600 text-white',
        },
        {
            key: 'omset-month',
            name: 'Omset Bulan Ini',
            route: 'owner.reports.omset-month',
            icon: BarChart3,
            activeColor: 'bg-blue-600 text-white',
        },
        {
            key: 'gross-profit',
            name: 'Laba Kotor & HPP',
            route: 'owner.reports.gross-profit',
            icon: Award,
            activeColor: 'bg-amber-600 text-white',
        },
        {
            key: 'cash-bank',
            name: 'Kas & Bank',
            route: 'owner.reports.cash-bank',
            icon: Wallet,
            activeColor: 'bg-teal-600 text-white',
        },
        {
            key: 'receivables',
            name: 'Piutang Usaha (AR)',
            route: 'owner.reports.receivables',
            icon: ArrowUpRight,
            activeColor: 'bg-indigo-600 text-white',
        },
        {
            key: 'payables',
            name: 'Utang Usaha (AP)',
            route: 'owner.reports.payables',
            icon: ArrowDownLeft,
            activeColor: 'bg-rose-600 text-white',
        },
    ];

    return (
        <div className="space-y-4 mb-6">
            {/* Top Navigation & Back Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href={route('owner.dashboard')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        title="Kembali ke Dashboard Utama"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Kembali ke Dashboard</span>
                    </Link>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-bold text-slate-900">{title}</h1>
                            {dateBadge && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {dateBadge}
                                </span>
                            )}
                        </div>
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>

            {/* 6 Report Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.key;

                    return (
                        <Link
                            key={tab.key}
                            href={route(tab.route)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
                                isActive
                                    ? `${tab.activeColor} shadow-xs font-bold`
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

