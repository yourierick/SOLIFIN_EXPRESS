<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Grade extends Model
{
    protected $fillable = [
        'niveau',
        'designation',
        'points',
        'symbole',
    ];

    /**
     * Obtenir l'URL complète du symbole du grade
     */
    public function getSymboleUrlAttribute()
    {
        if (!$this->symbole) {
            return null;
        }

        // Vérifier si le chemin commence déjà par 'storage/'
        if (str_starts_with($this->symbole, 'storage/')) {
            return url($this->symbole);
        }

        // Ajouter le préfixe storage/ si nécessaire
        return url('storage/' . $this->symbole);
    }

    /**
     * Obtenir le chemin du symbole sur le disque
     */
    public function getSymbolePathAttribute()
    {
        if (!$this->symbole) {
            return null;
        }

        // Retourner le chemin relatif pour Storage
        return $this->symbole;
    }

    /**
     * Vérifier si le symbole existe sur le disque
     */
    public function hasSymboleFile()
    {
        if (!$this->symbole) {
            return false;
        }

        return Storage::disk('public')->exists($this->symbole);
    }

    /**
     * Obtenir l'URL du symbole ou une image par défaut
     */
    public function getSymboleUrlOrDefaultAttribute()
    {
        if ($this->hasSymboleFile()) {
            return $this->symbole_url;
        }

        // Retourner une image par défaut si aucun symbole n'est défini
        return asset('images/default-grade-badge.png');
    }
}
