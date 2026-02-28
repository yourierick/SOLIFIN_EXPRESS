<?php

namespace App\Jobs;

use App\Services\TargetedAuditor;
use App\Services\PeriodicAuditor;
use App\Services\GlobalAuditor;
use App\Models\AuditQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessAuditJob - Job principal pour traitement des audits
 * Rôle: Router et exécuter les différents types d'audits en queue
 */
class ProcessAuditJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre de tentatives maximum
     */
    public $tries = 3;

    /**
     * Timeout en secondes
     */
    public $timeout = 1800; // 30 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(
        private AuditQueue $auditQueue
    ) {}

    /**
     * Execute the job.
     * Rôle: Router vers le bon service d'audit
     */
    public function handle(): void
    {
        try {
            // 1. Vérifier si le job est toujours valide
            if (!$this->isJobValid()) {
                $this->auditQueue->delete();
                return;
            }

            // 2. Router vers le bon service
            $success = $this->routeToAuditor();

            // 3. Gérer le résultat
            if (!$success) {
                $this->handleFailure();
            }

        } catch (\Exception $e) {
            Log::error('Erreur job audit', [
                'job_id' => $this->job->getJobId(),
                'audit_queue_id' => $this->auditQueue->id,
                'error' => $e->getMessage()
            ]);

            $this->fail($e);
        }
    }

    /**
     * Routage vers le service approprié
     * Rôle: Sélectionner le bon auditeur selon le type
     */
    private function routeToAuditor(): bool
    {
        return match($this->auditQueue->audit_type) {
            'targeted' => $this->processTargetedAudit(),
            'periodic' => $this->processPeriodicAudit(),
            'global' => $this->processGlobalAudit(),
            default => $this->processUnknownAudit()
        };
    }

    /**
     * Traitement audit ciblé
     * Rôle: Exécuter l'audit ciblé via TargetedAuditor
     */
    private function processTargetedAudit(): bool
    {
        $auditor = new TargetedAuditor();
        return $auditor->processAuditJob($this->auditQueue);
    }

    /**
     * Traitement audit périodique
     * Rôle: Exécuter l'audit périodique via PeriodicAuditor
     */
    private function processPeriodicAudit(): bool
    {
        $auditor = new PeriodicAuditor();
        return $auditor->executePeriodicAudit($this->auditQueue);
    }

    /**
     * Traitement audit global
     * Rôle: Exécuter l'audit global via GlobalAuditor
     */
    private function processGlobalAudit(): bool
    {
        $auditor = new GlobalAuditor();
        $results = $auditor->executeGlobalAudit();

        // Logger les résultats
        Log::info('Audit global complété', [
            'job_id' => $this->job->getJobId(),
            'results' => $results
        ]);

        return $results['anomalies_detected'] === 0; // Succès si aucune anomalie
    }

    /**
     * Traitement audit inconnu
     * Rôle: Gérer les types d'audit non reconnus
     */
    private function processUnknownAudit(): bool
    {
        Log::warning('Type d\'audit inconnu', [
            'audit_queue_id' => $this->auditQueue->id,
            'audit_type' => $this->auditQueue->audit_type
        ]);

        return false;
    }

    /**
     * Validation du job
     * Rôle: Vérifier si le job doit encore être exécuté
     */
    private function isJobValid(): bool
    {
        // 1. Vérifier si le job n'a pas expiré
        if ($this->auditQueue->scheduled_at->isPast() && 
            $this->auditQueue->scheduled_at->diffInHours(now()) > 24) {
            return false;
        }

        // 2. Vérifier si l'entité existe toujours
        if ($this->auditQueue->entity_type === 'wallet') {
            return \App\Models\Wallet::where('id', $this->auditQueue->entity_id)->exists();
        }

        return true;
    }

    /**
     * Gestion des échecs
     * Rôle: Mettre à jour le compteur de tentatives
     */
    private function handleFailure(): void
    {
        $this->auditQueue->incrementAttempts();

        // Si max tentatives atteint, marquer comme échoué
        if ($this->auditQueue->attempts >= $this->auditQueue->max_attempts) {
            $this->auditQueue->markAsFailed();
        }
    }

    /**
     * Échec du job
     * Rôle: Nettoyage et logging
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job audit échoué définitivement', [
            'job_id' => $this->job->getJobId(),
            'audit_queue_id' => $this->auditQueue->id,
            'attempts' => $this->auditQueue->attempts,
            'error' => $exception->getMessage()
        ]);

        $this->auditQueue->markAsFailed();
    }
}
