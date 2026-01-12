<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\GradeHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GradeController extends Controller
{
    /**
     * Afficher la liste des grades
     */
    public function index()
    {
        $grades = Grade::orderBy('niveau', 'asc')->get();
        
        // Ajouter les URLs des symboles à chaque grade
        $gradesWithUrls = $grades->map(function ($grade) {
            return [
                'id' => $grade->id,
                'niveau' => $grade->niveau,
                'designation' => $grade->designation,
                'points' => $grade->points,
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
            'grades' => $gradesWithUrls
        ]);
    }

    /**
     * Afficher un grade spécifique
     */
    public function show($id)
    {
        $grade = Grade::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'grade' => $grade
        ]);
    }

    /**
     * Créer un nouveau grade
     */
    public function store(Request $request)
    {
        $request->validate([
            'niveau' => 'required|string|unique:grades,niveau',
            'designation' => 'required|string|unique:grades,designation',
            'points' => 'required|numeric|min:0',
            'symbole' => 'nullable|image|mimes:jpeg,jpg,png|max:2048'
        ]);

        $data = [
            'niveau' => $request->niveau,
            'designation' => $request->designation,
            'points' => $request->points,
        ];

        // Gérer le téléchargement du symbole (médaille)
        if ($request->hasFile('symbole')) {
            $image = $request->file('symbole');
            $imageName = 'grade_' . Str::slug($request->niveau) . '_' . time() . '.' . $image->getClientOriginalExtension();
            $image->storeAs('grades', $imageName, 'public');
            $data['symbole'] = 'grades/' . $imageName;
        }

        $grade = Grade::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Grade créé avec succès',
            'grade' => $grade
        ]);
    }

    /**
     * Mettre à jour un grade
     */
    public function update(Request $request, $id)
    {
        $grade = Grade::findOrFail($id);

        $request->validate([
            'niveau' => 'required|string|unique:grades,niveau,' . $id,
            'designation' => 'required|string|unique:grades,designation,' . $id,
            'points' => 'required|numeric|min:0',
            'symbole' => 'nullable|image|mimes:jpeg,jpg,png|max:2048'
        ]);

        $data = [
            'niveau' => $request->niveau,
            'designation' => $request->designation,
            'points' => $request->points,
        ];

        // Gérer le téléchargement du nouveau symbole
        if ($request->hasFile('symbole')) {
            // Supprimer l'ancienne image si elle existe
            if ($grade->symbole && Storage::disk('public')->exists($grade->symbole)) {
                Storage::disk('public')->delete($grade->symbole);
            }

            $image = $request->file('symbole');
            $imageName = 'grade_' . Str::slug($request->niveau) . '_' . time() . '.' . $image->getClientOriginalExtension();
            $image->storeAs('grades', $imageName, 'public');
            $data['symbole'] = 'grades/' . $imageName;
        }

        $grade->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Grade mis à jour avec succès',
            'grade' => $grade
        ]);
    }

    /**
     * Supprimer un grade
     */
    public function destroy($id)
    {
        $grade = Grade::findOrFail($id);

        // Supprimer l'image du symbole si elle existe
        if ($grade->symbole && Storage::disk('public')->exists($grade->symbole)) {
            Storage::disk('public')->delete($grade->symbole);
        }

        $grade->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grade supprimé avec succès'
        ]);
    }

    /**
     * Obtenir les grades pour un select/dropdown
     */
    public function getForSelect()
    {
        $grades = Grade::orderBy('niveau', 'asc')->get(['id', 'niveau', 'designation', 'symbole']);
        
        return response()->json([
            'success' => true,
            'grades' => $grades
        ]);
    }

    /**
     * Obtenir la date de début selon la période
     *
     * @param string $period
     * @return \Carbon\Carbon
     */
    private function getStartDate($period)
    {
        $now = \Carbon\Carbon::now();
        
        switch ($period) {
            case 'day':
                return $now->startOfDay();
            case 'week':
                return $now->startOfWeek();
            case 'month':
                return $now->startOfMonth();
            case 'year':
                return $now->startOfYear();
            default:
                return $now->startOfMonth();
        }
    }

    /**
     * Récupérer l'historique d'attribution des grades avec filtres et statistiques
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getGradeHistory(Request $request)
    {
        \Log::info($request->all());
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Récupérer les paramètres de filtre
            $period = $request->input('period', 'month');
            $gradeId = $request->input('grade_id');
            $search = $request->input('search');
            $perPage = $request->input('per_page', 25);
            $page = $request->input('page', 1);

            // Obtenir la date de début selon la période
            $startDate = $this->getStartDate($period);
            $endDate = \Carbon\Carbon::now();

            // Si des dates manuelles sont fournies, elles prennent le dessus sur la période
            if ($request->input('start_date') && $request->input('end_date')) {
                $startDate = \Carbon\Carbon::parse($request->input('start_date'));
                $endDate = \Carbon\Carbon::parse($request->input('end_date'));
            }

            // Construire la requête avec les filtres
            $query = GradeHistory::with(['user:id,name,account_id,email', 'grade:id,niveau,designation'])
                ->dateRange($startDate, $endDate)
                ->searchUser($search)
                ->byGrade($gradeId)
                ->orderBy('created_at', 'desc');

            // Paginer les résultats
            $histories = $query->paginate($perPage, ['*'], 'page', $page);

            // Calculer les statistiques
            $stats = $this->calculateGradeStatistics($startDate, $endDate, $gradeId, $search);

            return response()->json([
                'success' => true,
                'data' => [
                    'histories' => $histories->items(),
                    'pagination' => [
                        'current_page' => $histories->currentPage(),
                        'last_page' => $histories->lastPage(),
                        'per_page' => $histories->perPage(),
                        'total' => $histories->total(),
                        'from' => $histories->firstItem(),
                        'to' => $histories->lastItem(),
                    ],
                    'statistics' => $stats,
                    'period' => [
                        'type' => $period,
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d')
                    ],
                    'date_range' => [
                        'start' => $startDate->format('Y-m-d H:i:s'),
                        'end' => $endDate->format('Y-m-d H:i:s'),
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::info($e->getMessage());
            \Log::info($e->getLine());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique des grades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer les statistiques des grades
     *
     * @param string|null $startDate
     * @param string|null $endDate
     * @param int|null $gradeId
     * @param string|null $search
     * @return array
     */
    private function calculateGradeStatistics($startDate, $endDate, $gradeId, $search)
    {
        try {
            $baseQuery = GradeHistory::with(['grade'])
            ->dateRange($startDate, $endDate)
            ->searchUser($search)
            ->byGrade($gradeId);

            // Statistiques générales
            $totalAttributions = $baseQuery->count();
            
            // Statistiques par grade
            $statsByGrade = GradeHistory::with(['grade'])
                ->dateRange($startDate, $endDate)
                ->searchUser($search)
                ->byGrade($gradeId)
                ->join('grades', 'grade_histories.grade_id', '=', 'grades.id')
                ->selectRaw('grades.niveau, grades.designation, COUNT(*) as count')
                ->groupBy('grades.id', 'grades.niveau', 'grades.designation')
                ->orderBy('grades.niveau', 'asc')
                ->get();

            // Statistiques par période (derniers 30 jours)
            $statsByPeriod = GradeHistory::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            // Grade le plus attribué
            $mostAttributedGrade = $statsByGrade->sortByDesc('count')->first();

            // Attribution aujourd'hui
            $todayAttributions = GradeHistory::whereDate('created_at', today())->count();

            return [
                'total_attributions' => $totalAttributions,
                'today_attributions' => $todayAttributions,
                'most_attributed_grade' => $mostAttributedGrade ? [
                    'niveau' => $mostAttributedGrade->niveau,
                    'designation' => $mostAttributedGrade->designation,
                    'count' => $mostAttributedGrade->count
                ] : null,
                'stats_by_grade' => $statsByGrade->map(function ($stat) use ($totalAttributions) {
                    return [
                        'niveau' => $stat->niveau,
                        'designation' => $stat->designation,
                        'count' => $stat->count,
                        'percentage' => $totalAttributions > 0 ? round(($stat->count / $totalAttributions) * 100, 2) : 0
                    ];
                }),
                'stats_by_period' => $statsByPeriod->map(function ($stat) {
                    return [
                        'date' => $stat->date,
                        'count' => $stat->count
                    ];
                }),
                'average_per_day' => $statsByPeriod->count() > 0 ? round($totalAttributions / 30, 2) : 0
            ];
        }catch (\Exception $e) {
            \Log::info($e->getMessage());
            \Log::info($e->getLine()); 
        }
    }

    /**
     * Exporter l'historique des grades en Excel
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function exportGradeHistory(Request $request)
    {
        try {
            $period = $request->input('period', 'month');
            $exportType = $request->input('export_type', 'all');
            $gradeId = $request->input('grade_id');
            $search = $request->input('search');
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 25);
            
            // Obtenir la date de début selon la période
            $startDate = $this->getStartDate($period);
            $endDate = \Carbon\Carbon::now();
            
            // Si des dates manuelles sont fournies, elles prennent le dessus sur la période
            if ($request->input('start_date') && $request->input('end_date')) {
                $startDate = \Carbon\Carbon::parse($request->input('start_date'));
                $endDate = \Carbon\Carbon::parse($request->input('end_date'));
            }
            
            // Construire la requête avec les filtres
            $query = GradeHistory::with(['user:id,name,account_id,email', 'grade:id,niveau,designation'])
                ->dateRange($startDate, $endDate)
                ->searchUser($search)
                ->byGrade($gradeId)
                ->orderBy('created_at', 'desc');
            
            // Appliquer les filtres selon le type d'export
            if ($exportType === 'current_page') {
                $query->offset(($page - 1) * $perPage)->limit($perPage);
            } elseif ($exportType === 'filtered') {
                // Garder les filtres actuels
            }
            // 'all' : pas de filtre supplémentaire
            
            $histories = $query->get();
            
            // Préparer les données pour Excel
            $headers = [
                'Date',
                'Utilisateur',
                'ID Compte',
                'Grade Niveau',
                'Grade Désignation'
            ];
            
            $rows = $histories->map(function ($history) {
                return [
                    \Carbon\Carbon::parse($history->created_at)->format('d/m/Y H:i'),
                    $history->user->name ?? 'N/A',
                    $history->user->account_id ?? 'N/A',
                    'Niv. ' . ($history->grade->niveau ?? 'N/A'),
                    $history->grade->designation ?? 'N/A'
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $rows
            ]);
            
        } catch (\Exception $e) {
            \Log::error("Erreur lors de l'export Excel: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}
