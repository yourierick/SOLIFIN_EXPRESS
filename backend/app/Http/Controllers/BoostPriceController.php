<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class BoostPriceController extends Controller
{
    /**
     * Récupère le prix du boost par jour selon la devise sélectionnée
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBoostPrice(Request $request)
    { 
        $user = auth()->user();
        $boostPercentage = $user->pack_de_publication->boost_percentage;
        
        $packPrice = $user->pack_de_publication->price ?? 0;
        
        $price = $packPrice * $boostPercentage / 100;
        
        return response()->json([
            'success' => true,
            'price' => $price,
            'pack_price_used' => $packPrice,
            'boost_percentage' => $boostPercentage
        ]);
    }
}
