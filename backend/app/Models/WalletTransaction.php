<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'reference',
        'session_id', // Pour Serdipay (nullable)
        'transaction_id', // Pour Serdipay (nullable)
        'flow',
        'nature',
        'type',
        'amount',
        'fee_amount',
        'commission_amount',
        'status',
        'balance_before',
        'balance_after',
        'description',
        'metadata',
        'processed_by',
        'processed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'processed_at' => 'datetime',
        'metadata' => 'array',
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

    // Relation avec le wallet
    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Scope pour les crédits
    public function scopeCredits($query)
    {
        return $query->where('flow', 'in');
    }

    // Scope pour les débits
    public function scopeDebits($query)
    {
        return $query->where('flow', 'out');
    }
} 