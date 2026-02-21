<?php

namespace App\Services;

use App\Models\UserPack;
use Dompdf\Dompdf;
use Carbon\Carbon;

class InvoiceService
{
    /**
     * Génère une facture PDF pour un achat de pack
     *
     * @param UserPack $userPack
     * @param int $durationMonths
     * @return \Dompdf\Dompdf
     */
    public function generatePackInvoice(UserPack $userPack, int $durationMonths, array $metadata)
    {
        $user = $userPack->user;
        $pack = $userPack->pack;
        $pack_price = $metadata['currency'] === 'USD' ? $pack->price : $pack->cdf_price;
        
        $data = [
            'invoiceNumber' => 'INV-' . str_pad($userPack->id, 6, '0', STR_PAD_LEFT),
            'invoiceDate' => Carbon::now()->format('d/m/Y'),
            'dueDate' => Carbon::now()->format('d/m/Y'),
            'customer' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? 'N/A',
            ],
            'company' => [
                'name' => 'SOLIFIN',
                'address' => '123 Avenue de la Gombe, Kinshasa, RD Congo',
                'phone' => '+243 81 82 92 210',
                'email' => 'solifin2025@yahoo.com',
                'website' => 'solifinexpress.com',
                'rccm' => 'RCCM/CD/KIN/123456',
                'idnat' => 'IDNAT/123456789',
            ],
            'items' => [
                [
                    'description' => 'Pack ' . $pack->name,
                    'quantity' => $durationMonths,
                    'unit_price' => $pack_price,
                    'total' => $pack_price * $durationMonths,
                    'currency' => $metadata['currency'] === 'USD' ? '$' : 'FC',
                ]
            ],
            'subscription' => [
                'start_date' => Carbon::now()->format('d/m/Y'),
                'end_date' => $userPack->expiry_date->format('d/m/Y'),
                'duration' => $durationMonths . ' mois',
            ],
            'totals' => [
                'subtotal' => ($pack_price * $durationMonths),
                'tax' => $metadata['fees'],
                'total' => ($pack_price * $durationMonths) + $metadata['fees'],
                'currency' => $metadata['currency'] === 'USD' ? '$' : 'FC',
            ],
            'payment' => [
                'method' => $this->getPaymentMethodLabel($metadata['method']),
                'status' => 'Payé',
                'date' => Carbon::now()->format('d/m/Y H:i'),
            ]
        ];

        // Créer une instance de Dompdf
        $dompdf = new Dompdf();
        $dompdf->loadHtml(view('invoices.pack', $data)->render());
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf;
    }

    /**
     * Récupère le libellé de la méthode de paiement
     */
    private function getPaymentMethodLabel(string $method): string
    {
        $methods = [
            'solifin-wallet' => 'Portefeuille Solifin',
            'orange_money' => 'Orange Money',
            'afrimoney' => 'Afrimoney',
            'm-pesa' => 'M-Pesa',
            'airtel_money' => 'Airtel Money',
            'visa' => 'Visa',
            'mastercard' => 'Mastercard',
            'american-express' => 'American Express',
        ];

        return $methods[$method] ?? $method;
    }
}
