<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Grade;
use App\Models\Wallet;
use App\Notifications\GradeAttributedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DistributeGradesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'grades:distribute';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Distribuer les grades aux utilisateurs ayant atteint le nombre de points requis';

    /**
     * Execute console command.
     */
    public function handle()
    {
        $this->info('Début de la distribution des grades...');
        $this->info('Heure: ' . now()->format('Y-m-d H:i:s'));

        try {
            DB::beginTransaction();

            // Récupérer tous les grades ordonnés par niveau
            $grades = Grade::orderBy('niveau', 'asc')->get()->keyBy('niveau');
            
            $distributedCount = 0;
            $skippedCount = 0;
            $errors = [];

            // Récupérer tous les utilisateurs avec wallet et grade en une seule requête optimisée
            $users = User::with(['wallet', 'grade'])
                ->where('is_admin', false)
                ->whereHas('wallet', function($query) {
                    $query->where('points', '>', 0); // Combine existence et filtrage
                })
                ->get();

            $this->info("Traitement de {$users->count()} utilisateurs...");

            foreach ($users as $user) {
                try {
                    $newGrade = $this->determineGradeForUser($user, $grades);
                    
                    if (!$newGrade) {
                        $this->info("  Utilisateur {$user->email} n'a pas assez de points");
                        continue;
                    }

                    // Vérifier si l'utilisateur n'a pas déjà ce grade ou un grade supérieur
                    if ($user->grade_id && $user->grade && $user->grade->niveau >= $newGrade->niveau) {
                        $this->info("  Utilisateur {$user->email} a déjà un grade supérieur ou égal ({$user->grade->niveau}), ignoré");
                        $skippedCount++;
                        continue;
                    }

                    // Récupérer le grade précédent pour la notification
                    $previousGrade = $user->grade;

                    // Mise à jour optimisée
                    $user->grade_id = $newGrade->id;
                    $user->seen_grade_notif = false;
                    $user->save();

                    // Enregistrer l'historique d'attribution du grade
                    \App\Models\GradeHistory::create([
                        'user_id' => $user->id,
                        'grade_id' => $newGrade->id,
                    ]);

                    $distributedCount++;
                    
                    $this->info("  ✓ Grade {$newGrade->niveau} attribué à {$user->email} ({$user->wallet->points} points)");
                    
                    // Envoyer une notification à l'utilisateur
                    try {
                        $user->notify(new GradeAttributedNotification(
                            $newGrade,
                            $user->wallet->points,
                            $previousGrade
                        ));
                        $this->info("  📧 Notification envoyée à {$user->email}");
                    } catch (\Exception $notificationError) {
                        $this->error("  ✗ Erreur lors de l'envoi de la notification à {$user->email}: " . $notificationError->getMessage());
                        Log::error("Erreur notification grade", [
                            'user_id' => $user->id,
                            'grade_id' => $newGrade->id,
                            'error' => $notificationError->getMessage()
                        ]);
                    }
                    
                } catch (\Exception $e) {
                    $errors[] = "Erreur pour l'utilisateur {$user->email}: " . $e->getMessage();
                    $this->error("  ✗ Erreur pour {$user->email}: " . $e->getMessage());
                }
            }

            DB::commit();

            // Résumé de la distribution
            $this->newLine();
            $this->info('=== RÉSUMÉ DE LA DISTRIBUTION ===');
            $this->info("Grades distribués: {$distributedCount}");
            $this->info("Utilisateurs ignorés: {$skippedCount}");
            
            if (!empty($errors)) {
                $this->error('Erreurs rencontrées:');
                foreach ($errors as $error) {
                    $this->error("  - {$error}");
                }
            }
            
            $this->info('Distribution terminée avec succès!');
            $this->info('Heure de fin: ' . now()->format('Y-m-d H:i:s'));
            
            // Logger la distribution
            Log::info('Distribution des grades', [
                'date' => now()->format('Y-m-d H:i:s'),
                'total_users_processed' => $users->count(),
                'distributed_count' => $distributedCount,
                'skipped_count' => $skippedCount,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Erreur lors de la distribution des grades: ' . $e->getMessage());
            Log::error('Erreur distribution grades', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return 1;
        }

        return 0;
    }

    /**
     * Déterminer le grade approprié pour un utilisateur
     */
    private function determineGradeForUser($user, $grades)
    {
        $userPoints = $user->wallet->points;
        $currentGradeLevel = $user->grade ? $user->grade->niveau : 0;
        
        // Ne pas traiter le dernier grade
        $maxGrade = $grades->max('niveau');
        
        foreach ($grades as $grade) {
            // Ignorer le dernier grade
            if ($grade->niveau == $maxGrade) {
                continue;
            }
            
            // Vérifier si l'utilisateur a assez de points
            if ($userPoints >= $grade->points && $grade->niveau > $currentGradeLevel) {
                return $grade;
            }
        }
        
        return null;
    }
}
