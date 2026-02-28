<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Wallet;
use App\Models\UserJetonEsengo;
use App\Models\UserJetonEsengoHistory;
use App\Models\TicketGagnant;
use App\Models\WithdrawalRequest;
use App\Models\WalletTransaction;
use App\Models\WalletSystemTransaction;
use App\Models\UserPack;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TableauDeSuiviController extends Controller
{
    public function suiviAbonnement(Request $request)
    {
        $period = $request->get('period', 'all');
        
        // Gérer le cas où period = "all"
        if ($period === 'all') {
            $startDate = null;
            $endDate = null;
        } else {
            // Définir les dates de début et fin selon la période
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
        }

        // Statistiques des utilisateurs
        if ($period === 'all') {
            $usersStats = [
                'active' => User::where('status', 'active')->count(),
                'inactive' => User::where('status', 'inactive')->count(),
                'trial' => User::where('status', 'trial')->count(),
                'total' => User::count(),
            ];
        } else {
            $usersStats = [
                'active' => User::where('status', 'active')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'inactive' => User::where('status', 'inactive')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'trial' => User::where('status', 'trial')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'total' => User::whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
            ];
        }

        // Statistiques des wallets avec conversion selon la devise
        $totalBalance = Wallet::sum('balance');
        $availableBalance = Wallet::sum('available_balance');
        $frozenBalance = Wallet::sum('frozen_balance');
        $total_in = WalletTransaction::where('flow', 'in')->where('status', 'completed')->sum('amount');
        $total_out = WalletTransaction::where('flow', 'out')->where('status', 'completed')->sum('amount');
        
        $walletsStats = [
            'total_balance' => $totalBalance,
            'available_balance' => $availableBalance,
            'frozen_balance' => $frozenBalance,
            'total_in' => $total_in,
            'total_out' => $total_out,
        ];

        // Statistiques des jetons esengo
        if ($period === 'all') {
            $jetonsStats = [
                'total_unused' => UserJetonEsengo::where('is_used', false)->count(),
                'total_used' => UserJetonEsengo::where('is_used', true)->count(),
            ];
        } else {
            $jetonsStats = [
                'total_unused' => UserJetonEsengo::where('is_used', false)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'total_used' => UserJetonEsengo::where('is_used', true)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
            ];
        }

        // Statistiques des retraits
        if ($period === 'all') {
            $withdrawalsStats = [
                'pending' => WithdrawalRequest::where('status', 'pending')->count(),
                'processing' => WithdrawalRequest::where('status', 'processing')->count(),
                'rejected' => WithdrawalRequest::where('status', 'rejected')->count(),
                'cancelled' => WithdrawalRequest::where('status', 'cancelled')->count(),
                'failed' => WithdrawalRequest::where('status', 'failed')->count(),
                'paid' => WithdrawalRequest::where('status', 'paid')->count(),
                'total' => WithdrawalRequest::count(),
            ];
        } else {
            $withdrawalsStats = [
                'pending' => WithdrawalRequest::where('status', 'pending')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'processing' => WithdrawalRequest::where('status', 'processing')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'rejected' => WithdrawalRequest::where('status', 'rejected')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'cancelled' => WithdrawalRequest::where('status', 'cancelled')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'failed' => WithdrawalRequest::where('status', 'failed')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'paid' => WithdrawalRequest::where('status', 'paid')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'total' => WithdrawalRequest::whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
            ];
        }

        // Statistiques des abonnements (user_packs)
        if ($period === 'all') {
            $subscriptionsStats = [
                'active' => UserPack::where('status', 'active')->count(),
                'inactive' => UserPack::where('status', 'inactive')->count(),
                'expired' => UserPack::where('status', 'expired')->count(),
                'total' => UserPack::count(),
            ];
        } else {
            $subscriptionsStats = [
                'active' => UserPack::where('status', 'active')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'inactive' => UserPack::where('status', 'inactive')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'expired' => UserPack::where('status', 'expired')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'total' => UserPack::whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
            ];
        }

        return response()->json([
            'users' => $usersStats,
            'wallets' => $walletsStats,
            'jetons' => $jetonsStats,
            'withdrawals' => $withdrawalsStats,
            'subscriptions' => $subscriptionsStats,
            'period' => $period,
            'date_range' => [
                'start' => $startDate ? $startDate : null,
                'end' => $endDate ? $endDate : null,
            ],
        ]);
    }

    public function userPacks(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 25);
        $period = $request->get('period', 'all');
        $packId = $request->get('pack_id');
        $status = $request->get('status');
        $paymentStatus = $request->get('payment_status');
        $purchaseDateStart = $request->get('purchase_date_start');
        $purchaseDateEnd = $request->get('purchase_date_end');
        $expiryDateStart = $request->get('expiry_date_start');
        $expiryDateEnd = $request->get('expiry_date_end');
        $search = $request->get('search');
        
        // Construire la requête de base
        $query = UserPack::with(['user', 'pack', 'sponsor'])
            ->orderBy('created_at', 'desc');
        
        // Filtrer par période (sur created_at)
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        // Filtrer par pack
        if ($packId) {
            $query->where('pack_id', $packId);
        }
        
        // Filtrer par statut
        if ($status) {
            $query->where('status', $status);
        }
        
        // Filtrer par statut de paiement
        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }
        
        // Filtrer par intervalle de date d'achat
        if ($purchaseDateStart) {
            $query->whereDate('purchase_date', '>=', $purchaseDateStart);
        }
        if ($purchaseDateEnd) {
            $query->whereDate('purchase_date', '<=', $purchaseDateEnd);
        }
        
        // Filtrer par intervalle de date d'expiration
        if ($expiryDateStart) {
            $query->whereDate('expiry_date', '>=', $expiryDateStart);
        }
        if ($expiryDateEnd) {
            $query->whereDate('expiry_date', '<=', $expiryDateEnd);
        }
        
        // Recherche sur nom d'utilisateur et code parrain
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('referral_code', 'LIKE', "%{$search}%");
            });
        }
        
        // Récupérer les user packs avec relations et pagination
        $userPacks = $query->paginate($perPage, ['*'], 'page', $page);
        
        // Ajouter le comptage des filleuls directs pour chaque user pack
        $userPacks->getCollection()->transform(function($userPack) {
            // Compter les filleuls directs pour cet utilisateur
            $directReferralsCount = \App\Models\UserPack::where('sponsor_id', $userPack->user_id)
                ->where('user_id', '!=', $userPack->user_id) // Exclure l'utilisateur lui-même
                ->where('pack_id', $userPack->pack_id)
                ->count();
            
            $userPack->direct_referrals_count = $directReferralsCount;
            return $userPack;
        });
        
        return response()->json([
            'data' => $userPacks->items(),
            'current_page' => $userPacks->currentPage(),
            'last_page' => $userPacks->lastPage(),
            'per_page' => $userPacks->perPage(),
            'total' => $userPacks->total(),
            'from' => $userPacks->firstItem(),
            'to' => $userPacks->lastItem(),
        ]);
    }

    public function getPacks()
    {
        $packs = \App\Models\Pack::where('status', true)
            ->select('id', 'name', 'categorie', 'price', 'abonnement')
            ->orderBy('categorie')
            ->orderBy('price')
            ->get();
            
        return response()->json($packs);
    }

    public function userPacksStatistics(Request $request)
    {
        $period = $request->get('period', 'all');
        $packId = $request->get('pack_id');
        $status = $request->get('status');
        $paymentStatus = $request->get('payment_status');
        $purchaseDateStart = $request->get('purchase_date_start');
        $purchaseDateEnd = $request->get('purchase_date_end');
        $search = $request->get('search');
        
        // Construire la requête de base
        $query = \App\Models\UserPack::with(['user', 'pack'])
            ->orderBy('created_at', 'desc');
        
        // Appliquer les mêmes filtres que userPacks
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        if ($packId) {
            $query->where('pack_id', $packId);
        }
        
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }
        
        if ($purchaseDateStart) {
            $query->whereDate('purchase_date', '>=', $purchaseDateStart);
        }
        
        if ($purchaseDateEnd) {
            $query->whereDate('purchase_date', '<=', $purchaseDateEnd);
        }
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('referral_code', 'LIKE', "%{$search}%");
            });
        }
        
        // Statistiques de base
        $total = $query->count();
        $active = $query->where('status', 'active')->count();
        
        // Distribution par statut
        $statusDistribution = $query->selectRaw('user_packs.status, COUNT(*) as value')
            ->groupBy('user_packs.status')
            ->get()
            ->map(function($item) {
                return [
                    'name' => ucfirst($item->status),
                    'value' => $item->value,
                ];
            });
        
        // Distribution par statut de paiement
        $paymentStatusDistribution = $query->selectRaw('user_packs.payment_status as status, COUNT(*) as count')
            ->groupBy('user_packs.payment_status')
            ->get()
            ->map(function($item) {
                return [
                    'status' => $this->getPaymentStatusLabel($item->status),
                    'count' => $item->count,
                ];
            });
        
        // Top 5 des packs les plus populaires
        $topPacks = \App\Models\UserPack::selectRaw('packs.name, COUNT(*) as count')
            ->join('packs', 'user_packs.pack_id', '=', 'packs.id')
            ->where(function($q) use ($period, $packId, $status, $paymentStatus, $purchaseDateStart, $purchaseDateEnd, $search) {
                // Appliquer les mêmes filtres que la requête principale
                if ($period && $period !== 'all') {
                    $startDate = $this->getStartDate($period);
                    $endDate = Carbon::now();
                    $q->whereBetween('user_packs.created_at', [$startDate, $endDate]);
                }
                
                if ($packId) {
                    $q->where('user_packs.pack_id', $packId);
                }
                
                if ($status) {
                    $q->where('user_packs.status', $status);
                }
                
                if ($paymentStatus) {
                    $q->where('user_packs.payment_status', $paymentStatus);
                }
                
                if ($purchaseDateStart) {
                    $q->whereDate('user_packs.purchase_date', '>=', $purchaseDateStart);
                }
                
                if ($purchaseDateEnd) {
                    $q->whereDate('user_packs.purchase_date', '<=', $purchaseDateEnd);
                }
                
                if ($search) {
                    $q->where(function($subQ) use ($search) {
                        $subQ->whereHas('user', function($userQuery) use ($search) {
                            $userQuery->where('name', 'LIKE', "%{$search}%");
                        })
                        ->orWhere('user_packs.referral_code', 'LIKE', "%{$search}%");
                    });
                }
            })
            ->groupBy('packs.id', 'packs.name')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
        
        // Évolution quotidienne (derniers 30 jours ou selon la période)
        if ($period === 'all') {
            $dailyEvolution = []; // Pas d'évolution pour "all"
        } else {
            $startDate = $this->getStartDate($period);
            $dailyEvolution = $query->selectRaw('DATE(user_packs.created_at) as date, COUNT(*) as new_subscriptions, SUM(CASE WHEN user_packs.status = "active" THEN 1 ELSE 0 END) as active_subscriptions')
                ->where('user_packs.created_at', '>=', $startDate)
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function($item) {
                    return [
                        'date' => \Carbon\Carbon::parse($item->date)->format('d/m'),
                        'new_subscriptions' => (int) $item->new_subscriptions,
                        'active_subscriptions' => (int) $item->active_subscriptions,
                    ];
                });
        }
        
        return response()->json([
            'total' => $total,
            'active' => $active,
            'status_distribution' => $statusDistribution,
            'payment_status_distribution' => $paymentStatusDistribution,
            'top_packs' => $topPacks,
            'daily_evolution' => $dailyEvolution,
        ]);
    }
    
    private function getPaymentStatusLabel($status)
    {
        switch ($status) {
            case 'completed':
                return 'Complété';
            case 'pending':
                return 'En attente';
            case 'failed':
                return 'Échoué';
            default:
                return ucfirst($status);
        }
    }

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
     * Obtenir les statistiques des wallets pour le suivi des soldes abonnés
     */
    public function walletStatistics(Request $request)
    {
        $period = $request->get('period', 'all');
        
        // Calculer la date de début selon la période
        $startDate = $this->getStartDate($period);
        
        // Statistiques des soldes totaux selon la devise
        
        $totalBalance = Wallet::sum('balance');
        $availableBalance = Wallet::sum('available_balance');
        $frozenBalance = Wallet::sum('frozen_balance');
        
        // Statistiques des transactions par mouvement pour la période
        if ($startDate) {
            $transactionStats = WalletTransaction::where('created_at', '>=', $startDate)
                ->where('status', 'completed')
                ->selectRaw('
                    flow,
                    SUM(amount) as total_amount
                ')
                ->groupBy('flow')
                ->get()
                ->keyBy('flow');
        } else {
            // Si period = "all", on prend toutes les transactions
            $transactionStats = WalletTransaction::where('status', 'completed')
                ->selectRaw('
                    flow,
                    SUM(amount) as total_amount
                ')
                ->groupBy('flow')
                ->get()
                ->keyBy('flow');
        }
        
        // Calculer les totaux entrés/sortis selon la devise
        $totalIn = $transactionStats->get('in')?->total_amount ?? 0;
        $totalOut = $transactionStats->get('out')?->total_amount ?? 0;
        $solde = $totalIn - $totalOut;
        
        return response()->json([
            'total_balance' => $totalBalance,
            'availableBalance' => $availableBalance,
            'frozenBalance' => $frozenBalance,
            'total_in' => $totalIn,
            'total_out' => $totalOut,
            'solde' => $solde
        ]);
    }
    
    /**
     * Obtenir les transactions des wallets avec filtres
     */
    public function walletTransactions(Request $request)
    {
        $query = WalletTransaction::with(['wallet.user', 'processor']);
        
        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        // Filtre par recherche (nom d'utilisateur ou référence)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                // Recherche par nom d'utilisateur
                $q->whereHas('wallet.user', function($subQuery) use ($search) {
                    $subQuery->where('name', 'LIKE', "%{$search}%");
                })
                // Recherche par référence de transaction
                ->orWhere('reference', 'LIKE', "%{$search}%");
            });
        }
        
        // Filtre par type de transaction
        if ($request->has('type') && !empty($request->type)) {
            $query->where('type', $request->type);
        }
        
        // Filtre par type de mouvement
        if ($request->has('flow') && !empty($request->flow)) {
            $query->where('flow', $request->flow);
        }
        
        // Filtre par statut
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }
        
        // Filtre par période de dates
        if ($request->has('date_start') && !empty($request->date_start)) {
            $query->whereDate('created_at', '>=', $request->date_start);
        }
        
        if ($request->has('date_end') && !empty($request->date_end)) {
            $query->whereDate('created_at', '<=', $request->date_end);
        }
        
        // Tri par date décroissante
        $query->orderBy('created_at', 'desc');
        
        // Pagination
        $perPage = $request->get('per_page', 25);
        $page = $request->get('page', 1);
        
        $transactions = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $transactions->getCollection(),
            'total' => $transactions->total(),
            'per_page' => $transactions->perPage(),
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
        ]);
    }

    /**
     * Récupère les statistiques des jetons Esengo
     */
    public function jetonsEsengoStats(Request $request)
    {
        $query = UserJetonEsengo::query();

        // Filtre par période
        $period = $request->get('period', 'all');
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        // Recherche par utilisateur ou code unique
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_unique', 'LIKE', "%{$search}%");
            });
        }

        // Filtre par pack
        if ($request->has('pack_id') && !empty($request->pack_id)) {
            $query->where('pack_id', $request->pack_id);
        }

        // Filtre par statut d'utilisation (is_used)
        if ($request->has('is_used') && !empty($request->is_used)) {
            $query->where('is_used', $request->is_used === 'true');
        }

        // Filtre par statut calculé
        if ($request->has('status') && !empty($request->status)) {
            switch ($request->status) {
                case 'valid':
                    $query->where(function($q) {
                        $q->whereNull('date_expiration')
                          ->orWhere('date_expiration', '>', Carbon::now());
                    });
                    break;
                case 'expired':
                    $query->where('date_expiration', '<', Carbon::now());
                    break;
            }
        }

        // Filtres par période d'expiration
        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        // Filtres par période d'utilisation
        if ($request->has('usage_date_start') && !empty($request->usage_date_start)) {
            $query->whereDate('date_utilisation', '>=', $request->usage_date_start);
        }
        
        if ($request->has('usage_date_end') && !empty($request->usage_date_end)) {
            $query->whereDate('date_utilisation', '<=', $request->usage_date_end);
        }

        // Cloner la requête de base pour les statistiques
        $baseQuery = clone $query;

        // Statistiques des jetons
        $stats = [
            'attribues' => $baseQuery->count(),
            'utilises' => (clone $query)->where('is_used', true)->count(),
            'non_utilises' => (clone $query)->where('is_used', false)
                ->where(function($query) {
                    $query->whereNull('date_expiration')
                          ->orWhere('date_expiration', '>', Carbon::now());
                })
                ->count(),
            'expires' => (clone $query)->where('date_expiration', '<', Carbon::now())->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Récupère la liste des jetons Esengo avec pagination et filtres
     */
    public function jetonsEsengo(Request $request)
    {
        $query = UserJetonEsengo::with(['user', 'pack']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Recherche par utilisateur ou code unique
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_unique', 'LIKE', "%{$search}%");
            });
        }

        // Filtre par pack
        if ($request->has('pack_id') && !empty($request->pack_id)) {
            $query->where('pack_id', $request->pack_id);
        }

        // Filtre par statut d'utilisation (is_used)
        if ($request->has('is_used') && !empty($request->is_used)) {
            $query->where('is_used', $request->is_used === 'true');
        }

        // Filtre par statut calculé
        if ($request->has('status') && !empty($request->status)) {
            switch ($request->status) {
                case 'valid':
                    $query->where(function($q) {
                        $q->whereNull('date_expiration')
                          ->orWhere('date_expiration', '>', Carbon::now());
                    });
                    break;
                case 'expired':
                    $query->where('date_expiration', '<', Carbon::now());
                    break;
            }
        }

        // Filtres par période d'expiration
        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        // Filtres par période d'utilisation
        if ($request->has('usage_date_start') && !empty($request->usage_date_start)) {
            $query->whereDate('date_utilisation', '>=', $request->usage_date_start);
        }
        
        if ($request->has('usage_date_end') && !empty($request->usage_date_end)) {
            $query->whereDate('date_utilisation', '<=', $request->usage_date_end);
        }

        // Tri par date décroissante
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 25);
        $page = $request->get('page', 1);

        $jetons = $query->paginate($perPage, ['*'], 'page', $page);

        // Ajouter le statut calculé pour chaque jeton
        $jetons->getCollection()->transform(function ($jeton) {
            $jeton->isExpired = $jeton->isExpired();
            return $jeton;
        });

        return response()->json([
            'data' => $jetons->getCollection(),
            'total' => $jetons->total(),
            'per_page' => $jetons->perPage(),
            'current_page' => $jetons->currentPage(),
            'last_page' => $jetons->lastPage(),
        ]);
    }

    /**
     * Récupère l'historique d'un jeton Esengo spécifique
     */
    public function jetonEsengoHistory(Request $request, $jetonId)
    {
        $jeton = UserJetonEsengo::findOrFail($jetonId);
        
        $history = UserJetonEsengoHistory::with(['user', 'cadeau', 'jeton'])
            ->where('jeton_id', $jetonId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($history);
    }

    /**
     * Récupère les statistiques des tickets gagnants
     */
    public function ticketsGagnantsStats(Request $request)
    {
        $query = TicketGagnant::query();

        // Filtre par période
        $period = $request->get('period', 'all');
        $startDate = $this->getStartDate($period);
        $endDate = Carbon::now();
        $query->whereBetween('created_at', [$startDate, $endDate]);

        // Recherche multi-champs
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_jeton', 'LIKE', "%{$search}%")
                ->orWhere('code_verification', 'LIKE', "%{$search}%")
                ->orWhereHas('cadeau', function($cadeauQuery) use ($search) {
                    $cadeauQuery->where('nom', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('admin', function($adminQuery) use ($search) {
                    $adminQuery->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        // Filtre par statut
        if ($request->has('status') && !empty($request->status)) {
            $query->where('consomme', $request->status);
        }

        // Filtres par période d'expiration
        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        // Filtres par période de consommation
        if ($request->has('consumption_date_start') && !empty($request->consumption_date_start)) {
            $query->whereDate('date_consommation', '>=', $request->consumption_date_start);
        }
        
        if ($request->has('consumption_date_end') && !empty($request->consumption_date_end)) {
            $query->whereDate('date_consommation', '<=', $request->consumption_date_end);
        }

        // Cloner la requête de base pour les statistiques
        $baseQuery = clone $query;

        // Statistiques des tickets
        $stats = [
            'attribues' => $baseQuery->count(),
            'consommes' => (clone $query)->where('consomme', TicketGagnant::CONSOMME)->count(),
            'programmes' => (clone $query)->where('consomme', TicketGagnant::PROGRAMME)->count(),
            'expires' => (clone $query)->where('consomme', TicketGagnant::EXPIRE)->count(),
            'non_consommes' => (clone $query)->where('consomme', TicketGagnant::NON_CONSOMME)->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Récupère la liste des tickets gagnants avec pagination et filtres
     */
    public function ticketsGagnants(Request $request)
    {
        $query = TicketGagnant::with(['user', 'cadeau', 'admin']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Recherche multi-champs
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_jeton', 'LIKE', "%{$search}%")
                ->orWhere('code_verification', 'LIKE', "%{$search}%")
                ->orWhereHas('cadeau', function($cadeauQuery) use ($search) {
                    $cadeauQuery->where('nom', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('admin', function($adminQuery) use ($search) {
                    $adminQuery->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        // Filtre par statut
        if ($request->has('status') && !empty($request->status)) {
            $query->where('consomme', $request->status);
        }

        // Filtres par période d'expiration
        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        // Filtres par période de consommation
        if ($request->has('consumption_date_start') && !empty($request->consumption_date_start)) {
            $query->whereDate('date_consommation', '>=', $request->consumption_date_start);
        }
        
        if ($request->has('consumption_date_end') && !empty($request->consumption_date_end)) {
            $query->whereDate('date_consommation', '<=', $request->consumption_date_end);
        }

        // Tri par date décroissante
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 25);
        $page = $request->get('page', 1);

        $tickets = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $tickets->getCollection(),
            'total' => $tickets->total(),
            'per_page' => $tickets->perPage(),
            'current_page' => $tickets->currentPage(),
            'last_page' => $tickets->lastPage(),
        ]);
    }

    /**
     * Exporter les jetons esengo
     */
    public function exportJetonsEsengo(Request $request)
    {
        $query = UserJetonEsengo::with(['user', 'pack']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== "all") {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Appliquer les mêmes filtres que la méthode jetonsEsengo
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_unique', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('pack_id') && !empty($request->pack_id)) {
            $query->where('pack_id', $request->pack_id);
        }

        if ($request->has('is_used') && !empty($request->is_used)) {
            $query->where('is_used', $request->is_used === 'true');
        }

        if ($request->has('status') && !empty($request->status)) {
            switch ($request->status) {
                case 'valid':
                    $query->where(function($q) {
                        $q->whereNull('date_expiration')
                          ->orWhere('date_expiration', '>', Carbon::now());
                    });
                    break;
                case 'expired':
                    $query->where('date_expiration', '<', Carbon::now());
                    break;
            }
        }

        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        if ($request->has('usage_date_start') && !empty($request->usage_date_start)) {
            $query->whereDate('date_utilisation', '>=', $request->usage_date_start);
        }
        
        if ($request->has('usage_date_end') && !empty($request->usage_date_end)) {
            $query->whereDate('date_utilisation', '<=', $request->usage_date_end);
        }

        // Pour l'export, ne pas paginer
        $jetons = $query->get();

        // Ajouter le statut calculé
        $jetons->transform(function ($jeton) {
            $jeton->isExpired = $jeton->isExpired();
            return $jeton;
        });

        return response()->json($jetons);
    }

    /**
     * Exporter les tickets gagnants
     */
    public function exportTicketsGagnants(Request $request)
    {
        $query = TicketGagnant::with(['user', 'cadeau', 'admin']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== "all") {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Appliquer les mêmes filtres que la méthode ticketsGagnants
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($subQuery) use ($search) {
                $subQuery->whereHas('user', function($userQuery) use ($search) {
                    $userQuery->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('code_jeton', 'LIKE', "%{$search}%")
                ->orWhere('code_verification', 'LIKE', "%{$search}%")
                ->orWhereHas('cadeau', function($cadeauQuery) use ($search) {
                    $cadeauQuery->where('nom', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('admin', function($adminQuery) use ($search) {
                    $adminQuery->where('name', 'LIKE', "%{$search}%");
                });
            });
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('consomme', $request->status);
        }

        if ($request->has('expiry_date_start') && !empty($request->expiry_date_start)) {
            $query->whereDate('date_expiration', '>=', $request->expiry_date_start);
        }
        
        if ($request->has('expiry_date_end') && !empty($request->expiry_date_end)) {
            $query->whereDate('date_expiration', '<=', $request->expiry_date_end);
        }

        if ($request->has('consumption_date_start') && !empty($request->consumption_date_start)) {
            $query->whereDate('date_consommation', '>=', $request->consumption_date_start);
        }
        
        if ($request->has('consumption_date_end') && !empty($request->consumption_date_end)) {
            $query->whereDate('date_consommation', '<=', $request->consumption_date_end);
        }

        // Pour l'export, ne pas paginer
        $tickets = $query->get();

        return response()->json($tickets);
    }

    /**
     * Récupère les statistiques des retraits
     */
    public function retraitsStatistics(Request $request)
    {
        $period = $request->get('period');
        
        $query = WithdrawalRequest::query();
        
        // Filtre par période
        if ($period && $period !== 'all') {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }
        
        // Statistiques générales
        $total = $query->count();
        $totalAmount = $query->sum('amount');
        
        // Statuts de paiement
        $paid = $query->clone()->where('status', 'paid')->count();
        $paidAmount = $query->clone()->where('status', 'paid')->sum('amount');
        
        $pending = $query->clone()->whereIn('status', ['pending', 'processing'])->count();
        $pendingAmount = $query->clone()->whereIn('status', ['pending', 'processing'])->sum('amount');
        
        $rejected = $query->clone()->whereIn('status', ['rejected', 'cancelled', 'failed'])->count();
        $rejectedAmount = $query->clone()->whereIn('status', ['rejected', 'cancelled', 'failed'])->sum('amount');
        
        return response()->json([
            'total' => $total,
            'total_amount' => $totalAmount,
            'paid' => $paid,
            'paid_amount' => $paidAmount,
            'pending' => $pending,
            'pending_amount' => $pendingAmount,
            'rejected' => $rejected,
            'rejected_amount' => $rejectedAmount,
        ]);
    }

    /**
     * Récupère la liste des retraits avec pagination et filtres
     */
    public function retraits(Request $request)
    {
        $query = WithdrawalRequest::with(['user', 'processor']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== "all") {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Filtre par statut
        if ($request->has('status') && !empty($request->get('status'))) {
            $query->where('status', $request->get('status'));
        }

        // Filtre par méthode de paiement
        if ($request->has('payment_method') && !empty($request->get('payment_method'))) {
            $query->where('payment_method', $request->get('payment_method'));
        }

        // Filtre par recherche utilisateur (nom ou email)
        if ($request->has('user_search') && !empty($request->get('user_search'))) {
            $searchTerm = $request->get('user_search');
            $query->whereHas('user', function($q) use ($searchTerm) {
                $q->where('name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('email', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        // Filtres par date
        if ($request->has('created_date_start') && !empty($request->created_date_start)) {
            $query->whereDate('created_at', '>=', $request->created_date_start);
        }
        
        if ($request->has('created_date_end') && !empty($request->created_date_end)) {
            $query->whereDate('created_at', '<=', $request->created_date_end);
        }

        if ($request->has('paid_date_start') && !empty($request->paid_date_start)) {
            $query->whereDate('paid_at', '>=', $request->paid_date_start);
        }
        
        if ($request->has('paid_date_end') && !empty($request->paid_date_end)) {
            $query->whereDate('paid_at', '<=', $request->paid_date_end);
        }

        if ($request->has('refund_date_start') && !empty($request->refund_date_start)) {
            $query->whereDate('refund_at', '>=', $request->refund_date_start);
        }
        
        if ($request->has('refund_date_end') && !empty($request->refund_date_end)) {
            $query->whereDate('refund_at', '<=', $request->refund_date_end);
        }

        // Pagination
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 25);
        
        $retraits = $query->orderBy('created_at', 'desc')
                          ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($retraits);
    }

    /**
     * Export des retraits
     */
    public function exportRetraits(Request $request)
    {
        $query = WithdrawalRequest::with(['user', 'processor']);

        // Filtre par période
        $period = $request->get('period');
        if ($period && $period !== "all") {
            $startDate = $this->getStartDate($period);
            $query->whereBetween('created_at', [$startDate, Carbon::now()]);
        }

        // Appliquer les mêmes filtres que la méthode principale
        if ($request->has('status') && !empty($request->get('status'))) {
            $query->where('status', $request->get('status'));
        }


        if ($request->has('payment_method') && !empty($request->get('payment_method'))) {
            $query->where('payment_method', $request->get('payment_method'));
        }

        // Filtre par recherche utilisateur (nom ou email)
        if ($request->has('user_search') && !empty($request->get('user_search'))) {
            $searchTerm = $request->get('user_search');
            $query->whereHas('user', function($q) use ($searchTerm) {
                $q->where('name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('email', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        // Filtres par date
        if ($request->has('created_date_start') && !empty($request->created_date_start)) {
            $query->whereDate('created_at', '>=', $request->created_date_start);
        }
        
        if ($request->has('created_date_end') && !empty($request->created_date_end)) {
            $query->whereDate('created_at', '<=', $request->created_date_end);
        }

        if ($request->has('paid_date_start') && !empty($request->paid_date_start)) {
            $query->whereDate('paid_at', '>=', $request->paid_date_start);
        }
        
        if ($request->has('paid_date_end') && !empty($request->paid_date_end)) {
            $query->whereDate('paid_at', '<=', $request->paid_date_end);
        }

        if ($request->has('refund_date_start') && !empty($request->refund_date_start)) {
            $query->whereDate('refund_at', '>=', $request->refund_date_start);
        }
        
        if ($request->has('refund_date_end') && !empty($request->refund_date_end)) {
            $query->whereDate('refund_at', '<=', $request->refund_date_end);
        }

        // Pour l'export, ne pas paginer
        $retraits = $query->get();

        return response()->json($retraits);
    }

    /**
     * Statistiques des transactions financières par type et période
     */
    public function financialTransactionsStatistics(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $status = $request->get('status', 'completed'); // Par défaut 'completed' au lieu de 'all'
        $flow = $request->get('flow');
        $nature = $request->get('nature', 'internal');
        $search = $request->get('search');
        $packId = $request->get('pack_id');
        $dateStart = $request->get('date_start');
        $dateEnd = $request->get('date_end');
        
        // Définir les dates de début et fin selon la période
        if ($period === 'all') {
            $query = WalletTransaction::with('wallet.user');
        } else {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            $query = WalletTransaction::with('wallet.user')->whereBetween('created_at', [$startDate, $endDate]);
        }
        
        // Filtrer par type si spécifié
        if ($type !== 'all') {
            $query->where('type', $type);
        }
        
        // Filtre par statut (par défaut 'completed')
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Filtre par nature (par défaut 'internal')
        if ($nature) {
            $query->where('nature', $nature);
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
     * Liste des transactions financières avec filtres
     */
    public function financialTransactions(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $status = $request->get('status', 'completed'); // Par défaut 'completed' au lieu de 'all'
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 15);
        $nature = $request->get('nature', 'internal');
        $flow = $request->get('flow');
        $search = $request->get('search');
        $packId = $request->get('pack_id');
        $dateStart = $request->get('date_start');
        $dateEnd = $request->get('date_end');
        
        // Définir les dates de début et fin selon la période
        if ($period === 'all') {
            $query = WalletTransaction::with('wallet.user', 'processor');
        } else {
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
            
            $query = WalletTransaction::with('wallet', 'processor')->whereBetween('created_at', [$startDate, $endDate]);
        }
        if ($type !== 'all') {
            $query->where('type', $type);
        }
        
        // Filtre par statut (par défaut 'completed')
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Filtre par nature (par défaut 'internal')
        if ($nature) {
            $query->where('nature', $nature);
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
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

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
     * Export des transactions financières vers Excel
     */
    public function exportFinancialTransactions(Request $request)
    {
        $period = $request->get('period', 'all');
        $type = $request->get('type', 'all');
        $status = $request->get('status', 'completed');
        $nature = $request->get('nature', 'internal');
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
            $startDate = null;
            $startDate = $this->getStartDate($period);
            $endDate = Carbon::now();
        }

        // Construire la query de base avec filtrage par devise
        $query = WalletTransaction::with('processor');
        if ($startDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }
            
        // Appliquer les filtres
        if ($type !== 'all') {
            $query->where('type', $type);
        }
            
        // Filtre par statut (par défaut 'completed')
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Filtre par nature (par défaut 'internal')
        if ($nature) {
            $query->where('nature', $nature);
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
                'flow' => $transaction->flow === 'in' ? 'Entrée' : ($transaction->flow === 'out' ? 'Sortie' : ($transaction->flow === 'freeze' ? 'Blocage' : 'Déblocage')),
                'type' => $transaction->type ?? '-',
                'amount' => $transaction->amount,
                'fee_amount' => $transaction->fee_amount,
                'commission_amount' => $transaction->commission_amount,
                'status' => $this->getStatusLabel($transaction->status),
                'balance_before' => $transaction->balance_before,
                'balance_after' => $transaction->balance_after,
                'description' => $transaction->description,
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
}
