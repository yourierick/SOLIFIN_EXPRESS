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

    /**
     * Récupère le pourcentage des frais
     *
     * @param string $key clé de la configuration
     * @return float pourcentage des frais
     */
    private function getFees($key)
    {
        // Récupérer le pourcentage des frais
        $fee_percent = Setting::getValue($key, 0);
        
        return $fee_percent;
    }

    // Récupérer les données du wallet de l'utilisateur connecté
    public function getWalletData(Request $request)
    {
        try {
            $walletservice = new \App\Services\WalletService();
            // Récupérer le wallet de l'utilisateur connecté
            $userWallet = Wallet::where('user_id', Auth::id())->first();
            $userWallet ?? $userWallet = $walletservice->createUserWallet(Auth::id());

            // Construire la requête de base pour les transactions
            $query = WalletTransaction::with('wallet')
                ->where('wallet_id', $userWallet->id)
                ->orderBy('id', 'desc');

            // Filtrer par recherche (recherche dans les métadonnées)
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('reference', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('metadata', $searchTerm);
                });
            }

            // Filtrer par statut si spécifié
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filtrer par nature
            $nature = $request->get('nature', 'internal');
            if ($nature) {
                $query->where('nature', $nature);
            }

            // Filtrer par mouvement si spécifié
            if ($request->has('flow') && !empty($request->flow) && $request->flow !== 'all') {
                $query->where('flow', $request->flow);
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
                return [
                    'id' => $transaction->id,
                    'amount' => (float) $transaction->amount, // Envoyer comme nombre pour le frontend
                    'reference' => $transaction->reference,
                    'flow' => $transaction->flow,
                    'type' => $transaction->type,
                    'fee_amount' => $transaction->fee_amount,
                    'commission_amount' => $transaction->commission_amount,
                    'balance_before' => $transaction->balance_before,
                    'balance_after' => $transaction->balance_after,
                    'description' => $transaction->description,
                    'rejection_reason' => $transaction->rejection_reason,
                    'processor' => $transaction->processor?->name,
                    'processed_at' => $transaction->processed_at?->toISOString(),
                    'status' => $transaction->status,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at?->toISOString(),
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

            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $countQuery->where(function($q) use ($searchTerm) {
                    $q->where('reference', 'LIKE', "%{$searchTerm}%")
                      ->orWhereJsonContains('metadata', $searchTerm);
                });
            }
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $countQuery->where('status', $request->status);
            }

            // Filtrer par mouvement si spécifié
            if ($request->has('flow') && !empty($request->flow) && $request->flow !== 'all') {
                $countQuery->where('flow', $request->flow);
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

            $totalIn = $query->where('flow', 'in')->sum('amount');
            $totalOut = $query->where('flow', 'out')->sum('amount');
            $totalOut = WalletTransaction::where('wallet_id', $userWallet->id)->where('nature', 'internal')->where('flow', 'out')->where('status', 'completed')->sum('amount');
            $wallet = $userWallet ? [
                'balance' => number_format($userWallet->balance, 2),
                'available_balance' => number_format($userWallet->available_balance, 2),
                'frozen_balance' => number_format($userWallet->frozen_balance, 2),
                'total_in' => number_format($totalIn, 2),
                'total_out' => number_format($totalOut, 2),
                'points' => $userWallet->points,
                'is_active' => $userWallet->is_active,
            ] : null;

            $user = Auth::user();

            return response()->json([
                'success' => true,
                'userWallet' => $wallet,
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
                'balance' => number_format($userWallet->balance, 2),
                'available_balance' => number_format($userWallet->available_balance, 2),
                'frozen_balance' => number_format($userWallet->available_balance, 2),
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
                    'password' => 'required',
                    'description' => 'nullable|string'
                ]);
            } else {
                $request->validate([
                    'recipient_account_id' => 'required',
                    'amount' => 'required|numeric|min:0',
                    'frais_de_transaction' => 'required|numeric',
                    'frais_de_commission' => 'required|numeric',
                    'password' => 'required',
                    'description' => 'nullable|string'
                ]);
            }

            // Vérifier si les transferts de fonds sont activés dans les paramètres
            $fundsTransferActivation = \App\Models\Setting::where('key', 'funds_transfer_activation')->first();
            if (!$fundsTransferActivation || $fundsTransferActivation->value !== 'oui') {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas effectuer de transfert de fonds pour le moment'
                ]);
            }

            // Vérifier le mot de passe de l'utilisateur
            $user = Auth::user();

            //Si le portefeuille de l'utilisateur est désactivé, retourner la réponse correspondante
            if (!$user->wallet->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre portefeuille a été désactivé, veuillez contacter le service support pour sa réactivation',
                ]);
            }
            
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
        try {
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
            
            $pourcentage_frais_de_transaction = $this->getFees('transfer_fee_percentage');
            $pourcentage_frais_de_commission = $this->getFees('transfer_commission');

            $frais_de_transaction_recalculate = $request->amount * ($pourcentage_frais_de_transaction / 100);
            $frais_de_commission_recalculate = $request->amount * ($pourcentage_frais_de_commission / 100);

            $montant_total = $request->amount + $frais_de_transaction_recalculate + $frais_de_commission_recalculate;
            
            if ($userWallet->available_balance < $montant_total) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant'
                ], 400);
            }

            DB::beginTransaction();

            // Gestion des commissions (logique existante)
            $sponsor = null;
            $frais_de_commission = 0;
            if ($frais_de_commission_recalculate > 0) {
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
                        if ($sponsor?->wallet?->id !== $recipientWallet->id) {
                            $frais_de_commission = $frais_de_commission_recalculate;
                        }
                    }
                }
            }

            // Préparer les métadonnées pour l'expéditeur
            $senderMetadata = [
                "Bénéficiaire" => $recipient->name,
                "Opération" => "Transfert des fonds",
                "Montant" => number_format($request->amount, 2) . "$",
                "Frais de transaction" => number_format($frais_de_transaction_recalculate, 2) . "$",
                "Frais de commission" => number_format($frais_de_commission, 2) . "$",
                "Déscription" => "Vous avez effectué un transfert des fonds de " . number_format($request->amount, 2) . "$ à " . $recipient->name,
            ];

            //Récalculer le montant total
            $montant_total = $request->amount + $frais_de_transaction_recalculate + $frais_de_commission;

            // Effectuer les transactions
            //Débit de l'expéditeur
            $transaction = $userWallet->withdrawFunds(
                $montant_total, 
                $frais_de_transaction_recalculate,
                $frais_de_commission,
                "internal",
                "funds_transfer", 
                self::STATUS_COMPLETED,
                "Vous avez effectué un transfert des fonds de " . $request->amount . "$ à " . $recipient->name,
                $user->id, 
                $senderMetadata
            );

            //Crédit du destinataire
            // Préparer les métadonnées pour le destinataire
            $recipientMetadata = [
                "Opération" => "Dépôt des fonds",
                "Expéditeur" => $user->name . ' / ' . $user->account_id,
                "Montant" => number_format($request->amount, 2) . " $",
                "Transaction source" => $transaction->reference,
                "Déscription" => "Vous avez reçu un dépôt des fonds de " . number_format($request->amount, 2) . "$ de " . $user->name
            ];
            
            $recipientWallet->addFunds(
                $request->amount, 
                0,
                0,
                "funds_receipt", 
                self::STATUS_COMPLETED, 
                "Vous avez reçu un dépôt des fonds de " . $request->amount . " $ de " . $user->name,
                $user->id,
                $recipientMetadata
            );

            //Payer la commission au parrain
            if ($frais_de_commission) {
                $sponsorMetadata = [ 
                    "Opération" => "Commission de transfert",
                    "Source" => $user->name,
                    "Montant" => number_format($frais_de_commission, 2) . " $",
                    "Transaction source" => $transaction->reference,
                    "Déscription" => "Vous avez reçu une commission de " . number_format($frais_de_commission, 2) . " $ sur le transfert effectué par votre filleul " . $user->name,
                    "Traité par" => $user->id,
                    "Traité le" => now(),
                ];
                $sponsor?->wallet?->addFunds(
                    $frais_de_commission,
                    0,
                    0,
                    "transfer_commission", 
                    self::STATUS_COMPLETED, 
                    "Vous avez reçu une commission de " . number_format($frais_de_commission, 2) . " $ sur le transfert effectué par votre filleul " . $user->name,
                    $user->id,
                    $sponsorMetadata
                );
            }

            // Enregistrer la commission système
            $systemMetadata = [
                "Opération" => "Commission solifin sur le transfert",
                "Emetteur" => $user->name . ' / ' . $user->account_id,
                "Bénéficiaire" => $recipient->name . ' / ' . $recipient->account_id, 
                "Montant net transféré" => number_format($request->amount, 2) . "$",
                "Transaction source" => "Transaction utilisateur - " . $transaction->reference,
                "Déscription" => "Vous avez reçu une commission de " . number_format($frais_de_transaction_recalculate, 2) . " $ sur le transfert 
                effectué par " . $user->name . " à " . $recipient->name . " d'un montant de " . $request->amount . " $", 
            ];

            $systemwallet = WalletSystem::first();
            $systemwallet->addProfits(
                $frais_de_transaction_recalculate,
                'transfer_commission',
                self::STATUS_COMPLETED,
                "Vous avez reçu une commission de transfert d'un montant de " . $frais_de_transaction_recalculate . " $",
                $user->id,
                $systemMetadata,
            );

            DB::commit();

            // Notifier le destinataire et le parrain

            // Notification destinataire
            $recipient->notify(new FundsReceivedNotification(
                $request->amount,
                $user->name,
                $user->account_id,
            ));

            // Notification parrain
            if ($sponsor?->wallet && $frais_de_commission > 0) {
                $sponsor->notify(new CommissionReceivedNotification(
                    $frais_de_commission,
                    $user->name,
                    $user->account_id
                ));
            }

            // Notifier l'expéditeur du succès du transfert
            $user->notify(new MultipleTransferStatusNotification(
                true, // Succès
                $request->amount,
                1, // 1 transfert réussi
                0, // 0 transfert échoué
                [] // Aucun transfert échoué
            )); 

            return response()->json([
                'success' => true,
                'message' => 'Transfert effectué avec succès',
                'data' => [
                    'amount' => $request->amount,
                    'transaction_id' => uniqid(),
                    'recipient' => $recipient->name,
                    'fees' => $frais_de_transaction_recalculate + $frais_de_commission
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Erreur lors du transfert', [
                'error' => $e->getMessage(),
                'recipient_id' => $recipient ? $recipient->id : null,
                'sponsor_id' => $sponsor ? $sponsor->id : null
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du transfert'
            ], 500);
        }
    }

    /**
     * Traiter un transfert multiple
     */
    private function processMultipleTransfer($request, $user, $userWallet, $walletService)
    {
        try {
            $totalAmount = $request->total_amount;
            $totalAmountSucceed = 0; // pour stocker le montant total des transferts réussis
            $totalFees = $request->total_fees;
            $grandTotal = $totalAmount + $totalFees;

            // Vérifier le solde
            if ($userWallet->available_balance < $grandTotal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant pour tous les transferts'
                ], 400);
            }

            DB::beginTransaction();

            $successfulTransfers = [];
            $failedTransfers = [];
            $totalCommission = 0;
            $totalCommissionSystem = 0; //Total des frais des transferts réussis.

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

            $transactions_sources_references = [];

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
                    $commissionFee = $sponsorWallet && $recipientWallet->id !== $sponsorWallet->id ? $recipientData['frais_de_commission'] : 0;
                    $recipientTotal = $amount + $transactionFee + $commissionFee;

                    // Préparer les métadonnées
                    $senderMetadata = [
                        "Bénéficiaire" => $recipient->name,
                        "Opération" => "Transfert des fonds",
                        "Montant" => number_format($amount, 2) . " $",
                        "Frais de transaction" => number_format($transactionFee, 2) . " $",
                        "Frais de commission" => number_format($commissionFee, 2) . " $",
                        "Déscription" => "Vous avez effectué un transfert des fonds de " . number_format($amount, 2) . " $ au compte " . $recipient->name . ' / ' . $recipient->account_id
                    ];

                    // Effectuer le transfert
                    $transaction = $userWallet->withdrawFunds(
                        $recipientTotal,
                        $transactionFee,
                        $commissionFee,
                        'internal', 
                        "funds_transfer", 
                        self::STATUS_COMPLETED, 
                        "Vous avez fait un transfert des fonds de " . number_format($amount, 2) . " $" . " au compte " . $recipient->account_id,
                        $user->id,
                        $senderMetadata
                    );
                    
                    $recipientMetadata = [
                        "Opération" => "Dépôt des fonds",
                        "Expéditeur" => $user->name . ' / ' . $user->account_id,
                        "Montant" => number_format($amount, 2) . " $",
                        "Transaction source" => $transaction->reference,
                        "Déscription" => "Vous avez reçu un dépôt des fonds de " . number_format($amount, 2) . " $" . " du compte " . $user->name . ' / ' . $user->account_id,
                    ];

                    $recipientWallet->addFunds(
                        $amount, 
                        0,
                        0,
                        "funds_receipt", 
                        self::STATUS_COMPLETED, 
                        "Vous avez reçu un dépôt des fonds de " . number_format($amount, 2) . " $" . " du compte " . $user->name . ' / ' . $user->account_id,
                        $user->id,
                        $recipientMetadata
                    );

                    //Ajouter le total de la commission pour paiement du premier sponsor
                    if ($sponsorWallet) {
                        if ($recipientWallet->id !== $sponsorWallet->id) {
                            $totalCommission += $commissionFee;
                        }
                    }

                    $totalCommissionSystem += $transactionFee;
                    $totalAmountSucceed += $amount;
                    $transactions_sources_references[] = $transaction->reference;

                    $successfulTransfers[] = [
                        'recipient_account_id' => $recipientData['recipient_account_id'],
                        'recipient_name' => $recipient->name,
                        'amount' => $amount,
                        'fees' => $transactionFee,
                        'commission' => $commissionFee,
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
                    "Opération" => "Commission de transfert",
                    "Source" => $user->name . ' / ' . $user->account_id, 
                    "Montant" => number_format($totalCommission, 2) . " $",
                    "Transaction source" => implode(',', $transactions_sources_references),
                    "Description" => "Vous avez gagné une commission de ". number_format($totalCommission, 2) . 
                                    " $" . " pour des transferts de fonds effectué par votre filleul" . $user->name,
                ];
                
                $sponsorWallet->addFunds(
                    $totalCommission,
                    0,
                    0,
                    "transfer_commission", 
                    self::STATUS_COMPLETED, 
                    "Vous avez gagné une commission de ". number_format($totalCommission, 2) . 
                                    " $" . " pour des transferts de fonds effectué par votre filleul" . $user->name,
                    $user->id,
                    $sponsorMetadata,
                    
                );
            }

            // Enregistrer la transaction système
            $systemMetadata = [
                "Opération" => "Transfert multiple des fonds",
                "Expéditeur" => $user->name . ' / ' . $user->account_id,
                "Nombre de destinataires" => count($successfulTransfers),
                "Transaction sources" => "Transactions utilisateurs : " . implode(',', $transactions_sources_references),
                "Transferts réussis" => count($successfulTransfers),
                "Transferts échoués" => count($failedTransfers),
                "Montant total du transfert" => number_format($totalAmount, 2) . " $",
                "Montant total transferé" => number_format($totalAmountSucceed, 2) . " $",
                "Montant total echoué" => number_format($totalAmount - $totalAmountSucceed, 2) . " $",
                "Frais totaux sur les transferts réussis" => number_format($totalCommissionSystem, 2) . " $",
                "Commission totale du premier parrain" => $sponsorWallet ? 
                    "Paiement d'une commission totale de " . number_format($totalCommission, 2) . " $" . " à " . $sponsorName . ' / ' . $sponsor->account_id : 
                    "Aucune commission payée",
                "Déscription" => "Transfert multiple de fonds d'un montant de ". number_format($totalAmount, 2) . 
                                " $" . " vers " . count($request->recipients) . " destinataires",
            ];

            $walletsystem = WalletSystem::first();
            $walletsystem->addProfits(
                $totalCommissionSystem,
                "transfer_commission",
                self::STATUS_COMPLETED,
                "Commission reçu d'un montant de " . number_format($totalCommissionSystem, 2) . 
                                " $" . " pour des transferts de fonds effectué par " . $user->name,
                $user->id,
                $systemMetadata
            );

            DB::commit();

            // Notifier tous les destinataires et le parrain
            try {
                // Notifications destinataires
                foreach ($successfulTransfers as $transfer) {
                    $recipient = User::where('account_id', $transfer['recipient_account_id'])->first();
                    if ($recipient) {
                        $recipient->notify(new FundsReceivedNotification(
                            $transfer['amount'],
                            $user->name,
                            $user->account_id,
                        ));
                    }
                }

                // Notification parrain
                if ($sponsorWallet && $totalCommission > 0) {
                    $sponsor->notify(new CommissionReceivedNotification(
                        $totalCommission,
                        $user->name,
                        $user->account_id
                    ));
                }

                // Notifier l'expéditeur du statut du transfert multiple
                $user->notify(new MultipleTransferStatusNotification(
                    count($successfulTransfers) > 0, // Succès si au moins un transfert réussi
                    $totalAmount,
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
                    'commission_paid' => $totalCommission,
                    'sponsor_name' => $sponsorName
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du transfert des fonds', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du transfert des fonds'
            ], 500);
        }
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
            $user = isset($request->user_id) ? User::findOrFail($request->user_id): null;
            if (!$user) {
                \Log::error("L'utilisateur est introuvable pour effectuer l'achat des virtuels");
                return response()->json([
                    'success' => false,
                    'message' => 'L\'utilisateur est introuvable pour effectuer l\'achat des virtuels',
                ]);
            }
            $userWallet = $user->wallet;
            $walletsystem = WalletSystem::first();

            if (!$userWallet) {
                $userWallet = $walletService->createUserWallet($user->id);
            }

            DB::beginTransaction();

            // Préparer les métadonnées pour la transaction utilisateur
            $metadata_system = [
                'Méthode de paiement' => $request->payment_method,
                'Téléphone' => $request->phoneNumber,
                'Montant net payé' => number_format($request->amount, 2) . " $",
                'Frais de transaction' => number_format($request->fees, 2) . " $",
                'Description' => 'Vente des virtuels solifin via ' . $request->payment_method
            ];

            $montant_net_avec_frais = $request->amount + $request->fees;

            //Ajouter les fonds comme entrée au wallet system
            $walletSystem->addFunds(
                $montant_net_avec_frais, 
                self::TYPE_VIRTUAL_SALE,
                "completed",
                "Vous avez vendu des virtuels pour un montant net de " . number_format($request->amount, 2) . ' $ au compte ' . $user->account_id,
                $user->id,
                $metadata_system
            );

            //Ajouter les fonds net aux dettes utilisateur
            $transaction = $walletSystem->addEngagements(
                $request->amount, 
                'virtual_send', //Envoie des virtuels à l'utilisateur
                'completed',
                'Vous avez envoyé des virtuels d\'un montant de ' . number_format($request->amount, 2) . '$  Solifin au compte ' . $user->account_id,
                $user->id,
                $metadata_system
            );

            // Préparer les métadonnées pour la transaction utilisateur
            $metadata_user = [
                'Méthode de paiement' => $request->payment_method,
                'Téléphone' => $request->phoneNumber,
                'Montant net payé' => number_format($request->amount, 2) . " $",
                'Transaction source' => "Transaction système - ". $transaction->reference,
                'Frais de transaction' => number_format($request->fees, 2) . " $",
                'Description' => 'Achat des virtuels solifin via ' . $request->payment_method
            ];

            //Ajouter les fonds virtuels à l'utilisateur les ayant acheté
            $userWallet->addFunds(
                $request->amount,
                $request->fees,
                0,
                'virtual_receipt',
                'completed',
                'Vous avez reçu des virtuels d\'un montant de ' . number_format($request->amount, 2) . '$ dans votre portefeuille SOLIFIN',
                $user->id,
                $metadata_user
            );

            $user->wallet->transactions()->where('session_id', $request->session_id)->where('transaction_id', $request->transaction_id)->update([
                'status' => 'completed',
                'description' => $description_user,
                'metadata' => $metadata_user,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Achat de virtuel effectué avec succès',
                'amount' => $request->amount,
                'new_balance' => number_format($userWallet->balance, 2) . ' $'
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
                ->orderBy('id', 'desc');

            // Appliquer les filtres de recherche
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('reference', 'LIKE', "%{$searchTerm}%")
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
                    'Mouvement' => $transaction->flow === 'in' ? 'Entrée' : ($transaction->flow === 'out' ? 'Sortie' : ($transaction->flow === 'freeze' ? 'Blocage' : 'Déblocage')),
                    'Montant' => number_format($transaction->amount, 2) . ' $',
                    'Frais' => number_format($transaction->fee_amount, 2) . ' $',
                    'Commission' => number_format($transaction->commission_amount, 2) . ' $',
                    'Balance avant' => number_format($transaction->balance_before, 2) . ' $',
                    'Balance après' => number_format($transaction->balance_after, 2) . ' $',
                    'Traité par' => $transaction->processor?->name,
                    'Raison (rejet, echec, ...)' => $transaction->rejection_reason ?? '-',
                    'Déscription' => $transaction->description ?? '-',
                    'Statut' => $this->getTransactionStatusLabel($transaction->status),
                    'Date' => \Carbon\Carbon::parse($transaction->created_at)->format('d/m/Y H:i:s'),
                    'Metadata' => $metadata ?? '-',
                ];
            }

            // Créer le fichier CSV
            $filename = 'transactions_portefeuille_' . $user->name . '_' . date('Y-m-d_H-i-s') . '.csv';
            
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
                        if (is_array($value)) {
                            // Convertir les tableaux (métadonnées) en JSON string
                            return json_encode($value, JSON_UNESCAPED_UNICODE);
                        } elseif (is_null($value)) {
                            return '';
                        } elseif (is_bool($value)) {
                            return $value ? 'Oui' : 'Non';
                        } else {
                            return is_string($value) ? $value : (string) $value;
                        }
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
            'funds_withdrawal' => 'Retrait',
            'pack_purchase' => 'Achat de pack',
            'virtual_purchase' => 'Virtuels',
            'funds_receipt' => 'Réception des fonds',
            'funds_transfer' => 'Transfert des fonds',
            'unfreeze_funds' => 'Déblocage des fonds',
            'freeze_funds' => 'Blocage des fonds',
            'virtual_receipt' => 'Réception des fonds',
            'digital_product_sale' => 'Vente de produit numérique',
            'sponsorship_commission' => 'Commission de parrainage',
            'transfer_commission' => 'Commission de transfert',
            'withdrawal_commission' => 'Commission de retrait',
            'virtual_sale' => 'Vente des virtuels',
            'boost_sale' => 'Vente de boost',
            'boost_purchase' => 'Achat de boost',
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
            'reversed' => 'Annulé',
            'processing' => 'En cours de traitement'
        ];

        return $labels[$status] ?? $status;
    }
} 