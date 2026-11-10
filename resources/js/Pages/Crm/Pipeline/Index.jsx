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
    Users,
    CheckCircle2,
    XCircle,
    Package,
    AlertTriangle,
    X,
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
    // ─── State ───────────────────────────────────────────────────────────────
    const [stages, setStages] = useState(pipeline);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverStage, setDragOverStage] = useState(null);
    const [validationMessage, setValidationMessage] = useState(null);
    const [quotationLead, setQuotationLead] = useState(null);
    const [pickLead, setPickLead] = useState(null);
    const [pickedOrderId, setPickedOrderId] = useState('');

    // Filters
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? 'all');
    const [assignedUserId, setAssignedUserId] = useState(filters.assigned_user_id ?? 'all');

    // Modal — only Lost modal
    const [showLostModal, setShowLostModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [lostReason, setLostReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lostReasonPresets = [
        'Harga terlalu mahal / Di luar budget',
        'Pelanggan memilih tawaran kompetitor',
        'Kebutuhan dibatalkan / Tidak mendesak',
        'Kontak tidak merespons (Ghosting)',
        'Varian produk atau spesifikasi tidak cocok',
    ];

    useEffect(() => {
        setStages(pipeline);
    }, [pipeline]);

    // ─── Filters ─────────────────────────────────────────────────────────────
    const applyFilters = (overrides = {}) => {
        const queryParams = {
            search, type,
            customer_id: customerId,
            assigned_user_id: assignedUserId,
            ...overrides,
        };
        Object.keys(queryParams).forEach((key) => {
            if (!queryParams[key] || queryParams[key] === 'all') delete queryParams[key];
        });
        router.get(route('crm.pipeline'), queryParams, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };

    const handleReset = () => {
        setSearch(''); setType('all'); setCustomerId('all'); setAssignedUserId('all');
        router.get(route('crm.pipeline'), {}, { preserveState: false });
    };

    // ─── Navigation helpers (redirect to Sales module) ───────────────────────
    const goToCreateQuotation = (lead) => {
        const params = new URLSearchParams();
        params.set('lead_id', lead.id);
        if (lead.customer_id) params.set('customer_id', lead.customer_id);
        if (lead.variant_sku) params.set('variant_sku', lead.variant_sku);
        if (lead.qty_interest) params.set('qty_ordered', lead.qty_interest);
        params.set('source_doc_no', lead.id);
        router.visit(route('sales.orders.create') + '?' + params.toString());
    };

    const goToSalesOrder = (lead) => {
        const drafts = (lead.quotations ?? []).filter((q) => q.status === 'draft');

        if (drafts.length > 1) {
            // Lebih dari 1 quotation: sales wajib memilih salah satu untuk dikonfirmasi
            setPickLead(lead);
            setPickedOrderId('');
            return;
        }
        if (drafts.length === 1) {
            router.visit(route('sales.orders.show', drafts[0].id));
            return;
        }
        if (lead.quotation_id) {
            router.visit(route('sales.orders.show', lead.quotation_id));
        } else {
            goToCreateQuotation(lead);
        }
    };

    const submitPickedQuotation = (e) => {
        e.preventDefault();
        if (!pickLead || !pickedOrderId) return;
        setIsSubmitting(true);
        router.post(
            route('crm.leads.confirm-so', pickLead.id),
            { sales_order_id: pickedOrderId, redirect_to: 'pipeline' },
            {
                preserveScroll: true,
                onSuccess: () => { setPickLead(null); setPickedOrderId(''); },
                onError: (errs) => {
                    setPickLead(null);
                    showValidation(Object.values(errs)[0] || 'Quotation gagal dikonfirmasi.');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // Lihat Quotation: 1 dokumen langsung dibuka, lebih dari 1 tampil daftar
    const viewQuotations = (lead) => {
        const list = lead.quotations ?? [];
        if (list.length === 1) {
            router.visit(route('sales.orders.show', list[0].id));
        } else if (list.length > 1) {
            setQuotationLead(lead);
        }
    };

    // ─── Lost Modal ───────────────────────────────────────────────────────────
    const openLostModal = (lead) => {
        setSelectedLead(lead);
        setLostReason('');
        setShowLostModal(true);
    };

    const closeLostModal = () => {
        setSelectedLead(null);
        setShowLostModal(false);
        setIsSubmitting(false);
    };

    const submitLost = (e) => {
        e.preventDefault();
        if (!selectedLead || !lostReason.trim()) return;
        setIsSubmitting(true);
        router.post(
            route('crm.leads.lost', selectedLead.id),
            { reason: lostReason.trim(), redirect_to: 'pipeline' },
            {
                preserveScroll: true,
                onSuccess: () => closeLostModal(),
                onError: () => setIsSubmitting(false),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // ─── Drag & Drop ──────────────────────────────────────────────────────────
    const handleDragStart = (e, item, sourceStageKey) => {
        if (sourceStageKey === 'won' || sourceStageKey === 'lost') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.setData('source-stage', sourceStageKey);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem(item);
    };

    const handleDragOver = (e, stageKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverStage !== stageKey) setDragOverStage(stageKey);
    };

    const handleDragLeave = (e, stageKey) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        if (dragOverStage === stageKey) setDragOverStage(null);
    };

    const showValidation = (msg) => {
        setValidationMessage(msg);
        setTimeout(() => setValidationMessage(null), 4500);
    };

    const handleDrop = (e, targetStageKey) => {
        e.preventDefault();
        setDragOverStage(null);

        const leadId = e.dataTransfer.getData('text/plain') || draggedItem?.id;
        const sourceStageKey = e.dataTransfer.getData('source-stage') || draggedItem?.stage;

        if (!leadId || !draggedItem) return;
        if (sourceStageKey === targetStageKey) { setDraggedItem(null); return; }

        // new → qualified only (redirect to create quotation)
        if (sourceStageKey === 'new') {
            if (targetStageKey === 'qualified') {
                goToCreateQuotation(draggedItem);
            } else {
                showValidation("Kartu dari tahap 'Baru' hanya bisa dipindahkan ke 'Terkualifikasi' dengan membuat Quotation.");
            }
            setDraggedItem(null);
            return;
        }

        // qualified → won (redirect to SO) or lost (modal)
        if (sourceStageKey === 'qualified') {
            if (targetStageKey === 'won') {
                goToSalesOrder(draggedItem);
            } else if (targetStageKey === 'lost') {
                openLostModal(draggedItem);
            } else {
                showValidation("Kartu dari tahap 'Terkualifikasi' hanya bisa dipindahkan ke 'Menang (Won)' atau 'Kalah (Lost)'.");
            }
            setDraggedItem(null);
            return;
        }

        // won / lost are final
        showValidation("Prospek yang sudah selesai (Menang / Kalah) tidak dapat dipindahkan lagi.");
        setDraggedItem(null);
    };

    const handleDragEnd = () => { setDraggedItem(null); setDragOverStage(null); };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <CrmLayout title="Pipeline CRM" breadcrumbs={[{ label: 'Pipeline' }]}>
            <Head title="Pipeline CRM" />

            {/* Validation Banner */}
            {validationMessage && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-800 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{validationMessage}</span>
                    </div>
                    <button type="button" onClick={() => setValidationMessage(null)} className="text-amber-600 hover:text-amber-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Top Bar */}
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
                    <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <button type="button" className="flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xs">
                            <Columns3 className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Kanban</span>
                        </button>
                        <Link href={route('crm.leads.index')} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
                            <List className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">List</span>
                        </Link>
                    </div>
                    <Link href={route('crm.leads.create')} className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 transition">
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Prospek
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Potensi Pipeline Aktif</span>
                        <div className="rounded bg-sky-50 p-1.5 text-sky-700"><DollarSign className="h-4 w-4" /></div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900">{formatRp(summary.total_pipeline_revenue)}</div>
                    <div className="text-[11px] text-slate-500">{summary.active_pipeline_count ?? 0} prospek aktif</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Deal Menang</span>
                        <div className="rounded bg-emerald-50 p-1.5 text-emerald-700"><Trophy className="h-4 w-4" /></div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-emerald-900">{formatRp(summary.total_won_revenue)}</div>
                    <div className="text-[11px] text-emerald-700">{summary.won_count ?? 0} kesepakatan dimenangkan</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Win Rate Closing</span>
                        <div className="rounded bg-indigo-50 p-1.5 text-indigo-700"><Percent className="h-4 w-4" /></div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-indigo-900">{summary.win_rate_pct ?? 0}%</div>
                    <div className="text-[11px] text-slate-500">
                        {summary.won_count ?? 0} menang / {(summary.won_count || 0) + (summary.lost_count || 0)} closing
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Total Dokumen CRM</span>
                        <div className="rounded bg-slate-100 p-1.5 text-slate-700"><Users className="h-4 w-4" /></div>
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-slate-900">{summary.total_leads ?? 0}</div>
                    <div className="text-[11px] text-slate-500">Lead &amp; Opportunity keseluruhan</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari ID, kontak, pelanggan, atau SKU..."
                            className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-sky-600 focus:bg-white focus:outline-none"
                        />
                    </div>
                    <select value={type} onChange={(e) => { setType(e.target.value); applyFilters({ type: e.target.value }); }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none">
                        <option value="all">Semua Tipe</option>
                        <option value="lead">Lead</option>
                        <option value="opportunity">Opportunity</option>
                    </select>
                    <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); applyFilters({ customer_id: e.target.value }); }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none">
                        <option value="all">Semua Pelanggan</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={assignedUserId} onChange={(e) => { setAssignedUserId(e.target.value); applyFilters({ assigned_user_id: e.target.value }); }}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-600 focus:bg-white focus:outline-none">
                        <option value="all">Semua Sales</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5">
                        <button type="submit" className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition">
                            <Filter className="h-3 w-3" /> Filter
                        </button>
                        <button type="button" onClick={handleReset} title="Reset Filter"
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Kanban Board */}
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
                                isOver ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-300 ring-offset-1' : 'border-slate-200 bg-slate-100/70'
                            }`}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b border-slate-200/80 bg-slate-200/50 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${
                                            stage.key === 'won' ? 'bg-emerald-500'
                                            : stage.key === 'lost' ? 'bg-rose-500'
                                            : stage.key === 'qualified' ? 'bg-sky-500'
                                            : 'bg-slate-500'
                                        }`} />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">{stage.label}</h3>
                                    </div>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">{stage.count}</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                    <span>Nilai:</span>
                                    <span className="font-semibold text-slate-800">{formatRp(stage.total_revenue)}</span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 p-2 space-y-2.5 min-h-[420px] max-h-[70vh] overflow-y-auto">
                                {stage.items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300/70 rounded-lg text-slate-400 text-xs">
                                        <span className="text-[11px]">Tidak ada prospek</span>
                                    </div>
                                ) : (
                                    stage.items.map((lead) => {
                                        const isBeingDragged = draggedItem?.id === lead.id;
                                        const isDraggable = stage.key !== 'won' && stage.key !== 'lost';

                                        return (
                                            <div
                                                key={lead.id}
                                                draggable={isDraggable ? 'true' : 'false'}
                                                onDragStart={(e) => handleDragStart(e, lead, stage.key)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => router.visit(route('crm.leads.show', lead.id))}
                                                className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer ${
                                                    isBeingDragged ? 'opacity-40 scale-95 border-sky-400' : ''
                                                }`}
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {isDraggable
                                                            ? <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab" />
                                                            : <div className="h-3.5 w-1" />
                                                        }
                                                        <span className="font-mono text-xs font-bold text-slate-900">{lead.id}</span>
                                                    </div>
                                                    {stage.key === 'won' ? (
                                                        <span />
                                                    ) : (
                                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                            lead.type === 'opportunity' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>{lead.type}</span>
                                                    )}
                                                </div>

                                                {/* Customer */}
                                                <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">{lead.customer_name}</div>
                                                {lead.contact_name && (
                                                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">{lead.contact_name}</div>
                                                )}

                                                {/* Product SKU */}
                                                {lead.variant_sku && (
                                                    <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 rounded px-2 py-1 border border-slate-100">
                                                        <Package className="h-3 w-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            {lead.qty_interest ? `${lead.qty_interest}x ` : ''}{lead.variant_sku}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Revenue & Quotation Badge */}
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                                    <span className="font-bold text-sky-900 tabular-nums">{formatRp(lead.expected_revenue)}</span>
                                                    {lead.quotations_count > 0 ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            {lead.quotations_count} Quo
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">{lead.assigned_name}</span>
                                                    )}
                                                </div>

                                                {/* Lost Reason */}
                                                {stage.key === 'lost' && lead.lost_reason && (
                                                    <div className="mt-2 rounded bg-rose-50 p-1.5 text-[10px] text-rose-700 border border-rose-100">
                                                        <span className="font-semibold">Alasan:</span> {lead.lost_reason}
                                                    </div>
                                                )}

                                                {/* Won: tampilkan kode dokumen SO terkait */}
                                                {stage.key === 'won' && (
                                                    <div className="mt-2 flex items-center justify-between rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-100">
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                            Kesepakatan Menang
                                                        </span>
                                                        {lead.won_order_id && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); router.visit(route('sales.orders.show', lead.won_order_id)); }}
                                                                className="font-mono text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900"
                                                                title="Buka dokumen Sales Order"
                                                            >
                                                                {lead.won_order_id}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Hover Buttons: NEW */}
                                                {stage.key === 'new' && (
                                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); goToCreateQuotation(lead); }}
                                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-semibold py-1.5 px-2 shadow-xs transition"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            Buat Quotation
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openLostModal(lead); }}
                                                            className="inline-flex items-center justify-center gap-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold py-1.5 px-2 border border-rose-200 transition"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Tandai Kalah
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Hover Buttons: QUALIFIED */}
                                                {stage.key === 'qualified' && (
                                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {(lead.quotations?.length ?? 0) > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); viewQuotations(lead); }}
                                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold py-1.5 px-2 shadow-xs transition"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                Lihat Quotation
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); goToCreateQuotation(lead); }}
                                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-semibold py-1.5 px-2 shadow-xs transition"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Buat Quotation
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openLostModal(lead); }}
                                                            className="inline-flex items-center justify-center gap-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold py-1.5 px-2 border border-rose-200 transition"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Tandai Kalah
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: PILIH QUOTATION UNTUK DIKONFIRMASI (MENANG) */}
            {pickLead && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={() => setPickLead(null)}
                >
                    <form
                        onSubmit={submitPickedQuotation}
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Pilih Quotation yang Dikonfirmasi</h3>
                                <p className="text-xs text-slate-500">
                                    Prospek <span className="font-mono font-semibold">{pickLead.id}</span> • {pickLead.customer_name}
                                </p>
                            </div>
                            <button type="button" onClick={() => setPickLead(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3 text-xs">
                            <p className="text-slate-600">
                                Prospek ini memiliki lebih dari satu quotation. Pilih satu quotation untuk dikonfirmasi menjadi Sales Order.
                                Quotation lainnya akan dibatalkan otomatis.
                            </p>
                            <div className="divide-y divide-slate-100 rounded border border-slate-200 max-h-64 overflow-y-auto">
                                {(pickLead.quotations ?? []).filter((q) => q.status === 'draft').map((q) => (
                                    <label key={q.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            name="picked_quotation"
                                            value={q.id}
                                            checked={pickedOrderId === q.id}
                                            onChange={() => setPickedOrderId(q.id)}
                                        />
                                        <span className="font-mono font-bold text-slate-900">{q.id}</span>
                                        <span className="ml-auto font-mono font-semibold text-slate-800">{formatRp(q.grand_total)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                            <button type="button" onClick={() => setPickLead(null)}
                                className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                                Batal
                            </button>
                            <button type="submit" disabled={!pickedOrderId || isSubmitting}
                                className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {isSubmitting ? 'Memproses...' : 'Konfirmasi & Menangkan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: DAFTAR QUOTATION TERKAIT LEAD */}
            {quotationLead && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
                    onClick={() => setQuotationLead(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Daftar Quotation</h3>
                                <p className="text-xs text-slate-500">
                                    Prospek <span className="font-mono font-semibold">{quotationLead.id}</span> • {quotationLead.customer_name}
                                </p>
                            </div>
                            <button type="button" onClick={() => setQuotationLead(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {quotationLead.quotations.map((q) => (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => router.visit(route('sales.orders.show', q.id))}
                                    className="w-full flex items-center justify-between px-5 py-3 text-xs hover:bg-slate-50 transition text-left"
                                >
                                    <span className="font-mono font-bold text-slate-900">{q.id}</span>
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                        {q.status === 'draft' ? 'Draft' : q.status === 'confirmed' ? 'Terkonfirmasi' : q.status === 'done' ? 'Selesai' : q.status}
                                    </span>
                                    <span className="font-mono font-semibold text-slate-800">{formatRp(q.grand_total)}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                            <button type="button" onClick={() => setQuotationLead(null)}
                                className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                                Tutup
                            </button>
                            <button type="button" onClick={() => goToCreateQuotation(quotationLead)}
                                className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition">
                                <Plus className="h-3.5 w-3.5" />
                                Buat Quotation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MODAL: TANDAI KALAH                                        */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showLostModal && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                                    <XCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Tandai Prospek Kalah (Lost)</h3>
                                    <p className="text-xs text-slate-500">
                                        Prospek <span className="font-mono font-semibold">{selectedLead.id}</span> • {selectedLead.customer_name}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={closeLostModal} disabled={isSubmitting}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={submitLost}>
                            <div className="p-5 space-y-3.5 text-xs">
                                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-900 text-xs">
                                    <span className="font-semibold">Catatan:</span> Prospek akan dipindahkan ke tahap{' '}
                                    <strong className="font-bold text-rose-800">Kalah (Lost)</strong>. Mohon cantumkan alasan untuk evaluasi pipeline tim.
                                </div>

                                {/* Preset Chips */}
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1.5">Pilih Alasan Cepat:</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {lostReasonPresets.map((preset) => (
                                            <button key={preset} type="button" onClick={() => setLostReason(preset)}
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition ${
                                                    lostReason === preset
                                                        ? 'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}>
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea */}
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Rincian Alasan Kalah <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3} value={lostReason} onChange={(e) => setLostReason(e.target.value)}
                                        required placeholder="Tuliskan alasan mengapa prospek ini kalah atau dibatalkan..."
                                        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-rose-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                                <button type="button" onClick={closeLostModal} disabled={isSubmitting}
                                    className="rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting || !lostReason.trim()}
                                    className="inline-flex items-center gap-1.5 rounded bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 transition disabled:opacity-50">
                                    {isSubmitting ? (
                                        <>
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-3.5 w-3.5" />
                                            Tandai Kalah (Lost)
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CrmLayout>
    );
}
