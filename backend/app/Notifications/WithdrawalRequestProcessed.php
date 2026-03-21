<?php

namespace App\Notifications;

use App\Models\WithdrawalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalRequestProcessed extends Notification implements ShouldQueue
{
    use Queueable;

    private $withdrawalRequest;

    public function __construct(WithdrawalRequest $withdrawalRequest)
    {
        $this->withdrawalRequest = $withdrawalRequest;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $status = $this->withdrawalRequest->status === 'processing' 
            ? 'approuvée' 
            : 'rejetée';

        $type = $this->withdrawalRequest->status === 'processing' 
            ? 'info' 
            : 'danger';

        $icon = $this->withdrawalRequest->status === 'processing' 
            ? 'exclamation-circle' 
            : 'exclamation-triangle';

        return (new MailMessage)
            ->subject("Votre demande de retrait a été {$status}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre demande de retrait d'un montant de {$this->withdrawalRequest->amount} $ a été {$status}.")
            ->when($this->withdrawalRequest->status === 'processing', function ($message) {
                return $message->line("Le paiement est traité automatiquement, vous recevrez une notification une fois le paiement effectué.");
            })
            ->line("Merci de votre confiance !");
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'info',
            'icon' => 'exclamation-circle',
            'titre' => 'Approbation de retrait',
            'message' => $this->withdrawalRequest->status === 'processing' 
            ? 'Votre demande de retrait d\'un montant de ' . $this->withdrawalRequest->amount . '$ a été approuvée.' 
            : 'Votre demande de retrait d\'un montant de ' . $this->withdrawalRequest->amount . '$ a été rejetée.',
            'link' => '/dashboard/finances'
        ];
    }
}