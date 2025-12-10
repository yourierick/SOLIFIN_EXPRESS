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
} from '@mui/material';
import {
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
  ArrowUpward as InIcon,
  ArrowDownward as OutIcon,
  Close as CloseIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useCurrency } from '../../../../contexts/CurrencyContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import SuiviFinancierFilters from './suivi-types/SuiviFinancierFilters';
import axios from 'axios';
import * as XLSX from 'xlsx';

const SuiviFinancier = ({ period }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Currency context
  const { selectedCurrency, isCDFEnabled } = useCurrency();
  
  // États du composant
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedView, setSelectedView] = useState('pack_sale');
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // États pour le tableau
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ État de chargement initial
  
  // États pour le modal des métadonnées
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({});
  
  // États pour l'export
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const open = Boolean(anchorEl);

  // Types de transactions extraits de la migration
  const transactionTypes = [
    {
      key: 'pack_sale',
      label: 'Ventes de packs',
      description: 'Suivi des ventes de packs d\'abonnement',
      icon: PackSaleIcon,
      color: 'primary',
    },
    {
      key: 'boost_sale',
      label: 'Ventes de boosts',
      description: 'Suivi des ventes de services boost',
      icon: BoostSaleIcon,
      color: 'info',
    },
    {
      key: 'renew_pack_sale',
      label: 'Renouvellements de packs',
      description: 'Suivi des renouvellements de packs',
      icon: RenewPackSaleIcon,
      color: 'success',
    },
    {
      key: 'digital_product_sale',
      label: 'Ventes de produits digitaux',
      description: 'Suivi des ventes de produits numériques',
      icon: DigitalProductSaleIcon,
      color: 'secondary',
    },
    {
      key: 'withdrawal',
      label: 'Retraits',
      description: 'Suivi des retraits payés',
      icon: WithdrawalIcon,
      color: 'error',
    },
    {
      key: 'commission de retrait',
      label: 'Commissions de retrait',
      description: 'Suivi des commissions sur retraits',
      icon: WithdrawalCommissionIcon,
      color: 'warning',
    },
    {
      key: 'commission de parrainage',
      label: 'Commissions de parrainage',
      description: 'Suivi des commissions de parrainage',
      icon: ReferralCommissionIcon,
      color: 'success',
    },
    {
      key: 'commission de transfert',
      label: 'Commissions de transfert',
      description: 'Suivi des commissions de transfert',
      icon: TransferCommissionIcon,
      color: 'info',
    },
    {
      key: 'virtual_sale',
      label: 'Ventes virtuelles',
      description: 'Suivi des ventes de services virtuels',
      icon: VirtualSaleIcon,
      color: 'secondary',
    },
    {
      key: 'transfer',
      label: 'Transferts',
      description: 'Suivi des transferts de fonds',
      icon: TransferIcon,
      color: 'primary',
    },
  ];

  // Effet pour charger les statistiques et les transactions lorsque le type, la période ou les filtres changent
  useEffect(() => {
    fetchStatistics();
    fetchAllTransactions();
  }, [selectedView, period, selectedCurrency, filters]);

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
        currency: selectedCurrency,
        type: selectedView,
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.mouvment) params.mouvment = filters.mouvment;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.pack_id) params.pack_id = filters.pack_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;
      
      const response = await axios.get(`/api/admin/tableau-de-suivi/financial-transactions/statistics`, {
        params: params
      });
      
      setStatistics({
        totalTransactions: response.data.total_transactions || 0,
        totalAmount: response.data.total_amount || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setStatistics({ totalTransactions: 0, totalAmount: 0 });
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
        currency: selectedCurrency,
        type: selectedView,
        page: 1,
        per_page: rowsPerPage, // ✅ Récupérer directement les premières données
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.mouvment) params.mouvment = filters.mouvment;
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
        currency: selectedCurrency,
        type: selectedView,
        page: page + 1, // Material-UI pagination starts from 0
        per_page: rowsPerPage,
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.mouvment) params.mouvment = filters.mouvment;
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
    const isNegative = amount < 0;
    
    let formattedAmount;
    if (selectedCurrency === 'CDF' && isCDFEnabled) {
      // Format pour le Franc Congolais
      formattedAmount = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absAmount);
    } else {
      // Format pour l'USD et autres devises
      formattedAmount = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absAmount);
    }
    
    return `${isNegative ? '-' : '+'}${formattedAmount}`;
  };

  // Fonctions pour la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers pour le modal des métadonnées
  const handleOpenMetadataModal = (transaction) => {
    setSelectedTransaction(transaction);
    setMetadataModalOpen(true);
  };

  const handleCloseMetadataModal = () => {
    setMetadataModalOpen(false);
    setSelectedTransaction(null);
  };

  // Fonction d'export Excel
  const handleExport = async (exportType) => {
    try {
      let params = {
        period: period,
        currency: selectedCurrency,
        type: selectedView,
        export_type: exportType,
      };
      
      // Ajouter les filtres aux paramètres
      if (filters.mouvment) params.mouvment = filters.mouvment;
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
        'Devise',
        'Statut',
        'Date de création',
        'Métadonnées'
      ];
      
      // Transformer les données en tableau de tableaux
      const rows = data.map(item => [
        item.reference,
        item.type,
        item.mouvment,
        item.amount,
        item.currency,
        item.status,
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
        { wch: 8 },  // Devise
        { wch: 12 }, // Statut
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
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
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
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Fonction pour obtenir le libellé du mouvement
  const getMouvmentLabel = (mouvment) => {
    switch (mouvment) {
      case 'in':
        return 'Entrée';
      case 'out':
        return 'Sortie';
      default:
        return mouvment;
    }
  };

  // Fonction pour obtenir la couleur du mouvement
  const getMouvmentColor = (mouvment) => {
    switch (mouvment) {
      case 'in':
        return 'success';
      case 'out':
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 } }}>
          {/* Card 1: Nombre de transactions */}
          <Card
            sx={{
              background: isDarkMode ? "#1f2937" : "#ffffff",
              border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
              borderRadius: { xs: 2, md: 3 },
              borderLeft: "4px solid #3B82F6",
              boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: isDarkMode ? "0 8px 25px rgba(0, 0, 0, 0.3)" : "0 8px 25px rgba(0, 0, 0, 0.1)",
              }
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  color: isDarkMode ? '#93C5FD' : '#2563EB'
                }}>
                  <TotalIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </Box>
                {loading && (
                  <CircularProgress size={20} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                )}
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1.8rem', sm: '2.2rem' }, color: isDarkMode ? '#FFFFFF' : '#111827' }}>
                {statistics.totalTransactions.toLocaleString('fr-FR')}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Transactions {period === 'day' ? 'aujourd\'hui' : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
              </Typography>
            </CardContent>
          </Card>

          {/* Card 2: Montant total */}
          <Card
            sx={{
              background: isDarkMode ? "#1f2937" : "#ffffff",
              border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
              borderRadius: { xs: 2, md: 3 },
              borderLeft: "4px solid #10B981",
              boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: isDarkMode ? "0 8px 25px rgba(0, 0, 0, 0.3)" : "0 8px 25px rgba(0, 0, 0, 0.1)",
              }
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '50%', 
                  bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  color: isDarkMode ? '#6EE7B7' : '#059669'
                }}>
                  <AmountIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </Box>
                {loading && (
                  <CircularProgress size={20} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                )}
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, fontSize: { xs: '1.8rem', sm: '2.2rem' }, color: isDarkMode ? '#FFFFFF' : '#111827' }}>
                {formatAmount(statistics.totalAmount)} {selectedCurrency}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Montant total {period === 'day' ? 'aujourd\'hui' : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
              </Typography>
            </CardContent>
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
                    Métadonnées
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
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {transaction.reference || `#${transaction.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getMouvmentLabel(transaction.mouvment)}
                            color={getMouvmentColor(transaction.mouvment)}
                            size="small"
                            variant="outlined"
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
                            {formatAmount(transaction.amount)} {selectedCurrency}
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
                          {transaction.metadata && Object.keys(transaction.metadata).length > 0 ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenMetadataModal(transaction)}
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
                              {Object.keys(transaction.metadata).length} champs
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              -
                            </Typography>
                          )}
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

  // Modal pour afficher les métadonnées
  const MetadataModal = () => (
    <Modal
      open={metadataModalOpen}
      onClose={handleCloseMetadataModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }
      }}
    >
      <Fade in={metadataModalOpen}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '600px' },
            maxHeight: { xs: '80vh', md: '70vh' },
            bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: { xs: 2, md: 3 },
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header du modal */}
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
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  Métadonnées de la transaction
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Référence: {selectedTransaction?.reference || `#${selectedTransaction?.id}`}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseMetadataModal}
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

          {/* Contenu du modal */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {selectedTransaction?.metadata && Object.keys(selectedTransaction.metadata).length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(selectedTransaction.metadata).map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{
                        mb: 1,
                        color: 'primary.main',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: typeof value === 'object' ? 'monospace' : 'inherit',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                      }
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune métadonnée disponible pour cette transaction
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer du modal */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Button
              variant="contained"
              onClick={handleCloseMetadataModal}
              fullWidth
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                }
              }}
            >
              Fermer
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
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
            : "rgba(249, 250, 251, 0.8)",
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

      {/* Modal des métadonnées */}
      <MetadataModal />

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
};

export default SuiviFinancier;
