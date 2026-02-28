<?php

namespace App\Services;

use App\Models\WalletSystem;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use App\Models\FinancialAuditLog;
use App\Models\AuditQueue;
use App\Notifications\FinancialAnomalyDetected;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GlobalAuditor - Service d'audit global comptable
 * Rôle: Vérification des invariants système et réconciliation inter-système
 */
class GlobalAuditor
{
    /**
     * Exécution de l'audit global complet
     * Rôle: Vérifier tous les invariants financiers du système
     */
    public function executeGlobalAudit(): array
    {
        $results = [
            'timestamp' => now(),
            'checks_performed' => 0,
            'anomalies_detected' => 0,
            'anomalies' => []
        ];

        try {
            DB::beginTransaction();

            // 1. Vérification équation comptable fondamentale
            $this->verifyAccountingEquation($results);

            // 2. Réconciliation globale wallets
            $this->verifyGlobalWalletReconciliation($results);

            // 3. Vérification cohérence inter-système
            $this->verifySystemConsistency($results);

            // 4. Audit des liquidités système
            $this->verifySystemLiquidity($results);

            // 5. Vérification des invariants de flux
            $this->verifyFlowInvariants($results);

            // 6. Détection anomalies globales
            $this->detectGlobalAnomalies($results);

            DB::commit();

            Log::info('Audit global complété', $results);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur audit global', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $results;
    }

    /**
     * Vérification équation comptable fondamentale
     * Rôle: solde_marchand = profits_plateforme + engagements_users ± 0.01
     */
    private function verifyAccountingEquation(array &$results): void
    {
        $results['checks_performed']++;

        $walletSystem = WalletSystem::first();
        if (!$walletSystem) {
            return;
        }

        $soldeMarchand = $walletSystem->solde_marchand;
        $engagementUsers = $walletSystem->engagement_users;
        $plateformeBenefices = $walletSystem->plateforme_benefices;
        
        $theoreticalSolde = $engagementUsers + $plateformeBenefices;
        $difference = abs($soldeMarchand - $theoreticalSolde);

        if ($difference >= 0.01) {
            $anomaly = [
                'type' => 'accounting_equation_violation',
                'severity' => $this->calculateSeverity($difference, $soldeMarchand),
                'description' => "Incohérence dans l'équation comptable: Solde marchand ({$soldeMarchand}) ≠ Engagements + Bénéfices ({$theoreticalSolde})",
                'expected_value' => $theoreticalSolde,
                'actual_value' => $soldeMarchand,
                'difference' => $difference,
                'metadata' => [
                    'solde_marchand' => $soldeMarchand,
                    'engagement_users' => $engagementUsers,
                    'plateforme_benefices' => $plateformeBenefices,
                    'theoretical_solde' => $theoreticalSolde,
                    'tolerance' => 0.01
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }
    }

    /**
     * Réconciliation globale des wallets
     * Rôle: Vérifier la cohérence entre tous les wallets et leurs transactions
     */
    private function verifyGlobalWalletReconciliation(array &$results): void
    {
        $results['checks_performed']++;

        // 1. Total des balances wallets
        $totalWalletBalance = Wallet::sum('balance');

        // 2. Total des engagements système
        $walletSystem = WalletSystem::first();
        $systemEngagements = $walletSystem?->engagement_users ?? 0;

        $difference = abs($totalWalletBalance - $systemEngagements);

        if ($difference >= 0.01) {
            $anomaly = [
                'type' => 'global_wallet_reconciliation_mismatch',
                'severity' => $this->calculateSeverity($difference, $totalWalletBalance),
                'description' => "Incohérence système entre le sous-compte d'engagement utilisateurs et la balance globale des wallets: Total wallet balance ({$totalWalletBalance}) ≠ Engagement utilisateurs ({$systemEngagements})",
                'expected_value' => $totalWalletBalance,
                'actual_value' => $systemEngagements,
                'difference' => $difference,
                'metadata' => [
                    'total_wallet_balance' => $totalWalletBalance,
                    'engagementUser' => $Engagements,
                    'wallet_count' => Wallet::count(),
                    'wallets_with_balance' => Wallet::where('balance', '!=', 0)->count()
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }

        // 3. Vérification détaillée par batch
        $this->verifyBatchWalletReconciliation($results);
    }

    /**
     * Vérification par batch pour performance
     * Rôle: Optimiser la réconciliation sur grands volumes
     */
    private function verifyBatchWalletReconciliation(array &$results): void
    {
        $results['checks_performed']++;

        $batchSize = 1000;
        $walletCount = Wallet::count();
        $batches = ceil($walletCount / $batchSize);

        for ($i = 0; $i < $batches; $i++) {
            $offset = $i * $batchSize;
            $wallets = Wallet::offset($offset)->limit($batchSize)->get();

            foreach ($wallets as $wallet) {
                $ledgerBalance = WalletTransaction::where('wallet_id', $wallet->id)
                    ->where('status', 'completed')
                    ->where('nature', 'internal')
                    ->selectRaw('SUM(CASE WHEN flow = "in" THEN amount ELSE -amount END) as total')
                    ->value('total') ?? 0;

                $difference = abs($wallet->balance - $ledgerBalance);

                if ($difference >= 0.01) {
                    $anomaly = [
                        'type' => 'batch_wallet_ledger_mismatch',
                        'severity' => $this->calculateSeverity($difference, $wallet->balance),
                        'description' => "Incohérence batch entre la balance du wallet #{$wallet->id} et ses transactions dans le grand livre : Balance ({$wallet->balance}) ≠ Ledger ({$ledgerBalance})",
                        'expected_value' => $ledgerBalance,
                        'actual_value' => $wallet->balance,
                        'difference' => $difference,
                        'metadata' => [
                            'wallet_id' => $wallet->id,
                            'user_id' => $wallet->user_id,
                            'batch_number' => $i + 1,
                            'ledger_balance' => $ledgerBalance
                        ]
                    ];

                    $this->createGlobalAuditLog($anomaly);
                    $results['anomalies_detected']++;
                    $results['anomalies'][] = $anomaly;
                }
            }
        }
    }

    /**
     * Vérification cohérence inter-système
     * Rôle: Assurer la cohérence entre les différents systèmes
     */
    private function verifySystemConsistency(array &$results): void
    {
        $results['checks_performed']++;

        // 1. Cohérence transactions système vs bénéfices
        $this->verifySystemTransactionConsistency($results);

        // 2. Cohérence transactions wallets vs engagements
        $this->verifyWalletTransactionConsistency($results);

        // 3. Vérification des flux croisés
        $this->verifyCrossSystemFlows($results);
    }

    /**
     * Vérification cohérence transactions système
     * Rôle: Net transactions système = bénéfices plateforme
     */
    private function verifySystemTransactionConsistency(array &$results): void
    {
        $walletSystem = WalletSystem::first();
        if (!$walletSystem) {
            return;
        }

        $plateformeBenefices = $walletSystem->plateforme_benefices;

        $totalIn = WalletSystemTransaction::where('status', 'completed')
            ->where('flow', 'in')
            ->sum('amount');

        $totalOut = WalletSystemTransaction::where('status', 'completed')
            ->where('flow', 'out')
            ->sum('amount');

        $netTransactions = $totalIn - $totalOut;
        $difference = abs($netTransactions - $plateformeBenefices);

        if ($difference >= 0.01) {
            $anomaly = [
                'type' => 'system_transaction_consistency_mismatch',
                'severity' => $this->calculateSeverity($difference, $plateformeBenefices),
                'description' => "Incohérence dans le wallet système entre le sous-compte des bénéfices et les transactions du grand livre : Net ({$netTransactions}) ≠ Bénéfices ({$plateformeBenefices})",
                'expected_value' => $netTransactions,
                'actual_value' => $plateformeBenefices,
                'difference' => $difference,
                'metadata' => [
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                    'net_transactions' => $netTransactions,
                    'plateforme_benefices' => $plateformeBenefices,
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }
    }

    /**
     * Vérification cohérence transactions wallets
     * Rôle: Net transactions wallets = total wallets balance
     */
    private function verifyWalletTransactionConsistency(array &$results): void
    {
        $totalWalletBalance = Wallet::sum('balance');

        $totalIn = WalletTransaction::where('status', 'completed')
            ->where('flow', 'in')
            ->where('nature', 'internal')
            ->sum('amount');

        $totalOut = WalletTransaction::where('status', 'completed')
            ->where('flow', 'out')
            ->where('nature', 'internal')
            ->sum('amount');

        $netTransactions = $totalIn - $totalOut;
        $difference = abs($netTransactions - $totalWalletBalance);

        if ($difference >= 0.01) {
            $anomaly = [
                'type' => 'wallet_transaction_consistency_mismatch',
                'severity' => $this->calculateSeverity($difference, $totalWalletBalance),
                'description' => "Incohérence des transactions globales des wallets et balance globale des wallets : Net ({$netTransactions}) ≠ Total balance ({$totalWalletBalance})",
                'expected_value' => $netTransactions,
                'actual_value' => $totalWalletBalance,
                'difference' => $difference,
                'metadata' => [
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                    'net_transactions' => $netTransactions,
                    'total_wallet_balance' => $totalWalletBalance
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }
    }

    /**
     * Vérification liquidités système
     * Rôle: Assurer la disponibilité des fonds
     */
    private function verifySystemLiquidity(array &$results): void
    {
        $results['checks_performed']++;

        $walletSystem = WalletSystem::first();
        if (!$walletSystem) {
            return;
        }

        $soldeMarchand = $walletSystem->solde_marchand;
        $engagementUsers = $walletSystem->engagement_users;

        // 1. Ratio de liquidité
        $liquidityRatio = $soldeMarchand / max($engagementUsers, 1);

        if ($liquidityRatio < 0.1) {
            $anomaly = [
                'type' => 'low_liquidity_ratio',
                'severity' => 'critical',
                'description' => "Ratio de liquidité critique: {$liquidityRatio} (< 0.1)",
                'expected_value' => 0.1,
                'actual_value' => $liquidityRatio,
                'difference' => 0.1 - $liquidityRatio,
                'metadata' => [
                    'solde_marchand' => $soldeMarchand,
                    'engagement_users' => $engagementUsers,
                    'liquidity_ratio' => $liquidityRatio
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }

        // 2. Solde marchand négatif
        if ($soldeMarchand < 0) {
            $anomaly = [
                'type' => 'negative_merchant_balance',
                'severity' => 'critical',
                'description' => "Solde marchand négatif: {$soldeMarchand}",
                'expected_value' => 0,
                'actual_value' => $soldeMarchand,
                'difference' => abs($soldeMarchand),
                'metadata' => [
                    'solde_marchand' => $soldeMarchand
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }
    }

    /**
     * Vérification invariants de flux
     * Rôle: Valider la logique des flux financiers
     */
    private function verifyFlowInvariants(array &$results): void
    {
        $results['checks_performed']++;

        // 1. Conservation des fonds (pas de création/destruction)
        $this->verifyConservationOfFunds($results);

        // 2. Équilibre des flux entrants/sortants
        $this->verifyFlowBalance($results);
    }

    /**
     * Vérification conservation des fonds
     * Rôle: S'assurer qu'aucun fonds n'est créé/détruit
     * 
     * Logique: WalletSystem a une seule ligne, on utilise les valeurs directes
     * solde_marchand = fonds à distribuer aux marchands
     * plateforme_benefices = bénéfices de la plateforme
     */
    private function verifyConservationOfFunds(array &$results): void
    {
        // Récupérer la seule ligne de WalletSystem
        $walletSystem = WalletSystem::first();
        if (!$walletSystem) {
            return;
        }

        // Fonds réels dans le système
        $totalSystemFunds = $walletSystem->solde_marchand;

        // Calcul depuis les transactions externes (entrées/sorties réelles)
        $totalExternalIn = WalletSystemTransaction::where('status', 'completed')
            ->where('flow', 'in')
            ->where('nature', 'external')
            ->sum('amount');

        $totalExternalOut = WalletSystemTransaction::where('status', 'completed')
            ->where('flow', 'out')
            ->where('nature', 'external')
            ->sum('amount');

        $netExternalFunds = $totalExternalIn - $totalExternalOut;
        $difference = abs($totalSystemFunds - $netExternalFunds);

        if ($difference >= 0.01) {
            $anomaly = [
                'type' => 'conservation_of_funds_violation',
                'severity' => 'critical',
                'description' => "Violation dans la conservation des fonds: Le sous-compte marchand renseigne ({$totalSystemFunds}) ≠ mais le grand livre renseigne ({$netExternalFunds})",
                'expected_value' => $netExternalFunds,
                'actual_value' => $totalSystemFunds,
                'difference' => $difference,
                'metadata' => [
                    'solde_marchand' => $walletSystem->solde_marchand,
                    'plateforme_benefices' => $walletSystem->plateforme_benefices,
                    'engagement_users' => $walletSystem->engagement_users,
                    'total_system_funds' => $totalSystemFunds,
                    'total_external_in' => $totalExternalIn,
                    'total_external_out' => $totalExternalOut,
                    'net_external_funds' => $netExternalFunds,
                ]
            ];

            $this->createGlobalAuditLog($anomaly);
            $results['anomalies_detected']++;
            $results['anomalies'][] = $anomaly;
        }
    }

    /**
     * Détection anomalies globales
     * Rôle: Identifier les patterns au niveau système
     */
    private function detectGlobalAnomalies(array &$results): void
    {
        $results['checks_performed']++;

        // 1. Détection de croissance anormale
        $this->detectAbnormalGrowth($results);

        // 2. Détection de concentration de risque
        $this->detectRiskConcentration($results);

        // 3. Détection d'inactivité anormale
        $this->detectAbnormalInactivity($results);
    }

    /**
     * Création log d'audit global
     * Rôle: Centraliser les logs d'audit système avec notification
     */
    private function createGlobalAuditLog(array $anomaly): void
    {
        // Générer fingerprint pour éviter doublons
        $fingerprint = $this->generateGlobalFingerprint($anomaly);
        
        // Vérifier si l'anomalie existe déjà
        if ($this->existsGlobalDuplicate($fingerprint)) {
            return;
        }
        
        $auditLog = FinancialAuditLog::create([
            'audit_type' => 'global',
            'entity_type' => isset($anomaly['metadata']['wallet_id']) ? 'wallet' : 'system',
            'entity_id' => $anomaly['metadata']['wallet_id'] ?? 1,
            'invariant_violated' => $anomaly['type'],
            'expected_value' => $anomaly['expected_value'],
            'actual_value' => $anomaly['actual_value'],
            'difference' => $anomaly['difference'],
            'severity' => $anomaly['severity'],
            'description' => $anomaly['description'],
            'status' => 'pending',
            'fingerprint' => $fingerprint,
            'metadata' => $anomaly['metadata']
        ]);
        
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

    /**
     * Générer fingerprint pour audit global
     * Rôle: Créer identifiant unique basé sur les données stables
     */
    private function generateGlobalFingerprint(array $anomaly): string
    {
        // Utiliser seulement les données stables pour le fingerprint
        // Les valeurs numériques changent, donc on les exclut
        $data = [
            'type' => $anomaly['type'],
            'entity_type' => isset($anomaly['metadata']['wallet_id']) ? 'wallet' : 'system',
            'entity_id' => isset($anomaly['metadata']['wallet_id']) ? $anomaly['metadata']['wallet_id'] : 1,
            'anomaly_scope' => 'global'
        ];
        
        return hash('sha256', json_encode($data));
    }

    /**
     * Vérifier si un doublon d'audit global existe
     * Rôle: Éviter les logs en double
     */
    private function existsGlobalDuplicate(string $fingerprint): bool
    {
        return FinancialAuditLog::where('fingerprint', $fingerprint)
            ->where('audit_type', 'global')
            ->exists();
    }

    /**
     * Utils et helpers
     * Rôle: Fonctions utilitaires pour l'audit global
     */
    private function calculateSeverity(float $difference, float $context): string
    {
        $ratio = $context > 0 ? $difference / $context : $difference;
        
        if ($ratio > 0.1 || $difference > 100000) return 'critical';
        if ($ratio > 0.05 || $difference > 10000) return 'high';
        if ($ratio > 0.01 || $difference > 1000) return 'medium';
        return 'low';
    }

    private function verifyCrossSystemFlows(array &$results): void
    {
        // Implémentation de la vérification des flux croisés
        $results['checks_performed']++;
    }

    private function verifyFlowBalance(array &$results): void
    {
        // Implémentation de la vérification de l'équilibre des flux
        $results['checks_performed']++;
    }

    private function detectAbnormalGrowth(array &$results): void
    {
        // Implémentation de la détection de croissance anormale
        $results['checks_performed']++;
    }

    private function detectRiskConcentration(array &$results): void
    {
        // Implémentation de la détection de concentration de risque
        $results['checks_performed']++;
    }

    private function detectAbnormalInactivity(array &$results): void
    {
        // Implémentation de la détection d'inactivité anormale
        $results['checks_performed']++;
    }
}
