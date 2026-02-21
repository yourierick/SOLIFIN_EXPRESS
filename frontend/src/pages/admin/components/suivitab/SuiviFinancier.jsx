import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Menu,
  MenuItem,
  Button,
  IconButton,
  Card,
  CardContent,
  useTheme as useMuiTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Tooltip,
  Modal,
  Backdrop,
  Fade,
  Grow,
  Avatar,
  LinearProgress,
  Divider,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  AllInclusive,
  Menu as MenuIcon,
  ShoppingCart as PackSaleIcon,
  TrendingUp as BoostSaleIcon,
  Autorenew as RenewPackSaleIcon,
  Computer as DigitalProductSaleIcon,
  MoneyOff as WithdrawalIcon,
  AccountBalance as WithdrawalCommissionIcon,
  People as ReferralCommissionIcon,
  SwapHoriz as TransferCommissionIcon,
  Cloud as VirtualSaleIcon,
  SwapVert as TransferIcon,
  Assessment as TotalIcon,
  Paid as AmountIcon,
  TrendingDown,
  ArrowUpward as InIcon,
  ArrowDownward as OutIcon,
  Close as CloseIcon,
  FileDownload as ExportIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Info as InfoIcon,
  Description as ReceiptIcon 
} from '@mui/icons-material';
import { useTheme } from '../../../../contexts/ThemeContext';
import SuiviFinancierFilters from './suivi-types/SuiviFinancierFilters';
import { getOperationType } from "../../../../components/OperationTypeFormatter";
import { getTransactionColor } from "../../../../components/TransactionColorFormatter";
import axios from 'axios';
import * as XLSX from 'xlsx';

const SuiviFinancier = React.memo(() => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // État local pour la période
  const [period, setPeriod] = useState('all');
  
  // États du composant
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedView, setSelectedView] = useState('all');
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    creditAmount: 0,
    debitAmount: 0,
    solde: 0,
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // États pour le tableau
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ État de chargement initial
  
  // États pour le drawer des métadonnées
  const [metadataDrawerOpen, setMetadataDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({});
  
  // États pour l'export
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const open = Boolean(anchorEl);

  // Types de transactions extraits de la migration wallet_system_transactions
  const transactionTypes = [
    { key: "all", label: "Toutes les transactions", icon: AllInclusive, color: 'primary', },
    {
      key: 'pack_sale',
      label: 'Ventes de packs',
      description: 'Suivi des ventes de packs d\'abonnement',
      icon: PackSaleIcon,
      color: 'primary',
    },
    {
      key: 'virtual_sale',
      label: 'Vente des virtuels',
      description: 'Suivi des ventes des virtuels solifin',
      icon: VirtualSaleIcon,
      color: 'secondary',
    },
    {
      key: 'funds_withdrawal',
      label: 'Suivi des retraits',
      description: 'Suivi des retraits payés',
      icon: WithdrawalIcon,
      color: 'error',
    }
  ];

  // Effet pour charger les statistiques et les transactions lorsque le type, la période ou les filtres changent
  useEffect(() => {
    fetchStatistics();
    fetchAllTransactions();
  }, [selectedView, period, filters]);

  // Effet pour charger les transactions quand la pagination change
  useEffect(() => {
    if (!isInitialLoading && totalTransactions > 0) { // ✅ Seulement si pas en chargement initial et si on a des données
      fetchTransactions();
    }
  }, [page, rowsPerPage, filters]);

  // Fonction pour récupérer les statistiques
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {
        period: period,
        type: selectedView,
      };
      
      // Ajouter les filtres aux paramètres
      params.nature = 'external';
      if (filters.flow) params.flow = filters.flow;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.pack_id) params.pack_id = filters.pack_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;
      
      const response = await axios.get(`/api/admin/tableau-de-suivi/financial-transactions/statistics`, {
        params: params
      });
      
      setStatistics({
        creditAmount: response.data.credit_amount || 0,
        debitAmount: response.data.debit_amount || 0,
        solde: response.data.solde || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setStatistics({ creditAmount: 0, debitAmount: 0, solde: 0 });
      setLoading(false);
    }
  };

  // Fonction pour récupérer toutes les transactions (pour pagination et premières données)
  const fetchAllTransactions = async () => {
    if (!isInitialLoading) {
      setTransactionsLoading(true);
    }
    
    try {
      const params = {
        period: period,
        type: selectedView,
        page: 1,
        per_page: rowsPerPage, // ✅ Récupérer directement les premières données
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.flow) params.flow = filters.flow;
      params.nature = "external";
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.pack_id) params.pack_id = filters.pack_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;
      
      const response = await axios.get(`/api/admin/tableau-de-suivi/financial-transactions`, {
        params: params
      });
      
      setTotalTransactions(response.data.pagination?.total || 0);
      setAllTransactions(response.data.data || []); // ✅ Charger les premières données
      setTransactionsLoading(false);
      setIsInitialLoading(false); // ✅ Arrêter le chargement initial
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      setTotalTransactions(0);
      setAllTransactions([]);
      setTransactionsLoading(false);
      setIsInitialLoading(false);
    }
  };

  // Fonction pour récupérer les transactions détaillées avec pagination
  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const params = {
        period: period,
        type: selectedView,
        page: page + 1, // Material-UI pagination starts from 0
        per_page: rowsPerPage,
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.flow) params.flow = filters.flow;
      params.nature = "external";
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.pack_id) params.pack_id = filters.pack_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;
      
      const response = await axios.get(`/api/admin/tableau-de-suivi/financial-transactions`, {
        params: params
      });
      
      setAllTransactions(response.data.data || []);
      setTransactionsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      setAllTransactions([]);
      setTransactionsLoading(false);
    }
  };

  // Fonction pour formater le montant selon la devise
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0';
    
    const absAmount = Math.abs(amount);
    
    let formattedAmount;
    // Format pour l'USD et autres devises
    formattedAmount = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);
    
    return `${formattedAmount}`;
  };

  // Fonctions pour la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers pour le drawer des métadonnées
  const handleOpenMetadataDrawer = (transaction) => {
    setSelectedTransaction(transaction);
    setMetadataDrawerOpen(true);
  };

  const handleCloseMetadataDrawer = () => {
    setMetadataDrawerOpen(false);
    setSelectedTransaction(null);
  };

  // Fonction d'export Excel
  const handleExport = async (exportType) => {
    try {
      let params = {
        period: period,
        type: selectedView,
        export_type: exportType,
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.flow) params.flow = filters.flow;
      params.nature = "external";
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.pack_id) params.pack_id = filters.pack_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;
      
      // Pour l'export de la page actuelle, ajouter les infos de pagination
      if (exportType === 'current_page') {
        params.page = page + 1;
        params.per_page = rowsPerPage;
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/financial-transactions/export', {
        params: params
      });
      
      // Récupérer les données et le nom de fichier depuis la réponse
      const { data, filename } = response.data;
      
      // Créer les en-têtes français
      const headers = [
        'Référence',
        'Type',
        'Mouvement',
        'Montant',
        'Frais',
        'Commission',
        'Statut',
        'Balance avant',
        'Balance après',
        'Traité par',
        'Traité le',
        'Déscription',
        'Raison (rejet, echec, ...)',
        'Date de création',
        'Métadonnées'
      ];
      
      // Transformer les données en tableau de tableaux
      const rows = data.map(item => [
        item.reference,
        getOperationType(item.type),
        item.flow,
        item.amount,
        item.fee_amount,
        item.commission_amount,
        item.status,
        item.balance_before,
        item.balance_after,
        item.processor,
        item.processed_at,
        item.description,
        item.rejection_reason,
        item.created_at,
        item.metadata
      ]);
      
      // Combiner les en-têtes et les données
      const finalData = [headers, ...rows];
      
      // Créer le workbook Excel avec XLSX en utilisant aoa_to_sheet
      const ws = XLSX.utils.aoa_to_sheet(finalData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 20 }, // Référence
        { wch: 15 }, // Type
        { wch: 12 }, // Mouvement
        { wch: 15 }, // Montant
        { wch: 15 }, // Frais
        { wch: 15 }, // Commission
        { wch: 12 }, // Statut
        { wch: 15 }, // Balance avant
        { wch: 15 }, // Balance après
        { wch: 20 }, // Traité par
        { wch: 20 }, // Traité le
        { wch: 20 }, // Déscription
        { wch: 20 }, // Raison (rejet, echec, ...)
        { wch: 20 }, // Date de création
        { wch: 50 }, // Métadonnées (élargie car c'est la dernière colonne)
      ];
      ws['!cols'] = colWidths;
      
      // Télécharger le fichier
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      // Afficher un message d'erreur à l'utilisateur
      alert('Erreur lors de l\'export Excel. Veuillez réessayer.');
    }
  };

  // Gérer le menu d'export
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  // Fonctions d'export
  const handleExportFiltered = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('filtered');
    } catch (error) {
      console.error('Erreur lors de l\'export des données filtrées:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurrentPage = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('current_page');
    } catch (error) {
      console.error('Erreur lors de l\'export de la page actuelle:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('all');
    } catch (error) {
      console.error('Erreur lors de l\'export de toutes les données:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'processing':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'reversed':
        return 'default';
      default:
        return 'default';
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Complétée';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échouée';
      case 'reversed':
        return 'Annulée';
      case 'processing':
        return 'En cours';
      default:
        return status;
    }
  };

  // Fonction pour obtenir le libellé du mouvement
  const getFlowLabel = (flow) => {
    switch (flow) {
      case 'in':
        return 'Entrée';
      case 'out':
        return 'Sortie';
      case 'freeze':
        return 'Blocage';
      case 'unfreeze':
        return 'Déblocage';
      default:
        return flow;
    }
  };

  // Fonction pour obtenir la couleur du mouvement
  const getFlowColor = (flow) => {
    switch (flow) {
      case 'in':
      case 'unfreeze':
        return 'success';
      case 'out':
      case 'freeze':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewChange = (viewKey) => {
    setSelectedView(viewKey);
    handleMenuClose();
  };

  const getCurrentType = () => {
    return transactionTypes.find(type => type.key === selectedView) || transactionTypes[0];
  };

  const getCurrentIcon = () => {
    const CurrentIcon = getCurrentType().icon;
    return <CurrentIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: `${getCurrentType().color}.main` }} />;
  };

  const getCurrentLabel = () => {
    return getCurrentType().label;
  };

  const renderContent = () => {
    const currentType = getCurrentType();
    
    return (
      <Box>
        {/* En-tête */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h2" 
            fontWeight={600}
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {currentType.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currentType.description}
          </Typography>
        </Box>

        {/* Cards statistiques */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
          {/* Card 1: Montant total entré */}
          <Card 
            sx={{ 
              background: isDarkMode ? '#1a2636c4' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <Box sx={{ 
              backgroundColor: isDarkMode ? 'transparent' : '#f0fdf4',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#10b981',
                  width: 32,
                  height: 32
                }}
              >
                <AmountIcon sx={{ fontSize: 16, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 500, fontSize: '0.75rem' }}>
                  Montant total entré
                </Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 700, lineHeight: 1.1, fontSize: '1.25rem' }}>
                  +{formatAmount(statistics.creditAmount)} $
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem', mt: 0.25 }}>
                  {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : period === 'year' ? 'cette année' : 'toute période'}
                </Typography>
              </Box>
              {loading && (
                <CircularProgress size={16} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </Box>
          </Card>

          {/* Card 2: Montant total sorti */}
          <Card 
            sx={{ 
              background: isDarkMode ? '#1a2636c4' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <Box sx={{ 
              backgroundColor: isDarkMode ? 'transparent' : '#fef2f2',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#ef4444',
                  width: 32,
                  height: 32
                }}
              >
                <TrendingDown sx={{ fontSize: 16, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#ef4444' : '#991b1b', fontWeight: 500, fontSize: '0.75rem' }}>
                  Montant total sorti
                </Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#ef4444' : '#991b1b', fontWeight: 700, lineHeight: 1.1, fontSize: '1.25rem' }}>
                  -{formatAmount(statistics.debitAmount)} $
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem', mt: 0.25 }}>
                  {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : period === 'year' ? 'cette année' : 'toute période'}
                </Typography>
              </Box>
              {loading && (
                <CircularProgress size={16} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </Box>
          </Card>
          
          {/* Card 3: Solde */}
          <Card 
            sx={{ 
              background: isDarkMode ? '#1a2636c4' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <Box sx={{ 
              backgroundColor: isDarkMode ? 'transparent' : '#eff6ff',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#3b82f6',
                  width: 32,
                  height: 32
                }}
              >
                <TotalIcon sx={{ fontSize: 16, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#3b82f6' : '#1e3a8a', fontWeight: 500, fontSize: '0.75rem' }}>
                  Solde : entrées - sorties
                </Typography>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#3b82f6' : '#1e3a8a', fontWeight: 700, lineHeight: 1.1, fontSize: '1.25rem' }}>
                  {formatAmount(statistics.solde)} $
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem', mt: 0.25 }}>
                  {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : period === 'year' ? 'cette année' : 'toute période'}
                </Typography>
              </Box>
              {loading && (
                <CircularProgress size={16} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </Box>
          </Card>
        </Box>

        {/* Section d'export au-dessus du tableau */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2,
          px: 1
        }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
            Transactions financières
          </Typography>
          
          <Button
            onClick={handleExportMenuOpen}
            disabled={isExporting}
            startIcon={isExporting ? <div className="animate-spin" /> : <ExportIcon />}
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              borderRadius: { xs: 1.5, md: 2 },
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)' 
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
              color: 'white',
              border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.9) 100%)' 
                  : 'linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.9) 100%)',
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
              },
              '&:disabled': {
                opacity: 0.6,
                cursor: 'not-allowed',
              },
            }}
          >
            {isExporting ? 'Exportation...' : 'Exporter'}
          </Button>
        </Box>

        {/* Tableau des transactions */}
        <Paper
          sx={{
            borderRadius: { xs: 2, md: 3 },
            background: isDarkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            overflow: 'hidden',
          }}
        >
          <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
            <Table stickyHeader aria-label="transactions table">
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 120
                    }}
                  >
                    Référence
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 100
                    }}
                  >
                    Mouvement
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 200
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 120
                    }}
                  >
                    Montant
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 120
                    }}
                  >
                    Frais
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 120
                    }}
                  >
                    Commission
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 100
                    }}
                  >
                    Statut
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 100
                    }}
                  >
                    Balance Avant
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 100
                    }}
                  >
                    Balance Après
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 100
                    }}
                  >
                    Traité par
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 150
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      bgcolor: isDarkMode ? '#374151' : '#f9fafb',
                      minWidth: 150
                    }}
                  >
                    Détails
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  return (transactionsLoading || isInitialLoading) ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : allTransactions.length > 0 ? (
                    allTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' 
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getFlowLabel(transaction.flow)}
                            color={getFlowColor(transaction.flow)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getOperationType(transaction.type)}
                            size="small"
                            sx={{
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              height: { xs: 22, sm: 26 },
                              fontWeight: 500,
                              borderRadius: { xs: 1.5, sm: 2 },
                              fontFamily: "'Poppins', sans-serif",
                              bgcolor: (() => {
                                switch (transaction.type) {
                                  default:
                                    return getTransactionColor(transaction.type, isDarkMode);
                                  }
                                })(),
                              color: isDarkMode ? "#fff" : "#111",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontSize: '0.9rem'
                            }}
                          >
                            {formatAmount(transaction.amount)} $
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontSize: '0.9rem'
                            }}
                          >
                            {formatAmount(transaction.fee_amount)} $
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontSize: '0.9rem'
                            }}
                          >
                            {formatAmount(transaction.commission_amount)} $
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(transaction.status)}
                            color={getStatusColor(transaction.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: `${isDarkMode ? 'rgba(70, 141, 255, 1)':'rgba(59, 130, 246, 1)'}`,
                              fontSize: '0.9rem'
                            }}
                          >
                            {formatAmount(transaction.balance_before)} $
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: `${isDarkMode ? 'rgba(70, 141, 255, 1)':'rgba(59, 130, 246, 1)'}`,
                              fontSize: '0.9rem'
                            }}
                          >
                            {formatAmount(transaction.balance_after)} $
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontSize: '0.9rem'
                            }}
                          >
                            {transaction.processor?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenMetadataDrawer(transaction)}
                              startIcon={<InfoIcon />}
                              sx={{
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1,
                                minWidth: 'auto',
                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  backgroundColor: 'primary.main',
                                  color: 'primary.contrastText',
                                }
                              }}
                            >
                              Voir plus
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucune transaction trouvée pour cette période et ce type
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 15, 25, 50]}
            component="div"
            count={totalTransactions}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            sx={{
              bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
              borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            }}
          />
        </Paper>
      </Box>
    );
  };

  // Drawer pour afficher les métadonnées
  const MetadataDrawer = () => (
    <Drawer
      anchor="right"
      open={metadataDrawerOpen}
      onClose={handleCloseMetadataDrawer}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '85%', sm: '400px', md: '450px' },
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(0, 0, 0, 0.3)' 
            : '0 10px 40px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header du drawer */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            background: isDarkMode 
              ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' 
              : 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
            borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: 'primary.main' }}>
                Métadonnées
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Référence: {selectedTransaction?.reference || `#${selectedTransaction?.id}`}
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseMetadataDrawer}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.8)',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Contenu du drawer */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            overflowY: 'auto',
            flex: 1,
          }} 
        >
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
              {/* Carte d'en-tête */}
              <Card
                sx={{
                  mb: 2,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                  border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                  borderRadius: 3,
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <InfoIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ color: 'primary.main', fontSize: '1.1rem' }}>
                        Métadonnées
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Object.keys(selectedTransaction?.metadata || {}).length} champ{Object.keys(selectedTransaction?.metadata || {}).length > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Transaction #{selectedTransaction?.id}
                    </Typography>
                    <Chip 
                      label={selectedTransaction?.reference || `#${selectedTransaction?.id}`}
                      size="small"
                      sx={{
                        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        color: 'primary.main',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Carte des informations de la transaction */}
              <Card
                sx={{
                  mb: 2,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                  borderRadius: 3,
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'success.main',
                        width: 48,
                        height: 48,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <ReceiptIcon sx={{ fontSize: 24, color: 'white' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ color: 'success.main', fontSize: '1.1rem' }}>
                        Informations Transaction
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Détails complets de la transaction
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <List sx={{ p: 0 }}>
                    {/* Référence */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Référence"
                        secondary={selectedTransaction?.reference || `#${selectedTransaction?.id}`}
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        secondaryTypographyProps={{ 
                          fontSize: '0.9rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </ListItem>
                    
                    {/* Session ID */}
                    {selectedTransaction?.session_id && (
                      <ListItem sx={{ p: 0, mb: 1 }}>
                        <ListItemText
                          primary="Session ID"
                          secondary={selectedTransaction.session_id}
                          primaryTypographyProps={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'success.main',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Transaction ID */}
                    {selectedTransaction?.transaction_id && (
                      <ListItem sx={{ p: 0, mb: 1 }}>
                        <ListItemText
                          primary="Transaction ID"
                          secondary={selectedTransaction.transaction_id}
                          primaryTypographyProps={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'success.main',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Flow */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Flux"
                        secondary={
                          <Chip
                            label={selectedTransaction?.flow === 'in' ? 'Entrée' : selectedTransaction?.flow === 'out' ? 'Sortie' : selectedTransaction?.flow === 'freeze' ? 'Blocage' : 'Déblocage'}
                            color={selectedTransaction?.flow === 'out' || selectedTransaction?.flow === 'freeze' ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        }
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </ListItem>
                    
                    {/* Type */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Type"
                        secondary={getOperationType(selectedTransaction?.type)}
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        secondaryTypographyProps={{ 
                          fontSize: '0.9rem'
                        }}
                      />
                    </ListItem>
                    
                    {/* Montant */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Montant"
                        secondary={formatAmount(selectedTransaction?.amount)}
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        secondaryTypographyProps={{ 
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: selectedTransaction?.amount > 0 ? 'success.main' : 'error.main'
                        }}
                      />
                    </ListItem>
                    
                    {/* Statut */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Statut"
                        secondary={
                          <Chip
                            label={getStatusLabel(selectedTransaction?.status)}
                            color={getStatusColor(selectedTransaction?.status)}
                            size="small"
                          />
                        }
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </ListItem>
                    
                    {/* Description */}
                    {selectedTransaction?.description && (
                      <ListItem sx={{ p: 0, mb: 1 }}>
                        <ListItemText
                          primary="Description"
                          secondary={selectedTransaction.description}
                          primaryTypographyProps={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'success.main',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.9rem'
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Soldes */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Balance"
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                              Avant: <strong>{formatAmount(selectedTransaction?.balance_before)}</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                              Après: <strong>{formatAmount(selectedTransaction?.balance_after)}</strong>
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </ListItem>
                    
                    {/* Traitement */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Traitement"
                        secondary={
                          <Box>
                            {selectedTransaction?.processed_by && (
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                                Par: <strong>{selectedTransaction.processor?.name || `ID: ${selectedTransaction.processed_by}`}</strong>
                              </Typography>
                            )}
                            {selectedTransaction?.processed_at && (
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                Le: <strong>{new Date(selectedTransaction.processed_at).toLocaleString('fr-FR')}</strong>
                              </Typography>
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </ListItem>
                    
                    {/* Raison de rejet */}
                    {selectedTransaction?.rejection_reason && (
                      <ListItem sx={{ p: 0, mb: 1 }}>
                        <ListItemText
                          primary="Raison de Rejet"
                          secondary={selectedTransaction.rejection_reason}
                          primaryTypographyProps={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'error.main',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            color: 'error.main'
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Dates */}
                    <ListItem sx={{ p: 0, mb: 1 }}>
                      <ListItemText
                        primary="Dates"
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                              Créée: <strong>{new Date(selectedTransaction?.created_at).toLocaleString('fr-FR')}</strong>
                            </Typography>
                            {selectedTransaction?.updated_at && (
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                Modifiée: <strong>{new Date(selectedTransaction.updated_at).toLocaleString('fr-FR')}</strong>
                              </Typography>
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          color: 'success.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Liste des métadonnées */}
              <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
                {Object.entries(selectedTransaction?.metadata || {}).map(([key, value], index) => (
                  <Grow
                    in={true}
                    timeout={300}
                    style={{ transformOrigin: '0 0 0' }}
                  >
                    <ListItem
                      key={key}
                      sx={{
                        p: 0,
                        mb: 1,
                        borderRadius: 2,
                        background: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        '&:hover': {
                          background: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.05)',
                          transform: 'translateX(4px)',
                          transition: 'all 0.2s ease',
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, ml: 0.5 }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'white',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{
                                color: 'primary.main',
                                fontSize: '0.9rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: typeof value === 'object' ? 'monospace' : 'inherit',
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                              ml: 0.5,
                              mt: 0.5,
                              p: 0.75,
                              borderRadius: 1,
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            }}
                          >
                            {typeof value === 'object' 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                            }
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Grow>
                ))}
              </List>
            </Box>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box>
      {/* Menu principal avec submenu */}
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 2, md: 3 },
          background: isDarkMode
            ? "#1f2937"
            : "rgba(219, 237, 255, 0.8)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          boxShadow: "none",
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 0 },
            '&:hover': {
              '& .menu-left-section': {
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)',
              },
            },
          }}
          onClick={handleMenuClick}
        >
          <Box 
            className="menu-left-section"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1.5, sm: 2 },
              p: { xs: 1, sm: 1 },
              borderRadius: { xs: 1.5, md: 2 },
              transition: 'background-color 0.3s ease',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
              sx={{
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                color: muiTheme.palette.primary.main,
                p: { xs: 1, sm: 1.5 },
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                },
                transition: 'all 0.3s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body1" 
                fontWeight={600} 
                color="text.primary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: { xs: 1.3, sm: 1.2 }
                }}
              >
                {isMobile ? 'Types transactions' : 'Types de transactions financières'}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                Sélectionnez le type de transaction à suivre
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' }
          }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: { xs: 1.5, md: 2 },
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                minWidth: 0,
                flex: 1,
              }}
            >
              {getCurrentIcon()}
              <Typography 
                variant="body2" 
                fontWeight={500}
                sx={{ 
                  color: muiTheme.palette.primary.main,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMobile ? getCurrentLabel().replace('Ventes de ', '').replace('Suivi des ', '').replace('Commissions de ', '') : getCurrentLabel()}
              </Typography>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: { xs: 'none', md: 'block' },
              }}
            >
              Actif
            </Typography>
          </Box>
        </Box>

        {/* Menu déroulant */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: { xs: 1.5, md: 2 },
              minWidth: { xs: 280, sm: 320, md: 400 },
              maxWidth: { xs: '90vw', sm: 400, md: 400 },
              background: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              mt: { xs: 0.5, sm: 1 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: { xs: -4, sm: -8 },
                left: { xs: 16, sm: 24 },
                width: { xs: 12, sm: 16 },
                height: { xs: 12, sm: 16 },
                background: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.95)',
                transform: 'rotate(45deg)',
                borderLeft: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                borderTop: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
              },
            },
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}` }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Types de transactions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sélectionnez un type pour afficher les détails
            </Typography>
          </Box>
          
          {transactionTypes.map((type) => {
            const TypeIcon = type.icon;
            return (
              <MenuItem
                key={type.key}
                onClick={() => handleViewChange(type.key)}
                selected={selectedView === type.key}
                sx={{
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 2, sm: 2.5 },
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    bgcolor: isDarkMode ? `${type.color}.main` : `${type.color}.light`,
                    color: 'white',
                    '&:hover': {
                      bgcolor: isDarkMode ? `${type.color}.dark` : `${type.color}.main`,
                    },
                  },
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <TypeIcon sx={{ 
                    fontSize: { xs: 16, sm: 18 }, 
                    color: selectedView === type.key ? 'inherit' : `${type.color}.main` 
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {type.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: { xs: 'none', sm: 'block' },
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {type.description}
                    </Typography>
                  </Box>
                  {selectedView === type.key && (
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      background: 'currentColor',
                      flexShrink: 0,
                    }} />
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Menu>
      </Paper>

      {/* Sélecteur de période */}
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, md: 3 },
          background: isDarkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
            Période d'analyse
          </Typography>
          
          {/* Sélecteur de période - Même design que Dashboard */}
          <Box
            sx={{
              display: 'inline-flex',
              borderRadius: '0.375rem',
              boxShadow: isDarkMode 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            }}
          >
            <button
              type="button"
              onClick={() => setPeriod("day")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors duration-200 ${
                period === "day"
                  ? "bg-green-600 text-white"
                  : isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                background: period === "day" ? '#16a34a' : 'transparent',
                color: period === "day" ? 'white' : isDarkMode ? '#9ca3af' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Jour
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                period === "week"
                  ? "bg-green-600 text-white"
                  : isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                background: period === "week" ? '#16a34a' : 'transparent',
                color: period === "week" ? 'white' : isDarkMode ? '#9ca3af' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                period === "month"
                  ? "bg-green-600 text-white"
                  : isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                background: period === "month" ? '#16a34a' : 'transparent',
                color: period === "month" ? 'white' : isDarkMode ? '#9ca3af' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setPeriod("year")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                period === "year"
                  ? "bg-green-600 text-white"
                  : isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                background: period === "year" ? '#16a34a' : 'transparent',
                color: period === "year" ? 'white' : isDarkMode ? '#9ca3af' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Année
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors duration-200 ${
                period === "all"
                  ? "bg-green-600 text-white"
                  : isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                background: period === "all" ? '#16a34a' : 'transparent',
                color: period === "all" ? 'white' : isDarkMode ? '#9ca3af' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Tout
            </button>
          </Box>
        </Box>
      </Paper>

      {/* Filtres avancés */}
      <SuiviFinancierFilters 
        filters={filters}
        onFiltersChange={setFilters}
        period={period}
        onExport={handleExport}
      />

      {/* Contenu dynamique selon la sélection */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, md: 3 },
          background: isDarkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        }}
      >
        {renderContent()}
      </Paper>

      {/* Drawer des métadonnées */}
      <MetadataDrawer />

      {/* Menu d'export */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: { xs: 1.5, md: 2 },
            border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
            background: isDarkMode ? '#1f2937' : '#ffffff',
            boxShadow: isDarkMode 
              ? '0 10px 40px rgba(0, 0, 0, 0.3)' 
              : '0 10px 40px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <MenuItem 
          onClick={handleExportFiltered}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter les données filtrées
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter uniquement les résultats actuels
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={handleExportCurrentPage}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter la page actuelle
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter les données de cette page
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={handleExportAll}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter toutes les données
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter l'ensemble des transactions
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
});

export default SuiviFinancier;
