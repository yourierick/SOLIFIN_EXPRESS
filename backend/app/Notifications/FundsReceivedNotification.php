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
    protected $currency;
    protected $senderName;
    protected $transactionType;
    protected $senderAccountId;

    /**
     * Create a new notification instance.
     *
     * @param float $amount Montant reçu
     * @param string $currency Devise (USD, CDF)
     * @param string $senderName Nom de l'expéditeur
     * @param string $senderAccountId ID du compte de l'expéditeur
     * @param string $transactionType Type de transaction (transfer, transfer_multiple)
     * @return void
     */
    public function __construct($amount, $currency, $senderName, $senderAccountId, $transactionType = 'transfer')
    {
        $this->amount = $amount;
        $this->currency = $currency;
        $this->senderName = $senderName;
        $this->senderAccountId = $senderAccountId;
        $this->transactionType = $transactionType;
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
        $typeLabel = $this->transactionType === 'transfer_multiple' ? 'Transfert multiple' : 'Transfert';
        $currencySymbol = $this->currency === 'USD' ? '$' : ' FC';
        
        return [
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Fonds reçus',
            'message' => "Vous avez reçu {$this->amount} {$currencySymbol} de la part de {$this->senderName}.",
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
        $typeLabel = $this->transactionType === 'transfer_multiple' ? 'Transfert multiple' : 'Transfert';
        
        return new BroadcastMessage([
            'type' => 'success',
            'icon' => 'cash',
            'title' => 'Fonds reçus',
            'message' => "Vous avez reçu {$this->amount} {$currencySymbol} de la part de {$this->senderName}.",
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
        $typeLabel = $this->transactionType === 'transfer_multiple' ? 'Transfert multiple' : 'Transfert';
        
        return (new MailMessage)
            ->subject('Nouveau transfert de fonds reçu')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Vous avez reçu un {$typeLabel} de fonds.")
            ->line("Montant reçu : {$this->amount} {$currencySymbol}")
            ->line("Expéditeur : {$this->senderName}")
            ->line("ID du compte expéditeur : {$this->senderAccountId}")
            ->line("Date et heure : " . now()->format('d/m/Y H:i'))
            ->action('Voir mon wallet', env('FRONTEND_URL') . '/wallet')
            ->line('Merci pour votre confiance dans nos services !');
    }
}
