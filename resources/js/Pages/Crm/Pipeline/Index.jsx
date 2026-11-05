import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Columns3,
    List,
    Plus,
    Search,
    Filter,
    RotateCcw,
    DollarSign,
    Trophy,
    Percent,
    GripVertical,
    FileText,
    ArrowRight,
    Users,
    Sparkles,
    CheckCircle2,
    XCircle,
    Package,
    Calendar,
} from 'lucide-react';
import CrmLayout from '@/Layouts/CrmLayout';

const formatRp = (value) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

export default function PipelineIndex({
    pipeline = [],
    summary = {},
    filters = {},
    customers = [],
    products = [],
    users = [],
}) {
    // Local state for optimistic drag & drop
    const [stages, setStages] = useState(pipeline);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverStage, setDragOverStage] = useState(null);

    // Filters state
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? 'all');
    const [assignedUserId, setAssignedUserId] = useState(filters.assigned_user_id ?? 'all');

    useEffect(() => {
        setStages(pipeline);
    }, [pipeline]);

    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search,
            type,
            customer_id: customerId,
            assigned_user_id: assignedUserId,
            ...overrides,
        };

        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] === '' || queryParams[key] === 'all' || queryParams[key] === null) {
                delete queryParams[key];
            }
        });

        router.get(route('crm.pipeline'), queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearch('');
        setType('all');
        setCustomerId('all');
        setAssignedUserId('all');
        router.get(route('crm.pipeline'), {}, { preserveState: false });
    };

    // ─── Drag & Drop Handlers ────────────────────────────────────────────────
    const handleDragStart = (e, item, sourceStageKey) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setData('source-stage', sourceStageKey);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem(item);
    };

    const handleDragOver = (e, stageKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverStage !== stageKey) {
            setDragOverStage(stageKey);
        }
    };

    const handleDragLeave = (e, stageKey) => {
        // Only reset if leaving the column element itself
        if (e.currentTarget.contains(e.relatedTarget)) return;
        if (dragOverStage === stageKey) {
            setDragOverStage(null);
        }
    };

    const handleDrop = (e, targetStageKey) => {
        e.preventDefault();
        setDragOverStage(null);

        const leadId = e.dataTransfer.getData('text/plain') || draggedItem?.id;
        const sourceStageKey = e.dataTransfer.getData('source-stage');

        if (!leadId) return;
        if (sourceStageKey === targetStageKey) return;

        // 1. Optimistic UI update
        let movedCard = null;
        const updatedStages = stages.map((stg) => {
            if (stg.key === sourceStageKey) {
                const filteredItems = stg.items.filter((item) => {
                    if (item.id === leadId) {
                        movedCard = { ...item, stage: targetStageKey };
                        return false;
                    }
                    return true;
                });
                const totalRev = filteredItems.reduce((acc, curr) => acc + (curr.expected_revenue || 0), 0);
                return { ...stg, items: filteredItems, count: filteredItems.length, total_revenue: totalRev };
            }
            return stg;
        });

        if (movedCard) {
            const finalStages = updatedStages.map((stg) => {
                if (stg.key === targetStageKey) {
                    const newItems = [movedCard, ...stg.items];
                    const totalRev = newItems.reduce((acc, curr) => acc + (curr.expected_revenue || 0), 0);
                    return { ...stg, items: newItems, count: newItems.length, total_revenue: totalRev };
                }
                return stg;
            });
            setStages(finalStages);
        }

        setDraggedItem(null);

        // 2. Persist to server
        router.patch(
            route('crm.leads.stage', leadId),
            { stage: targetStageKey },
            {
                preserveState: true,
                preserveScroll: true,
                onError: () => {
                    // Revert to server state on error
                    setStages(pipeline);
                },
            }
        );
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverStage(null);
    };

    return (
        <CrmLayout title="Pipeline CRM" breadcrumbs={[{ label: 'Pipeline' }]}>
            <Head title="Pipeline CRM - Odoo Kanban" />

            {/* ── Top Bar: Title & View Switcher ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Columns3 className="h-6 w-6 text-sky-600" />
                        Pipeline CRM
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola prospek dari tahap baru hingga closing dengan drag-and-drop kanban.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher: Kanban vs List */}
                    <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <button
                            type="button"
                            className="flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xs"
                            title="Tampilan Kanban"
                        >
                            <Columns3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Kanban</span>
                        </button>
                        <Link
                            href={route('crm.leads.index')}
                            className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Tampilan List / Tabel"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">List</span>
                        </Link>
                    </div>

                    {/* New Lead Button */}
                    <Link
                        href={route('crm.leads.create')}
                        className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 transition"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Prospek
                    </Link>
                </div>
            </div>

            {/* ── KPI Summary Cards ── */}
            <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Potensi Pipeline Aktif</span>
                        <div className="rounded bg-sky-50 p-1.5 text-sky-700">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900">
                        {formatRp(summary.total_pipeline_revenue)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {summary.active_pipeline_count ?? 0} prospek aktif
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Deal Menang</span>
                        <div className="rounded bg-emerald-50 p-1.5 text-emerald-700">
                            <Trophy className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-emerald-900">
                        {formatRp(summary.total_won_revenue)}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                        {summary.won_count ?? 0} kesepakatan dimenangkan
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Win Rate Closing</span>
                        <div className="rounded bg-indigo-50 p-1.5 text-indigo-700">
                            <Percent className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-indigo-900">
                        {summary.win_rate_pct ?? 0}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {summary.won_count ?? 0} menang / {(summary.won_count || 0) + (summary.lost_count || 0)} closing
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Dokumen CRM</span>
                        <div className="rounded bg-slate-100 p-1.5 text-slate-700">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900">
                        {summary.total_leads ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Lead &amp; Opportunity keseluruhan
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari ID, kontak, pelanggan, atau SKU..."
                            className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white focus:outline-none"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            applyFilters({ type: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="lead">Lead</option>
                        <option value="opportunity">Opportunity</option>
                    </select>

                    {/* Customer Filter */}
                    <select
                        value={customerId}
                        onChange={(e) => {
                            setCustomerId(e.target.value);
                            applyFilters({ customer_id: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Pelanggan</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Salesperson Filter */}
                    <select
                        value={assignedUserId}
                        onChange={(e) => {
                            setAssignedUserId(e.target.value);
                            applyFilters({ assigned_user_id: e.target.value });
                        }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none"
                    >
                        <option value="all">Semua Sales</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                        >
                            <Filter className="h-3 w-3" />
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                            title="Reset Filter"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Drag & Drop Kanban Pipeline (Odoo 17 Replica) ── */}
            <div className="flex gap-3 overflow-x-auto pb-6 pt-1">
                {stages.map((stage) => {
                    const isOver = dragOverStage === stage.key;

                    return (
                        <div
                            key={stage.key}
                            onDragOver={(e) => handleDragOver(e, stage.key)}
                            onDragLeave={(e) => handleDragLeave(e, stage.key)}
                            onDrop={(e) => handleDrop(e, stage.key)}
                            className={`flex flex-col min-w-[280px] w-72 max-w-xs shrink-0 rounded-lg border transition-all duration-150 ${
                                isOver
                                    ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-300 ring-offset-1'
                                    : 'border-slate-200 bg-slate-100/70'
                            }`}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b border-slate-200/80 bg-slate-200/50 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                stage.key === 'won'
                                                    ? 'bg-emerald-500'
                                                    : stage.key === 'lost'
                                                    ? 'bg-rose-500'
                                                    : stage.key === 'proposition'
                                                    ? 'bg-amber-500'
                                                    : stage.key === 'qualified'
                                                    ? 'bg-sky-500'
                                                    : 'bg-slate-500'
                                            }`}
                                        />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            {stage.label}
                                        </h3>
                                    </div>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
                                        {stage.count}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                    <span>Nilai:</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatRp(stage.total_revenue)}
                                    </span>
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 p-2 space-y-2.5 min-h-[420px] max-h-[70vh] overflow-y-auto">
                                {stage.items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300/70 rounded-lg text-slate-400 text-xs">
                                        <span className="text-[11px]">Tarik kartu ke sini</span>
                                    </div>
                                ) : (
                                    stage.items.map((lead) => {
                                        const isBeingDragged = draggedItem?.id === lead.id;

                                        return (
                                            <div
                                                key={lead.id}
                                                draggable="true"
                                                onDragStart={(e) => handleDragStart(e, lead, stage.key)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => router.visit(route('crm.leads.show', lead.id))}
                                                className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer ${
                                                    isBeingDragged ? 'opacity-40 scale-95 border-sky-400' : ''
                                                }`}
                                            >
                                                {/* Header Bar of Card */}
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab" />
                                                        <span className="font-mono text-xs font-bold text-slate-900">
                                                            {lead.id}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                            lead.type === 'opportunity'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {lead.type}
                                                    </span>
                                                </div>

                                                {/* Customer Name */}
                                                <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                                                    {lead.customer_name}
                                                </div>

                                                {/* Contact Person */}
                                                {lead.contact_name && (
                                                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                                                        {lead.contact_name}
                                                    </div>
                                                )}

                                                {/* Product Interest / SKU */}
                                                {lead.variant_sku && (
                                                    <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 rounded px-2 py-1 border border-slate-100">
                                                        <Package className="h-3 w-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            {lead.qty_interest ? `${lead.qty_interest}x ` : ''}
                                                            {lead.variant_sku}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Expected Revenue & Quotations */}
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                                    <span className="font-bold text-sky-900 tabular-nums">
                                                        {formatRp(lead.expected_revenue)}
                                                    </span>

                                                    {lead.quotations_count > 0 ? (
                                                        <span
                                                            title={`${lead.quotations_count} Quotation Tertaut`}
                                                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            {lead.quotations_count} Quo
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">
                                                            {lead.assigned_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </CrmLayout>
    );
}

