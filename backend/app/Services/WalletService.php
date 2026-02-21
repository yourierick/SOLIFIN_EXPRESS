<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletSystem;

class WalletService
{
    // Constantes pour les statuts
    const STATUS_COMPLETED = 'completed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_PENDING = 'pending';
    const STATUS_FAILED = 'failed';
    const STATUS_REVERSED = 'reversed';
    
    
    /**
     * Crée un wallet pour un utilisateur
     *
     * @param int $userId
     * @return Wallet
     */

    
    public function createUserWallet($userId)
    {
        return Wallet::create([
            'user_id' => $userId,
            'balance' => 0,
            'available_balance' => 0,
            'frozen_balance' => 0,
            'points' => 0,
            'is_active' => true,
        ]);
    }

    /**
     * Crée le wallet system
     *
     * @return WalletSystem
     */

    
    public function createSystemWallet()
    {
        return WalletSystem::create([
            'solde_marchand' => 0,
            'engagement_users' => 0,
            'plateforme_benefices' => 0,
        ]);
    }

    /**
     * Enregistre une transaction dans le wallet système
     *
     * @param array $transactionData
     * @return \App\Models\WalletSystemTransaction
     */
    public function recordSystemTransaction($transactionData)
    {
        $walletSystem = WalletSystem::first();
        if (!$walletSystem) {
            $this->createSystemWallet();
        }
        return $walletSystem->transactions()->create([
            'session_id' => $transactionData['session_id'] ?? null,
            'transaction_id' => $transactionData['transaction_id'] ?? null,
            'flow' => $transactionData['flow'],
            'nature' => $transactionData['nature'],
            'type' => $transactionData['type'],
            'amount' => $transactionData['amount'],
            'status' => $transactionData['status'],
            'description' => $transactionData['description'],
            'metadata' => $transactionData['metadata'] ?? [],
            'solde_marchand_before' => $transactionData['solde_marchand_before'],
            'solde_marchand_after' => $transactionData['solde_marchand_after'],
            'engagement_users_before' => $transactionData['engagement_users_before'],
            'engagement_users_after' => $transactionData['engagement_users_after'],
            'plateforme_benefices_before' => $transactionData['plateforme_benefices_before'],
            'plateforme_benefices_after' => $transactionData['plateforme_benefices_after'],
            'processed_by' => $transactionData['processed_by'] ?? null,
            'processed_at' => $transactionData['processed_at'] ?? null,
            'rejection_reason' => $transactionData['rejection_reason'] ?? null,
        ]);
    }

    /**
     * Enregistre une transaction dans le wallet utilisateur
     *
     * @param Wallet $userWallet
     * @param array $transactionData
     * @return \App\Models\WalletTransaction
     */
    public function recordUserTransaction($userWallet, $transactionData)
    {
        return $userWallet->transactions()->create([
            'session_id' => $transactionData['session_id'] ?? null,
            'transaction_id' => $transactionData['transaction_id'] ?? null,
            'flow' => $transactionData['flow'],
            'nature' => $transactionData['nature'],
            'type' => $transactionData['type'],
            'amount' => $transactionData['amount'],
            'fee_amount' => $transactionData['fee_amount'] ?? 0,
            'commission_amount' => $transactionData['commission_amount'] ?? 0,
            'balance_before' => $transactionData['balance_before'],
            'balance_after' => $transactionData['balance_after'],
            'status' => $transactionData['status'],
            'description' => $transactionData['description'] ?? null,
            'metadata' => $transactionData['metadata'] ?? [],
            'processed_by' => $transactionData['processed_by'] ?? null,
            'processed_at' => $transactionData['processed_at'] ?? null,
            'rejection_reason' => $transactionData['rejection_reason'] ?? null,
        ]);
    }
}
