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
        Schema::create('fundraising_likes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('fundraising_id');
            $table->timestamps();
            
            // Ajouter les contraintes de clé étrangère
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('fundraising_id')->references('id')->on('fundraisings')->onDelete('cascade');
            
            // Assurer qu'un utilisateur ne peut liker qu'une seule fois un levé de fonds
            $table->unique(['user_id', 'fundraising_id']);
            
            // Index pour optimiser les requêtes
            $table->index('fundraising_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fundraising_likes');
    }
};
