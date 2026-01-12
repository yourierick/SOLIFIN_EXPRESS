<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserPack;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CheckPackExpiration extends Command
{
    protected $signature = 'packs:check-expiration';
    protected $description = 'Vérifie et met à jour le statut des packs expirés';

    /**
     * Taille du lot pour le traitement des packs
     *
     * @var int
     */
    protected $chunkSize = 500; // Augmenté pour meilleure performance

    public function handle()
    {
        $this->info('Vérification des packs expirés...');

        try {
            $processedCount = 0;
            // Récupérer tous les packs actifs qui sont expirés
            UserPack::where('status', 'active')
                ->where('is_admin_pack', false)
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<', Carbon::now())
                ->chunk($this->chunkSize, function ($expiredPacks) use (&$processedCount) {
                    $this->info("Traitement d'un lot de {$expiredPacks->count()} packs expirés...");
                    
                    try {
                        DB::transaction(function () use ($expiredPacks, &$processedCount) {
                            // Préparer les IDs pour mise à jour en masse
                            $packIds = $expiredPacks->pluck('id')->toArray();
                            
                            // Journaliser les expirations
                            foreach ($expiredPacks as $pack) {
                                Log::info("Pack expiré", [
                                    'pack_id' => $pack->id,
                                    'user_id' => $pack->user_id,
                                    'expiry_date' => $pack->expiry_date->format('Y-m-d H:i:s'),
                                    'expired_at' => Carbon::now()->format('Y-m-d H:i:s')
                                ]);
                                
                                $this->line("Pack ID: {$pack->id} marqué comme expiré");
                            }
                            
                            // Mettre à jour tous les packs en une seule requête
                            if (!empty($packIds)) {
                                UserPack::whereIn('id', $packIds)
                                    ->update([
                                        'status' => 'expired',
                                        'updated_at' => Carbon::now()
                                    ]);
                                
                                $processedCount += count($packIds);
                            }
                        });
                        
                        $this->info("Lot traité: {$expiredPacks->count()} packs");
                    } catch (\Exception $e) {
                        $this->error("Erreur lors du traitement du lot: {$e->getMessage()}");
                        Log::error("Erreur lors du traitement d'un lot de packs expirés", [
                            'batch_count' => $expiredPacks->count(),
                            'exception' => $e->getTraceAsString()
                        ]);
                    }
                });

            $this->info("Nombre de packs expirés mis à jour : " . $processedCount);
            return Command::SUCCESS;

        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification des packs expirés: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            $this->error('Une erreur est survenue lors de la vérification des packs expirés');
            return Command::FAILURE;
        }
    }
}
