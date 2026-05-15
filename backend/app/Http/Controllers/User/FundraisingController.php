<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Fundraising;
use App\Models\FundraisingLike;
use App\Models\FundraisingComment;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Services\CodeGenerationService;
use App\Models\WalletSystem;

class FundraisingController extends Controller
{
    const STATUS_COMPLETED = 'completed';

    /**
     * Récupérer tous les levés de fonds approuvés
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            $query = Fundraising::with(['user', 'page'])
                ->where('statut', 'publié')
                ->orderBy('created_at', 'desc');
            
            // Filtres
            if ($request->has('search') && !empty($request->get('search'))) {
                $searchTerm = $request->get('search');
                $query->where(function($q) use ($searchTerm) {
                    $q->where('titre', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('pub_reference', 'LIKE', '%' . $searchTerm . '%');
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 12);
            $fundraisings = $query->paginate($perPage);
            
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
                
                // Ajouter les statistiques
                $fundraising->likes_count = $fundraising->getLikesCount();
                $fundraising->comments_count = $fundraising->getCommentsCount();
                $fundraising->percentage_mobilise = $fundraising->getPercentageMobilise();
                $fundraising->is_liked = $fundraising->isLikedByUser(Auth::id());
                $fundraising->comments = FundraisingComment::where('fundraising_id', $fundraising->id)
                    ->with('user')
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(function($comment) {
                        $comment->user->profile_picture = $comment->user->picture ? asset('storage/' . $comment->user->picture) : null;
                        return $comment;
                    });


                return $fundraising;
            });

            return response()->json([
                'success' => true,
                'fundraisings' => $fundraisings
            ]);
        } catch (\Exception $e) {
            \Log::info($e->getMessage());
            \Log::info($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des levés de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les levés de fonds de l'utilisateur connecté
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function myFundraisings(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Fundraising::with(['page'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc');

            // Filtres
            if ($request->has('statut') && $request->get('statut') !== 'all') {
                $query->where('statut', $request->get('statut'));
            }

            // Recherche
            if ($request->has('search') && $request->get('search')) {
                $searchTerm = $request->get('search');
                $query->where(function($q) use ($searchTerm) {
                    $q->where('titre', 'LIKE', '%' . $searchTerm . '%')
                      ->orWhere('pub_reference', 'LIKE', '%' . $searchTerm . '%');
                });
            }

            $fundraisings = $query->paginate(10);
            
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
                
                $fundraising->likes_count = $fundraising->getLikesCount();
                $fundraising->comments_count = $fundraising->getCommentsCount();
                $fundraising->percentage_mobilise = $fundraising->getPercentageMobilise();
                
                return $fundraising;
            });

            return response()->json([
                'success' => true,
                'fundraisings' => $fundraisings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de vos levés de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouveau levé de fonds
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'titre' => 'required|string|max:255',
                'description' => 'required|string',
                'lien' => 'nullable|url|max:255',
                'cout_total' => 'required|numeric|min:0',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'video' => 'nullable|file|mimes:mp4,avi,mov,wmv|max:20480', // 20MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            // Vérifier si l'utilisateur a un pack de publication actif
            $packActif = false;
            if ($user->pack_de_publication_id) {
                $userPack = \App\Models\UserPack::where('user_id', $user->id)
                    ->where('pack_id', $user->pack_de_publication_id)
                    ->where('status', 'active')
                    ->first();
                $packActif = (bool) $userPack;
            }
            
            if (!$packActif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre pack de publication n\'est pas actif. Veuillez le réactiver pour publier.'
                ], 403);
            }

            DB::beginTransaction();
            
            // Récupérer ou créer la page de l'utilisateur
            $page = $user->page;
            if (!$page) {
                $page = Page::create([
                    'user_id' => $user->id,
                    'nombre_abonnes' => 0,
                    'nombre_likes' => 0
                ]);
            }
            
            $data = [];
            
            // Ajouter les champs obligatoires
            $data['page_id'] = $page->id;
            $data['user_id'] = $user->id;
            $data['statut'] = 'draft';
            $data['titre'] = $request->titre;
            $data['description'] = $request->description;
            $data['lien'] = $request->lien;
            $data['cout_total'] = $request->cout_total;

            // Calculer le gap
            if (isset($data['cout_total'])) {
                $data['gap'] = $data['cout_total']; // Au début, le gap est égal au coût total
            }

            // Traitement de l'image
            if ($request->hasFile('image') && $request->file('image')->isValid()) {
                $file = $request->file('image');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('fundraisings/images', $fileName, 'public');
                $data['image'] = $filePath;
            } elseif ($request->input('existing_image')) {
                // En mode édition, conserver l'image existante si aucune nouvelle n'est uploadée
                $data['image'] = $request->input('existing_image');
            }

            // Traitement de la vidéo
            if ($request->hasFile('video') && $request->file('video')->isValid()) {
                $file = $request->file('video');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('fundraisings/videos', $fileName, 'public');
                $data['video'] = $filePath;
            } elseif ($request->input('existing_video')) {
                // En mode édition, conserver la vidéo existante si aucune nouvelle n'est uploadée
                $data['video'] = $request->input('existing_video');
            }

            \Log::info('Données finales avant insertion:', $data);
            
            $fundraising = Fundraising::create($data);
            
            // Générer une référence unique
            $codeGenerationService = new CodeGenerationService();
            $fundraising->pub_reference = $codeGenerationService->generateUniquePubId($fundraising->id, 'FDR');
            $fundraising->save();
            
            DB::commit();

            if ($fundraising->user && $fundraising->user->picture) {
                $fundraising->user->picture_url = asset('storage/' . $fundraising->user->picture);
            }

            if ($fundraising->image) {
                $fundraising->image_url = asset('storage/' . $fundraising->image);
            }
            if ($fundraising->video) {
                $fundraising->video_url = asset('storage/' . $fundraising->video);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds créé avec succès. Il est en attente de validation.',
                'fundraising' => $fundraising
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de la création du levé de fonds: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur s\'est produite lors de la création du levé de fonds'
            ], 500);
        }
    }

    /**
     * Afficher un levé de fonds spécifique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $fundraising = Fundraising::with(['user', 'page', 'likes.user', 'comments.user'])
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
            $fundraising->is_liked = $fundraising->isLikedByUser(Auth::id());

            return response()->json([
                'success' => true,
                'fundraising' => $fundraising
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un levé de fonds
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        \Log::info($request->all());
        try {
            $fundraising = Fundraising::findOrFail($id);
            $user = Auth::user();

            // Vérifier si l'utilisateur est autorisé
            if ($fundraising->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à modifier ce levé de fonds.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'titre' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'lien' => 'nullable|url|max:255',
                'cout_total' => 'nullable|numeric|min:0',
                'mobilise' => 'nullable|numeric|min:0',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'video' => 'nullable|file|mimes:mp4,avi,mov,wmv|max:20480',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();
            $data = $request->all();
            
            // Traitement de l'image
            if ($request->hasFile('image') && $request->file('image')->isValid()) {
                // Supprimer l'ancienne image si elle existe
                if ($fundraising->image) {
                    Storage::disk('public')->delete($fundraising->image);
                }
                
                $file = $request->file('image');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('fundraisings/images', $fileName, 'public');
                $data['image'] = $filePath;
            }
            // Gestion de la suppression de l'image
            elseif ($request->has('remove_image') && $request->input('remove_image') == '1') {
                if ($fundraising->image) {
                    Storage::disk('public')->delete($fundraising->image);
                }
                $data['image'] = null;
            }

            // Traitement de la vidéo
            if ($request->hasFile('video') && $request->file('video')->isValid()) {
                // Supprimer l'ancienne vidéo si elle existe
                if ($fundraising->video) {
                    Storage::disk('public')->delete($fundraising->video);
                }
                
                $file = $request->file('video');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('fundraisings/videos', $fileName, 'public');
                $data['video'] = $filePath;
            }
            // Gestion de la suppression de la vidéo
            elseif ($request->has('remove_video') && $request->input('remove_video') == '1') {
                if ($fundraising->video) {
                    Storage::disk('public')->delete($fundraising->video);
                }
                $data['video'] = null;
            }
            
            // Recalculer le gap si les montants sont modifiés
            if (isset($data['cout_total']) || isset($data['mobilise'])) {
                $cout_total = $data['cout_total'] ?? $fundraising->cout_total;
                $mobilise = $data['mobilise'] ?? $fundraising->mobilise;
                $data['gap'] = $cout_total - $mobilise;
            }
            
            $fundraising->update($data);
            
            DB::commit();

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
            
            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds mis à jour avec succès.',
                'fundraising' => $fundraising
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de la mise à jour du levé de fonds: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur s\'est produite lors de la mise à jour du levé de fonds'
            ], 500);
        }
    }

    /**
     * Publier un projet pour lever des fonds
     */
    public function publish(Request $request, $id)
    {
        $fundraising = Fundraising::findOrFail($id);
        $fundraising->statut = "publié";
        $fundraising->save();

        return response()->json([
            'success'=>true,
            'message'=>"Projet publié avec succès",
            'fundraising'=>$fundraising
        ]);
    }

    /**
     * Supprimer un levé de fonds
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $fundraising = Fundraising::findOrFail($id);
            $user = Auth::user();

            // Vérifier si l'utilisateur est autorisé
            if ($fundraising->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à supprimer ce levé de fonds.'
                ], 403);
            }

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
                'message' => 'Levé de fonds supprimé avec succès.'
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
     * Liker un levé de fonds
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function like($id)
    {
        try {
            $user = Auth::user();
            $fundraising = Fundraising::findOrFail($id);
            
            // Vérifier si l'utilisateur a déjà liké ce levé de fonds
            $existingLike = FundraisingLike::where('user_id', $user->id)
                ->where('fundraising_id', $id)
                ->first();
                
            if ($existingLike) {
                // Si l'utilisateur a déjà liké, on supprime le like (unlike)
                $existingLike->delete();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Like retiré avec succès.',
                    'liked' => false,
                    'likes_count' => $fundraising->likes()->count()
                ]);
            }
            
            // Créer un nouveau like
            FundraisingLike::create([
                'user_id' => $user->id,
                'fundraising_id' => $id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Levé de fonds liké avec succès.',
                'liked' => true,
                'likes_count' => $fundraising->likes()->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du like du levé de fonds',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Commenter un levé de fonds
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function comment(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'contenu' => 'required|string|max:1000',
                'parent_id' => 'nullable|exists:fundraising_comments,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $user = Auth::user();
            $fundraising = Fundraising::findOrFail($id);
            
            $comment = FundraisingComment::create([
                'user_id' => $user->id,
                'fundraising_id' => $id,
                'contenu' => $request->contenu,
                'parent_id' => $request->parent_id
            ]);
            
            // Charger les relations pour la réponse
            $comment->load('user');
            
            return response()->json([
                'success' => true,
                'message' => 'Commentaire ajouté avec succès.',
                'comment' => $comment,
                'comments_count' => $fundraising->comments()->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du commentaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les commentaires d'un levé de fonds
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getComments($id)
    {
        try {
            $fundraising = Fundraising::findOrFail($id);
            
            // Récupérer uniquement les commentaires parents (pas les réponses)
            $comments = FundraisingComment::with(['user', 'replies.user'])
                ->where('fundraising_id', $id)
                ->whereNull('parent_id')
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json([
                'success' => true,
                'comments' => $comments,
                'comments_count' => $fundraising->comments()->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des commentaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un commentaire
     *
     * @param  int  $commentId
     * @return \Illuminate\Http\Response
     */
    public function deleteComment($commentId)
    {
        try {
            $user = Auth::user();
            $comment = FundraisingComment::findOrFail($commentId);
            
            // Vérifier si l'utilisateur est autorisé à supprimer ce commentaire
            if ($comment->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à supprimer ce commentaire.'
                ], 403);
            }
            
            $fundraisingId = $comment->fundraising_id;
            $fundraising = Fundraising::findOrFail($fundraisingId);
            
            // Supprimer également toutes les réponses à ce commentaire
            $comment->replies()->delete();
            $comment->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Commentaire supprimé avec succès.',
                'comments_count' => $fundraising->comments()->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du commentaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Financer un levé de fonds
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function finance(Request $request, $id)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01'
            ]);

            $fundraising = Fundraising::findOrFail($id);
            $beneficiaire = $fundraising->user;
            $user = Auth::user();
            $amount = $request->input('amount');

            // Vérifier que le montant ne dépasse pas le reste à financer
            if ($amount > $fundraising->gap) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant ne peut pas dépasser le reste à financer'
                ], 400);
            }

            //Si le portefeuille de l'utilisateur est désactivé, retourner la réponse correspondante
            if (!$user->wallet->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre portefeuille a été désactivé, veuillez contacter le service support pour sa réactivation',
                ]);
            }

            // Récupérer les frais de transfert
            $feePercentage = \App\Models\Setting::where('key', 'transfer_fee_percentage')->first()?->value ?? 0;
            $transferFee = ($amount * $feePercentage) / 100;
            $totalAmount = $amount + $transferFee;

            // Vérifier que l'utilisateur a assez dans son wallet (montant + frais)
            if ($user->wallet->available_balance < $totalAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant dans votre portefeuille pour couvrir le montant et les frais'
                ], 400);
            }

            // Créer la transaction de financement
            DB::beginTransaction();

            // Préparer les métadonnées pour l'expéditeur
            $senderMetadata = [
                "Bénéficiaire" => $beneficiaire->name,
                "Opération" => "Transfert des fonds",
                "Montant" => number_format($request->amount, 2) . "$",
                "Frais de transaction" => number_format($transferFee, 2) . "$",
                "Déscription" => "Vous avez financé le projet " . $fundraising->titre . " de Mr/Mme " . $beneficiaire->name . " à hauteur de " . number_format($request->amount, 2) . "$",
            ];

            // Déduire le montant total du wallet de l'utilisateur
            $transaction = $user->wallet->withdrawFunds(
                $totalAmount, 
                number_format($transferFee, 2),
                0,
                "internal",
                "funds_transfer", 
                self::STATUS_COMPLETED,
                "Vous avez effectué un transfert des fonds de " . $request->amount . "$ à " . $beneficiaire->name,
                $user->id, 
                $senderMetadata
            );

            //Crédit du destinataire
            // Préparer les métadonnées pour le destinataire
            $recipientMetadata = [
                "Opération" => "Dépôt des fonds",
                "Expéditeur" => $user->name . ' / ' . $user->account_id,
                "Montant" => number_format($request->amount, 2) . " $",
                "Transaction source" => $transaction->reference,
                "Déscription" => "Vous avez reçu un financement de " . number_format($request->amount, 2) . " $ de Mr/Mme" . $user->name . " pour votre projet " . $fundraising->titre
            ];

            $beneficiaire->wallet->addFunds(
                $request->amount, 
                0,
                0,
                "funds_receipt", 
                self::STATUS_COMPLETED, 
                "Vous avez reçu un dépôt des fonds de " . $request->amount . " $ de " . $user->name,
                $user->id,
                $recipientMetadata
            );

            // Enregistrer la commission système
            $systemMetadata = [
                "Opération" => "Commission solifin sur le transfert",
                "Emetteur" => $user->name . ' / ' . $user->account_id,
                "Bénéficiaire" => $beneficiaire->name . ' / ' . $beneficiaire->account_id, 
                "Montant net transféré" => number_format($request->amount, 2) . "$",
                "Transaction source" => "Transaction utilisateur - " . $transaction->reference,
                "Déscription" => "Vous avez reçu une commission de " . number_format($transferFee, 2) . " $ sur le transfert 
                effectué par " . $user->name . " à " . $beneficiaire->name . " d'un montant de " . $request->amount . " $ pour financement du projet de ce dernier intitulé " . $fundraising->titre, 
            ];

            $systemwallet = WalletSystem::first();
            $systemwallet->addProfits(
                $transferFee,
                'transfer_commission',
                self::STATUS_COMPLETED,
                "Vous avez reçu une commission de transfert d'un montant de " . $transferFee . " $",
                $user->id,
                $systemMetadata,
            );

            // Ajouter uniquement le montant de financement (sans frais) au montant mobilisé
            $fundraising->mobilise += $amount;
            $fundraising->gap -= $amount;
            $fundraising->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Financement effectué avec succès',
                'data' => [
                    'new_mobilised_amount' => $fundraising->mobilise,
                    'new_gap' => $fundraising->gap,
                    'user_balance' => $user->wallet->available_balance,
                    'transfer_fee' => $transferFee,
                    'total_deducted' => $totalAmount
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors du financement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du financement',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
