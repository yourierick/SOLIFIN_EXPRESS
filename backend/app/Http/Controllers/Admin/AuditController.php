<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FinancialAuditLog;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\WalletSystemTransaction;
use App\Models\WalletTransaction;
use App\Models\AuditQueue;
use App\Services\FinancialAnomalyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AuditLogsExport;

/**
 * AuditController - Contrôleur pour la gestion des audits financiers robustes
 * Rôle: Interface API pour la gestion des logs d'audit, statistiques et actions
 * 
 * Ce contrôleur fait partie de la nouvelle architecture d'audit robuste:
 * - Gère les FinancialAuditLog au lieu de FinancialAnomaly
 * - Interface avec les services d'audit robustes
 * - Fournit les statistiques en temps réel
 * - Permet les actions d'audit manuelles
 */
class AuditController extends Controller
{
    private FinancialAnomalyService $auditService;

    public function __construct(FinancialAnomalyService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Fonction utilitaire pour créer une transaction 
     */
    public function createTransaction(array $data, string $type, int $wallet_id = null) {
        if ($type === "system") {
            $walletsystem = WalletSystem::first();
            WalletSystemTransaction::create([
                'source_transaction_reference' => $data['source_transaction_reference'] ?? null,
                'flow' => $data['flow'],
                'nature' => $data['nature'] ,
                'type' => $data['type'],
                'amount' => $data['amount'],
                'status' => $data['status'],
                'solde_marchand_before' => $walletsystem->solde_marchand,
                'solde_marchand_after' => $walletsystem->solde_marchand,
                'engagement_users_before' => $walletsystem->engagement_users,
                'engagement_users_after' => $walletsystem->engagement_users,
                'plateforme_benefices_before' => $walletsystem->plateforme_benefices,
                'plateforme_benefices_after' => $walletsystem->plateforme_benefices,
                'description' => $data['description'],
                'metadata' => $data['metadata'],
                'processed_by' => $data['processed_by'],
                'processed_at' => now(),
                'rejection_reason' => $data['reason'],
            ]);
        }

        if ($type === "user") {
            $wallet = Wallet::where('id', $wallet_id)->first();
            $wallet->transactions()->create([
                'flow' => $data['flow'],
                'nature' => $data['nature'], // Par défaut pour les ajouts de fonds
                'type' => $data['type'],
                'amount' => $data['amount'],
                'fee_amount' => 0,
                'commission_amount' => 0,
                'status' => $data['status'],
                'balance_before' => $wallet->balance,
                'balance_after' => $wallet->balance,
                'description' => $data['description'],
                'metadata' => $data['metadata'],
                'processed_by' => $data['processed_by'],
                'processed_at' => now(),
                'rejection_reason' => $data['reason'],
            ]);
        }
    }

    /**
     * Lister les logs d'audit avec pagination et filtres
     * Rôle: Fournir la liste principale des logs d'audit
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = FinancialAuditLog::with('auditable');

            // Filtres
            if ($request->filled('audit_type')) {
                $query->where('audit_type', $request->audit_type);
            }

            if ($request->filled('severity')) {
                $query->where('severity', $request->severity);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('entity_type')) {
                $query->where('entity_type', $request->entity_type);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('invariant_violated', 'like', "%{$search}%")
                      ->orWhere('entity_id', 'like', "%{$search}%");
                });
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Tri
            $sort = $request->get('sort', 'created_at');
            $order = $request->get('order', 'desc');
            $query->orderBy($sort, $order);

            // Pagination
            $perPage = min($request->get('per_page', 30), 100);
            $logs = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $logs->items(),
                    'total' => $logs->total(),
                    'per_page' => $logs->perPage(),
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des logs d\'audit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des audits
     * Rôle: Fournir les métriques en temps réel pour le tableau de bord
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->auditService->getAuditStats();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher les détails d'un log d'audit spécifique
     * Rôle: Fournir les informations complètes d'un log
     */
    public function show($id): JsonResponse
    {
        try {
            $log = FinancialAuditLog::with('auditable')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $log
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Log d\'audit non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Marquer un log d'audit comme résolu
     * Rôle: Permettre la résolution manuelle des anomalies
     */
    public function resolve(Request $request, $id): JsonResponse
    {
        try {
            $log = FinancialAuditLog::findOrFail($id);

            if ($log->status === 'resolved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce log d\'audit est déjà résolu'
                ], 400);
            }

            DB::beginTransaction();

            $log->update([
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolved_by' => auth()->id(),
                'metadata' => array_merge($log->metadata ?? [], [
                    'resolution_note' => $request->input('resolution_note', ''),
                    'resolved_by_admin' => auth()->id(),
                    'resolved_at' => now()->toISOString()
                ])
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Log d\'audit résolu avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du log d\'audit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer un log d'audit comme en investigation
     * Rôle: Permettre le suivi des anomalies en cours d'investigation
     */
    public function investigate($id): JsonResponse
    {
        try {
            $log = FinancialAuditLog::findOrFail($id);

            if ($log->status === 'investigating') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce log d\'audit est déjà en investigation'
                ], 400);
            }

            $log->update([
                'status' => 'investigating',
                'metadata' => array_merge($log->metadata ?? [], [
                    'investigation_started_at' => now()->toISOString(),
                    'investigated_by_admin' => auth()->id()
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Log d\'audit marqué comme en investigation'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage en investigation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Planifier les audits périodiques
     * Rôle: Déclencher manuellement la planification des audits
     */
    public function schedulePeriodic(): JsonResponse
    {
        try {
            $scheduledCount = $this->auditService->schedulePeriodicAudits();

            return response()->json([
                'success' => true,
                'message' => "{$scheduledCount} audits périodiques planifiés avec succès",
                'data' => [
                    'scheduled_count' => $scheduledCount
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la planification des audits périodiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exécuter un audit global
     * Rôle: Déclencher manuellement un audit global complet
     */
    public function executeGlobal(): JsonResponse
    {
        try {
            $results = $this->auditService->executeGlobalAudit();

            return response()->json([
                'success' => true,
                'message' => 'Audit global exécuté avec succès',
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'exécution de l\'audit global',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter les logs d'audit
     * Rôle: Permettre l'export des données en différents formats
     */
    public function export(Request $request)
    {
        try {
            $query = FinancialAuditLog::query();

            // Appliquer les mêmes filtres que la méthode index
            if ($request->filled('audit_type')) {
                $query->where('audit_type', $request->audit_type);
            }

            if ($request->filled('severity')) {
                $query->where('severity', $request->severity);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('entity_type')) {
                $query->where('entity_type', $request->entity_type);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('invariant_violated', 'like', "%{$search}%");
                });
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $logs = $query->orderBy('created_at', 'desc')->get();

            // Créer le fichier CSV avec en-têtes françaises
            $filename = 'audit-logs-' . now()->format('Y-m-d-His') . '.csv';
            
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($logs) {
                $file = fopen('php://output', 'w');
                
                // Ajouter BOM pour l'encodage UTF-8
                fwrite($file, "\xEF\xBB\xBF");
                
                // En-têtes CSV
                fputcsv($file, [
                    'ID',
                    'Type d\'audit',
                    'Entité',
                    'Invariant',
                    'Sévérité',
                    'Valeur attendue',
                    'Valeur réelle',
                    'Écart',
                    'Statut',
                    'Date de création',
                    'Date de résolution',
                    'Métadonnées'
                ], ';');
                
                // Données
                foreach ($logs as $log) {
                    fputcsv($file, [
                        $log->id,
                        $this->getAuditTypeLabel($log->audit_type),
                        $log->entity_type . ($log->entity_id ? ' #' . $log->entity_id : ''),
                        $this->getInvariantLabel($log->invariant_violated),
                        $this->getSeverityLabel($log->severity),
                        number_format($log->expected_value, 2, '.', ',') . ' $',
                        number_format($log->actual_value, 2, '.', ',') . ' $',
                        number_format($log->difference, 2, '.', ',') . ' $',
                        $this->getStatusLabel($log->status),
                        $log->created_at->format('d/m/Y H:i:s'),
                        $log->resolved_at ? $log->resolved_at->format('d/m/Y H:i:s') : '',
                        json_encode($log->metadata ?? [], JSON_UNESCAPED_UNICODE)
                    ], ';');
                }
                
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des logs d\'audit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le libellé du type d'audit
     */
    private function getAuditTypeLabel($type): string
    {
        $labels = [
            'realtime' => 'Temps Réel',
            'batch' => 'Ciblé',
            'periodic' => 'Périodique',
            'global' => 'Global',
            'manual' => 'Manuel'
        ];
        return $labels[$type] ?? $type;
    }

    /**
     * Obtenir le libellé de l'invariant
     */
    private function getInvariantLabel($invariant): string
    {
        $labels = [
            'balance_ledger_mismatch' => 'Incohérence Balance/Grand livre',
            'negative_balance' => 'Balance Négative',
            'unusual_transaction_size' => 'Transaction Inhabituelle',
            'high_frequency_transactions' => 'Transactions Haute Fréquence',
            'conservation_of_funds_violation' => 'Violation Conservation Fonds',
            'accounting_equation_violation' => 'Violation Équation Comptable',
            'system_balance_mismatch' => 'Incohérence Balance Système',
            'liquidity_mismatch' => 'Incohérence Liquidité',
            'risk_concentration' => 'Concentration Risque',
            'abnormal_inactivity' => 'Inactivité Anormale',
            'data_corruption' => 'Corruption Données',
            'orphan_transactions' => 'Transactions Orphelines'
        ];
        return $labels[$invariant] ?? $invariant;
    }

    /**
     * Obtenir le libellé de sévérité
     */
    private function getSeverityLabel($severity): string
    {
        $labels = [
            'critical' => 'Critique',
            'high' => 'Élevée',
            'medium' => 'Moyenne',
            'low' => 'Faible'
        ];
        return $labels[$severity] ?? $severity;
    }

    /**
     * Obtenir le libellé de statut
     */
    private function getStatusLabel($status): string
    {
        $labels = [
            'pending' => 'En attente',
            'investigating' => 'En investigation',
            'resolved' => 'Résolu',
            'false_positive' => 'Faux positif'
        ];
        return $labels[$status] ?? $status;
    }

    /**
     * Obtenir les logs récents pour le dashboard
     * Rôle: Fournir un résumé rapide pour l'interface principale
     */
    public function recent(Request $request): JsonResponse
    {
        try {
            $limit = min($request->get('limit', 10), 50);
            
            $logs = FinancialAuditLog::with('auditable')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des logs récents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les métriques de performance des audits
     * Rôle: Fournir des indicateurs de performance
     */
    public function metrics(): JsonResponse
    {
        try {
            $metrics = [
                'total_logs' => FinancialAuditLog::count(),
                'logs_today' => FinancialAuditLog::whereDate('created_at', today())->count(),
                'logs_this_week' => FinancialAuditLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'logs_this_month' => FinancialAuditLog::whereMonth('created_at', now()->month)->count(),
                
                'by_severity' => FinancialAuditLog::selectRaw('severity, COUNT(*) as count')
                    ->groupBy('severity')
                    ->pluck('count', 'severity')
                    ->toArray(),
                    
                'by_type' => FinancialAuditLog::selectRaw('audit_type, COUNT(*) as count')
                    ->groupBy('audit_type')
                    ->pluck('count', 'audit_type')
                    ->toArray(),
                    
                'by_status' => FinancialAuditLog::selectRaw('status, COUNT(*) as count')
                    ->groupBy('status')
                    ->pluck('count', 'status')
                    ->toArray(),
                    
                'queue_stats' => [
                    'pending_jobs' => AuditQueue::where('attempts', '<', 'max_attempts')->count(),
                    'failed_jobs' => AuditQueue::where('attempts', '>=', 'max_attempts')->count(),
                    'jobs_by_type' => AuditQueue::selectRaw('audit_type, COUNT(*) as count')
                        ->groupBy('audit_type')
                        ->pluck('count', 'audit_type')
                        ->toArray()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $metrics
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des métriques',
            ]);
        }
    }

    /**
     * Construire les métadonnées d'anomalie pour les transactions
     */
    private function buildAnomalyMetadata($anomaly)
    {
        return [
            "anomaly_id" => $anomaly->id,
            "invariant_violated" => $anomaly->invariant_violated,
            "expected_value" => $anomaly->expected_value,
            "actual_value" => $anomaly->actual_value,
            "difference" => $anomaly->difference,
            "severity" => $anomaly->severity,
            "correction_timestamp" => now()->toISOString(),
        ];
    }

    /**
     * Valider la requête de correction
     */
    private function validateCorrectionRequest(Request $request)
    {
        $request->validate([
            'correction_type' => 'required|string',
            'correction_data' => 'required|array',
        ]);

        $correctionType = $request->correction_type;
        $correctionData = $request->correction_data;

        // Validation spécifique par type
        if ($correctionType === "adjustment_transaction" || $correctionType === "reverse_transaction") {
            $request->validate([
                'correction_data.entity_type' => 'required|string|in:ledger global,ledger utilisateur',
                'correction_data.sub_entity' => 'required|string|in:provider-marchand,benefices-engagements,engagements-benefices,engagements-provider',
                'correction_data.flow' => 'required|in:credit,debit',
                'correction_data.nature' => 'required|in:internal,external',
                'correction_data.amount' => 'required|numeric',
                'correction_data.reason' => 'required|string',
                'correction_data.should_impact_balance' => 'required|string',
            ]);
        }

        if ($correctionType === "reverse_transaction") {
            $request->validate([
                'correction_data.transaction_original_ref' => 'required|string',
            ]);
        }

        if ($correctionType === "balance_update") {
            $request->validate([
                'correction_data.entity_type' => 'required|string',
                'correction_data.sub_entity' => 'required|string|in:solde-marchand,bénéfices,engagements,balance-utilisateur,balance-disponible,balance-gélée',
                'correction_data.amount' => 'required|string',
                'correction_data.reason' => 'required|string',
                'correction_data.flow' => 'required|in:credit,debit',
            ]);
        }

        if ($correctionData['entity_type'] === "ledger utilisateur") {
            $request->validate([
                'correction_data.wallet_id' => 'required|numeric',
            ]);
        }

        $correctionData = array_merge(['correction_type' => $request->correction_type], $correctionData);

        return $correctionData;
    }

    /**
     * Obtenir une anomalie par ID
     */
    private function getAnomaly($id)
    {
        $anomaly = FinancialAuditLog::where('id', $id)->first();
        if (!$anomaly) {
            throw new \Exception("Anomalie non trouvée");
        }
        return $anomaly;
    }

    /**
     * Gérer les erreurs de correction
     */
    private function handleCorrectionError(\Exception $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la correction de l\'anomalie',
            'error' => $e->getMessage()
        ], 500);
    }

    /**
     * Traiter la correction d'anomalie
     */
    public function correctAnomaly(Request $request, $id) {
        try {
            $correctionData = $this->validateCorrectionRequest($request);
            $anomaly = $this->getAnomaly($id);
            
            DB::beginTransaction();
            
            $result = $this->processCorrection($correctionData, $anomaly);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Correction appliquée avec succès',
                'data' => $result
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            return $this->handleCorrectionError($e);
        }
    }

    /**
     * Traiter la logique de correction
     */
    private function processCorrection($correctionData, $anomaly)
    {
        $correctionType = $correctionData['correction_type'];
        $metadata = $this->buildAnomalyMetadata($anomaly);
        
        switch ($correctionType) {
            case "adjustment_transaction":
                return $this->processAdjustmentTransaction($correctionData, $anomaly, $metadata);
            case "reverse_transaction":
                return $this->processReverseTransaction($correctionData, $anomaly, $metadata);
            case "balance_update":
                return $this->processBalanceUpdate($correctionData, $anomaly);
            default:
                throw new \Exception("Type de correction non supporté: {$correctionType}");
        }
    }

    /**
     * Traiter une transaction d'ajustement
     */
    private function processAdjustmentTransaction($correctionData, $anomaly, $metadata)
    {
        $entityType = $correctionData['entity_type'];
        $subEntity = $correctionData['sub_entity'];
        $flow = $correctionData['flow'];
        $nature = $correctionData['nature'];
        $amount = $correctionData['amount'];
        $reason = $correctionData['reason'];
        $shouldImpactBalance = $correctionData['should_impact_balance'];
        
        if ($entityType === "ledger global") {
            return $this->adjustGlobalLedger($subEntity, $amount, $flow, $nature, $reason, $shouldImpactBalance, $metadata);
        } else {
            $walletId = $correctionData['wallet_id'];
            return $this->adjustUserWallet($walletId, $amount, $flow, $nature, $reason, $shouldImpactBalance, $metadata);
        }
    }

    /**
     * Ajuster le ledger global
     */
    private function adjustGlobalLedger($subEntity, $amount, $flow, $nature, $reason, $shouldImpactBalance, $metadata)
    {
        $walletSystem = WalletSystem::first();
        
        if ($shouldImpactBalance === "oui") {
            return $this->adjustGlobalLedgerWithImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $metadata);
        } else {
            return $this->adjustGlobalLedgerWithoutImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $metadata);
        }
    }

    /**
     * Ajuster le ledger global avec impact sur la balance
     */
    private function adjustGlobalLedgerWithImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $metadata)
    {
        switch ($subEntity) {
            case 'provider-marchand':
                return $walletSystem->addFunds(
                    $amount,
                    'adjustment',
                    'completed',
                    'Ajustement de solde depuis API Provider: ' . $reason,
                    auth()->id(),
                    $metadata,
                    $reason
                );
                
            case 'benefices-engagements':
                return $walletSystem->addEngagements(
                    $amount,
                    'adjustment',
                    'completed',
                    'Ajustement de solde depuis les bénéfices SOLIFIN: ' . $reason,
                    auth()->id(),
                    $metadata,
                    $reason
                );
                
            case 'engagements-benefices':
                return $walletSystem->addProfits(
                    $amount,
                    'adjustment',
                    'completed',
                    'Ajustement de solde depuis les engagements utilisateurs: ' . $reason,
                    auth()->id(),
                    $metadata,
                    $reason
                );
                
            case 'engagements-provider':
                return $this->adjustEngagementsProvider($walletSystem, $amount, $flow, $nature, $reason, $metadata);
                
            default:
                throw new \Exception("Sous-entité non supportée: {$subEntity}");
        }
    }

    /**
     * Ajuster les engagements provider
     */
    private function adjustEngagementsProvider($walletSystem, $amount, $flow, $nature, $reason, $metadata)
    {
        $soldeMarchandBefore = $walletSystem->solde_marchand;
        $engagementUsersBefore = $walletSystem->engagement_users;
        $plateformeBeneficesBefore = $walletSystem->plateforme_benefices;
        
        $walletSystem->solde_marchand -= $amount;
        $walletSystem->engagement_users -= $amount;
        $walletSystem->save();
        
        return WalletSystemTransaction::create([
            'flow' => 'out',
            'nature' => $nature,
            'type' => 'adjustment',
            'amount' => $amount,
            'status' => 'completed',
            'solde_marchand_before' => $soldeMarchandBefore,
            'solde_marchand_after' => $walletSystem->solde_marchand,
            'engagement_users_before' => $engagementUsersBefore,
            'engagement_users_after' => $walletSystem->engagement_users,
            'plateforme_benefices_before' => $plateformeBeneficesBefore,
            'plateforme_benefices_after' => $walletSystem->plateforme_benefices,
            'description' => $reason,
            'metadata' => $metadata,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Ajuster le ledger global sans impact sur la balance
     */
    private function adjustGlobalLedgerWithoutImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $metadata)
    {
        $data = [
            'flow' => $flow === "credit" ? 'in' : 'out',
            'nature' => $nature,
            'type' => 'adjustment',
            'amount' => $amount,
            'status' => 'completed',
            'description' => $reason,
            'metadata' => $metadata,
            'processed_by' => auth()->id(),
            'reason' => $reason,
        ];
        
        return $this->createTransaction($data, 'system');
    }

    /**
     * Ajuster le wallet utilisateur
     */
    private function adjustUserWallet($walletId, $amount, $flow, $nature, $reason, $shouldImpactBalance, $metadata)
    {
        $wallet = Wallet::where('id', $walletId)->first();
        if (!$wallet) {
            throw new \Exception("Portefeuille utilisateur non trouvé");
        }

        if ($shouldImpactBalance === "oui") {
            if ($flow === 'credit') {
                return $wallet->addFunds(
                    $amount,
                    0,
                    0,
                    'adjustment',
                    'completed',
                    $reason,
                    auth()->id(),
                    $metadata
                );
            } else {
                return $wallet->withdrawFunds(
                    $amount,
                    0,
                    0,
                    'internal',
                    'adjustment',
                    'completed',
                    $reason,
                    auth()->id(),
                    $metadata
                );
            }
        } else {
            $data = [
                'flow' => $flow === "credit" ? 'in' : 'out',
                'nature' => $nature,
                'type' => 'adjustment',
                'amount' => $amount,
                'status' => 'completed',
                'description' => $reason,
                'metadata' => $metadata,
                'processed_by' => auth()->id(),
                'reason' => $reason,
            ];
            
            return $this->createTransaction($data, 'user', $walletId);
        }
    }

    /**
     * Traiter une transaction reverse
     */
    private function processReverseTransaction($correctionData, $anomaly, $metadata)
    {
        $entityType = $correctionData['entity_type'];
        $subEntity = $correctionData['sub_entity'];
        $flow = $correctionData['flow'];
        $nature = $correctionData['nature'];
        $amount = $correctionData['amount'];
        $reason = $correctionData['reason'];
        $originalTransactionRef = $correctionData['transaction_original_ref'];
        $shouldImpactBalance = $correctionData['should_impact_balance'];
        
        if ($entityType === "ledger global") {
            return $this->reverseGlobalLedger($subEntity, $amount, $flow, $nature, $reason, $shouldImpactBalance, $originalTransactionRef, $metadata);
        } else {
            $walletId = $correctionData['wallet_id'];
            return $this->reverseUserWallet($walletId, $amount, $flow, $nature, $reason, $shouldImpactBalance, $originalTransactionRef, $metadata);
        }
    }

    /**
     * Reverse le ledger global
     */
    private function reverseGlobalLedger($subEntity, $amount, $flow, $nature, $reason, $shouldImpactBalance, $originalTransactionRef, $metadata)
    {
        $walletSystem = WalletSystem::first();
        
        if ($shouldImpactBalance === "oui") {
            return $this->reverseGlobalLedgerWithImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $originalTransactionRef, $metadata);
        } else {
            return $this->reverseGlobalLedgerWithoutImpact($walletSystem, $amount, $flow, $nature, $reason, $originalTransactionRef, $metadata);
        }
    }

    /**
     * Reverse le ledger global avec impact sur la balance
     */
    private function reverseGlobalLedgerWithImpact($walletSystem, $subEntity, $amount, $flow, $nature, $reason, $originalTransactionRef, $metadata)
    {
        $soldeMarchandBefore = $walletSystem->solde_marchand;
        $engagementUsersBefore = $walletSystem->engagement_users;
        $plateformeBeneficesBefore = $walletSystem->plateforme_benefices;
        
        switch ($subEntity) {
            case 'provider-marchand':
                if ($flow === "credit") {
                    $walletSystem->solde_marchand += $amount;
                    $walletSystem->plateforme_benefices += $amount;
                } else {
                    $walletSystem->solde_marchand -= $amount;
                    $walletSystem->plateforme_benefices -= $amount;
                }
                break;
                
            case 'benefices-engagements':
                if ($flow === "credit") {
                    $walletSystem->engagement_users -= $amount;
                    $walletSystem->plateforme_benefices += $amount;
                } else {
                    $walletSystem->plateforme_benefices -= $amount;
                    $walletSystem->engagement_users += $amount;
                }
                break;
                
            case 'engagements-provider':
                $walletSystem->solde_marchand -= $amount;
                $walletSystem->engagement_users -= $amount;
                break;
                
            default:
                throw new \Exception("Sous-entité non supportée: {$subEntity}");
        }
        
        $walletSystem->save();
        
        return WalletSystemTransaction::create([
            'source_transaction_reference' => $originalTransactionRef,
            'flow' => $flow === 'credit' ? 'in' : 'out',
            'nature' => $nature,
            'type' => 'reverse',
            'amount' => $amount,
            'status' => 'completed',
            'solde_marchand_before' => $soldeMarchandBefore,
            'solde_marchand_after' => $walletSystem->solde_marchand,
            'engagement_users_before' => $engagementUsersBefore,
            'engagement_users_after' => $walletSystem->engagement_users,
            'plateforme_benefices_before' => $plateformeBeneficesBefore,
            'plateforme_benefices_after' => $walletSystem->plateforme_benefices,
            'description' => $reason,
            'metadata' => $metadata,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Reverse le ledger global sans impact sur la balance
     */
    private function reverseGlobalLedgerWithoutImpact($walletSystem, $amount, $flow, $nature, $reason, $originalTransactionRef, $metadata)
    {
        $soldeMarchandBefore = $walletSystem->solde_marchand;
        $engagementUsersBefore = $walletSystem->engagement_users;
        $plateformeBeneficesBefore = $walletSystem->plateforme_benefices;
        
        return WalletSystemTransaction::create([
            'source_transaction_reference' => $originalTransactionRef,
            'flow' => $flow === 'credit' ? 'in' : 'out',
            'nature' => $nature,
            'type' => 'reverse',
            'amount' => $amount,
            'status' => 'completed',
            'solde_marchand_before' => $soldeMarchandBefore,
            'solde_marchand_after' => $walletSystem->solde_marchand,
            'engagement_users_before' => $engagementUsersBefore,
            'engagement_users_after' => $walletSystem->engagement_users,
            'plateforme_benefices_before' => $plateformeBeneficesBefore,
            'plateforme_benefices_after' => $walletSystem->plateforme_benefices,
            'description' => $reason,
            'metadata' => $metadata,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Reverse le wallet utilisateur
     */
    private function reverseUserWallet($walletId, $amount, $flow, $nature, $reason, $shouldImpactBalance, $originalTransactionRef, $metadata)
    {
        $wallet = Wallet::where('id', $walletId)->first();
        if (!$wallet) {
            throw new \Exception("Portefeuille utilisateur non trouvé");
        }

        if ($shouldImpactBalance === "oui") {
            if ($flow === 'credit') {
                return $wallet->addFunds(
                    $amount,
                    0,
                    0,
                    'reverse',
                    'completed',
                    $reason,
                    auth()->id(),
                    array_merge($metadata, ['original_transaction_reference' => $originalTransactionRef])
                );
            } else {
                return $wallet->withdrawFunds(
                    $amount,
                    0,
                    0,
                    'internal',
                    'reverse',
                    'completed',
                    $reason,
                    auth()->id(),
                    array_merge($metadata, ['original_transaction_reference' => $originalTransactionRef])
                );
            }
        } else {
            $data = [
                'flow' => $flow === "credit" ? 'in' : 'out',
                'nature' => $nature,
                'type' => 'reverse',
                'amount' => $amount,
                'status' => 'completed',
                'description' => $reason,
                'metadata' => array_merge($metadata, ['original_transaction_reference' => $originalTransactionRef]),
                'processed_by' => auth()->id(),
                'reason' => $reason,
            ];
            
            return $this->createTransaction($data, 'user', $walletId);
        }
    }

    /**
     * Traiter la mise à jour de balance
     */
    private function processBalanceUpdate($correctionData, $anomaly)
    {
        $entityType = $correctionData['entity_type'];
        $subEntity = $correctionData['sub_entity'];
        $amount = $correctionData['amount'];
        
        if ($entityType === "ledger global") {
            return $this->updateGlobalBalance($subEntity, $amount);
        } else {
            $walletId = $correctionData['wallet_id'];
            return $this->updateUserBalance($walletId, $subEntity, $amount);
        }
    }

    /**
     * Mettre à jour la balance globale
     */
    private function updateGlobalBalance($subEntity, $amount)
    {
        $walletSystem = WalletSystem::first();
        
        switch ($subEntity) {
            case 'solde-marchand':
                $walletSystem->solde_marchand = $amount;
                break;
            case 'bénéfices':
                $walletSystem->plateforme_benefices = $amount;
                break;
            case 'engagements':
                $walletSystem->engagement_users = $amount;
                break;
            default:
                throw new \Exception("Sous-entité non supportée: {$subEntity}");
        }
        
        $walletSystem->save();
        return ['message' => 'Balance globale mise à jour avec succès'];
    }

    /**
     * Mettre à jour la balance utilisateur
     */
    private function updateUserBalance($walletId, $subEntity, $amount)
    {
        $wallet = Wallet::where('id', $walletId)->first();
        if (!$wallet) {
            throw new \Exception("Portefeuille utilisateur non trouvé");
        }
        
        switch ($subEntity) {
            case 'balance-utilisateur':
                $wallet->balance = $amount;
                break;
            case 'balance-disponible':
                $wallet->available_balance = $amount;
                break;
            case 'balance-gélée':
                $wallet->frozen_balance = $amount;
                break;
            default:
                throw new \Exception("Sous-entité non supportée: {$subEntity}");
        }
        
        $wallet->save();
        return ['message' => 'Balance utilisateur mise à jour avec succès'];
    }
}
