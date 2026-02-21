<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class MultipleTransferStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $success;
    protected $totalAmount;
    protected $successfulCount;
    protected $failedCount;
    protected $failedTransfers;

    /**
     * Create a new notification instance.
     *
     * @param bool $success Succès ou échec du transfert
     * @param float $totalAmount Montant total transféré
     * @param int $successfulCount Nombre de transferts réussis
     * @param int $failedCount Nombre de transferts échoués
     * @param array $failedTransfers Liste des transferts échoués
     * @return void
     */
    public function __construct($success, $totalAmount, $successfulCount, $failedCount, $failedTransfers = [])
    {
        $this->success = $success;
        $this->totalAmount = $totalAmount;
        $this->successfulCount = $successfulCount;
        $this->failedCount = $failedCount;
        $this->failedTransfers = $failedTransfers;
    }

    /**
     * Get notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get array representation of notification for database.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $status = $this->success ? 'réussi' : 'échoué';
        $type = $this->success ? 'success' : 'error';
        
        $data = [
            'type' => $type,
            'icon' => $this->success ? 'info' : 'error',
            'title' => "Transfert {$status}",
            'message' => $this->success 
                ? "Votre transfert de {$this->totalAmount} $ a été effectué avec succès ({$this->successfulCount} réussis, {$this->failedCount} échoués)."
                : "Votre transfert a rencontré des problèmes ({$this->successfulCount} réussis, {$this->failedCount} échoués).",
            'link' => '/dashboard/finances',
        ];
        
        return $data;
    }

    /**
     * Get broadcastable representation of notification.
     *
     * @param  mixed  $notifiable
     * @return BroadcastMessage
     */
    public function toBroadcast($notifiable)
    {
        $status = $this->success ? 'réussi' : 'échoué';
        $type = $this->success ? 'success' : 'error';
        
        return new BroadcastMessage([
            'type' => $type,
            'icon' => $this->success ? 'exclamation-circle' : 'exclamation-triangle',
            'title' => "Transfert {$status}",
            'message' => $this->success 
                ? "Votre transfert de {$this->totalAmount} $ a été effectué avec succès."
                : "Votre transfert a rencontré des problèmes.",
            'link' => '/wallet'
        ]);
    }

    /**
     * Get mail representation of notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $status = $this->success ? 'réussi' : 'échoué';
        
        $mailMessage = (new MailMessage)
            ->subject("Transfert {$status}")
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Votre transfert de fonds a {$status}.");

        if ($this->success) {
            $mailMessage
                ->line("Montant total transféré : {$this->totalAmount} $")
                ->line("Nombre de transferts réussis : {$this->successfulCount}")
                ->line("Nombre de transferts échoués : {$this->failedCount}");
        } else {
            $mailMessage
                ->line("Nous sommes désolés, mais certains transferts ont échoué.")
                ->line("Transferts réussis : {$this->successfulCount}")
                ->line("Transferts échoués : {$this->failedCount}");
        }

        // Ajouter les détails des transferts échoués
        if (!empty($this->failedTransfers)) {
            $mailMessage->line("Détails des transferts échoués :");
            foreach ($this->failedTransfers as $index => $failed) {
                $mailMessage->line("- " . ($index + 1) . ". Compte {$failed['recipient_account_id']}: {$failed['reason']}");
            }
        }

        return $mailMessage
            ->action('Accéder à mon compte', env('FRONTEND_URL'))
            ->line($this->success 
                ? 'Merci pour votre confiance!'
                : 'Veuillez vérifier les informations des destinataires et réessayer.');
    }
}
