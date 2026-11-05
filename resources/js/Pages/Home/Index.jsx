import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import HomeLayout from '@/Layouts/HomeLayout';
import { APP_META } from '@/Components/Odoo/appMeta';

// S-01 Beranda App Switcher (F-01) — gaya Home Menu Odoo 17
export default function Home({ apps }) {
    const { auth, company } = usePage().props;
    const [query, setQuery] = useState('');

    const filtered = apps.filter((a) =>
        a.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <HomeLayout fullscreen>
            <Head title="Beranda" />

            {/* Dekorasi latar */}
            <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
                <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"></div>
                <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl"></div>
            </div>

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center pt-6 sm:pt-12">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {company?.brand} ERP
                </h1>
                <p data-testid="identity-line" className="mt-2 mb-6 text-center text-xs text-white/60">
                    Masuk sebagai <span className="font-semibold text-white">{auth.user.name}</span>
                    {' · '}{auth.user.role_name}{' · '}{company?.name}
                </p>

                <div className="relative mb-8 w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari aplikasi..."
                        className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:border-white/50 focus:outline-none focus:ring-0"
                    />
                </div>

                {/* Panel kaca berisi grid ikon */}
                <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-10 shadow-2xl backdrop-blur-md sm:px-8">
                    <div
                        data-testid="app-grid"
                        className="grid grid-cols-3 gap-x-4 gap-y-10 sm:grid-cols-4"
                    >
                        {filtered.map((app) => {
                            const meta = APP_META[app.key];
                            const Icon = meta.icon;
                            return (
                                <Link
                                    key={app.key}
                                    href={app.href}
                                    data-testid={`app-tile-${app.key}`}
                                    className="group flex flex-col items-center text-center"
                                >
                                    <div
                                        className={`flex h-20 w-20 items-center justify-center rounded-[1.4rem] ${meta.color} text-white shadow-lg ${meta.glow} ring-1 ring-white/30 transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-2xl`}
                                    >
                                        <Icon className="h-10 w-10 drop-shadow" strokeWidth={1.75} />
                                    </div>
                                    <span className="mt-3 text-sm font-semibold text-white">{app.name}</span>
                                    <span className="mt-0.5 line-clamp-1 text-[11px] text-white/50">{app.desc}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <p className="text-center text-sm text-white/60">Tidak ada aplikasi yang cocok.</p>
                    )}
                </div>

                <p className="mt-6 text-center text-[11px] text-white/40">
                    Odoo Web 17.0 Architecture Replica · Laravel 13 &amp; React
                </p>
            </div>
        </HomeLayout>
    );
}
