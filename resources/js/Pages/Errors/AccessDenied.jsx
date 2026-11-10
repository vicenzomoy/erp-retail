import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import InventoryLayout from '@/Layouts/InventoryLayout';
import {
    ShieldAlert,
    ArrowLeft,
    Home,
} from 'lucide-react';
import TopBarUserMenu from '@/Components/Odoo/TopBarUserMenu';

export default function AccessDenied({
    status = 403,
    title = 'Akses Ditolak',
    message = 'Maaf, Anda tidak memiliki izin untuk mengakses halaman atau modul ini.',
    inInventory = false,
}) {
    const { auth, company } = usePage().props;

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(route('home'));
        }
    };

    const content = (
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 sm:p-12 shadow-xs text-center">
            <div className="mx-auto max-w-md space-y-5">
                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                    <ShieldAlert className="h-8 w-8" />
                </div>

                {/* Status & Title */}
                <div className="space-y-2">
                    <span className="inline-block rounded bg-rose-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
                        Error {status}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        {title}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Kembali</span>
                    </button>

                    <Link
                        href={route('home')}
                        className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                    >
                        <Home className="h-4 w-4" />
                        <span>Ke Beranda Aplikasi</span>
                    </Link>
                </div>
            </div>
        </div>
    );

    if (
        inInventory &&
        ['owner', 'warehouse', 'sales', 'procurement'].includes(auth?.user?.role_id)
    ) {
        return (
            <InventoryLayout
                title="Akses Ditolak (403)"
                breadcrumbs={[
                    { label: 'Inventory', href: route('inventory.overview') },
                    { label: 'Akses Ditolak' },
                ]}
            >
                <Head title="403 - Akses Ditolak" />
                {content}
            </InventoryLayout>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
            <Head title="403 - Akses Ditolak" />

            {/* Top Navbar Odoo 17 Style */}
            <header className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b border-slate-200 bg-slate-900 px-3 sm:px-4 text-white shadow-sm">
                <div className="flex items-center gap-3">
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
                    <span className="h-4 w-px bg-slate-700"></span>
                    <span className="text-sm font-semibold tracking-wide text-slate-200">
                        Akses Ditolak
                    </span>
                </div>

                <TopBarUserMenu />
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                {content}
            </main>
        </div>
    );
}
