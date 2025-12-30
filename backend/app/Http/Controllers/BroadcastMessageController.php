<?php

namespace App\Http\Controllers;

use App\Models\BroadcastMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BroadcastMessageController extends Controller
{
    /**
     * Récupérer les messages publiés non vus par l'utilisateur connecté.
     *
     * @return \Illuminate\Http\Response
     */
    public function getUnseenMessages()
    {
        $user = Auth::user();
        
        if ($user->is_admin) {
            return response()->json([
                'data' => []
            ]);
        }
        
        // Récupérer les messages actifs (status = true)
        $messages = BroadcastMessage::where('status', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Filtrer les messages selon les destinataires, le statut de l'utilisateur et s'ils ne sont pas encore vus
        $filteredMessages = $messages->filter(function ($message) use ($user) {
            return $this->shouldUserSeeMessage($message, $user) 
                && !$message->isSeenByUser($user->id);
        });
        
        return response()->json([
            'data' => $filteredMessages->values()
        ]);
    }

    /**
     * Vérifier si un utilisateur doit voir un message spécifique
     *
     * @param  \App\Models\BroadcastMessage  $message
     * @param  \App\Models\User  $user
     * @return bool
     */
    private function shouldUserSeeMessage($message, $user)
    {
        switch ($message->target_type) {
            case 'all':
                return true;
            case 'subscribed':
                return $user->status === 'active';
            case 'unsubscribed':
                return $user->status === 'trial';
            case 'specific_user':
                return $message->target_users && in_array($user->id, $message->target_users);
            case 'pack':
                // Vérifier si l'utilisateur possède au moins un des packs ciblés
                if (!$message->target_packs || !is_array($message->target_packs)) {
                    return false;
                }
                
                // Récupérer les packs actifs de l'utilisateur via la table user_packs
                $userPackIds = $user->packs()
                    ->wherePivot('payment_status', 'completed') // Seulement les packs payés
                    // ->wherePivot('status', 'active') // Seulement les packs actifs
                    ->pluck('pack_id')
                    ->toArray();
                
                // Vérifier s'il y a une intersection entre les packs de l'utilisateur et les packs ciblés
                return !empty(array_intersect($message->target_packs, $userPackIds));
            default:
                return true;
        }
    }

    /**
     * Marquer un message comme vu par l'utilisateur connecté.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function markAsSeen($id)
    {
        $user = Auth::user();
        $message = BroadcastMessage::findOrFail($id);
        
        $message->markAsSeenByUser($user->id);
        
        return response()->json([
            'message' => 'Message marqué comme vu'
        ]);
    }

    /**
     * Vérifier si de nouveaux messages sont disponibles (pour le polling).
     *
     * @return \Illuminate\Http\Response
     */
    public function checkNewMessages()
    {
        $user = Auth::user();
        
        // Récupérer les messages actifs
        $messages = BroadcastMessage::where('status', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Filtrer selon les destinataires et le statut de l'utilisateur
        $filteredMessages = $messages->filter(function ($message) use ($user) {
            return $this->shouldUserSeeMessage($message, $user);
        });
        
        // Compter les messages non vus (ici on simplifie, vous pouvez ajouter la logique des messages vus)
        $count = $filteredMessages->count();
        
        return response()->json([
            'has_new_messages' => $count > 0,
            'count' => $count
        ]);
    }
}
