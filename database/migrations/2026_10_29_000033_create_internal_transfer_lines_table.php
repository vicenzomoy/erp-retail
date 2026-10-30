<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('internal_transfer_lines', function (Blueprint $table) {
            $table->id();
            $table->string('internal_transfer_id', 20);
            $table->string('variant_sku', 20);
            $table->decimal('qty_demand', 12, 3);
            $table->decimal('qty_done', 12, 3)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('internal_transfer_id')->references('id')->on('internal_transfers')->cascadeOnDelete();
            $table->foreign('variant_sku')->references('variant_sku')->on('products');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_transfer_lines');
    }
};

