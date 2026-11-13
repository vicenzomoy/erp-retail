<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$users = App\Models\User::select('id','name','email','role_id','password')->get();
foreach ($users as $u) {
    echo "ID:{$u->id} | Email:{$u->email} | Role:{$u->role_id} | Name:{$u->name}" . PHP_EOL;
}
echo PHP_EOL . "Total users: " . $users->count() . PHP_EOL;

// Test password hash
echo PHP_EOL . "--- Password check (password123) ---" . PHP_EOL;
foreach ($users as $u) {
    $ok = Hash::check('password123', $u->password) ? 'OK' : 'FAIL';
    echo "{$u->email}: {$ok}" . PHP_EOL;
}

