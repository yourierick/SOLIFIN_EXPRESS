<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class PaymentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $sessionId;
    protected $status;
    protected $transactionType;

    /**
     * Create a new notification instance.
     *
     * @param float $amount
     * @param string $sessionId
     * @param string $status
     * @param string|null $transactionType
     * @return void
     */
    public function __construct($amount, $sessionId, $status, $transactionType = null)
    {
        $this->amount = $amount;
        $this->sessionId = $sessionId;
        $this->status = $status;
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
        $status = $this->status === 'success' ? 'réussi' : 'échoué';
        $subject = "Paiement {$status} - {$this->amount} $";
        
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,');
            
        if ($this->status === 'success') {
            $mailMessage->line("Votre paiement de {$this->amount} $ a été traité avec succès.")
                ->line("Référence de transaction: {$this->sessionId}");
                
            if ($this->transactionType) {
                $typeLabel = $this->getTransactionTypeLabel();
                $mailMessage->line("Type de transaction: {$typeLabel}");
            }
            
            $mailMessage->line('Merci pour votre confiance!');
        } else {
            $mailMessage->line("Votre paiement de {$this->amount} $ n'a pas pu être traité.")
                ->line("Référence de transaction: {$this->sessionId}")
                ->line("Veuillez réessayer ou contacter notre service client si le problème persiste.");
        }
        
        return $mailMessage->action('Accéder à mon compte', url('/'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $status = $this->status === 'success' ? 'réussi' : 'échoué';
        $typeLabel = $this->getTransactionTypeLabel();
        
        return [
            'title' => "Paiement {$status}",
            'icon' => 'exclamation-circle',
            'type' => 'info',
            'message' => $this->status === 'success' 
                ? "Votre paiement de {$this->amount} $ a été traité avec succès."
                : "Votre paiement de {$this->amount} $ n'a pas pu être traité."
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
