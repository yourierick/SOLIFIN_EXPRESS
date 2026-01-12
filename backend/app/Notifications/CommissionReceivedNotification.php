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
    protected $currency;
    protected $filleulName;
    protected $filleulAccountId;

    /**
     * Create a new notification instance.
     *
     * @param float $amount Montant de la commission
     * @param string $currency Devise (USD, CDF)
     * @param string $filleulName Nom du filleul
     * @param string $filleulAccountId ID du compte du filleul
     * @return void
     */
    public function __construct($amount, $currency, $filleulName, $filleulAccountId)
    {
        $this->amount = $amount;
        $this->currency = $currency;
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
    public function toDatabase($notifiable)
    {
        $currencySymbol = $this->currency === 'USD' ? '$' : ' FC';
        
        return [
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Commission reçue',
            'message' => "Vous avez reçu une commission de {$this->amount} {$currencySymbol} de la part de votre filleul {$this->filleulName}.",
            'link' => '/wallet',
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
        $currencySymbol = $this->currency === 'USD' ? '$' : ' FC';
        
        return new BroadcastMessage([
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Commission reçue',
            'message' => "Vous avez reçu une commission de {$this->amount} {$currencySymbol} de la part de votre filleul {$this->filleulName}.",
            'amount' => $this->amount,
            'currency' => $this->currency,
            'transaction_type' => 'commission',
            'filleul_name' => $this->filleulName,
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
        $currencySymbol = $this->currency === 'USD' ? '$' : ' FC';
        
        return (new MailMessage)
            ->subject('Commission de transfert reçue')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Félicitations ! Vous avez reçu une nouvelle commission.')
            ->line("Montant de la commission : {$this->amount} {$currencySymbol}")
            ->line("Filleul concerné : {$this->filleulName}")
            ->line("ID du compte du filleul : {$this->filleulAccountId}")
            ->line("Date et heure : " . now()->format('d/m/Y H:i'))
            ->action('Voir mon wallet', env('FRONTEND_URL') . '/wallet')
            ->line('Continuez à accompagner vos filleuls pour recevoir plus de commissions !');
    }
}
