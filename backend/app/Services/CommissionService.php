<?php

namespace App\Services;

use App\Models\UserPack;
use App\Models\WalletSystem;
use App\Models\CommissionRate;
use App\Models\Commission;
use App\Models\User;
use App\Notifications\CommissionReceived;

class CommissionService
{
    public function distributeCommissions(UserPack $purchase, $amount, $duration_months)
    {
        $currentUser = $purchase->user;
        $currentSponsor = User::find($purchase->sponsor_id);

        $level = 1;
        $maxLevel = 4; // Maximum 4 générations

        // Ajouter le montant au wallet system (sans les frais)
        while ($currentSponsor && $level <= $maxLevel) {
            // Récupérer le taux de commission pour ce niveau
            $rate = CommissionRate::where('pack_id', $purchase->pack_id)
                ->where('level', $level)
                ->first();
            if ($rate) {
                // Calculer le montant de la commission
                $commissionAmount = ($amount * $rate->rate) / 100;


                //Vérifier si le pack du sponsor est actif
                $checkPack = $currentSponsor->packs()->where('pack_id', $purchase->pack_id)->first();
                if ($checkPack->status == "active") {
                    // Créer la commission
                    $commission = Commission::create([
                        'user_id' => $currentSponsor->id,
                        'source_user_id' => $currentUser->id,
                        'pack_id' => $purchase->pack_id,
                        'duree' => $duration_months,
                        'amount' => $commissionAmount,
                        'level' => $level,
                        'status' => 'pending'
                    ]);

                    // Traiter immédiatement la commission
                    $commission_traite = $this->processCommission($commission->id, $duration_months);
                    if ($commission_traite) {
                        // Notifier le parrain
                        $currentSponsor->notify(new CommissionReceived($commissionAmount, $purchase, $level));
                    }
                }else {
                    $commission = Commission::create([
                        'user_id' => $currentSponsor->id,
                        'source_user_id' => $currentUser->id,
                        'pack_id' => $purchase->pack_id,
                        'duree' => $duration_months,
                        'amount' => $amount,
                        'level' => $level,
                        'status' => 'failed',
                        'error_message' => 'pack non actif lors de la distribution des commissions'
                    ]);
                }
            }

            // Passer au parrain suivant
            $sponsorPack = UserPack::where('user_id', $currentSponsor->id)
                ->where('pack_id', $purchase->pack_id)
                ->where('payment_status', 'completed')
                ->first();
            
            if ($sponsorPack && $sponsorPack->sponsor_id) {
                $currentSponsor = User::find($sponsorPack->sponsor_id);
                $level++;
            } else {
                break;
            }
        }
    }

    public function processCommission($commissionId, $duration_months)
    {
        try {
            // Vérifier si l'utilisateur a un portefeuille
            $commission = Commission::find($commissionId);
            $wallet = $commission->sponsor_user->wallet;
            $walletsystem = WalletSystem::first();
            if (!$wallet) {
                throw new \Exception('L\'utilisateur n\'a pas de portefeuille');
            }

            // Mettre à jour le solde du portefeuille
            $metadata_user = [
                'Source' => $commission->source_user->name . ' / ' . $commission->source_user->account_id,
                'Nom du pack' => $commission->pack?->name,
                'Durée de souscription' => $duration_months . " mois",
                'Description' => 'Vous avez touché une commission de ' . $commission->amount . '$ sur votre pack ' . $commission->pack?->name, 
            ];

            // Mettre à jour le solde du portefeuille
            $metadata_system = [
                'Source' => $commission->source_user->name . ' / ' . $commission->source_user->account_id,
                'Bénéficiaire' => $commission->sponsor_user->name . ' / ' . $commission->sponsor_user->account_id,
                'Durée de souscription' => $duration_months . " mois",
                'Description' => 'Vous avez payé une commission de ' . $commission->amount . '$ sur le pack ' . $commission->pack?->name, 
            ];

            $description_user = 'Vous avez touché une commission de ' . $commission->amount . '$ sur votre pack ' . $commission->pack?->name;
            $description_system = 'Vous avez payé une commission de ' . $commission->amount . '$ sur le pack ' . $commission->pack?->name;
            $walletsystem->addEngagements($commission->amount, "sponsorship_commission", "completed", $description_system, $commission->source_user->id, $metadata_system);
            $wallet->addFunds($commission->amount, 0, 0, "sponsorship_commission", "completed", $description_user, $commission->source_user->id, $metadata_user); 

            // Marquer la commission comme traitée
            $commission->update([
                'status' => 'completed',
                'processed_at' => now()
            ]);

            return true;
        } catch (\Exception $e) {
            // En cas d'erreur, marquer la commission comme échouée
            \Log::error($e->getMessage());
            \Log::error($e->getLine());
            \Log::error($e->getTraceAsString());
            $commission->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
