<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('available_balance', 15, 2)->default(0);
            $table->decimal('frozen_balance', 15, 2)->default(0);
            $table->decimal('points', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique('user_id');
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained();
            $table->string('reference')->unique();
            $table->string('session_id')->nullable()->comment('ID de session SerdiPay');
            $table->string('transaction_id')->nullable()->comment('ID de transaction SerdiPay');
            $table->enum('flow', ['in', 'out', 'freeze', 'unfreeze']);
            $table->enum('nature', ['external', 'internal']);
            $table->enum('type', [
                'funds_receipt', 'funds_withdrawal', 'freeze_funds', 'unfreeze_funds', 'funds_transfer', 
                'pack_purchase', 'virtual_purchase', 'virtual_receipt', 'boost_purchase', 
                'digital_product_purchase', 'digital_product_sale', 
                'sponsorship_commission', 'withdrawal_commission', 'transfer_commission', 'adjustment', 'reverse'
            ]);
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->decimal('commission_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'reversed'])->default('pending');
            $table->decimal('balance_before', 15, 2)->nullable(); // Solde avant transaction
            $table->decimal('balance_after', 15, 2)->nullable();  // Solde après transaction
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('processed_by')->nullable(); // Qui a traité
            $table->timestamp('processed_at')->nullable();   // Quand traité
            $table->text('rejection_reason')->nullable();   // Raison échec/rejet
            $table->timestamps();
            
            $table->index(['wallet_id', 'type']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
}; 