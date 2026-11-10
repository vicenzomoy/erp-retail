<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use App\Services\Navigation\AppCatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Definisi terstruktur matriks hak akses & wewenang operasional untuk 6 peran utama ERP.
     */
    protected function getRoleAccessDefinitions(): array
    {
        return [
            'owner' => [
                'id'           => 'owner',
                'display_name' => 'Owner',
                'badge_color'  => 'amber',
                'tagline'      => 'Eksekutif & Pemilik Bisnis (Superuser)',
                'summary'      => 'Memiliki akses penuh ke seluruh modul aplikasi ERP, laporan eksekutif, buku besar akuntansi, serta wewenang persetujuan diskon penjualan di atas 20%.',
                'capabilities' => [
                    ['module' => 'Dashboard', 'action' => 'Akses Executive Dashboard, Laba Rugi, dan Persetujuan Diskon > 20%', 'allowed' => true],
                    ['module' => 'Sales & CRM', 'action' => 'Akses penuh Pipeline CRM, Quotation, Sales Order, Retur RMA, dan Persetujuan Diskon', 'allowed' => true],
                    ['module' => 'Accounting', 'action' => 'Akses penuh Faktur, Tagihan Pemasok, Pembayaran, Jurnal Umum, dan Buku Besar (GL)', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Akses penuh Penerimaan, Pengiriman, Transfer Internal, QC Retur, dan Stok', 'allowed' => true],
                    ['module' => 'Purchase', 'action' => 'Akses penuh Purchase Order (PO), RFQ, dan Master Pemasok (Vendor)', 'allowed' => true],
                    ['module' => 'Point of Sale', 'action' => 'Akses penuh Sesi Kasir, Transaksi POS, dan Ringkasan Harian', 'allowed' => true],
                    ['module' => 'Settings', 'action' => 'Kelola Pengguna, Peran, dan Konfigurasi Hak Akses Sistem', 'allowed' => true],
                ],
            ],
            'finance' => [
                'id'           => 'finance',
                'display_name' => 'Finance',
                'badge_color'  => 'emerald',
                'tagline'      => 'Keuangan, Akuntansi & Penagihan (AR/AP/GL)',
                'summary'      => 'Bertanggung jawab atas penerbitan Faktur Pelanggan, verifikasi 3-Way Matching Tagihan Pemasok, pencatatan pembayaran kas/bank, Buku Besar, batas kredit pelanggan di modul Sales, serta peninjauan hak akses di modul Settings.',
                'capabilities' => [
                    ['module' => 'Accounting', 'action' => 'Buat & Posting Faktur Pelanggan (Customer Invoice berbasis barang terkirim)', 'allowed' => true],
                    ['module' => 'Accounting', 'action' => 'Buat & Posting Tagihan Pemasok (Vendor Bill berbasis hasil lolos QC gudang)', 'allowed' => true],
                    ['module' => 'Accounting', 'action' => 'Catat Pembayaran Kas/Bank (Register Payment Inbound AR & Outbound AP)', 'allowed' => true],
                    ['module' => 'Accounting', 'action' => 'Terbitkan Nota Kredit (Credit Note) & Akses Jurnal Umum / Buku Besar (GL)', 'allowed' => true],
                    ['module' => 'Sales', 'action' => 'Ubah Batas Kredit (Credit Limit) Pelanggan & Pantau Pesanan Penjualan', 'allowed' => true],
                    ['module' => 'Settings', 'action' => 'Lihat Daftar Pengguna, Matriks Hak Akses Seluruh Peran, & Audit Percobaan Akses', 'allowed' => true],
                    ['module' => 'CRM', 'action' => 'Mengakses Modul CRM / Pipeline Lead (Khusus Sales & Owner)', 'allowed' => false],
                    ['module' => 'Sales', 'action' => 'Menyetujui Diskon Penjualan > 20% (Khusus Wewenang Owner)', 'allowed' => false],
                ],
            ],
            'sales' => [
                'id'           => 'sales',
                'display_name' => 'Sales',
                'badge_color'  => 'indigo',
                'tagline'      => 'Penjualan B2B/Grosir & Akuisisi Pelanggan (CRM)',
                'summary'      => 'Mengelola prospek pelanggan di CRM, membuat penawaran harga (Quotation), mengonfirmasi Sales Order (SO), mengajukan retur pelanggan (RMA), serta melihat stok di modul Inventory secara Read-Only.',
                'capabilities' => [
                    ['module' => 'CRM', 'action' => 'Kelola Lead & Pipeline Opportunity (New, Qualified, Won, Lost)', 'allowed' => true],
                    ['module' => 'Sales', 'action' => 'Buat Penawaran (Quotation), Konfirmasi Sales Order, dan Kelola Data Pelanggan', 'allowed' => true],
                    ['module' => 'Sales', 'action' => 'Buat Pengajuan Retur Pelanggan (RMA maksimal 14 hari sejak pengiriman)', 'allowed' => true],
                    ['module' => 'Inventory (Read-Only)', 'action' => 'Lihat Stok Produk, Status Pengiriman (WH/OUT), dan Perkiraan Stok (ATP) secara Read-Only', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Memvalidasi Pengiriman/Penerimaan, Transfer Stok, atau Mengubah Data Produk Gudang', 'allowed' => false],
                    ['module' => 'Sales', 'action' => 'Menyetujui Diskon > 20% Tanpa Persetujuan Owner (Otomatis Discount Hold)', 'allowed' => false],
                    ['module' => 'Sales', 'action' => 'Mengubah Batas Kredit (Credit Limit) Pelanggan', 'allowed' => false],
                    ['module' => 'Accounting', 'action' => 'Memposting Faktur atau Mencatat Pembayaran ke Buku Besar', 'allowed' => false],
                ],
            ],
            'warehouse' => [
                'id'           => 'warehouse',
                'display_name' => 'Warehouse',
                'badge_color'  => 'teal',
                'tagline'      => 'Operasional Gudang, Logistik & Quality Control',
                'summary'      => 'Menangani fisik pergerakan barang di gudang pusat (WH-PKU) dan toko (STORE-PKU), meliputi penerimaan barang pemasok (QC), pengiriman pesanan pelanggan, transfer internal, serta inspeksi barang retur.',
                'capabilities' => [
                    ['module' => 'Inventory', 'action' => 'Validasi Penerimaan Barang PO (WH/IN) & Pemeriksaan QC (Accepted/Rejected)', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Validasi Surat Jalan Pengiriman Pelanggan (WH/OUT) & Buat Backorder Parsial', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Buat & Validasi Transfer Internal Antar Lokasi (WH-PKU ke STORE-PKU)', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Validasi Inspeksi Fisik Barang Retur Pelanggan (RMA QC)', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Kelola Produk, Varian SKU, dan Lokasi Penyimpanan Gudang', 'allowed' => true],
                    ['module' => 'Sales / Purchase', 'action' => 'Membuat Sales Order atau Purchase Order', 'allowed' => false],
                    ['module' => 'Accounting', 'action' => 'Mengakses Faktur, Pembayaran, atau Buku Besar Akuntansi', 'allowed' => false],
                ],
            ],
            'procurement' => [
                'id'           => 'procurement',
                'display_name' => 'Procurement',
                'badge_color'  => 'orange',
                'tagline'      => 'Pengadaan Barang & Manajemen Pemasok (Purchasing)',
                'summary'      => 'Mengelola pengadaan barang dagang ke pemasok (RFQ & Purchase Order) serta memantau ketersediaan stok dan status penerimaan barang di gudang secara Read-Only.',
                'capabilities' => [
                    ['module' => 'Purchase', 'action' => 'Buat & Konfirmasi Request for Quotation (RFQ) dan Purchase Order (PO)', 'allowed' => true],
                    ['module' => 'Purchase', 'action' => 'Kelola Data Master Pemasok (Vendors) dan Laporan Pembelian', 'allowed' => true],
                    ['module' => 'Inventory (Read-Only)', 'action' => 'Lihat Overview, Status Penerimaan (WH/IN), Produk, Perkiraan ATP, dan Pergerakan Stok', 'allowed' => true],
                    ['module' => 'Inventory', 'action' => 'Memvalidasi Penerimaan Barang (WH/IN) atau Mengubah Stok Gudang', 'allowed' => false],
                    ['module' => 'Inventory', 'action' => 'Mengakses Menu Pengiriman (WH/OUT), Transfer Internal, dan Konfigurasi Lokasi', 'allowed' => false],
                    ['module' => 'Accounting', 'action' => 'Memvalidasi / Memposting Tagihan Pemasok (Vendor Bill)', 'allowed' => false],
                ],
            ],
            'cashier' => [
                'id'           => 'cashier',
                'display_name' => 'Cashier',
                'badge_color'  => 'rose',
                'tagline'      => 'Kasir Toko Fisik (Point of Sale)',
                'summary'      => 'Melayani transaksi penjualan langsung di gerai toko fisik (STORE-PKU), membuka/menutup sesi kasir harian, serta memproses pembayaran tunai, kartu, dan QRIS.',
                'capabilities' => [
                    ['module' => 'Point of Sale', 'action' => 'Buka & Tutup Sesi Kasir (POS Session) dengan Pencatatan Saldo Kas', 'allowed' => true],
                    ['module' => 'Point of Sale', 'action' => 'Proses Penjualan Ritel (POS Checkout) dengan Validasi Stok Real-Time', 'allowed' => true],
                    ['module' => 'Point of Sale', 'action' => 'Lihat Riwayat Pesanan POS dan Laporan Ringkasan Harian Kasir', 'allowed' => true],
                    ['module' => 'Accounting', 'action' => 'Mengakses atau Memposting Jurnal Buku Besar (post_gl)', 'allowed' => false],
                    ['module' => 'Sales', 'action' => 'Mengubah Batas Kredit Pelanggan atau Menyetujui Diskon Khusus', 'allowed' => false],
                    ['module' => 'Inventory', 'action' => 'Melakukan Transfer Stok atau Validasi Penerimaan/Pengiriman Gudang', 'allowed' => false],
                ],
            ],
        ];
    }

    /**
     * Halaman Daftar Pengguna (Users) — sekaligus halaman utama Settings.
     */
    public function users(Request $request): Response
    {
        $roleFilter = $request->query('role', 'all');
        $search     = trim((string) $request->query('search', ''));

        $roleDefinitions = $this->getRoleAccessDefinitions();
        $roles           = Role::withCount('users')->get()->keyBy('id');

        $query = User::with('role')->orderBy('id');

        if ($roleFilter !== 'all') {
            $query->where('role_id', $roleFilter);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('role_id', 'ilike', "%{$search}%");
            });
        }

        $users = $query->get()->map(function (User $u) use ($roleDefinitions) {
            $allowedApps = [];
            foreach (AppCatalogService::APPS as $appKey => $appMeta) {
                if (in_array($u->role_id, $appMeta['roles'], true)) {
                    $allowedApps[] = [
                        'key'       => $appKey,
                        'name'      => $appMeta['name'],
                        'read_only' => in_array($u->role_id, ['procurement', 'sales'], true) && $appKey === 'inventory',
                    ];
                }
            }

            $def = $roleDefinitions[$u->role_id] ?? null;

            return [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'role_id'      => $u->role_id,
                'role_name'    => $u->role?->display_name ?? ucfirst($u->role_id),
                'role_tagline' => $def['tagline'] ?? ($u->role?->description ?? ''),
                'badge_color'  => $def['badge_color'] ?? 'slate',
                'is_active'    => (bool) $u->is_active,
                'allowed_apps' => $allowedApps,
                'created_at'   => $u->created_at?->format('d/m/Y'),
            ];
        });

        $roleList = collect(['owner', 'finance', 'sales', 'warehouse', 'procurement', 'cashier'])
            ->map(function (string $roleId) use ($roles, $roleDefinitions) {
                $roleModel = $roles->get($roleId);
                $def       = $roleDefinitions[$roleId];
                return [
                    'id'           => $roleId,
                    'display_name' => $roleModel?->display_name ?? $def['display_name'],
                    'description'  => $roleModel?->description ?? $def['summary'],
                    'badge_color'  => $def['badge_color'],
                    'users_count'  => $roleModel?->users_count ?? User::where('role_id', $roleId)->count(),
                ];
            })
            ->values();

        return Inertia::render('Settings/Users/Index', [
            'users'   => $users,
            'roles'   => $roleList,
            'filters' => [
                'role'   => $roleFilter,
                'search' => $search,
            ],
            'counts'  => [
                'total_users'  => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'total_roles'  => count($roleDefinitions),
            ],
        ]);
    }

    /**
     * Halaman Hak Akses & Matriks Wewenang Peran (Sales, Warehouse, Finance, Cashier, Procurement, Owner).
     */
    public function roles(Request $request): Response
    {
        $selectedRole = $request->query('role', 'all');
        $definitions  = $this->getRoleAccessDefinitions();

        $dbRoles        = Role::with(['users', 'permissions'])->get()->keyBy('id');
        $orderedRoleIds = ['sales', 'warehouse', 'finance', 'cashier', 'procurement', 'owner'];

        $appCatalog = collect(AppCatalogService::APPS)->map(fn ($app, $key) => [
            'key'   => $key,
            'name'  => $app['name'],
            'desc'  => $app['desc'],
            'roles' => $app['roles'],
        ])->values();

        $rolesData = collect($orderedRoleIds)->map(function (string $roleId) use ($dbRoles, $definitions) {
            $roleModel = $dbRoles->get($roleId);
            $def       = $definitions[$roleId];

            $allowedApps = [];
            foreach (AppCatalogService::APPS as $appKey => $appMeta) {
                $hasAccess  = in_array($roleId, $appMeta['roles'], true);
                $isReadOnly = in_array($roleId, ['procurement', 'sales'], true) && $appKey === 'inventory';
                $allowedApps[] = [
                    'key'     => $appKey,
                    'name'    => $appMeta['name'],
                    'desc'    => $appMeta['desc'],
                    'allowed' => $hasAccess,
                    'note'    => $isReadOnly
                        ? 'Read-Only'
                        : ($hasAccess ? 'Akses Penuh' : 'Diblokir'),
                ];
            }

            $users = ($roleModel?->users ?? collect())->map(fn (User $u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'is_active' => (bool) $u->is_active,
            ])->values();

            $dbPermissions = ($roleModel?->permissions ?? collect())->map(fn (RolePermission $p) => [
                'id'         => $p->id,
                'module'     => $p->module,
                'action'     => $p->action,
                'is_allowed' => (bool) $p->is_allowed,
            ])->values();

            return [
                'id'             => $roleId,
                'display_name'   => $roleModel?->display_name ?? $def['display_name'],
                'tagline'        => $def['tagline'],
                'summary'        => $def['summary'],
                'badge_color'    => $def['badge_color'],
                'users'          => $users,
                'users_count'    => $users->count(),
                'allowed_apps'   => $allowedApps,
                'capabilities'   => $def['capabilities'],
                'db_permissions' => $dbPermissions,
            ];
        })->values();

        // Log Audit Percobaan Akses yang Ditolak (REJECTED / access.denied / inventory.mutation_denied)
        $accessDeniedLogs = AuditLog::where(function ($q) {
            $q->whereIn('action', ['access.denied', 'inventory.mutation_denied'])
              ->orWhere('status', 'REJECTED');
        })
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id'             => $log->id,
                'action'         => $log->action,
                'status'         => $log->status,
                'actor_username' => $log->actor_username,
                'actor_role'     => $log->actor_role,
                'document_type'  => $log->document_type,
                'document_id'    => $log->document_id,
                'notes'          => $log->notes,
                'created_at'     => $log->created_at?->format('d/m/Y H:i:s'),
            ]);

        return Inertia::render('Settings/Roles/Index', [
            'roles'            => $rolesData,
            'appCatalog'       => $appCatalog,
            'selectedRole'     => $selectedRole,
            'accessDeniedLogs' => $accessDeniedLogs,
        ]);
    }

    /**
     * Tambah Pengguna Baru (dibungkus DB::transaction).
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:120'],
            'email'     => ['required', 'email', 'max:150', 'unique:users,email'],
            'role_id'   => ['required', 'string', Rule::in(['owner', 'finance', 'sales', 'warehouse', 'procurement', 'cashier'])],
            'password'  => ['required', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $newUser = User::create([
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'role_id'   => $validated['role_id'],
                'password'  => Hash::make($validated['password']),
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $actor = $request->user();
            AuditLog::record(
                action: 'settings.user_created',
                status: 'SUCCESS',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'System',
                actorRole: $actor?->role_id ?? 'owner',
                documentType: 'user',
                documentId: (string) $newUser->id,
                newValue: [
                    'name'    => $newUser->name,
                    'email'   => $newUser->email,
                    'role_id' => $newUser->role_id,
                ],
                notes: "Pengguna baru '{$newUser->name}' ({$newUser->role_id}) ditambahkan melalui modul Settings.",
                ipAddress: $request->ip(),
            );
        });

        return redirect()->route('settings.users.index')
            ->with('success', "Pengguna baru '{$validated['name']}' berhasil ditambahkan.");
    }

    /**
     * Perbarui Peran atau Status Aktif Pengguna (dibungkus DB::transaction).
     */
    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $targetUser = User::findOrFail($id);

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:120'],
            'role_id'   => ['required', 'string', Rule::in(['owner', 'finance', 'sales', 'warehouse', 'procurement', 'cashier'])],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($targetUser, $validated, $request) {
            $oldRole   = $targetUser->role_id;
            $oldActive = $targetUser->is_active;

            $targetUser->update([
                'name'      => $validated['name'],
                'role_id'   => $validated['role_id'],
                'is_active' => $validated['is_active'],
            ]);

            $actor = $request->user();
            AuditLog::record(
                action: 'settings.user_updated',
                status: 'SUCCESS',
                actorUserId: $actor?->id,
                actorUsername: $actor?->name ?? 'System',
                actorRole: $actor?->role_id ?? 'owner',
                documentType: 'user',
                documentId: (string) $targetUser->id,
                oldValue: ['role_id' => $oldRole, 'is_active' => $oldActive],
                newValue: ['role_id' => $targetUser->role_id, 'is_active' => $targetUser->is_active],
                notes: "Data pengguna '{$targetUser->name}' diperbarui (Peran: {$targetUser->role_id}).",
                ipAddress: $request->ip(),
            );
        });

        return redirect()->route('settings.users.index')
            ->with('success', "Hak akses dan profil pengguna '{$targetUser->name}' berhasil diperbarui.");
    }
}
