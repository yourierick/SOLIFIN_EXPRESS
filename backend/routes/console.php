<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// === COMMANDES D'AUDIT FINANCIER ROBUSTE ===

// Planification des audits périodiques (toutes les 6 heures)
Schedule::command('audit:schedule --type=periodic')
    ->everySixHours()
    ->between('02:00', '06:00') // Hures creuses pour éviter les pics de charge
    ->appendOutputTo(storage_path('logs/audit-periodic.log'))
    ->description('Planifie les audits périodiques intelligents toutes les 6 heures');

// Audit global quotidien complet
Schedule::command('audit:global --async')
    ->daily()
    ->at('02:30') // Heure creuse
    ->appendOutputTo(storage_path('logs/audit-global.log'))
    ->description('Exécute l\'audit global complet du système financier');

// Audit global hebdomadaire approfondi
Schedule::command('audit:global --async --force')
    ->weekly()
    ->sundays()
    ->at('03:00') // Heure creuse du weekend
    ->appendOutputTo(storage_path('logs/audit-global-weekly.log'))
    ->description('Exécute l\'audit global hebdomadaire approfondi');


// Définition des tâches planifiées pour Laravel 11
Schedule::command('packs:check-expiration')
    ->daily()
    ->at('00:00')
    ->appendOutputTo(storage_path('logs/expired-packs.log'))
    ->description('Vérifie les packs expirés tous les jours à minuit');

Schedule::command('publications:update-status')
    ->daily()
    ->at('00:30')
    ->appendOutputTo(storage_path('logs/publications-status.log'))
    ->description('Met à jour le statut des publications expirées tous les jours à 00h30');

// Schedule::command('users:send-trial-warnings')
//     ->daily()
//     ->at('09:00')
//     ->appendOutputTo(storage_path('logs/trial-warnings.log'))
//     ->description('Envoie les avertissements d\'expiration de période d\'essai tous les jours à 9h');

// Schedule::command('users:delete-expired-trials')
//     ->daily()
//     ->at('01:00')
//     ->appendOutputTo(storage_path('logs/expired-trial-accounts.log'))
//     ->description('Supprime les comptes utilisateurs en période d\'essai expirée tous les jours à 1h du matin');

Schedule::command('app:delete-expired-social-events')
    ->hourly()
    ->appendOutputTo(storage_path('logs/expired-social-events.log'))
    ->description('Supprime les statuts sociaux de plus de 24 heures');

// Jetons Esengo (hebdomadaire - chaque lundi à 00h00)
Schedule::command('solifin:process-jeton-esengo')
    ->weekly()
    ->mondays()
    ->at('00:00')
    ->appendOutputTo(storage_path('logs/jetons-esengo.log'))
    ->description('Attribue les jetons Esengo (hebdomadaires) aux utilisateurs pour la semaine précédente');

// Distribution des grades aux utilisateurs éligibles (chaque lundi à 05h00)
Schedule::command('grades:distribute')
    ->weekly()
    ->mondays()
    ->at('05:00')
    ->appendOutputTo(storage_path('logs/grades-distribution.log'))
    ->description('Distribue les grades aux utilisateurs ayant atteint le nombre de points requis');

// Vérification des jetons Esengo expirés (tous les jours à 01:15)
Schedule::command('solifin:check-expired-jetons-esengo')
    ->daily()
    ->at('01:15')
    ->appendOutputTo(storage_path('logs/expired-jetons-esengo.log'))
    ->description('Vérifie et marque les jetons Esengo expirés');
    
// Vérification des tickets gagnants expirés (tous les jours à 01:45)
Schedule::command('solifin:check-expired-tickets-gagnants --notify')
    ->daily()
    ->at('01:30')
    ->appendOutputTo(storage_path('logs/expired-tickets-gagnants.log'))
    ->description('Vérifie et marque les tickets gagnants expirés');

// Planification du traitement des invitations à témoigner
// Vérification quotidienne des utilisateurs éligibles (tous les jours à 02:00)
Schedule::command('testimonials:process-prompts --expire')
    ->everyMinute()
    ->appendOutputTo(storage_path('logs/testimonial-prompts.log'))
    ->description('Vérifie les utilisateurs éligibles et crée des invitations à témoigner');

// Vérification hebdomadaire plus approfondie (chaque dimanche à 03:00)
Schedule::command('testimonials:process-prompts --batch=500 --expire')
    ->weeklyOn(0, '03:00') // 0 = Dimanche
    ->appendOutputTo(storage_path('logs/testimonial-prompts-weekly.log'))
    ->description('Vérification hebdomadaire approfondie des invitations à témoigner');

// === TÂCHES SYSTÈME ===
// Nettoyage du cache - quotidien à 03:30
Schedule::command('cache:clear')
    ->daily()
    ->at('03:30')
    ->description('Nettoie le cache quotidien');

// Redémarrage du worker de file d'attente (toutes les heures)
Schedule::command('queue:restart')
    ->hourly()
    ->description('Redémarre le worker de file d\'attente');