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
        Schema::table('broadcast_messages', function (Blueprint $table) {
            // Champs pour la sélection des destinataires
            $table->enum('target_type', ['all', 'subscribed', 'unsubscribed', 'specific_user', 'pack'])->default('all')->after('published_at');
            $table->json('target_users')->nullable()->after('target_type'); // Pour les utilisateurs spécifiques
            $table->json('target_packs')->nullable()->after('target_users'); // Pour les packs spécifiques (plusieurs packs possibles)
            
            // Index pour les performances
            $table->index(['target_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('broadcast_messages', function (Blueprint $table) {
            $table->dropIndex(['target_type', 'status']);
            $table->dropColumn(['target_type', 'target_users', 'target_packs']);
        });
    }
};
