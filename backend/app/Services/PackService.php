<?php

namespace App\Services;

use App\Models\Pack;
use App\Models\User;
use App\Models\UserPack;
use App\Services\RegistrationService;
use App\Models\WalletSystem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PackService
{
    protected $codeGenerationService;
    protected $walletService;
    protected $commissionService;

    public function __construct()
    {
        $this->codeGenerationService = new CodeGenerationService();
        $this->walletService = new WalletService();
        $this->commissionService = new CommissionService();
    }

    /**
     * Renouvelle un pack existant pour un utilisateur
     *
     * @param User $user
     * @param UserPack $userPack
     * @param Pack $pack
     * @param array $paymentData
     * @param int $durationMonths
     * @return UserPack
     */
    public function renewPack(User $user, UserPack $userPack, Pack $pack, array $paymentData, int $durationMonths)
    {
        // Traiter le paiement selon la méthode
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->processWalletPayment($user, $pack, $paymentData);
        } else {
            $this->recordExternalPayment($user, $pack, $paymentData);
        }

        // Mettre à jour la date d'expiration du pack
        $userPack->expiry_date = Carbon::now()->addMonths($durationMonths);
        $userPack->status = 'active';
        $userPack->payment_status = 'completed';
        $userPack->save();

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $paymentData['amount'], $durationMonths);

        $metadata = [ 
            "type" => $paymentData['payment_type'],
            "method" => $paymentData['payment_method'], 
            "details" => $paymentData['payment_details'] ?? [],
            "amount" => $paymentData['amount'],
            "fees" => $paymentData['fees'],
        ];

        \Log::info($metadata);
        // Envoyer la notification d'achat de pack
        $user->notify(new \App\Notifications\PackPurchased($userPack, $durationMonths, $metadata));

        return $userPack->fresh(['pack', 'sponsor']);
    }

    /**
     * Achète un nouveau pack pour un utilisateur
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param int $durationMonths
     * @param string|null $referralCode
     * @return UserPack
     */
    public function purchaseNewPack(User $user, Pack $pack, array $paymentData, int $durationMonths, ?string $referralCode = null)
    {
        // Trouver le parrain si un code de parrainage est fourni
        $sponsorId = null;
        if ($referralCode) {
            $sponsorPack = UserPack::where('referral_code', $referralCode)->first();
            $sponsorId = $sponsorPack->user_id ?? null;
        }

        // Générer un code de parrainage unique
        $referralData = $this->codeGenerationService->generatePackReferralCode($pack->name);

        // Traiter le paiement selon la méthode
        if ($paymentData['payment_method'] === 'solifin-wallet') {
            $this->processWalletPayment($user, $pack, $paymentData);
        } else {
            $this->recordExternalPayment($user, $pack, $paymentData);
        }

        // Créer l'association utilisateur-pack
        $userPack = $this->createUserPack($user, $pack, $durationMonths, $referralData, $sponsorId);

        //Si l'utilisateur avait un compte en essai, l'activer maintenant
        if ($user->status === RegistrationService::STATUS_TRIAL) {
            $user->status = RegistrationService::STATUS_ACTIVE;
            $user->save();
        }

        // Distribuer les commissions
        $this->commissionService->distributeCommissions($userPack, $paymentData['amount'], $durationMonths);

        $metadata = [ 
            "type" => $paymentData['payment_type'],
            "method" => $paymentData['payment_method'], 
            "details" => $paymentData['payment_details'] ?? [],
            "amount" => $paymentData['amount'],
            "fees" => $paymentData['fees'],
        ];
        // Envoyer la notification d'achat de pack
        $user->notify(new \App\Notifications\PackPurchased($userPack, $durationMonths, $metadata));

        return $userPack;
    }

    /**
     * Traite un paiement via le wallet Solifin
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param string $operationType
     * @return void
     */
    private function processWalletPayment(User $user, Pack $pack, array $paymentData)
    {
        $userWallet = $user->wallet;
        $walletsystem = WalletSystem::first();
        
        $description_user = "Vous avez acheté un abonnement pour le pack " . $pack->name . " via " . $paymentData['payment_method'] . "";
        $description_system = "Vous avez vendu un abonnement pour le pack " . $pack->name . " via " . $paymentData['payment_method'] . "";
        
        $metadata_user = [
            "Opération" => "Souscription au pack",
            "Pack_ID" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Montant net payé" => $paymentData['amount'] . '$',
            "Frais de transaction" => $paymentData['fees'] . '$',
            "Déscription" => $description_user
        ];

        $metadata_system = [
            "Opération" => "Souscription au pack",
            "Pack_ID" => $pack->id, 
            "Nom du pack" => $pack->name, 
            "Durée de souscription" => $paymentData['duration_months'] . " mois", 
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Montant net payé" => $paymentData['amount'] . '$',
            "Frais de transaction" => $paymentData['fees'] . '$',
            "Déscription" => $description_system
        ];

        //Montant total payé à débiter du wallet de l'acheteur
        $totalAmount = $paymentData['amount'] + $paymentData['fees'];

        $userWallet->withdrawFunds($totalAmount, $paymentData['fees'], 0, "internal", "pack_purchase", "completed", $description_user, auth()->id(), $metadata_user);
        $walletsystem->addProfits($totalAmount, 'pack_sale', 'completed', $description_system, auth()->id(), $metadata_system);
    }

    /**
     * Enregistre un paiement externe (non-wallet)
     *
     * @param User $user
     * @param Pack $pack
     * @param array $paymentData
     * @param string $operationType
     * @return void
     */
    private function recordExternalPayment(User $user, Pack $pack, array $paymentData, string $operationType)
    {
        $wallet = $user->wallet;
        $walletsystem = WalletSystem::first();
        $description_user = "Vous avez acheté un abonnement pour le pack " . $pack->name . " via " . $paymentData['payment_method'] . "";
        $description_system = "Vous avez vendu un abonnement pour le pack " . $pack->name . " via " . $paymentData['payment_method'] . "";

        $metadata_user = [
            "Opération" => "Souscription au pack",
            "Pack_ID" => $pack->id,
            "Nom du pack" => $pack->name,
            "Durée de souscription" => $paymentData['duration_months'] . " mois",
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Montant net payé" => $paymentData['amount'] . " $",
            "Description" => $description_user
        ];

        $metadata_system = [
            "Opération" => "Souscription au pack",
            "Pack_ID" => $pack->id,
            "Nom du pack" => $pack->name,
            "Durée de souscription" => $paymentData['duration_months'] . " mois",
            "Type de paiement" => $paymentData['payment_type'],
            "Méthode de paiement" => $paymentData['payment_method'],
            "Détails de paiement" => $paymentData['payment_details'] ?? [],
            "Montant net payé" => $paymentData['amount'] . " $",
            "Description" => $description_system
        ];

        //Montant total payé (montant + frais)
        $totalAmount = $paymentData['amount'] + $paymentData['fees'];

        $walletSystem->addFunds(
            $totalAmount, 
            "pack_sale",
            "completed",
            $description_system,
            $user->id,
            $metadata_system
        );

        $user->wallet->transactions()->where('session_id', $paymentData['session_id'])->where('transaction_id', $paymentData['transaction_id'])->update([
            'status' => 'completed',
            'description' => $description_user,
            'metadata' => $metadata_user,
        ]);
    }

    /**
     * Crée une association utilisateur-pack
     *
     * @param User $user
     * @param Pack $pack
     * @param int $durationMonths
     * @param array $referralData
     * @param int|null $sponsorId
     * @return UserPack
     */
    private function createUserPack(User $user, Pack $pack, int $durationMonths, array $referralData, ?int $sponsorId = null)
    {
        $userPack = $user->packs()->attach($pack->id, [
            'status' => 'active',
            'purchase_date' => now(),
            'expiry_date' => now()->addMonths($durationMonths),
            'is_admin_pack' => false,
            'payment_status' => 'completed',
            'referral_prefix' => $referralData['prefix'],
            'referral_pack_name' => $pack->name,
            'referral_letter' => $referralData['letter'],
            'referral_number' => $referralData['number'],
            'referral_code' => $referralData['code'],
            'link_referral' => $referralData['link'],
            'sponsor_id' => $sponsorId,
        ]);

        return UserPack::where('user_id', $user->id)
                      ->where('pack_id', $pack->id)
                      ->where('referral_code', $referralData['code'])
                      ->first();
    }
}
