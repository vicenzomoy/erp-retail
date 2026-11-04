import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import OdooBadge from '@/Components/Odoo/OdooBadge';
import {
    FileText,
    MessageSquare,
    History,
    Send,
    User,
    Clock,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    Info,
    Shield,
    ExternalLink,
} from 'lucide-react';

export default function OdooFormFooter({
    documentType,
    documentId,
    relatedDocs = [],
    auditLogs = [],
}) {
    const [activeTab, setActiveTab] = useState('related'); // 'related' | 'notes' | 'audit'

    // Form for posting new Log Note
    const { data, setData, post, processing, reset } = useForm({
        document_type: documentType,
        document_id: documentId,
        notes: '',
    });

    const handleLogNoteSubmit = (e) => {
        e.preventDefault();
        if (!data.notes.trim()) return;

        post(route('inventory.log-notes.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('notes');
            },
        });
    };

    // Filter log notes vs system audits
    const logNotes = auditLogs.filter((l) => l.action === 'LOG_NOTE');
    const systemAudits = auditLogs.filter((l) => l.action !== 'LOG_NOTE');

    return (
        <div className="mt-8 border-t border-slate-200 bg-white rounded-lg shadow-xs overflow-hidden">
            {/* Odoo Chatter Footer Navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2">
                <div className="flex items-center gap-1 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('related')}
                        className={`inline-flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-md transition cursor-pointer ${
                            activeTab === 'related'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <span>Related Docs</span>
                        <span className="rounded-full bg-indigo-50 text-indigo-700 px-1.5 py-0.2 text-[10px] font-bold border border-indigo-200">
                            {relatedDocs.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('notes')}
                        className={`inline-flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-md transition cursor-pointer ${
                            activeTab === 'notes'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                        <span>Log Notes</span>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0.2 text-[10px] font-bold border border-emerald-200">
                            {logNotes.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className={`inline-flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-md transition cursor-pointer ${
                            activeTab === 'audit'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <History className="h-4 w-4 text-slate-600" />
                        <span>Audit / History</span>
                        <span className="rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-bold">
                            {auditLogs.length}
                        </span>
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    <span>Jejak Audit & Relasi Dokumen Odoo Web 17</span>
                </div>
            </div>

            {/* TAB 1: RELATED DOCS */}
            {activeTab === 'related' && (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Dokumen Terkait (Related Documents)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                            Keterkaitan dokumen hulu & hilir (Sales Order, Backorder, Penerimaan PO, Jurnal Akuntansi COGS/GRIR).
                        </p>
                    </div>

                    {relatedDocs.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            Tidak ada dokumen yang terhubung langsung dengan dokumen ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {relatedDocs.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs hover:border-slate-300 transition"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {doc.type}
                                            </span>
                                            {doc.status && <OdooBadge status={doc.status} />}
                                        </div>
                                        <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                                            {doc.id}
                                        </div>
                                        {doc.title && (
                                            <div className="text-xs font-medium text-slate-700 mt-0.5">
                                                {doc.title}
                                            </div>
                                        )}
                                        {doc.info && (
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                                {doc.info}
                                            </p>
                                        )}
                                    </div>

                                    {doc.url && doc.url !== '#' && (
                                        <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                                            <Link
                                                href={doc.url}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                            >
                                                <span>Buka Dokumen</span>
                                                <ArrowUpRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: LOG NOTES (CHATTER) */}
            {activeTab === 'notes' && (
                <div className="p-6">
                    {/* Add note textarea */}
                    <form onSubmit={handleLogNoteSubmit} className="mb-6">
                        <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-xs focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500">
                            <textarea
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Tulis catatan internal (Log Note) untuk dokumen ini..."
                                className="w-full resize-none border-0 p-0 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                            />
                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="text-[11px] text-slate-400">
                                    Catatan internal hanya terlihat oleh tim internal.
                                </span>
                                <button
                                    type="submit"
                                    disabled={processing || !data.notes.trim()}
                                    className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-40 cursor-pointer"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {processing ? 'Menyimpan...' : 'Simpan Catatan'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Timeline of notes */}
                    {logNotes.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            Belum ada catatan internal (Log Note) pada dokumen ini. Gunakan kolom di atas untuk menambahkan catatan.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logNotes.map((note) => (
                                <div
                                    key={note.id}
                                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                        {note.actor_username ? note.actor_username.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900">
                                                    {note.actor_username}
                                                </span>
                                                <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 uppercase">
                                                    {note.actor_role}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {note.created_at} ({note.time_ago})
                                            </span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-slate-700 whitespace-pre-line">
                                            {note.notes}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: AUDIT / HISTORY */}
            {activeTab === 'audit' && (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Jejak Audit Trail (Audit & History)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                            Rekaman peristiwa transaksional otomatis, validasi stok, pembaruan data, dan aktor penanggung jawab.
                        </p>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                            Belum ada riwayat audit yang tercatat untuk dokumen ini.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-2">
                            {auditLogs.map((log) => {
                                const isSuccess = log.status === 'SUCCESS';
                                const isRejected = log.status === 'REJECTED';
                                const isDuplicate = log.status === 'DUPLICATE';

                                return (
                                    <div key={log.id} className="relative pl-6">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                                            isSuccess
                                                ? 'bg-emerald-600'
                                                : isRejected
                                                ? 'bg-rose-600'
                                                : isDuplicate
                                                ? 'bg-amber-500'
                                                : 'bg-slate-500'
                                        }`} />

                                        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {log.action}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                                        isSuccess
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : isRejected
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-400">
                                                    {log.created_at} ({log.time_ago})
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-600 mt-1">
                                                Oleh: <span className="font-bold text-slate-800">{log.actor_username}</span> &bull; Peran: <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-1 rounded">{log.actor_role}</span>
                                            </div>

                                            {log.notes && (
                                                <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                                                    {log.notes}
                                                </p>
                                            )}

                                            {/* Diffs if present */}
                                            {log.old_value && log.new_value && (
                                                <div className="mt-2 text-[11px] grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                                                    <div>
                                                        <span className="font-bold text-slate-500 block mb-0.5">Nilai Lama:</span>
                                                        <pre className="text-[10px] text-slate-600 whitespace-pre-wrap">
                                                            {JSON.stringify(log.old_value, null, 2)}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-500 block mb-0.5">Nilai Baru:</span>
                                                        <pre className="text-[10px] text-emerald-800 whitespace-pre-wrap">
                                                            {JSON.stringify(log.new_value, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

