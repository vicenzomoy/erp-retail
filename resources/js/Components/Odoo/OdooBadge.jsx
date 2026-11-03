import React from 'react';

export default function OdooBadge({ status, label, children }) {
    const text = label || children || status;

    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    switch (status?.toLowerCase()) {
        case 'draft':
            colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
            break;
        case 'ready':
        case 'waiting':
            colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
            break;
        case 'done':
        case 'validated':
            colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
            break;
        case 'cancelled':
        case 'rejected':
            colorClass = 'bg-rose-50 text-rose-700 border-rose-300';
            break;
        case 'backorder':
            colorClass = 'bg-purple-50 text-purple-700 border-purple-300 font-semibold';
            break;
        case 'confirmed':
            colorClass = 'bg-blue-50 text-blue-700 border-blue-300 font-semibold';
            break;
        default:
            colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium border ${colorClass}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
            {text}
        </span>
    );
}

