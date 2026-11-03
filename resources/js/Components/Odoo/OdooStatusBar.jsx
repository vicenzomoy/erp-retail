import React from 'react';

/**
 * Replicates Odoo 17 Status Pipe / Breadcrumb (e.g., Draft -> Ready -> Done -> Cancelled)
 */
export default function OdooStatusBar({ status, stages = [] }) {
    const defaultStages = [
        { key: 'draft', label: 'Draft' },
        { key: 'ready', label: 'Siap (Ready)' },
        { key: 'done', label: 'Selesai (Done)' },
    ];

    const currentStages = stages.length > 0 ? stages : defaultStages;

    // Check if cancelled
    const isCancelled = status === 'cancelled';

    return (
        <div className="inline-flex items-center rounded border border-slate-200 bg-white text-xs font-medium shadow-xs overflow-hidden">
            {isCancelled ? (
                <div className="bg-rose-50 px-3 py-1.5 text-rose-700 font-semibold border-l-2 border-rose-500">
                    Dibatalkan (Cancelled)
                </div>
            ) : (
                currentStages.map((stage, idx) => {
                    const isCurrent = stage.key === status;
                    const isPassed = currentStages.findIndex(s => s.key === status) > idx;

                    return (
                        <div
                            key={stage.key}
                            className={`relative flex items-center px-3.5 py-1.5 transition-colors ${
                                isCurrent
                                    ? 'bg-slate-900 text-white font-semibold shadow-inner'
                                    : isPassed
                                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                                    : 'bg-white text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <span className="relative z-10 flex items-center gap-1.5">
                                {isPassed && (
                                    <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {stage.label}
                            </span>
                            {/* Arrow separator divider */}
                            {idx < currentStages.length - 1 && (
                                <div
                                    className={`absolute right-0 top-0 h-full w-2.5 translate-x-full border-y-[13px] border-l-[8px] border-y-transparent z-20 pointer-events-none ${
                                        isCurrent ? 'border-l-slate-900' : isPassed ? 'border-l-emerald-50' : 'border-l-white'
                                    }`}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

