<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundraisingComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fundraising_id',
        'contenu',
        'parent_id', // Pour les réponses aux commentaires
    ];

    /**
     * Obtenir l'utilisateur qui a écrit ce commentaire.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Obtenir le levé de fonds associé à ce commentaire.
     */
    public function fundraising(): BelongsTo
    {
        return $this->belongsTo(Fundraising::class, 'fundraising_id', 'id');
    }

    /**
     * Obtenir le commentaire parent (pour les réponses).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(FundraisingComment::class, 'parent_id', 'id');
    }

    /**
     * Obtenir les réponses à ce commentaire.
     */
    public function replies()
    {
        return $this->hasMany(FundraisingComment::class, 'parent_id', 'id');
    }

    /**
     * Vérifier si ce commentaire est une réponse.
     */
    public function isReply(): bool
    {
        return !is_null($this->parent_id);
    }
}
