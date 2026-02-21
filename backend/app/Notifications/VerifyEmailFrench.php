<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailFrench extends Notification implements ShouldQueue
{
    use Queueable;

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirmation de votre adresse e-mail')
            ->greeting('Bonjour !')
            ->line('Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse e-mail.')
            ->action('Vérifier l\'adresse e-mail', $verificationUrl)
            ->line('Si vous n\'avez pas créé de compte, aucune action supplémentaire n\'est requise.')
            ->salutation('Cordialement, L\'équipe SOLIFIN');
    }

    protected function verificationUrl($notifiable)
    {
        $url = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
        
        // Remplacer localhost par l'URL de production
        $baseUrl = config('app.frontend_url', config('app.url'));
        $currentUrl = url('');
        
        // Si on est en production, remplacer l'URL locale par l'URL de production
        if (str_contains($currentUrl, 'localhost') || str_contains($currentUrl, '127.0.0.1')) {
            $url = str_replace($currentUrl, $baseUrl, $url);
        }
        
        // Ajouter le préfixe /api pour correspondre aux routes API
        return str_replace($baseUrl, $baseUrl . '/api', $url);
    }
} 