<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundraisingLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fundraising_id',
    ];

    /**
     * Obtenir l'utilisateur qui a aimé ce levé de fonds.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Obtenir le levé de frais associé à ce like.
     */
    public function fundraising(): BelongsTo
    {
        return $this->belongsTo(Fundraising::class, 'fundraising_id', 'id');
    }
}
