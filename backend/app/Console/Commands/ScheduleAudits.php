<?php

namespace App\Console\Commands;

use App\Services\RealtimeAuditor;
use App\Services\PeriodicAuditor;
use App\Services\GlobalAuditor;
use App\Models\AuditQueue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * ScheduleAudits - Commande pour planifier les audits
 * Rôle: Planifier tous les types d'audits selon leur fréquence
 */
class ScheduleAudits extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'audit:schedule {--type=all} {--force}';

    /**
     * The console command description.
     */
    protected $description = 'Planifier les audits financiers (périodiques, globaux)';

    /**
     * Execute the console command.
     * Rôle: Ordonnancer les différents types d'audits
     */
    public function handle(): int
    {
        $type = $this->option('type');
        $force = $this->option('force');

        $this->info('🕐 Planification des audits financiers...');

        try {
            $totalScheduled = 0;

            switch ($type) {
                case 'periodic':
                    $totalScheduled = $this->schedulePeriodicAudits($force);
                    break;
                case 'global':
                    $totalScheduled = $this->scheduleGlobalAudits($force);
                    break;
                case 'all':
                default:
                    $totalScheduled = $this->scheduleAllAudits($force);
                    break;
            }

            $this->info("✅ {$totalScheduled} audits planifiés avec succès");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de la planification: {$e->getMessage()}");
            Log::error('Erreur planification audits', [
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Planification audits périodiques
     * Rôle: Calculer les fréquences et créer les jobs
     */
    private function schedulePeriodicAudits(bool $force): int
    {
        $this->info('📊 Planification audits périodiques...');

        $auditor = new PeriodicAuditor();
        $scheduled = $auditor->schedulePeriodicAudits();

        $this->info("   • {$scheduled} audits périodiques planifiés");
        return $scheduled;
    }

    /**
     * Planification audits globaux
     * Rôle: Planifier les audits système complets
     */
    private function scheduleGlobalAudits(bool $force): int
    {
        $this->info('🌍 Planification audits globaux...');

        $scheduled = 0;

        // Audit quotidien
        if ($force || !$this->isGlobalAuditScheduled('daily')) {
            AuditQueue::create([
                'queue_name' => 'global_audit_daily',
                'entity_type' => 'system',
                'entity_id' => 0,
                'audit_type' => 'global',
                'priority' => 5,
                'scheduled_at' => now()->addHours(2),
                'max_attempts' => 3
            ]);
            $scheduled++;
        }

        // Audit hebdomadaire complet
        if ($force || !$this->isGlobalAuditScheduled('weekly')) {
            AuditQueue::create([
                'queue_name' => 'global_audit_weekly',
                'entity_type' => 'system',
                'entity_id' => 0,
                'audit_type' => 'global',
                'priority' => 3,
                'scheduled_at' => now()->addDays(7),
                'max_attempts' => 3
            ]);
            $scheduled++;
        }

        $this->info("   • {$scheduled} audits globaux planifiés");
        return $scheduled;
    }

    /**
     * Planification tous les audits
     * Rôle: Exécuter la planification complète
     */
    private function scheduleAllAudits(bool $force): int
    {
        $total = 0;

        $total += $this->schedulePeriodicAudits($force);
        $total += $this->scheduleGlobalAudits($force);

        return $total;
    }

    /**
     * Vérification si audit global déjà planifié
     * Rôle: Éviter les doublons de planification
     */
    private function isGlobalAuditScheduled(string $type): bool
    {
        $queueName = "global_audit_{$type}";
        
        return AuditQueue::where('queue_name', $queueName)
            ->where('audit_type', 'global')
            ->where('scheduled_at', '>', now())
            ->exists();
    }
}
