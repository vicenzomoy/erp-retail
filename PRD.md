# Product Requirements Document (PRD) - ERP Retail Fashion (Bara Wear)

## 1. Project Overview
Aplikasi ERP berbasis web untuk PT Bara Ritel Nusantara (Bara Wear). Sistem ini mereplikasi alur kerja inti dan antarmuka **Odoo Web 17.0** (App Switcher, Kanban, List, Form views). Sistem ini menghubungkan proses Penjualan (B2B/B2C), Gudang, Pembelian, Akuntansi, dan Point of Sale (POS) secara terintegrasi dan real-time.

## 2. Tech Stack
*   **Backend:** Laravel 13
*   **Frontend:** React (Inertia.js) + Tailwind CSS (untuk mereplikasi UI/UX Odoo)
*   **Database:** PostgreSQL (Development) & Neon PostgreSQL (Deployment)

## 3. Core Modules & Flows
Sistem terdiri dari 4 flow end-to-end utama:
1.  **Order to Cash (Sales & CRM):** Lead -> Opportunity -> Quotation -> Sales Order (SO) -> Delivery Order (DO) -> Customer Invoice -> Payment.
2.  **Procure to Pay (Purchase):** RFQ -> Purchase Order (PO) -> Receipt (penerimaan gudang) -> Vendor Bill -> Payment.
3.  **Point of Sale (POS):** POS Session (Open Cash/Float) -> Basket -> Validasi Stok -> Paid Receipt -> POS Journal -> Session Closing.
4.  **Return / Credit Note:** Original Invoice -> Return Inspection -> Return Stock Move -> Credit Note.

## 4. Critical Business Rules (Wajib Diimplementasikan)
*Ini adalah batasan logika paling penting (berdasarkan dokumen SR-xx).*

*   **Invoicing Policy (SR-02, SR-10):** *Customer Invoice* **hanya** boleh dibuat berdasarkan kuantitas barang yang sudah terkirim (*Delivered Qty*), bukan kuantitas pesanan awal. Pengiriman parsial akan membuat *Backorder*.
*   **Billing Policy (SR-06, SR-12, SR-13):** *Vendor Bill* menggunakan skema *3-way matching*. Tagihan maksimal adalah sebesar kuantitas yang **diterima dan lolos QC (*Accepted Qty*)**, bukan kuantitas PO awal. Barang *Rejected* dipisah.
*   **Stock & Reservation (SR-04, SR-09, SR-16):** Stok tidak boleh negatif (*Available = On Hand - Reserved*). Fitur POS, Delivery, dan Transfer lokasi wajib memvalidasi stok.
*   **Idempotency & Accounting (SR-17):** Klik ganda pada aksi kritis (seperti *Post Journal*, *Close Session*, *Confirm Order*) **TIDAK BOLEH** menghasilkan pencatatan ganda.
*   **Credit Exposure (SR-11):** Transaksi Sales Order harus ditahan jika tagihan terbuka (AR) + *gross order* melebihi Limit Kredit pelanggan.
*   **COGS Recognition (SR-23):** Biaya Pokok Penjualan (COGS) diakui (*Journal Entry*) pada saat *Delivery Done*, bukan saat pesanan dibuat.

## 5. UI/UX "Vibe" (Odoo 17 Replica)
*   **App Switcher:** Layar awal berisi *tiles* aplikasi (Sales, CRM, Inventory, dll).
*   **Views:** Setiap entitas memiliki 3 mode tampilan: *List View* (tabel), *Kanban View* (kartu drag-and-drop untuk CRM/status), dan *Form View* (detail data).
*   **Smart Buttons:** Di dalam Form View, harus ada tombol relasi di pojok kanan atas (misal: di Form SO, ada tombol melihat DO atau Invoice terkait).