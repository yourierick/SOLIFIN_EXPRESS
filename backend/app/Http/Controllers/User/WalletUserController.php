<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WalletSystem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Pack;
use App\Notifications\FundsReceivedNotification;
use App\Notifications\CommissionReceivedNotification;
use App\Notifications\MultipleTransferStatusNotification;
use App\Models\Setting;
use App\Notifications\FundsTransferred;
use Illuminate\Support\Facades\DB;
use App\Models\ExchangeRates;
use App\Models\TransactionFee;


class WalletUserController extends Controller
{
    const TYPE_VIRTUAL_PURCHASE = 'virtual_purchase';
    const STATUS_COMPLETED = 'completed';
    const TYPE_VIRTUAL_SALE = 'virtual_sale';
    // Récupérer les données du wallet de l'utilisateur connecté
    public function getWalletData(Request $request)
    {
        try {

            $walletservice = new \App\Services\WalletService();
            // Récupérer le wallet de l'utilisateur connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            $userWallet ?? $userWallet = $walletservice->createUserWallet(Auth::id());
            $Wallet = $userWallet ? [
                'balance_usd' => number_format($userWallet->balance_usd, 2) . ' $',
                'total_earned_usd' => number_format($userWallet->total_earned_usd, 2) . ' $',
                'total_withdrawn_usd' => number_format($userWallet->total_withdrawn_usd, 2) . ' $',
                'balance_cdf' => number_format($userWallet->balance_cdf, 2) . ' FC',
                'total_earned_cdf' => number_format($userWallet->total_earned_cdf, 2) . ' FC',
                'total_withdrawn_cdf' => number_format($userWallet->total_withdrawn_cdf, 2) . ' FC',
            ] : null;

            // Construire la requête de base pour les transactions
            $query = WalletTransaction::with('wallet')
                ->where('wallet_id', $userWallet->id)
                ->orderBy('created_at', 'desc');

            // Filtrer par devise si spécifié
            if ($request->has('currency') && !empty($request->currency)) {
                $query->where('currency', strtolower($request->currency));
            }

            // Filtrer par recherche (recherche dans les métadonnées)
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('type', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('status', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('mouvment', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('reference', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('metadata', $searchTerm);
                });
            }

            // Filtrer par statut si spécifié
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filtrer par type si spécifié
            if ($request->has('type') && !empty($request->type) && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            // Filtrer par date de début si spécifiée
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            // Filtrer par date de fin si spécifiée
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Pagination : par défaut 25, mais configurable via le paramètre per_page
            $perPage = $request->get('per_page', 25);
            $transactions = $query->paginate($perPage);

            // Formater les transactions pour le frontend
            $formattedTransactions = $transactions->getCollection()->map(function ($transaction) {
                $currency = strtoupper($transaction->currency);
                return [
                    'id' => $transaction->id,
                    'amount' => (float) $transaction->amount, // Envoyer comme nombre pour le frontend
                    'reference' => $transaction->reference,
                    'mouvment' => $transaction->mouvment,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at->toISOString(),
                    'currency' => $currency
                ];
            });

            // Créer la réponse paginée personnalisée
            $responseData = [
                'data' => $formattedTransactions,
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage()
            ];

            // Récupérer le nombre total de transactions avec les mêmes filtres (sans pagination)
            $countQuery = WalletTransaction::where('wallet_id', $userWallet->id);
            
            // Appliquer les mêmes filtres pour le comptage
            if ($request->has('currency') && !empty($request->currency)) {
                $countQuery->where('currency', strtolower($request->currency));
            }
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $countQuery->where(function($q) use ($searchTerm) {
                    $q->where('type', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('status', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('mouvment', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('metadata', $searchTerm);
                });
            }
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $countQuery->where('status', $request->status);
            }
            if ($request->has('type') && !empty($request->type) && $request->type !== 'all') {
                $countQuery->where('type', $request->type);
            }
            if ($request->has('date_from') && !empty($request->date_from)) {
                $countQuery->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && !empty($request->date_to)) {
                $countQuery->whereDate('created_at', '<=', $request->date_to);
            }
            
            $totalCount = $countQuery->count();

            $user = Auth::user();

            return response()->json([
                'success' => true,
                'userWallet' => $userWallet,
                'data' => $responseData,
                'total_count' => $totalCount,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Récupérer le solde du wallet de l'utilisateur connecté
    public function getWalletBalance()
    {
        try {
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            return response()->json([
                'success' => true,
                'balance_usd' => number_format($userWallet->balance_usd, 2) . ' $',
                'balance_cdf' => number_format($userWallet->balance_cdf, 2) . ' FC'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du solde',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfert de fonds entre wallets
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function funds_transfer(Request $request)
    {
        try {
            // Validation différente selon le type de transfert
            if ($request->is_multiple) {
                $request->validate([
                    'recipients' => 'required|array|min:1',
                    'recipients.*.recipient_account_id' => 'required|string',
                    'recipients.*.amount' => 'required|numeric|min:0',
                    'recipients.*.frais_de_transaction' => 'required|numeric|min:0',
                    'recipients.*.frais_de_commission' => 'required|numeric|min:0',
                    'currency' => 'required|in:USD,CDF',
                    'password' => 'required',
                    'description' => 'nullable|string'
                ]);
            } else {
                $request->validate([
                    'recipient_account_id' => 'required',
                    'amount' => 'required|numeric|min:0',
                    'currency' => 'required|in:USD,CDF',
                    'frais_de_transaction' => 'required|numeric',
                    'frais_de_commission' => 'required|numeric',
                    'password' => 'required',
                    'description' => 'nullable|string'
                ]);
            }

            // Vérifier le mot de passe de l'utilisateur
            $user = Auth::user();
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            // Initialiser le service wallet
            $walletService = new \App\Services\WalletService();
            $userWallet = $user->wallet ?? $walletService->createUserWallet($user->id);

            if ($request->is_multiple) {
                // Traitement du transfert multiple
                return $this->processMultipleTransfer($request, $user, $userWallet, $walletService);
            } else {
                // Traitement du transfert simple (logique existante)
                return $this->processSingleTransfer($request, $user, $userWallet, $walletService);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du transfert de fonds', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du transfert de fonds: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Traiter un transfert simple (logique existante)
     */
    private function processSingleTransfer($request, $user, $userWallet, $walletService)
    {
        // Récupérer le destinataire
        $recipient = User::where("account_id", $request->recipient_account_id)->first();
        
        if (!$recipient) {
            return response()->json([
                'success' => false,
                'message' => 'Compte du bénéficiaire non trouvé'
            ], 404);
        }
        
        $recipientWallet = $recipient->wallet ?? $walletService->createUserWallet($recipient->id);

        // Vérifications
        if ($userWallet->id == $recipientWallet->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas transférer des fonds sur votre propre compte'
            ], 400);
        }

        $currency = $request->currency;
        $montant_total = $request->amount + $request->frais_de_transaction + $request->frais_de_commission;
        
        if ($currency === "USD") {
            if ($userWallet->balance_usd < $montant_total) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant'
                ], 400);
            }
        } else {
            if ($userWallet->balance_cdf < $montant_total) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant'
                ], 400);
            }
        }

        // Préparer les métadonnées pour l'expéditeur
        $senderMetadata = [
            "Bénéficiaire" => $recipientWallet->user->name,
            "Opération" => "Transfert des fonds",
            "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Frais de transaction" => number_format($request->frais_de_transaction, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Frais de commission" => number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Description" => $request->description ?? 'Transfert de fonds',
            "Détails" => "Vous avez transféré " . number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC") . " au compte " . $recipientWallet->user->account_id
        ];

        // Préparer les métadonnées pour le destinataire
        $recipientMetadata = [
            "Expéditeur" => $userWallet->user->name,
            "Opération" => "Réception des fonds",
            "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Description" => $request->description ?? 'Transfert de fonds',
            "Détails" => "Vous avez reçu " . number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC") . " du compte " . $userWallet->user->account_id
        ];

        DB::beginTransaction();

        // Gestion des commissions (logique existante)
        $sponsorWallet = null;
        $sponsorName = null;
        $frais_de_commission = 0;
        if ($request->frais_de_commission > 0) {
            // Gestion du parrain avec vérification de l'existence du pack et du parrain
            $firstUserPack = UserPack::where('user_id', $user->id)->first();
            $sponsor = $firstUserPack ? User::find($firstUserPack->sponsor_id) : null;
            
            if ($sponsor && $firstUserPack) {
                $pack = Pack::find($firstUserPack->pack_id);
                $isActivePackSponsor = $sponsor->packs()
                    ->where('pack_id', $pack->id)
                    ->where('user_packs.status', 'active')
                    ->exists();
                
                if ($isActivePackSponsor) {
                    $sponsorWallet = $sponsor->wallet ?? $walletService->createUserWallet($sponsor->id);
                    $sponsorName = $sponsor->name;
                    
                    $sponsorMetadata = [
                        "Source" => $user->name, 
                        "Opération" => "commission de transfert",
                        "Montant" => number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC"),
                        "Description" => "Vous avez gagné une commission de ". number_format($request->frais_de_commission, 2) . 
                                        ($currency === 'USD' ? ' $' : ' FC') . " pour le transfert d'un montant de ". number_format($request->amount, 2) .
                                        ($currency === 'USD' ? ' $' : ' FC') . " par votre filleul " . $user->name,
                    ];

                    if ($sponsorWallet->id !== $recipientWallet->id) {
                        $sponsorWallet->addFunds(
                            $request->frais_de_commission,
                            $currency, 
                            "commission de transfert", 
                            self::STATUS_COMPLETED, 
                            $sponsorMetadata
                        );
                        $frais_de_commission = $request->frais_de_commission;
                    }
                }
            }
        }

        //Récalculer le montant total
        $montant_total = $request->amount + $request->frais_de_transaction + $frais_de_commission;

        // // Effectuer les transactions
        $userWallet->withdrawFunds(
            $montant_total, 
            $currency,
            "transfer", 
            self::STATUS_COMPLETED, 
            $senderMetadata
        );
        
        $recipientWallet->addFunds(
            $request->amount, 
            $currency,
            "reception", 
            self::STATUS_COMPLETED, 
            $recipientMetadata
        );

        // Enregistrer la transaction système
        $systemMetadata = [
            "User_ID" => $user->id,
            "user" => $user->name, 
            "Montant" => number_format($request->amount, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Dévise" => $currency,
            "Frais de transaction" => number_format($request->frais_de_transaction, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Frais de commission" => $sponsorWallet ? 
                "Paiement d'une commission de " . number_format($request->frais_de_commission, 2) . ($currency === 'USD' ? " $" : " FC") . " à " . $sponsorName : 
                "Aucune commission payée pour cause de non activation du pack ou d'inexistance du parrain",
            "Description" => "Transfert de ". number_format($request->amount, 2) . 
                            ($currency === 'USD' ? " $" : " FC") . " par le compte " . $user->account_id . " au compte " . $request->recipient_account_id,
        ];

        $transactionData = [
            'amount' => number_format($request->amount, 2),
            'currency' => $currency,
            'mouvment' => 'out',
            'type' => 'transfer',
            'status' => 'completed',
            'metadata' => $systemMetadata,
        ];

        $walletService = app(\App\Services\WalletService::class);
        $walletService->recordSystemTransaction($transactionData);

        DB::commit();

        // Notifier le destinataire et le parrain
        try {
            // Notification destinataire
            $recipient->notify(new FundsReceivedNotification(
                $request->amount,
                $currency,
                $user->name,
                $user->account_id,
                'transfer'
            ));

            // Notification parrain
            if ($sponsorWallet && $frais_de_commission > 0) {
                $sponsor->notify(new CommissionReceivedNotification(
                    $frais_de_commission,
                    $currency,
                    $user->name,
                    $user->account_id
                ));
            }

            // Notifier l'expéditeur du succès du transfert
            $user->notify(new MultipleTransferStatusNotification(
                true, // Succès
                $request->amount,
                $currency,
                1, // 1 transfert réussi
                0, // 0 transfert échoué
                [] // Aucun transfert échoué
            ));
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'envoi des notifications de transfert simple', [
                'error' => $e->getMessage(),
                'recipient_id' => $recipient->id,
                'sponsor_id' => $sponsor ? $sponsor->id : null
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transfert effectué avec succès',
            'data' => [
                'amount' => $request->amount,
                'currency' => $currency,
                'transaction_id' => uniqid(),
                'recipient' => $recipient->name,
                'fees' => $request->frais_de_transaction + $frais_de_commission
            ]
        ]);
    }

    /**
     * Traiter un transfert multiple
     */
    private function processMultipleTransfer($request, $user, $userWallet, $walletService)
    {
        $currency = $request->currency;
        $totalAmount = $request->total_amount;
        $totalFees = $request->total_fees;
        $grandTotal = $totalAmount + $totalFees;

        // Vérifier le solde
        if ($currency === "USD") {
            if ($userWallet->balance_usd < $grandTotal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant pour tous les transferts'
                ], 400);
            }
        } else {
            if ($userWallet->balance_cdf < $grandTotal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant pour tous les transferts'
                ], 400);
            }
        }

        DB::beginTransaction();

        $successfulTransfers = [];
        $failedTransfers = [];
        $totalCommission = 0;

        $sponsorWallet = null;
        $sponsorName = null;
        $firstUserPack = UserPack::where('user_id', $user->id)->first();
        $sponsor = $firstUserPack ? User::find($firstUserPack->sponsor_id) : null;
        
        if ($sponsor && $firstUserPack) {
            $pack = Pack::find($firstUserPack->pack_id);
            $isActivePackSponsor = $sponsor->packs()
                ->where('pack_id', $pack->id)
                ->where('user_packs.status', 'active')
                ->exists();
            
            if ($isActivePackSponsor) {
                $sponsorWallet = $sponsor->wallet ?? $walletService->createUserWallet($sponsor->id);
                $sponsorName = $sponsor->name;
            }
        }

        // Traiter chaque destinataire
        foreach ($request->recipients as $recipientData) {
            try {
                $recipient = User::where("account_id", $recipientData['recipient_account_id'])->first();
                
                if (!$recipient) {
                    $failedTransfers[] = [
                        'recipient_account_id' => $recipientData['recipient_account_id'],
                        'reason' => 'Compte non trouvé'
                    ];
                    continue;
                }

                $recipientWallet = $recipient->wallet ?? $walletService->createUserWallet($recipient->id);

                // Vérifier que ce n'est pas le même utilisateur
                if ($userWallet->id == $recipientWallet->id) {
                    $failedTransfers[] = [
                        'recipient_account_id' => $recipientData['recipient_account_id'],
                        'reason' => 'Transfert vers son propre compte non autorisé'
                    ];
                    continue;
                }

                $amount = $recipientData['amount'];
                $transactionFee = $recipientData['frais_de_transaction'];
                $commissionFee = $recipientWallet->id !== $sponsorWallet->id ? $recipientData['frais_de_commission'] : 0;
                $recipientTotal = $amount + $transactionFee + $commissionFee;

                // Préparer les métadonnées
                $senderMetadata = [
                    "Bénéficiaire" => $recipientWallet->user->name,
                    "Opération" => "Transfert multiple des fonds",
                    "Montant" => number_format($amount, 2) . ($currency === 'USD' ? " $" : " FC"),
                    "Frais de transaction" => number_format($transactionFee, 2) . ($currency === 'USD' ? " $" : " FC"),
                    "Frais de commission" => number_format($commissionFee, 2) . ($currency === 'USD' ? " $" : " FC"),
                    "Description" => $request->description ?? 'Transfert multiple de fonds',
                    "Détails" => "Vous avez transféré " . number_format($amount, 2) . ($currency === 'USD' ? " $" : " FC") . " au compte " . $recipientWallet->user->account_id . 
                        ($sponsorWallet && $recipientWallet->id == $sponsorWallet->id ? 
                            " (votre parrain - commission incluse dans le transfert)" : 
                            " (Transfert multiple)")
                ];

                $recipientMetadata = [
                    "Expéditeur" => $userWallet->user->name,
                    "Opération" => "Réception des fonds (transfert multiple)",
                    "Montant" => number_format($amount, 2) . ($currency === 'USD' ? " $" : " FC"),
                    "Description" => $request->description ?? 'Transfert multiple de fonds',
                    "Détails" => "Vous avez reçu " . number_format($amount, 2) . ($currency === 'USD' ? " $" : " FC") . " du compte " . $userWallet->user->account_id . 
                        ($sponsorWallet && $recipientWallet->id == $sponsorWallet->id ? 
                            " (votre filleul)" : 
                            " (Transfert multiple)")
                ];

                // Effectuer le transfert
                $userWallet->withdrawFunds(
                    $recipientTotal, 
                    $currency,
                    "transfer", 
                    self::STATUS_COMPLETED, 
                    $senderMetadata
                );
                
                $recipientWallet->addFunds(
                    $amount, 
                    $currency,
                    "reception", 
                    self::STATUS_COMPLETED, 
                    $recipientMetadata
                );

                //Ajouter le total de la commission pour paiement du premier sponsor
                if ($sponsorWallet) {
                    if ($recipientWallet->id == $sponsorWallet->id) {
                        $sponsorWallet = $recipientWallet;
                    }else {
                        $totalCommission += $commissionFee;
                    }
                }

                $successfulTransfers[] = [
                    'recipient_account_id' => $recipientData['recipient_account_id'],
                    'recipient_name' => $recipient->name,
                    'amount' => $amount,
                    'fees' => $transactionFee + $commissionFee,
                    'is_sponsor' => $sponsorWallet && $recipientWallet->id == $sponsorWallet->id,
                    'commission_paid' => $sponsorWallet && $recipientWallet->id == $sponsorWallet->id ? $commissionFee : 0,
                    'total_received' => $sponsorWallet && $recipientWallet->id == $sponsorWallet->id ? $amount + $commissionFee : $amount,
                    'operation_type' => $sponsorWallet && $recipientWallet->id == $sponsorWallet->id ? 'reception_avec_commission' : 'reception'
                ];

            } catch (\Exception $e) {
                $failedTransfers[] = [
                    'recipient_account_id' => $recipientData['recipient_account_id'],
                    'reason' => 'Erreur lors du traitement: ' . $e->getMessage()
                ];
            }
        }

        // Payer les commissions au parrain si applicable
        if ($sponsorWallet && $totalCommission > 0) {
            $sponsorMetadata = [
                "Source" => $user->name, 
                "Opération" => "Commission de transfert",
                "Montant" => number_format($totalCommission, 2) . ($currency === 'USD' ? " $" : " FC"),
                "Description" => "Vous avez gagné une commission de ". number_format($totalCommission, 2) . 
                                ($currency === 'USD' ? ' $' : ' FC') . " pour un transfert de fonds effectué par votre filleul" . $user->name,
            ];
            
            $sponsorWallet->addFunds(
                $totalCommission,
                $currency, 
                "commission de transfert", 
                self::STATUS_COMPLETED, 
                $sponsorMetadata
            );
        }

        // Enregistrer la transaction système
        $systemMetadata = [
            "User_ID" => $user->id,
            "user" => $user->name,
            "Type" => "Transfert multiple",
            "Montant total" => number_format($totalAmount, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Dévise" => $currency,
            "Frais totaux" => number_format($totalFees, 2) . ($currency === 'USD' ? " $" : " FC"),
            "Commission totale" => $sponsorWallet ? 
                "Paiement d'une commission totale de " . number_format($totalCommission, 2) . ($currency === 'USD' ? " $" : " FC") . " à " . $sponsorName : 
                "Aucune commission payée",
            "Nombre de destinataires" => count($successfulTransfers),
            "Transferts réussis" => count($successfulTransfers),
            "Transferts échoués" => count($failedTransfers),
            "Description" => "Transfert multiple de ". number_format($totalAmount, 2) . 
                            ($currency === 'USD' ? " $" : " FC") . " vers " . count($successfulTransfers) . " destinataires",
        ];

        $transactionData = [
            'amount' => number_format($totalAmount, 2),
            'currency' => $currency,
            'mouvment' => 'out',
            'type' => 'transfer',
            'status' => 'completed',
            'metadata' => $systemMetadata,
        ];

        $walletService = app(\App\Services\WalletService::class);
        $walletService->recordSystemTransaction($transactionData);

        DB::commit();

        // Notifier tous les destinataires et le parrain
        try {
            // Notifications destinataires
            foreach ($successfulTransfers as $transfer) {
                $recipient = User::where('account_id', $transfer['recipient_account_id'])->first();
                if ($recipient) {
                    $recipient->notify(new FundsReceivedNotification(
                        $transfer['amount'],
                        $currency,
                        $user->name,
                        $user->account_id,
                        'transfer_multiple'
                    ));
                }
            }

            // Notification parrain
            if ($sponsorWallet && $totalCommission > 0) {
                $sponsor->notify(new CommissionReceivedNotification(
                    $totalCommission,
                    $currency,
                    $user->name,
                    $user->account_id
                ));
            }

            // Notifier l'expéditeur du statut du transfert multiple
            $user->notify(new MultipleTransferStatusNotification(
                count($successfulTransfers) > 0, // Succès si au moins un transfert réussi
                $totalAmount,
                $currency,
                count($successfulTransfers),
                count($failedTransfers),
                $failedTransfers
            ));
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'envoi des notifications de transfert multiple', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'sponsor_id' => $sponsor ? $sponsor->id : null,
                'successful_transfers_count' => count($successfulTransfers)
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($successfulTransfers) > 0 ? 
                'Transferts multiples traités avec succès' : 
                'Aucun transfert n\'a pu être effectué',
            'data' => [
                'successful_transfers' => $successfulTransfers,
                'failed_transfers' => $failedTransfers,
                'total_amount' => $totalAmount,
                'total_fees' => $totalFees,
                'currency' => $currency,
                'commission_paid' => $totalCommission,
                'sponsor_name' => $sponsorName
            ]
        ]);
    }

    /**
     * Récupérer les informations d'un utilisateur par son account_id pour le transfert des fonds wallet-wallet
     */
    public function getRecipientInfo($account_id)
    {
        $recipient = \App\Models\User::where('account_id', $account_id)->first();
        if (!$recipient) {
            return response()->json([
                'success' => false,
                'message' => 'Destinataire introuvable'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'user' => [
                'account_id' => $recipient->account_id,
                'name' => $recipient->name,
                'phone' => $recipient->phone,
                'whatsapp' => $recipient->whatsapp,
                'email' => $recipient->email,
                'address' => $recipient->address,
            ]
        ]);
    }

    /**
     * Récupérer les informations de plusieurs destinataires en une seule requête
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMultipleRecipientsInfo(Request $request)
    {
        $request->validate([
            'account_ids' => 'required|array|min:1|max:20', // Limiter à 20 destinataires pour éviter la surcharge
            'account_ids.*' => 'required|string'
        ]);

        try {
            $recipients = \App\Models\User::whereIn('account_id', $request->account_ids)
                ->select('account_id', 'name', 'phone', 'whatsapp', 'email', 'address')
                ->get()
                ->keyBy('account_id'); // Organiser par account_id pour un accès facile

            $results = [];
            foreach ($request->account_ids as $accountId) {
                if (isset($recipients[$accountId])) {
                    $recipient = $recipients[$accountId];
                    $results[$accountId] = [
                        'success' => true,
                        'user' => [
                            'account_id' => $recipient->account_id,
                            'name' => $recipient->name,
                            'phone' => $recipient->phone,
                            'whatsapp' => $recipient->whatsapp,
                            'email' => $recipient->email,
                            'address' => $recipient->address,
                        ]
                    ];
                } else {
                    $results[$accountId] = [
                        'success' => false,
                        'message' => 'Destinataire introuvable'
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'recipients' => $results
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des informations des destinataires multiples', [
                'error' => $e->getMessage(),
                'account_ids' => $request->account_ids
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des informations des destinataires'
            ], 500);
        }
    }

    /**
     * Récupère le pourcentage de frais de transfert depuis les paramètres du système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSendingFeePercentage()
    {
        $feePercentage = \App\Models\Setting::where('key', 'sending_fee_percentage')->first();
        
        if (!$feePercentage) {
            // Valeur par défaut si le paramètre n'existe pas
            $feePercentage = 0;
        } else {
            $feePercentage = floatval($feePercentage->value);
        }
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage
        ]);
    }
    
    /**
     * Récupère le pourcentage de frais d'achat de virtuel depuis les paramètres du système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPurchaseFeePercentage()
    {
        // Utiliser la fonction calculatePurchaseFee du TransactionFeeApiController
        $transactionFeeController = new \App\Http\Controllers\Api\TransactionFeeApiController();
        $request = new Request(['amount' => 1]); // Montant fictif pour obtenir le pourcentage
        $response = $transactionFeeController->calculatePurchaseFee($request);
        
        // Extraire le pourcentage de la réponse
        $responseData = json_decode($response->getContent(), true);
        $feePercentage = $responseData['percentage'] ?? 0;
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage
        ]);
    }
    
    /**
     * Achat de virtuel via SerdiPay
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function purchaseVirtual(Request $request)
    {
        try {
            $walletService = new \App\Services\WalletService();
            $user = isset($request->user_id) ? User::findOrFail($request->user_id) : Auth::user();
            $userWallet = $user->wallet;

            if (!$userWallet) {
                $userWallet = $walletService->createUserWallet($user->id);
            }

            DB::beginTransaction();

            // Préparer les métadonnées pour la transaction utilisateur
            $metadata = [
                'Méthode de paiement' => $request->payment_method,
                'Téléphone' => $request->phoneNumber,
                'Dévise' => $request->currency,
                'Montant net payé' => number_format($request->amount, 2) . " " . $request->currency,
                'Frais de transaction' => number_format($request->fees, 2) . " " . $request->currency,
                'Description' => 'Achat des virtuels solifin via ' . $request->payment_method
            ];

            // Ajouter les fonds au portefeuille de l'utilisateur
            $userWallet->addFunds(
                $request->amount, 
                $request->currency,
                self::TYPE_VIRTUAL_PURCHASE,
                self::STATUS_COMPLETED,
                array_merge($metadata, [
                    'Opération' => 'Achat des virtuels'
                ])
            );

            $montant_net_avec_frais = $request->amount + $request->fees;

            $walletSystem = WalletSystem::first();
            if (!$walletSystem) {
                $walletSystem = WalletSystem::create([
                    'balance_usd' => 0,
                    'balance_cdf' => 0,
                    'total_in_usd' => 0,
                    'total_in_cdf' => 0,
                    'total_out_usd' => 0,
                    'total_out_cdf' => 0,
                ]);
            }

            $walletSystem->addFunds(
                $montant_net_avec_frais,
                $request->currency,
                self::TYPE_VIRTUAL_SALE,
                self::STATUS_COMPLETED,
                array_merge($metadata, [
                    'Opération' => 'Vente des virtuels',
                    'User_ID' => $user->id,
                    'user' => $user->name,
                    'Id Compte' => $user->account_id,
                    'Montant_net' => number_format($request->amount, 2) . " " . $request->currency,
                    'Frais de transaction' => number_format($request->fees, 2) . " " . $request->currency,
                ])
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Achat de virtuel effectué avec succès',
                'amount' => $request->amount,
                'new_balance' => $request->currency === 'USD' ? number_format($userWallet->balance_usd, 2) . ' $' : number_format($userWallet->balance_cdf, 2) . ' FC'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'achat de virtuel: ' . $e->getMessage(), [
                'user_id' => $request->user_id ?? Auth::id(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement de votre achat'
            ], 500);
        }
    }

    /**
     * Exporter les transactions du wallet utilisateur en Excel
     */
    public function exportTransactions(Request $request)
    {
        try {
            $user = Auth::user();
            $walletservice = new \App\Services\WalletService();
            
            // Récupérer le wallet de l'utilisateur connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            $userWallet ?? $userWallet = $walletservice->createUserWallet(Auth::id());

            // Construire la requête de base pour les transactions
            $query = WalletTransaction::with('wallet')
                ->where('wallet_id', $userWallet->id)
                ->orderBy('created_at', 'desc');

            // Filtrer par devise si spécifié
            if ($request->has('currency') && in_array($request->currency, ['USD', 'CDF'])) {
                $query->where('currency', $request->currency);
            }

            // Appliquer les filtres de recherche
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('type', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('status', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('mouvment', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('reference', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('metadata', $searchTerm);
                });
            }

            // Filtrer par statut
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filtrer par type
            if ($request->has('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            // Filtrer par plage de dates
            if ($request->has('date_from') && !empty($request->date_from)) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && !empty($request->date_to)) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Récupérer toutes les transactions pour l'export
            $transactions = $query->get();

            // Préparer les données pour l'export
            $exportData = [];
            foreach ($transactions as $transaction) {
                // Vérifier si metadata est déjà un array ou une string JSON
                $metadata = $transaction->metadata;
                if (is_string($metadata)) {
                    $metadata = json_decode($metadata, true) ?? [];
                } elseif (!is_array($metadata)) {
                    $metadata = [];
                }
                
                $exportData[] = [
                    'Référence' => $transaction->reference ?? '',
                    'Type' => $this->getTransactionTypeLabel($transaction->type),
                    'Mouvement' => $transaction->mouvment === 'in' ? 'Entrée' : 'Sortie',
                    'Montant' => number_format($transaction->amount, 2) . ' ' . $transaction->currency,
                    'Statut' => $this->getTransactionStatusLabel($transaction->status),
                    'Date' => \Carbon\Carbon::parse($transaction->created_at)->format('d/m/Y H:i:s'),
                    'Méthode de paiement' => $metadata['Méthode de paiement'] ?? '-',
                    'Description' => $metadata['Description'] ?? '-',
                    'Opération' => $metadata['Opération'] ?? '-',
                ];
            }

            // Créer le fichier CSV
            $filename = 'transactions_wallet_' . $user->name . '_' . date('Y-m-d_H-i-s') . '.csv';
            
            // Headers pour le CSV
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
                'Pragma' => 'public',
            ];

            $callback = function () use ($exportData) {
                $file = fopen('php://output', 'w');
                
                // Ajouter le BOM pour l'encodage UTF-8 (Excel le reconnaîtra correctement)
                fwrite($file, "\xEF\xBB\xBF");
                
                // En-têtes
                if (!empty($exportData)) {
                    fputcsv($file, array_keys($exportData[0]), ';');
                }
                
                // Données
                foreach ($exportData as $row) {
                    // Assurer que toutes les valeurs sont des strings pour éviter les erreurs
                    $row = array_map(function($value) {
                        return is_string($value) ? $value : (string) $value;
                    }, $row);
                    fputcsv($file, $row, ';');
                }
                
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'export des transactions: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'export des transactions'
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du type de transaction
     */
    private function getTransactionTypeLabel($type)
    {
        $labels = [
            'withdrawal' => 'Retrait',
            'purchase' => 'Achat',
            'virtual_purchase' => 'Virtuels',
            'reception' => 'Réception des fonds',
            'transfer' => 'Transfert des fonds',
            'remboursement' => 'Remboursement',
            'digital_product_sale' => 'Vente de produit numérique',
            'commission de parrainage' => 'Commission de parrainage',
            'commission de transfert' => 'Commission de transfert',
            'commission de retrait' => 'Commission de retrait',
            'virtual_sale' => 'Vente des virtuels',
        ];

        return $labels[$type] ?? $type;
    }

    /**
     * Obtenir le libellé du statut de transaction
     */
    private function getTransactionStatusLabel($status)
    {
        $labels = [
            'pending' => 'En attente',
            'completed' => 'Complété',
            'failed' => 'Échoué',
        ];

        return $labels[$status] ?? $status;
    }
} 