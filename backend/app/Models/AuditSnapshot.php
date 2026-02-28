<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * AuditSnapshot - Modèle pour les snapshots temporels
 * Rôle: Stocker l'état des wallets pour comparaison historique
 */
class AuditSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'snapshot_date',
        'wallet_id',
        'balance',
        'transaction_count',
        'last_transaction_id',
        'checksum'
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'balance' => 'decimal:8',
    ];

    /**
     * Scope pour la date la plus récente d'un wallet
     * Rôle: Obtenir le dernier snapshot connu
     */
    public function scopeLatest($query, $walletId)
    {
        return $query->where('wallet_id', $walletId)
                    ->orderBy('snapshot_date', 'desc')
                    ->limit(1);
    }

    /**
     * Scope pour une période donnée
     * Rôle: Analyser l'évolution sur une période
     */
    public function scopePeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('snapshot_date', [$startDate, $endDate]);
    }

    /**
     * Relation avec le wallet
     * Rôle: Lier le snapshot au wallet original
     */
    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Vérifier si le snapshot est valide
     * Rôle: Valider l'intégrité des données
     */
    public function isValid(): bool
    {
        $currentChecksum = $this->calculateChecksum();
        return $currentChecksum === $this->checksum;
    }

    /**
     * Calculer le checksum du snapshot
     * Rôle: Générer un hash pour détection de modifications
     */
    public function calculateChecksum(): string
    {
        $data = [
            $this->wallet_id,
            $this->balance,
            $this->transaction_count,
            $this->last_transaction_id,
            $this->snapshot_date->format('Y-m-d')
        ];
        
        return hash('sha256', json_encode($data));
    }

    /**
     * Créer un snapshot depuis un wallet
     * Rôle: Génération automatique des snapshots
     */
    public static function createFromWallet(Wallet $wallet): self
    {
        $snapshot = new self([
            'snapshot_date' => now()->toDateString(),
            'wallet_id' => $wallet->id,
            'balance' => $wallet->balance,
            'transaction_count' => $wallet->transactions()->count(),
            'last_transaction_id' => $wallet->transactions()->max('id') ?? 0
        ]);
        
        $snapshot->checksum = $snapshot->calculateChecksum();
        $snapshot->save();
        
        return $snapshot;
    }
}
