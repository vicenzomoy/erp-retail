import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Construction, ArrowLeft } from 'lucide-react';
import HomeLayout from '@/Layouts/HomeLayout';
import { APP_META } from '@/Components/Odoo/appMeta';

export default function ModulePending({ app, section }) {
    const Icon = APP_META[app.key].icon;

    return (
        <HomeLayout breadcrumbs={[{ label: app.name }, ...(section ? [{ label: section }] : [])]}>
            <Head title={app.name} />
            <div className="mx-auto mt-10 max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${APP_META[app.key].color} text-white`}>
                    <Icon className="h-7 w-7" />
                </div>
                <h1 className="text-base font-bold text-slate-900">
                    {app.name}{section ? ` — ${section}` : ''}
                </h1>
                <p className="mt-1 text-xs text-slate-500">{app.desc}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                    <Construction className="h-3.5 w-3.5" /> Modul ini belum dibangun
                </p>
                <div className="mt-6">
                    <Link href={route('home')} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline">
                        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </HomeLayout>
    );
}

