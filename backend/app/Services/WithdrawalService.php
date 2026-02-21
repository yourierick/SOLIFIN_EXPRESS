<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use App\Models\UserPack;
use App\Models\Pack;
use App\Models\TransactionFee;
use App\Notifications\WithdrawalRequestProcessed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\ExchangeRates;
use App\Services\WalletService;

class WithdrawalService
{
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';    

    /**
     * Approuve une demande de retrait
     *
     * @param WithdrawalRequest $withdrawal
     * @param string|null $adminNote
     * @param int $adminId
     * @return array
     */
    public function approveWithdrawal(WithdrawalRequest $withdrawal, ?string $adminNote, int $adminId): array
    {
        try {
            DB::beginTransaction();
            
            if ($withdrawal->status !== self::STATUS_FAILED || $withdrawal->status !== self::STATUS_PENDING) {
                return [
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être approuvée ou réessayée',
                    'status_code' => 400
                ];
            }

            $withdrawal->admin_note = $adminNote;
            $withdrawal->processed_by = $adminId;
            $withdrawal->processed_at = now();

            $withdrawal->save();
            
            // Début de l'initialisation du paiement
            $serdiPayController = app()->make(\App\Http\Controllers\SerdiPayController::class);
            $paymentResult = $serdiPayController->initialWithdrawal($withdrawal);

            if (!$paymentResult['success']) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Erreur lors de l\'initialisation du paiement: ' . $paymentResult['message'],
                    'status_code' => 500
                ];
            }

            DB::commit();

            $user = $withdrawal->user;
            $user->notify(new WithdrawalRequestProcessed($withdrawal));
            
            return [
                'success' => true,
                'message' => 'Demande approuvée avec succès',
                'status_code' => 200,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'approbation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'withdrawal_id' => $withdrawal->id
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'approbation de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Rejette une demande de retrait
     *
     * @param WithdrawalRequest $withdrawal
     * @param string|null $adminNote
     * @param int $adminId
     * @return array
     */
    public function rejectWithdrawal(WithdrawalRequest $withdrawal, ?string $adminNote, int $adminId): array
    {   
        if ($withdrawal->status !== self::STATUS_PENDING) {
            return [
                'success' => false,
                'message' => 'Cette demande ne peut pas être rejetée car elle n\'est pas en attente',
                'status_code' => 400
            ];
        }

        DB::beginTransaction();
        try {
            // Degéler le montant gélé du wallet de l'utilisateur
            $montantArembourser = $withdrawal->payment_details['montant_total_a_debiter'];
            $wallet = $withdrawal->user->wallet;
            $wallet->unfreezeFunds(
                $montantArembourser, 
                "Dégèle des fonds pour retrait rejeté",
            );

            // Rejeter la demande
            $withdrawal->status = self::STATUS_REJECTED;
            $withdrawal->admin_note = $adminNote;
            $withdrawal->processed_by = $adminId;
            $withdrawal->processed_at = now();
            $withdrawal->refund_at = now();
            $withdrawal->save();

            DB::commit();

            // Notifier l'utilisateur
            $withdrawal->user->notify(new WithdrawalRequestProcessed($withdrawal));

            return [
                'success' => true,
                'message' => 'Demande rejetée avec succès',
                'status_code' => 200
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors du rejet de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du rejet de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Annule une demande de retrait par l'utilisateur
     *
     * @param WithdrawalRequest $withdrawal
     * @param User $user
     * @return array
     */
    public function cancelWithdrawal(WithdrawalRequest $withdrawal, User $user): array
    {
        if ($withdrawal->status !== self::STATUS_PENDING && $withdrawal->status !== self::STATUS_FAILED) {
            return [
                'success' => false,
                'message' => 'Cette demande ne peut pas être annulée car elle n\'est pas en attente',
                'status_code' => 400
            ];
        }

        if ($user->id !== $withdrawal->user_id) {
            return [
                'success' => false,
                'message' => 'Vous n\'avez pas la permission d\'annuler cette demande',
                'status_code' => 403
            ];
        }

        DB::beginTransaction();
        try {
            // Degéler le montant gélé du wallet de l'utilisateur
            $montantArembourser = $withdrawal->payment_details['montant_total_a_debiter'];
            $wallet = $withdrawal->user->wallet;
            $wallet->unfreezeFunds(
                $montantArembourser, 
                "Dégèle des fonds pour retrait rejeté",
            );

            // Annuler la demande
            $withdrawal->status = self::STATUS_CANCELLED;
            $withdrawal->refund_at = now();
            $withdrawal->save();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Demande annulée avec succès',
                'status_code' => 200
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'annulation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Paie la commission au parrain
     *
     * @param User $sponsor
     * @param float $commissionFees
     * @param WithdrawalRequest $withdrawal
     * @return void
     */
    private function paySponsorCommission(User $sponsor, float $commissionFees, WithdrawalRequest $withdrawal): void
    {
        $sponsor->addFunds(
            $commissionFees,
            0,
            0,
            'withdrawal_commission',
            'completed',
            "Vous avez reçu une commission de retrait de " . $commissionFees . '$ pour le retrait effectué par votre filleul ' . $withdrawal->user->name,  
            [
                "Source" => $withdrawal->user->name, 
                "Opération" => "Commission de retrait",
                "Montant" => $commissionFees . ' $',
                "Description" => "vous avez gagné une commission de ". $commissionFees . ' $' . " pour le retrait effectué par votre filleul " . $withdrawal->user->name,
            ]
        );
    }
}
