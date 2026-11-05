<?php

namespace App\Services\Accounting;

use App\Models\JournalEntry;

/**
 * Layanan kalkulasi PPN per baris (F-23 / SR-22) dan utilitas penomoran jurnal.
 * Kebijakan: VAT-NONLUX efektif 11% (12% x 11/12), dibulatkan per baris ke Rupiah terdekat.
 */
class TaxCalculationService
{
    public const DEFAULT_TAX_ID = 'VAT-NONLUX';
    public const EFFECTIVE_RATE = '0.11';

    /**
     * Hitung subtotal_before_tax (DPP), tax_amount (PPN bulat Rupiah per baris),
     * dan line_total (Gross) untuk satu baris invoice / vendor bill.
     *
     * @return array{subtotal_before_tax: string, tax_amount: string, line_total: string}
     */
    public function calculateLine(string|int|float $qty, string|int|float $unitPrice, string|int|float $discountPct = '0'): array
    {
        $qtyStr       = (string) $qty;
        $priceStr     = (string) $unitPrice;
        $discountStr  = (string) $discountPct;

        $discountFactor = bcsub('1', bcdiv($discountStr, '100', 10), 10);
        $rawSubtotal    = bcmul(bcmul($qtyStr, $priceStr, 10), $discountFactor, 4);

        // Bulatkan DPP ke Rupiah terdekat jika harga satuan bulat
        $subtotalRounded = (int) round((float) $rawSubtotal, 0);
        $subtotalBeforeTax = number_format($subtotalRounded, 2, '.', '');

        // PPN 11% per baris, wajib bulat Rupiah terdekat (SR-22 / F-23)
        $taxRounded = (int) round($subtotalRounded * 0.11, 0);
        $taxAmount  = number_format($taxRounded, 2, '.', '');

        $lineTotal = bcadd($subtotalBeforeTax, $taxAmount, 2);

        return [
            'subtotal_before_tax' => $subtotalBeforeTax,
            'tax_amount'          => $taxAmount,
            'line_total'          => $lineTotal,
        ];
    }

    /**
     * Hasilkan nomor Journal Entry unik yang aman dari benturan.
     */
    public function nextJournalEntryNo(string $typePrefix): string
    {
        $seq = JournalEntry::count() + 1;
        do {
            $candidate = sprintf('JE/%s/%04d', strtoupper($typePrefix), $seq);
            $exists = JournalEntry::where('entry_no', $candidate)->exists();
            $seq++;
        } while ($exists);

        return $candidate;
    }
}

