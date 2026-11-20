export const ROLE_BADGE_STYLES = {
    superadmin: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300',
    owner: 'bg-amber-50 text-amber-800 border-amber-300',
    finance: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    sales: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    warehouse: 'bg-teal-50 text-teal-800 border-teal-300',
    procurement: 'bg-orange-50 text-orange-800 border-orange-300',
    cashier: 'bg-rose-50 text-rose-800 border-rose-300',
    auditor: 'bg-slate-100 text-slate-800 border-slate-300',
};

export const ACTION_LABELS = {
    'user_management.user_created': { label: 'Pengguna Dibuat', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'user_management.user_updated': { label: 'Data/Hak Akses Diubah', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'user_management.password_reset': { label: 'Password Direset', style: 'bg-amber-50 text-amber-800 border-amber-200' },
    'user_management.role_access_updated': { label: 'Akses Modul Peran Diubah', style: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
    'settings.user_created': { label: 'Dibuat via Settings', style: 'bg-slate-100 text-slate-700 border-slate-200' },
    'settings.user_updated': { label: 'Diubah via Settings', style: 'bg-slate-100 text-slate-700 border-slate-200' },
};
