import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Reusable Odoo 17 Smart Button component for form view headers
 */
export default function OdooSmartButton({
    icon: Icon,
    count,
    label,
    href,
    onClick,
    active = false,
}) {
    const content = (
        <div
            className={`flex items-center gap-2.5 rounded border px-3 py-2 text-left transition-all hover:bg-slate-50 hover:shadow-xs min-w-[120px] ${
                active
                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700'
            }`}
        >
            {Icon && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight text-slate-900">
                    {count}
                </span>
                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                    {label}
                </span>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="inline-block focus:outline-none">
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-block focus:outline-none cursor-pointer"
        >
            {content}
        </button>
    );
}

