<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Fundraising;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class FundraisingValidationController extends Controller
{
    /**
     * Afficher tous les levés de fonds pour l'administration avec pagination.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        \Log::info($request->all());
        try {
            // Paramètres de pagination
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);
            
            // Construction de la requête
            $query = Fundraising::with(['user'])
                ->where('statut', '!=', 'draft')
                ->orderBy('created_at', 'desc');
            
            // Filtres
            if ($request->has('statut') && $request->get('statut') !== 'all') {
                $query->where('statut', $request->get('statut'));
            }
            
            // Filtre de recherche
            if ($request->has('search') && !empty($request->get('search'))) {
                $searchTerm = $request->get('search');
                $query->where(function($q) use ($searchTerm) {
                    $q->where('titre', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('pub_reference', 'LIKE', '%' . $searchTerm . '%');
                });
            }
            
            // Pagination
            $fundraisings = $query->paginate($perPage, ['*'], 'page', $page);
            
            // Transformer les résultats
            $fundraisings->getCollection()->transform(function ($fundraising) {
                if ($fundraising->image) {  
                    $fundraising->image_url = asset('storage/' . $fundraising->image);
                }
                if ($fundraising->video) {
                    $fundraising->video_url = asset('storage/' . $fundraising->video);
                }

                if ($fundraising->user && $fundraising->user->picture) {
                    $fundraising->user->picture_url = asset('storage/' . $fundraising->user->picture);
                }
                
                // Ajouter les pourcentages et montants calculés
                $fundraising->percentage_mobilise = $fundraising->getPercentageMobilise();
                $fundraising->cout_total_formatted = number_format($fundraising->cout_total, 2, ',', ' ');
                $fundraising->mobilise_formatted = number_format($fundraising->mobilise, 2, ',', ' ');
                $fundraising->gap_formatted = number_format($fundraising->gap, 2, ',', ' ');
                
                return $fundraising;
            });

            return response()->json([
                'fundraisings' => $fundraisings
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des levés de fonds', 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Approuver un levé de fonds.
     */
    public function approve($id)
    {
        try {
            $fundraising = Fundraising::findOrFail($id);
            $fundraising->statut = 'publié';
            $fundraising->save();

            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds approuvé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter un levé de fonds.
     */
    public function suspend(Request $request, $id)
    {
        try {
            $fundraising = Fundraising::findOrFail($id);
            $fundraising->statut = 'suspendu';
            $fundraising->save();

            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds rejeté avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un levé de fonds.
     */
    public function destroy($id)
    {
        try {
            $fundraising = Fundraising::findOrFail($id);

            // Supprimer les fichiers associés
            if ($fundraising->image) {
                Storage::disk('public')->delete($fundraising->image);
            }
            
            if ($fundraising->video) {
                Storage::disk('public')->delete($fundraising->video);
            }

            $fundraising->delete();

            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher les détails d'un levé de fonds spécifique.
     */
    public function show($id)
    {
        try {
            $fundraising = Fundraising::with(['user', 'page', 'likes', 'comments.user'])
                ->findOrFail($id);

            // Ajouter les URLs des fichiers
            if ($fundraising->image) {
                $fundraising->image_url = asset('storage/' . $fundraising->image);
            }
            if ($fundraising->video) {
                $fundraising->video_url = asset('storage/' . $fundraising->video);
            }

            if ($fundraising->user && $fundraising->user->picture) {
                $fundraising->user->picture_url = asset('storage/' . $fundraising->user->picture);
            }

            // Ajouter les statistiques
            $fundraising->likes_count = $fundraising->getLikesCount();
            $fundraising->comments_count = $fundraising->getCommentsCount();
            $fundraising->percentage_mobilise = $fundraising->getPercentageMobilise();

            return response()->json([
                'success' => true,
                'fundraising' => $fundraising
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des détails du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
