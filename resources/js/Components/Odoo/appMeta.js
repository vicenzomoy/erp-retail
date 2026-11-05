import {
    ShoppingCart,
    Users,
    Package,
    ShoppingBag,
    ReceiptText,
    Store,
    Settings,
} from 'lucide-react';

// Ikon & warna tile per app (daftar & hak akses datang dari server: props.apps).
// Semua tile memakai pola yang sama: gradasi warna jenuh + ikon putih.
// Class ditulis utuh agar terdeteksi Tailwind.
export const APP_META = {
    sales: { icon: ShoppingCart, color: 'bg-gradient-to-br from-indigo-400 to-indigo-600', glow: 'shadow-indigo-500/40' },
    crm: { icon: Users, color: 'bg-gradient-to-br from-sky-400 to-blue-600', glow: 'shadow-blue-500/40' },
    inventory: { icon: Package, color: 'bg-gradient-to-br from-emerald-400 to-emerald-600', glow: 'shadow-emerald-500/40' },
    purchase: { icon: ShoppingBag, color: 'bg-gradient-to-br from-amber-400 to-orange-600', glow: 'shadow-orange-500/40' },
    accounting: { icon: ReceiptText, color: 'bg-gradient-to-br from-teal-400 to-cyan-600', glow: 'shadow-cyan-500/40' },
    pos: { icon: Store, color: 'bg-gradient-to-br from-rose-400 to-rose-600', glow: 'shadow-rose-500/40' },
    settings: { icon: Settings, color: 'bg-gradient-to-br from-violet-400 to-purple-600', glow: 'shadow-purple-500/40' },
};
