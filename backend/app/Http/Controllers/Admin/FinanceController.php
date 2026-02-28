<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\UserBonusPointHistory;
use App\Models\Pack;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
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
        $status = $request->get('status', 'all');
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
        $status = $request->get('status', 'completed');
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

    /**
     * Annuler une transaction
     */
    public function cancelTransaction(Request $request, $id)
    {
        try {
            // Récupérer la transaction
            $transaction = WalletSystemTransaction::find($id);
            
            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction non trouvée'
                ], 404);
            }
            
            // Vérifier si la transaction peut être annulée
            if ($transaction->type !== 'solifin_funds_withdrawal') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette transaction ne peut pas être annulée'
                ], 400);
            }

            //Vérifier si la transaction a déjà été annulée
            $findReverseTransaction = WalletSystemTransaction::where('source_transaction_reference', $transaction->reference)->first();
            if ($findReverseTransaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette transaction a déjà été annulée'
                ]);
            }
            
            // Vérifier si la transaction a moins d'une semaine
            $transactionDate = new \DateTime($transaction->created_at);
            $oneWeekAgo = new \DateTime();
            $oneWeekAgo->sub(new \DateInterval('P7D'));
            
            if ($transactionDate < $oneWeekAgo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les transactions de plus d\'une semaine ne peuvent pas être annulées'
                ], 400);
            }

            // Vérifier le mot de passe administrateur
            // récupérer l'id du rôle super-admin
            $role_id = Role::where('slug', 'super-admin')->first()->id;
            $superadmin = User::where('role_id', $role_id)->first();
            
            // Vérifier le mot de passe du superadmin
            if (!Hash::check($request->password, $superadmin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect, veuillez contacter l\'administrateur principal pour plus d\'infos!'
                ], 401);
            }
            
            $walletSystem = WalletSystem::first();
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille principal non trouvé',
                ], 400);
            }

            // Commencer le traitement
            DB::beginTransaction();

            $walletSystem->cancelWithdrawal(
                $transaction->reference,
                $transaction->amount, 
                'withdrawal_reverse',
                'completed',
                auth()->id(),
                'Annulation de retrait',
                [
                    'Opération' => 'Annulation de retrait',
                    'Traité par' => auth()->user()->name,
                    'Traité le' => now(),
                    'Transaction source' => $transaction->reference,
                    'Montant total' => $transaction->amount . ' $',
                ]
            );

            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Transaction annulée avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Erreur lors de l\'annulation de la transaction: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la transaction: ' . $e->getMessage()
            ], 500);
        }
    }  
    
    /**
     * Ajuster le solde entre différents comptes
     */
    public function adjustBalance(Request $request)
    {
        try {
            // Valider les données
            $validated = $request->validate([
                'source_account' => 'required|in:api_provider,solifin_benefits,engagement_users',
                'destination_account' => 'required|in:solde_marchand,solifin_benefits,engagement_users',
                'amount' => 'required|numeric|min:0.01',
                'reason' => 'required|string|min:3',
                'password' => 'required|string'
            ]);

            // Vérifier le mot de passe administrateur
            // récupérer l'id du rôle super-admin
            $user = auth()->user();
            $role_id = Role::where('slug', 'super-admin')->first()->id;
            $superadmin = User::where('role_id', $role_id)->first();
            
            // Vérifier le mot de passe du superadmin
            if (!Hash::check($validated['password'], $superadmin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect, veuillez contacter l\'administrateur principal pour plus d\'infos!'
                ], 401);
            }

            // Vérifier les contraintes source/destination
            $constraints = [
                'api_provider' => ['solde_marchand'],
                'solifin_benefits' => ['engagement_users'],
                'engagement_users' => ['solifin_benefits']
            ];

            if (!in_array($validated['destination_account'], $constraints[$validated['source_account']])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Combinaison source/destination non autorisée'
                ], 400);
            }

            $walletSystem = WalletSystem::first();
            $amount = $validated['amount'];
            
            // Préparer les métadonnées
            $metadata = [
                'source_account' => $validated['source_account'],
                'destination_account' => $validated['destination_account'],
                'amount' => $amount,
                'reason' => $validated['reason'],
                'adjusted_by' => $user->name . ' / ' . $user->account_id,
                'adjusted_at' => now()->toDateTimeString()
            ];

            // Effectuer l'ajustement selon la source
            switch ($validated['source_account']) {
                case 'api_provider':
                    // API Provider -> Solde marchand
                    $transaction = $walletSystem->addFunds(
                        $amount,
                        'balance_adjustment',
                        'completed',
                        'Ajustement de solde depuis API Provider: ' . $validated['reason'],
                        $user->id,
                        $metadata,
                        $validated['reason']
                    );
                    break;

                case 'solifin_benefits':
                    // Bénéfices SOLIFIN -> Engagements utilisateurs
                    $transaction = $walletSystem->addEngagements(
                        $amount,
                        'balance_adjustment',
                        'completed',
                        'Ajustement de solde depuis les bénéfices SOLIFIN: ' . $validated['reason'],
                        $user->id,
                        $metadata,
                        $validated['reason']
                    );
                    break;

                case 'engagement_users':
                    // Engagements utilisateurs -> Bénéfices SOLIFIN
                    $transaction = $walletSystem->addProfits(
                        $amount,
                        'balance_adjustment',
                        'completed',
                        'Ajustement de solde depuis les engagements utilisateurs: ' . $validated['reason'],
                        $user->id,
                        $metadata,
                        $validated['reason']
                    );
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => 'Ajustement de solde effectué avec succès',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'source_account' => $validated['source_account'],
                    'destination_account' => $validated['destination_account'],
                    'amount' => $amount,
                    'adjusted_at' => $transaction->processed_at
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'ajustement de solde: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajustement de solde: ' . $e->getMessage()
            ], 500);
        }
    }
}
