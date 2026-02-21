<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\UserBonusPointHistory;
use App\Models\Pack;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Liste des transactions financières avec filtres
     */
    public function index(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $nature = $request->get('nature');
        $status = $request->get('status', 'completed'); // Par défaut 'completed' au lieu de 'all'
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 15);

        $flow = $request->get('flow');
        $search = $request->get('search');
        $packId = $request->get('pack_id');
        $dateStart = $request->get('date_start');
        $dateEnd = $request->get('date_end');
        
        // Définir les dates de début et fin selon la période
        if ($period === 'all') {
            $query = WalletSystemTransaction::with('processor');
        } else {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            
            $query = WalletSystemTransaction::with('processor')->whereBetween('created_at', [$startDate, $endDate]);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }
        
        // Filtre par statut (par défaut 'completed')
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Recherche par référence
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where('reference', 'LIKE', '%' . $searchTerm . '%');
        }
        
        // Filtre par mouvement (entrée/sortie)
        if ($flow) {
            $query->where('flow', $flow);
        }

        // Filtre par nature (interne/externe)
        if ($nature) {
            $query->where('nature', $nature);
        }
        
        // Filtre par pack (dans les métadonnées)
        if ($packId) {
            $query->where(function($q) use ($packId) {
                // Essayer plusieurs formats pour Pack_ID
                $q->whereJsonContains('metadata->Pack_ID', (string)$packId)
                  ->orWhereJsonContains('metadata->Pack_ID', $packId)
                  ->orWhereJsonContains('metadata->Pack_ID', (int)$packId)
                  // Aussi vérifier si pack_id existe comme clé alternative
                  ->orWhereJsonContains('metadata->pack_id', (string)$packId)
                  ->orWhereJsonContains('metadata->pack_id', $packId)
                  ->orWhereJsonContains('metadata->pack_id', (int)$packId);
            });
        }
        
        // Filtre par date personnalisée
        if ($dateStart) {
            $query->whereDate('created_at', '>=', $dateStart);
        }
        
        if ($dateEnd) {
            $query->whereDate('created_at', '<=', $dateEnd);
        }

        // Tri
        $query->orderBy('id', 'desc');

        // Pagination
        $transactions = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'from' => $transactions->firstItem(),
                'to' => $transactions->lastItem(),
            ]
        ]);
    }

    /**
     * Statistiques des transactions financières par type et période
     */
    public function financialTransactionsStatistics(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $nature = $request->get('nature');
        $status = $request->get('status', 'completed'); // Par défaut 'completed' au lieu de 'all'
        $flow = $request->get('flow');
        $search = $request->get('search');
        $packId = $request->get('pack_id');
        $dateStart = $request->get('date_start');
        $dateEnd = $request->get('date_end');
        
        // Définir les dates de début et fin selon la période
        if ($period === 'all') {
            $query = WalletSystemTransaction::query();
        } else {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate]);
        }
        
        // Filtrer par type si spécifié
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        // Filtrer par nature si spécifié
        if ($nature) {
            $query->where('nature', $nature);
        }
        
        // Filtre par statut (par défaut 'completed')
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        // Filtre par mouvement (entrée/sortie)
        if ($flow) {
            $query->where('flow', $flow);
        }
        
        // Filtre par recherche (référence)
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('reference', 'LIKE', "%{$search}%")
                  ->orWhere('id', 'LIKE', "%{$search}%");
            });
        }
        
        // Filtre par pack (dans les métadonnées)
        if ($packId) {
            $query->where(function($q) use ($packId) {
                // Essayer plusieurs formats pour Pack_ID
                $q->whereJsonContains('metadata->Pack_ID', (string)$packId)
                  ->orWhereJsonContains('metadata->Pack_ID', $packId)
                  ->orWhereJsonContains('metadata->Pack_ID', (int)$packId)
                  // Aussi vérifier si pack_id existe comme clé alternative
                  ->orWhereJsonContains('metadata->pack_id', (string)$packId)
                  ->orWhereJsonContains('metadata->pack_id', $packId)
                  ->orWhereJsonContains('metadata->pack_id', (int)$packId);
            });
        }
        
        // Filtre par date personnalisée
        if ($dateStart) {
            $query->whereDate('created_at', '>=', $dateStart);
        }
        
        if ($dateEnd) {
            $query->whereDate('created_at', '<=', $dateEnd);
        }
        
        $creditQuery = clone $query;
        $debitQuery = clone $query;
        
        $creditAmount = $creditQuery->where('flow', 'in')->sum('amount');
        $debitAmount = abs($debitQuery->where('flow', 'out')->sum('amount'));

        return response()->json([
            'credit_amount' => $creditAmount,
            'debit_amount' => $debitAmount,
            'solde' => $creditAmount - $debitAmount,
        ]);
    }

    /**
     * Export des transactions financières vers Excel
     */
    public function exportFinancialTransactions(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $nature = $request->get('nature');
        $status = $request->get('status', 'completed');
        $exportType = $request->get('export_type', 'filtered');
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 15);
        
        // Nouveaux filtres
        $flow = $request->get('flow');
        $search = $request->get('search');
        $packId = $request->get('pack_id');
        $dateStart = $request->get('date_start');
        $dateEnd = $request->get('date_end');
        
        // Définir les dates de début et fin selon la période
        if ($period === 'all') {
            $query = WalletSystemTransaction::query();
        } else {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate]);
        }
        
        // Appliquer les filtres
        if ($type !== 'all') {
            $query->where('type', $type);
        }
        
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Recherche par référence
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where('reference', 'LIKE', '%' . $searchTerm . '%');
        }
        
        // Filtre par mouvement (entrée/sortie)
        if ($flow) {
            $query->where('flow', $flow);
        }

        // Filtre par nature (entrée/sortie)
        if ($nature) {
            $query->where('nature', $nature);
        }
        
        // Filtre par pack (dans les métadonnées)
        if ($packId) {
            $query->where(function($q) use ($packId) {
                // Essayer plusieurs formats pour Pack_ID
                $q->whereJsonContains('metadata->Pack_ID', (string)$packId)
                  ->orWhereJsonContains('metadata->Pack_ID', $packId)
                  ->orWhereJsonContains('metadata->Pack_ID', (int)$packId)
                  // Aussi vérifier si pack_id existe comme clé alternative
                  ->orWhereJsonContains('metadata->pack_id', (string)$packId)
                  ->orWhereJsonContains('metadata->pack_id', $packId)
                  ->orWhereJsonContains('metadata->pack_id', (int)$packId);
            });
        }
        
        // Filtre par date personnalisée
        if ($dateStart) {
            $query->whereDate('created_at', '>=', $dateStart);
        }
        
        if ($dateEnd) {
            $query->whereDate('created_at', '<=', $dateEnd);
        }

        // Appliquer la pagination selon le type d'export
        if ($exportType === 'current_page') {
            $query->offset(($page - 1) * $perPage)->limit($perPage);
        } elseif ($exportType === 'filtered') {
            // Pour l'export filtré, limiter à un nombre raisonnable pour éviter les timeouts
            $query->limit(10000);
        }
        // Pour 'all', on ne limite pas (attention aux performances)

        // Trier par date de création
        $transactions = $query->orderBy('created_at', 'desc')->get();

        // Préparer les données pour l'export (sans la ligne d'en-tête)
        $exportData = [];

        foreach ($transactions as $transaction) {
            $metadata = '';
            if ($transaction->metadata) {
                $metadataArray = [];
                foreach ($transaction->metadata as $key => $value) {
                    if (is_array($value)) {
                        $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                    }
                    $metadataArray[] = "$key: $value";
                }
                $metadata = implode("\n", $metadataArray);
            }

            $exportData[] = [
                'reference' => $transaction->reference ?? 'TRX-' . $transaction->id,
                'nature' => $transaction->nature === 'internal' ? 'interne' : ($transaction->nature === 'external' ? 'externe' : 'N/A'),
                'flow' => $transaction->flow === 'in' ? 'Entrée' : 'Sortie',
                'type' => $transaction->type ?? '-',
                'amount' => $transaction->amount,
                'status' => $this->getStatusLabel($transaction->status),
                'description' => $transaction->description,
                'solde_marchand_before' => $transaction->solde_marchand_before,
                'solde_marchand_after' => $transaction->solde_marchand_after,
                'engagement_users_before' => $transaction->engagement_users_before,
                'engagement_users_after' => $transaction->engagement_users_after,
                'plateforme_benefices_before' => $transaction->plateforme_benefices_before,
                'plateforme_benefices_after' => $transaction->plateforme_benefices_after,
                'processor' => $transaction->processor?->name,
                'processed_at' => $transaction->processed_at,
                'rejection_reason' => $transaction->rejection_reason,
                'created_at' => $transaction->created_at,
                'metadata' => $metadata
            ];
        }

        return response()->json([
            'data' => $exportData,
            'filename' => 'transactions-financieres-' . $exportType . '-' . date('Y-m-d-H-i-s') . '.xlsx'
        ]);
    }

    /**
     * Obtenir le libellé du statut
     */
    private function getStatusLabel($status)
    {
        $labels = [
            'completed' => 'Complétée',
            'pending' => 'En attente',
            'failed' => 'Échouée',
            'cancelled' => 'Annulée',
        ];
        
        return $labels[$status] ?? $status;
    }

    /**
     * Obtenir la date de début selon la période
     */
    private function getStartDate($period)
    {
        if ($period === 'all') {
            return null; // Retourner null pour "all" - pas de filtre de date
        }
        
        $now = Carbon::now();
        
        switch ($period) {
            case 'day':
                return $now->startOfDay();
            case 'week':
                return $now->startOfWeek();
            case 'month':
                return $now->startOfMonth();
            case 'year':
                return $now->startOfYear();
            default:
                return $now->startOfMonth();
        }
    }

    /**
     * Récupérer les statistiques des transactions regroupées par type
     */
    public function getStatsByType(Request $request)
    {
        try {
            $query = WalletSystemTransaction::query();

            $query->where('status', 'completed');
            
            // Debug: Compter les transactions par devise (avec différentes variations)
            $count = WalletSystemTransaction::count();
            $stats = $query->select('type', 
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('MIN(created_at) as first_transaction'),
                DB::raw('MAX(created_at) as last_transaction')
            )
            ->groupBy('type')
            ->get();

            // Calculer le total général par devise
            $totalAmount = $query->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'total_amount' => $totalAmount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les types de transactions disponibles
     */
    public function getTransactionTypes()
    {
        try {
            $types = WalletSystemTransaction::select('type')
                ->distinct()
                ->pluck('type');

            return response()->json([
                'success' => true,
                'data' => $types
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types de transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer le solde actuel du système
     */
    public function getSystemBalance()
    {
        try {
            $walletSystem = WalletSystem::first();
            
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun système de portefeuille trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'solde_marchand' => $walletSystem->solde_marchand,
                    'engagement_users' => $walletSystem->engagement_users,
                    'plateforme_benefices' => $walletSystem->plateforme_benefices,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du solde du système: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer le résumé des finances
     */
    public function getSummary(Request $request)
    {
        try {
            // Période par défaut: dernier mois
            $startDate = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->subMonth();
            $endDate = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();

            // Récupérer le solde actuel
            $walletSystem = WalletSystem::first();
            
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun système de portefeuille trouvé'
                ], 404);
            }

            // Récupérer les statistiques par type pour la période
            $statsByType = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->groupBy('type')
                ->get();

            // Récupérer le total des entrées et sorties pour la période
            $totalIn = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('flow', 'in')
                ->where('status', 'completed')
                ->sum('amount');

            $totalOut = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('flow', 'out')
                ->where('status', 'completed')
                ->sum('amount');

            // Récupérer les statistiques par type pour la période
            $statsByType = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('type', 
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->groupBy('type')
                ->get();

            // Récupérer le nombre de transactions par jour pour la période
            $transactionsByDay = WalletSystemTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->where('status', 'completed')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'solde_marchand' => $walletSystem->solde_marchand,
                    'engagement_users' => $walletSystem->engagement_users,
                    'plateforme_benefices' => $walletSystem->plateforme_benefices,
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                    'stats_by_type' => $statsByType,
                    'transactions_by_day' => $transactionsByDay,
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du résumé des finances: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Exporter les transactions financières
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function exportFinanceTransactions(Request $request)
    {
        try {
            $query = WalletSystemTransaction::query()
                ->with(['walletSystem'])
                ->orderBy('created_at', 'desc');

            // Appliquer les mêmes filtres que la fonction index
            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }

            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            if ($request->has('user_id') && !empty($request->user_id)) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $query->where('pack_id', $request->pack_id);
            }

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('user', function($subQuery) use ($search) {
                          $subQuery->where('name', 'like', "%{$search}%")
                                  ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Récupérer toutes les transactions correspondantes
            $transactions = $query->get();

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'count' => $transactions->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'exportation des transactions financières: ' . $e->getMessage()
            ], 500);
        }
    }
}
