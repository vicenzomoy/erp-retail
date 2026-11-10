import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
    Package,
    Scale,
    Store,
    Layers,
} from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900">
            <Head title="Login — Bara Wear ERP" />

            {/* Sisi Kiri: Brand & Visual Enterprise Showcase (Light Theme Konsisten) */}
            <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] relative overflow-hidden bg-slate-100/80 border-r border-slate-200 flex-col justify-between p-12 xl:p-16">
                {/* Dekorasi Cahaya Halus & Grid */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-emerald-200/40 blur-3xl"></div>
                    <div className="absolute top-1/2 -right-28 h-[26rem] w-[26rem] rounded-full bg-indigo-200/35 blur-3xl"></div>
                    <div
                        className="absolute inset-0 opacity-[0.35]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>

                {/* Top Brand Identity */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <img
                            src="/favicon.svg"
                            alt="Bara Wear ERP Logo"
                            className="h-11 w-11 rounded-xl shadow-sm select-none"
                        />
                        <div>
                            <div className="text-base font-extrabold tracking-wide text-slate-900">
                                BARA WEAR
                            </div>
                            <div className="text-[11px] font-medium text-slate-500">
                                PT Bara Ritel Nusantara
                            </div>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Enterprise Resource Planning
                    </span>
                </div>

                {/* Center Hero Headline & Pillar Cards */}
                <div className="relative z-10 max-w-xl my-auto py-8">
                    <div className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs mb-5">
                        <Layers className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Platform Operasional Ritel Terintegrasi</span>
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.2]">
                        Kendali Penuh Rantai Pasok, Gudang, dan Keuangan Ritel dalam Satu Sistem.
                    </h1>

                    <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                        Menghubungkan proses penjualan B2B, operasional kasir gerai fisik,
                        pergerakan stok multi-lokasi, hingga pembukuan akuntansi secara real-time.
                    </p>

                    {/* 3 Kartu Pilar Sistem */}
                    <div className="mt-8 grid grid-cols-3 gap-3.5">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                                <Package className="h-4 w-4" />
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                                Multi-Warehouse
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                Kontrol stok gudang pusat &amp; gerai secara akurat.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
                                <Store className="h-4 w-4" />
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                                Omnichannel Sales
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                Integrasi penuh CRM, Sales Order, dan kasir POS.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200 mb-3">
                                <Scale className="h-4 w-4" />
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                                Akuntansi Presisi
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                Jurnal otomatis, rekonsiliasi kas, dan buku besar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/80 pt-6">
                    <span>&copy; {new Date().getFullYear()} PT Bara Ritel Nusantara</span>
                    <span>Pekanbaru, Riau &bull; Indonesia</span>
                </div>
            </div>

            {/* Sisi Kanan: Form Login Utama */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
                <div className="w-full max-w-sm">
                    {/* Mobile Brand Header */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <img
                            src="/favicon.svg"
                            alt="Bara Wear ERP Logo"
                            className="h-10 w-10 rounded-xl shadow-sm select-none"
                        />
                        <div>
                            <div className="text-sm font-extrabold text-slate-900">
                                BARA WEAR ERP
                            </div>
                            <div className="text-[11px] text-slate-500">
                                PT Bara Ritel Nusantara
                            </div>
                        </div>
                    </div>

                    {/* Heading Form */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            Selamat Datang Kembali
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                            Silakan masuk menggunakan akun email perusahaan Anda.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                            {status}
                        </div>
                    )}

                    {(errors.email || errors.password) && (
                        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <span>{errors.email || errors.password}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                                Email Perusahaan
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    placeholder="nama@barawear.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-slate-700"
                                >
                                    Kata Sandi
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Lupa kata sandi?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    required
                                    placeholder="Masukkan kata sandi"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                                />
                                <span className="text-xs font-medium text-slate-600">
                                    Biarkan saya tetap masuk
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                        >
                            <span>{processing ? 'Memproses...' : 'Masuk'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                        <p className="text-[11px] text-slate-400">
                            Akses sistem dilindungi dan terbatas bagi personel resmi{' '}
                            <span className="font-semibold text-slate-600">
                                PT Bara Ritel Nusantara
                            </span>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
