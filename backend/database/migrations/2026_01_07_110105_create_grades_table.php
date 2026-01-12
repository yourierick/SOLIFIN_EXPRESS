<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->enum('niveau', ['1', '2', '3', '4', '5', '6'])->unique();
            $table->string('designation')->unique();
            $table->decimal('points')->default(0);
            $table->text('symbole')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('grade_id')->nullable()->after('acquisition_source')->constrained();
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->decimal('points')->default(0)->after('total_withdrawn_cdf');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('points');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['grade_id']);
            $table->dropColumn('grade_id');
        });

        Schema::dropIfExists('grades');
    }
};
