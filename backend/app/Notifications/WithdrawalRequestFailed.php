<?php

namespace App\Notifications;

use App\Models\WithdrawalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalRequestFailed extends Notification implements ShouldQueue
{
    use Queueable;

    private $withdrawalRequest;
    private $status;
    private $message;
    private $sessionId;
    private $transactionId;

    public function __construct(WithdrawalRequest $withdrawalRequest, string $status, string $message, string $sessionId, ?string $transactionId = null)
    {
        $this->withdrawalRequest = $withdrawalRequest;
        $this->status = $status;
        $this->message = $message;
        $this->sessionId = $sessionId;
        $this->transactionId = $transactionId;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Échec de traitement d\'une demande de retrait')
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Une demande de retrait que vous avez validée a échoué lors du traitement.")
            ->line("Détails de la demande :")
            ->line("- Montant : {$this->withdrawalRequest->payment_details['montant_a_retirer']} {$this->withdrawalRequest->payment_details['devise']}")
            ->line("- Utilisateur : {$this->withdrawalRequest->user->name}")
            ->line("- Méthode de paiement : {$this->withdrawalRequest->payment_method}")
            ->line("Informations du callback :")
            ->line("- Statut : {$this->status}")
            ->line("- Message : {$this->message}")
            ->line("- Session ID : {$this->sessionId}")
            ->line($this->transactionId ? "- Transaction ID : {$this->transactionId}" : "- Transaction ID : Non fourni")
            ->line("Veuillez vérifier les informations de paiement et contacter l'utilisateur si nécessaire.");
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'error',
            'icon' => 'exclamation-circle',
            'titre' => 'Échec de retrait',
            'message' => 'La demande de retrait de ' . $this->withdrawalRequest->payment_details['montant_a_retirer'] . ' ' . $this->withdrawalRequest->payment_details['devise'] . ' a échoué. Statut: ' . $this->status . ' - ' . $this->message,
        ];
    }
}
