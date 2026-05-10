<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class ReportActionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $report;
    public $actions;
    public $adminNote;

    /**
     * Create a new notification instance.
     *
     * @param mixed $report
     * @param array $actions
     * @param string $adminNote
     */
    public function __construct($report, $actions, $adminNote)
    {
        $this->report = $report;
        $this->actions = $actions;
        $this->adminNote = $adminNote;
    }

    /**
     * Get notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $actionsText = $this->getActionsText();
        
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('Action prise suite à votre signalement')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Nous vous informons que des actions ont été prises suite à un signalement concernant votre contenu.')
            ->line('**Détails du signalement :**')
            ->line('- Type de publication : ' . $this->report->publication_type)
            ->line('- Référence : ' . $this->report->publication_reference)
            ->line('- Date du signalement : ' . $this->report->created_at->format('d/m/Y H:i'))
            ->line('')
            ->line('**Actions prises :**')
            ->line($actionsText)
            ->line('')
            ->line('')
            ->line('Si vous avez des questions concernant ces actions, n\'hésitez pas à nous contacter.')
            ->line('Cordialement,')
            ->line('L\'équipe SOLIFIN')
            ->salutation('Merci de votre compréhension.');
    }


    /**
     * Get formatted text for actions taken
     *
     * @return string
     */
    private function getActionsText()
    {
        $actionLabels = [
            'suspendaccount' => 'Suspension de votre compte',
            'suspendpublicationright' => 'Suspension de votre droit de publication',
            'retirepublication' => 'Retrait de votre publication',
            'ignorereport' => 'Le signalement a été ignoré'
        ];

        $actionsTaken = [];
        
        foreach ($this->actions as $action => $value) {
            if ($value && isset($actionLabels[$action])) {
                $actionsTaken[] = '- ' . $actionLabels[$action];
            }
        }

        return empty($actionsTaken) 
            ? '- Aucune action spécifique n\'a été prise' 
            : implode("\n", $actionsTaken);
    }
}
