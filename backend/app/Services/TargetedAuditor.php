<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\FinancialAuditLog;
use App\Models\AuditSnapshot;
use App\Models\AuditQueue;
use App\Models\Role;
use App\Models\User;
use App\Notifications\FinancialAnomalyDetected;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * TargetedAuditor - Service d'audit ciblé asynchrone
 * Rôle: Réconciliation complète et correction automatique des wallets spécifiques
 */
class TargetedAuditor
{
    /**
     * Traitement d'un job d'audit ciblé
     * Rôle: Exécuter l'audit complet d'un wallet depuis la queue
     */
    public function processAuditJob(AuditQueue $job): bool
    {
        try {
            // 1. Récupération du wallet
            $wallet = $this->getWalletEntity($job);
            if (!$wallet) {
                $job->markAsFailed();
                return false;
            }

            // 2. Lock pessimiste pour éviter double traitement
            if (!$this->acquireLock($wallet)) {
                return false; // Déjà en traitement
            }

            // 3. Snapshot avant correction
            $this->createSnapshot($wallet);

            // 4. Réconciliation complète
            $reconciliation = $this->performFullReconciliation($wallet);

            // 5. Détection anomalies
            $anomalies = $this->detectReconciliationAnomalies($reconciliation, $wallet);

            // 6. Traitement des anomalies
            $this->processAnomalies($anomalies, $wallet);

            // 7. Libération du lock
            $this->releaseLock($wallet);

            // 8. Suppression du job
            $job->delete();

            return true;

        } catch (\Exception $e) {
            Log::error('Erreur audit ciblé', [
                'job_id' => $job->id,
                'error' => $e->getMessage()
            ]);

            $job->incrementAttempts();
            return false;
        }
    }

    /**
     * Réconciliation complète du wallet
     * Rôle: Calculer la balance attendue depuis toutes les transactions
     */
    private function performFullReconciliation($wallet): array
    {
        // 1. Balance actuelle du wallet
        $currentBalance = $wallet->balance;

        // 2. Calcul du ledger depuis les transactions
        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('status', 'completed')
            ->orderBy('created_at')
            ->get();

        $ledgerBalance = 0;
        $transactionDetails = [];

        foreach ($transactions as $tx) {
            $amount = $tx->flow === 'in' ? $tx->amount : -$tx->amount;
            $ledgerBalance += $amount;
            
            $transactionDetails[] = [
                'id' => $tx->id,
                'created_at' => $tx->created_at,
                'flow' => $tx->flow,
                'amount' => $tx->amount,
                'running_balance' => $ledgerBalance
            ];
        }

        return [
            'wallet_id' => $wallet->id,
            'current_balance' => $currentBalance,
            'ledger_balance' => $ledgerBalance,
            'difference' => $currentBalance - $ledgerBalance,
            'transaction_count' => $transactions->count(),
            'transactions' => $transactionDetails,
            'last_transaction_id' => $transactions->last()?->id ?? 0
        ];
    }

    /**
     * Détection des anomalies de réconciliation
     * Rôle: Identifier les incohérences et leur nature
     */
    private function detectReconciliationAnomalies(array $reconciliation, $wallet): array
    {
        $anomalies = [];
        $difference = abs($reconciliation['difference']);

        if ($difference >= 0.01) {
            $anomalies[] = [
                'type' => 'balance_ledger_mismatch',
                'severity' => $this->calculateSeverity($difference, $reconciliation['current_balance']),
                'expected' => $reconciliation['ledger_balance'],
                'actual' => $reconciliation['current_balance'],
                'difference' => $difference,
                'description' => "Incohérence entre la balance et le grand livre pour le wallet #{$wallet->id}",
                'auto_correctable' => $difference <= 0.01, // Seulement les erreurs d'arrondi
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'user' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'transaction_count' => $reconciliation['transaction_count'],
                    'last_transaction_id' => $reconciliation['last_transaction_id']
                ]
            ];
        }

        // 3. Détection de corruption de données
        if ($this->detectDataCorruption($reconciliation)) {
            $anomalies[] = [
                'type' => 'data_corruption',
                'severity' => 'critical',
                'expected' => 'consistent',
                'actual' => 'corrupted',
                'difference' => 1,
                'auto_correctable' => false,
                'description' => 'Corruption des données',
                'metadata' => [
                    'wallet_id' => $wallet->id,
                    'user' => $wallet->user->name . ' / ' . $wallet->user->account_id,
                    'reconciliation_data' => $reconciliation
                ]
            ];
        }

        return $anomalies;
    }

    /**
     * Traitement des anomalies détectées
     * Rôle: Auto-correction ou escalation vers admin
     */
    private function processAnomalies(array $anomalies, $wallet): void
    {
        foreach ($anomalies as $anomaly) {
            // 1. Création du log d'audit
            $auditLog = $this->createAuditLog($anomaly, $wallet);

            // 2. Tentative d'auto-correction
            if ($anomaly['auto_correctable']) {
                $this->attemptAutoCorrection($auditLog, $anomaly, $wallet);
            } else {
                // 3. Escalade vers admin
                $this->escalateToAdmin($auditLog, $anomaly);
            }
        }
    }

    /**
     * Tentative d'auto-correction
     * Rôle: Corriger automatiquement les erreurs simples
     */
    private function attemptAutoCorrection(FinancialAuditLog $auditLog, array $anomaly, $wallet): bool
    {
        try {
            DB::beginTransaction();

            // 1. Application de la correction
            if ($anomaly['type'] === 'balance_ledger_mismatch') {
                // Corriger la balance du wallet
                $wallet->balance = $anomaly['expected'];
                $wallet->save();

                // 2. Logger la correction
                $this->logCorrection($auditLog, $anomaly, 'auto');

                // 3. Marquer comme résolu
                $auditLog->markAsResolved();

                DB::commit();
                return true;
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Échec auto-correction', [
                'audit_log_id' => $auditLog->id,
                'error' => $e->getMessage()
            ]);

            // Escalader si auto-correction échoue
            $this->escalateToAdmin($auditLog, $anomaly);
        }

        return false;
    }

    /**
     * Escalade vers administrateur
     * Rôle: Notifier les admins pour correction manuelle
     */
    private function escalateToAdmin(FinancialAuditLog $auditLog, array $anomaly): void
    {
        // 1. Mettre à jour le statut
        $auditLog->update(['status' => 'investigating']);

        // 2. Notifier les super-admins
        $this->notifyAdministrators($auditLog, $anomaly);

        // 3. Créer une demande de correction si nécessaire
        if ($anomaly['severity'] === 'critical') {
            $this->createCorrectionRequest($auditLog, $anomaly);
        }
    }

    /**
     * Création de snapshot avant correction
     * Rôle: Préserver l'état avant intervention
     */
    private function createSnapshot($wallet): void
    {
        AuditSnapshot::createFromWallet($wallet);
    }

    /**
     * Lock pessimiste pour éviter double traitement
     * Rôle: Garantir l'exclusivité du traitement
     */
    private function acquireLock($wallet): bool
    {
        return Cache::add(
            "audit_lock_wallet_{$wallet->id}",
            true,
            300 // 5 minutes
        );
    }

    /**
     * Libération du lock
     * Rôle: Permettre le traitement ultérieur
     */
    private function releaseLock($wallet): void
    {
        Cache::forget("audit_lock_wallet_{$wallet->id}");
    }

    /**
     * Utils et helpers
     * Rôle: Fonctions utilitaires pour l'audit
     */
    private function getWalletEntity(AuditQueue $job)
    {
        if ($job->entity_type === 'wallet') {
            return Wallet::find($job->entity_id);
        }
        
        return null;
    }

    private function createAuditLog(array $anomaly, $wallet): FinancialAuditLog
    {
        // Générer fingerprint pour éviter doublons
        $fingerprint = $this->generateTargetedFingerprint($anomaly, $wallet);
        
        // Vérifier si l'anomalie existe déjà
        if ($this->existsTargetedDuplicate($fingerprint)) {
            return null; // Retourner null si doublon
        }
        
        $auditLog = FinancialAuditLog::create([
            'audit_type' => 'batch',
            'entity_type' => 'wallet',
            'entity_id' => $wallet->id,
            'invariant_violated' => $anomaly['type'],
            'expected_value' => $anomaly['expected'],
            'actual_value' => $anomaly['actual'],
            'difference' => $anomaly['difference'],
            'severity' => $anomaly['severity'],
            'description' => $anomaly['description'],
            'status' => 'pending',
            'fingerprint' => $fingerprint,
            'metadata' => $anomaly['metadata']
        ]);

        return $auditLog;
    }

    /**
     * Générer fingerprint pour audit ciblé
     * Rôle: Créer identifiant unique avec les clés standardisées
     */
    private function generateTargetedFingerprint(array $anomaly, $wallet): string
    {
        $data = [
            'type' => $anomaly['type'],
            'entity_type' => 'wallet',
            'entity_id' => $wallet->id,
            'anomaly_scope' => 'targeted'
        ];
        
        return hash('sha256', json_encode($data));
    }

    /**
     * Vérifier si un doublon d'audit ciblé existe
     * Rôle: Éviter les logs en double
     */
    private function existsTargetedDuplicate(string $fingerprint): bool
    {
        return FinancialAuditLog::where('fingerprint', $fingerprint)
            ->where('audit_type', 'batch')
            ->exists();
    }

    private function calculateSeverity(float $difference, float $context): string
    {
        $ratio = $context > 0 ? $difference / $context : $difference;
        
        if ($ratio > 0.1 || $difference > 1000) return 'critical';
        if ($ratio > 0.05 || $difference > 100) return 'high';
        if ($ratio > 0.01 || $difference > 10) return 'medium';
        return 'low';
    }

    private function detectDataCorruption(array $reconciliation): bool
    {
        // Vérifier la cohérence des données
        return $reconciliation['transaction_count'] === 0 && $reconciliation['current_balance'] != 0;
    }

    private function logCorrection(FinancialAuditLog $auditLog, array $anomaly, string $type): void
    {
        $auditLog->metadata = array_merge($auditLog->metadata ?? [], [
            'correction_type' => $type,
            'correction_applied_at' => now()->toISOString(),
            'correction_details' => $anomaly
        ]);
        $auditLog->save();
    }

    private function notifyAdministrators(FinancialAuditLog $auditLog, array $anomaly): void
    {
        // Envoyer la notification si nécessaire
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
    }
}
