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
        Schema::create('fundraising_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('fundraising_id');
            $table->text('contenu');
            $table->unsignedBigInteger('parent_id')->nullable(); // Pour les réponses aux commentaires
            $table->timestamps();
            
            // Ajouter les contraintes de clé étrangère
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('fundraising_id')->references('id')->on('fundraisings')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('fundraising_comments')->onDelete('cascade');
            
            // Index pour optimiser les requêtes
            $table->index('fundraising_id');
            $table->index('user_id');
            $table->index('parent_id');
            $table->index(['fundraising_id', 'parent_id']); // Pour récupérer rapidement les commentaires d'un levé de fonds et leurs réponses
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fundraising_comments');
    }
};
