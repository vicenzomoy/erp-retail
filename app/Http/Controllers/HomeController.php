<?php

namespace App\Http\Controllers;

use App\Services\Navigation\AppCatalogService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * S-01 Beranda App Switcher (F-01).
     */
    public function index(): Response
    {
        return Inertia::render('Home/Index', [
            'apps' => AppCatalogService::forUser(auth()->user()),
        ]);
    }

    /**
     * Halaman sementara untuk app yang UI-nya belum dibangun
     * (CRM, Purchase, Accounting, Settings). Akses dijaga middleware app.access.
     */
    public function pending(string $appKey, ?string $section = null): Response
    {
        $app = AppCatalogService::APPS[$appKey];

        return Inertia::render('Home/ModulePending', [
            'app'     => ['key' => $appKey, 'name' => $app['name'], 'desc' => $app['desc']],
            'section' => $section,
        ]);
    }
}

