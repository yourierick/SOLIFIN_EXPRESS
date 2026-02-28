import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import {
  TablePagination,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tooltip,
} from "@mui/material";

/**
 * FinancialAnomalies - Composant de gestion des audits financiers robustes
 * Rôle: Interface complète pour la gestion des logs d'audit, statistiques et actions
 * 
 * Nouvelle architecture:
 * - Utilise FinancialAuditLog au lieu de FinancialAnomaly
 * - Interface avec les services d'audit robustes
 * - Statistiques en temps réel
 * - Actions d'audit manuelles
 */
const FinancialAnomalies = () => {
  const { isDarkMode } = useTheme();
  
  // États principaux
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // États de pagination
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  
  // États de filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    audit_type: "",
    severity: "",
    status: "",
    entity_type: "",
    search: "",
    date_from: "",
    date_to: "",
  });
  
  // États d'actions
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({});
  const exportMenuRef = React.useRef(null);
  const [actionLoading, setActionLoading] = useState({});

  // Charger les logs d'audit
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        per_page: rowsPerPage,
        sort: 'created_at',
        order: 'desc',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      const response = await axios.get(`/api/admin/audit-logs?${params}`);
      
      if (response.data.success) {
        setAuditLogs(response.data.data.data);
        setTotalCount(response.data.data.total);
      } else {
        toast.error("Erreur lors du chargement des logs d'audit");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des logs d'audit:", error);
      toast.error("Erreur lors du chargement des logs d'audit");
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques d'audit
  const fetchAuditStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/admin/audit-stats');
      
      if (response.data.success) {
        setAuditStats(response.data.data);
      } else {
        toast.error("Erreur lors du chargement des statistiques");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [page, rowsPerPage, filters]);

  // Obtenir les options de correction basées sur le type d'anomalie
  const getCorrectionOptions = (log) => {
    const options = [];
    
    // Options pour les incohérences de balance/ledger
    if (log.invariant_violated?.includes('mismatch') || log.invariant_violated?.includes('ledger')) {
      options.push({
        id: 'reverse_transaction',
        title: 'Transaction Reverse Ciblée',
        description: 'Créer une transaction reverse pour corriger l\'incohérence',
        icon: '↩️',
        fields: [
          { name: 'entity_type', label: 'Entité ciblée', type: 'select', options: ['ledger global', 'ledger utilisateur'], required: true },
          { name: 'sub_entity', label: 'Sous entité ciblée', type: 'select', options: ['provider-marchand', 'benefices-engagements', 'engagements-benefices', 'engagements-provider'], required: true },
          { name: 'wallet_id', label: 'Id du wallet cible (A préciser pour ledger utilisateur)', type: 'number'},
          { name: 'transaction_original_ref', label: 'Référence de la transaction originale', type: 'text', required: true },
          { name: 'nature', label: 'Nature', type: 'select', options: ['internal', 'external'], required: true },
          { name: 'flow', label: 'Type du reverse', type: 'select', options: ['credit', 'debit'], required: true },
          { name: 'amount', label: 'Montant', type: 'number', required: true },
          { name: 'reason', label: 'Raison', type: 'text', required: true },
          { name: 'should_impact_balance', label: 'Dois impacter la balance', type: 'select', options: ['oui', 'non'], required: true }
        ]
      });
      
      options.push({
        id: 'adjustment_transaction',
        title: 'Transaction d\'Ajustement',
        description: 'Ajuster le solde avec une transaction de correction',
        icon: '⚖️',
        fields: [
          { name: 'entity_type', label: 'Entité ciblée', type: 'select', options: ['ledger global', 'ledger utilisateur'], required: true },
          { name: 'sub_entity', label: 'Sous entité ciblée', type: 'select', options: ['provider-marchand', 'benefices-engagements', 'engagements-benefices', 'user-balance'], required: true },
          { name: 'wallet_id', label: 'Id du wallet cible (A préciser pour ledger utilisateur)', type: 'number'},
          { name: 'nature', label: 'Nature', type: 'select', options: ['internal', 'external'], required: true },
          { name: 'flow', label: 'Type d\'ajustement', type: 'select', options: ['credit', 'debit'], required: true },
          { name: 'amount', label: 'Montant', type: 'number', required: true },
          { name: 'reason', label: 'Raison', type: 'text', required: true },
          { name: 'should_impact_balance', label: 'Dois impacter la balance', type: 'select', options: ['oui', 'non'], required: true }
        ]
      });
      
      options.push({
        id: 'balance_update',
        title: 'Mise à Jour de Balance',
        description: 'Mettre à jour directement la balance du wallet',
        icon: '🔄',
        fields: [
          { name: 'entity_type', label: 'Entité ciblée', type: 'select', options: ['ledger global', 'ledger utilisateur'], required: true },
          { name: 'sub_entity', label: 'Sous entité ciblée', type: 'select', options: ['solde-marchand', 'bénéfices', 'engagements', 'balance-utilisateur', 'balance-disponible', 'balance-gélée'], required: true },
          { name: 'wallet_id', label: 'Id du wallet cible (A préciser pour wallet utilisateur)', type: 'number'},
          { name: 'flow', label: 'Type de mise à jour', type: 'select', options: ['credit', 'debit'], required: true },
          { name: 'amount', label: 'Nouvelle Balance', type: 'number', required: true },
          { name: 'reason', label: 'Raison de Mise à Jour', type: 'text', required: true },
        ]
      });
    }
    
    return options;
  };

  // Gérer la sélection d'option de correction
  const handleCorrectionSelect = (correction) => {
    setSelectedCorrection(correction);
    // Initialiser le formulaire avec les valeurs par défaut
    const initialForm = {};
    correction.fields.forEach(field => {
      initialForm[field.name] = field.default || (field.type === 'checkbox' ? false : '');
    });
    setCorrectionForm(initialForm);
  };

  // Gérer les changements du formulaire de correction
  const handleCorrectionFormChange = (fieldName, value) => {
    setCorrectionForm(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Exécuter la correction
  const executeCorrection = async () => {
    try {
      setActionLoading(prev => ({ ...prev, [selectedCorrection.id]: true }));
     
      console.log(selectedCorrection.id);
      const response = await axios.post(`/api/admin/audit-logs/${selectedLog.id}/correct`, {
        correction_type: selectedCorrection.id,
        correction_data: correctionForm
      });

      if (response.data.success) {
        toast.success('Correction appliquée avec succès');
        closeCorrectionModal(selectedLog);
        setSelectedCorrection(null);
        setCorrectionForm({});
        fetchAuditLogs(); // Rafraîchir les logs
      } else {
        toast.error(response.data.message || 'Erreur lors de la correction');
      }
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      toast.error('Erreur lors de la correction');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedCorrection.id]: false }));
    }
  };

  const getDropdownPosition = () => {
    if (!exportMenuRef.current) return {};
    const rect = exportMenuRef.current.getBoundingClientRect();
    return {
      top: rect.top - 80, // Positionne le dropdown au-dessus du bouton avec encore moins de décalage
      right: window.innerWidth - rect.right
    };
  };

  // Exporter les données
  const exportData = async (type) => {
    try {
      setExportLoading(true);
      
      let params = {};
      if (type === 'current') {
        params = { page: page + 1, per_page: rowsPerPage };
      } else if (type === 'filtered') {
        params = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        );
      }

      const response = await axios.get(`/api/admin/audit-logs/export`, {
        params,
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${type}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Exportation réussie");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      toast.error("Erreur lors de l'exportation");
    } finally {
      setExportLoading(false);
    }
  };

  // Actions d'audit
  const executeAuditAction = async (action, logId = null) => {
    try {
      setActionLoading(prev => ({ ...prev, [action]: true }));
      
      let endpoint = '';
      switch (action) {
        case 'schedule_periodic':
          endpoint = '/api/admin/audit/schedule-periodic';
          break;
        case 'execute_global':
          endpoint = '/api/admin/audit/execute-global';
          break;
        case 'resolve_log':
          endpoint = `/api/admin/audit-logs/${logId}/resolve`;
          break;
        case 'investigate_log':
          endpoint = `/api/admin/audit-logs/${logId}/investigate`;
          break;
        default:
          return;
      }

      const response = await axios.post(endpoint, logId ? { log_id: logId } : {});
      
      if (response.data.success) {
        toast.success(`Action "${action}" exécutée avec succès`);
        
        // Rafraîchir les données
        fetchAuditLogs();
        fetchAuditStats();
        
        if (action.includes('log')) {
          setShowDetailsModal(false);
          setSelectedLog(null);
        }
      } else {
        toast.error(response.data.message || "Erreur lors de l'exécution");
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      toast.error(`Erreur lors de l'action ${action}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  // Afficher les détails d'un log
  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Afficher les détails d'un log
  const showModalForCorrection = (log) => {
    setSelectedLog(log);
    setShowCorrectionModal(true);
    setShowDetailsModal(false);
  };

  // Afficher les détails d'un log
  const closeCorrectionModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
    setShowCorrectionModal(false);
  };

  // Fonctions utilitaires
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'investigating': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'pending': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'false_positive': return <XCircleIcon className="w-5 h-5 text-gray-500" />;
      default: return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAuditTypeLabel = (type) => {
    const labels = {
      'realtime': 'Temps Réel',
      'batch': 'Ciblé',
      'periodic': 'Périodique',
      'global': 'Global',
      'manual': 'Manuel'
    };
    return labels[type] || type;
  };

  const getInvariantLabel = (invariant) => {
    const labels = {
      'balance_ledger_mismatch': 'Incohérence Balance/Grand livre',
      'negative_balance': 'Balance Négative',
      'unusual_transaction_size': 'Transaction Inhabituelle',
      'high_frequency_transactions': 'Transactions Haute Fréquence',
      'conservation_of_funds_violation': 'Violation Conservation Fonds',
      'accounting_equation_violation': 'Violation Équation Comptable',
      'system_balance_mismatch': 'Incohérence de balance système',
      'liquidity_mismatch': 'Incohérence Liquidité',
      'risk_concentration': 'Concentration des risques',
      'abnormal_inactivity': 'Inactivité Anormale',
      'data_corruption': 'Corruption Données',
      'orphan_transactions': 'Transactions Orphelines',
      'system_transaction_consistency_mismatch': 'Incohérence des transactions système',
    };
    return labels[invariant] || invariant;
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      'critical': 'Critique',
      'high': 'Élevée',
      'medium': 'Moyenne',
      'low': 'Faible'
    };
    return labels[severity] || severity;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'investigating': 'En investigation',
      'resolved': 'Résolu',
      'false_positive': 'Faux positif'
    };
    return labels[status] || status;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Audit Financier
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Surveillance et gestion des audits financiers intelligents
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Bouton Filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                Filtres avancés
              </button>

              {/* Bouton Exportation */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exportLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50"
                  }`}
                >
                  {exportLoading ? (
                    <CircularProgress size={20} className="text-white" />
                  ) : (
                    <DocumentArrowDownIcon className="w-5 h-5" />
                  )}
                  Exporter
                </button>

                {/* Menu d'exportation */}
                {showExportMenu && (
                  <div
                    className="absolute right-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    style={getDropdownPosition()}
                  >
                    <button
                      onClick={() => exportData('current')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Page actuelle (CSV)
                    </button>
                    <button
                      onClick={() => exportData('filtered')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Données filtrées (CSV)
                    </button>
                    <button
                      onClick={() => exportData('all')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Toutes les données (CSV)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card style={{
              backgroundColor: isDarkMode ? '#273242ff' : '#fff',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Logs
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {auditStats.total_audit_logs || 0}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card style={{
              backgroundColor: isDarkMode ? '#273242ff' : '#fff',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Anomalies en Attente
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {auditStats.pending_anomalies || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card style={{
              backgroundColor: isDarkMode ? '#273242ff' : '#fff',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Anomalies Critiques
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {auditStats.critical_anomalies || 0}
                  </p>
                </div>
                <BellIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card style={{
              backgroundColor: isDarkMode ? '#273242ff' : '#fff',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Jobs en Queue
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {auditStats.queue_jobs || 0}
                  </p>
                </div>
                <CogIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions d'audit */}
        <div className={`mb-6 p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Actions d'Audit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => executeAuditAction('schedule_periodic')}
              disabled={actionLoading.schedule_periodic}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                actionLoading.schedule_periodic
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {actionLoading.schedule_periodic ? (
                <CircularProgress size={20} className="text-white" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
              Audits Périodiques
            </button>

            <button
              onClick={() => executeAuditAction('execute_global')}
              disabled={actionLoading.execute_global}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                actionLoading.execute_global
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {actionLoading.execute_global ? (
                <CircularProgress size={20} className="text-white" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
              Exécuter Audit Global
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className={`mb-6 p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TextField
                label="Recherche"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputProps={{
                  startAdornment: <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
                }}
              />

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Type d'Audit</InputLabel>
                <Select
                  value={filters.audit_type}
                  onChange={(e) => setFilters({ ...filters, audit_type: e.target.value })}
                  label="Type d'Audit"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="realtime">Temps Réel</MenuItem>
                  <MenuItem value="batch">Ciblé</MenuItem>
                  <MenuItem value="periodic">Périodique</MenuItem>
                  <MenuItem value="global">Global</MenuItem>
                  <MenuItem value="manual">Manuel</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Sévérité</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  label="Sévérité"
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="low">Faible</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Statut"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="investigating">En investigation</MenuItem>
                  <MenuItem value="resolved">Résolu</MenuItem>
                  <MenuItem value="false_positive">Faux positif</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Date de début"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Date de fin"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                fullWidth
                margin="normal"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </div>

            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => setFilters({
                  audit_type: "",
                  severity: "",
                  status: "",
                  entity_type: "",
                  search: "",
                  date_from: "",
                  date_to: "",
                })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Appliquer
              </button>
            </div>
          </div>
        )}

        {/* Tableau des logs d'audit */}
        <div className={`rounded-xl shadow-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <CircularProgress size={40} />
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                    <TableCell className="font-semibold">ID</TableCell>
                    <TableCell className="font-semibold">Type</TableCell>
                    <TableCell className="font-semibold">Entité</TableCell>
                    <TableCell className="font-semibold">Invariant</TableCell>
                    <TableCell className="font-semibold">Sévérité</TableCell>
                    <TableCell className="font-semibold">Écart</TableCell>
                    <TableCell className="font-semibold">Statut</TableCell>
                    <TableCell className="font-semibold">Date</TableCell>
                    <TableCell className="font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <TableCell>#{log.id}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {getAuditTypeLabel(log.audit_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.entity_type}
                          {log.entity_id && ` #${log.entity_id}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getInvariantLabel(log.invariant_violated)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getSeverityLabel(log.severity)}
                          className={getSeverityColor(log.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          log.difference > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatAmount(log.difference)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="text-sm">
                            {getStatusLabel(log.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(log.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip title="Voir les détails">
                            <button
                              onClick={() => showLogDetails(log)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-gray-600 text-gray-400'
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          
                          {log.status === 'pending' && (
                            <Tooltip title="Marquer comme en investigation">
                              <button
                                onClick={() => executeAuditAction('investigate_log', log.id)}
                                disabled={actionLoading.investigate_log}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  actionLoading.investigate_log
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:bg-yellow-100 text-yellow-600'
                                }`}
                              >
                                <ClockIcon className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                          
                          {log.status !== 'resolved' && (
                            <Tooltip title="Résoudre">
                              <button
                                onClick={() => executeAuditAction('resolve_log', log.id)}
                                disabled={actionLoading.resolve_log}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  actionLoading.resolve_log
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:bg-green-100 text-green-600'
                                }`}
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[10, 25, 30, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Lignes par page"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count}`
                }
              />
            </TableContainer>
          )}
        </div>

        {/* Modal de détails du log */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b sticky top-0 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              } rounded-t-2xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Log d'Audit #{selectedLog.id}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getAuditTypeLabel(selectedLog.audit_type)} - {getSeverityLabel(selectedLog.severity)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Informations Générales</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-sm font-medium">{getAuditTypeLabel(selectedLog.audit_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Entité:</span>
                        <span className="text-sm font-medium">
                          {selectedLog.entity_type} {selectedLog.entity_id && `#${selectedLog.entity_id}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Invariant:</span>
                        <span className="text-sm font-medium">{getInvariantLabel(selectedLog.invariant_violated)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Statut:</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedLog.status)}
                          <span className="text-sm font-medium">{getStatusLabel(selectedLog.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Valeurs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Attendue:</span>
                        <span className="text-sm font-medium">{formatAmount(selectedLog.expected_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Actuelle:</span>
                        <span className="text-sm font-medium">{formatAmount(selectedLog.actual_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Écart:</span>
                        <span className={`text-sm font-bold ${
                          selectedLog.difference > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatAmount(selectedLog.difference)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Métadonnées</h4>
                    <div className={`p-4 rounded-lg font-mono text-xs ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {selectedLog.resolved_at && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Résolution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Résolu le:</span>
                        <span className="text-sm font-medium">{formatDate(selectedLog.resolved_at)}</span>
                      </div>
                      {selectedLog.resolved_by && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Résolu par:</span>
                          <span className="text-sm font-medium">Admin #{selectedLog.resolved_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t flex-shrink-0 sticky bottom-0 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              } rounded-b-2xl`}>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Fermer
                  </button>
                  {selectedLog.status === 'pending' && (
                    <button
                      onClick={() => executeAuditAction('investigate_log', selectedLog.id)}
                      disabled={actionLoading.investigate_log}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        actionLoading.investigate_log
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                    >
                      {actionLoading.investigate_log ? (
                        <div className="flex items-center gap-2">
                          <CircularProgress size={16} className="text-white" />
                          Investigation...
                        </div>
                      ) : (
                        "Marquer en Investigation"
                      )}
                    </button>
                  )}
                  {selectedLog.status !== 'resolved' && (
                    <button
                      onClick={() => executeAuditAction('resolve_log', selectedLog.id)}
                      disabled={actionLoading.resolve_log}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        actionLoading.resolve_log
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {actionLoading.resolve_log ? (
                        <div className="flex items-center gap-2">
                          <CircularProgress size={16} className="text-white" />
                          Résolution...
                        </div>
                      ) : (
                        "Marquer comme résolue"
                      )}
                    </button>
                  )}
                  {selectedLog.status === 'pending' && (
                    <button
                      onClick={() => showModalForCorrection(selectedLog)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      Corriger
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Correction */}
      {showCorrectionModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b sticky top-0 ${
              isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
            } rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Options de Correction - {getInvariantLabel(selectedLog.invariant_violated)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Log d'Audit #{selectedLog.id} - {formatAmount(selectedLog.difference)}
                  </p>
                </div>
                <button
                  onClick={() => closeCorrectionModal(selectedLog)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="px-6 py-4">
              {/* Options de correction */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {getCorrectionOptions(selectedLog).map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCorrection?.id === option.id
                        ? isDarkMode 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-blue-500 bg-blue-50'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleCorrectionSelect(option)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {option.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulaire de correction */}
              {selectedCorrection && (
                <div className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    {selectedCorrection.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCorrection.fields.map((field) => (
                      <div key={field.name}>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={correctionForm[field.name] || ''}
                            onChange={(e) => handleCorrectionFormChange(field.name, e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'number' && (
                          <input
                            type="number"
                            step="0.01"
                            value={correctionForm[field.name] || ''}
                            onChange={(e) => handleCorrectionFormChange(field.name, e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            value={correctionForm[field.name] || ''}
                            onChange={(e) => handleCorrectionFormChange(field.name, e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            required={field.required}
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <select
                            value={correctionForm[field.name] || ''}
                            onChange={(e) => handleCorrectionFormChange(field.name, e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            required={field.required}
                          >
                            <option value="">Sélectionner...</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'multiselect' && (
                          <select
                            multiple
                            value={correctionForm[field.name] || []}
                            onChange={(e) => handleCorrectionFormChange(field.name, Array.from(e.target.selectedOptions, option => option.value))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            required={field.required}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={correctionForm[field.name] || false}
                              onChange={(e) => handleCorrectionFormChange(field.name, e.target.checked)}
                              className={`w-4 h-4 rounded border ${
                                isDarkMode 
                                  ? 'bg-gray-600 border-gray-500 text-blue-500' 
                                  : 'bg-white border-gray-300 text-blue-500'
                              } focus:ring-2 focus:ring-blue-500`}
                            />
                            <label className={`ml-2 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {field.label}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 sticky bottom-0 ${
              isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
            } rounded-b-2xl`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => closeCorrectionModal(selectedLog)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Annuler
                </button>
                {selectedCorrection && (
                  <button
                    onClick={executeCorrection}
                    disabled={actionLoading[selectedCorrection.id]}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      actionLoading[selectedCorrection.id]
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {actionLoading[selectedCorrection.id] ? (
                      <div className="flex items-center gap-2">
                        <CircularProgress size={16} className="text-white" />
                        Application...
                      </div>
                    ) : (
                      `Appliquer ${selectedCorrection.title}`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteneur pour les notifications Toast */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default FinancialAnomalies;
