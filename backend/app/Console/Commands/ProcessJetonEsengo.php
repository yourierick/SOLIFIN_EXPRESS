<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\JetonEsengoService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Commande pour traiter l'attribution des jetons Esengo
 * Cette commande peut être exécutée manuellement ou via le planificateur Laravel
 * Elle traite l'attribution mensuelle des jetons Esengo
 */
class ProcessJetonEsengo extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'solifin:process-jeton-esengo {--batch=500 : Taille du lot pour le traitement}';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Traite l\'attribution mensuelle des jetons Esengo';

    /**
     * Le service d'attribution des jetons Esengo.
     *
     * @var \App\Services\JetonEsengoService
     */
    protected $jetonEsengoService;

    /**
     * Crée une nouvelle instance de commande.
     *
     * @param \App\Services\JetonEsengoService $jetonEsengoService
     * @return void
     */
    public function __construct(JetonEsengoService $jetonEsengoService)
    {
        parent::__construct();
        $this->jetonEsengoService = $jetonEsengoService;
    }

    /**
     * Exécute la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Début du traitement des jetons Esengo...');
        
        // Mesurer le temps d'exécution
        $startTime = microtime(true);
        
        try {
            // Récupérer la taille du lot depuis les options
            $batchSize = (int) $this->option('batch');
            
            // Traiter l'attribution hebdomadaire des jetons Esengo
            $stats = $this->jetonEsengoService->processWeeklyJetons($batchSize);
            
            $duration = round(microtime(true) - $startTime, 2);
            $this->info("Traitement terminé en {$duration} secondes.");
            $this->info("{$stats['users_processed']} utilisateurs traités, {$stats['jetons_attributed']} jetons attribués, {$stats['errors']} erreurs.");
            
            // Journaliser les résultats avec le temps d'exécution
            Log::info('Traitement des jetons Esengo terminé', [
                'duration' => $duration,
                'stats' => $stats,
            ]);
            
            if ($stats['errors'] > 0) {
                return Command::FAILURE;
            }
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $duration = round(microtime(true) - $startTime, 2);
            $this->error('Erreur lors du traitement des jetons Esengo: ' . $e->getMessage());
            Log::error('Erreur lors du traitement des jetons Esengo: ' . $e->getMessage());
            Log::error('Durée avant erreur: ' . $duration . ' secondes');
            Log::error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
