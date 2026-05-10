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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            // utilisateur qui signale
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            // utilisateur signalé
            $table->foreignId('reported_user_id')->constrained('users')->cascadeOnDelete();
            // raison du signalement
            $table->string('reason');
            // description détaillée
            $table->text('description')->nullable();
            // preuve image/fichier
            $table->string('evidence')->nullable();
            $table->string('publication_type')->nullable();
            $table->string('publication_reference')->nullable();
            // statut du traitement
            $table->enum('status', [
                'pending',
                'reviewed',
                'ignored'
            ])->default('pending');
            // admin ayant traité
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            // réponse admin
            $table->text('admin_note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
