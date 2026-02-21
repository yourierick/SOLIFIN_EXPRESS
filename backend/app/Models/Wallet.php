<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'available_balance',
        'frozen_balance',
        'points',
        'is_active',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'available_balance' => 'decimal:2',
        'frozen_balance' => 'decimal:2',
        'points' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relation avec l'utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation avec les transactions
    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Ajoute des fonds au portefeuille
     * @param float $amount Montant à ajouter
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletTransaction
     */
    public function addFunds(float $amount, float $fee, float $commission, string $type, string $status, string $description, int $processed_by, ?array $metadata = []): WalletTransaction
    {
        $balanceBefore = $this->balance;
        
        $this->balance += $amount;
        $this->available_balance += $amount;
        $this->save();

        return $this->transactions()->create([
            'flow' => 'in',
            'nature' => 'internal', // Par défaut pour les ajouts de fonds
            'type' => $type,
            'amount' => $amount,
            'fee_amount' => $fee,
            'commission_amount' => $commission,
            'status' => $status,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->balance,
            'description' => $description,
            'metadata' => $metadata,
            'processed_by' => $processed_by,
            'processed_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Retire des fonds du portefeuille
     * @param float $amount Montant à retirer
     * @param string $type Type de transaction
     * @param string $status Statut de la transaction
     * @param array|null $metadata Métadonnées supplémentaires
     * @return WalletTransaction|false
     */
    public function withdrawFunds(float $amount, float $fee, float $commission, string $nature, string $type, string $status, string $description = null, int $processed_by, ?array $metadata = []): WalletTransaction|false
    {
        // Vérifier le solde disponible
        if ($type === 'funds_withdrawal') {
            if ($this->frozen_balance < $amount) {
                return false;
            }
        }else {
            if ($this->available_balance < $amount) {
                return false;
            }
        }
        
        $balanceBefore = $this->balance;
        
        if ($type === 'funds_withdrawal') {
            $this->balance -= $amount;
            $this->frozen_balance -= $amount;
        }else {
            $this->balance -= $amount;
            $this->available_balance -= $amount;
        }
        $this->save();

        return $this->transactions()->create([
            'flow' => 'out',
            'nature' => $nature,
            'type' => $type,
            'amount' => $amount,
            'fee_amount' => $fee,
            'commission_amount' => $commission,
            'status' => $status,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->balance,
            'description' => $description,
            'metadata' => $metadata,
            'processed_by' => $processed_by,
            'processed_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Gèle des fonds dans le portefeuille
     * @param float $amount Montant à geler
     * @param string|null $reason Raison du gel
     * @return bool
     */
    public function freezeFunds(float $amount, ?string $reason = null): bool
    {
        if ($this->available_balance < $amount) {
            return false;
        }
        
        $this->frozen_balance += $amount;
        $this->available_balance -= $amount;
        $this->save();

        // Créer une transaction de gel
        $this->transactions()->create([
            'flow' => 'freeze', // Transaction interne
            'nature' => 'internal',
            'type' => 'freeze_funds',
            'amount' => $amount,
            'fee_amount' => 0,
            'commission_amount' => 0,
            'status' => 'completed',
            'balance_before' => $this->balance, // ✅ Solde AVANT le gel
            'balance_after' => $this->balance,
            'description' => $reason ?? 'Fonds gelés',
            'metadata' => ['Raison du gèle' => $reason],
            'processed_by' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => null,
        ]);

        return true;
    }

    /**
     * Dégèle des fonds dans le portefeuille
     * @param float $amount Montant à dégeler
     * @param string|null $reason Raison du dégel
     * @return bool
     */
    public function unfreezeFunds(float $amount, ?string $reason = null): bool
    {
        if ($this->frozen_balance < $amount) {
            return false;
        }
        
        $this->frozen_balance -= $amount;
        $this->available_balance += $amount;
        $this->save();

        // Créer une transaction de dégel
        $this->transactions()->create([
            'flow' => 'unfreeze', // Transaction interne
            'nature' => 'internal',
            'type' => 'unfreeze_funds',
            'amount' => $amount,
            'fee_amount' => 0,
            'commission_amount' => 0,
            'status' => 'completed',
            'balance_before' => $this->balance, // ✅ Solde AVANT le dégel
            'balance_after' => $this->balance,
            'description' => $reason ?? 'Fonds dégélés',
            'metadata' => ['Raison du déblocage' => $reason],
            'processed_by' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => null,
        ]);

        return true;
    }

    /**
     * Vérifie si un montant peut être gelé
     * @param float $amount Montant à vérifier
     * @return bool
     */
    public function canFreeze(float $amount): bool
    {
        return $this->available_balance >= $amount;
    }

    /**
     * Vérifie si un montant peut être dégélé
     * @param float $amount Montant à vérifier
     * @return bool
     */
    public function canUnfreeze(float $amount): bool
    {
        return $this->frozen_balance >= $amount;
    }

    /**
     * Obtient le montant total gelé
     * @return float
     */
    public function getFrozenAmount(): float
    {
        return $this->frozen_balance;
    }

    /**
     * Obtient le montant disponible non gelé
     * @return float
     */
    public function getAvailableUnfrozenBalance(): float
    {
        return $this->available_balance;
    }

    /**
     * Obtient le total des commissions par type de pack
     * @return array
     */
    public function getCommissionsByPack(): array
    {
        return $this->transactions()
            ->where('type', 'sponsorship_commission')
            ->whereNotNull('metadata->pack_id')
            ->get()
            ->groupBy('metadata.pack_id')
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->toArray();
    }

    /**
     * Obtient les statistiques des transactions du mois en cours
     * @return array
     */
    public function getCurrentMonthStats(): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        return [
            'earnings' => $this->transactions()
                ->where('flow', 'in')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
            'withdrawals' => $this->transactions()
                ->where('flow', 'out')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
            'commissions' => $this->transactions()
                ->whereIn('type', ['sponsorship_commission', 'withdrawal_commission', 'transfer_commission'])
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
        ];
    }
} 