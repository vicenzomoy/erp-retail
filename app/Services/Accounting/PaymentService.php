<?php

namespace App\Services\Accounting;

use App\Models\AuditLog;
use App\Models\CustomerInvoice;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\VendorBill;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Layanan Register Payment, Pembayaran Parsial, Rekonsiliasi Kas/Bank,
 * dan Pencegahan Duplikasi / Idempotency (F-15, SR-05, SR-06, SR-17, SR-20, T-20, T-25, T-26).
 */
class PaymentService
{
    public function __construct(
        protected TaxCalculationService $taxService
    ) {}

    /**
     * Generate ID Payment berformat PAY-0001.
     */
    public function generatePaymentId(): string
    {
        $ids = DB::table('payments')
            ->where('id', 'LIKE', 'PAY-%')
            ->pluck('id');

        $maxNumeric = 0;
        foreach ($ids as $id) {
            if (preg_match('/^PAY-(\d+)$/', $id, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNumeric) {
                    $maxNumeric = $num;
                }
            }
        }

        return sprintf('PAY-%04d', $maxNumeric + 1);
    }

    /**
     * Register pembayaran pelanggan (Inbound / AR) atau pembayaran vendor (Outbound / AP).
     *
     * @param array{
     *   document_type: string,
     *   document_id: string,
     *   amount: float|int|string,
     *   payment_method?: string,
     *   bank_account_code?: string,
     *   payment_date?: string,
     *   reference?: string|null,
     *   notes?: string|null,
     *   idempotency_key: string
     * } $data
     * @return array{payment: Payment, already_processed: bool, document: CustomerInvoice|VendorBill}
     */
    public function registerPayment(array $data, User $actor): array
    {
        $documentType   = $data['document_type'];
        $documentId     = $data['document_id'];
        $idempotencyKey = $data['idempotency_key'];

        // 1. Idempotency / Anti-Duplikasi Guard (T-26, SR-17, SR-20):
        // Jika idempotency_key sudah pernah diproses, kembalikan pembayaran yang sudah ada tanpa memotong saldo lagi!
        $existingPayment = Payment::where('idempotency_key', $idempotencyKey)->first();
        if ($existingPayment) {
            $noteMsg = "Pencegahan Duplikasi Pembayaran: Kunci transaksi '{$idempotencyKey}' sudah digunakan pada pembayaran {$existingPayment->id}. Utang/Piutang dan Saldo Bank tidak dipotong ulang.";

            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_PAYMENT',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'payment',
                documentId: $existingPayment->id,
                oldValue: [
                    'payment_id'      => $existingPayment->id,
                    'amount'          => (string) $existingPayment->amount,
                    'idempotency_key' => $idempotencyKey,
                ],
                newValue: ['duplicate_request_blocked' => true],
                notes: $noteMsg
            );

            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_PAYMENT',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: $documentType,
                documentId: $documentId,
                oldValue: ['payment_id' => $existingPayment->id, 'idempotency_key' => $idempotencyKey],
                newValue: ['duplicate_request_blocked' => true],
                notes: $noteMsg
            );

            $targetDoc = $documentType === 'customer_invoice'
                ? CustomerInvoice::find($documentId)
                : VendorBill::find($documentId);

            return [
                'payment'           => $existingPayment->fresh(['allocations', 'journalEntry.lines', 'bankAccount']),
                'already_processed' => true,
                'document'          => $targetDoc,
            ];
        }

        // 2. Penolakan Pembayaran Langsung atas Purchase Order tanpa Receipt & Bill (T-20 / SR-05 / SR-06)
        if ($documentType === 'purchase_order') {
            $po = PurchaseOrder::find($documentId);
            AuditLog::record(
                action: 'REJECTED_PAYMENT_NO_BILL',
                status: 'REJECTED',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'purchase_order',
                documentId: $documentId,
                notes: "Penolakan pembayaran PO {$documentId}: Belum ada Accepted Receipt dan Vendor Bill terposting."
            );

            throw ValidationException::withMessages([
                'document_id' => "Pembayaran langsung untuk Purchase Order {$documentId} ditolak: Pembayaran kepada pemasok hanya dapat dilakukan atas dasar Vendor Bill terposting yang telah melalui validasi Three-Way Match dengan Accepted Receipt.",
            ]);
        }

        if (! in_array($documentType, ['customer_invoice', 'vendor_bill'], true)) {
            throw ValidationException::withMessages([
                'document_type' => "Tipe dokumen pembayaran '{$documentType}' tidak valid.",
            ]);
        }

        $requestedAmount = number_format((float) $data['amount'], 2, '.', '');
        if (bccomp($requestedAmount, '0.00', 2) <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Nominal pembayaran harus lebih besar dari Rp 0.',
            ]);
        }

        // Validasi dokumen target di luar transaksi jika gagal agar AuditLog tetap tersimpan
        $previewDoc = $documentType === 'customer_invoice'
            ? CustomerInvoice::findOrFail($documentId)
            : VendorBill::findOrFail($documentId);

        if ($previewDoc->status === 'paid' || bccomp((string) $previewDoc->amount_residual, '0.00', 2) <= 0) {
            AuditLog::record(
                action: 'ATTEMPT_DUPLICATE_PAYMENT',
                status: 'DUPLICATE',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: $documentType,
                documentId: $documentId,
                notes: "Percobaan pembayaran ulang pada dokumen {$documentId} yang sudah berstatus Lunas (Paid) ditolak."
            );

            throw ValidationException::withMessages([
                'amount' => "Dokumen {$documentId} sudah lunas (Paid) dengan sisa tagihan Rp 0. Pembayaran ganda ditolak.",
            ]);
        }

        if ($previewDoc->status !== 'posted') {
            throw ValidationException::withMessages([
                'status' => "Pembayaran hanya dapat dicatat pada dokumen berstatus Posted. Status {$documentId} saat ini: {$previewDoc->status}.",
            ]);
        }

        if (bccomp($requestedAmount, (string) $previewDoc->amount_residual, 2) > 0) {
            throw ValidationException::withMessages([
                'amount' => sprintf(
                    'Nominal pembayaran (Rp %s) tidak boleh melebihi sisa tagihan / residual dokumen %s (Rp %s).',
                    number_format((float) $requestedAmount, 0, ',', '.'),
                    $documentId,
                    number_format((float) $previewDoc->amount_residual, 0, ',', '.')
                ),
            ]);
        }

        return DB::transaction(function () use ($data, $documentType, $documentId, $requestedAmount, $idempotencyKey, $actor) {
            $bankCode      = $data['bank_account_code'] ?? '1020';
            $paymentMethod = $data['payment_method'] ?? ($bankCode === '1010' ? 'cash' : 'bank_transfer');
            $paymentDate   = $data['payment_date'] ?? now()->toDateString();
            $paymentId     = $this->generatePaymentId();
            $entryNo       = $this->taxService->nextJournalEntryNo('PAY');

            if ($documentType === 'customer_invoice') {
                /** @var CustomerInvoice $doc */
                $doc = CustomerInvoice::lockForUpdate()->with('customer')->findOrFail($documentId);
                $partyType = 'customer';
                $partyId   = $doc->customer_id;
                $partyName = $doc->customer?->name ?? $partyId;
                $payType   = 'inbound';
                $entryType = 'payment_in';

                $oldResidual = (string) $doc->amount_residual;
                $newPaid     = bcadd((string) $doc->amount_paid, $requestedAmount, 2);
                $newResidual = bcsub((string) $doc->amount_residual, $requestedAmount, 2);
                $newStatus   = bccomp($newResidual, '0.00', 2) === 0 ? 'paid' : 'posted';

                $je = JournalEntry::create([
                    'entry_no'             => $entryNo,
                    'entry_type'           => $entryType,
                    'source_document_type' => 'payment',
                    'source_document_id'   => $paymentId,
                    'entry_date'           => $paymentDate,
                    'description'          => "Penerimaan Pembayaran {$paymentId} atas Faktur {$doc->id} ({$partyName})",
                    'status'               => 'posted',
                    'is_balanced'          => true,
                    'total_debit'          => $requestedAmount,
                    'total_credit'         => $requestedAmount,
                    'posted_at'            => now(),
                    'posted_by'            => $actor->id,
                    'created_by'           => $actor->id,
                ]);

                // Debit Kas/Bank (1020 / 1010)
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => $bankCode,
                    'description'      => "Penerimaan Pelanggan {$partyName} - {$doc->id} ({$paymentId})",
                    'debit'            => $requestedAmount,
                    'credit'           => '0.00',
                    'created_at'       => now(),
                ]);

                // Credit Piutang Usaha (1100)
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => '1100',
                    'description'      => "Pelunasan/Rekonsiliasi Piutang {$partyName} - {$doc->id}",
                    'debit'            => '0.00',
                    'credit'           => $requestedAmount,
                    'created_at'       => now(),
                ]);

                $doc->update([
                    'amount_paid'     => $newPaid,
                    'amount_residual' => $newResidual,
                    'status'          => $newStatus,
                ]);
            } else {
                /** @var VendorBill $doc */
                $doc = VendorBill::lockForUpdate()->with('vendor')->findOrFail($documentId);
                $partyType = 'vendor';
                $partyId   = $doc->vendor_id;
                $partyName = $doc->vendor?->name ?? $partyId;
                $payType   = 'outbound';
                $entryType = 'payment_out';

                $oldResidual = (string) $doc->amount_residual;
                $newPaid     = bcadd((string) $doc->amount_paid, $requestedAmount, 2);
                $newResidual = bcsub((string) $doc->amount_residual, $requestedAmount, 2);
                $newStatus   = bccomp($newResidual, '0.00', 2) === 0 ? 'paid' : 'posted';

                $je = JournalEntry::create([
                    'entry_no'             => $entryNo,
                    'entry_type'           => $entryType,
                    'source_document_type' => 'payment',
                    'source_document_id'   => $paymentId,
                    'entry_date'           => $paymentDate,
                    'description'          => "Pembayaran Vendor {$paymentId} atas Bill {$doc->id} ({$partyName})",
                    'status'               => 'posted',
                    'is_balanced'          => true,
                    'total_debit'          => $requestedAmount,
                    'total_credit'         => $requestedAmount,
                    'posted_at'            => now(),
                    'posted_by'            => $actor->id,
                    'created_by'           => $actor->id,
                ]);

                // Debit Utang Usaha (2100)
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => '2100',
                    'description'      => "Pelunasan/Rekonsiliasi Utang {$partyName} - {$doc->id}",
                    'debit'            => $requestedAmount,
                    'credit'           => '0.00',
                    'created_at'       => now(),
                ]);

                // Credit Kas/Bank (1020 / 1010)
                JournalLine::create([
                    'journal_entry_id' => $je->id,
                    'account_code'     => $bankCode,
                    'description'      => "Pembayaran ke Vendor {$partyName} - {$doc->id} ({$paymentId})",
                    'debit'            => '0.00',
                    'credit'           => $requestedAmount,
                    'created_at'       => now(),
                ]);

                $doc->update([
                    'amount_paid'     => $newPaid,
                    'amount_residual' => $newResidual,
                    'status'          => $newStatus,
                ]);
            }

            $payment = Payment::create([
                'id'                => $paymentId,
                'payment_type'      => $payType,
                'party_type'        => $partyType,
                'party_id'          => $partyId,
                'payment_method'    => $paymentMethod,
                'bank_account_code' => $bankCode,
                'amount'            => $requestedAmount,
                'payment_date'      => $paymentDate,
                'reference'         => $data['reference'] ?? "REF-{$documentId}",
                'status'            => 'reconciled',
                'journal_entry_id'  => $je->id,
                'idempotency_key'   => $idempotencyKey,
                'posted_at'         => now(),
                'posted_by'         => $actor->id,
                'notes'             => $data['notes'] ?? "Pembayaran atas {$documentId} ({$partyName})",
                'created_by'        => $actor->id,
            ]);

            PaymentAllocation::create([
                'payment_id'       => $payment->id,
                'document_type'    => $documentType,
                'document_id'      => $documentId,
                'amount_allocated' => $requestedAmount,
                'created_at'       => now(),
            ]);

            $summaryNote = sprintf(
                'Pembayaran %s sebesar Rp %s untuk %s (%s) berhasil direkonsiliasi melalui akun %s. Sisa tagihan (Residual): Rp %s -> Rp %s (%s). Jurnal: %s.',
                $payment->id,
                number_format((float) $requestedAmount, 0, ',', '.'),
                $documentId,
                $partyName,
                $bankCode,
                number_format((float) $oldResidual, 0, ',', '.'),
                number_format((float) $newResidual, 0, ',', '.'),
                strtoupper($newStatus),
                $je->entry_no
            );

            AuditLog::record(
                action: 'REGISTER_PAYMENT',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: 'payment',
                documentId: $payment->id,
                oldValue: ['residual_before' => $oldResidual],
                newValue: [
                    'payment_id'      => $payment->id,
                    'document_type'   => $documentType,
                    'document_id'     => $documentId,
                    'amount_paid'     => $requestedAmount,
                    'residual_after'  => $newResidual,
                    'document_status' => $newStatus,
                    'journal_entry'   => $je->entry_no,
                ],
                notes: $summaryNote
            );

            AuditLog::record(
                action: 'REGISTER_PAYMENT',
                status: 'SUCCESS',
                actorUserId: $actor->id,
                actorUsername: $actor->name,
                actorRole: $actor->role_id ?? 'finance',
                documentType: $documentType,
                documentId: $documentId,
                oldValue: ['amount_residual' => $oldResidual],
                newValue: [
                    'payment_id'      => $payment->id,
                    'amount_paid'     => $requestedAmount,
                    'amount_residual' => $newResidual,
                    'status'          => $newStatus,
                ],
                notes: $summaryNote
            );

            return [
                'payment'           => $payment->fresh(['allocations', 'journalEntry.lines', 'bankAccount']),
                'already_processed' => false,
                'document'          => $doc->fresh(),
            ];
        });
    }
}

