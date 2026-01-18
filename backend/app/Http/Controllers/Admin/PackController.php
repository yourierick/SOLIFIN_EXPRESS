<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pack;
use App\Models\User;
use App\Models\CommissionRate;
use App\Models\Commission;
use App\Models\UserPack;
use App\Models\BonusRates;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;


#[\Illuminate\Routing\Middleware\Authenticate]
#[\App\Http\Middleware\AdminMiddleware]
class PackController extends Controller
{
    public function index()
    {
        try {
            $packs = Pack::all();
            
            return response()->json([
                'success' => true,
                'packs' => $packs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les statistiques détaillées d'un pack admin
     * 
     * @param Request $request
     * @param int $id ID du pack
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetailedPackStats(Request $request, $id)
    {
        try {
            $userpack = UserPack::with('pack')->find($id);
            $pack = $userpack->pack;
            
            $userId = Auth::user()->id;
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID utilisateur requis'
                ], 400);
            }
            
            $user = User::findOrFail($userId);
            
            $userPack = UserPack::where('user_id', $userId)
                ->where('pack_id', $pack->id)
                ->first();

            if (!$userPack) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pack non trouvé pour cet utilisateur'
                ], 404);
            }

            // Récupérer tous les filleuls (toutes générations confondues)
            $allReferrals = [];
            $totalReferralsCount = 0;
            $referralsByGeneration = [0, 0, 0, 0]; // Compteur pour chaque génération
            $commissionsByGenerationUSD = [0, 0, 0, 0]; // Commissions USD pour chaque génération
            $commissionsByGenerationCDF = [0, 0, 0, 0]; // Commissions CDF pour chaque génération
            $activeReferralsCount = 0;
            $inactiveReferralsCount = 0;
            $totalCommissionUSD = 0;
            $totalCommissionCDF = 0;
            $failedCommissionUSD = 0;
            $failedCommissionCDF = 0;

            // Récupérer les filleuls de première génération
            $firstGenReferrals = UserPack::with(['user', 'pack'])
                ->where('sponsor_id', $userId)
                ->where('pack_id', $pack->id)
                ->get();

            $referralsByGeneration[0] = $firstGenReferrals->count();
            $totalReferralsCount += $referralsByGeneration[0];
            
            // Compter les actifs/inactifs de première génération
            foreach ($firstGenReferrals as $referral) {
                if ($referral->status === 'active') {
                    $activeReferralsCount++;
                } else {
                    $inactiveReferralsCount++;
                }
                
                // Ajouter à la liste complète des filleuls
                $allReferrals[] = [
                    'id' => $referral->user->id,
                    'name' => $referral->user->name,
                    'generation' => 1,
                    'purchase_date' => $referral->purchase_date,
                    'expiry_date' => $referral->expiry_date,
                    'status' => $referral->status,
                    'pack_name' => $referral->pack->name
                ];
            }

            // Récupérer les commissions de première génération
            $gen1Commissions = Commission::where('user_id', $userId)
                ->where('pack_id', $pack->id)
                ->where('level', 1)
                ->get();
                
            $commissionsByGenerationUSD[0] = $gen1Commissions->where('status', 'completed')->where('currency', 'USD')->sum('amount');
            $commissionsByGenerationCDF[0] = $gen1Commissions->where('status', 'completed')->where('currency', 'CDF')->sum('amount');
            $totalCommissionUSD += $commissionsByGenerationUSD[0];
            $totalCommissionCDF += $commissionsByGenerationCDF[0];
            $failedCommissionUSD += $gen1Commissions->where('status', 'failed')->where('currency', 'USD')->sum('amount');
            $failedCommissionCDF += $gen1Commissions->where('status', 'failed')->where('currency', 'CDF')->sum('amount');

            // Récupérer les filleuls et commissions des générations 2 à 4
            $currentGenReferrals = $firstGenReferrals->pluck('user_id')->toArray();
            
            for ($generation = 2; $generation <= 4; $generation++) {
                $nextGenReferrals = [];
                
                foreach ($currentGenReferrals as $sponsorId) {
                    $referrals = UserPack::with(['user', 'pack'])
                        ->where('sponsor_id', $sponsorId)
                        ->where('pack_id', $pack->id)
                        ->get();
                        
                    foreach ($referrals as $referral) {
                        $nextGenReferrals[] = $referral->user_id;
                        
                        // Compter par statut
                        if ($referral->status === 'active') {
                            $activeReferralsCount++;
                        } else {
                            $inactiveReferralsCount++;
                        }
                        
                        // Ajouter à la liste complète des filleuls
                        $allReferrals[] = [
                            'id' => $referral->user->id,
                            'name' => $referral->user->name,
                            'generation' => $generation,
                            'purchase_date' => $referral->purchase_date,
                            'expiry_date' => $referral->expiry_date,
                            'status' => $referral->status,
                            'pack_name' => $referral->pack->name
                        ];
                    }
                    
                    $referralsByGeneration[$generation-1] += $referrals->count();
                    $totalReferralsCount += $referrals->count();
                }
                
                // Récupérer les commissions pour cette génération
                $genCommissions = Commission::where('user_id', $userId)
                    ->where('pack_id', $pack->id)
                    ->where('level', $generation)
                    ->get();
                    
                $commissionsByGenerationUSD[$generation-1] = $genCommissions->where('status', 'completed')->where('currency', 'USD')->sum('amount');
                $commissionsByGenerationCDF[$generation-1] = $genCommissions->where('status', 'completed')->where('currency', 'CDF')->sum('amount');
                $totalCommissionUSD += $commissionsByGenerationUSD[$generation-1];
                $totalCommissionCDF += $commissionsByGenerationCDF[$generation-1];
                $failedCommissionUSD += $genCommissions->where('status', 'failed')->where('currency', 'USD')->sum('amount');
                $failedCommissionCDF += $genCommissions->where('status', 'failed')->where('currency', 'CDF')->sum('amount');
                
                $currentGenReferrals = $nextGenReferrals;
            }

            // Récupérer les données pour les graphiques d'évolution
            $sixMonthsAgo = now()->subMonths(6);
            
            // Inscriptions mensuelles
            $monthlySignups = [];
            for ($i = 0; $i < 6; $i++) {
                $month = now()->subMonths($i);
                $count = collect($allReferrals)
                    ->filter(function ($referral) use ($month) {
                        return $referral['purchase_date'] && 
                               date('Y-m', strtotime($referral['purchase_date'])) === $month->format('Y-m');
                    })
                    ->count();
                    
                $monthlySignups[$month->format('Y-m')] = $count;
            }
            
            // Commissions mensuelles
            $monthlyCommissionsUSD = [];
            $monthlyCommissionsCDF = [];
            for ($i = 0; $i < 6; $i++) {
                $month = now()->subMonths($i);
                $startOfMonth = $month->copy()->startOfMonth();
                $endOfMonth = $month->copy()->endOfMonth();
                
                $amountUSD = Commission::where('user_id', $userId)
                    ->where('pack_id', $pack->id)
                    ->where('status', 'completed')
                    ->where('currency', 'USD')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');
                    
                $amountCDF = Commission::where('user_id', $userId)
                    ->where('pack_id', $pack->id)
                    ->where('status', 'completed')
                    ->where('currency', 'CDF')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');
                    
                $monthlyCommissionsUSD[$month->format('Y-m')] = $amountUSD;
                $monthlyCommissionsCDF[$month->format('Y-m')] = $amountCDF;
            }
            
            // Trouver le top filleul (celui qui a recruté le plus de personnes)
            $topReferral = null;
            $maxRecruits = 0;
            
            foreach ($firstGenReferrals as $referral) {
                $recruitCount = UserPack::where('sponsor_id', $referral->user_id)
                    ->where('pack_id', $pack->id)
                    ->count();
                    
                if ($recruitCount > $maxRecruits) {
                    $maxRecruits = $recruitCount;
                    
                    // Calculer les commissions générées par ce referral
                    $referralCommissionsUSD = Commission::where('user_id', $userId)
                        ->where('pack_id', $pack->id)
                        ->where('source_user_id', $referral->user_id)
                        ->where('currency', 'USD')
                        ->where('status', 'completed')
                        ->sum('amount');
                        
                    $referralCommissionsCDF = Commission::where('user_id', $userId)
                        ->where('pack_id', $pack->id)
                        ->where('source_user_id', $referral->user_id)
                        ->where('currency', 'CDF')
                        ->where('status', 'completed')
                        ->sum('amount');
                    
                    $topReferral = [
                        'id' => $referral->user->id,
                        'name' => $referral->user->name,
                        'recruit_count' => $recruitCount,
                        'commission_usd' => $referralCommissionsUSD,
                        'commission_cdf' => $referralCommissionsCDF
                    ];
                }
            }

            // Récupérer les derniers paiements reçus
            $latestPayments = Commission::with('source_user')
                ->where('user_id', $userId)
                ->where('pack_id', $pack->id)
                ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($commission) {
                    return [
                        'id' => $commission->id,
                        'amount' => $commission->amount,
                        'currency' => $commission->currency,
                        'date' => $commission->created_at->format('d/m/Y'),
                        'source' => $commission->source_user->name ?? 'Inconnu',
                        'status' => $commission->status,
                        'level' => $commission->level
                    ];
                });

            // Modifier la structure des données pour les filleuls (limité à 10)
            $latestReferrals = collect($allReferrals)
                ->sortByDesc('purchase_date')
                ->take(10)
                ->map(function ($referral) {
                    $validityMonths = $referral['purchase_date'] && $referral['expiry_date'] 
                        ? $referral['purchase_date']->diffInMonths($referral['expiry_date'])
                        : 0;
                    
                    return [
                        'id' => $referral['id'],
                        'name' => $referral['name'],
                        'generation' => $referral['generation'],
                        'pack_name' => $referral['pack_name'],
                        'purchase_date' => $referral['purchase_date'] ? $referral['purchase_date']->format('d/m/Y') : 'N/A',
                        'expiry_date' => $referral['expiry_date'] ? $referral['expiry_date']->format('d/m/Y') : 'N/A',
                        'validity_months' => $validityMonths,
                        'status' => $referral['status']
                    ];
                })
                ->values()
                ->toArray();

            // Modifier la structure pour tous les filleuls
            $allReferrals = collect($allReferrals)
                ->map(function ($referral) {
                    $validityMonths = $referral['purchase_date'] && $referral['expiry_date'] 
                        ? $referral['purchase_date']->diffInMonths($referral['expiry_date'])
                        : 0;
                    
                    return [
                        'id' => $referral['id'],
                        'name' => $referral['name'],
                        'generation' => $referral['generation'],
                        'pack_name' => $referral['pack_name'],
                        'purchase_date' => $referral['purchase_date'] ? $referral['purchase_date']->format('d/m/Y') : 'N/A',
                        'expiry_date' => $referral['expiry_date'] ? $referral['expiry_date']->format('d/m/Y') : 'N/A',
                        'validity_months' => $validityMonths,
                        'status' => $referral['status']
                    ];
                })
                ->values()
                ->toArray();
           
            return response()->json([
                'success' => true,
                'data' => [
                    'general_stats' => [
                        'total_referrals' => $totalReferralsCount,
                        'referrals_by_generation' => $referralsByGeneration,
                        'active_referrals' => $activeReferralsCount,
                        'inactive_referrals' => $inactiveReferralsCount,
                        'total_commission_usd' => $totalCommissionUSD,
                        'total_commission_cdf' => $totalCommissionCDF,
                        'failed_commission_usd' => $failedCommissionUSD,
                        'failed_commission_cdf' => $failedCommissionCDF,
                        'commissions_by_generation_usd' => $commissionsByGenerationUSD,
                        'commissions_by_generation_cdf' => $commissionsByGenerationCDF,
                    ],
                    'progression' => [
                        'monthly_signups' => $monthlySignups,
                        'monthly_commissions_usd' => $monthlyCommissionsUSD,
                        'monthly_commissions_cdf' => $monthlyCommissionsCDF,
                        'top_referral' => $topReferral
                    ],
                    'latest_referrals' => $latestReferrals,
                    'financial_info' => [
                        'total_commission_usd' => $totalCommissionUSD,
                        'total_commission_cdf' => $totalCommissionCDF,
                        'latest_payments' => $latestPayments
                    ],
                    'all_referrals' => $allReferrals,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des statistiques détaillées: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques détaillées: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'categorie' => ['required'],
                'name' => ['required', 'max:255', 'string', Rule::unique('packs')],
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'cdf_price'=>'nullable|numeric|min:0',
                'status' => 'required|boolean',
                'avantages' => 'required|json',
                'duree_publication_en_jour' => 'required|numeric|min:1',
                'abonnement' => 'required|string|in:mensuel,trimestriel,semestriel,annuel,triennal,quinquennal',
                'boost_percentage' => 'required|numeric|min:0|max:100',
            ]);

            if ($request->peux_publier_formation === "1") {
                $request->peux_publier_formation = true;
            }else {
                $request->peux_publier_formation = false;   
            }

            // Créer le pack
            $pack = Pack::create([
                'categorie' => $validated['categorie'],
                'name' => $validated['name'],
                'description' => $validated['description'],
                'price' => $validated['price'],
                'cdf_price' => $validated['cdf_price'],
                'status' => $request->boolean('status'),
                'avantages' => json_decode($request->avantages, true),
                'duree_publication_en_jour' => $validated['duree_publication_en_jour'],
                'abonnement' => $validated['abonnement'],
                'peux_publier_formation' => $request->boolean('peux_publier_formation'),
                'boost_percentage' => $validated['boost_percentage'],
            ]);

            //Attribuer automatiquement le pack aux super-administrateurs
            $superAdmins = User::whereHas('roleRelation', function ($query) {
                $query->where('slug', '=', 'super-admin');
            })->get();
            
            foreach ($superAdmins as $admin) {
                $referralLetter = substr($pack->name, 0, 1);
                $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $referralCode = 'SPR' . $referralLetter . $referralNumber;

                // Vérifier que le code est unique
                while (UserPack::where('referral_code', $referralCode)->exists()) {
                    $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                    $referralCode = 'SPR' . $referralLetter . $referralNumber;
                }

                // Récupérer l'URL du frontend depuis le fichier .env
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

                // Créer le lien de parrainage en utilisant l'URL du frontend
                $referralLink = $frontendUrl . "/register?referral_code=" . $referralCode;

                $admin->packs()->attach($pack->id, [
                    'status' => 'active',
                    'purchase_date' => now(),
                    'expiry_date' => null, // Durée illimitée pour les admins
                    'is_admin_pack' => true,
                    'payment_status' => 'completed',
                    'referral_prefix' => 'SPR',
                    'referral_pack_name' => $pack->name,
                    'referral_letter' => $referralLetter,
                    'referral_number' => $referralNumber,
                    'referral_code' => $referralCode,
                    'link_referral' => $referralLink,
                ]);
            }

            //Créer définir les taux de commission à zéro pour ce pack créé
            for ($i = 1; $i <= 4; $i++) {
                $commissionrate = CommissionRate::create([
                    'pack_id' => $pack->id,
                    'level' => $i,
                    'rate' => 0, 
                ]);
            }


            return response()->json([
                'success' => true,
                'message' => 'Pack créé avec succès',
                'data' => $pack
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur dans PackController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création du pack'
            ], 500);
        }
    }

    public function show(Pack $pack)
    {
        return response()->json([
            'success' => true,
            'data' => $pack
        ]);
    }

    public function update(Request $request, Pack $pack)
    {
        $validator = Validator::make($request->all(), [
            'categorie' => 'required',
            'duree_publication_en_jour' => 'required|numeric|min:1',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'cdf_price'=> 'nullable|numeric|min:0',
            'status' => 'required|boolean',
            'avantages' => 'required|json',
            'abonnement' => 'required|string|in:mensuel,trimestriel,semestriel,annuel,triennal,quinquennal',
            'peux_publier_formation' => 'required|boolean',
            'boost_percentage' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $pack->update([
                'categorie' => $request->categorie,
                'duree_publication_en_jour' => $request->duree_publication_en_jour,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'cdf_price' => $request->cdf_price ?? null,
                'status' => filter_var($request->status, FILTER_VALIDATE_BOOLEAN),
                'avantages' => $request->avantages,
                'abonnement' => $request->abonnement,
                'peux_publier_formation' => filter_var($request->peux_publier_formation, FILTER_VALIDATE_BOOLEAN),
                'boost_percentage' => $request->boost_percentage,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack mis à jour avec succès',
                'data' => $pack
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour du pack'
            ], 500);
        }
    }

    public function destroy(Pack $pack)
    {
        try {
            DB::beginTransaction();

            $pack->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du pack'
            ], 500);
        }
    }

    public function toggleStatus(Pack $pack)
    {
        try {
            $pack->update([
                'status' => !$pack->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Statut du pack mis à jour avec succès',
                'data' => $pack
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour du statut'
            ], 500);
        }
    }

    public function updateCommissionRate(Request $request, $packId)
    {
        $request->validate([
            'level' => 'required|integer|between:1,4',
            'commission_rate' => 'required|numeric|min:0|max:100'
        ]);

        $pack = Pack::findOrFail($packId);
        
        // Mettre à jour ou créer le taux de commission pour le niveau spécifié
        CommissionRate::updateOrCreate(
            [
                'pack_id' => $packId,
                'level' => $request->level
            ],
            ['rate' => $request->commission_rate]
        );

        return response()->json(['message' => 'Taux de commission mis à jour avec succès']);
    }

    public function getCommissionRates($packId)
    {
        $commissionRates = CommissionRate::where('pack_id', $packId)
            ->orderBy('level')
            ->get();

        // Assurer que nous avons les 4 niveaux, même si certains n'existent pas encore
        $rates = [];
        for ($i = 1; $i <= 4; $i++) {
            $rate = $commissionRates->firstWhere('level', $i);
            $rates[$i] = $rate ? $rate->rate : 0;
        }

        return response()->json(['rates' => $rates]);
    }

    public function getBonusRates($packId)
    {
        $bonusRates = BonusRates::where('pack_id', $packId)->get();
        
        return response()->json([
            'success' => true,
            'bonusRates' => $bonusRates
        ]);
    }

    public function storeBonusRate(Request $request, $packId)
    {  
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required',
                'nombre_filleuls' => 'required|integer|min:1',
                'points_attribues' => 'required|integer|min:1',
                'valeur_point' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $pack = Pack::findOrFail($packId);
            
            // Vérifier si une configuration du même type existe déjà pour ce pack
            $existingBonus = BonusRates::where('pack_id', $packId)
                ->where('type', $request->type)
                ->first();
                
            if ($existingBonus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une configuration de jetons Esengo existe déjà pour ce pack'
                ], 422);
            }
            
            DB::beginTransaction();

            $bonusRate = BonusRates::create([
                'pack_id' => $packId,
                'type' => $request->type,
                'frequence' => "weekly",
                'nombre_filleuls' => $request->nombre_filleuls, //Seuil de filleuls pour avoir de jeton Esengo
                'points_attribues' => $request->points_attribues, //Nombre de jetons Esengo attribués
                'valeur_point' => $request->valeur_point, //Nombre de points attribués par obtention de ce jeton
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bonus ajouté avec succès',
                'bonusRate' => $bonusRate
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création du bonus rate'
            ], 500);
        } 
    }

    public function deleteBonusRate($id)
    {
        $bonusRate = BonusRates::findOrFail($id);
        $bonusRate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bonus supprimé avec succès'
        ]);
    }
    
    /**
     * Récupère les packs administrateurs avec leurs codes de parrainage
     * Cette API est utilisée pour afficher les codes sponsors disponibles lors de l'inscription
     * Supporte le filtrage par pack_id pour récupérer des codes spécifiques
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAdminPacks(Request $request)
    {
        try {
            // Récupérer les utilisateurs administrateurs
            $superadminrole = Role::where('slug', 'super-admin')->first();
            $admins = User::where('is_admin', true)->where('role_id', $superadminrole->id)->pluck('id');
            
            // Construire la requête de base
            $query = UserPack::whereIn('user_id', $admins)
                ->where('is_admin_pack', true)
                ->where('user_packs.status', 'active') // Spécifier explicitement la table pour éviter l'ambigüïté
                ->join('packs', 'user_packs.pack_id', '=', 'packs.id')
                ->where('packs.status', true) // Seulement les packs actifs
                ->select(
                    'packs.id as pack_id',
                    'packs.name',
                    'packs.description',
                    'packs.categorie',
                    'user_packs.referral_code',
                    'user_packs.user_id as admin_user_id'
                );
            
            // Filtrer par pack_id si spécifié
            if ($request->has('pack_id') && !empty($request->pack_id)) {
                $query->where('packs.id', $request->pack_id);
            }
            
            // Récupérer les packs administrateurs
            $adminPacks = $query->get();
            
            return response()->json([
                'success' => true,
                'packs' => $adminPacks,
                'filtered_by_pack_id' => $request->has('pack_id') ? $request->pack_id : null
            ]);
        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs administrateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}