<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fundraising extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'user_id',
        'pub_reference',
        'titre',
        'image',
        'video',
        'description',
        'lien',
        'cout_total',
        'mobilise',
        'gap',
        'statut',
        'raison_rejet'
    ];

    protected $casts = [
        'cout_total' => 'decimal:2',
        'mobilise' => 'decimal:2',
        'gap' => 'decimal:2',
    ];

    /**
     * Obtenir la page associée à ce levé de fonds.
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'page_id', 'id');
    }

    /**
     * Obtenir l'utilisateur associé à ce levé de fonds.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Obtenir les likes associés à ce levé de fonds.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(FundraisingLike::class);
    }

    /**
     * Obtenir les commentaires associés à ce levé de fonds.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(FundraisingComment::class);
    }

    /**
     * Vérifier si un utilisateur a aimé ce levé de fonds.
     */
    public function isLikedByUser($userId): bool
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    /**
     * Obtenir le nombre de likes pour ce levé de fonds.
     */
    public function getLikesCount(): int
    {
        return $this->likes()->count();
    }

    /**
     * Obtenir le nombre de commentaires pour ce levé de fonds.
     */
    public function getCommentsCount(): int
    {
        return $this->comments()->count();
    }

    /**
     * Calculer le gap automatiquement si non défini.
     */
    public function calculateGap(): void
    {
        if ($this->cout_total && $this->mobilise) {
            $this->gap = $this->cout_total - $this->mobilise;
        }
    }

    /**
     * Obtenir le pourcentage de fonds mobilisés.
     */
    public function getPercentageMobilise(): float
    {
        if (!$this->cout_total || $this->cout_total == 0) {
            return 0;
        }
        
        return ($this->mobilise / $this->cout_total) * 100;
    }
}
