<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\GradeHistory;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class GradeController extends Controller
{
    /**
     * Récupérer tous les grades et les points de l'utilisateur
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Récupérer tous les grades ordonnés par points requis
            $grades = Grade::orderBy('niveau', 'asc')->get();

            $lastGrade = $grades->last();

            // Récupérer le wallet de l'utilisateur avec ses points
            $wallet = $user->wallet;
            
            if (!$wallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet non trouvé'
                ], 404);
            }

            // Récupérer les points de l'utilisateur
            $userPoints = $wallet->points;
            
            // Récupérer le grade actuel de l'utilisateur via grade_id
            $currentGrade = null;
            if ($user->grade_id) {
                $currentGrade = Grade::find($user->grade_id);
            }
            
            // Récupérer le prochain grade
            $nextGrade = null;
            $progressPercentage = 0;
            $pointsToNextGrade = 0;

            if ($currentGrade) {
                // Si l'utilisateur a un grade, chercher le prochain
                $nextGrade = Grade::where('points', '>', $currentGrade->points)
                    ->orderBy('points', 'asc')
                    ->first();
                
                // Calculer la progression vers le prochain grade
                if ($nextGrade) {
                    $previousGradePoints = $currentGrade->points;
                    $nextGradePoints = $nextGrade->points;
                    $gradeRange = $nextGradePoints - $previousGradePoints;
                    $userProgressInGrade = $userPoints - $previousGradePoints;
                    $progressPercentage = ($userProgressInGrade / $gradeRange) * 100;
                    $pointsToNextGrade = $nextGradePoints - $userPoints;
                }
            } else {
                // Si l'utilisateur n'a pas de grade, prendre le premier grade comme prochain
                $nextGrade = $grades->first();
                if ($nextGrade) {
                    $progressPercentage = ($userPoints / $nextGrade->points) * 100;
                    $pointsToNextGrade = $nextGrade->points - $userPoints;
                }
            }

            // Ajouter les URLs des symboles aux grades
            $gradesWithUrls = $grades->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'niveau' => $grade->niveau,
                    'designation' => $grade->designation,
                    'points' => $grade->points,
                    'valeur_point' => $grade->valeur_point, // Utiliser valeur_point au lieu de points
                    'symbole' => $grade->symbole,
                    'symbole_url' => $grade->symbole_url,
                    'symbole_url_or_default' => $grade->symbole_url_or_default,
                    'has_symbole_file' => $grade->hasSymboleFile(),
                    'created_at' => $grade->created_at,
                    'updated_at' => $grade->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'grades' => $gradesWithUrls,
                    'user_points' => $userPoints,
                    'current_grade' => $currentGrade ? [
                        'id' => $currentGrade->id,
                        'niveau' => $currentGrade->niveau,
                        'designation' => $currentGrade->designation,
                        'points' => $currentGrade->points,
                        'valeur_point' => $currentGrade->valeur_point,
                        'symbole' => $currentGrade->symbole,
                        'symbole_url' => $currentGrade->symbole_url,
                        'symbole_url_or_default' => $currentGrade->symbole_url_or_default,
                    ] : null,
                    'next_grade' => $nextGrade ? [
                        'id' => $nextGrade->id,
                        'niveau' => $nextGrade->niveau,
                        'designation' => $nextGrade->designation,
                        'points' => $nextGrade->points,
                        'valeur_point' => $nextGrade->valeur_point,
                        'symbole' => $nextGrade->symbole,
                        'symbole_url' => $nextGrade->symbole_url,
                        'symbole_url_or_default' => $nextGrade->symbole_url_or_default,
                    ] : null,
                    'progress' => [
                        'percentage' => round($progressPercentage, 2),
                        'points_to_next' => $pointsToNextGrade,
                        'completed_grades_count' => $currentGrade ? $grades->search(function ($grade) use ($currentGrade) {
                            return $grade->points <= $currentGrade->points;
                        }) + 1 : 0, // +1 car search retourne l'index (commence à 0)
                        'total_grades_count' => $grades->count(),
                        'last_grade_point' => $lastGrade->points,
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les détails de progression d'un utilisateur
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProgression()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            $grades = Grade::orderBy('niveau', 'asc')->get();
            $wallet = $user->wallet;
            $userPoints = $wallet ? $wallet->points : 0;

            // Récupérer le grade actuel via grade_id
            $currentGrade = null;
            if ($user->grade_id) {
                $currentGrade = Grade::find($user->grade_id);
            }

            $completedGrades = [];
            $nextGrade = null;

            // Si l'utilisateur a un grade actuel, récupérer tous les grades jusqu'à celui-ci
            if ($currentGrade) {
                $completedGrades = $grades->filter(function ($grade) use ($currentGrade) {
                    return $grade->points <= $currentGrade->points;
                })->map(function ($grade) {
                    return [
                        'id' => $grade->id,
                        'niveau' => $grade->niveau,
                        'designation' => $grade->designation,
                        'points' => $grade->points,
                        'valeur_point' => $grade->valeur_point,
                        'symbole' => $grade->symbole,
                        'symbole_url' => $grade->symbole_url,
                        'completed_at' => $user->updated_at, // Date de dernière mise à jour
                    ];
                })->values()->toArray();
                
                // Chercher le prochain grade
                $nextGrade = Grade::where('points', '>', $currentGrade->points)
                    ->orderBy('points', 'asc')
                    ->first();
            } else {
                // Si pas de grade, le premier grade est le prochain
                $nextGrade = $grades->first();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user_points' => $userPoints,
                    'completed_grades' => $completedGrades,
                    'current_grade' => $currentGrade ? [
                        'id' => $currentGrade->id,
                        'niveau' => $currentGrade->niveau,
                        'designation' => $currentGrade->designation,
                        'points' => $currentGrade->points,
                        'valeur_point' => $currentGrade->valeur_point,
                        'symbole' => $currentGrade->symbole,
                    ] : null,
                    'next_grade' => $nextGrade ? [
                        'id' => $nextGrade->id,
                        'niveau' => $nextGrade->niveau,
                        'designation' => $nextGrade->designation,
                        'points' => $nextGrade->points,
                        'valeur_point' => $nextGrade->valeur_point,
                        'symbole' => $nextGrade->symbole,
                    ] : null,
                    'progression_percentage' => $nextGrade && $currentGrade 
                        ? round((($userPoints - $currentGrade->points) / ($nextGrade->points - $currentGrade->points)) * 100, 2)
                        : ($nextGrade ? round(($userPoints / $nextGrade->points) * 100, 2) : 100)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la progression: ' . $e->getMessage()
            ], 500);
        }
    }
}
