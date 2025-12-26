<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Setting;
use App\Services\RegistrationService;
use App\Notifications\TrialAccountWarningNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SendTrialExpirationWarnings extends Command
{
    /**
     * La signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'users:send-trial-warnings';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Envoie des avertissements aux utilisateurs dont la période d\'essai expire bientôt';

    /**
     * Taille du lot pour le traitement des utilisateurs
     *
     * @var int
     */
    protected $chunkSize = 100;

    /**
     * Jours avant expiration pour envoyer les avertissements
     *
     * @var array
     */
    protected $warningDays = [3, 2, 1];

    /**
     * Exécute la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Envoi des avertissements d\'expiration de période d\'essai...');

        try {
            // Récupérer la durée de la période d'essai depuis les paramètres
            $trialDurationDays = (int) Setting::getValue('essai_duration_days', 10);
            $this->info("Durée de la période d'essai configurée: {$trialDurationDays} jours");

            $totalSent = 0;

            foreach ($this->warningDays as $daysBeforeExpiry) {
                $this->info("Vérification des comptes expirant dans {$daysBeforeExpiry} jour(s)...");
                
                // Calculer la date pour les comptes qui expirent dans X jours
                $targetDate = Carbon::now()->addDays($daysBeforeExpiry)->subDays($trialDurationDays);
                $targetDateEnd = Carbon::now()->addDays($daysBeforeExpiry)->subDays($trialDurationDays)->endOfDay();
                
                $this->info("Période de recherche: {$targetDate->format('Y-m-d H:i:s')} à {$targetDateEnd->format('Y-m-d H:i:s')}");

                $sentCount = 0;

                // Récupérer les comptes en essai créés dans cette période
                User::where('status', RegistrationService::STATUS_TRIAL)
                    ->where('created_at', '>=', $targetDate)
                    ->where('created_at', '<=', $targetDateEnd)
                    ->chunk($this->chunkSize, function ($trialUsers) use (&$sentCount, $daysBeforeExpiry, $trialDurationDays) {
                        DB::beginTransaction();
                        try {
                            foreach ($trialUsers as $user) {
                                $trialEndDate = $user->created_at->copy()->addDays($trialDurationDays);
                                
                                $this->line("Envoi d'un avertissement à l'utilisateur ID: {$user->id}, Email: {$user->email}, Expiration: {$trialEndDate->format('Y-m-d H:i:s')}");
                                
                                // Envoyer la notification d'avertissement
                                $user->notify(new TrialAccountWarningNotification($daysBeforeExpiry, $trialEndDate));
                                
                                $sentCount++;
                            }
                            
                            DB::commit();
                            $this->info("Lot traité: {$trialUsers->count()} avertissements envoyés");
                        } catch (\Exception $e) {
                            DB::rollBack();
                            $this->error("Erreur lors du traitement du lot: {$e->getMessage()}");
                            Log::error('Erreur lors de l\'envoi des avertissements: ' . $e->getMessage());
                            Log::error($e->getTraceAsString());
                        }
                    });

                $this->info("Avertissements envoyés pour {$daysBeforeExpiry} jour(s): {$sentCount}");
                $totalSent += $sentCount;
            }

            $this->info("Nombre total d'avertissements envoyés: {$totalSent}");
            
            return Command::SUCCESS;

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi des avertissements d\'essai: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            $this->error('Une erreur est survenue lors de l\'envoi des avertissements d\'essai');
            return Command::FAILURE;
        }
    }
}
