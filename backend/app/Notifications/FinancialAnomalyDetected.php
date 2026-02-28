<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use App\Models\FinancialAuditLog;

class FinancialAnomalyDetected extends Notification implements ShouldQueue
{
    use Queueable;

    public $anomaly;
    public $severity;

    /**
     * Create a new notification instance.
     *
     * @param array $anomaly
     * @param string $severity
     */
    public function __construct(FinancialAuditLog $anomaly, string $severity)
    {
        $this->anomaly = $anomaly;
        $this->severity = $severity;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        // Email pour high/critical, database pour low/medium
        if (in_array($this->severity, ['high', 'critical'])) {
            return ['mail', 'database'];
        }
        
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $severityColor = [
            'high' => '#ff6b6b',
            'critical' => '#dc3545'
        ][$this->severity] ?? '#ffc107';

        $severityIcon = [
            'high' => '⚠️',
            'critical' => '🚨'
        ][$this->severity] ?? 'ℹ️';

        return (new MailMessage)
            ->subject("{$severityIcon} Anomalie Financière {$this->severity} - SOLIFIN")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Une anomalie financière de sévérité **{$this->severity}** a été détectée dans le système.")
            ->line("**Type d'audit :** {$this->anomaly->audit_type}")
            ->line("**Entité concernée :** {$this->anomaly->entity_type} #{$this->anomaly->entity_id}")
            ->line("**Valeur attendue :** {$this->anomaly->expected_value}")
            ->line("**Valeur réelle :** {$this->anomaly->actual_value}")
            ->line("**Différence :** {$this->anomaly->difference}")
            ->action(
                'Voir les détails de l\'anomalie',
                url('/admin/financial-anomalies?severity=' . $this->severity)
            )
            ->line("⚠️ **Action requise :** Veuillez examiner cette anomalie dès que possible.")
            ->salutation("Cordialement, l'équipe SOLIFIN");
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
            'title' => "Anomalie Financière {$this->severity}",
            'message' => "Une anomalie {$this->severity} a été détectée",
            'link' => url('/admin/financial-anomalies?severity=' . $this->severity),
            'icon' => $this->severity === 'critical' ? 'exclamation-triangle' : 'exclamation-circle',
            'color' => $this->severity === 'critical' ? 'danger' : 'warning',
        ];
    }
}
