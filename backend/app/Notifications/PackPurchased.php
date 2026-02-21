<?php

namespace App\Notifications;

use App\Models\UserPack;
use App\Services\InvoiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PackPurchased extends Notification implements ShouldQueue
{
    use Queueable;

    protected $userPack;
    protected $durationMonths;
    protected $metadata;

    public function __construct(UserPack $userPack, int $durationMonths = 1, array $metadata = [])
    {
        $this->userPack = $userPack;
        $this->durationMonths = $durationMonths;
        $this->metadata = $metadata;
    }

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $invoiceService = new InvoiceService();
        $pdf = $invoiceService->generatePackInvoice($this->userPack, $this->durationMonths, $this->metadata);
        
        return (new MailMessage)
            ->subject('📄 Facture SOLIFIN - Achat de Pack ' . $this->userPack->pack->name)
            ->view('emails.pack-invoice', [
                'userPack' => $this->userPack,
                'durationMonths' => $this->durationMonths,
                'amount' => $this->metadata['amount'], 
                'fees' => $this->metadata['fees'],
                'currency' => $this->metadata['currency'] === 'USD' ? '$':'FC',
            ])
            ->attachData($pdf->output(), 'facture-pack-' . $this->userPack->id . '.pdf', [
                'mime' => 'application/pdf',
            ]);
    }

    public function toArray($notifiable): array
    {
        $durationText = $this->durationMonths > 1 ? $this->durationMonths . ' mois' : $this->durationMonths . ' mois';
        
        return [
            'type' => 'success',
            'titre' => 'Achat de pack',
            'icon' => 'check-circle',
            'color' => 'success',
            'link' => 'dashboard/packs/:id',
            'message' => 'Vous avez souscris au pack ' . $this->userPack->pack->name . ' pour une durée de ' . $durationText . '. Votre abonnement expire le ' . $this->userPack->expiry_date->format('d/m/Y'),
        ];
    }
} 