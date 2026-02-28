<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables d'audit financier robuste
     * Rôle: Stocker tous les logs d'audit pour traçabilité et analyse
     */
    public function up(): void
    {
        // Table principale des logs d'audit
        Schema::create('financial_audit_logs', function (Blueprint $table) {
            $table->id();
            
            // Type d'audit (temps réel, batch, périodique, global)
            $table->enum('audit_type', ['realtime', 'batch', 'periodic', 'global']);
            
            // Entité auditée (wallet, système, transaction)
            $table->enum('entity_type', ['wallet', 'system', 'transaction']);
            $table->bigInteger('entity_id');
            
            // Invariant violé et valeurs
            $table->string('invariant_violated', 50);
            $table->decimal('expected_value', 20, 8);
            $table->decimal('actual_value', 20, 8);
            $table->decimal('difference', 20, 8);
            
            // Sévérité et statut
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->string('description', 300);
            $table->enum('status', ['pending', 'investigating', 'resolved', 'false_positive']);
            
            // Fingerprint unique pour éviter les doublons
            $table->string('fingerprint', 64)->unique();
            
            // Métadonnées JSON flexibles
            $table->json('metadata');
            
            // Timestamps et résolution
            $table->timestamps();
            $table->timestamp('resolved_at')->nullable();
            $table->bigInteger('resolved_by')->nullable();
            
            // Index pour performance
            $table->index(['audit_type', 'status']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['severity', 'status']);
            $table->index('created_at');
        });

        // Queue pour audits asynchrones
        Schema::create('audit_queues', function (Blueprint $table) {
            $table->id();
            
            $table->string('queue_name', 50);
            $table->string('entity_type', 50);
            $table->bigInteger('entity_id');
            $table->string('audit_type', 50);
            
            // Priorité (1 = haute, 10 = basse)
            $table->tinyInteger('priority')->default(5);
            
            // Gestion des tentatives
            $table->tinyInteger('attempts')->default(0);
            $table->tinyInteger('max_attempts')->default(3);
            
            // Planification
            $table->timestamp('scheduled_at');
            $table->timestamps();
            
            $table->index(['queue_name', 'priority', 'scheduled_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        // Snapshots pour comparaison temporelle
        Schema::create('audit_snapshots', function (Blueprint $table) {
            $table->id();
            
            $table->date('snapshot_date');
            $table->bigInteger('wallet_id');
            $table->decimal('balance', 20, 8);
            $table->integer('transaction_count');
            $table->bigInteger('last_transaction_id');
            
            // Checksum pour détection modifications
            $table->string('checksum', 64);
            
            $table->timestamps();
            
            $table->unique(['snapshot_date', 'wallet_id']);
            $table->index('wallet_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_snapshots');
        Schema::dropIfExists('audit_queues');
        Schema::dropIfExists('financial_audit_logs');
    }
};
