<?php

namespace App\Console\Commands;

use App\Models\TestimonialPrompt;
use App\Services\TestimonialPromptService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessTestimonialPrompts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'testimonials:process-prompts {--batch=100 : Nombre d\'utilisateurs à traiter par lot} {--expire : Marquer les invitations expirées}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie et crée des invitations à témoigner pour les utilisateurs éligibles';

    /**
     * Le service de gestion des invitations à témoigner.
     *
     * @var \App\Services\TestimonialPromptService
     */
    protected $testimonialPromptService;

    /**
     * Crée une nouvelle instance de la commande.
     *
     * @param \App\Services\TestimonialPromptService $testimonialPromptService
     * @return void
     */
    public function __construct(TestimonialPromptService $testimonialPromptService)
    {
        parent::__construct();
        $this->testimonialPromptService = $testimonialPromptService;
    }

    /**
     * Exécute la commande console.
     *
     * @return int Code de sortie
     */
    public function handle(): int
    {
        $this->info('Démarrage du traitement des invitations à témoigner...');
        
        // Marquer les invitations expirées si l'option est spécifiée
        if ($this->option('expire')) {
            $expiredCount = $this->testimonialPromptService->expireOldPrompts();
            $this->info("{$expiredCount} invitations ont été marquées comme expirées.");
        }
        
        // Récupérer la taille du lot depuis les options
        $batchSize = (int) $this->option('batch');
        
        // Traiter les utilisateurs éligibles
        $startTime = microtime(true);
        $stats = $this->testimonialPromptService->processEligibleUsers($batchSize);
        $duration = round(microtime(true) - $startTime, 2);
        \Log::info($stats);
        
        // Afficher les statistiques
        $this->info('Traitement terminé en ' . $duration . ' secondes.');
        $this->table(
            ['Utilisateurs traités', 'Invitations créées', 'Utilisateurs ignorés', 'Erreurs'],
            [[$stats['processed'], $stats['created'], $stats['skipped'], $stats['errors']]]
        );
        
        // Journaliser les résultats
        Log::info('Traitement des invitations à témoigner terminé', [
            'duration' => $duration,
            'stats' => $stats,
        ]);
        
        // Afficher les statistiques globales avec requêtes optimisées
        $this->newLine();
        $this->info('Statistiques globales :');
        
        // Récupérer toutes les statistiques en une seule requête
        $globalStats = TestimonialPrompt::selectRaw('
            SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = "displayed" THEN 1 ELSE 0 END) as displayed,
            SUM(CASE WHEN status = "submitted" THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN status = "declined" THEN 1 ELSE 0 END) as declined,
            SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired
        ')->first();
        
        $this->table(
            ['En attente', 'Affichées', 'Soumises', 'Déclinées', 'Expirées'],
            [
                [$globalStats->pending ?? 0, $globalStats->displayed ?? 0, $globalStats->submitted ?? 0, $globalStats->declined ?? 0, $globalStats->expired ?? 0]
            ]
        );
        
        return Command::SUCCESS;
    }
}
