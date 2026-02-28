<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * AuditQueue - Modèle pour la queue d'audit asynchrone
 * Rôle: Gérer les audits planifiés avec priorisation et retry
 */
class AuditQueue extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_name',
        'entity_type',
        'entity_id', 
        'audit_type',
        'priority',
        'attempts',
        'max_attempts',
        'scheduled_at'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    /**
     * Scope pour les jobs prêts à être exécutés
     * Rôle: Sélectionner les audits en attente
     */
    public function scopeReady($query)
    {
        return $query->where('scheduled_at', '<=', now())
                    ->where('attempts', '<', 'max_attempts');
    }

    /**
     * Scope pour les jobs haute priorité
     * Rôle: Prioriser les audits critiques
     */
    public function scopeHighPriority($query)
    {
        return $query->where('priority', '<=', 3);
    }

    /**
     * Scope par nom de queue
     * Rôle: Filtrer par type d'audit
     */
    public function scopeByQueue($query, $queueName)
    {
        return $query->where('queue_name', $queueName);
    }

    /**
     * Incrémenter le compteur de tentatives
     * Rôle: Gérer les retry automatiques
     */
    public function incrementAttempts()
    {
        $this->increment('attempts');
        
        // Planifier le prochain retry avec backoff exponentiel
        $delay = min(3600, pow(2, $this->attempts) * 60); // Max 1h
        $this->update(['scheduled_at' => now()->addSeconds($delay)]);
    }

    /**
     * Marquer comme échoué
     * Rôle: Finaliser les jobs qui ont dépassé max_attempts
     */
    public function markAsFailed()
    {
        $this->update([
            'attempts' => $this->max_attempts,
            'scheduled_at' => now()->addDay() // Réessayer demain
        ]);
    }

    /**
     * Relation avec l'entité à auditer (polymorphique)
     * Rôle: Lier le job à l'entité cible
     */
    public function auditable()
    {
        return $this->morphTo();
    }
}
