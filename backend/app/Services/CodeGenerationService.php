<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPack;
use Illuminate\Support\Str;

class CodeGenerationService
{
    // Constantes pour les préfixes
    const PREFIX_USER_ACCOUNT = 'USR-';

    /**
     * Génère un identifiant unique pour un utilisateur
     *
     * @return string
     */
    public function generateUniqueAccountId()
    {
        do {
            $accountId = self::PREFIX_USER_ACCOUNT . rand(1, 100) . "-" . strtoupper(Str::random(4));
        } while (User::where('account_id', $accountId)->exists());

        return $accountId;
    }

    /**
     * Génère un code de parrainage unique basé sur le nom du pack
     *
     * @param string $packName
     * @return array Tableau contenant le code et ses composants
     */
    public function generateUniqueReferralCode($pack)
    {
        $classLetter = $pack->class_letter;
        
        // Récupérer l'ID du dernier UserPack et ajouter 1
        $lastUserPackId = UserPack::max('id') ?? 0;
        $referralNumber = str_pad($lastUserPackId + 1, 4, '0', STR_PAD_LEFT);
        $referralCode = $classLetter . $referralNumber;

        return [
            'code' => $referralCode,
        ];
    }

    /**
     * Génère un lien de parrainage basé sur le code
     *
     * @param string $referralCode
     * @return string
     */
    public function generateReferralLink($referralCode)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return $frontendUrl . "/login?referral_code=" . $referralCode;
    }
    
    /**
     * Génère un code de parrainage pour un pack et son lien associé
     *
     * @param string $packName
     * @return array
     */
    public function generatePackReferralCode($packName)
    {
        $referralData = $this->generateUniqueReferralCode($packName);
        $referralData['link'] = $this->generateReferralLink($referralData['code']);
        
        return $referralData;
    }
}
