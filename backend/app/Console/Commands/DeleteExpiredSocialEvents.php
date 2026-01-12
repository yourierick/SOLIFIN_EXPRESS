<?php

namespace App\Console\Commands;

use App\Models\SocialEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DeleteExpiredSocialEvents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-expired-social-events {--hours=24 : Nombre d\'heures après lesquelles les statuts sont considérés comme expirés}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete social events that are older than 24 hours';
    
    /**
     * Taille du lot pour le traitement des événements sociaux
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
        $this->info('Starting to delete expired social events...');
        
        $hours = $this->option('hours');
        $this->info("Looking for social events older than {$hours} hours");
        
        $startTime = now();
        $totalDeleted = 0;
        $totalErrors = 0;
        
        try {
            // Traitement par lots optimisé des statuts sociaux expirés
            SocialEvent::where('statut', 'approuvé')
                ->where('created_at', '<', now()->subHours($hours))
                ->chunk($this->chunkSize, function ($events) use (&$totalDeleted, &$totalErrors) {
                    $this->info("Processing batch of {$events->count()} events...");
                    
                    try {
                        DB::transaction(function () use ($events, &$totalDeleted) {
                            // Précharger les relations pour éviter les requêtes N+1
                            $events->load(['reports']);
                            
                            // Collecter tous les fichiers à supprimer
                            $filesToDelete = [];
                            $reportIdsToDelete = [];
                            
                            foreach ($events as $event) {
                                if ($event->image) {
                                    $filesToDelete[] = $event->image;
                                }
                                if ($event->video) {
                                    $filesToDelete[] = $event->video;
                                }
                                
                                // Collecter les IDs des signalements
                                $reportIdsToDelete = array_merge(
                                    $reportIdsToDelete, 
                                    $event->reports->pluck('id')->toArray()
                                );
                            }
                            
                            // Supprimer les signalements en une seule requête
                            if (!empty($reportIdsToDelete)) {
                                DB::table('social_event_reports')
                                    ->whereIn('id', $reportIdsToDelete)
                                    ->delete();
                            }
                            
                            // Supprimer les événements en une seule requête
                            $eventIds = $events->pluck('id')->toArray();
                            SocialEvent::whereIn('id', $eventIds)->delete();
                            
                            // Supprimer les fichiers (en dehors de la transaction)
                            foreach ($filesToDelete as $file) {
                                try {
                                    Storage::disk('public')->delete($file);
                                } catch (\Exception $e) {
                                    $this->warn("Could not delete file: {$file} - {$e->getMessage()}");
                                }
                            }
                            
                            $totalDeleted += $events->count();
                            
                            $this->line("Deleted batch of {$events->count()} social events");
                        });
                        
                    } catch (\Exception $e) {
                        $totalErrors += $events->count();
                        $this->error("Error processing batch: {$e->getMessage()}");
                        Log::error("Error deleting batch of social events", [
                            'batch_count' => $events->count(),
                            'exception' => $e->getTraceAsString(),
                        ]);
                    }
                });
                
            $duration = now()->diffInSeconds($startTime);
            $this->info("Finished deleting expired social events in {$duration} seconds.");
            $this->info("Total deleted: {$totalDeleted}, Total errors: {$totalErrors}");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Fatal error during batch processing: {$e->getMessage()}");
            Log::error("Fatal error during batch processing of expired social events: {$e->getMessage()}", [
                'exception' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
}
