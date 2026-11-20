<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Akun yang dinonaktifkan (lewat Manajemen User / Settings) langsung dikeluarkan
 * pada request berikutnya, termasuk sesi "remember me" yang masih tersimpan.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Akun ini telah dinonaktifkan. Hubungi Super Admin.',
            ]);
        }

        return $next($request);
    }
}
