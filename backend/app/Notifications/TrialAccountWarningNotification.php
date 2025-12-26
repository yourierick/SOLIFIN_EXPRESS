<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class TrialAccountWarningNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $daysRemaining;
    protected $trialEndDate;

    /**
     * Create a new notification instance.
     *
     * @param int $daysRemaining
     * @param \Carbon\Carbon $trialEndDate
     * @return void
     */
    public function __construct($daysRemaining, $trialEndDate)
    {
        $this->daysRemaining = $daysRemaining;
        $this->trialEndDate = $trialEndDate;
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
        $subject = "⚠️ Votre compte sera supprimé dans {$this->daysRemaining} jour" . ($this->daysRemaining > 1 ? 's' : '');
        
        return (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,')
            ->line("Votre compte en période d'essai expire dans **{$this->daysRemaining} jour" . ($this->daysRemaining > 1 ? 's' : '') . "**.")
            ->line("Date de fin d'essai : " . $this->trialEndDate->format('d/m/Y à H:i'))
            ->line("⚠️ **Attention :** À l'expiration de votre période d'essai, votre compte et toutes vos données seront **définitivement supprimés**.")
            ->line("Pour conserver votre compte et continuer à bénéficier de nos services, nous vous invitons à souscrire à un pack d'abonnement.")
            ->action('Souscrire à un pack', url('/dashboard/packs'))
            ->line("Si vous avez des questions, notre équipe support est à votre disposition.")
            ->line('Merci pour votre confiance!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toDatabase($notifiable)
    {
        return [
            'titre' => "⚠️ Compte en danger de suppression",
            'days_remaining' => $this->daysRemaining,
            'trial_end_date' => $this->trialEndDate->format('Y-m-d H:i:s'),
            'type' => 'warning',
            'icon' => 'exclamation-triangle',
            'message' => "Votre compte expire dans {$this->daysRemaining} jour" . ($this->daysRemaining > 1 ? 's' : '') . ". Souscrivez à un pack pour éviter la suppression.",
            'link' => url('/dashboard/packs')
        ];
    }
}
