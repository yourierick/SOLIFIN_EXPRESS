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
        'amount',
        'currency',
        'mouvment',
        'type',
        'status',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
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

    // Scope pour les crédits
    public function scopeCreditsUSD($query)
    {
        return $query->where('mouvment', 'in');
    }

    // Scope pour les débits
    public function scopeDebitsUSD($query)
    {
        return $query->where('mouvment', 'out');
    }

    // Scope pour les crédits
    public function scopeCreditsCDF($query)
    {
        return $query->where('mouvment', 'in');
    }

    // Scope pour les débits
    public function scopeDebitsCDF($query)
    {
        return $query->where('mouvment', 'out');
    }
} 