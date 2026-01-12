<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use App\Services\TwilioSmsService;
use App\Models\User;
use App\Models\WithdrawalRequest;

class SendWithdrawalNotificationSms implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min

    /**
     * Create a new job instance.
     */
    public function __construct(
        private User $admin,
        private WithdrawalRequest $withdrawalRequest
    ) {
        $this->onQueue('sms-notifications');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Vérifier si l'admin a un numéro de téléphone
            if (!$this->admin->phone) {
                Log::info('Admin sans numéro de téléphone, SMS ignoré', [
                    'admin_id' => $this->admin->id,
                    'withdrawal_id' => $this->withdrawalRequest->id
                ]);
                return;
            }

            // Envoyer le SMS
            $smsService = new TwilioSmsService();
            $message = "🔔 SOLIFIN: Nouvelle demande de retrait de {$this->withdrawalRequest->amount} {$this->withdrawalRequest->currency} en attente. ID: {$this->withdrawalRequest->id}";
            
            $smsResult = $smsService->send($this->admin->phone, $message);
            
            if ($smsResult['success']) {
                Log::info('SMS envoyé à l\'admin via queue', [
                    'admin_id' => $this->admin->id,
                    'phone' => $this->admin->phone,
                    'withdrawal_id' => $this->withdrawalRequest->id,
                    'sms_id' => $smsResult['message_id'],
                    'job_id' => $this->job?->getJobId()
                ]);
            } else {
                Log::warning('Échec envoi SMS à l\'admin via queue', [
                    'admin_id' => $this->admin->id,
                    'phone' => $this->admin->phone,
                    'withdrawal_id' => $this->withdrawalRequest->id,
                    'error' => $smsResult['error'],
                    'job_id' => $this->job?->getJobId()
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi SMS à l\'admin via queue', [
                'admin_id' => $this->admin->id,
                'withdrawal_id' => $this->withdrawalRequest->id,
                'error' => $e->getMessage(),
                'job_id' => $this->job?->getJobId()
            ]);
            
            // Relancer le job si c'est une erreur temporaire
            if ($this->attempts() < $this->tries) {
                $this->release($this->backoff[$this->attempts() - 1] ?? 60);
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job SMS définitivement échoué', [
            'admin_id' => $this->admin->id,
            'withdrawal_id' => $this->withdrawalRequest->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}
