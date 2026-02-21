<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class FundsReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $senderName;
    protected $senderAccountId;

    /**
     * Create a new notification instance.
     *
     * @param float $amount Montant reçu
     * @param string $senderName Nom de l'expéditeur
     * @param string $senderAccountId ID du compte de l'expéditeur
     * @return void
     */
    public function __construct($amount, $senderName, $senderAccountId)
    {
        $this->amount = $amount;
        $this->senderName = $senderName;
        $this->senderAccountId = $senderAccountId;
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
    public function toArray($notifiable): array
    {
        return [
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Réception d\'un dépôt des fonds ',
            'message' => "Vous avez reçu {$this->amount} $ de la part de {$this->senderName}.",
        ];
    }

    /**
     * Get broadcastable representation of notification.
     *
     * @param  mixed  $notifiable
     * @return BroadcastMessage
     */
    public function toBroadcast($notifiable)
    {   
        return new BroadcastMessage([
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Fonds reçus',
            'message' => "Vous avez reçu {$this->amount} $ de la part de {$this->senderName}.",
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
        return (new MailMessage)
            ->subject('Nouveau transfert de fonds reçu')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Vous avez reçu un dépôt de fonds.")
            ->line("Montant reçu : {$this->amount} $")
            ->line("Expéditeur : {$this->senderName}")
            ->line("ID du compte expéditeur : {$this->senderAccountId}")
            ->line("Date et heure : " . now()->format('d/m/Y H:i'))
            ->action('Me connecter à mon compte', env('FRONTEND_URL') . '/login')
            ->line('Merci pour votre confiance dans nos services !');
    }
}
