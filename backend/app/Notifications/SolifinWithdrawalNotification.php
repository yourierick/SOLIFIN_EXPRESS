<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\DatabaseNotification;

class SolifinWithdrawalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $amount;
    public $fees;
    public $totalAmount;
    public $processedBy;
    public $processedAt;

    /**
     * Create a new notification instance.
     *
     * @param float $amount
     * @param float $fees
     * @param float $totalAmount
     * @param string $processedBy
     * @param \Carbon\Carbon $processedAt
     */
    public function __construct($amount, $fees, $totalAmount, $processedBy, $processedAt)
    {
        $this->amount = $amount;
        $this->fees = $fees;
        $this->totalAmount = $totalAmount;
        $this->processedBy = $processedBy;
        $this->processedAt = $processedAt;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🔔 Retrait des bénéfices SOLIFIN effectué')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Un retrait des bénéfices SOLIFIN vient d\'être effectué sur le compte principal.')
            ->line('Voici les détails de l\'opération :')
            ->line('• **Montant demandé** : ' . number_format($this->amount, 2) . ' $')
            ->line('• **Frais appliqués** : ' . number_format($this->fees, 2) . ' $')
            ->line('• **Montant total débité** : ' . number_format($this->totalAmount, 2) . ' $')
            ->line('• **Traité par** : ' . $this->processedBy)
            ->line('• **Date de traitement** : ' . $this->processedAt->format('d/m/Y H:i:s'))
            ->action('Voir les détails financiers', url('/admin/finances'))
            ->line('Cette opération a été sécurisée et enregistrée dans le système.')
            ->salutation('Cordialement, l\'équipe SOLIFIN');
    }

    /**
     * Get the array representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'solifin_withdrawal_completed',
            'title' => 'Retrait des bénéfices SOLIFIN effectué',
            'message' => "Un retrait de {$this->amount} $ (frais: {$this->fees} $) a été effectué par {$this->processedBy}",
            'amount' => $this->amount,
            'fees' => $this->fees,
            'total_amount' => $this->totalAmount,
            'processed_by' => $this->processedBy,
            'processed_at' => $this->processedAt->toISOString(),
            'icon' => 'banknotes',
            'color' => 'red',
            'action_url' => '/admin/finances',
            'requires_action' => false
        ];
    }

    /**
     * Get the database notification type.
     *
     * @return string
     */
    public function databaseType()
    {
        return 'solifin_withdrawal_completed';
    }
}
