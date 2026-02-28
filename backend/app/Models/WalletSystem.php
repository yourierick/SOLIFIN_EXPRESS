<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WalletSystem extends Model
{
    protected $fillable = [
        'solde_marchand',
        'engagement_users',
        'plateforme_benefices',
    ];

    protected $casts = [
        'solde_marchand' => 'decimal:2',
        'engagement_users' => 'decimal:2',
        'plateforme_benefices' => 'decimal:2',
    ];

    /**
     * Ajouter des fonds au wallet système
     * @param float $amount Montant à ajouter
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletSystemTransaction
     */
    public function addFunds(float $amount, string $type, string $status, string $description, int $processed_by, ?array $metadata = null, string $reason = null, string $source_reference = null): WalletSystemTransaction
    {
        return DB::transaction(function () use ($amount, $type, $status, $metadata, $processed_by, $description, $reason, $source_reference) {
            $soldeMarchandBefore = $this->solde_marchand;
            $engagementUsersBefore = $this->engagement_users;
            $plateformeBeneficesBefore = $this->plateforme_benefices;
            
            $this->solde_marchand += $amount;
            $this->plateforme_benefices += $amount;
            $this->save();

            return WalletSystemTransaction::create([
                'source_transaction_reference' => $source_reference,
                'flow' => 'in',
                'nature' => 'external', // Par défaut pour les ajouts de fonds
                'type' => $type,
                'amount' => $amount,
                'status' => $status,
                'solde_marchand_before' => $soldeMarchandBefore,
                'solde_marchand_after' => $this->solde_marchand,
                'engagement_users_before' => $engagementUsersBefore,
                'engagement_users_after' => $this->engagement_users,
                'plateforme_benefices_before' => $plateformeBeneficesBefore,
                'plateforme_benefices_after' => $this->plateforme_benefices,
                'description' => $description,
                'metadata' => $metadata,
                'processed_by' => $processed_by,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);
        });
    }

    /**
     * Retire des fonds du wallet système
     * @param float $amount Montant à retirer
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param int $processed_by ID de l'utilisateur qui a effectué la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletSystemTransaction
     */
    public function deductFunds(float $amount, string $type, string $status, int $processed_by, string $description, ?array $metadata = null, string $reason = null, string $source_reference = null): WalletSystemTransaction
    {
        return DB::transaction(function () use ($amount, $type, $status, $metadata, $processed_by, $description, $reason, $source_reference) {
            if ($this->solde_marchand < $amount) {
                throw new \Exception('Fonds insuffisants dans le portefeuille système');
            }
            
            $soldeMarchandBefore = $this->solde_marchand;
            $engagementUsersBefore = $this->engagement_users;
            $plateformeBeneficesBefore = $this->plateforme_benefices;
            
            if ($type === "solifin_funds_withdrawal") {
                $this->solde_marchand -= $amount;
                $this->plateforme_benefices -= $amount; 
            }else {
                $this->solde_marchand -= $amount;
                $this->engagement_users -= $amount; 
            }

            $this->save();

            return WalletSystemTransaction::create([
                'source_transaction_reference' => $source_reference,
                'flow' => 'out',
                'nature' => 'external', // Par défaut pour les retraits
                'type' => $type,
                'amount' => $amount,
                'status' => $status,
                'solde_marchand_before' => $soldeMarchandBefore,
                'solde_marchand_after' => $this->solde_marchand,
                'engagement_users_before' => $engagementUsersBefore,
                'engagement_users_after' => $this->engagement_users,
                'plateforme_benefices_before' => $plateformeBeneficesBefore,
                'plateforme_benefices_after' => $this->plateforme_benefices,
                'description' => $description,
                'metadata' => $metadata,
                'processed_by' => $processed_by,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);
        });
    }

    /**
     * Annule un retrait effectué dans le portefeuille solifin
     * @param float $amount Montant à rembourser
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param int $processed_by ID de l'utilisateur qui a effectué la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletSystemTransaction
     */
    public function cancelWithdrawal(string $source_reference, float $amount, string $type, string $status, int $processed_by, string $description, ?array $metadata = null, string $reason = null): WalletSystemTransaction
    {
        return DB::transaction(function () use ($source_reference, $amount, $type, $status, $metadata, $processed_by, $description, $reason) {
            $soldeMarchandBefore = $this->solde_marchand;
            $engagementUsersBefore = $this->engagement_users;
            $plateformeBeneficesBefore = $this->plateforme_benefices;
            
            if ($type === "withdrawal_reverse") {
                $this->solde_marchand += $amount;
                $this->plateforme_benefices += $amount; 
            }else {
                return false;
            }

            $this->save();

            return WalletSystemTransaction::create([
                'source_transaction_reference' => $source_reference,
                'flow' => 'in',
                'nature' => 'external', // Par défaut pour les retraits
                'type' => $type,
                'amount' => $amount,
                'status' => $status,
                'solde_marchand_before' => $soldeMarchandBefore,
                'solde_marchand_after' => $this->solde_marchand,
                'engagement_users_before' => $engagementUsersBefore,
                'engagement_users_after' => $this->engagement_users,
                'plateforme_benefices_before' => $plateformeBeneficesBefore,
                'plateforme_benefices_after' => $this->plateforme_benefices,
                'description' => $description,
                'metadata' => $metadata,
                'processed_by' => $processed_by,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);
        });
    }


    /**
     * Ajouter des fonds internes aux bénefices de la plateforme depuis les engagements users
     * @param float $amount Montant à ajouter
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletSystemTransaction
     */
    public function addProfits(float $amount, string $type, string $status, string $description, int $processed_by, ?array $metadata = null, string $reason = null, string $source_reference = null): WalletSystemTransaction
    {
        return DB::transaction(function () use ($amount, $type, $status, $metadata, $processed_by, $description, $reason, $source_reference) {
            $soldeMarchandBefore = $this->solde_marchand;
            $engagementUsersBefore = $this->engagement_users;
            $plateformeBeneficesBefore = $this->plateforme_benefices;
            
            $this->engagement_users -= $amount;
            $this->plateforme_benefices += $amount;
            $this->save();

            return WalletSystemTransaction::create([
                'source_transaction_reference' => $source_reference,
                'flow' => 'in',
                'nature' => 'internal',
                'type' => $type,
                'amount' => $amount,
                'status' => $status,
                'solde_marchand_before' => $soldeMarchandBefore,
                'solde_marchand_after' => $this->solde_marchand,
                'engagement_users_before' => $engagementUsersBefore,
                'engagement_users_after' => $this->engagement_users,
                'plateforme_benefices_before' => $plateformeBeneficesBefore,
                'plateforme_benefices_after' => $this->plateforme_benefices,
                'description' => $description,
                'metadata' => $metadata,
                'processed_by' => $processed_by,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);
        });
    }


    /**
     * Ajoute des engagements envers les utilisateurs
     * @param float $amount Montant des engagements
     * @param string $type Type de transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletSystemTransaction
     */
    public function addEngagements(float $amount, string $type, string $status, string $description, int $processed_by, ?array $metadata = null, string $reason = null, string $source_reference = null): WalletSystemTransaction
    {
        return DB::transaction(function () use ($amount, $type, $status, $metadata, $processed_by, $description, $reason, $source_reference) {
            $soldeMarchandBefore = $this->solde_marchand;
            $engagementUsersBefore = $this->engagement_users;
            $plateformeBeneficesBefore = $this->plateforme_benefices;
            
            $this->plateforme_benefices -= $amount;
            $this->engagement_users += $amount;
            $this->save();

            return WalletSystemTransaction::create([
                'source_transaction_reference' => $source_reference,
                'flow' => 'out', // Transaction interne
                'nature' => 'internal',
                'type' => $type,
                'amount' => $amount,
                'status' => $status,
                'solde_marchand_before' => $soldeMarchandBefore,
                'solde_marchand_after' => $this->solde_marchand,
                'engagement_users_before' => $engagementUsersBefore,
                'engagement_users_after' => $this->engagement_users,
                'plateforme_benefices_before' => $plateformeBeneficesBefore,
                'plateforme_benefices_after' => $this->plateforme_benefices,
                'description' => $description,
                'metadata' => $metadata,
                'processed_by' => $processed_by,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);
        });
    }


    /**
     * Vérifie l'équation comptable fondamentale
     * @return bool
     */
    public function validateAccountingEquation(): bool
    {
        return abs($this->solde_marchand - ($this->engagement_users + $this->plateforme_benefices)) < 0.01;
    }

    /**
     * Obtient le résumé des soldes système
     * @return array
     */
    public function getBalanceSummary(): array
    {
        return [
            'solde_marchand' => $this->solde_marchand,
            'engagement_users' => $this->engagement_users,
            'plateforme_benefices' => $this->plateforme_benefices,
            'equation_valid' => $this->validateAccountingEquation(),
            'total_engagements_plus_benefices' => $this->engagement_users + $this->plateforme_benefices,
        ];
    }
}
