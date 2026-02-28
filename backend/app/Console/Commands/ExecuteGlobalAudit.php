<?php

namespace App\Console\Commands;

use App\Services\GlobalAuditor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * ExecuteGlobalAudit - Commande pour exécuter l'audit global immédiatement
 * Rôle: Lancer l'audit complet du système financier
 */
class ExecuteGlobalAudit extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'audit:global {--async} {--force}';

    /**
     * The console command description.
     */
    protected $description = 'Exécuter l\'audit global du système financier';

    /**
     * Execute the console command.
     * Rôle: Lancer l'audit complet ou le mettre en queue
     */
    public function handle(): int
    {
        $async = $this->option('async');
        $force = $this->option('force');

        $this->info('🔍 Lancement de l\'audit global financier...');

        try {
            if ($async) {
                return $this->executeAsync();
            } else {
                return $this->executeSync();
            }

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'audit global: {$e->getMessage()}");
            Log::error('Erreur audit global', [
                'async' => $async,
                'error' => $e->getMessage()
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Exécution synchrone
     * Rôle: Lancer l'audit immédiatement et afficher les résultats
     */
    private function executeSync(): int
    {
        $this->info('⚡ Exécution synchrone de l\'audit global...');

        $auditor = new GlobalAuditor();
        $results = $auditor->executeGlobalAudit();

        // Affichage des résultats
        $this->displayResults($results);

        return $results['anomalies_detected'] === 0 ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Exécution asynchrone
     * Rôle: Mettre l'audit en queue pour traitement ultérieur
     */
    private function executeAsync(): int
    {
        $this->info('⏳ Mise en queue de l\'audit global...');

        \App\Models\AuditQueue::create([
            'queue_name' => 'global_audit_manual',
            'entity_type' => 'system',
            'entity_id' => 0,
            'audit_type' => 'global',
            'priority' => 1, // Haute priorité pour audit manuel
            'scheduled_at' => now()->addMinutes(5),
            'max_attempts' => 3
        ]);

        $this->info('✅ Audit global mis en queue avec succès');
        return Command::SUCCESS;
    }

    /**
     * Affichage des résultats
     * Rôle: Présenter les résultats de manière lisible
     */
    private function displayResults(array $results): void
    {
        $this->info('');
        $this->info('📊 RÉSULTATS DE L\'AUDIT GLOBAL');
        $this->info('=====================================');
        
        $this->info("🕐 Timestamp: {$results['timestamp']}");
        $this->info("🔍 Vérifications effectuées: {$results['checks_performed']}");
        $this->info("⚠️  Anomalies détectées: {$results['anomalies_detected']}");

        if (!empty($results['anomalies'])) {
            $this->info('');
            $this->info('🚨 DÉTAIL DES ANOMALIES:');
            
            foreach ($results['anomalies'] as $anomaly) {
                $severityIcon = $this->getSeverityIcon($anomaly['severity']);
                $this->info("   {$severityIcon} {$anomaly['type']} ({$anomaly['severity']})");
                $this->info("      📝 {$anomaly['description']}");
                $this->info("      💰 Écart: {$anomaly['difference']}");
                $this->info('');
            }
        } else {
            $this->info('');
            $this->info('🎉 Aucune anomalie détectée! Le système est cohérent.');
        }

        $this->info('=====================================');
    }

    /**
     * Icône de sévérité
     * Rôle: Afficher une icône selon le niveau de sévérité
     */
    private function getSeverityIcon(string $severity): string
    {
        return match($severity) {
            'critical' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            'low' => '🟢',
            default => '⚪'
        };
    }
}
