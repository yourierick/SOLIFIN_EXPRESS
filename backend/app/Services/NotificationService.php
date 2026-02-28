<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\FinancialAnomalyDetected;
use Illuminate\Support\Facades\Log;

/**
 * NotificationService - Service centralisé pour les notifications d'anomalies
 * Rôle: Gérer l'envoi des notifications selon la sévérité
 */
class NotificationService
{
    /**
     * Envoyer une notification d'anomalie financière
     * Rôle: Router la notification selon la sévérité
     */
    public function sendAnomalyNotification(array $anomaly): void
    {
        try {
            $severity = $anomaly['severity'] ?? 'low';
            
            // Récupérer les super-admins
            $superAdmins = $this->getSuperAdmins();
            
            if ($superAdmins->isEmpty()) {
                Log::warning('Aucun super-admin trouvé pour la notification d\'anomalie', [
                    'anomaly_type' => $anomaly['type'],
                    'severity' => $severity
                ]);
                return;
            }
            
            // Envoyer la notification à tous les super-admins
            foreach ($superAdmins as $admin) {
                $admin->notify(new FinancialAnomalyDetected($anomaly, $severity));
            }
            
            Log::info('Notification d\'anomalie envoyée', [
                'anomaly_type' => $anomaly['type'],
                'severity' => $severity,
                'admins_count' => $superAdmins->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de la notification d\'anomalie', [
                'anomaly_type' => $anomaly['type'] ?? 'unknown',
                'severity' => $anomaly['severity'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Récupérer les super-admins
     * Rôle: Identifier les utilisateurs avec les droits d'administration
     */
    private function getSuperAdmins()
    {
        return User::whereHas('roles', function ($query) {
            $query->where('name', 'super-admin')
               ->orWhere('name', 'admin')
               ->orWhere('name', 'administrator');
        })
        ->orWhere('is_admin', true) // Alternative si pas de système de rôles
        ->where('email_verified_at', '!=', null) // Seulement emails vérifiés
        ->get();
    }
    
    /**
     * Vérifier si une notification doit être envoyée
     * Rôle: Filtrer selon la sévérité et la fréquence
     */
    public function shouldSendNotification(array $anomaly): bool
    {
        $severity = $anomaly['severity'] ?? 'low';
        
        // Toujours envoyer pour high/critical
        if (in_array($severity, ['high', 'critical'])) {
            return true;
        }
        
        // Pour low/medium, vérifier la fréquence
        return $this->checkNotificationFrequency($anomaly);
    }
    
    /**
     * Vérifier la fréquence des notifications
     * Rôle: Éviter le spam pour les anomalies récurrentes
     */
    private function checkNotificationFrequency(array $anomaly): bool
    {
        // Logique de fréquence à implémenter
        // Ex: pas plus d'une notification par heure pour la même anomalie
        return true; // Pour l'instant, toujours envoyer
    }
}
