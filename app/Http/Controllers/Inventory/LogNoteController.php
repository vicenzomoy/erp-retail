<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LogNoteController extends Controller
{
    /**
     * Store a user log note on any inventory document (Odoo Chatter Log Note).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'document_type' => 'required|string|max:50',
            'document_id' => 'required|string|max:50',
            'notes' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        AuditLog::record(
            action: 'LOG_NOTE',
            status: 'SUCCESS',
            actorUserId: $user?->id,
            actorUsername: $user?->name ?? 'Staff',
            actorRole: $user?->role_id ?? 'warehouse',
            documentType: $validated['document_type'],
            documentId: $validated['document_id'],
            notes: $validated['notes'],
            ipAddress: $request->ip()
        );

        return redirect()->back()->with('success', 'Catatan internal (Log Note) berhasil disimpan.');
    }
}

