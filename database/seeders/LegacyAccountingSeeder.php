<?php

namespace Database\Seeders;

use App\Services\Analytics\SeasonCalendar;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Jurnal akuntansi untuk 12 bulan data historis (sistem lama) sebelum go-live ERP.
 *
 * Hanya MENAMBAH jurnal (journal_entries + journal_lines, nomor berawalan "LJE/").
 * Tidak mengubah dokumen apa pun: POS, Sales Order, Faktur, Pembayaran historis
 * tetap seperti yang dibuat LegacySalesSeeder — jurnal hanya merujuknya lewat
 * source_document_type / source_document_id.
 *
 * Isi jurnal:
 *   - Saldo awal tahun buku sistem lama (Kas, Bank, Persediaan vs Modal)
 *   - Penjualan POS per sesi harian (Kas/Bank, Penjualan POS, PPN Keluaran, HPP)
 *   - Faktur grosir + HPP + pelunasan (dari LINV / LSO / LPAY yang sudah ada)
 *   - Pembelian persediaan ke pemasok + pelunasannya (NET14)
 *   - Beban operasional (gaji, THR, sewa, listrik/air/internet, pemasaran, lain-lain)
 *   - Setoran kas toko ke bank (mingguan) & penyetoran PPN per masa
 *   - Jurnal penutup sistem lama (entry_type "legacy_closing") di hari terakhir data
 *     historis: membalik seluruh saldo jurnal LJE, sehingga saldo setelah go-live
 *     tetap persis sama dengan jurnal Saldo Awal go-live yang sudah ada.
 *
 * Idempoten: jurnal "LJE/%" lama dihapus dulu sebelum dibuat ulang.
 */
class LegacyAccountingSeeder extends Seeder
{
    private const PREFIX = 'LJE/';
    private const VAT_RATE = 0.11;
    private const KAS_FLOAT = 1000000;
    private const MIN_BANK = 10000000;
    private const MIN_STOCK = 15000000;

    /** Prefix SKU → pemasok. */
    private const VENDOR_BY_GROUP = [
        'TSP' => 'V01', // PT Sandang Prima (kaos)
        'JKT' => 'V02', // CV Jaket Nusantara
        'JNS' => 'V03', // PT Denim Mandiri
        'CAP' => 'V04', // UD Aksesori Sumatra
        'BAG' => 'V04',
    ];

    private const EXPENSE_ACCOUNTS = [
        ['code' => '6100', 'account_name' => 'Beban Gaji & Tunjangan', 'account_type' => 'Beban'],
        ['code' => '6200', 'account_name' => 'Beban Sewa Toko & Gudang', 'account_type' => 'Beban'],
        ['code' => '6300', 'account_name' => 'Beban Listrik, Air & Internet', 'account_type' => 'Beban'],
        ['code' => '6400', 'account_name' => 'Beban Pemasaran', 'account_type' => 'Beban'],
        ['code' => '6900', 'account_name' => 'Beban Operasional Lainnya', 'account_type' => 'Beban'],
    ];

    /** Urutan jurnal dalam satu hari. */
    private const ORDER = [
        'opening' => 0, 'purchase' => 1, 'pos' => 2, 'invoice' => 3, 'cogs' => 4,
        'payment_in' => 5, 'payment_out' => 6, 'expense' => 7, 'deposit' => 8, 'vat' => 9, 'closing' => 10,
    ];

    /** @var array<int, array> */
    private array $entries = [];

    private int $userId;

    public function run(): void
    {
        mt_srand(20261118);

        $sessions = DB::table('pos_sessions')->where('is_legacy', true)->orderBy('opened_at')->get();
        $invoices = DB::table('customer_invoices')->where('id', 'like', 'LINV/%')->orderBy('invoice_date')->get();

        if ($sessions->isEmpty() && $invoices->isEmpty()) {
            $this->command?->warn('Tidak ada data historis (jalankan LegacySalesSeeder dulu). Jurnal historis dilewati.');

            return;
        }

        $this->userId = (int) (DB::table('users')->where('role_id', 'finance')->orderBy('id')->value('id')
            ?? DB::table('users')->orderBy('id')->value('id'));

        $dates = collect()
            ->merge($sessions->map(fn ($s) => substr((string) $s->opened_at, 0, 10)))
            ->merge($invoices->pluck('invoice_date')->map(fn ($d) => substr((string) $d, 0, 10)));
        $start = Carbon::parse($dates->min())->startOfDay();
        $end   = Carbon::parse($dates->max())->startOfDay();

        $this->buildPos($sessions);
        $this->buildWholesale($invoices);
        $this->buildPurchases($start, $end);
        $this->buildExpenses($start, $end);
        $this->buildCashDeposits($start, $end);
        $this->buildVatSettlements($start, $end);
        $this->buildOpening($start);
        $this->buildClosing($end);

        $this->persist();

        $this->command?->info(sprintf(
            'Jurnal historis %s s.d. %s: %d jurnal (nomor %s*), ditutup dengan jurnal penutup sistem lama.',
            $start->format('d/m/Y'),
            $end->format('d/m/Y'),
            count($this->entries),
            self::PREFIX
        ));
    }

    // ── Penjualan POS (per sesi harian) ─────────────────────────────
    private function buildPos($sessions): void
    {
        $totals = DB::table('pos_orders')
            ->where('is_legacy', true)
            ->selectRaw('pos_session_id, payment_method, SUM(subtotal_before_tax) AS sub, SUM(total_tax) AS tax, SUM(grand_total) AS grand')
            ->groupBy('pos_session_id', 'payment_method')
            ->get()
            ->groupBy('pos_session_id');

        $cogs = DB::table('pos_order_lines')
            ->join('pos_orders', 'pos_orders.id', '=', 'pos_order_lines.pos_order_id')
            ->where('pos_orders.is_legacy', true)
            ->selectRaw('pos_orders.pos_session_id, SUM(pos_order_lines.cogs_total) AS cogs')
            ->groupBy('pos_orders.pos_session_id')
            ->pluck('cogs', 'pos_session_id');

        $cogsByGroup = DB::table('pos_order_lines')
            ->join('pos_orders', 'pos_orders.id', '=', 'pos_order_lines.pos_order_id')
            ->join('pos_sessions', 'pos_sessions.id', '=', 'pos_orders.pos_session_id')
            ->where('pos_orders.is_legacy', true)
            ->selectRaw('pos_sessions.id AS sid, SUBSTRING(pos_order_lines.variant_sku, 1, 3) AS grp, SUM(pos_order_lines.cogs_total) AS cogs')
            ->groupBy('pos_sessions.id', 'grp')
            ->get()
            ->groupBy('sid');

        foreach ($sessions as $s) {
            $rows = $totals->get($s->id);
            if (! $rows) {
                continue;
            }

            $cash  = (int) $rows->where('payment_method', 'cash')->sum('grand');
            $bank  = (int) $rows->whereIn('payment_method', ['qris', 'card'])->sum('grand');
            $sub   = (int) $rows->sum('sub');
            $tax   = (int) $rows->sum('tax');
            $cost  = (int) ($cogs[$s->id] ?? 0);
            $date  = substr((string) $s->opened_at, 0, 10);
            $label = "Sesi {$s->id}";

            $lines = [];
            if ($cash > 0) {
                $lines[] = ['1010', $cash, 0, "Penerimaan tunai POS — {$label}"];
            }
            if ($bank > 0) {
                $lines[] = ['1020', $bank, 0, "Penerimaan QRIS/Kartu POS — {$label}"];
            }
            $lines[] = ['4010', 0, $sub, "Penjualan POS — {$label}"];
            $lines[] = ['2200', 0, $tax, "PPN Keluaran POS — {$label}"];
            if ($cost > 0) {
                $lines[] = ['5000', $cost, 0, "HPP POS — {$label}"];
                $lines[] = ['1200', 0, $cost, "Keluar persediaan POS — {$label}"];
            }

            $this->add('pos', 'POS/' . Carbon::parse($date)->format('ymd'), 'pos_close', 'pos_session', $s->id, $date,
                "Penjualan POS harian (sistem lama) — {$label}", $lines,
                ['cogs_by_group' => ($cogsByGroup->get($s->id) ?? collect())->pluck('cogs', 'grp')->all()]);
        }
    }

    // ── Penjualan grosir: faktur, HPP, pelunasan ────────────────────
    private function buildWholesale($invoices): void
    {
        $costs = DB::table('products')->pluck('cost', 'variant_sku');

        $payments = DB::table('payment_allocations')
            ->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')
            ->where('payment_allocations.document_type', 'customer_invoice')
            ->where('payments.id', 'like', 'LPAY/%')
            ->get(['payments.id', 'payments.payment_date', 'payments.bank_account_code', 'payment_allocations.document_id', 'payment_allocations.amount_allocated'])
            ->groupBy('document_id');

        foreach ($invoices as $inv) {
            $date = substr((string) $inv->invoice_date, 0, 10);
            $key  = str_replace('LINV/', '', $inv->id); // 2603/01

            $this->add('invoice', "INV/{$key}", 'sales_invoice', 'customer_invoice', $inv->id, $date,
                "Faktur grosir (sistem lama) — {$inv->id}", [
                    ['1100', (int) $inv->grand_total, 0, "Piutang usaha — {$inv->id}"],
                    ['4000', 0, (int) $inv->subtotal_before_tax, "Penjualan grosir — {$inv->id}"],
                    ['2200', 0, (int) $inv->total_tax, "PPN Keluaran — {$inv->id}"],
                ]);

            if ($inv->sales_order_id) {
                $soLines = DB::table('sales_order_lines')->where('sales_order_id', $inv->sales_order_id)->get();
                $cost = 0;
                $byGroup = [];
                foreach ($soLines as $l) {
                    $c = (int) round((float) $l->qty_delivered * (float) ($costs[$l->variant_sku] ?? 0));
                    $cost += $c;
                    $grp = substr($l->variant_sku, 0, 3);
                    $byGroup[$grp] = ($byGroup[$grp] ?? 0) + $c;
                }
                if ($cost > 0) {
                    $this->add('cogs', "COGS/{$key}", 'cogs', 'sales_order', $inv->sales_order_id, $date,
                        "HPP pengiriman grosir (sistem lama) — {$inv->sales_order_id}", [
                            ['5000', $cost, 0, "HPP grosir — {$inv->sales_order_id}"],
                            ['1200', 0, $cost, "Keluar persediaan — {$inv->sales_order_id}"],
                        ], ['cogs_by_group' => $byGroup]);
                }
            }

            foreach ($payments->get($inv->id, collect()) as $p) {
                $amount = (int) $p->amount_allocated;
                $bank   = $p->bank_account_code ?: '1020';
                $this->add('payment_in', 'PAY/' . str_replace('LPAY/', '', $p->id), 'payment_in', 'payment', $p->id,
                    substr((string) $p->payment_date, 0, 10),
                    "Pelunasan piutang (sistem lama) — {$inv->id}", [
                        [$bank, $amount, 0, "Penerimaan pelunasan — {$p->id}"],
                        ['1100', 0, $amount, "Pelunasan piutang — {$inv->id}"],
                    ]);
            }
        }
    }

    // ── Pembelian persediaan per setengah bulan + pelunasan NET14 ───
    private function buildPurchases(Carbon $start, Carbon $end): void
    {
        $vendors = DB::table('contacts_vendors')->pluck('name', 'id');

        // HPP per setengah bulan per pemasok → dasar volume pembelian
        $buckets = [];
        foreach ($this->entries as $e) {
            foreach ($e['meta']['cogs_by_group'] ?? [] as $grp => $c) {
                $d = Carbon::parse($e['date']);
                $bucketStart = $d->day <= 15 ? $d->copy()->startOfMonth() : $d->copy()->day(16);
                if ($bucketStart->lt($start)) {
                    $bucketStart = $start->copy();
                }
                $vendor = self::VENDOR_BY_GROUP[$grp] ?? 'V01';
                $buckets[$bucketStart->toDateString()][$vendor] = ($buckets[$bucketStart->toDateString()][$vendor] ?? 0) + (float) $c;
            }
        }
        ksort($buckets);

        $seqByMonth = [];
        foreach ($buckets as $date => $byVendor) {
            ksort($byVendor);
            foreach ($byVendor as $vendorId => $cogs) {
                $net = (int) (round($cogs * mt_rand(92, 110) / 100 / 1000) * 1000);
                if ($net <= 0) {
                    continue;
                }
                $tax   = (int) round($net * self::VAT_RATE);
                $month = Carbon::parse($date)->format('ym');
                $seq   = $seqByMonth[$month] = ($seqByMonth[$month] ?? 0) + 1;
                $ref   = sprintf('LBILL/%s/%02d', $month, $seq);
                $name  = $vendors[$vendorId] ?? $vendorId;

                $this->add('purchase', sprintf('BILL/%s/%02d', $month, $seq), 'vendor_bill', 'legacy_purchase', $ref, $date,
                    "Pembelian persediaan (sistem lama) — {$name} ({$ref})", [
                        ['1200', $net, 0, "Persediaan masuk — {$ref}"],
                        ['1300', $tax, 0, "PPN Masukan — {$ref}"],
                        ['2100', 0, $net + $tax, "Utang usaha {$name} — {$ref}"],
                    ]);

                $payDate = Carbon::parse($date)->addDays(14);
                if ($payDate->gt($end)) {
                    continue; // belum jatuh tempo saat migrasi
                }
                $this->add('payment_out', sprintf('BPAY/%s/%02d', $month, $seq), 'payment_out', 'legacy_purchase', $ref,
                    $payDate->toDateString(),
                    "Pelunasan utang (sistem lama) — {$name} ({$ref})", [
                        ['2100', $net + $tax, 0, "Pelunasan utang — {$ref}"],
                        ['1020', 0, $net + $tax, "Transfer ke {$name} — {$ref}"],
                    ]);
            }
        }
    }

    // ── Beban operasional bulanan ───────────────────────────────────
    private function buildExpenses(Carbon $start, Carbon $end): void
    {
        $lebaran = Carbon::parse('2026-03-20');

        for ($m = $start->copy()->startOfMonth(); $m->lte($end); $m->addMonth()) {
            $ym  = $m->format('ym');
            $seq = 0;
            $add = function (int $day, string $acc, int $amount, string $desc, string $cashAcc = '1020') use ($m, $ym, $start, $end, &$seq) {
                $date = $m->copy()->day(min($day, $m->daysInMonth));
                if ($date->lt($start) || $date->gt($end)) {
                    return; // di luar rentang data historis (mis. sewa awal bulan pertama sudah dibayar sebelumnya)
                }
                $seq++;
                $this->add('expense', sprintf('EXP/%s/%02d', $ym, $seq), 'expense', 'expense', sprintf('LEXP/%s/%02d', $ym, $seq),
                    $date->toDateString(), "{$desc} (sistem lama)", [
                        [$acc, $amount, 0, $desc],
                        [$cashAcc, 0, $amount, $desc],
                    ]);
            };

            $monthName = \App\Support\ReportPeriod::MONTHS[$m->month] . ' ' . $m->year;
            $season    = SeasonCalendar::seasonFor($m->copy()->day(15));

            $add(1, '6200', 7500000, "Sewa toko & gudang {$monthName}");
            $add(mt_rand(8, 11), '6300', mt_rand(23, 32) * 100000, "Listrik, air & internet {$monthName}");
            $add(25, '6100', 17500000, "Gaji karyawan {$monthName}");

            if ($m->isSameMonth($lebaran)) {
                $add(10, '6100', 17500000, 'THR karyawan Idul Fitri ' . $m->year);
            }

            $promoCount = in_array($season, ['lebaran', 'akhir_tahun'], true) ? 2 : 1;
            for ($i = 0; $i < $promoCount; $i++) {
                $add(mt_rand(3, 20), '6400', mt_rand(8, 30) * 100000, "Promosi media sosial & materi promo {$monthName}");
            }

            foreach ([7, 14, 21] as $d) {
                $add($d + mt_rand(0, 3), '6900', mt_rand(25, 90) * 10000, "ATK, kebersihan & keperluan toko {$monthName}", '1010');
            }
        }
    }

    // ── Setoran kas toko ke bank (setiap Senin) ─────────────────────
    private function buildCashDeposits(Carbon $start, Carbon $end): void
    {
        $kasByDate = [];
        foreach ($this->entries as $e) {
            foreach ($e['lines'] as [$acc, $d, $c]) {
                if ($acc === '1010') {
                    $kasByDate[$e['date']] = ($kasByDate[$e['date']] ?? 0) + $d - $c;
                }
            }
        }

        $kas = self::KAS_FLOAT;
        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $kas += $kasByDate[$day->toDateString()] ?? 0;
            if (($day->isMonday() || $day->eq($end)) && $kas > self::KAS_FLOAT) {
                $amount = (int) (floor(($kas - self::KAS_FLOAT) / 1000) * 1000);
                if ($amount <= 0) {
                    continue;
                }
                $kas -= $amount;
                $this->add('deposit', 'DEP/' . $day->format('ymd'), 'cash_transfer', 'cash_transfer', 'LDEP/' . $day->format('ymd'),
                    $day->toDateString(), 'Setoran kas toko ke bank (sistem lama)', [
                        ['1020', $amount, 0, 'Setoran kas toko'],
                        ['1010', 0, $amount, 'Setoran kas toko ke bank'],
                    ]);
            }
        }
    }

    // ── Penyetoran PPN per masa (akhir bulan) ───────────────────────
    private function buildVatSettlements(Carbon $start, Carbon $end): void
    {
        $output = [];
        $input  = [];
        foreach ($this->entries as $e) {
            $ym = substr($e['date'], 0, 7);
            foreach ($e['lines'] as [$acc, $d, $c]) {
                if ($acc === '2200') {
                    $output[$ym] = ($output[$ym] ?? 0) + $c - $d;
                } elseif ($acc === '1300') {
                    $input[$ym] = ($input[$ym] ?? 0) + $d - $c;
                }
            }
        }

        $carry = 0; // PPN Masukan lebih bayar dibawa ke masa berikutnya
        for ($m = $start->copy()->startOfMonth(); $m->lte($end); $m->addMonth()) {
            $ym  = $m->format('Y-m');
            $out = (int) ($output[$ym] ?? 0);
            $in  = (int) ($input[$ym] ?? 0) + $carry;
            if ($out <= 0) {
                $carry = $in;
                continue;
            }
            $comp  = min($in, $out);
            $carry = $in - $comp;
            $cash  = $out - $comp;
            $date  = $m->copy()->endOfMonth()->startOfDay();
            if ($date->gt($end)) {
                $date = $end->copy();
            }
            $masa = \App\Support\ReportPeriod::MONTHS[$m->month] . ' ' . $m->year;

            $lines = [['2200', $out, 0, "PPN Keluaran masa {$masa}"]];
            if ($comp > 0) {
                $lines[] = ['1300', 0, $comp, "Kompensasi PPN Masukan masa {$masa}"];
            }
            if ($cash > 0) {
                $lines[] = ['1020', 0, $cash, "Setor PPN kurang bayar masa {$masa}"];
            }
            $this->add('vat', 'PPN/' . $m->format('ym'), 'tax_payment', 'tax_payment', 'LTAX/' . $m->format('ym'),
                $date->toDateString(), "Penyetoran PPN masa {$masa} (sistem lama)", $lines);
        }
    }

    // ── Saldo awal tahun buku sistem lama ───────────────────────────
    private function buildOpening(Carbon $start): void
    {
        // Saldo awal dihitung agar Bank & Persediaan tidak pernah minus sepanjang tahun
        $minBank  = $this->minRunning('1020');
        $minStock = $this->minRunning('1200');

        $bank  = (int) (ceil((self::MIN_BANK - min(0, $minBank)) / 1000000) * 1000000);
        $stock = (int) (ceil((self::MIN_STOCK - min(0, $minStock)) / 1000000) * 1000000);
        $kas   = self::KAS_FLOAT;

        $this->add('opening', 'OPEN/' . $start->format('ymd'), 'opening_balance', 'opening_balance', 'OPENING-LEGACY',
            $start->toDateString(), 'Saldo awal tahun buku sistem lama', [
                ['1010', $kas, 0, 'Saldo awal kas toko'],
                ['1020', $bank, 0, 'Saldo awal bank operasional'],
                ['1200', $stock, 0, 'Saldo awal persediaan barang dagang'],
                ['3000', 0, $kas + $bank + $stock, 'Modal disetor (sistem lama)'],
            ]);
    }

    // ── Jurnal penutup: membalik seluruh saldo jurnal historis ─────
    private function buildClosing(Carbon $end): void
    {
        $net = [];
        foreach ($this->entries as $e) {
            foreach ($e['lines'] as [$acc, $d, $c]) {
                $net[$acc] = ($net[$acc] ?? 0) + $d - $c;
            }
        }
        ksort($net);

        $lines = [];
        foreach ($net as $acc => $n) {
            if ($n > 0) {
                $lines[] = [$acc, 0, $n, 'Penutupan saldo sistem lama'];
            } elseif ($n < 0) {
                $lines[] = [$acc, -$n, 0, 'Penutupan saldo sistem lama'];
            }
        }

        $this->add('closing', 'CLOSE/' . $end->format('ymd'), 'legacy_closing', 'legacy_closing', 'LEGACY-CLOSING',
            $end->toDateString(),
            'Jurnal penutup sistem lama — saldo dipindahkan ke Saldo Awal go-live ERP', $lines);
    }

    // ── Helpers ─────────────────────────────────────────────────────
    private function add(string $kind, string $no, string $type, string $srcType, string $srcId, string $date, string $desc, array $lines, array $meta = []): void
    {
        $this->entries[] = [
            'kind' => $kind, 'no' => self::PREFIX . $no, 'type' => $type, 'src_type' => $srcType, 'src_id' => $srcId,
            'date' => $date, 'desc' => $desc, 'lines' => $lines, 'meta' => $meta,
        ];
    }

    private function sorted(): array
    {
        $entries = $this->entries;
        usort($entries, fn ($a, $b) => [$a['date'], self::ORDER[$a['kind']], $a['no']] <=> [$b['date'], self::ORDER[$b['kind']], $b['no']]);

        return $entries;
    }

    private function minRunning(string $account): float
    {
        $run = 0;
        $min = 0;
        foreach ($this->sorted() as $e) {
            foreach ($e['lines'] as [$acc, $d, $c]) {
                if ($acc === $account) {
                    $run += $d - $c;
                }
            }
            $min = min($min, $run);
        }

        return $min;
    }

    private function persist(): void
    {
        DB::transaction(function () {
            DB::table('chart_of_accounts')->upsert(self::EXPENSE_ACCOUNTS, ['code'], ['account_name', 'account_type']);

            // Idempoten: hapus jurnal historis lama (baris ikut terhapus via cascade)
            DB::table('journal_entries')->where('entry_no', 'like', self::PREFIX . '%')->delete();

            $lineRows = [];
            foreach ($this->sorted() as $e) {
                $debit  = array_sum(array_column($e['lines'], 1));
                $credit = array_sum(array_column($e['lines'], 2));
                if ($debit !== $credit) {
                    throw new \RuntimeException("Jurnal {$e['no']} tidak seimbang: {$debit} vs {$credit}");
                }
                $at = Carbon::parse($e['date'])->setTime(23, 0);

                $id = DB::table('journal_entries')->insertGetId([
                    'entry_no'             => $e['no'],
                    'entry_type'           => $e['type'],
                    'source_document_type' => $e['src_type'],
                    'source_document_id'   => $e['src_id'],
                    'entry_date'           => $e['date'],
                    'description'          => $e['desc'],
                    'status'               => 'posted',
                    'is_balanced'          => true,
                    'total_debit'          => $debit,
                    'total_credit'         => $credit,
                    'posted_at'            => $at,
                    'posted_by'            => $this->userId,
                    'created_by'           => $this->userId,
                    'created_at'           => $at,
                    'updated_at'           => $at,
                ]);

                foreach ($e['lines'] as [$acc, $d, $c, $desc]) {
                    $lineRows[] = [
                        'journal_entry_id' => $id,
                        'account_code'     => $acc,
                        'description'      => $desc,
                        'debit'            => $d,
                        'credit'           => $c,
                        'created_at'       => $at,
                    ];
                }
            }

            foreach (array_chunk($lineRows, 500) as $chunk) {
                DB::table('journal_lines')->insert($chunk);
            }
        });
    }
}
