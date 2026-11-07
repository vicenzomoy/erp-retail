import React from 'react';

/**
 * Replicates Odoo 17 Status Pipe / Breadcrumb (e.g., Draft -> Confirmed -> Done -> Cancelled)
 * Uses seamless SVG chevron dividers to prevent CSS subpixel stacking/overlapping box artifacts.
 */
export default function OdooStatusBar({
    status,
    current,
    currentStep,
    stages = [],
    steps = [],
}) {
    const activeStatus = status || current || currentStep;
    const providedStages = (stages && stages.length > 0) ? stages : (steps && steps.length > 0 ? steps : []);
    const defaultStages = [
        { key: 'draft', label: 'Draft' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'done', label: 'Done' },
    ];

    const currentStages = providedStages.length > 0 ? providedStages : defaultStages;

    // Check if cancelled
    const isCancelled = activeStatus === 'cancelled';

    // Helper to check stage match (supports array of keys and interchangeable rfq/draft)
    const matchesStage = (stage, st) => {
        if (!stage || !st) return false;
        if (Array.isArray(stage.key)) {
            return stage.key.includes(st);
        }
        if (stage.key === st) return true;
        if ((stage.key === 'draft' && st === 'rfq') || (stage.key === 'rfq' && st === 'draft')) {
            return true;
        }
        return false;
    };

    const currentStageIndex = currentStages.findIndex((s) => matchesStage(s, activeStatus));

    const getStageStyle = (stage, idx) => {
        const isCurrent = matchesStage(stage, activeStatus);
        const isPassed = currentStageIndex > -1 && currentStageIndex > idx;

        if (isCurrent) {
            return {
                bgColor: '#0f172a', // slate-900
                textColor: 'text-white font-bold',
                isCurrent: true,
                isPassed: false,
                strokeColor: '#0f172a',
            };
        }
        if (isPassed) {
            return {
                bgColor: '#ecfdf5', // emerald-50
                textColor: 'text-emerald-800 font-medium',
                isCurrent: false,
                isPassed: true,
                strokeColor: '#a7f3d0', // emerald-200
            };
        }
        return {
            bgColor: '#ffffff', // white
            textColor: 'text-slate-500 font-medium',
            isCurrent: false,
            isPassed: false,
            strokeColor: '#e2e8f0', // slate-200
        };
    };

    return (
        <div className="inline-flex items-stretch rounded border border-slate-200 bg-white text-xs font-medium shadow-xs overflow-hidden h-8">
            {isCancelled ? (
                <div className="bg-rose-50 px-3.5 flex items-center text-rose-700 font-semibold border-l-2 border-rose-500">
                    Dibatalkan (Cancelled)
                </div>
            ) : (
                currentStages.map((stage, idx) => {
                    const style = getStageStyle(stage, idx);
                    const nextStage = currentStages[idx + 1];
                    const nextStyle = nextStage ? getStageStyle(nextStage, idx + 1) : null;

                    return (
                        <React.Fragment key={Array.isArray(stage.key) ? stage.key.join('-') : stage.key}>
                            {/* Stage Item */}
                            <div
                                className={`flex items-center px-3.5 transition-colors select-none ${style.textColor}`}
                                style={{ backgroundColor: style.bgColor }}
                            >
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                    {style.isPassed && (
                                        <svg
                                            className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2.5"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                    {stage.label}
                                </span>
                            </div>

                            {/* Seamless SVG Arrow Divider between stages */}
                            {idx < currentStages.length - 1 && nextStyle && (
                                <div
                                    className="relative w-3.5 shrink-0 overflow-hidden"
                                    style={{ backgroundColor: nextStyle.bgColor }}
                                >
                                    <svg
                                        className="absolute inset-0 h-full w-full pointer-events-none"
                                        viewBox="0 0 14 32"
                                        preserveAspectRatio="none"
                                    >
                                        {/* Wedge shape filled with current stage background */}
                                        <path
                                            d="M0,0 L14,16 L0,32 Z"
                                            fill={style.bgColor}
                                        />
                                        {/* Crisp divider stroke along the arrow edge */}
                                        <path
                                            d="M0,0 L14,16 L0,32"
                                            fill="none"
                                            stroke={style.isCurrent ? '#0f172a' : (nextStyle.isCurrent ? '#0f172a' : style.strokeColor)}
                                            strokeWidth="1.2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })
            )}
        </div>
    );
}
