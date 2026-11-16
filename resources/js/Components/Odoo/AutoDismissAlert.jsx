import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const STYLES = {
    success: {
        box: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        iconColor: 'text-emerald-600',
        closeBtn: 'text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800',
        barTrack: 'bg-emerald-200/60',
        barFill: 'bg-emerald-600',
        Icon: CheckCircle2,
    },
    error: {
        box: 'border-rose-300 bg-rose-50 text-rose-800',
        iconColor: 'text-rose-600',
        closeBtn: 'text-rose-600 hover:bg-rose-100 hover:text-rose-800',
        barTrack: 'bg-rose-200/60',
        barFill: 'bg-rose-600',
        Icon: AlertCircle,
    },
    warning: {
        box: 'border-amber-300 bg-amber-50 text-amber-900',
        iconColor: 'text-amber-600',
        closeBtn: 'text-amber-600 hover:bg-amber-100 hover:text-amber-800',
        barTrack: 'bg-amber-200/60',
        barFill: 'bg-amber-500',
        Icon: AlertTriangle,
    },
    info: {
        box: 'border-blue-300 bg-blue-50 text-blue-800',
        iconColor: 'text-blue-600',
        closeBtn: 'text-blue-600 hover:bg-blue-100 hover:text-blue-800',
        barTrack: 'bg-blue-200/60',
        barFill: 'bg-blue-600',
        Icon: Info,
    },
};

export default function AutoDismissAlert({
    message,
    title = null,
    type = 'error',
    duration = 4500,
    onClose,
    className = 'mb-4',
}) {
    const [visible, setVisible] = useState(Boolean(message));
    const [cycleKey, setCycleKey] = useState(0);

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return undefined;
        }

        setVisible(true);
        setCycleKey((k) => k + 1);

        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration]);

    if (!message || !visible) return null;

    const cfg = STYLES[type] || STYLES.error;
    const IconComponent = cfg.Icon;

    const handleManualClose = () => {
        setVisible(false);
        if (onClose) onClose();
    };

    return (
        <div
            className={`relative overflow-hidden rounded border px-4 py-3 pb-3.5 text-xs shadow-xs print:hidden ${cfg.box} ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <IconComponent className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                    <div>
                        {title && <p className="font-semibold mb-0.5">{title}</p>}
                        <div className="font-medium leading-relaxed">{message}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleManualClose}
                    className={`rounded p-0.5 transition cursor-pointer shrink-0 ${cfg.closeBtn}`}
                    title="Tutup"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Countdown Slider Bar (Right -> Left) */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.barTrack}`}>
                <div
                    key={cycleKey}
                    className={`h-full ${cfg.barFill}`}
                    style={{
                        animation: `shrinkProgress ${duration}ms linear forwards`,
                    }}
                />
            </div>
        </div>
    );
}
