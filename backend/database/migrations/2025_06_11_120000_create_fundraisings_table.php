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
        Schema::create('fundraisings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('page_id');
            $table->unsignedBigInteger('user_id');
            $table->string('pub_reference')->nullable();
            $table->string('titre');
            $table->string('image')->nullable();
            $table->string('video')->nullable();
            $table->text('description');
            $table->string('lien')->nullable();
            $table->decimal('cout_total', 15, 2);
            $table->decimal('mobilise', 15, 2)->default(0);
            $table->decimal('gap', 15, 2)->nullable();
            $table->string('statut')->default('draft'); // draft, approuve, rejete
            $table->text('raison_rejet')->nullable();
            $table->timestamps();
            
            // Ajouter les contraintes de clé étrangère
            $table->foreign('page_id')->references('id')->on('pages')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Index pour optimiser les requêtes
            $table->index(['statut', 'created_at']);
            $table->index('page_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fundraisings');
    }
};
