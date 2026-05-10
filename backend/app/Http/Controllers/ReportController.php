<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Signaler un statut social.
     */
    public function report(Request $request, $id)
    {
        \Log::info($request->all());
        $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'pub_type' => 'required',
            'pub_ref' => 'required',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string',
            'evidence' => 'nullable|image|max:4096',
        ]);

        // empêcher auto-signalement
        if ($request->reported_user_id == Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas vous signaler.'
            ], 422);
        }

        $path = null;

        if ($request->hasFile('evidence')) {
            $path = $request->file('evidence')
                ->store('reports', 'public');
        }

        $report = Report::create([
            'reporter_id' => Auth::id(),
            'reported_user_id' => $request->reported_user_id,
            'publication_type' => $request->pub_type,
            'publication_reference' => $request->pub_ref,
            'reason' => $request->reason,
            'description' => $request->description,
            'evidence' => $path,
        ]);

        return response()->json([
            'message' => 'Signalement envoyé.',
            'report' => $report
        ]);
    }
    
    /**
     * Obtenir les raisons de signalement disponibles.
     */
    public function getReportReasons()
    {
        $reasons = [
            'inappropriate_content' => 'Contenu inapproprié',
            'harassment' => 'Harcèlement',
            'false_information' => 'Fausse information',
            'hate_speech' => 'Discours haineux',
            'scam' => 'Escroquerie',
            'harassment' => 'Harcèlement',
            'spam' => 'Spam ou contenu commercial',
            'false_information' => 'Fausses informations',
            'hate_speech' => 'Discours haineux',
            'violence' => 'Violence ou contenu choquant',
            'intellectual_property' => 'Violation de propriété intellectuelle',
            'other' => 'Autre raison',
        ];

        return response()->json($reasons);
    }
    
    /**
     * Vérifier si l'utilisateur a déjà signalé ce compte et que ce signalement est en attente.
     */
    public function checkReported($id, $pub_ref)
    {
        $user = Auth::user();
        
        $report = Report::where('reported_user_id', $id)
            ->where('reporter_id', $user->id)
            ->where('publication_reference', $pub_ref)
            ->where('status', 'pending')
            ->first();
            
        return response()->json([
            'reported' => $report ? true : false,
            'report' => $report
        ]);
    }
}
