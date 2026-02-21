<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallet_systems', function (Blueprint $table) {
            $table->id();
            $table->decimal('solde_marchand', 15, 2)->default(0);
            $table->decimal('engagement_users', 15, 2)->default(0);
            $table->decimal('plateforme_benefices', 15, 2)->default(0);
            $table->timestamps();
        });

        // Créer le wallet marchand par défaut
        DB::table('wallet_systems')->insert([
            [
                'solde_marchand' => 0,
                'engagement_users' => 0,
                'plateforme_benefices' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        Schema::create('wallet_system_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('session_id')->nullable()->comment('ID de session SerdiPay');
            $table->string('transaction_id')->nullable()->comment('ID de transaction SerdiPay');
            $table->enum('flow', ['in', 'out']);
            $table->enum('nature', ['external', 'internal']);
            $table->enum('type', [
                'boost_sale', 'pack_sale', 'virtual_sale', 'virtual_send', 'withdrawal_commission', 'transfer_commission', 'sale_commission', 'funds_withdrawal', 
                'esengo_funds_transfer', 'balance_adjustment', 'sponsorship_commission', 'solifin_funds_withdrawal',
            ]);
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'reversed'])->default('pending');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->decimal('solde_marchand_before', 15, 2)->nullable(); // Solde marchand avant
            $table->decimal('solde_marchand_after', 15, 2)->nullable();  // Solde marchand après
            $table->decimal('engagement_users_before', 15, 2)->nullable(); // Engagement avant
            $table->decimal('engagement_users_after', 15, 2)->nullable();  // Engagement après
            $table->decimal('plateforme_benefices_before', 15, 2)->nullable(); // Bénéfices avant
            $table->decimal('plateforme_benefices_after', 15, 2)->nullable();  // Bénéfices après
            $table->foreignId('processed_by')->nullable(); // Qui a traité
            $table->timestamp('processed_at')->nullable();   // Quand traité
            $table->text('rejection_reason')->nullable();   // Raison échec/rejet
            $table->timestamps();
            
            $table->index(['type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_system_transactions');
        Schema::dropIfExists('wallet_systems');
    }
};
