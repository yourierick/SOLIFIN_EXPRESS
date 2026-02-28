<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Models\Pack;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FinanceController extends Controller
{
    /**
     * Récupérer toutes les transactions de l'utilisateur connecté
     */
    public function getTransactions(Request $request)
    {
        try {
            $user = Auth::user();
            $wallet = Wallet::where('user_id', $user->id)->first();
            
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun portefeuille trouvé pour cet utilisateur'
                ], 404);
            }
            
            $query = WalletTransaction::where('wallet_id', $wallet->id)
                ->orderBy('id', 'desc');

            $totalIn = WalletTransaction::where('wallet_id', $wallet->id)->where('nature', 'internal')->where('flow', 'in')->where('status', 'completed')->sum('amount');
            $totalOut = WalletTransaction::where('wallet_id', $wallet->id)->where('nature', 'internal')->where('flow', 'out')->where('status', 'completed')->sum('amount');
            
            // Filtrer par type si spécifié
            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }
            
            // Filtrer par statut si spécifié
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }
            
            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Filtrer par pack si spécifié (dans les métadonnées)
            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $query->whereJsonContains('metadata->pack_id', (int)$request->pack_id);
            }
            
            $transactions = $query->paginate(10);
            
            return response()->json([
                'success' => true,
                'data' => $transactions,
                'wallet' => [
                    'balance' => $wallet->balance,
                    'available_balance' => $wallet->available_balance,
                    'frozen_balance' => $wallet->frozen_balance,
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer les statistiques des transactions par type
     */
    public function getTransactionStatsByType(Request $request)
    {
        try {
            $user = Auth::user();
            $wallet = Wallet::where('user_id', $user->id)->first();
            
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun portefeuille trouvé pour cet utilisateur'
                ], 404);
            }
            
            $query = WalletTransaction::where('wallet_id', $wallet->id);
            
            
            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Regrouper par type et devise, puis calculer les totaux
            $stats = $query->select('type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('MIN(created_at) as first_transaction'),
                DB::raw('MAX(created_at) as last_transaction')
            )->where('status', 'completed')
            ->groupBy('type')
            ->get();
            
            // Calculer le total général
            $totalAmount = $query->sum('amount');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'total_amount' => $totalAmount
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
     * Récupérer les types de transactions disponibles pour l'utilisateur
     */
    public function getTransactionTypes()
    {
        try {
            $user = Auth::user();
            $wallet = Wallet::where('user_id', $user->id)->first();
            
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun portefeuille trouvé pour cet utilisateur'
                ], 404);
            }
            
            $types = WalletTransaction::where('wallet_id', $wallet->id)
                ->select('type')
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
     * Récupérer le solde du portefeuille de l'utilisateur
     */
    public function getWalletBalance()
    {
        try {
            $user = Auth::user();
            $wallet = Wallet::where('user_id', $user->id)->first();

            $totalIn = WalletTransaction::where('wallet_id', $wallet->id)->where('flow', 'internal')->where('flow', 'in')->where('status', 'completed')->sum('amount');
            $totalOut = WalletTransaction::where('wallet_id', $wallet->id)->where('flow', 'internal')->where('status', 'completed')->sum('amount');
            
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun portefeuille trouvé pour cet utilisateur'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'balance' => $wallet->balance,
                    'available_balance' => $wallet->available_balance,
                    'frozen_balance' => $wallet->frozen_balance,
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du solde: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer un résumé des finances de l'utilisateur
     */
    public function getSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $wallet = Wallet::where('user_id', $user->id)->first();
            
            $totalIn = WalletTransaction::where('wallet_id', $wallet->id)->where('nature', 'internal')->where('flow', 'in')->where('status', 'completed')->sum('amount');
            $totalOut = WalletTransaction::where('wallet_id', $wallet->id)->where('nature', 'internal')->where('flow', 'out')->where('status', 'completed')->sum('amount');
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun portefeuille trouvé pour cet utilisateur'
                ], 404);
            }
            
            // Période par défaut: dernier mois
            $startDate = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->subMonth();
            $endDate = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();
            
            // Récupérer les statistiques par type pour la période, séparées par devise
            $statsByType = WalletTransaction::where('wallet_id', $wallet->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select('type',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as total_amount')
                )
                ->groupBy('type')
                ->get();
            
            // Récupérer le total des entrées et sorties pour la période, séparées par devise
            $totalInUSD = WalletTransaction::where('wallet_id', $wallet->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('nature', 'internal')
                ->where('flow', 'in')
                ->sum('amount');
                
            $totalInCDF = WalletTransaction::where('wallet_id', $wallet->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('nature', 'internal')
                ->where('flow', 'in')
                ->sum('amount');
            
            $totalOutUSD = WalletTransaction::where('wallet_id', $wallet->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('nature', 'internal')
                ->where('flow', 'out')
                ->sum('amount');
                
            $totalOutCDF = WalletTransaction::where('wallet_id', $wallet->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('nature', 'internal')
                ->where('flow', 'out')
                ->sum('amount');
                
            // Récupérer le nombre de demandes de retrait en attente
            $pendingWithdrawals = WithdrawalRequest::where('user_id', $wallet->user->id)
                ->where('status', 'pending')
                ->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'balance' => $wallet->balance,
                    'total_in' => $totalIn,
                    'total_out' => $totalOut,
                    'available_balance' => $wallet->available_balance,
                    'frozen_balance' => $wallet->frozen_balance,
                    // 'period_total_in_usd' => $totalInUSD,
                    // 'period_total_in_cdf' => $totalInCDF,
                    // 'period_total_out_usd' => $totalOutUSD,
                    // 'period_total_out_cdf' => $totalOutCDF,
                    // 'stats_by_type' => $statsByType,
                    'pending_withdrawals' => $pendingWithdrawals,
                    // 'period' => [
                    //     'start' => $startDate->format('Y-m-d'),
                    //     'end' => $endDate->format('Y-m-d')
                    // ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du résumé des finances: ' . $e->getMessage()
            ], 500);
        }
    }
}
