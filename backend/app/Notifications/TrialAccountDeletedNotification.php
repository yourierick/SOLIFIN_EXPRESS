<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class TrialAccountDeletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $deletionDate;

    /**
     * Create a new notification instance.
     *
     * @param \Carbon\Carbon $deletionDate
     * @return void
     */
    public function __construct($deletionDate)
    {
        $this->deletionDate = $deletionDate;
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
        return (new MailMessage)
            ->subject('🗑️ Votre compte a été supprimé')
            ->greeting('Bonjour,')
            ->line("Nous vous informons que votre compte en période d'essai a été **définitivement supprimé**.")
            ->line("Date de suppression : " . $this->deletionDate->format('d/m/Y à H:i'))
            ->line("Conformément à nos conditions d'utilisation, les comptes en période d'essai non convertis en abonnement sont automatiquement supprimés à l'expiration de la période d'essai.")
            ->line("Toutes vos données personnelles et historiques ont été définitivement effacés de nos systèmes.")
            ->line("Si vous souhaitez continuer à utiliser nos services, vous pouvez créer un nouveau compte et souscrire à un pack d'abonnement dès l'inscription.")
            ->action('Créer un nouveau compte', url('/dashboard/packs'))
            ->line("Nous espérons vous revoir prochainement parmi nos utilisateurs.")
            ->line("Si vous avez des questions, n'hésitez pas à contacter notre support.");
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
            'titre' => "🗑️ Compte supprimé",
            'deletion_date' => $this->deletionDate->format('Y-m-d H:i:s'),
            'type' => 'danger',
            'icon' => 'exclamation-triangle',
            'message' => "Votre compte en période d'essai a été définitivement supprimé. Vous pouvez créer un nouveau compte pour continuer à utiliser nos services.",
            'link' => url('/dashboard/packs')
        ];
    }
}
