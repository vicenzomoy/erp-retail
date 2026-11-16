import React from 'react';
import { usePage } from '@inertiajs/react';
import AutoDismissAlert from '@/Components/Odoo/AutoDismissAlert';

export default function FlashBanner({ duration = 4500, className = 'mb-4' }) {
    const { flash } = usePage().props;

    if (!flash?.success && !flash?.error && !flash?.info) {
        return null;
    }

    return (
        <>
            {flash?.success && (
                <AutoDismissAlert
                    type="success"
                    message={flash.success}
                    duration={duration}
                    className={className}
                />
            )}
            {flash?.error && (
                <AutoDismissAlert
                    type="error"
                    message={flash.error}
                    duration={duration}
                    className={className}
                />
            )}
            {flash?.info && (
                <AutoDismissAlert
                    type="info"
                    message={flash.info}
                    duration={duration}
                    className={className}
                />
            )}
        </>
    );
}
