<?php

namespace App\Console\Commands;

use App\Models\Publicite;
use App\Models\OffreEmploi;
use App\Models\OpportuniteAffaire;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdatePublicationStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'publications:update-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mettre à jour le statut des publications expirées';
    
    /**
     * Taille du lot pour le traitement des publications
     *
     * @var int
     */
    protected $chunkSize = 500; // Augmenté pour meilleure performance

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Démarrage de la mise à jour des statuts des publications...');
        
        try {
            $this->updatePubliciteStatus();
            $this->updateOffreEmploiStatus();
            $this->updateOpportuniteAffaireStatus();

            $this->info('Statut des publications mis à jour avec succès.');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Une erreur est survenue lors de la mise à jour des statuts: ' . $e->getMessage());
            Log::error('Erreur lors de la mise à jour des statuts des publications: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }

    /**
     * Mettre à jour le statut des publicités expirées
     */
    private function updatePubliciteStatus()
    {
        $this->info('Traitement des publicités...');
        
        $stats = $this->processPublications(
            Publicite::class,
            'publicités',
            ['statut' => 'approuvé']
        );
        
        $this->info("{$stats['expired']} publicités ont expirées.");
    }

    /**
     * Mettre à jour le statut des offres d'emploi expirées
     */
    private function updateOffreEmploiStatus()
    {
        $this->info('Traitement des offres d\'emploi...');
        
        $stats = $this->processPublications(
            OffreEmploi::class,
            'offres d\'emploi',
            ['statut' => 'approuvé']
        );
        
        $this->info("{$stats['expired_duree']} offres d'emploi ont expiré (durée d'affichage).");
    }

    /**
     * Mettre à jour le statut des opportunités d'affaires expirées
     */
    private function updateOpportuniteAffaireStatus()
    {
        $this->info('Traitement des opportunités d\'affaires...');
        
        $stats = $this->processPublications(
            OpportuniteAffaire::class,
            'opportunités d\'affaires',
            ['statut' => 'approuvé']
        );
        
        $this->info("{$stats['expired_duree']} opportunités d'affaires ont expiré (durée d'affichage).");
    }
    
    /**
     * Méthode générique pour traiter les publications par lots
     * 
     * @param string $modelClass Classe du modèle à traiter
     * @param string $typeName Nom du type de publication pour les logs
     * @param array $conditions Conditions de filtrage
     * @return array Statistiques du traitement
     */
    private function processPublications(string $modelClass, string $typeName, array $conditions = [])
    {
        $stats = [
            'expired' => 0,
            'expired_date_limite' => 0,
            'expired_duree' => 0,
            'updated' => 0,
            'processed' => 0,
            'errors' => 0
        ];
        
        $query = $modelClass::query();
        
        // Appliquer les conditions de filtrage
        foreach ($conditions as $field => $value) {
            $query->where($field, $value);
        }
        
        // Ajouter la condition pour la durée d'affichage
        $query->whereNotNull('duree_affichage');
        
        // Traitement par lots optimisé
        $query->chunk($this->chunkSize, function ($publications) use (&$stats, $modelClass) {
            $this->info("Traitement d'un lot de {$publications->count()} publications...");
            
            try {
                DB::transaction(function () use ($publications, &$stats) {
                    $now = Carbon::now();
                    
                    // Préparer les données pour mises à jour en masse
                    $expiredIds = [];
                    $updateData = [];
                    
                    foreach ($publications as $publication) {
                        $stats['processed']++;
                        
                        // Vérifier si la durée d'affichage est dépassée
                        $dateExpiration = $publication->expiry_date;
                        
                        if ($now->gt($dateExpiration)) {
                            // Publication expirée
                            $expiredIds[] = $publication->id;
                            $stats['expired']++;
                            $stats['expired_duree']++;
                        } else {
                            // Calculer les jours restants
                            $joursRestants = $now->diffInDays($dateExpiration, false);
                            
                            // Si la durée d'affichage est différente des jours restants, préparer pour mise à jour
                            if ($publication->duree_affichage != $joursRestants && $joursRestants >= 0) {
                                $updateData[] = [
                                    'id' => $publication->id,
                                    'duree_affichage' => $joursRestants
                                ];
                                $stats['updated']++;
                            }
                        }
                    }
                    
                    // Mettre à jour les publications expirées en une seule requête
                    if (!empty($expiredIds)) {
                        $modelClass::whereIn('id', $expiredIds)
                            ->update([
                                'statut' => 'expiré',
                                'duree_affichage' => 0,
                                'updated_at' => $now
                            ]);
                    }
                    
                    // Mettre à jour les durées d'affichage en une seule requête
                    if (!empty($updateData)) {
                        foreach ($updateData as $data) {
                            $modelClass::where('id', $data['id'])
                                ->update(['duree_affichage' => $data['duree_affichage']]);
                        }
                    }
                });
                
                $this->info("Lot traité: {$publications->count()} publications");
            } catch (\Exception $e) {
                $stats['errors']++;
                $this->error("Erreur lors du traitement du lot: {$e->getMessage()}");
                Log::error("Erreur lors du traitement d'un lot de publications", [
                    'model' => $modelClass,
                    'batch_count' => $publications->count(),
                    'exception' => $e->getTraceAsString()
                ]);
            }
        });
        
        return $stats;
    }
}
