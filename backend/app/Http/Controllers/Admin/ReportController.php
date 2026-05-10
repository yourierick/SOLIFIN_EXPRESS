<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\User;
use App\Models\DigitalProduct;
use App\Models\Formation;
use App\Models\OffreEmploi;
use App\Models\OpportuniteAffaire;
use App\Models\Publicite;
use App\Models\SocialEvent;
use App\Notifications\ReportActionNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * Afficher la liste des signalements avec pagination et filtres.
     */
    public function index(Request $request)
    {
        try {
            // Paramètres de pagination
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);
            
            // Construction de la requête
            $query = Report::with(['reporter', 'reportedUser', 'reviewer'])
                ->orderBy('created_at', 'desc');
            
            // Filtres
            if ($request->has('status') && $request->get('status') !== '') {
                $query->where('status', $request->get('status'));
            }
            
            if ($request->has('publication_type') && $request->get('publication_type') !== '') {
                $query->where('publication_type', $request->get('publication_type'));
            }
            
            if ($request->has('reason') && $request->get('reason') !== '') {
                $query->where('reason', $request->get('reason'));
            }
            
            if ($request->has('search') && $request->get('search') !== '') {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->whereHas('reporter', function($subQuery) use ($search) {
                        $subQuery->where('name', 'like', "%{$search}%")
                              ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('reportedUser', function($subQuery) use ($search) {
                        $subQuery->where('name', 'like', "%{$search}%")
                              ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
                });
            }
            
            // Pagination
            $total = $query->count();
            $reports = $query->skip(($page - 1) * $perPage)
                              ->take($perPage)
                              ->get();
            
            // Formater les données
            $formattedReports = $reports->map(function ($report) {
                // Ajouter les URLs des utilisateurs
                if ($report->reporter) {
                    $report->reporter->picture_url = $report->reporter->picture 
                        ? asset('storage/' . $report->reporter->picture) 
                        : asset('images/default-avatar.png');
                }
                
                if ($report->reportedUser) {
                    $report->reportedUser->picture_url = $report->reportedUser->picture 
                        ? asset('storage/' . $report->reportedUser->picture) 
                        : asset('images/default-avatar.png');
                }
                
                if ($report->reviewer) {
                    $report->reviewer->picture_url = $report->reviewer->picture 
                        ? asset('storage/' . $report->reviewer->picture) 
                        : asset('images/default-avatar.png');
                }

                if ($report->evidence) {
                    $report->evidence = $report->evidence 
                        ? asset('storage/' . $report->evidence) 
                        : asset('images/default-avatar.png');
                }
                
                return $report;
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedReports,
                'pagination' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des signalements: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des signalements'
            ], 500);
        }
    }
    
    /**
     * Afficher les détails d'un signalement.
     */
    public function show($id)
    {
        try {
            $report = Report::with(['reporter', 'reportedUser', 'reviewer'])
                ->find($id);
                
            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Signalement non trouvé'
                ], 404);
            }
            
            // Ajouter les URLs des utilisateurs
            if ($report->reporter) {
                $report->reporter->picture_url = $report->reporter->picture_url 
                    ? asset('storage/' . $report->reporter->picture_url) 
                    : asset('images/default-avatar.png');
            }
            
            if ($report->reportedUser) {
                $report->reportedUser->picture_url = $report->reportedUser->picture_url 
                    ? asset('storage/' . $report->reportedUser->picture_url) 
                    : asset('images/default-avatar.png');
            }
            
            if ($report->reviewer) {
                $report->reviewer->picture_url = $report->reviewer->picture_url 
                    ? asset('storage/' . $report->reviewer->picture_url) 
                    : asset('images/default-avatar.png');
            }
            
            return response()->json([
                'success' => true,
                'data' => $report
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du signalement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération du signalement'
            ], 500);
        }
    }

    /**
     * Traiter un signalement selon le cas
     */
    public function handleReport($id, Request $request)
    {
        try {
            $validate = $request->validate([
                'action' => 'required|array',
                'action.suspendaccount' => 'sometimes|boolean',
                'action.suspendpublicationright' => 'sometimes|boolean',
                'action.retirepublication' => 'sometimes|boolean',
                'action.ignorereport' => 'sometimes|boolean',
            ]);

            $action = $validate['action'];
            $report = Report::find($id);
            
            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Signalement non trouvé'
                ], 404);
            }

            // Exécuter les actions sélectionnées
            $executedActions = [];
            $errors = [];

            if (isset($action['suspendaccount'])) {
                $result = $this->suspendaccount($id);
                if ($result['success']) {
                    $executedActions[] = 'Compte suspendu';
                } else {
                    $errors[] = $result['message'];
                }
            }

            if (isset($action['suspendpublicationright'])) {
                $result = $this->suspendpublishing($id);
                if ($result['success']) {
                    $executedActions[] = 'Droit de publication suspendu';
                } else {
                    $errors[] = $result['message'];
                }
            }

            if (isset($action['retirepublication'])) {
                $result = $this->retirepublication($id);
                if ($result['success']) {
                    $executedActions[] = 'Publication retirée';
                } else {
                    $errors[] = $result['message'];
                }
            }

            if (isset($action['ignorereport'])) {
                $result = $this->ignore($id);
                if ($result['success']) {
                    $executedActions[] = 'Signalement ignoré';
                } else {
                    $errors[] = $result['message'];
                }
            }

            // Préparer le message de réponse
            $message = count($executedActions) > 0 
                ? 'Signalement traité avec succès. Actions: ' . implode(', ', $executedActions)
                : 'Aucune action n\'a été exécutée';

            // S'il y a des erreurs mais aussi des succès, retourner un avertissement
            if (!empty($errors) && !empty($executedActions)) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'warnings' => $errors,
                    'executed_actions' => $executedActions
                ]);
            }

            // S'il y a seulement des erreurs
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs lors du traitement: ' . implode('; ', $errors),
                    'errors' => $errors
                ], 500);
            }

            // Succès complet
            // Envoyer la notification à l'utilisateur signalé seulement si des actions ont été exécutées
            if (!empty($executedActions) && $report->reportedUser) {
                $report->reportedUser->notify(new ReportActionNotification(
                    $report,
                    $action,
                    'Actions appliquées suite au signalement'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'executed_actions' => $executedActions
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du traitement du signalement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du traitement du signalement'
            ], 500);
        }
    }

    
    /**
     * Suspendre un compte à la suite d'un signalement.
     */
    public function suspendaccount($id)
    {
        try {
            $report = Report::findOrfail($id);
            $reportedaccount = $report->reportedUser;
            
            // Suspendre le compte utilisateur
            $reportedaccount->status = "inactive";
            $reportedaccount->save();
            
            // Mettre à jour le statut du signalement
            $report->status = 'reviewed';
            $report->reviewed_by = auth()->id();
            $report->admin_note = 'Compte suspendu suite au signalement';
            $report->save();
            
            return ['success' => true, 'message' => 'Compte suspendu avec succès'];
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suspension du compte: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de la suspension du compte: ' . $e->getMessage()];
        }
    }
    
    /**
     * Suspendre le droit de publication à la suite d'un signalement
     */
    public function suspendpublishing($id)
    {
        try {
            $report = Report::findOrfail($id);
            $reportedaccount = $report->reportedUser;
            
            // Suspendre le droit de publication
            $reportedaccount->can_publish = false;
            $reportedaccount->save();
            
            // Mettre à jour le statut du signalement
            $report->status = 'reviewed';
            $report->reviewed_by = auth()->id();
            $report->admin_note = 'Droit de publication suspendu suite au signalement';
            $report->save();
            
            return ['success' => true, 'message' => 'Droit de publication suspendu avec succès'];
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suspension du droit de publication: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de la suspension du droit de publication: ' . $e->getMessage()];
        }
    }

    /**
     * Rétirer une publication à la suite d'un signalement
     */
    public function retirepublication($id)
    {
        try {
            $report = Report::findOrfail($id);
            if ($report->publication_type === "Publicité") {
                $publication = Publicite::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer l'image et la vidéo de la publicité
                    if ($publication->image && Storage::exists($publication->image)) {
                        Storage::delete($publication->image);
                    }
                    if ($publication->video && Storage::exists($publication->video)) {
                        Storage::delete($publication->video);
                    }
                    $publication->delete();
                }
            }

            if ($report->publication_type === "Social") {
                $publication = SocialEvent::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer l'image et la vidéo de l'événement social
                    if ($publication->image && Storage::exists($publication->image)) {
                        Storage::delete($publication->image);
                    }
                    if ($publication->video && Storage::exists($publication->video)) {
                        Storage::delete($publication->video);
                    }
                    $publication->delete();
                }
            }

            if ($report->publication_type === "Offre d'emploi") {
                $publication = OffreEmploi::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer le fichier de l'offre d'emploi
                    if ($publication->offer_file && Storage::exists($publication->offer_file)) {
                        Storage::delete($publication->offer_file);
                    }
                    $publication->delete();
                }
            }

            if ($report->publication_type === "Opportunité d'affaire") {
                $publication = OpportuniteAffaire::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer le fichier de l'opportunité d'affaire
                    if ($publication->opportunity_file && Storage::exists($publication->opportunity_file)) {
                        Storage::delete($publication->opportunity_file);
                    }
                    $publication->delete();
                }
            }

            if ($report->publication_type === "Formation") {
                $publication = Formation::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer la thumbnail de la formation
                    if ($publication->thumbnail && Storage::exists($publication->thumbnail)) {
                        Storage::delete($publication->thumbnail);
                    }
                    // Supprimer les fichiers des modules de formation
                    $modules = $publication->modules;
                    if ($modules) {
                        foreach ($modules as $module) {
                            if ($module->file_url && Storage::exists($module->file_url)) {
                                Storage::delete($module->file_url);
                            }
                            $module->delete();
                        }
                    }
                    $publication->delete();
                }
            }

            if ($report->publication_type === "Produit numérique") {
                $publication = DigitalProduct::where('pub_reference', $report->publication_reference)->first();
                if ($publication) {
                    // Supprimer l'image et le fichier du produit numérique
                    if ($publication->image && Storage::exists($publication->image)) {
                        Storage::delete($publication->image);
                    }
                    if ($publication->fichier && Storage::exists($publication->fichier)) {
                        Storage::delete($publication->fichier);
                    }
                    $publication->delete();
                }
            }
            
            // Mettre à jour le statut du signalement
            $report->status = 'reviewed';
            $report->reviewed_by = auth()->id();
            $report->admin_note = 'Publication retirée suite au signalement';
            $report->save();
            
            return ['success' => true, 'message' => 'Publication retirée avec succès'];
            
        } catch (\Exception $e) {
            Log::error('Erreur lors du retrait de la publication: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors du retrait de la publication: ' . $e->getMessage()];
        }
    }

    /**
     * Ignorer un signalement.
     */
    public function ignore($id)
    {
        try {
            $report = Report::find($id);
            
            if (!$report) {
                return ['success' => false, 'message' => 'Signalement non trouvé'];
            }
            
            $report->status = "ignored";
            $report->reviewed_by = auth()->id();
            $report->admin_note = 'Signalement ignoré';
            $report->save();
            
            return ['success' => true, 'message' => 'Signalement ignoré avec succès'];
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'ignorance du signalement: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de l\'ignorance du signalement: ' . $e->getMessage()];
        }
    }
    
    /**
     * Supprimer un signalement.
     */
    public function destroy($id)
    {
        try {
            $report = Report::find($id);
            
            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Signalement non trouvé'
                ], 404);
            }
            
            $report->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Signalement supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du signalement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du signalement'
            ], 500);
        }
    }
    
    /**
     * Obtenir les statistiques des signalements.
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => Report::count(),
                'pending' => Report::where('status', 'pending')->count(),
                'reviewed' => Report::where('status', 'reviewed')->count(),
                'ignored' => Report::where('status', 'ignored')->count(),
                'by_type' => Report::selectRaw('publication_type, COUNT(*) as count')
                    ->groupBy('publication_type')
                    ->orderBy('count', 'desc')
                    ->get(),
                'by_reason' => Report::selectRaw('reason, COUNT(*) as count')
                    ->groupBy('reason')
                    ->orderBy('count', 'desc')
                    ->get(),
                'recent' => Report::with(['reporter', 'reportedUser'])
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des statistiques'
            ], 500);
        }
    }
}

