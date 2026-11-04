import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import PosLayout from '@/Layouts/PosLayout';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    Package,
    User,
    CreditCard,
    Banknote,
    QrCode,
    StopCircle,
    ChevronRight,
} from 'lucide-react';

const formatRp = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num ?? 0);

export default function CheckoutCreate({ session, products, customers }) {
    const [search, setSearch] = useState('');
    const [basket, setBasket] = useState([]); // { variant_sku, name, size, color, qty, unit_price, available_store }
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashTendered, setCashTendered] = useState('');
    const [stockError, setStockError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    // ---- Filtered Products ----
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter(
            (p) =>
                p.variant_sku.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.size?.toLowerCase().includes(q) ||
                p.color?.toLowerCase().includes(q)
        );
    }, [search, products]);

    // ---- Basket Calculations ----
    const basketSubtotal = useMemo(() =>
        basket.reduce((s, item) => s + item.qty * item.unit_price, 0), [basket]);
    const basketTax = useMemo(() =>
        basket.reduce((s, item) => s + Math.round(item.qty * item.unit_price * 0.11), 0), [basket]);
    const basketTotal = useMemo(() => basketSubtotal + basketTax, [basketSubtotal, basketTax]);
    const change = useMemo(() =>
        Math.max(0, parseFloat(cashTendered || 0) - basketTotal), [cashTendered, basketTotal]);
    const cashInsufficient = paymentMethod === 'cash' && cashTendered && parseFloat(cashTendered) < basketTotal;

    // ---- Add to Basket ----
    const addToBasket = (product) => {
        setStockError('');
        setBasket((prev) => {
            const existing = prev.find((i) => i.variant_sku === product.variant_sku);
            if (existing) {
                const newQty = existing.qty + 1;
                if (newQty > product.available_store) {
                    setStockError(`Stok ${product.name} (${product.variant_sku}) di ${session.location_code} hanya ${product.available_store} pcs.`);
                    return prev;
                }
                return prev.map((i) =>
                    i.variant_sku === product.variant_sku ? { ...i, qty: newQty } : i
                );
            }
            if (product.available_store < 1) {
                setStockError(`${product.name} (${product.variant_sku}) tidak tersedia di ${session.location_code}.`);
                return prev;
            }
            return [...prev, {
                variant_sku: product.variant_sku,
                name: product.name,
                size: product.size,
                color: product.color,
                qty: 1,
                unit_price: product.sales_price,
                available_store: product.available_store,
            }];
        });
    };

    const updateQty = (sku, qty) => {
        setStockError('');
        if (qty <= 0) {
            setBasket((prev) => prev.filter((i) => i.variant_sku !== sku));
            return;
        }
        const product = products.find((p) => p.variant_sku === sku);
        if (product && qty > product.available_store) {
            setStockError(`Stok ${product.name} di toko hanya ${product.available_store} pcs.`);
            return;
        }
        setBasket((prev) => prev.map((i) => i.variant_sku === sku ? { ...i, qty } : i));
    };

    const removeItem = (sku) => setBasket((prev) => prev.filter((i) => i.variant_sku !== sku));

    // ---- Quick Cash Buttons ----
    const quickAmounts = useMemo(() => {
        if (!basketTotal) return [];
        const roundups = [
            Math.ceil(basketTotal / 10000) * 10000,
            Math.ceil(basketTotal / 50000) * 50000,
            Math.ceil(basketTotal / 100000) * 100000,
        ];
        return [...new Set(roundups)].filter((a) => a >= basketTotal).slice(0, 3);
    }, [basketTotal]);

    // ---- Submit ----
    const handleCheckout = (e) => {
        e.preventDefault();
        if (basket.length === 0) return;
        if (cashInsufficient) return;

        setSubmitting(true);
        setServerError('');

        router.post(route('pos.orders.store'), {
            pos_session_id: session.id,
            customer_id:    selectedCustomer?.id ?? null,
            payment_method: paymentMethod,
            cash_tendered:  parseFloat(cashTendered || basketTotal),
            lines:          basket.map((item) => ({
                variant_sku: item.variant_sku,
                qty:         item.qty,
                unit_price:  item.unit_price,
            })),
        }, {
            onError: (errs) => {
                setServerError(errs.error || JSON.stringify(errs));
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    if (!session) {
        return (
            <PosLayout title="Kasir" breadcrumbs={[{ label: 'Kasir / Checkout' }]}>
                <Head title="Kasir — POS Bara Wear" />
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-8 text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-amber-800 mb-2">Belum Ada Sesi Aktif</h3>
                    <p className="text-xs text-amber-700 mb-4">
                        Kasir harus membuka sesi POS terlebih dahulu sebelum memproses transaksi.
                    </p>
                    <Link
                        href={route('pos.overview')}
                        className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                    >
                        Buka Sesi Kasir
                    </Link>
                </div>
            </PosLayout>
        );
    }

    return (
        <PosLayout title="Kasir / Checkout" breadcrumbs={[{ label: 'Kasir / Checkout' }]}>
            <Head title="Kasir — POS Bara Wear" />

            {/* ---- Active Session Banner ---- */}
            <div className="mb-4 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-800 font-semibold">Sesi Aktif:</span>
                <span className="font-mono text-emerald-700">{session.id}</span>
                <span className="text-emerald-600">|</span>
                <span className="text-emerald-700">Lokasi: {session.location_code}</span>
                <span className="text-emerald-600">|</span>
                <span className="text-emerald-700">Expected Cash: {formatRp(session.expected_cash)}</span>
                <Link href={route('pos.sessions.show', session.id)} className="ml-auto text-emerald-700 hover:underline flex items-center gap-1">
                    Detail Sesi <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <form onSubmit={handleCheckout}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    {/* ===== LEFT: PRODUCT CATALOG ===== */}
                    <div className="xl:col-span-3 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari produk, SKU, ukuran, warna..."
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white shadow-xs"
                            />
                        </div>

                        {/* Stock Error Alert */}
                        {stockError && (
                            <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {stockError}
                            </div>
                        )}

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredProducts.map((product) => {
                                const inBasket = basket.find((i) => i.variant_sku === product.variant_sku);
                                const isOutOfStock = product.available_store <= 0;

                                return (
                                    <button
                                        key={product.variant_sku}
                                        type="button"
                                        onClick={() => !isOutOfStock && addToBasket(product)}
                                        disabled={isOutOfStock}
                                        className={`relative rounded-lg border p-3 text-left transition-all ${
                                            isOutOfStock
                                                ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                                                : inBasket
                                                ? 'border-rose-400 bg-rose-50 shadow-sm ring-2 ring-rose-400/20'
                                                : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-sm cursor-pointer'
                                        }`}
                                    >
                                        {inBasket && (
                                            <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                                                {inBasket.qty}
                                            </span>
                                        )}
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 mb-2">
                                            <Package className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 leading-tight truncate">{product.name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{product.size} / {product.color}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{product.variant_sku}</p>
                                        <p className="text-sm font-black text-rose-700 mt-1.5">{formatRp(product.sales_price)}</p>
                                        <div className="mt-1 flex items-center gap-1">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                                isOutOfStock
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : product.available_store <= 3
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {isOutOfStock ? 'Habis' : `Stok: ${product.available_store}`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-3 py-10 text-center text-sm text-slate-400">
                                    Produk tidak ditemukan untuk kata kunci "{search}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ===== RIGHT: BASKET + PAYMENT ===== */}
                    <div className="xl:col-span-2 space-y-4">
                        {/* Customer Selector */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-4">
                            <label className="text-xs font-semibold text-slate-700 mb-2 block">
                                <User className="h-3.5 w-3.5 inline-block mr-1 text-slate-400" />
                                Pelanggan (Opsional)
                            </label>
                            <select
                                value={selectedCustomer?.id ?? ''}
                                onChange={(e) => {
                                    const c = customers.find((c) => c.id === e.target.value);
                                    setSelectedCustomer(c ?? null);
                                }}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            >
                                <option value="">— Pelanggan Umum (Tanpa Akun) —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                ))}
                            </select>
                        </div>

                        {/* Basket Items */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-rose-600" />
                                    Keranjang ({basket.length} item)
                                </h3>
                                {basket.length > 0 && (
                                    <button type="button" onClick={() => setBasket([])} className="text-xs text-rose-600 hover:underline">
                                        Kosongkan
                                    </button>
                                )}
                            </div>

                            {basket.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-400">
                                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    Pilih produk untuk ditambahkan
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {basket.map((item) => (
                                        <div key={item.variant_sku} className="px-4 py-3 flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-[11px] text-slate-500">{item.size} / {item.color}</p>
                                                <p className="text-[11px] text-rose-700 font-semibold">{formatRp(item.unit_price)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button type="button"
                                                    onClick={() => updateQty(item.variant_sku, item.qty - 1)}
                                                    className="h-6 w-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <input
                                                    type="number" min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateQty(item.variant_sku, parseInt(e.target.value) || 1)}
                                                    className="w-12 text-center text-xs font-bold border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-rose-400"
                                                />
                                                <button type="button"
                                                    onClick={() => updateQty(item.variant_sku, item.qty + 1)}
                                                    className="h-6 w-6 rounded border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right w-24 shrink-0">
                                                <p className="text-xs font-bold text-slate-900">{formatRp(item.qty * item.unit_price)}</p>
                                                <p className="text-[10px] text-slate-400">+PPN {formatRp(Math.round(item.qty * item.unit_price * 0.11))}</p>
                                            </div>
                                            <button type="button" onClick={() => removeItem(item.variant_sku)}
                                                className="text-rose-400 hover:text-rose-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Totals */}
                            {basket.length > 0 && (
                                <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 space-y-1.5">
                                    <div className="flex justify-between text-xs text-slate-600">
                                        <span>Subtotal (DPP)</span>
                                        <span className="font-semibold">{formatRp(basketSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600">
                                        <span>PPN (11%)</span>
                                        <span className="font-semibold">{formatRp(basketTax)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                                        <span>GRAND TOTAL</span>
                                        <span className="text-rose-700">{formatRp(basketTotal)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        {basket.length > 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white shadow-xs p-4 space-y-3">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Metode Pembayaran</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'cash', label: 'Tunai', icon: Banknote },
                                        { key: 'qris', label: 'QRIS', icon: QrCode },
                                        { key: 'card', label: 'Kartu', icon: CreditCard },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setPaymentMethod(key)}
                                            className={`flex flex-col items-center gap-1 rounded-md border py-2.5 px-2 text-xs font-semibold transition ${
                                                paymentMethod === key
                                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Cash Tendered Input */}
                                {paymentMethod === 'cash' && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                            Uang yang Diterima dari Pelanggan
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                                            <input
                                                type="number" min="0" step="1000"
                                                value={cashTendered}
                                                onChange={(e) => setCashTendered(e.target.value)}
                                                placeholder={basketTotal}
                                                className={`w-full rounded-md border pl-9 pr-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 ${
                                                    cashInsufficient
                                                        ? 'border-rose-400 text-rose-700 focus:border-rose-500 focus:ring-rose-500'
                                                        : 'border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-rose-500'
                                                }`}
                                            />
                                        </div>

                                        {/* Quick Amount Buttons */}
                                        {quickAmounts.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {quickAmounts.map((amt) => (
                                                    <button key={amt} type="button"
                                                        onClick={() => setCashTendered(String(amt))}
                                                        className="flex-1 rounded border border-slate-300 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                                                        {formatRp(amt)}
                                                    </button>
                                                ))}
                                                <button type="button"
                                                    onClick={() => setCashTendered(String(basketTotal))}
                                                    className="flex-1 rounded border border-emerald-300 bg-emerald-50 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                                                    PAS
                                                </button>
                                            </div>
                                        )}

                                        {cashInsufficient && (
                                            <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Uang kurang! Kekurangan: {formatRp(basketTotal - parseFloat(cashTendered))}
                                            </p>
                                        )}

                                        {/* Change */}
                                        {cashTendered && !cashInsufficient && (
                                            <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-emerald-700">KEMBALIAN</span>
                                                    <span className="text-xl font-black text-emerald-800">{formatRp(change)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Server Error */}
                                {serverError && (
                                    <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-start gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        {serverError}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={
                                        basket.length === 0 ||
                                        submitting ||
                                        (paymentMethod === 'cash' && (!cashTendered || cashInsufficient))
                                    }
                                    className="w-full rounded-lg bg-rose-600 py-3 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    {submitting ? (
                                        'Memproses...'
                                    ) : (
                                        <>
                                            Bayar {formatRp(basketTotal)}
                                            {change > 0 && ` → Kembalian ${formatRp(change)}`}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </PosLayout>
    );
}

