<?php

namespace App\Services\Pos;

use App\Models\AuditLog;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\PosSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Selisih kurang kas POS: kas fisik yang dihitung kasir lebih kecil dari kas seharusnya.
 *
 * - Saat sesi ditutup  : Dr 1150 Piutang Karyawan / Cr 1010 Kas  (kas di buku disesuaikan dengan fisik)
 * - Saat kasir mengganti: Dr 1010 Kas / Cr 1150 Piutang Karyawan  (piutang kasir lunas)
 */
class PosCashShortageService
{
    /**
     * Catat kekurangan kas untuk sesi yang baru ditutup. Idempotent: tidak mencatat dua kali.
     * Harus dipanggil di dalam transaksi penutupan sesi.
     */
    public function recordShortage(PosSession $session, int $actorUserId, string $actorName, string $actorRole = 'cashier'): void
    {
        $amount = $session->shortageAmount();
        if ($amount <= 0 || $session->shortage_status !== null) {
            return;
        }

        $entry = $this->createJournal(
            entryType: 'pos_cash_shortage',
            session: $session,
            amount: $amount,
            debitAccount: PosSession::SHORTAGE_ACCOUNT,
            creditAccount: '1010',
            description: "Kekurangan Kas POS — {$session->id} (kasir: {$session->cashier?->name})",
            actorUserId: $actorUserId,
        );

        $session->update([
            'shortage_status' => PosSession::SHORTAGE_OUTSTANDING,
            'shortage_journal_entry_id' => $entry->id,
        ]);

        AuditLog::record(
            action: 'POS_CASH_SHORTAGE',
            status: 'warning',
            actorUserId: $actorUserId,
            actorUsername: $actorName,
            actorRole: $actorRole,
            documentType: 'pos_session',
            documentId: $session->id,
            newValue: [
                'expected_cash' => (string) $session->expected_cash,
                'counted_cash' => (string) $session->counted_cash,
                'shortage' => $amount,
                'journal_entry' => $entry->entry_no,
            ],
            notes: "Kas fisik sesi {$session->id} kurang Rp " . number_format($amount, 0, ',', '.')
                . " dari kas seharusnya. Dicatat sebagai piutang kasir dan dilaporkan ke Finance.",
        );
    }

    /**
     * Finance menandai kekurangan kas sudah diganti oleh kasir.
     * Idempotent: menandai ulang sesi yang sudah lunas hanya mengembalikan sesi tersebut.
     */
    public function settle(PosSession $session, User $actor, ?string $notes = null): PosSession
    {
        if (! in_array($actor->role_id, PosSession::SETTLER_ROLES, true)) {
            throw ValidationException::withMessages([
                'status' => 'Hanya Finance atau Owner yang dapat menandai kekurangan kas sudah diganti.',
            ]);
        }

        return DB::transaction(function () use ($session, $actor, $notes) {
            /** @var PosSession $locked */
            $locked = PosSession::with('cashier')->whereKey($session->id)->lockForUpdate()->firstOrFail();

            if ($locked->shortage_status === PosSession::SHORTAGE_SETTLED) {
                return $locked;
            }

            if ($locked->shortage_status !== PosSession::SHORTAGE_OUTSTANDING) {
                throw ValidationException::withMessages([
                    'status' => "Sesi {$locked->id} tidak memiliki kekurangan kas yang perlu diganti.",
                ]);
            }

            $amount = $locked->shortageAmount();

            $entry = $this->createJournal(
                entryType: 'pos_cash_shortage_settlement',
                session: $locked,
                amount: $amount,
                debitAccount: '1010',
                creditAccount: PosSession::SHORTAGE_ACCOUNT,
                description: "Penggantian Kekurangan Kas POS — {$locked->id} oleh {$locked->cashier?->name}",
                actorUserId: $actor->id,
            );

            $locked->update([
                'shortage_status' => PosSession::SHORTAGE_SETTLED,
                'shortage_settled_at' => now(),
                'shortage_settled_by' => $actor->id,
                'shortage_settlement_notes' => $notes,
                'shortage_settlement_journal_entry_id' => $entry->id,
            ]);

            AuditLog::record(
                action: 'POS_CASH_SHORTAGE_SETTLED',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id,
                documentType: 'pos_session',
                documentId: $locked->id,
                oldValue: ['shortage_status' => PosSession::SHORTAGE_OUTSTANDING],
                newValue: ['shortage_status' => PosSession::SHORTAGE_SETTLED, 'journal_entry' => $entry->entry_no],
                notes: "Kekurangan kas sesi {$locked->id} sebesar Rp " . number_format($amount, 0, ',', '.')
                    . " telah diganti oleh kasir {$locked->cashier?->name}. Ditandai oleh {$actor->name}."
                    . ($notes ? " Catatan: {$notes}" : ''),
            );

            return $locked->fresh(['cashier', 'shortageSettledBy']);
        });
    }

    /**
     * Daftar kekurangan kas yang belum diganti (untuk dashboard Finance).
     */
    public function getOutstanding(): array
    {
        return PosSession::with('cashier')
            ->where('shortage_status', PosSession::SHORTAGE_OUTSTANDING)
            ->orderBy('closed_at')
            ->get()
            ->map(fn (PosSession $s) => $this->present($s))
            ->all();
    }

    public function getSettledHistory(int $limit = 30): array
    {
        return PosSession::with(['cashier', 'shortageSettledBy'])
            ->where('shortage_status', PosSession::SHORTAGE_SETTLED)
            ->orderByDesc('shortage_settled_at')
            ->limit($limit)
            ->get()
            ->map(fn (PosSession $s) => $this->present($s))
            ->all();
    }

    public function countOutstanding(): int
    {
        return PosSession::where('shortage_status', PosSession::SHORTAGE_OUTSTANDING)->count();
    }

    public function present(PosSession $s): array
    {
        return [
            'id' => $s->id,
            'cashier_name' => $s->cashier?->name ?? 'Kasir',
            'location_code' => $s->location_code,
            'opened_at' => $s->opened_at?->format('d/m/Y H:i'),
            'closed_at' => $s->closed_at?->format('d/m/Y H:i'),
            'waiting_for' => $s->closed_at?->diffForHumans(),
            'opening_cash_float' => (float) $s->opening_cash_float,
            'expected_cash' => (float) $s->expected_cash,
            'counted_cash' => (float) $s->counted_cash,
            'shortage' => $s->shortageAmount(),
            'status' => $s->shortage_status,
            'settled_at' => $s->shortage_settled_at?->format('d/m/Y H:i'),
            'settled_by' => $s->shortageSettledBy?->name,
            'notes' => $s->shortage_settlement_notes,
        ];
    }

    private function createJournal(
        string $entryType,
        PosSession $session,
        float $amount,
        string $debitAccount,
        string $creditAccount,
        string $description,
        int $actorUserId,
    ): JournalEntry {
        $prefix = $entryType === 'pos_cash_shortage' ? 'JNL/POS-SHORT' : 'JNL/POS-SETTLE';
        $entryNo = sprintf('%s/%04d', $prefix, JournalEntry::count() + 1);

        $entry = JournalEntry::create([
            'entry_no' => $entryNo,
            'entry_type' => $entryType,
            'source_document_type' => 'pos_session',
            'source_document_id' => $session->id,
            'entry_date' => now()->toDateString(),
            'description' => $description,
            'status' => 'posted',
            'is_balanced' => true,
            'total_debit' => $amount,
            'total_credit' => $amount,
            'posted_at' => now(),
            'posted_by' => $actorUserId,
            'created_by' => $actorUserId,
        ]);

        JournalLine::create([
            'journal_entry_id' => $entry->id,
            'account_code' => $debitAccount,
            'description' => $description,
            'debit' => $amount,
            'credit' => 0,
        ]);

        JournalLine::create([
            'journal_entry_id' => $entry->id,
            'account_code' => $creditAccount,
            'description' => $description,
            'debit' => 0,
            'credit' => $amount,
        ]);

        return $entry;
    }
}
