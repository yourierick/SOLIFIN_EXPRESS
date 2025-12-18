<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordFrench extends Notification implements ShouldQueue
{
    use Queueable;

    public $token;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $url = url('/reset-password/' . $this->token . '?email=' . urlencode($notifiable->getEmailForPasswordReset()));
        
        return (new MailMessage)
            ->subject('🔐 Réinitialisation de votre mot de passe - SOLIFIN EXPRESS')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SOLIFIN EXPRESS.')
            ->line('Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :')
            ->action('🔑 Réinitialiser mon mot de passe', $url)
            ->line('---')
            ->line('Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :')
            ->line($url)
            ->line('---')
            ->line('Ce lien de réinitialisation expirera dans ' . config('auth.passwords.users.expire', 60) . ' minutes.')
            ->line('Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.')
            ->line('Pour des raisons de sécurité, ne partagez jamais ce lien avec personne.')
            ->salutation('Cordialement,<br>L\'équipe SOLIFIN EXPRESS')
            ->line('📧 Pour toute assistance, contactez notre service client');
    }
}
