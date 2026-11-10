import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import HomeLayout from '@/Layouts/HomeLayout';
import { APP_META } from '@/Components/Odoo/appMeta';

// S-01 Beranda App Switcher (F-01) — Light Theme Konsisten dengan Seluruh Modul
export default function Home({ apps }) {
    const { auth, company } = usePage().props;
    const [query, setQuery] = useState('');

    const filtered = apps.filter((a) =>
        a.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    return (
        <HomeLayout>
            <Head title="Beranda — Bara Wear" />

            {/* Dekorasi latar lembut (Light Theme) */}
            <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
                <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"></div>
                <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl"></div>
            </div>

            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center pt-4 sm:pt-8">
                {/* Judul & Identitas Pengguna */}
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    {company?.brand || 'Bara Wear'} ERP
                </h1>
                <p
                    data-testid="identity-line"
                    className="mt-1.5 mb-6 text-center text-xs text-slate-500"
                >
                    Masuk sebagai{' '}
                    <span className="font-bold text-slate-800">{auth.user.name}</span>
                    {' · '}
                    <span className="inline-flex items-center rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {auth.user.role_name}
                    </span>
                    {' · '}
                    <span>{company?.name || 'PT Bara Ritel Nusantara'}</span>
                </p>

                {/* Pencarian Modul */}
                <div className="relative mb-7 w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari modul aplikasi..."
                        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
                    />
                </div>

                {/* Panel Grid Aplikasi (White Sheet Card — Senada dengan Modul Lain) */}
                <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-xs sm:px-10 sm:py-10">
                    <div
                        data-testid="app-grid"
                        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4"
                    >
                        {filtered.map((app) => {
                            const meta = APP_META[app.key];
                            const Icon = meta.icon;
                            return (
                                <Link
                                    key={app.key}
                                    href={app.href}
                                    data-testid={`app-tile-${app.key}`}
                                    className="group flex flex-col items-center rounded-xl p-3 text-center transition hover:bg-slate-50"
                                >
                                    <div
                                        className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl ${meta.color} text-white shadow-md transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg`}
                                    >
                                        <Icon
                                            className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-xs"
                                            strokeWidth={1.8}
                                        />
                                    </div>
                                    <span className="mt-3 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                        {app.name}
                                    </span>
                                    <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                                        {app.desc}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <p className="py-6 text-center text-xs text-slate-400">
                            Tidak ada modul aplikasi yang cocok dengan pencarian.
                        </p>
                    )}
                </div>

                <p className="mt-6 text-center text-[11px] text-slate-400">
                    PT Bara Ritel Nusantara &bull; Enterprise Resource Planning
                </p>
            </div>
        </HomeLayout>
    );
}
