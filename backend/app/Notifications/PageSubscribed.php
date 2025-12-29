<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class PageSubscribed extends Notification
{
    use Queueable;

    protected $subscriberName;
    protected $pageId;

    /**
     * Create a new notification instance.
     *
     * @param string $subscriberName
     * @param int $pageId
     * @return void
     */
    public function __construct(string $subscriberName, int $pageId)
    {
        $this->subscriberName = $subscriberName;
        $this->pageId = $pageId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'info',
            'titre' => 'Nouvel abonné',
            'icon' => 'user-plus',
            'link' => '/dashboard/my-page',
            'message' => "{$this->subscriberName} a commencé à vous suivre."
        ];
    }
}
