<?php

namespace App\Console\Commands;

use App\Models\TicketGagnant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CheckExpiredTicketsGagnants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solifin:check-expired-tickets-gagnants {--notify : Envoyer des notifications aux utilisateurs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie et marque les tickets gagnants expirés';

    /**
     * Taille du lot pour le traitement des tickets
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
        $this->info('Démarrage de la vérification des tickets gagnants expirés...');
        
        $startTime = now();
        $totalExpired = 0;
        $totalNotified = 0;
        $totalErrors = 0;
        
        try {
            // Récupérer les tickets non consommés et expirés
            TicketGagnant::where('consomme', 'non consommé')
                ->where('date_expiration', '<', now())
                ->with(['user', 'cadeau']) // Précharger les relations pour éviter N+1
                ->chunk($this->chunkSize, function ($tickets) use (&$totalExpired, &$totalErrors) {
                    $this->info("Traitement d'un lot de {$tickets->count()} tickets expirés...");
                    
                    try {
                        DB::transaction(function () use ($tickets, &$totalExpired) {
                            // Préparer les données pour mise à jour en masse
                            $ticketIds = [];
                            $updateData = [];
                            
                            foreach ($tickets as $ticket) {
                                $ticketIds[] = $ticket->id;
                                
                                // Vérifier les données requises
                                if (!$ticket->user || !$ticket->cadeau) {
                                    $this->warn("Ticket ID {$ticket->id}: Utilisateur ou cadeau introuvable.");
                                    continue;
                                }
                                
                                // Préparer les métadonnées pour logging
                                $metadata = [
                                    'Date d\'expiration' => $ticket->date_expiration->format('Y-m-d H:i:s'),
                                    'Code de vérification' => $ticket->code_verification,
                                    'Cadeau' => $ticket->cadeau->nom,
                                    'Date d\'expiration dépassée de' => now()->diffForHumans($ticket->date_expiration, true)
                                ];
                                
                                // Journaliser l'expiration
                                Log::info("Ticket gagnant expiré", [
                                    'ticket_id' => $ticket->id,
                                    'user_id' => $ticket->user_id,
                                    'cadeau_id' => $ticket->cadeau->id,
                                    'date_expiration' => $ticket->date_expiration->format('Y-m-d H:i:s')
                                ]);
                                
                                $this->line("Ticket ID: {$ticket->id} marqué comme expiré.");
                            }
                            
                            // Mettre à jour tous les tickets en une seule requête
                            if (!empty($ticketIds)) {
                                TicketGagnant::whereIn('id', $ticketIds)
                                    ->update([
                                        'consomme' => 'expiré',
                                        'date_expiration' => now()
                                    ]);
                                
                                $totalExpired += count($ticketIds);
                            }
                        });
                        
                    } catch (\Exception $e) {
                        $totalErrors += $tickets->count();
                        $this->error("Erreur lors du traitement du lot: {$e->getMessage()}");
                        Log::error("Erreur lors du traitement d'un lot de tickets expirés", [
                            'batch_count' => $tickets->count(),
                            'exception' => $e->getTraceAsString()
                        ]);
                    }
                });
            
            $duration = now()->diffInSeconds($startTime);
            $this->info("Traitement terminé en {$duration} secondes.");
            $this->info("Total de tickets expirés: {$totalExpired}");
            
            if ($this->option('notify')) {
                $this->info("Total de notifications envoyées: {$totalNotified}");
            }
            
            if ($totalErrors > 0) {
                $this->warn("Erreurs rencontrées: {$totalErrors}");
            }
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Erreur fatale lors du traitement des tickets gagnants expirés: {$e->getMessage()}");
            Log::error("Erreur fatale lors du traitement des tickets gagnants expirés: {$e->getMessage()}", [
                'exception' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}
