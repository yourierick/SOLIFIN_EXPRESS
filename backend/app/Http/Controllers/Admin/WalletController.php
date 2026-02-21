<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\WalletTransaction;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Notifications\SolifinWithdrawalNotification;
use App\Notifications\FundsTransferred;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function getWalletData(Request $request)
    {
        try {
            // Récupérer les paramètres de pagination et de filtre
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 25);
            $status = $request->get('status', 'all');
            $type = $request->get('type', 'all');
            $search = $request->get('search', '');
            $startDate = $request->get('start_date', '');
            $endDate = $request->get('end_date', '');
            
            // Valider les paramètres
            $page = max(1, (int) $page);
            $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 25;

            // Récupérer le wallet de l'admin connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            $total_in = WalletTransaction::where('wallet_id', $userWallet->id)->where('type', 'in')->where('status', 'completed')->sum('amount');
            $total_out = WalletTransaction::where('wallet_id', $userWallet->id)->where('type', 'out')->where('status', 'completed')->sum('amount');
            
            $adminWallet = $userWallet ? [
                'id' => $userWallet->id,
                'balance' => $userWallet->balance,
                'available_balance' => $userWallet->available_balance,
                'frozen_balance' => $userWallet->frozen_balance,
                'total_in' => $total_in,
                'total_out' => $total_out,
                'points' => $userWallet->points,
                'user' => $userWallet->user
            ] : null;
                
            $adminTransactionsQuery = WalletTransaction::with('wallet')
                ->where('wallet_id', $userWallet->id);

            // Appliquer les filtres
            if ($status && $status !== 'all') {
                $adminTransactionsQuery->where('status', $status);
            }

            if ($type && $type !== 'all') {
                $adminTransactionsQuery->where('type', $type);
            }

            if ($search) {
                $adminTransactionsQuery->where(function($query) use ($search) {
                    $query->where('id', 'like', '%' . $search . '%')
                          ->orWhere('type', 'like', '%' . $search . '%')
                          ->orWhere('reference', 'like', '%' . $search . '%');
                });
            }

            if ($startDate) {
                $adminTransactionsQuery->whereDate('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $adminTransactionsQuery->whereDate('created_at', '<=', $endDate);
            }

            $totalAdminTransactions = $adminTransactionsQuery->count();

            // Récupérer les transactions du wallet admin avec pagination
            $adminwallettransactions = $adminTransactionsQuery
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page)
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'amount' => $transaction->amount,
                        'reference' => $transaction->reference,
                        'direction' => $transaction->flow,
                        'nature' => $transaction->nature,
                        'type' => $transaction->type,
                        'description' => $transaction->description,
                        'status' => $transaction->status,
                        'fee_amount' => $transaction->fee_amount,
                        'commission_amount' => $transaction->commission_amount,
                        'balance_before' => $transaction->balance_before,
                        'balance_after' => $transaction->balance_after,
                        'processed_by' => $transaction->processor->name,
                        'processed_at' => $transaction->processed_at,
                        'rejection_reason' => $transaction->rejection_reason,
                        'metadata' => $transaction->metadata,   
                        'created_at' => $transaction->created_at
                    ];
                });

            return response()->json([
                'success' => true,
                'adminWallet' => $adminWallet,
                'adminwallettransactions' => $adminwallettransactions,
                'totalAdminTransactions' => $totalAdminTransactions,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'filters' => [
                        'status' => $status,
                        'type' => $type,
                        'search' => $search,
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter toutes les transactions du portefeuille admin
     */
    public function exportAdminTransactions(Request $request)
    {
        try {
            // Récupérer les paramètres de filtrage
            $status = $request->input('status', 'all');
            $type = $request->input('type', 'all');
            $search = $request->input('search', '');
            $startDate = $request->input('start_date', '');
            $endDate = $request->input('end_date', '');

            // Récupérer l'utilisateur administrateur et son portefeuille
            $admin = auth()->user();
            $adminWallet = Wallet::where('user_id', $admin->id)->first();

            if (!$adminWallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille administrateur non trouvé'
                ], 404);
            }

            // Construire la requête pour les transactions admin
            $query = WalletTransaction::with(['wallet.user'])
                ->where('wallet_id', $adminWallet->id);

            // Appliquer les filtres
            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', '%' . $search . '%')
                      ->orWhere('type', 'like', '%' . $search . '%')
                      ->orWhere('reference', 'like', '%' . $search . '%');
                });
            }

            if (!empty($startDate)) {
                $query->whereDate('created_at', '>=', $startDate);
            }

            if (!empty($endDate)) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            // Récupérer TOUTES les transactions (sans pagination)
            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Formater les transactions
            $formattedTransactions = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'reference' => $transaction->reference,
                    'direction' => $transaction->flow,
                    'nature' => $transaction->nature,
                    'type' => $transaction->type,
                    'description' => $transaction->description,
                    'balance_before' => $transaction->balance_before,
                    'balance_after' => $transaction->balance_after,
                    'processed_by' => $transaction->processed_by,
                    'processed_at' => $transaction->processed_at,
                    'rejection_reason' => $transaction->rejection_reason,
                    'fee_amount' => $transaction->fee_amount,
                    'commission_amount' => $transaction->commission_amount,
                    'status' => $transaction->status,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                ];
            });

            return response()->json([
                'success' => true,
                'transactions' => $formattedTransactions,
                'total' => $formattedTransactions->count(),
                'wallet_type' => 'admin',
                'filters' => [
                    'status' => $status,
                    'type' => $type,
                    'search' => $search,
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des transactions admin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter toutes les transactions du portefeuille système
     */
    public function exportSystemTransactions(Request $request)
    {
        try {
            // Récupérer les paramètres de filtrage
            $status = $request->input('status', 'all');
            $type = $request->input('type', 'all');
            $search = $request->input('search', '');
            $startDate = $request->input('start_date', '');
            $endDate = $request->input('end_date', '');

            // Récupérer le portefeuille système
            $systemWallet = WalletSystem::first();

            if (!$systemWallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille système non trouvé'
                ], 404);
            }

            // Construire la requête pour les transactions système
            $query = WalletSystemTransaction::with(['walletSystem'])
                ->where('wallet_system_id', $systemWallet->id);

            // Appliquer les filtres
            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', '%' . $search . '%')
                      ->orWhere('type', 'like', '%' . $search . '%')
                      ->orWhere('reference', 'like', '%' . $search . '%');
                });
            }

            if (!empty($startDate)) {
                $query->whereDate('created_at', '>=', $startDate);
            }

            if (!empty($endDate)) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            // Récupérer TOUTES les transactions (sans pagination)
            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Formater les transactions
            $formattedTransactions = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => number_format($transaction->amount, 2),
                    'reference' => $transaction->reference,
                    'flow' => $transaction->flow,
                    'nature' => $transaction->nature,
                    'description' => $transaction->description,
                    'balance_before' => number_format($transaction->balance_before, 2),
                    'balance_after' => number_format($transaction->balance_after, 2),
                    'processed_by' => $transaction->processed_by,
                    'processed_at' => $transaction->processed_at,
                    'rejection_reason' => $transaction->rejection_reason,
                    'fee_amount' => number_format($transaction->fee_amount, 2),
                    'commission_amount' => number_format($transaction->commission_amount, 2),
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at->format('d/m/Y H:i:s')
                ];
            });

            return response()->json([
                'success' => true,
                'transactions' => $formattedTransactions,
                'total' => $formattedTransactions->count(),
                'wallet_type' => 'system',
                'filters' => [
                    'status' => $status,
                    'type' => $type,
                    'search' => $search,
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des transactions système: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Effectuer un retrait des bénéfices SOLIFIN
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function withdrawBenefits(Request $request)
    {
        try {
            // Validation des données
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'fees' => 'required|numeric|min:0',
                'totalAmount' => 'required|numeric|min:1',
                'password' => 'required|string|min:6'
            ]);

            $user = auth()->user();
            
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

            $amount = $request->amount;
            $fees = $request->fees;
            $totalAmount = $request->totalAmount;

            // Récupérer le solde système actuel
            $walletSystem = WalletSystem::first();
            if (!$walletSystem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Portefeuille principal non trouvé'
                ], 404);
            }

            // Vérifier si le solde est suffisant
            if ($walletSystem->plateforme_benefices < $totalAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant pour effectuer ce retrait'
                ], 400);
            }

            // Démarrer une transaction
            DB::beginTransaction();

            try {
                $walletSystem->deductFunds($totalAmount, 
                    'solifin_funds_withdrawal', 
                    'completed', 
                    $user->id, 
                    "Retrait des bénéfices SOLIFIN d'un montant de: {$amount} $, et des frais s'élevant à : {$fees} $",
                    [
                        'Opération' => "Retrait des bénéfices SOLIFIN",
                        'Montant net' => $amount . '$',
                        'Frais' => $fees . '$',
                        'Total' => $totalAmount . '$',
                        'Traité par' => $user->name,
                        'Traité le' => now(),
                    ]
                );

                // Valider la transaction
                DB::commit();
                
                // Envoyer la notification au super-admin
                $superadmin->notify(new SolifinWithdrawalNotification(
                    $amount,
                    $fees,
                    $totalAmount,
                    $user->name,
                    now()
                ));
                
                // Journaliser l'action
                \Log::info("Retrait des bénéfices effectué", [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'fees' => $fees,
                    'total_amount' => $totalAmount,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Retrait effectué avec succès',
                    'data' => [
                        'amount' => $amount,
                        'fees' => $fees,
                        'total_amount' => $totalAmount,
                        'new_balance' => $walletSystem->plateforme_benefices
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Erreur lors du retrait des bénéfices: " . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du retrait: ' . $e->getMessage()
            ], 500);
        }
    }
}