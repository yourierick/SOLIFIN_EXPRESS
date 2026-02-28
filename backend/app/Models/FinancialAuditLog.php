<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * FinancialAuditLog - Modèle principal pour les logs d'audit
 * Rôle: Centraliser tous les événements d'audit pour analyse et traçabilité
 */
class FinancialAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_type',
        'entity_type', 
        'entity_id',
        'invariant_violated',
        'expected_value',
        'actual_value',
        'difference',
        'severity',
        'description',
        'status',
        'fingerprint',
        'metadata',
        'resolved_at',
        'resolved_by'
    ];

    protected $casts = [
        'expected_value' => 'decimal:8',
        'actual_value' => 'decimal:8',
        'difference' => 'decimal:8',
        'metadata' => 'array',
        'resolved_at' => 'datetime',
    ];

    /**
     * Scope pour les logs non résolus
     * Rôle: Filtrer rapidement les anomalies actives
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope pour les logs critiques
     * Rôle: Identifier les problèmes urgents
     */
    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    /**
     * Scope par type d'audit
     * Rôle: Analyser les audits par catégorie
     */
    public function scopeByType($query, $type)
    {
        return $query->where('audit_type', $type);
    }

    /**
     * Relation avec l'entité auditée (polymorphique)
     * Rôle: Lier le log à l'entité originale
     */
    public function auditable()
    {
        return $this->morphTo();
    }

    /**
     * Relation avec l'admin qui a résolu
     * Rôle: Traçabilité des corrections
     */
    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /**
     * Marquer comme résolu
     * Rôle: Mettre à jour le statut et l'historique
     */
    public function markAsResolved($resolvedBy = null)
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $resolvedBy
        ]);
    }

    /**
     * Marquer comme faux positif
     * Rôle: Éliminer les alertes non pertinentes
     */
    public function markAsFalsePositive()
    {
        $this->update([
            'status' => 'false_positive',
            'resolved_at' => now()
        ]);
    }
}
