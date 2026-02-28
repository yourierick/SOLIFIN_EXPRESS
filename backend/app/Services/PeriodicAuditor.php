<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\FinancialAuditLog;
use App\Models\AuditQueue;
use App\Models\AuditSnapshot;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * PeriodicAuditor - Service d'audit périodique intelligent
 * Rôle: Planifier et exécuter des audits basés sur l'activité et le risque
 */
class PeriodicAuditor
{
    /**
     * Planification des audits périodiques
     * Rôle: Calculer les fréquences et créer les jobs d'audit
     */
    public function schedulePeriodicAudits(): int
    {
        $scheduledCount = 0;

        try {
            // 1. Récupération des wallets actifs
            $activeWallets = $this->getActiveWallets();

            // 2. Priorisation par risque
            $prioritizedWallets = $this->prioritizeWallets($activeWallets);

            // 3. Planification basée sur fréquence adaptative
            foreach ($prioritizedWallets as $wallet) {
                if ($this->shouldScheduleAudit($wallet)) {
                    $this->scheduleWalletAudit($wallet);
                    $scheduledCount++;
                }
            }

            // 4. Audit système global
            $this->scheduleSystemAudit();

            Log::info('Audits périodiques planifiés', [
                'count' => $scheduledCount,
                'timestamp' => now()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur planification audits périodiques', [
                'error' => $e->getMessage()
            ]);
        }

        return $scheduledCount;
    }

    /**
     * Exécution des audits périodiques en queue
     * Rôle: Traiter les jobs d'audit périodique
     */
    public function executePeriodicAudit(AuditQueue $job): bool
    {
        try {
            $wallet = Wallet::find($job->entity_id);
            if (!$wallet) {
                $job->markAsFailed();
                return false;
            }

            // 1. Vérification si l'audit est toujours pertinent
            if (!$this->isAuditStillRelevant($wallet, $job)) {
                $job->delete();
                return true;
            }

            // 2. Snapshot temporel
            $this->createPeriodicSnapshot($wallet);

            // 3. Analyse des tendances
            $trends = $this->analyzeTrends($wallet);

            // 4. Détection anomalies tendancielles
            $anomalies = $this->detectTrendAnomalies($trends, $wallet);

            // 5. Traitement des anomalies
            $this->processTrendAnomalies($anomalies, $wallet);

            // 6. Planification prochain audit
            $this->scheduleNextAudit($wallet);

            $job->delete();
            return true;

        } catch (\Exception $e) {
            Log::error('Erreur audit périodique', [
                'job_id' => $job->id,
                'wallet_id' => $job->entity_id,
                'error' => $e->getMessage()
            ]);

            $job->incrementAttempts();
            return false;
        }
    }

    /**
     * Récupération des wallets actifs
     * Rôle: Identifier les wallets nécessitant un suivi
     */
    private function getActiveWallets(): \Illuminate\Support\Collection
    {
        return Wallet::where(function($query) {
                // Wallets avec transactions récentes
                $query->where('updated_at', '>=', now()->subDays(30))
                      // Ou avec solde non nul
                      ->orWhere('balance', '!=', 0)
                      // Ou avec historique d'anomalies
                      ->orWhereHas('transactions', function($q) {
                          $q->where('created_at', '>=', now()->subDays(30));
                      });
            })
            ->with(['user', 'transactions' => function($query) {
                $query->where('created_at', '>=', now()->subDays(30))
                      ->orderBy('created_at', 'desc');
            }])
            ->get();
    }

    /**
     * Priorisation des wallets par risque
     * Rôle: Ordonner les wallets pour optimiser les ressources
     */
    private function prioritizeWallets(\Illuminate\Support\Collection $wallets): array
    {
        return $wallets->sortByDesc(function ($wallet) {
            return $this->calculateRiskScore($wallet);
        })->values()->all();
    }

    /**
     * Calcul du score de risque
     * Rôle: Évaluer le niveau de risque d'un wallet
     */
    private function calculateRiskScore(Wallet $wallet): int
    {
        $score = 0;

        // 1. Volume transactionnel (max 50 points)
        $dailyVolume = $this->getDailyVolume($wallet);
        $score += min($dailyVolume / 1000, 50);

        // 2. Fréquence de transactions (max 30 points)
        $transactionCount = $this->getTransactionCount($wallet, 30);
        $score += min($transactionCount / 10, 30);

        // 3. Historique d'anomalies (max 20 points)
        $recentAnomalies = $this->getRecentAnomalies($wallet);
        $score += $recentAnomalies * 20;

        // 4. Solde élevé (max 15 points)
        $balanceScore = min($wallet->balance / 10000, 15);
        $score += max(0, $balanceScore);

        // 5. Inactivité récente (réduction de score)
        $daysInactive = $this->getDaysInactive($wallet);
        if ($daysInactive > 7) {
            $score *= 0.5; // Réduction de 50% pour wallets inactifs
        }

        return (int) $score;
    }

    /**
     * Calcul de fréquence adaptative
     * Rôle: Déterminer la fréquence optimale d'audit
     */
    private function calculateAuditFrequency(Wallet $wallet): int
    {
        $baseHours = 24; // Base: 24h
        $multiplier = 1;

        $riskScore = $this->calculateRiskScore($wallet);

        // Ajustement basé sur le risque
        if ($riskScore > 80) {
            $multiplier = 0.25; // Toutes les 6h
        } elseif ($riskScore > 60) {
            $multiplier = 0.5;  // Toutes les 12h
        } elseif ($riskScore > 40) {
            $multiplier = 0.75; // Toutes les 18h
        } elseif ($riskScore > 20) {
            $multiplier = 1;    // Toutes les 24h
        } else {
            $multiplier = 2;    // Toutes les 48h
        }

        // Ajustement basé sur le volume
        $dailyVolume = $this->getDailyVolume($wallet);
        if ($dailyVolume > 50000) {
            $multiplier *= 0.5; // Plus fréquent pour gros volumes
        }

        // Ajustement basé sur l'inactivité
        $daysInactive = $this->getDaysInactive($wallet);
        if ($daysInactive > 30) {
            $multiplier *= 3; // Moins fréquent pour wallets inactifs
        }

        $frequency = $baseHours * $multiplier;

        // Limites: 1h minimum, 7j maximum
        return max(1, min(168, $frequency));
    }

    /**
     * Vérification si l'audit doit être planifié
     * Rôle: Optimiser le timing des audits
     */
    private function shouldScheduleAudit(Wallet $wallet): bool
    {
        // 1. Vérifier si un audit est déjà en cours
        if ($this->isAuditInProgress($wallet)) {
            return false;
        }

        // 2. Vérifier si le dernier audit est trop récent
        $lastAudit = $this->getLastAudit($wallet);
        $frequency = $this->calculateAuditFrequency($wallet);

        if ($lastAudit && $lastAudit->diffInHours(now()) < $frequency) {
            return false;
        }

        // 3. Vérifier si le wallet a changé significativement
        return $this->hasSignificantChange($wallet);
    }

    /**
     * Planification de l'audit d'un wallet
     * Rôle: Créer le job dans la queue
     */
    private function scheduleWalletAudit(Wallet $wallet): void
    {
        $frequency = $this->calculateAuditFrequency($wallet);
        $priority = $this->calculatePriority($wallet);

        AuditQueue::create([
            'queue_name' => 'periodic_audit',
            'entity_type' => 'wallet',
            'entity_id' => $wallet->id,
            'audit_type' => 'periodic',
            'priority' => $priority,
            'scheduled_at' => now()->addHours($frequency),
            'max_attempts' => 3
        ]);
    }

    /**
     * Analyse des tendances du wallet
     * Rôle: Identifier les patterns anormaux
     */
    private function analyzeTrends(Wallet $wallet): array
    {
        $snapshots = AuditSnapshot::where('wallet_id', $wallet->id)
            ->where('snapshot_date', '>=', now()->subDays(30))
            ->orderBy('snapshot_date')
            ->get();

        if ($snapshots->count() < 2) {
            return ['trend' => 'insufficient_data'];
        }

        $trends = [
            'balance_trend' => $this->calculateBalanceTrend($snapshots),
            'transaction_frequency_trend' => $this->calculateFrequencyTrend($wallet),
            'volume_trend' => $this->calculateVolumeTrend($wallet),
            'volatility' => $this->calculateVolatility($snapshots)
        ];

        return $trends;
    }

    /**
     * Détection d'anomalies de tendance
     * Rôle: Identifier les comportements suspects
     */
    private function detectTrendAnomalies(array $trends, Wallet $wallet): array
    {
        $anomalies = [];

        // 1. Tendance de balance anormale
        if (isset($trends['balance_trend']) && $trends['balance_trend']['direction'] === 'sharp_decline') {
            $anomalies[] = [
                'type' => 'abnormal_balance_decline',
                'severity' => 'high',
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'trend_data' => $trends['balance_trend'],
                    'current_balance' => $wallet->balance
                ]
            ];
        }

        // 2. Volatilité excessive
        if (isset($trends['volatility']) && $trends['volatility'] > 0.5) {
            $anomalies[] = [
                'type' => 'excessive_volatility',
                'severity' => 'medium',
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'volatility_score' => $trends['volatility']
                ]
            ];
        }

        // 3. Fréquence anormale
        if (isset($trends['transaction_frequency_trend']) && $trends['transaction_frequency_trend']['change'] > 200) {
            $anomalies[] = [
                'type' => 'abnormal_frequency_change',
                'severity' => 'medium',
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'frequency_change' => $trends['transaction_frequency_trend']['change']
                ]
            ];
        }

        return $anomalies;
    }

    /**
     * Utils et helpers
     * Rôle: Fonctions utilitaires pour l'audit périodique
     */
    private function getDailyVolume(Wallet $wallet): float
    {
        return $wallet->transactions()
            ->where('created_at', '>=', now()->subDay())
            ->sum('amount');
    }

    private function getTransactionCount(Wallet $wallet, int $days): int
    {
        return $wallet->transactions()
            ->where('created_at', '>=', now()->subDays($days))
            ->count();
    }

    private function getRecentAnomalies(Wallet $wallet): int
    {
        return FinancialAuditLog::where('entity_type', 'wallet')
            ->where('entity_id', $wallet->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->where('status', '!=', 'resolved')
            ->count();
    }

    private function getDaysInactive(Wallet $wallet): int
    {
        $lastTransaction = $wallet->transactions()
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastTransaction) {
            return 365; // Très inactif
        }

        return $lastTransaction->created_at->diffInDays(now());
    }

    private function isAuditInProgress(Wallet $wallet): bool
    {
        return Cache::has("audit_in_progress_{$wallet->id}");
    }

    private function getLastAudit(Wallet $wallet): ?\Carbon\Carbon
    {
        $lastLog = FinancialAuditLog::where('entity_type', 'wallet')
            ->where('entity_id', $wallet->id)
            ->where('audit_type', 'periodic')
            ->orderBy('created_at', 'desc')
            ->first();

        return $lastLog?->created_at;
    }

    private function hasSignificantChange(Wallet $wallet): bool
    {
        $lastSnapshot = AuditSnapshot::where('wallet_id', $wallet->id)
            ->orderBy('snapshot_date', 'desc')
            ->first();

        if (!$lastSnapshot) {
            return true; // Premier audit
        }

        $balanceChange = abs($wallet->balance - $lastSnapshot->balance);
        $transactionChange = $wallet->transactions()->count() - $lastSnapshot->transaction_count;

        return $balanceChange > 100 || $transactionChange > 10;
    }

    private function calculatePriority(Wallet $wallet): int
    {
        $riskScore = $this->calculateRiskScore($wallet);
        
        if ($riskScore > 80) return 1;  // Haute priorité
        if ($riskScore > 60) return 2;
        if ($riskScore > 40) return 3;
        if ($riskScore > 20) return 5;
        return 8; // Basse priorité
    }

    private function createPeriodicSnapshot(Wallet $wallet): void
    {
        AuditSnapshot::createFromWallet($wallet);
    }

    private function calculateBalanceTrend($snapshots): array
    {
        // Implémentation de l'analyse de tendance
        return ['direction' => 'stable', 'change_rate' => 0];
    }

    private function calculateFrequencyTrend(Wallet $wallet): array
    {
        // Implémentation de l'analyse de fréquence
        return ['change' => 0];
    }

    private function calculateVolumeTrend(Wallet $wallet): array
    {
        // Implémentation de l'analyse de volume
        return ['trend' => 'stable'];
    }

    private function calculateVolatility($snapshots): float
    {
        // Implémentation du calcul de volatilité
        return 0.1;
    }

    private function processTrendAnomalies(array $anomalies, Wallet $wallet): void
    {
        foreach ($anomalies as $anomaly) {
            FinancialAuditLog::create([
                'audit_type' => 'periodic',
                'entity_type' => 'wallet',
                'entity_id' => $wallet->id,
                'invariant_violated' => $anomaly['type'],
                'severity' => $anomaly['severity'],
                'status' => 'pending',
                'metadata' => $anomaly['metadata']
            ]);
        }
    }

    private function scheduleNextAudit(Wallet $wallet): void
    {
        $this->scheduleWalletAudit($wallet);
    }

    private function scheduleSystemAudit(): void
    {
        AuditQueue::create([
            'queue_name' => 'system_audit',
            'entity_type' => 'system',
            'entity_id' => 0,
            'audit_type' => 'global',
            'priority' => 5,
            'scheduled_at' => now()->addHours(24),
            'max_attempts' => 3
        ]);
    }

    private function isAuditStillRelevant(Wallet $wallet, AuditQueue $job): bool
    {
        // Vérifier si le wallet a changé depuis la planification
        return $wallet->updated_at >= $job->created_at->subHours(1);
    }
}
