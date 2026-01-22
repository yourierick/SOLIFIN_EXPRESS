<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class GradeAttributedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Le nouveau grade attribué
     *
     * @var \App\Models\Grade
     */
    protected $grade;

    /**
     * Le nombre de points de l'utilisateur
     *
     * @var int
     */
    protected $userPoints;

    /**
     * Le grade précédent (si applicable)
     *
     * @var \App\Models\Grade|null
     */
    protected $previousGrade;

    /**
     * Create a new notification instance.
     *
     * @param \App\Models\Grade $grade
     * @param int $userPoints
     * @param \App\Models\Grade|null $previousGrade
     */
    public function __construct($grade, $userPoints, $previousGrade = null)
    {
        $this->grade = $grade;
        $this->userPoints = $userPoints;
        $this->previousGrade = $previousGrade;
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
        $gradeName = $this->grade->designation;
        $pointsRequired = $this->grade->points;
        
        $message = (new MailMessage)
            ->subject("Félicitations ! Vous avez atteint le grade de {$gradeName}")
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Nous avons le plaisir de vous annoncer que vous avez atteint un nouveau grade sur SOLIFIN !")
            ->line("🎉 **Nouveau grade : {$gradeName}")
            ->line("📊 **Vos points actuels : {$this->userPoints} points**")
            ->line("🎯 **Points requis pour ce grade : {$pointsRequired} points**");

        // Ajouter une ligne si c'est une promotion
        if ($this->previousGrade) {
            $message->line("📈 Promotion : Grade {$this->previousGrade->designation}");
        }

        $message
            ->line("Continuez votre excellent travail pour atteindre les grades supérieurs !")
            ->line("Merci pour votre confiance et votre engagement.")
            ->action('Accéder à mon compte', config('app.frontend_url'))
            ->line('Cordialement,')
            ->line('L\'équipe SOLIFIN');

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => "info",
            'icon' => "exclamation-circle",
            'message' => "Félicitations ! Vous avez atteint le grade de {$this->grade->designation}",
            'title' => "🎉 Nouveau grade atteint"
        ];
    }
}
