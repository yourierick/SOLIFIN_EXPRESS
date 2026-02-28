<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\FinancialAuditLog;
use App\Models\AuditQueue;
use Illuminate\Support\Facades\Log;

/**
 * FinancialAnomalyService - Service principal de détection d'anomalies
 * Rôle: Interface principale pour le système d'audit financier robuste
 * 
 * Ce service fait partie de la nouvelle architecture d'audit robuste:
 * - Utilise les services spécialisés (RealtimeAuditor, TargetedAuditor, etc.)
 * - Crée des logs d'audit structurés dans FinancialAuditLog
 * - Déclenche les audits asynchrones appropriés via AuditQueue
 * - Interface simplifiée pour le reste de l'application
 */
class FinancialAnomalyService
{
    private RealtimeAuditor $realtimeAuditor;
    private TargetedAuditor $targetedAuditor;
    private PeriodicAuditor $periodicAuditor;
    private GlobalAuditor $globalAuditor;

    public function __construct()
    {
        $this->realtimeAuditor = new RealtimeAuditor();
        $this->targetedAuditor = new TargetedAuditor();
        $this->periodicAuditor = new PeriodicAuditor();
        $this->globalAuditor = new GlobalAuditor();
    }

    /**
     * Audit temps réel après transaction
     * Rôle: Interface vers le service d'audit temps réel
     * Utilisation: Appeler après chaque transaction wallet
     */
    public function auditTransaction($transaction): void
    {
        if ($transaction instanceof \App\Models\WalletTransaction) {
            $this->realtimeAuditor->auditWalletTransaction($transaction);
        }
    }

    /**
     * Planifier audit ciblé pour un wallet
     * Rôle: Interface vers la planification d'audit ciblé
     * Utilisation: Pour audit approfondi d'un wallet spécifique
     */
    public function scheduleTargetedAudit(int $walletId, string $priority = 'medium'): void
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
     * Exécuter audit global complet
     * Rôle: Interface vers l'audit global du système
     * Utilisation: Pour audit comptable complet du système
     */
    public function executeGlobalAudit(): array
    {
        return $this->globalAuditor->executeGlobalAudit();
    }

    /**
     * Planifier les audits périodiques
     * Rôle: Interface vers la planification intelligente
     * Utilisation: Pour planifier les audits récurrents
     */
    public function schedulePeriodicAudits(): int
    {
        return $this->periodicAuditor->schedulePeriodicAudits();
    }

    /**
     * Obtenir les statistiques des audits
     * Rôle: Interface vers les métriques d'audit
     * Utilisation: Tableaux de bord et rapports
     */
    public function getAuditStats(): array
    {
        return [
            'total_audit_logs' => FinancialAuditLog::count(),
            'pending_anomalies' => FinancialAuditLog::where('status', 'pending')->count(),
            'critical_anomalies' => FinancialAuditLog::where('severity', 'critical')->count(),
            'high_anomalies' => FinancialAuditLog::where('severity', 'high')->count(),
            'queue_jobs' => AuditQueue::where('attempts', '<', 'max_attempts')->count(),
            'failed_jobs' => AuditQueue::where('attempts', '>=', 'max_attempts')->count(),
            'by_type' => FinancialAuditLog::groupBy('audit_type')
                ->selectRaw('audit_type, count(*) as count')
                ->pluck('count', 'audit_type')
                ->toArray(),
            'by_severity' => FinancialAuditLog::groupBy('severity')
                ->selectRaw('severity, count(*) as count')
                ->pluck('count', 'severity')
                ->toArray(),
        ];
    }

    /**
     * Obtenir les logs d'audit récents
     * Rôle: Interface vers l'historique d'audit
     * Utilisation: Affichage des anomalies récentes
     */
    public function getRecentAuditLogs(int $limit = 50): \Illuminate\Support\Collection
    {
        return FinancialAuditLog::with('auditable')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Créer un log d'audit manuel
     * Rôle: Interface pour création manuelle de logs
     * Utilisation: Pour anomalies détectées manuellement
     */
    public function createAuditLog(array $data): FinancialAuditLog
    {
        $data['fingerprint'] = $this->generateFingerprint($data);
        $data['status'] = 'pending';
        
        return FinancialAuditLog::create($data);
    }

    /**
     * Utils et helpers
     */
    private function generateFingerprint(array $data): string
    {
        $fingerprintData = [
            $data['audit_type'] ?? 'manual',
            $data['entity_type'] ?? 'unknown',
            $data['entity_id'] ?? 0,
            $data['invariant_violated'] ?? 'unknown',
            $data['severity'] ?? 'medium',
            date('Y-m-d-H') // Heure actuelle pour éviter les doublons
        ];

        return hash('sha256', implode('|', $fingerprintData));
    }
}
