# Spesifikasi Fitur (F-xx) dan Skenario Pengujian (S-xx & T-xx)
**Sistem ERP Ritel Fashion Omnichannel — PT Bara Ritel Nusantara**

---

## 1. Daftar Fitur Aplikasi (F-01 s/d F-25)

| Kode Fitur | Nama Fitur | Prioritas | Sumber SR | Acceptance Criteria (Given / When / Then) | Pemetaan Tes |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **F-01** | Navigasi dan Identitas Aplikasi | Must | SR-18, SR-19 | **1.** Given Pengguna aktif membuka beranda; When memilih app atau tampilan; Then app terpilih terbuka dengan identitas pengguna benar.<br>**2.** Given pengguna Cashier login; When mencoba mengakses menu jurnal; Then navigasi tidak menampilkan akses yang tidak sah dan server tetap menolak. | T-01, T-02 |
| **F-02** | Hak Akses Per Peran | Must | SR-18 | **1.** Given Pengguna memakai peran terbatas; When mencoba aksi yang tidak diizinkan; Then server menolak dan merekam audit.<br>**2.** Given Cashier memiliki session autentikasi; When mencoba mengubah Credit Limit pelanggan C001 lewat request langsung; Then API menolak perubahan, mencatat aktor, dan nilai awal tetap. | T-03, T-04 |
| **F-03** | Kontak dan Termin Pembayaran | Must | SR-11, SR-20 | **1.** Given C001 dibuka; When termin atau plafon ditinjau; Then nilai awal tetap konsisten.<br>**2.** Given master C001 berplafon $\text{Rp}5.000.000$; When Credit Limit negatif dimasukkan; Then validasi menolak angka negatif dan mempertahankan batas lama. | T-05, T-06 |
| **F-04** | Produk dan SKU Varian | Must | SR-21 | **1.** Given TSP-M-BLK dan TSP-L-BLK ada; When salah satu varian diubah; Then varian lain tidak ikut berubah.<br>**2.** Given stok ukuran M sebanyak 20 dan ukuran L 17; When varian L diubah atau ditelusuri; Then stok dan biaya varian M tetap independen. | T-07, T-08 |
| **F-05** | Pipeline CRM | Must | SR-19 | **1.** Given Lead L0007 tersedia; When tahap dipindah dan penawaran dibuat; Then dokumen turunan tertaut satu kali.<br>**2.** Given Opportunity L0007 telah dibuka; When permintaan pembuatan Quotation yang sama dikirim dua kali; Then setiap request idempotent hanya membuat satu Quotation dan satu tautan. | T-09, T-10 |
| **F-06** | Quotation menjadi Sales Order | Must | SR-01, SR-02 | **1.** Given Pelanggan C002 dipilih; When empat kaos dipesan dan dikonfirmasi; Then Sales Order bernomor unik dan total akurat.<br>**2.** Given C001 memiliki AR $\text{Rp}2.500.000$ dan plafon $\text{Rp}5.000.000$; When order 20 jaket dikonfirmasi; Then order yang melewati credit exposure tertahan tanpa perubahan stok. | T-11, T-12 |
| **F-07** | Diskon Terkendali dan Harga Terkunci | Must | SR-07, SR-08 | **1.** Given Sales Order telah dikonfirmasi; When harga diubah atau diskon $15\%$ diterapkan; Then aksi ditolak tanpa persetujuan dan diaudit.<br>**2.** Given harga order telah dikonfirmasi dan Sales meminta diskon $15\%$; When perubahan dilakukan tanpa approval Owner; Then unit price dan discount tetap terkunci, percobaan diaudit. | T-11, T-12 |
| **F-08** | ATP dan Reservasi Per Lokasi | Must | SR-09, SR-16 | **1.** Given Reservasi SO0008 tiga unit sudah ada; When empat unit baru dipesan dari WH-PKU; Then stok tersedia berkurang tanpa mengurangi On Hand.<br>**2.** Given WH-PKU memiliki 12 TSP-M-BLK termasuk 3 reserved; When reservasi baru 10 unit diajukan; Then ATP menolak karena Available hanya 9. | T-13, T-14 |
| **F-09** | Pengiriman Parsial dan Backorder | Must | SR-10, SR-23 | **1.** Given Order empat kaos dikonfirmasi; When dua unit dikirim dahulu; Then sisa dua tercatat serta COGS dua unit diakui.<br>**2.** Given delivery pertama $2/4$ sudah Done dan backorder 2 terbuka; When backorder diselesaikan dan delivery lama divalidasi ulang; Then total terkirim 4, COGS kumulatif $\text{Rp}352.000$ dan tidak ada stock move ganda. | T-15, T-16 |
| **F-10** | Invoice Berdasarkan Pengiriman | Must | SR-01, SR-02 | **1.** Given Pengiriman dua dari empat telah tervalidasi; When invoice dibuat; Then hanya dua yang ditagih, bukan empat.<br>**2.** Given SO empat unit baru Confirmed tetapi Delivered Qty nol; When pengguna mencoba membuat Customer Invoice; Then jumlah yang boleh ditagih nol dalam keputusan delivery-based. | T-17, T-18 |
| **F-11** | Pengendalian Plafon Kredit | Must | SR-11 | **1.** Given C001 punya piutang awal; When order melebihi sisa plafon dikonfirmasi; Then konfirmasi tertahan sampai tindakan resmi.<br>**2.** Given C001 memiliki sisa credit headroom $\text{Rp}2.500.000$; When order gross $\text{Rp}7.747.800$ diajukan; Then konfirmasi tertolak meskipun staf menawarkan diskon tanpa otorisasi. | T-11, T-12 |
| **F-12** | RFQ dan Purchase Order | Must | SR-05, SR-06 | **1.** Given V03 mengirim penawaran sepuluh jeans; When PO dibuat; Then jumlah dan nilai PO benar, stok belum bertambah.<br>**2.** Given PO V03 10 unit telah Confirmed, Receipt belum ada; When petugas mencoba membuat pembayaran vendor penuh; Then AP dan Bank tetap karena tidak ada Bill berdasarkan accepted receipt. | T-19, T-20 |
| **F-13** | Receipt dan Barang Diterima | Must | SR-12 | **1.** Given PO sepuluh jeans tersedia; When delapan diterima dan dua ditolak; Then hanya delapan menambah stok dan nilai standar.<br>**2.** Given PO tersisa sepuluh unit; When petugas memasukkan Accepted 8 dan Rejected 3; Then sistem menolak receipt 11 unit dan tidak memutasi stok. | T-21, T-22 |
| **F-14** | Vendor Bill dengan Three-Way Match | Must | SR-05, SR-06, SR-13 | **1.** Given Receipt $8/10$ tervalidasi; When Vendor Bill diajukan; Then maksimum delapan unit dapat ditagih dan diposting.<br>**2.** Given Receipt PO V03 hanya menerima delapan unit; When Bill untuk sepuluh unit diajukan; Then three-way match menolak kelebihan dua unit sebelum posting. | T-23, T-24 |
| **F-15** | Pembayaran Parsial dan Rekonsiliasi | Must | SR-20 | **1.** Given Invoice C002 telah diposting; When dibayar sebagian melalui bank; Then residual terhitung benar dan bukti tersedia.<br>**2.** Given Vendor Bill delapan jeans sebesar $\text{Rp}1.491.840$ sudah Posted; When pembayaran bank dikirim dua kali dengan key sama; Then utang V03 lunas tepat satu kali dan saldo bank turun hanya sekali. | T-25, T-26 |
| **F-16** | Jurnal Seimbang dan Pengakuan COGS | Must | SR-17, SR-23 | **1.** Given Dua kaos dikirim dan invoice diposting; When general ledger ditinjau; Then nilai persediaan, COGS, AR, revenue dan pajak konsisten.<br>**2.** Given Invoice dua kaos $\text{Rp}352.980$ sudah Posted; When perintah Post yang sama dikirim ulang; Then AR, revenue dan PPN tidak mengganda; debit selalu sama dengan kredit. | T-27, T-28 |
| **F-17** | Sesi Kasir POS | Must | SR-15 | **1.** Given Kasir membuka sesi dengan float; When transaksi tunai diselesaikan dan sesi ditutup; Then rekap uang fisik dan sistem cocok.<br>**2.** Given sesi POS memiliki float $\text{Rp}500.000$ dan penjualan tunai $\text{Rp}219.780$; When sesi ditutup dengan uang fisik $\text{Rp}719.780$ lalu Close diklik ulang; Then variance nol dan percobaan penutupan kedua tidak membuat jurnal baru. | T-29, T-30 |
| **F-18** | Penjualan POS dan Validasi Stok | Must | SR-03, SR-04 | **1.** Given Stok CAP di toko dua belas; When dua topi dijual; Then stok, penjualan, pajak dan COGS berubah sesuai unit.<br>**2.** Given stok gerai untuk topi hanya dua belas; When kasir mencoba menjual tiga belas topi; Then transaksi diblok dan stok tidak menjadi negatif. | T-31, T-32 |
| **F-19** | Retur dan Credit Note | Must | SR-14 | **1.** Given Invoice dua kaos sudah ada; When satu kaos laik jual diretur; Then Credit Note dan reversal stok serta COGS terhubung.<br>**2.** Given Invoice C002 berisi dua kaos dan tanggal retur melampaui empat belas hari; When retur tanpa otorisasi diminta; Then Credit Note dan stock move tidak dibuat. | T-33, T-34 |
| **F-20** | Transfer Antar-Lokasi | Must | SR-16 | **1.** Given Topi tersedia di WH-PKU; When tiga topi dipindah ke TOKO-PKU; Then kedua lokasi berubah tetapi nilai total tetap.<br>**2.** Given WH-PKU hanya punya lima belas topi; When transfer enam belas topi diajukan; Then stok dua lokasi tetap dan transaksi ditolak. | T-35, T-36 |
| **F-21** | Dashboard Keterlacakan | Should | SR-19 | **1.** Given Dataset awal termuat; When dashboard dibuka atau transaksi diposting; Then KPI mencerminkan saldo pada saat yang sama.<br>**2.** Given POS menjual dua topi tunai; When dashboard dimuat ulang; Then On Hand turun dua, nilai stok turun $\text{Rp}94.000$ dan kas naik $\text{Rp}219.780$. | T-37, T-38 |
| **F-22** | Audit, Urutan Dokumen, Idempotensi | Must | SR-17, SR-18 | **1.** Given Dokumen valid tersedia; When posting dicoba dua kali; Then tidak ada dokumen atau jurnal rangkap.<br>**2.** Given invoice C002 sudah punya nomor dan satu jurnal; When posting diulang dari UI maupun API; Then nomor, jurnal, serta jumlah saldo tidak mengganda; audit merekam usaha ulang. | T-39, T-40 |
| **F-23** | PPN Per Baris dan Pembulatan | Must | SR-22 | **1.** Given Harga belum pajak tersedia; When invoice/bill dijalankan; Then DPP, PPN, dan grand total valid.<br>**2.** Given invoice dua kaos berharga belum pajak $\text{Rp}318.000$; When perhitungan PPN per baris dilakukan; Then PPN $\text{Rp}34.980$ dan gross $\text{Rp}352.980$; nilai tetap bulat rupiah. | T-17, T-18, T-23, T-24 |
| **F-24** | Smart Button dan Rekam Jejak | Should | SR-19 | **1.** Given Dokumen terkait telah tercipta; When pengguna membuka relasi dan log; Then setiap tautan menunjuk data yang sama.<br>**2.** Given SO-DO-Invoice C002 sudah terhubung; When pengguna menelusuri smart button serta audit posting ulang; Then referensi dan source ID tetap sama, tanpa dokumen duplikat. | T-39, T-40 |
| **F-25** | Pemindaian SKU Barcode | Optional | SR-21 | **1.** Given Perangkat input SKU tersedia; When kode dipindai; Then item yang benar muncul tanpa duplikasi.<br>**2.** Given barcode berisi SKU CAP-OS-BLK; When kasir memindai kode dua kali; Then varian yang benar dipilih dan kuantitas meningkat tanpa dua item master baru. | T-31, T-32 |

---

## 2. Layar Tampilan (S-xx) dan Skenario Pengujian Detail (T-xx)

---

### S-01: Beranda App Switcher
* **Modul:** Home
* **Peran Akses:** Semua Peran
* **Tujuan Utama:** Memilih aplikasi dan entitas perusahaan
* **Fitur Terkait:** F-01

#### T-01 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-01
* **Situasi:** Mulai dari *seed baseline*. Login sebagai `sales.demo`; dataset awal sudah di-seed.
* **Hasil yang Diharapkan:** 7 app utama dapat dibuka sesuai kewenangan; data master tetap konsisten.
* **Bukti Wajib:** Tangkapan layar beranda dan nama pengguna yang aktif.

#### T-02 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-01
* **Situasi:** Mulai dari *seed baseline*. `cashier.demo` mencoba membuka menu jurnal akuntansi.
* **Hasil yang Diharapkan:** Sesuai SR-18, navigasi menyembunyikan/menolak akses menu jurnal dan server menolak permohonan secara tegas.
* **Bukti Wajib:** Rekaman penolakan akses dan identitas peran kasir.

---

### S-02: Pengguna dan Hak Akses
* **Modul:** Settings
* **Peran Akses:** Owner, Finance
* **Tujuan Utama:** Melihat dan mengelola matriks otorisasi/izin peran
* **Fitur Terkait:** F-02

#### T-03 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-02
* **Situasi:** Mulai dari *seed baseline*. `finance.demo` melihat matriks hak akses untuk peran Sales, Warehouse, Finance, Cashier, Procurement, dan Owner.
* **Hasil yang Diharapkan:** 6 peran aktif terdefinisi; Cashier tidak mempunyai hak *post GL* dan mengubah *Credit Limit*.
* **Bukti Wajib:** Tabel peran dan tangkapan layar matriks izin akses.

#### T-04 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-02
* **Situasi:** Mulai dari *seed baseline*. `cashier.demo` mengirim permintaan API langsung untuk menambah batas kredit C001 dari $\text{Rp}5.000.000$.
* **Hasil yang Diharapkan:** Sesuai SR-18, API menolak perubahan, mencatat log audit (actor, timestamp, action), dan nilai kredit C001 tidak berubah.
* **Bukti Wajib:** Respons HTTP/API penolakan dan *audit trail log*.

---

### S-03: Kontak Pelanggan
* **Modul:** Sales
* **Peran Akses:** Sales, Finance
* **Tujuan Utama:** Mengelola profil pelanggan, plafon kredit, dan termin pembayaran
* **Fitur Terkait:** F-03

#### T-05 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-03
* **Situasi:** Mulai dari *seed baseline*. Buka kontak C001 (PT Riau Mode Bersama) dan periksa detail termin.
* **Hasil yang Diharapkan:** C001 memiliki plafon $\text{Rp}5.000.000$, termin `NET14`, dan saldo piutang awal $\text{Rp}2.500.000$.
* **Bukti Wajib:** Tampilan form pelanggan dan data nilai saldo awal.

#### T-06 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-03
* **Situasi:** Mulai dari *seed baseline*. Pengguna Sales memasukkan *Credit Limit* C001 dengan angka negatif $-\text{Rp}100.000$.
* **Hasil yang Diharapkan:** Sesuai SR-11, validasi sistem menolak masukan nilai negatif dan mempertahankan batas plafon sebelumnya.
* **Bukti Wajib:** Pesan validasi eror pada form dan log entri.

---

### S-04: Produk dan Variant SKU
* **Modul:** Inventory
* **Peran Akses:** Warehouse, Sales
* **Tujuan Utama:** Mengelola harga jual, biaya standar, dan stok independen per varian
* **Fitur Terkait:** F-04

#### T-07 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-04
* **Situasi:** Mulai dari *seed baseline*. Buka varian `TSP-M-BLK` di dua lokasi (WH-PKU dan TOKO-PKU).
* **Hasil yang Diharapkan:** Stok WH 12 pcs, TOKO 8 pcs, total perusahaan 20 pcs; valuasi standar $20 \times \text{Rp}88.000 = \text{Rp}1.760.000$.
* **Bukti Wajib:** Master form produk dan laporan stok per lokasi (*stock by location*).

#### T-08 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-04
* **Situasi:** Mulai dari *seed baseline*. Ubah atribut tampilan varian `TSP-L-BLK` tanpa transaksi fisik; periksa SKU ukuran M (`TSP-M-BLK`).
* **Hasil yang Diharapkan:** Sesuai SR-21, varian ukuran M tetap independen (stok dan harga tidak terpengaruh perubahan varian L).
* **Bukti Wajib:** Tangkapan layar kedua kartu SKU produk dan perhitungan stok terkait.

---

### S-05: CRM Pipeline
* **Modul:** CRM
* **Peran Akses:** Sales
* **Tujuan Utama:** Mengelola proses *Lead* hingga *Opportunity* dan pembuatan *Quotation*
* **Fitur Terkait:** F-05

#### T-09 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-05
* **Situasi:** Mulai dari *seed baseline*. Buka Lead `L0007` lalu konversi menjadi Opportunity C002 bernilai 2 kaos.
* **Hasil yang Diharapkan:** *Expected Revenue* tercatat $\text{Rp}318.000$; belum membentuk tagihan AR maupun mutasi stok.
* **Bukti Wajib:** Tampilan Kanban CRM sebelum dan sesudah konversi, serta tautan dokumen lead.

#### T-10 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-05
* **Situasi:** Mulai dari *seed baseline*. Opportunity `L0007` dipicu untuk membuat Quotation sebanyak dua kali (*double click/request*).
* **Hasil yang Diharapkan:** Sesuai SR-17 dan SR-19, sistem bersifat *idempotent* dan hanya menghasilkan satu *Quotation* serta satu tautan relasi.
* **Bukti Wajib:** Struktur relasi Quotation dan log audit *idempotency*.

---

### S-06: Quotation dan Sales Order
* **Modul:** Sales
* **Peran Akses:** Sales, Finance
* **Tujuan Utama:** Konfirmasi order, penguncian harga, dan kontrol limit kredit
* **Fitur Terkait:** F-06, F-07, F-11

#### T-11 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-06; **Fitur Terkait:** F-07, F-11
* **Situasi:** Mulai dari *seed baseline*. Buat Quotation baru untuk pelanggan C002: $4 \times \text{TSP-M-BLK}$, tanpa diskon, belum dikirim.
* **Hasil yang Diharapkan:** DPP/Untaxed $\text{Rp}636.000$, PPN $\text{Rp}69.960$, total $\text{Rp}705.960$; stok *On Hand* belum berkurang.
* **Bukti Wajib:** Dokumen Quotation, status konfirmasi, dan rincian kalkulasi per baris.

#### T-12 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-06; **Fitur Terkait:** F-07, F-11
* **Situasi:** Mulai dari *seed baseline*. C001 mencoba mengonfirmasi pesanan $20 \times \text{JKT-M-BLK}$; staf Sales juga mengajukan diskon $15\%$ tanpa otorisasi.
* **Hasil yang Diharapkan:** Sesuai SR-07, SR-08, dan SR-11, konfirmasi tertahan karena melampaui *credit exposure* dan diskon $>10\%$ diblokir tanpa persetujuan Owner.
* **Bukti Wajib:** Notifikasi peringatan kredit, status blokir otorisasi diskon, dan log audit.

---

### S-07: Stock Forecast dan Reservation
* **Modul:** Inventory
* **Peran Akses:** Warehouse, Sales
* **Tujuan Utama:** Pemantauan kuantitas *On Hand*, *Reserved*, dan *Available* (ATP)
* **Fitur Terkait:** F-08

#### T-13 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-08
* **Situasi:** Mulai dari *seed baseline*. Setelah pesanan C002 sebanyak 4 unit `TSP-M-BLK` dikonfirmasi, lakukan reservasi di WH-PKU.
* **Hasil yang Diharapkan:** *Reserved* WH-PKU naik dari 3 ke 7; *Available* WH-PKU turun dari 9 ke 5; *On Hand* WH-PKU tetap 12.
* **Bukti Wajib:** Tampilan laporan *Stock Forecast* sebelum dan sesudah reservasi.

#### T-14 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-08
* **Situasi:** Mulai dari *seed baseline*. Sales Order baru meminta reservasi 10 unit `TSP-M-BLK` dari gudang WH-PKU.
* **Hasil yang Diharapkan:** Sesuai SR-09, aturan ATP menolak reservasi karena stok *Available* di lokasi tersebut hanya 9 unit.
* **Bukti Wajib:** Pesan penolakan reservasi ATP dan tampilan rinci angka stok.

---

### S-08: Delivery Order / Backorder
* **Modul:** Inventory
* **Peran Akses:** Warehouse
* **Tujuan Utama:** Pengiriman barang parsial, pemrosesan *backorder*, dan pengakuan COGS
* **Fitur Terkait:** F-09

#### T-15 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-09
* **Situasi:** Setelah T-13 (*fixture*). Validasi dokumen *Delivery Order* untuk 2 dari 4 unit `TSP-M-BLK`.
* **Hasil yang Diharapkan:** *On Hand* WH-PKU menjadi 10; *Backorder* otomatis terbentuk untuk 2 unit; COGS $\text{Rp}176.000$ diakui; persediaan perusahaan berkurang $\text{Rp}176.000$.
* **Bukti Wajib:** Dokumen Delivery Order, Backorder, *Stock Move*, dan jurnal akuntansi terkait.

#### T-16 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-09
* **Situasi:** Setelah T-15 (*fixture*). Selesaikan pengiriman *Backorder* 2 kaos, lalu coba lakukan validasi ulang pada dokumen *delivery* lama.
* **Hasil yang Diharapkan:** Sesuai SR-10, SR-17, dan SR-23, total unit terkirim bernilai 4, akumulasi COGS sebesar $\text{Rp}352.000$, dan tidak terjadi *stock move* ganda.
* **Bukti Wajib:** Dokumen penyelesaian Backorder dan dua entri jurnal *stock move*.

---

### S-09: Customer Invoice
* **Modul:** Invoicing
* **Peran Akses:** Finance, Sales
* **Tujuan Utama:** Penagihan berbasis kuantitas terkirim (*delivered-not-yet-invoiced*)
* **Fitur Terkait:** F-10, F-23

#### T-17 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-10; **Fitur Terkait:** F-23
* **Situasi:** Setelah T-15 (*fixture*). Penerbitan *Customer Invoice* atas pengiriman 2 unit `TSP-M-BLK` untuk pelanggan C002.
* **Hasil yang Diharapkan:** DPP $\text{Rp}318.000$, PPN $\text{Rp}34.980$, total faktur $\text{Rp}352.980$; saldo piutang (AR) C002 meningkat sebesar total tersebut.
* **Bukti Wajib:** Dokumen Customer Invoice, status faktur, *Ledger AR*, dan jurnal PPN.

#### T-18 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-10; **Fitur Terkait:** F-23
* **Situasi:** Mulai dari *seed baseline*. Konfirmasi SO pelanggan C002 untuk 4 unit tanpa proses *delivery* (Delivered Qty = 0), lalu minta buatkan invoice 4 unit.
* **Hasil yang Diharapkan:** Sesuai SR-01 dan SR-02, kebijakan *delivered-based* menolak pembuatan invoice (kuantitas dapat ditagih = 0).
* **Bukti Wajib:** Dokumen SO dan tangkapan layar alasan penolakan/blokir faktur.

---

### S-10: RFQ dan Purchase Order
* **Modul:** Purchase
* **Peran Akses:** Procurement
* **Tujuan Utama:** Pembuatan RFQ, konfirmasi PO, dan komitmen kuantitas
* **Fitur Terkait:** F-12

#### T-19 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-12
* **Situasi:** Mulai dari *seed baseline*. Buat RFQ ke vendor V03 untuk $10 \times \text{JNS-30-BLU}$ @$\text{Rp}168.000$, konfirmasi menjadi PO0008 baru.
* **Hasil yang Diharapkan:** DPP $\text{Rp}1.680.000$, PPN proyeksi $\text{Rp}184.800$, total perkiraan $\text{Rp}1.864.800$; saldo stok fisik belum berubah.
* **Bukti Wajib:** Dokumen Purchase Order, rincian harga per baris, dan status penerimaan.

#### T-20 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-12
* **Situasi:** Mulai dari *seed baseline*. Setelah PO diterbitkan, staf Procurement mencoba mengajukan permintaan pembayaran penuh tanpa adanya *receipt*.
* **Hasil yang Diharapkan:** Sesuai SR-05 dan SR-06, sistem menolak pembuatan pembayaran/faktur utang karena belum ada *accepted receipt*.
* **Bukti Wajib:** Pesan penolakan dan indikator relasi dokumen PO-Bill.

---

### S-11: Receipt dan Acceptance
* **Modul:** Inventory
* **Peran Akses:** Warehouse
* **Tujuan Utama:** Penerimaan fisik barang, pemeriksaan kualitas (*accepted/rejected*)
* **Fitur Terkait:** F-13

#### T-21 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-13
* **Situasi:** Setelah T-19 (*fixture*). Dari PO0008 ($10 \times \text{JNS-30-BLU}$), terima 8 unit kondisi baik (*accepted*) dan 2 unit rusak (*rejected*).
* **Hasil yang Diharapkan:** Stok SKU WH-PKU naik dari 9 ke 17 pcs; nilai persediaan perusahaan bertambah $+\text{Rp}1.344.000$; 2 unit *rejected* tidak masuk ke stok siap jual.
* **Bukti Wajib:** Dokumen Receipt, rincian kuantitas accepted/rejected, dan kartu stok.

#### T-22 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-13
* **Situasi:** Mulai dari *seed baseline*. Dari PO 10 unit, petugas memasukkan *Accepted* 8 dan *Rejected* 3 (total 11 unit), atau mencoba menjual barang *rejected*.
* **Hasil yang Diharapkan:** Sesuai SR-12 dan SR-24, sistem menolak proses penerimaan $8 + 3 > 10$ dan melarang mutasi barang *rejected* ke stok siap jual.
* **Bukti Wajib:** Validasi penolakan kuantitas dan laporan mutasi persediaan.

---

### S-12: Vendor Bill
* **Modul:** Accounting
* **Peran Akses:** Finance
* **Tujuan Utama:** Pencatatan tagihan pemasok dengan validasi *Three-Way Match*
* **Fitur Terkait:** F-14, F-23

#### T-23 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-14; **Fitur Terkait:** F-23
* **Situasi:** Setelah T-21 (*fixture*). Buat Vendor Bill untuk V03 berdasarkan PO0008 atas 8 unit barang yang diterima baik.
* **Hasil yang Diharapkan:** DPP $\text{Rp}1.344.000$, PPN $\text{Rp}147.840$, total tagihan $\text{Rp}1.491.840$; Utang Usaha (AP) meningkat sebesar nilai total.
* **Bukti Wajib:** Dokumen Vendor Bill, tautan dokumen receipt, dan *Ledger AP*.

#### T-24 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-14; **Fitur Terkait:** F-23
* **Situasi:** Setelah T-21 (*fixture*). Vendor mengirimkan faktur tagihan untuk 10 unit barang padahal kuantitas *accepted* hanya 8 unit.
* **Hasil yang Diharapkan:** Sesuai SR-06 dan SR-13, validasi *Three-Way Match* menolak penagihan kelebihan 2 unit sebelum proses *posting*.
* **Bukti Wajib:** Laporan ketidakcocokan (*mismatch*) PO-Receipt-Bill dan status pemblokiran.

---

### S-13: Register Payment
* **Modul:** Accounting
* **Peran Akses:** Finance
* **Tujuan Utama:** Pencatatan pembayaran sebagian/pelunasan dan rekonsiliasi kas/bank
* **Fitur Terkait:** F-15

#### T-25 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-15
* **Situasi:** Setelah T-17 (*fixture*). Penerimaan pembayaran bank secara parsial sebesar $\text{Rp}200.000$ atas Customer Invoice C002.
* **Hasil yang Diharapkan:** Sisa piutang C002 menjadi $\text{Rp}152.980$; Saldo akun Bank naik dari $\text{Rp}50.000.000$ menjadi $\text{Rp}50.200.000$.
* **Bukti Wajib:** Bukti Register Payment, status keterkaitan faktur, dan *Ledger Bank*.

#### T-26 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-15
* **Situasi:** Setelah T-23 (*fixture*). Pelunasan Vendor Bill V03 sebesar $\text{Rp}1.491.840$ melalui bank, kemudian pemicu pembayaran dikirim ulang dengan kunci transaksi yang sama.
* **Hasil yang Diharapkan:** Sesuai SR-06, SR-17, dan SR-20, utang V03 lunas tepat satu kali dan saldo akun bank terpotong hanya satu kali (*anti-duplikasi*).
* **Bukti Wajib:** Bukti bayar *Paid Bill*, saldo AP, saldo Bank, dan log pencegahan duplikasi.

---

### S-14: Journal Entries dan General Ledger
* **Modul:** Accounting
* **Peran Akses:** Finance, Owner
* **Tujuan Utama:** Verifikasi keseimbangan debit-kredit jurnal dan pengakuan COGS
* **Fitur Terkait:** F-16

#### T-27 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-16
* **Situasi:** Setelah T-15 (*fixture*). Periksa jurnal pengakuan biaya (COGS) atas pengiriman 2 unit kaos.
* **Hasil yang Diharapkan:** Debit akun Beban Pokok Penjualan (5000) $\text{Rp}176.000$ dan Kredit akun Persediaan (1200) $\text{Rp}176.000$; kondisi jurnal seimbang ($D=K$).
* **Bukti Wajib:** Tampilan General Ledger dan entri *Stock Move*.

#### T-28 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-16
* **Situasi:** Setelah T-17 (*fixture*). Mengirimkan instruksi *Post* ulang pada Customer Invoice yang sudah berstatus *Posted*.
* **Hasil yang Diharapkan:** Sesuai SR-17 dan SR-22, sistem mengabaikan *posting* ulang (*idempotent*), jurnal akuntansi tidak mengganda, dan $Debit = Kredit$.
* **Bukti Wajib:** Daftar rincian baris jurnal (*journal lines*) dan jumlah entri tercatat.

---

### S-15: POS Session
* **Modul:** Point of Sale
* **Peran Akses:** Cashier, Owner
* **Tujuan Utama:** Pengelolaan sesi kasir, saldo kas awal (*float*), dan penutupan sesi (*closing*)
* **Fitur Terkait:** F-17

#### T-29 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-17
* **Situasi:** Mulai dari *seed baseline*. Kasir membuka sesi POS baru `POS/0001` dengan uang kas awal (*float*) sebesar $\text{Rp}500.000$.
* **Hasil yang Diharapkan:** Saldo awal kas tercatat $\text{Rp}500.000$; total transaksi penjualan Rp0; estimasi saldo kas (*expected cash*) $\text{Rp}500.000$.
* **Bukti Wajib:** Rincian status pembukaan sesi dan saldo kasir.

#### T-30 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-17
* **Situasi:** Setelah T-31 (*fixture*). Kasir menutup sesi dengan hitungan fisiknya $\text{Rp}719.780$ (termasuk float $\text{Rp}500.000$). Setelah penutupan pertama sukses, kasir mengklik ulang tombol *Close Session*.
* **Hasil yang Diharapkan:** Sesuai SR-15 dan SR-17, *variance* tercatat Rp0 dan percobaan penutupan sesi kedua tidak menghasilkan pencatatan jurnal ganda.
* **Bukti Wajib:** Laporan penutupan sesi (*session closing report*), perbandingan *counted vs expected*, dan log audit.

---

### S-16: POS Checkout dan Receipt
* **Modul:** Point of Sale
* **Peran Akses:** Cashier
* **Tujuan Utama:** Penjualan ritel tunai, validasi stok gerai, pencetakan resi, dan pengakuan COGS
* **Fitur Terkait:** F-18, F-25

#### T-31 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-18; **Fitur Terkait:** F-25
* **Situasi:** Mulai dari *seed baseline*. Kasir menjual 2 unit `CAP-OS-BLK` secara tunai dari gerai TOKO-PKU.
* **Hasil yang Diharapkan:** Total transaksi $\text{Rp}219.780$ (DPP $\text{Rp}198.000$ + PPN $\text{Rp}21.780$); stok TOKO-PKU berkurang dari 12 ke 10 pcs; COGS diakui $\text{Rp}94.000$.
* **Bukti Wajib:** Struk/Resi POS, dokumen mutasi stok, dan entri jurnal terposting.

#### T-32 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-18; **Fitur Terkait:** F-25
* **Situasi:** Mulai dari *seed baseline*. Kasir mencoba menjual 13 unit `CAP-OS-BLK` dari gerai TOKO-PKU (stok awal hanya 12 unit).
* **Hasil yang Diharapkan:** Sesuai SR-03 dan SR-04, sistem memblokir transaksi penjualan agar stok lokasi asal tidak bernilai negatif.
* **Bukti Wajib:** Tampilan pesan penolakan transaksi di POS dan kartu stok lokasi TOKO-PKU.

---

### S-17: Customer Return / Credit Note
* **Modul:** Invoicing
* **Peran Akses:** Sales, Finance, Warehouse
* **Tujuan Utama:** Pemrosesan retur penjualan, *Credit Note*, dan pemulihan persediaan
* **Fitur Terkait:** F-19

#### T-33 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-19
* **Situasi:** Setelah T-17 (*fixture*). Pengajuan retur 1 unit `TSP-M-BLK` kondisi layak jual (*saleable*) dalam kurun waktu $\le 14$ hari.
* **Hasil yang Diharapkan:** Terbentuk Credit Note $\text{Rp}176.490$ (termasuk PPN $\text{Rp}17.490$); stok WH-PKU bertambah $+1$; pembalikan COGS $\text{Rp}88.000$; sisa tagihan C002 turun menjadi $\text{Rp}176.490$.
* **Bukti Wajib:** Dokumen Return, Credit Note, alokasi penyesuaian piutang, dan jurnal penyesuaian GL.

#### T-34 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-19
* **Situasi:** Setelah T-17 (*fixture*). Pengajuan retur barang dilakukan melampaui batas $14$ hari tanpa otorisasi dari Owner.
* **Hasil yang Diharapkan:** Sesuai SR-14, sistem menolak pemrosesan retur sehingga dokumen *Credit Note* dan mutasi stok balik tidak dibuat.
* **Bukti Wajib:** Parameter tanggal faktur asal, rentang hari retur, dan pesan validasi penolakan.

---

### S-18: Internal Transfer
* **Modul:** Inventory
* **Peran Akses:** Warehouse
* **Tujuan Utama:** Pemindahan stok antarlokasi tanpa mengubah total stok perusahaan
* **Fitur Terkait:** F-20

#### T-35 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-20
* **Situasi:** Mulai dari *seed baseline*. Transfer 3 unit `CAP-OS-BLK` dari Gudang WH-PKU ke Gerai TOKO-PKU.
* **Hasil yang Diharapkan:** Stok WH-PKU berkurang dari 15 ke 12 pcs, stok TOKO-PKU naik dari 12 ke 15 pcs; total stok perusahaan tetap 27 pcs dan total nilai persediaan tetap $\text{Rp}24.531.000$.
* **Bukti Wajib:** Dokumen Internal Transfer dan saldo persediaan di kedua lokasi.

#### T-36 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-20
* **Situasi:** Mulai dari *seed baseline*. Petugas Gudang mengajukan transfer 16 unit `CAP-OS-BLK` dari WH-PKU (stok tersedia hanya 15 unit).
* **Hasil yang Diharapkan:** Sesuai SR-16, transaksi diblokir karena melebihi stok *Available* lokasi asal; saldo di kedua lokasi tidak berubah.
* **Bukti Wajib:** Peringatan penolakan transfer stok dan rincian kuantitas lokasi.

---

### S-19: Dashboard Operasional
* **Modul:** Reporting
* **Peran Akses:** Owner, Finance
* **Tujuan Utama:** Monitoring KPI operasional, persediaan, piutang, utang, dan fasilitas *drill-down*
* **Fitur Terkait:** F-21

#### T-37 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-21
* **Situasi:** Mulai dari *seed baseline*. Buka Dashboard Operasional sesaat setelah memuat *seed* tanpa transaksi baru.
* **Hasil yang Diharapkan:** KPI menampilkan On Hand 219 pcs, Reserved 3 pcs, Available 216 pcs, Nilai Stok $\text{Rp}24.531.000$, Open AR $\text{Rp}2.500.000$, dan Open AP $\text{Rp}5.000.000$.
* **Bukti Wajib:** Tampilan ringkasan KPI dan navigasi *drill-down* ke dokumen sumber.

#### T-38 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-21
* **Situasi:** Setelah T-31 (*fixture*). Lakukan *refresh* pada dashboard operasional dan periksa pembaruan indikator.
* **Hasil yang Diharapkan:** Sesuai SR-19, indikator On Hand turun 2 pcs, nilai stok turun $\text{Rp}94.000$, dan kas bertambah $\text{Rp}219.780$ secara *real-time*.
* **Bukti Wajib:** Tampilan KPI sebelum vs sesudah transaksi dan tautan penelusuran dokumen transaksi POS.

---

### S-20: Audit dan Related Documents
* **Modul:** Home
* **Peran Akses:** Owner, Finance
* **Tujuan Utama:** Penelusuran rantai dokumen (*Smart Buttons*), rekam jejak audit, dan verifikasi *idempotency*
* **Fitur Terkait:** F-22, F-24

#### T-39 — Normal Flow
* **Tipe Tes:** Normal Flow
* **Linked Feature:** F-22; **Fitur Terkait:** F-24
* **Situasi:** Setelah T-17 (*fixture*). Telusuri rantai dokumen transaksi C002 mulai dari Sales Order, Delivery Order, hingga Customer Invoice dan riwayat audit aktor.
* **Hasil yang Diharapkan:** Terdapat minimal satu tautan relasi yang konsisten antar dokumen; nilai faktur $\text{Rp}352.980$ dan status *delivered 2* dapat ditelusuri secara utuh.
* **Bukti Wajib:** Tampilan *Smart Buttons*, *timestamps* audit, dan ID unik dokumen sumber.

#### T-40 — Rule / Edge Case
* **Tipe Tes:** Rule / Edge Case
* **Linked Feature:** F-22; **Fitur Terkait:** F-24
* **Situasi:** Setelah T-17 (*fixture*). Pengguna menekan tombol *Post* dua kali berturut-turut melalui antarmuka (UI) dan pemicuan langsung (Direct API Request).
* **Hasil yang Diharapkan:** Sesuai SR-17 dan SR-18, faktur tetap mempertahankan 1 nomor unik, 1 entri jurnal, serta log mencatat 2 kali percobaan aksi dengan aktor dan timestamp jelas.
* **Bukti Wajib:** Satu nomor invoice, satu entri jurnal, dan rekam jejak log percobaan ganda.

---

## 3. Matriks Pemetaan Lintas Fitur, Layar, dan Pengujian

| Kode Fitur | Nama Fitur | Kode Layar | Skenario Normal | Skenario Rule / Edge Case |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | Navigasi dan Identitas Aplikasi | S-01 | T-01 | T-02 |
| **F-02** | Hak Akses Per Peran | S-02 | T-03 | T-04 |
| **F-03** | Kontak dan Termin Pembayaran | S-03 | T-05 | T-06 |
| **F-04** | Produk dan SKU Varian | S-04 | T-07 | T-08 |
| **F-05** | Pipeline CRM | S-05 | T-09 | T-10 |
| **F-06** | Quotation menjadi Sales Order | S-06 | T-11 | T-12 |
| **F-07** | Diskon Terkendali dan Harga Terkunci | S-06 | T-11 | T-12 |
| **F-08** | ATP dan Reservasi Per Lokasi | S-07 | T-13 | T-14 |
| **F-09** | Pengiriman Parsial dan Backorder | S-08 | T-15 | T-16 |
| **F-10** | Invoice Berdasarkan Pengiriman | S-09 | T-17 | T-18 |
| **F-11** | Pengendalian Plafon Kredit | S-06 | T-11 | T-12 |
| **F-12** | RFQ dan Purchase Order | S-10 | T-19 | T-20 |
| **F-13** | Receipt dan Barang Diterima | S-11 | T-21 | T-22 |
| **F-14** | Vendor Bill dengan Three-Way Match | S-12 | T-23 | T-24 |
| **F-15** | Pembayaran Parsial dan Rekonsiliasi | S-13 | T-25 | T-26 |
| **F-16** | Jurnal Seimbang dan Pengakuan COGS | S-14 | T-27 | T-28 |
| **F-17** | Sesi Kasir POS | S-15 | T-29 | T-30 |
| **F-18** | Penjualan POS dan Validasi Stok | S-16 | T-31 | T-32 |
| **F-19** | Retur dan Credit Note | S-17 | T-33 | T-34 |
| **F-20** | Transfer Antar-Lokasi | S-18 | T-35 | T-36 |
| **F-21** | Dashboard Keterlacakan | S-19 | T-37 | T-38 |
| **F-22** | Audit, Urutan Dokumen, Idempotensi | S-20 | T-39 | T-40 |
| **F-23** | PPN Per Baris dan Pembulatan | S-09, S-12 | T-17, T-23 | T-18, T-24 |
| **F-24** | Smart Button dan Rekam Jejak | S-20 | T-39 | T-40 |
| **F-25** | Pemindaian SKU Barcode | S-16 | T-31 | T-32 |