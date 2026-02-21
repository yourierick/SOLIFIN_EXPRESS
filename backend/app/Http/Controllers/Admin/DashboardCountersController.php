<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use App\Models\DigitalProduct;
use App\Models\Publicite;
use App\Models\OffreEmploi;
use App\Models\SocialEvent;
use App\Models\OpportuniteAffaire;
use App\Models\WithdrawalRequest;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardCountersController extends Controller
{
    /**
     * Récupérer tous les compteurs du dashboard en une seule requête
     *
     * @return JsonResponse
     */
    public function getAllCounters(): JsonResponse
    {
        try {
            // Utiliser Promise.all-like approach avec des requêtes parallèles
            $counters = [
                'withdrawals' => $this->getPendingWithdrawalsCount(),
                'formations' => $this->getPendingFormationsCount(),
                'digital_products' => $this->getPendingDigitalProductsCount(),
                'advertisements' => $this->getPendingAdvertisementsCount(),
                'job_offers' => $this->getPendingJobOffersCount(),
                'social_events' => $this->getPendingSocialEventsCount(),
                'business_opportunities' => $this->getPendingBusinessOpportunitiesCount(),
                'testimonials' => $this->getPendingTestimonialsCount(),
            ];

            return response()->json([
                'success' => true,
                'data' => $counters
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des compteurs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compter le nombre de demandes de retrait en attente
     *
     * @return int
     */
    private function getPendingWithdrawalsCount(): int
    {
        try {
            return WithdrawalRequest::where('status', 'pending')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage retraits: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre de formations en attente
     *
     * @return int
     */
    private function getPendingFormationsCount(): int
    {
        try {
            return Formation::where('status', 'pending')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage formations: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre de produits numériques en attente
     *
     * @return int
     */
    private function getPendingDigitalProductsCount(): int
    {
        try {
            return DigitalProduct::where('statut', 'en_attente')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage produits digitaux: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre de publicités en attente
     *
     * @return int
     */
    private function getPendingAdvertisementsCount(): int
    {
        try {
            return Publicite::where('statut', 'en_attente')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage publicités: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre d'offres d'emploi en attente
     *
     * @return int
     */
    private function getPendingJobOffersCount(): int
    {
        try {
            return OffreEmploi::where('statut', 'en_attente')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage offres emploi: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre d'événements sociaux en attente
     *
     * @return int
     */
    private function getPendingSocialEventsCount(): int
    {
        try {
            return SocialEvent::where('statut', 'en_attente')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage événements sociaux: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre d'opportunités d'affaires en attente
     *
     * @return int
     */
    private function getPendingBusinessOpportunitiesCount(): int
    {
        try {
            return OpportuniteAffaire::where('statut', 'en_attente')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage opportunités affaires: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compter le nombre de témoignages en attente
     *
     * @return int
     */
    private function getPendingTestimonialsCount(): int
    {
        try {
            return Testimonial::where('status', 'pending')->count();
        } catch (\Exception $e) {
            \Log::error('Erreur comptage témoignages: ' . $e->getMessage());
            return 0;
        }
    }
}
