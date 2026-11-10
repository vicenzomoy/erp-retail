<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'app.access' => \App\Http\Middleware\EnsureAppAccess::class,
            'inventory.permission' => \App\Http\Middleware\EnsureInventoryPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if ($response->getStatusCode() === 403) {
                if ($request->header('X-Inertia') || ! $request->wantsJson()) {
                    return inertia('Errors/AccessDenied', [
                        'status'        => 403,
                        'title'         => 'Akses Ditolak',
                        'message'       => $e->getMessage() ?: 'Maaf, Anda tidak memiliki izin untuk mengakses halaman atau modul ini.',
                        'inInventory'   => $request->is('inventory/*'),
                        'attemptedPath' => '/' . ltrim($request->path(), '/'),
                    ])->toResponse($request)->setStatusCode(403);
                }
            }

            if ($response->getStatusCode() === 404) {
                if ($request->header('X-Inertia') || ! $request->wantsJson()) {
                    return inertia('Errors/NotFound', [
                        'status'        => 404,
                        'title'         => 'Halaman Tidak Ditemukan',
                        'message'       => 'Maaf, halaman atau dokumen yang Anda cari tidak ditemukan atau telah dipindahkan.',
                        'attemptedPath' => '/' . ltrim($request->path(), '/'),
                    ])->toResponse($request)->setStatusCode(404);
                }
            }

            return $response;
        });
    })->create();
