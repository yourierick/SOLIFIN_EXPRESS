<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WalletSystemTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'source_transaction_reference',
        'session_id', // Pour Serdipay (nullable)
        'transaction_id', // Pour Serdipay (nullable)
        'flow',
        'nature',
        'type',
        'amount',
        'status',
        'description',
        'metadata',
        'solde_marchand_before',
        'solde_marchand_after',
        'engagement_users_before',
        'engagement_users_after',
        'plateforme_benefices_before',
        'plateforme_benefices_after',
        'processed_by',
        'processed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'solde_marchand_before' => 'decimal:2',
        'solde_marchand_after' => 'decimal:2',
        'engagement_users_before' => 'decimal:2',
        'engagement_users_after' => 'decimal:2',
        'plateforme_benefices_before' => 'decimal:2',
        'plateforme_benefices_after' => 'decimal:2',
        'metadata' => 'array',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        // Intercepter toute création de transaction pour injecter la référence
        static::creating(function ($transaction) {
            // Forcer la génération d'une référence si elle n'existe pas
            if (empty($transaction->reference) || is_null($transaction->reference)) {
                $transaction->reference = self::generateUniqueReference();
            }
        });

        // Intercepter toute sauvegarde (y compris les updates) pour garantir la référence
        static::saving(function ($transaction) {
            // Si c'est une nouvelle transaction sans référence, en générer une
            if ($transaction->wasRecentlyCreated === false && empty($transaction->reference)) {
                $transaction->reference = self::generateUniqueReference();
            }
        });
    }

    /**
     * Générer un code de référence unique de 10 caractères
     * 
     * @return string
     */
    public static function generateUniqueReference()
    {
        do {
            // Générer une référence de 10 caractères avec lettres et chiffres
            $reference = strtoupper(Str::random(10));
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    public function walletSystem()
    {
        return $this->belongsTo(WalletSystem::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Obtenir la transaction source (transaction parente)
     */
    public function sourceTransaction()
    {
        return $this->belongsTo(WalletSystemTransaction::class, 'source_transaction_reference', 'reference');
    }

    /**
     * Obtenir les transactions enfants (transactions inverses)
     */
    public function childTransactions()
    {
        return $this->hasMany(WalletSystemTransaction::class, 'source_transaction_reference', 'reference');
    }
}
