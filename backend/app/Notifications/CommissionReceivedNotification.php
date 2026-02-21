<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class CommissionReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $filleulName;
    protected $filleulAccountId;

    /**
     * Create a new notification instance.
     *
     * @param float $amount Montant de la commission
     * @param string $filleulName Nom du filleul
     * @param string $filleulAccountId ID du compte du filleul
     * @return void
     */
    public function __construct($amount, $filleulName, $filleulAccountId)
    {
        $this->amount = $amount;
        $this->filleulName = $filleulName;
        $this->filleulAccountId = $filleulAccountId;
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
        return [
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Commission reçue',
            'message' => "Vous avez reçu une nouvelle commission de {$this->amount} $ de la part de votre filleul {$this->filleulName}.",
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
            'title' => 'Commission reçue',
            'message' => "Vous avez reçu une commission de {$this->amount} $ de la part de votre filleul {$this->filleulName}.",
            'amount' => $this->amount,
            'currency' => $this->currency,
            'transaction_type' => 'commission',
            'filleul_name' => $this->filleulName,
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
            ->subject('Commission de transfert reçue')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Félicitations ! Vous avez reçu une nouvelle commission.')
            ->line("Montant de la commission : {$this->amount} $")
            ->line("Filleul concerné : {$this->filleulName}")
            ->line("ID du compte du filleul : {$this->filleulAccountId}")
            ->line("Date et heure : " . now()->format('d/m/Y H:i'))
            ->action('Me connecter à mon compte', env('FRONTEND_URL') . '/login')
            ->line('Continuez à accompagner vos filleuls pour recevoir plus de commissions !');
    }
}
