<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\FinancialAuditLog;
use App\Models\AuditQueue;
use App\Models\Role;
use App\Models\User;
use App\Notifications\FinancialAnomalyDetected;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * RealtimeAuditor - Service d'audit temps réel
 * Rôle: Vérification immédiate des invariants après chaque transaction
 */
class RealtimeAuditor
{
    /**
     * Audit après une transaction wallet
     * Rôle: Vérification immédiate de la cohérence du wallet
     */
    public function auditWalletTransaction(WalletTransaction $transaction): void
    {
        $wallet = $transaction->wallet;
        
        // 1. Vérification invariant balance
        $this->verifyBalanceInvariant($wallet);
        
        // 2. Vérification non-négativité
        $this->verifyNonNegativeBalance($wallet);
        
        // 3. Génération fingerprint pour éviter doublons
        $fingerprint = $this->generateFingerprint($transaction);
        
        // 4. Vérification doublon
        if ($this->existsDuplicate($fingerprint)) {
            return;
        }
        
        // 5. Détection anomalies spécifiques
        $this->detectSpecificAnomalies($transaction, $wallet);
        
        // 6. Queue audit ciblé si anomalie significative
        if ($this->requiresTargetedAudit($transaction)) {
            $this->queueTargetedAudit($wallet->id, 'high');
        }
    }

    /**
     * Vérification invariant balance = ledger
     * Rôle: Assurer la cohérence fondamentale du wallet
     */
    private function verifyBalanceInvariant(Wallet $wallet): void
    {
        $balance = $wallet->balance;
        
        // Calcul du ledger depuis les transactions
        $ledgerBalance = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('status', 'completed')
            ->selectRaw('SUM(CASE WHEN flow = "in" THEN amount ELSE -amount END) as total')
            ->value('total') ?? 0;
        
        $difference = abs($balance - $ledgerBalance);
        
        if ($difference >= 0.01) {
            $this->createAuditLog([
                'audit_type' => 'realtime',
                'entity_type' => 'wallet',
                'entity_id' => $wallet->id,
                'invariant_violated' => 'balance_ledger_mismatch',
                'expected_value' => $ledgerBalance,
                'actual_value' => $balance,
                'difference' => $difference,
                'severity' => $this->calculateSeverity($difference, $balance),
                'description' => "Balance du wallet #{$wallet->id} ≠ du total de ses transactions dans le grand livre",
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'user_id' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'transaction_id' => $this->lastTransactionId,
                    'ledger_balance' => $ledgerBalance,
                    'wallet_balance' => $balance
                ]
            ]);
        }
    }

    /**
     * Vérification balance non négative
     * Rôle: Prévenir les soldes négatifs
     */
    private function verifyNonNegativeBalance(Wallet $wallet): void
    {
        if ($wallet->balance < 0) {
            $this->createAuditLog([
                'audit_type' => 'realtime',
                'entity_type' => 'wallet',
                'entity_id' => $wallet->id,
                'invariant_violated' => 'negative_balance',
                'expected_value' => 0,
                'actual_value' => $wallet->balance,
                'difference' => abs($wallet->balance),
                'severity' => $this->calculateSeverity(abs($wallet->balance), 1000),
                'description' => "Balance négative détectée pour le wallet #{$wallet->id}",
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'user' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'balance' => $wallet->balance
                ]
            ]);
        }
    }

    /**
     * Détection d'anomalies spécifiques
     * Rôle: Identifier les patterns suspects
     */
    private function detectSpecificAnomalies(WalletTransaction $transaction, Wallet $wallet): void
    {
        // 1. Transaction inhabituellement grande
        if ($transaction->amount > $this->getAverageTransactionAmount($wallet) * 10) {
            $this->createAuditLog([
                'audit_type' => 'realtime',
                'entity_type' => 'transaction',
                'entity_id' => $transaction->id,
                'invariant_violated' => 'unusual_transaction_size',
                'expected_value' => $this->getAverageTransactionAmount($wallet),
                'actual_value' => $transaction->amount,
                'difference' => $transaction->amount - $this->getAverageTransactionAmount($wallet),
                'severity' => 'medium',
                'description' => 'Transaction inhabituellement grande, recommandion d\'une investigation si nécessaire',
                'metadata' => [
                    'transaction_id' => $transaction->id,
                    'wallet_id' => $wallet->id,
                    'user' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'amount' => $transaction->amount,
                    'average_amount' => $this->getAverageTransactionAmount($wallet),
                    'flow' => $transaction->flow
                ]
            ]);
        }
        
        // 2. Fréquence anormale
        if ($this->isHighFrequencyTransaction($wallet)) {
            $this->createAuditLog([
                'audit_type' => 'realtime',
                'entity_type' => 'wallet',
                'entity_id' => $wallet->id,
                'invariant_violated' => 'high_frequency_transactions',
                'expected_value' => 10, // Max 10 transactions/heure
                'actual_value' => $this->getHourlyTransactionCount($wallet),
                'difference' => $this->getHourlyTransactionCount($wallet) - 10,
                'severity' => 'medium',
                'description' => "Fréquence des transactions élevée (Max 10 transactions/heure)",
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'user' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'hourly_count' => $this->getHourlyTransactionCount($wallet),
                    'last_hour_transactions' => $this->getLastHourTransactions($wallet)->pluck('id')
                ]
            ]);
        }
    }

    /**
     * Génération fingerprint unique
     * Rôle: Éviter les doublons d'anomalies avec données stables
     */
    private function generateFingerprint(WalletTransaction $transaction): string
    {
        // Utiliser les mêmes clés que GlobalAuditor pour la cohérence
        $data = [
            'type' => $transaction->type,
            'entity_type' => 'wallet',
            'entity_id' => $transaction->wallet_id,
            'anomaly_scope' => 'realtime'
        ];
        
        return hash('sha256', json_encode($data));
    }

    /**
     * Vérification existence doublon
     * Rôle: Éviter les alertes multiples pour même problème
     */
    private function existsDuplicate(string $fingerprint): bool
    {
        return Cache::remember(
            "audit_duplicate_{$fingerprint}",
            3600,
            fn() => FinancialAuditLog::where('fingerprint', $fingerprint)->exists()
        );
    }

    /**
     * Création log d'audit
     * Rôle: Centraliser la création des logs avec fingerprint et notification
     */
    private function createAuditLog(array $data): FinancialAuditLog
    {
        $data['fingerprint'] = $this->generateFingerprintFromData($data);
        $data['status'] = 'pending';
        
        $auditLog = FinancialAuditLog::create($data);
        
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $auditorRole = Role::where('slug', 'auditor')->first();
        
        $users = collect();
        
        if ($superAdminRole) {
            $users = $users->merge(User::where('role_id', $superAdminRole->id)->get());
        }
        
        if ($auditorRole) {
            $users = $users->merge(User::where('role_id', $auditorRole->id)->get());
        }
        
        foreach ($users as $user) {
            $user->notify(new FinancialAnomalyDetected($auditLog, $auditLog->severity));
        }
        
        return $auditLog;
    }

    /**
     * Queue pour audit ciblé
     * Rôle: Planifier audit approfondi si nécessaire
     */
    private function queueTargetedAudit(int $walletId, string $priority): void
    {
        AuditQueue::create([
            'queue_name' => 'targeted_audit',
            'entity_type' => 'wallet',
            'entity_id' => $walletId,
            'audit_type' => 'targeted',
            'priority' => $priority === 'high' ? 1 : 5,
            'scheduled_at' => now()->addMinutes(5),
            'max_attempts' => 3
        ]);
    }

    /**
     * Détermine si un audit ciblé est nécessaire
     * Rôle: Optimiser les ressources d'audit
     */
    private function requiresTargetedAudit(WalletTransaction $transaction): bool
    {
        // Audit ciblé si transaction > 1000 ou si balance négative
        return $transaction->amount > 1000 || $transaction->wallet->balance < 0;
    }

    /**
     * Calcul sévérité basée sur l'impact
     * Rôle: Prioriser les anomalies critiques
     */
    private function calculateSeverity(float $difference, float $context): string
    {
        $ratio = $context > 0 ? $difference / $context : $difference;
        
        if ($ratio > 0.1 || $difference > 1000) return 'critical';
        if ($ratio > 0.05 || $difference > 100) return 'high';
        if ($ratio > 0.01 || $difference > 10) return 'medium';
        return 'low';
    }

    /**
     * Utils pour les calculs
     * Rôle: Fonctions utilitaires pour les métriques
     */
    private function getAverageTransactionAmount(Wallet $wallet): float
    {
        return WalletTransaction::where('wallet_id', $wallet->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(30))
            ->avg('amount') ?? 0;
    }

    private function isHighFrequencyTransaction(Wallet $wallet): bool
    {
        return $this->getHourlyTransactionCount($wallet) > 10;
    }

    private function getHourlyTransactionCount(Wallet $wallet): int
    {
        return WalletTransaction::where('wallet_id', $wallet->id)
            ->where('created_at', '>=', now()->subHour())
            ->count();
    }

    private function getLastHourTransactions(Wallet $wallet): \Illuminate\Support\Collection
    {
        return WalletTransaction::where('wallet_id', $wallet->id)
            ->where('created_at', '>=', now()->subHour())
            ->get();
    }

    private function generateFingerprintFromData(array $data): string
    {
        return hash('sha256', json_encode($data));
    }
}
