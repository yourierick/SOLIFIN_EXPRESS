<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBroadcastMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('broadcast_messages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['text', 'image', 'video'])->default('text');
            $table->string('media_url')->nullable();
            $table->boolean('status')->default(false);
            $table->timestamp('published_at')->nullable();
            
            // Champs pour la sélection des destinataires
            $table->enum('target_type', ['all', 'subscribed', 'unsubscribed', 'specific_user', 'pack'])->default('all');
            $table->json('target_users')->nullable(); // Pour les utilisateurs spécifiques
            $table->json('target_packs')->nullable(); // Pour les packs spécifiques (plusieurs packs possibles)
            $table->timestamps();
            
            // Index pour les performances
            $table->index(['target_type', 'status']);
        });

        // Table pour suivre quels utilisateurs ont vu quels messages
        Schema::create('broadcast_message_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broadcast_message_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('seen_at');
            $table->timestamps();
            
            // Un utilisateur ne peut voir un message qu'une seule fois
            $table->unique(['broadcast_message_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('broadcast_message_user');
        Schema::dropIfExists('broadcast_messages');
    }
}
