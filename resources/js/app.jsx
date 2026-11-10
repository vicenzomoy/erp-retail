import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = 'Bara Wear ERP';

// Pembuat SVG Favicon Dinamis per Modul (Tampil di Tab Browser)
const buildModuleFaviconSvg = (bgFrom, bgTo, innerPaths) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <defs>
            <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="${bgFrom}"/>
                <stop offset="100%" stop-color="${bgTo}"/>
            </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#g)"/>
        <g transform="translate(14, 14) scale(1.5)" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
            ${innerPaths}
        </g>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const MODULE_FAVICONS = {
    owner: buildModuleFaviconSvg(
        '#f59e0b',
        '#b45309',
        '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>'
    ),
    sales: buildModuleFaviconSvg(
        '#6366f1',
        '#4338ca',
        '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'
    ),
    crm: buildModuleFaviconSvg(
        '#0ea5e9',
        '#2563eb',
        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    ),
    inventory: buildModuleFaviconSvg(
        '#10b981',
        '#047857',
        '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
    ),
    purchase: buildModuleFaviconSvg(
        '#f59e0b',
        '#ea580c',
        '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'
    ),
    accounting: buildModuleFaviconSvg(
        '#059669',
        '#115e59',
        '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'
    ),
    pos: buildModuleFaviconSvg(
        '#f43f5e',
        '#be123c',
        '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>'
    ),
    settings: buildModuleFaviconSvg(
        '#8b5cf6',
        '#6d28d9',
        '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
    ),
    auth: '/favicon.svg',
    default: '/favicon.svg',
};

const applyFaviconForPage = (componentName = '') => {
    if (typeof document === 'undefined') return;
    const prefix = componentName.split('/')[0]?.toLowerCase() || '';
    let iconHref = MODULE_FAVICONS.default;

    if (prefix === 'owner') iconHref = MODULE_FAVICONS.owner;
    else if (prefix === 'sales') iconHref = MODULE_FAVICONS.sales;
    else if (prefix === 'crm') iconHref = MODULE_FAVICONS.crm;
    else if (prefix === 'inventory') iconHref = MODULE_FAVICONS.inventory;
    else if (prefix === 'purchase') iconHref = MODULE_FAVICONS.purchase;
    else if (prefix === 'accounting' || prefix === 'invoicing') iconHref = MODULE_FAVICONS.accounting;
    else if (prefix === 'pos') iconHref = MODULE_FAVICONS.pos;
    else if (prefix === 'settings') iconHref = MODULE_FAVICONS.settings;
    else if (prefix === 'auth') iconHref = MODULE_FAVICONS.auth;

    let link = document.getElementById('app-favicon') || document.querySelector("link[rel*='icon']");
    if (!link) {
        link = document.createElement('link');
        link.id = 'app-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = iconHref;
};

createInertiaApp({
    title: (title) => {
        if (!title) return appName;
        if (title.includes('Bara Wear')) return title;
        return `${title} — ${appName}`;
    },
    resolve: (name) => {
        applyFaviconForPage(name);
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        );
    },
    setup({ el, App, props }) {
        applyFaviconForPage(props?.initialPage?.component || '');
        router.on('navigate', (event) => {
            applyFaviconForPage(event?.detail?.page?.component || '');
        });

        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#10b981',
    },
});
