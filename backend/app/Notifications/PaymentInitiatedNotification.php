<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class PaymentInitiatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $sessionId;
    protected $transactionId;
    protected $transactionType;

    /**
     * Create a new notification instance.
     *
     * @param float $amount
     * @param string $sessionId
     * @param string $transactionId
     * @param string|null $transactionType
     * @return void
     */
    public function __construct($amount, $sessionId, $transactionId, $transactionType = null)
    {
        $this->amount = $amount;
        $this->sessionId = $sessionId;
        $this->transactionId = $transactionId;
        $this->transactionType = $transactionType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $subject = "Paiement initié - {$this->amount} $";
        
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,')
            ->line("Votre paiement de {$this->amount} $ a été initié avec succès.")
            ->line("Référence de session: {$this->sessionId}")
            ->line("ID de transaction: {$this->transactionId}");
            
        if ($this->transactionType) {
            $typeLabel = $this->getTransactionTypeLabel();
            $mailMessage->line("Type de transaction: {$typeLabel}");
        }
        
        $mailMessage->line("Veuillez compléter le paiement en suivant les instructions envoyées à votre téléphone.")
            ->line("Vous recevrez une confirmation une fois le paiement traité.")
            ->line('Merci pour votre confiance!')
            ->action('Accéder à mon compte', url('/'));
            
        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $typeLabel = $this->getTransactionTypeLabel();
        
        return [
            'title' => "Paiement initié",
            'icon' => 'exclamation-circle',
            'type' => 'info',
            'message' => "Votre paiement de {$this->amount} $ a été initié et est en attente de validation."
        ];
    }

    /**
     * Get a human-readable label for the transaction type.
     *
     * @return string
     */
    protected function getTransactionTypeLabel()
    {
        switch ($this->transactionType) {
            case 'purchase_pack':
                return 'Achat de pack';
            case 'renew_pack':
                return 'Renouvellement de pack';
            case 'purchase_virtual':
                return 'Achat de monnaie virtuelle';
            default:
                return 'Paiement';
        }
    }
}
