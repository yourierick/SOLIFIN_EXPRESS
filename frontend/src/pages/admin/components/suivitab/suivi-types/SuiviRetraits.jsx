import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  useTheme as useMuiTheme,
  InputAdornment,
  IconButton,
  Collapse,
  useMediaQuery,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Wallet as WalletIcon,
  Paid as PaidIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  TrendingUp,
  Check,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ExportButtons from './SuiviJetonComponents/ExportButtons';

const SuiviRetraits = ({ period }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // État pour l'expansion des filtres
  const [expanded, setExpanded] = useState(false);

  // États pour les données
  const [statistics, setStatistics] = useState(null);
  const [retraits, setRetraits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); // Chargement spécifique à la recherche
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    user_search: '',
    created_date_start: null,
    created_date_end: null,
    paid_date_start: null,
    paid_date_end: null,
    refund_date_start: null,
    refund_date_end: null,
  });

  // État pour l'export
  const [exportLoading, setExportLoading] = useState(false);

  // États pour le debounce de la recherche
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Options pour les filtres
  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours de traitement' },
    { value: 'rejected', label: 'Rejeté' },
    { value: 'failed', label: 'Echoué' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'paid', label: 'Payé' },
  ];

  const paymentMethodOptions = [
    { value: 'orange-money', label: 'Orange Money' },
    { value: 'airtel-money', label: 'Airtel Money' },
    { value: 'm-pesa', label: 'M-Pesa' },
    { value: 'afrimoney', label: 'Afrimoney' },
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'american-express', label: 'American Express' },
  ];

  // Formater le montant
  const formatAmount = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Formater le nombre
  const formatNumber = (number) => {
    if (!number) return '0';
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'email_verification':
        return 'warning';
      case 'approved':
        return 'info';
      case 'paid':
        return 'success';
      case 'rejected':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Obtenir le texte de la méthode de paiement
  const getPaymentMethodText = (paymentMethod) => {
    const option = paymentMethodOptions.find(opt => opt.value === paymentMethod);
    return option ? option.label : paymentMethod;
  };

  // Charger les statistiques
  const fetchStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const params = {
        period: period,
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/retraits/statistics', { params });
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Charger les retraits
  const fetchRetraits = async () => {
    setLoading(true);
    try {
      const params = {
        period: period,
        page: page + 1,
        per_page: rowsPerPage,
        ...filters,
      };

      // Nettoyer les filtres de date
      Object.keys(params).forEach(key => {
        if (key.includes('_date_') && params[key] === null) {
          delete params[key];
        } else if (key.includes('_date_') && params[key]) {
          params[key] = params[key].toISOString().split('T')[0];
        }
      });

      const response = await axios.get('/api/admin/tableau-de-suivi/retraits', { params });
      setRetraits(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Erreur lors de la récupération des retraits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les retraits pour la recherche (sans squelette)
  const fetchRetraitsSearch = async () => {
    setSearchLoading(true);
    try {
      const params = {
        period: period,
        page: page + 1,
        per_page: rowsPerPage,
        user_search: debouncedSearch,
        ...filters,
      };

      // Nettoyer les filtres de date
      Object.keys(params).forEach(key => {
        if (key.includes('_date_') && params[key] === null) {
          delete params[key];
        } else if (key.includes('_date_') && params[key]) {
          params[key] = params[key].toISOString().split('T')[0];
        }
      });

      const response = await axios.get('/api/admin/tableau-de-suivi/retraits', { params });
      setRetraits(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Erreur lors de la recherche des retraits:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Gérer le changement de filtre
  const handleFilterChange = (field, value) => {
    // Créer une copie des filtres actuels
    const newFilters = { ...filters };
    
    // Si la valeur est vide, null ou undefined, supprimer le champ
    if (value === '' || value === null || value === undefined) {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    
    // Mettre à jour l'état
    setFilters(newFilters);
  };

  // Compter le nombre de filtres actifs
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      // Vérifier si la valeur est significative
      if (value === '' || value === null || value === undefined) {
        return false;
      }
      // Pour les dates, vérifier si c'est une date valide
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      // Pour les autres types, vérifier si ce n'est pas vide
      return true;
    }).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      status: '',
      payment_method: '',
      user_search: '',
      created_date_start: null,
      created_date_end: null,
      paid_date_start: null,
      paid_date_end: null,
      refund_date_start: null,
      refund_date_end: null,
    });
    setPage(0);
  };

  // Fonctions d'exportation
  const exportRetraitsFiltered = async () => {
    setExportLoading(true);
    try {
      const params = {
        period: period,
        ...filters,
      };

      // Nettoyer les filtres de date
      Object.keys(params).forEach(key => {
        if (key.includes('_date_') && params[key] === null) {
          delete params[key];
        } else if (key.includes('_date_') && params[key]) {
          params[key] = params[key].toISOString().split('T')[0];
        }
      });

      const response = await axios.get('/api/admin/tableau-de-suivi/retraits/export', { params });
      
      // Formater les données pour l'export Excel
      return response.data.map(retrait => ({
        'ID': retrait.id,
        'Utilisateur': retrait.user?.name || 'N/A',
        'Email': retrait.user?.email || 'N/A',
        'Montant': formatAmount(retrait.amount),
        'Statut': getStatusText(retrait.status),
        'Méthode Paiement': getPaymentMethodText(retrait.payment_method),
        'Détails Paiement': retrait.payment_details ? JSON.stringify(retrait.payment_details) : 'N/A',
        'Note Admin': retrait.admin_note || 'N/A',
        'Traité par': retrait.processor?.name || 'N/A',
        'Date Création': new Date(retrait.created_at).toLocaleDateString('fr-FR'),
        'Date Traitement': retrait.processed_at ? new Date(retrait.processed_at).toLocaleDateString('fr-FR') : 'N/A',
        'Date Paiement': retrait.paid_at ? new Date(retrait.paid_at).toLocaleDateString('fr-FR') : 'N/A',
        'Date Remboursement': retrait.refund_at ? new Date(retrait.refund_at).toLocaleDateString('fr-FR') : 'N/A',
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export des retraits filtrés:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const exportRetraitsCurrentPage = () => {
    // Transformer les données actuelles pour l'export
    return retraits.map(retrait => ({
      'ID': retrait.id,
      'Utilisateur': retrait.user?.name || 'N/A',
      'Email': retrait.user?.email || 'N/A',
      'Montant': formatAmount(retrait.amount),
      'Statut': getStatusText(retrait.status),
      'Méthode Paiement': getPaymentMethodText(retrait.payment_method),
      'Détails Paiement': retrait.payment_details ? JSON.stringify(retrait.payment_details) : 'N/A',
      'Note Admin': retrait.admin_note || 'N/A',
      'Traité par': retrait.processor?.name || 'N/A',
      'Date Création': new Date(retrait.created_at).toLocaleDateString('fr-FR'),
      'Date Traitement': retrait.processed_at ? new Date(retrait.processed_at).toLocaleDateString('fr-FR') : 'N/A',
      'Date Paiement': retrait.paid_at ? new Date(retrait.paid_at).toLocaleDateString('fr-FR') : 'N/A',
      'Date Remboursement': retrait.refund_at ? new Date(retrait.refund_at).toLocaleDateString('fr-FR') : 'N/A',
    }));
  };

  const exportRetraitsAll = async () => {
    setExportLoading(true);
    try {
      const params = {
        period: period,
        export_all: true
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/retraits/export', { params });
      
      // Formater les données pour l'export Excel
      return response.data.map(retrait => ({
        'ID': retrait.id,
        'Utilisateur': retrait.user?.name || 'N/A',
        'Email': retrait.user?.email || 'N/A',
        'Montant': formatAmount(retrait.amount),
        'Statut': getStatusText(retrait.status),
        'Méthode Paiement': getPaymentMethodText(retrait.payment_method),
        'Détails Paiement': retrait.payment_details ? JSON.stringify(retrait.payment_details) : 'N/A',
        'Note Admin': retrait.admin_note || 'N/A',
        'Traité par': retrait.processor?.name || 'N/A',
        'Date Création': new Date(retrait.created_at).toLocaleDateString('fr-FR'),
        'Date Traitement': retrait.processed_at ? new Date(retrait.processed_at).toLocaleDateString('fr-FR') : 'N/A',
        'Date Paiement': retrait.paid_at ? new Date(retrait.paid_at).toLocaleDateString('fr-FR') : 'N/A',
        'Date Remboursement': retrait.refund_at ? new Date(retrait.refund_at).toLocaleDateString('fr-FR') : 'N/A',
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export de tous les retraits:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  // Effets pour charger les données
  // Debounce pour la recherche utilisateur
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.user_search);
    }, 500); // 500ms de debounce

    return () => clearTimeout(timer);
  }, [filters.user_search]);

  // Charger les retraits (déclenché par les filtres sauf la recherche)
  useEffect(() => {
    if (period) {
      fetchRetraits();
    }
  }, [period, page, rowsPerPage, filters.status, filters.payment_method, filters.created_date_start, filters.created_date_end, filters.paid_date_start, filters.paid_date_end, filters.refund_date_start, filters.refund_date_end]);

  // Charger les retraits spécifiquement pour la recherche
  useEffect(() => {
    if (period) {
      fetchRetraitsSearch();
    }
  }, [debouncedSearch]);

  // Charger les statistiques
  useEffect(() => {
    if (period) {
      fetchStatistics();
    }
  }, [period]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {/* Afficher le squelette de chargement pendant le chargement des données (sauf recherche) */}
        {(statisticsLoading || loading) && !searchLoading && (
          <Box sx={{ width: '100%' }}>
            {/* Squelette des cartes de statistiques */}
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item}>
                  <Card
                    sx={{
                      p: { xs: 3, sm: 4 },
                      borderRadius: { xs: 2, md: 3 },
                      background: isDarkMode ? '#1f2937' : '#ffffff',
                      border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                      borderLeft: "4px solid #3B82F6",
                      boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px) scale(1.02)",
                        boxShadow: isDarkMode ? "0 8px 25px rgba(0, 0, 0, 0.3)" : "0 8px 25px rgba(0, 0, 0, 0.1)",
                      }
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: isDarkMode ? '#374151' : '#f3f4f6',
                          mr: 2,
                        }}>
                          <CircularProgress size={20} thickness={2} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box 
                            sx={{ 
                              height: 32, 
                              width: '60%', 
                              bgcolor: isDarkMode ? '#374151' : '#f3f4f6',
                              borderRadius: 1,
                              mb: 1,
                            }} 
                          />
                        </Box>
                      </Box>
                      <Box sx={{ height: 16, width: '80%', bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1, mb: 1 }} />
                      <Box sx={{ height: 20, width: '40%', bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Squelette des filtres */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Filtres
              </Typography>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item}>
                    <Box sx={{ height: 40, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                  </Grid>
                ))}
                {[6, 7, 8, 9].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item}>
                    <Box sx={{ height: 56, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Squelette du tableau */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ height: 32, width: 150, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                <Box sx={{ height: 36, width: 120, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <TableCell key={item}>
                          <Box sx={{ height: 16, width: '80%', bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <TableRow key={row}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
                          <TableCell key={cell}>
                            <Box sx={{ height: 20, width: '90%', bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Box sx={{ height: 20, width: 120, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
                <Box sx={{ height: 32, width: 100, bgcolor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: 1 }} />
              </Box>
            </Paper>
          </Box>
        )}

        {/* Contenu normal une fois les données chargées ou pendant la recherche */}
        {!statisticsLoading && !loading && (
          <>
            {/* Cartes de statistiques */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
              {/* Carte Total des retraits */}
              <Grid item xs={12} md={3}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: { xs: 2, sm: 3 },
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    height: { xs: 110, sm: 120, md: 140 },
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#f9fafb',
                    p: { xs: 1.5, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#3b82f6',
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 }
                      }}
                    >
                      <WalletIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? '#d1d5db' : '#4b5563', 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          Total retraits
                        </Typography>
                        <Chip 
                          icon={<TrendingUp sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                          label={statistics ? formatNumber(statistics.total) : '0'} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ 
                            height: { xs: 14, sm: 16 }, 
                            fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                            color: isDarkMode ? '#9ca3af' : '#6b7280' 
                          }}
                        />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: '#3b82f6', 
                        fontWeight: 700, 
                        lineHeight: 1.2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }
                      }}>
                        {statistics ? formatAmount(statistics.total_amount) : '0'} $
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280', 
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                        lineHeight: 1.2 
                      }}>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 600, 
                          display: 'block' 
                        }}>
                          Toutes demandes
                        </Box>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 400, 
                          display: 'block' 
                        }}>
                          Confondues
                        </Box>
                      </Typography>
                    </Box>
                    {statisticsLoading && (
                      <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Carte Retraits payés */}
              <Grid item xs={12} md={3}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: { xs: 2, sm: 3 },
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    height: { xs: 110, sm: 120, md: 140 },
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#f9fafb',
                    p: { xs: 1.5, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#10b981',
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 }
                      }}
                    >
                      <PaidIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? '#d1d5db' : '#4b5563', 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          Retraits payés
                        </Typography>
                        <Chip 
                          icon={<Check sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                          label={statistics ? formatNumber(statistics.paid) : '0'} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ 
                            height: { xs: 14, sm: 16 }, 
                            fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                            color: isDarkMode ? '#9ca3af' : '#6b7280' 
                          }}
                        />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: '#10b981', 
                        fontWeight: 700, 
                        lineHeight: 1.2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }
                      }}>
                        {statistics ? formatAmount(statistics.paid_amount) : '0'} $
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280', 
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                        lineHeight: 1.2 
                      }}>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 600, 
                          display: 'block' 
                        }}>
                          Succès
                        </Box>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 400, 
                          display: 'block' 
                        }}>
                          Traités
                        </Box>
                      </Typography>
                    </Box>
                    {statisticsLoading && (
                      <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Carte Retraits en attente */}
              <Grid item xs={12} md={3}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: { xs: 2, sm: 3 },
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    height: { xs: 110, sm: 120, md: 140 },
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#f9fafb',
                    p: { xs: 1.5, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#f59e0b',
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 }
                      }}
                    >
                      <PendingIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? '#d1d5db' : '#4b5563', 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          En attente
                        </Typography>
                        <Chip 
                          icon={<PendingIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                          label={statistics ? formatNumber(statistics.pending) : '0'} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ 
                            height: { xs: 14, sm: 16 }, 
                            fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                            color: isDarkMode ? '#9ca3af' : '#6b7280' 
                          }}
                        />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: '#f59e0b', 
                        fontWeight: 700, 
                        lineHeight: 1.2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }
                      }}>
                        {statistics ? formatAmount(statistics.pending_amount) : '0'} $
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280', 
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                        lineHeight: 1.2 
                      }}>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 600, 
                          display: 'block' 
                        }}>
                          En traitement
                        </Box>
                      </Typography>
                    </Box>
                    {statisticsLoading && (
                      <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Carte Retraits rejetés/annulés */}
              <Grid item xs={12} md={3}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: { xs: 2, sm: 3 },
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    height: { xs: 110, sm: 120, md: 140 },
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#f9fafb',
                    p: { xs: 1.5, sm: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#ef4444',
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 }
                      }}
                    >
                      <CancelIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? '#d1d5db' : '#4b5563', 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          Rejetés
                        </Typography>
                        <Chip 
                          icon={<CancelIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                          label={statistics ? formatNumber(statistics.rejected) : '0'} 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ 
                            height: { xs: 14, sm: 16 }, 
                            fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                            color: isDarkMode ? '#9ca3af' : '#6b7280' 
                          }}
                        />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        color: '#ef4444', 
                        fontWeight: 700, 
                        lineHeight: 1.2,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }
                      }}>
                        {statistics ? formatAmount(statistics.rejected_amount) : '0'} $
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280', 
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                        lineHeight: 1.2 
                      }}>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 600, 
                          display: 'block' 
                        }}>
                          Échecs
                        </Box>
                        <Box component="span" sx={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontWeight: 400, 
                          display: 'block' 
                        }}>
                          Annulés
                        </Box>
                      </Typography>
                    </Box>
                    {statisticsLoading && (
                      <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Filtres modernes */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                mb: { xs: 2, sm: 3 },
                mt: { xs: 3, sm: 3 },
                borderRadius: { xs: 2, md: 3 },
                background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                boxShadow: 'none',
              }}
            >
              {/* Header des filtres */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  mb: expanded ? 2 : 0,
                }}
                onClick={() => setExpanded(!expanded)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                      color: muiTheme.palette.primary.main,
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                      },
                    }}
                  >
                    <FilterIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  </IconButton>
                  
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
                    >
                      Filtres avancés
                    </Typography>
                    {hasActiveFilters && (
                      <Typography variant="caption" color="primary">
                        {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {hasActiveFilters && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetFilters();
                      }}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <ClearIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  )}
                  
                  {expanded ? (
                    <ExpandLessIcon sx={{ color: 'text.secondary' }} />
                  ) : (
                    <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
                  )}
                </Box>
              </Box>

              {/* Contenu des filtres - Design moderne */}
              <Collapse in={expanded}>
                <Box
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)' 
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                    borderRadius: { xs: 2, md: 3 },
                    p: { xs: 3, sm: 4 },
                    mb: 3,
                    boxShadow: isDarkMode 
                      ? '0 10px 40px rgba(0, 0, 0, 0.3)' 
                      : '0 10px 40px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.5s ease',
                  }}
                >
                  {/* Header des filtres */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        <FilterIcon sx={{ 
                          fontSize: { xs: 20, sm: 24 },
                          color: 'primary.main',
                          transition: 'transform 0.3s ease',
                          '&:hover': { transform: 'rotate(12deg)' }
                        }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          Affinez votre recherche
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 2, 
                        height: 2, 
                        bgcolor: 'success.main', 
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Actifs
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    {/* Recherche utilisateur */}
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1, 
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            mr: 1
                          }}>
                            <Box sx={{ 
                              width: 2, 
                              height: 2, 
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              mr: 1,
                              animation: 'pulse 2s infinite'
                            }} />
                            Recherche
                          </Box>
                        </Typography>
                        <TextField
                          fullWidth
                          size={isMobile ? 'small' : 'medium'}
                          placeholder="Nom ou email..."
                          value={filters.user_search || ''}
                          onChange={(e) => handleFilterChange('user_search', e.target.value)}
                          InputProps={{
                            startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
                            endAdornment: searchLoading && (
                              <CircularProgress size={20} thickness={2} />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: { xs: 1.5, md: 2 },
                              bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                borderColor: muiTheme.palette.primary.main,
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                              '&.Mui-focused': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                                borderColor: muiTheme.palette.primary.main,
                                boxShadow: `0 0 0 2px ${muiTheme.palette.primary.main}20`,
                              },
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* Statut */}
                    <Grid item xs={12} sm={23} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1, 
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            mr: 1
                          }}>
                            <Box sx={{ 
                              width: 2, 
                              height: 2, 
                              bgcolor: 'warning.main',
                              borderRadius: '50%',
                              mr: 1,
                              animation: 'pulse 2s infinite'
                            }} />
                            Statut
                          </Box>
                        </Typography>
                        <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                          <Select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            displayEmpty
                            sx={{ 
                              borderRadius: { xs: 1.5, md: 2 },
                              bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                borderColor: muiTheme.palette.primary.main,
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                              '&.Mui-focused': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                                borderColor: muiTheme.palette.primary.main,
                                boxShadow: `0 0 0 2px ${muiTheme.palette.primary.main}20`,
                              },
                            }}
                          >
                            <MenuItem value="">
                              <em>Tous les statuts</em>
                            </MenuItem>
                            {statusOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: option.value === 'pending' ? 'warning.main' : 
                                              option.value === 'processing' || option.value === 'paid' ? 'info.main' :
                                              option.value === 'rejected' ? 'error.main' :
                                              option.value === 'failed' ? 'error.main' :
                                              option.value === 'cancelled' ? 'error.main' : 'default.main'
                                  }} />
                                  {option.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* Méthode de paiement */}
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1, 
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            mr: 1
                          }}>
                            <Box sx={{ 
                              width: 2, 
                              height: 2, 
                              bgcolor: 'info.main',
                              borderRadius: '50%',
                              mr: 1,
                              animation: 'pulse 2s infinite'
                            }} />
                            Méthode
                          </Box>
                        </Typography>
                        <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                          <Select
                            value={filters.payment_method || ''}
                            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                            displayEmpty
                            sx={{ 
                              borderRadius: { xs: 1.5, md: 2 },
                              bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                borderColor: muiTheme.palette.primary.main,
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                              '&.Mui-focused': {
                                bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                                borderColor: muiTheme.palette.primary.main,
                                boxShadow: `0 0 0 2px ${muiTheme.palette.primary.main}20`,
                              },
                            }}
                          >
                            <MenuItem value="">
                              <em>Toutes les méthodes</em>
                            </MenuItem>
                            {paymentMethodOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* Périodes - conteneur groupé */}
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 2,
                            color: 'text.secondary',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center',
                            mr: 1
                          }}>
                            <CalendarIcon sx={{ 
                              fontSize: 16,
                              color: 'info.main',
                              mr: 1
                            }} />
                            Périodes
                          </Box>
                        </Typography>
                        <Box
                          sx={{
                            p: { xs: 2, sm: 3 },
                            border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                            borderRadius: { xs: 1.5, md: 2 },
                            bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          <Grid container spacing={{ xs: 2, sm: 3 }}>
                            {/* Période de création */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ mb: { xs: 2, sm: 0 } }}>
                                <Typography 
                                  variant="caption" 
                                  fontWeight={600} 
                                  sx={{ 
                                    mb: 1, 
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center',
                                    mr: 1
                                  }}>
                                    <Box sx={{ 
                                      width: 2, 
                                      height: 2, 
                                      bgcolor: 'info.main',
                                      borderRadius: '50%',
                                      mr: 1,
                                      animation: 'pulse 2s infinite'
                                    }} />
                                    Période de création
                                  </Box>
                                </Typography>
                                <Grid container spacing={{ xs: 2, sm: 2 }}>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de début"
                                      value={filters.created_date_start || null}
                                      onChange={(value) => handleFilterChange('created_date_start', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de fin"
                                      value={filters.created_date_end || null}
                                      onChange={(value) => handleFilterChange('created_date_end', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Grid>

                            {/* Période de paiement */}
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography 
                                  variant="caption" 
                                  fontWeight={600} 
                                  sx={{ 
                                    mb: 1, 
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center',
                                    mr: 1
                                  }}>
                                    <Box sx={{ 
                                      width: 2, 
                                      height: 2, 
                                      bgcolor: 'success.main',
                                      borderRadius: '50%',
                                      mr: 1,
                                      animation: 'pulse 2s infinite'
                                    }} />
                                    Période de paiement
                                  </Box>
                                </Typography>
                                <Grid container spacing={{ xs: 2, sm: 2 }}>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de début"
                                      value={filters.paid_date_start || null}
                                      onChange={(value) => handleFilterChange('paid_date_start', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de fin"
                                      value={filters.paid_date_end || null}
                                      onChange={(value) => handleFilterChange('paid_date_end', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Grid>

                            {/* Période de remboursement */}
                            <Grid item xs={12}>
                              <Box>
                                <Typography 
                                  variant="caption" 
                                  fontWeight={600} 
                                  sx={{ 
                                    mb: 1, 
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center',
                                    mr: 1
                                  }}>
                                    <Box sx={{ 
                                      width: 2, 
                                      height: 2, 
                                      bgcolor: 'error.main',
                                      borderRadius: '50%',
                                      mr: 1,
                                      animation: 'pulse 2s infinite'
                                    }} />
                                    Période de remboursement
                                  </Box>
                                </Typography>
                                <Grid container spacing={{ xs: 2, sm: 2 }}>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de début"
                                      value={filters.refund_date_start || null}
                                      onChange={(value) => handleFilterChange('refund_date_start', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <DatePicker
                                      label="Date de fin"
                                      value={filters.refund_date_end || null}
                                      onChange={(value) => handleFilterChange('refund_date_end', value)}
                                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Boutons d'action modernes */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mt: 3,
                    pt: 2,
                    borderTop: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ 
                          width: 3, 
                          height: 3, 
                          bgcolor: 'success.main', 
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} />
                        <Box sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 3,
                          height: 3,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                        }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Filtres actifs
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        onClick={resetFilters}
                        sx={{
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1.5, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          borderRadius: { xs: 1.5, md: 2 },
                          background: isDarkMode 
                            ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%)' 
                            : 'linear-gradient(135deg, rgba(243, 244, 246, 0.9) 0%, rgba(229, 231, 235, 0.9) 100%)',
                          color: isDarkMode ? '#d1d5db' : '#4b5563',
                          border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, rgba(75, 85, 99, 0.9) 0%, rgba(107, 114, 128, 0.9) 100%)' 
                              : 'linear-gradient(135deg, rgba(229, 231, 235, 0.9) 0%, rgba(209, 213, 219, 0.9) 100%)',
                            transform: 'translateY(-2px) scale(1.02)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        Réinitialiser
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                          setPage(0);
                          fetchRetraits();
                        }}
                        sx={{
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1.5, sm: 2 },
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          borderRadius: { xs: 1.5, md: 2 },
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                            transform: 'translateY(-2px) scale(1.02)',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                          },
                        }}
                      >
                        Actualiser
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Paper>

            {/* Tableau des retraits */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Liste des retraits
                </Typography>
                <ExportButtons
                  data={retraits}
                  filteredData={retraits}
                  currentPageData={exportRetraitsCurrentPage()}
                  fileName="retraits"
                  isLoading={exportLoading}
                  sheetName="Retraits"
                  onExportFiltered={exportRetraitsFiltered}
                  onExportCurrentPage={exportRetraitsCurrentPage}
                  onExportAll={exportRetraitsAll}
                />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Méthode Paiement</TableCell>
                      <TableCell>Date Création</TableCell>
                      <TableCell>Date Paiement</TableCell>
                      <TableCell>Traité par</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                          <CircularProgress size={40} />
                        </TableCell>
                      </TableRow>
                    ) : retraits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aucun retrait trouvé
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      retraits.map((retrait) => (
                        <TableRow key={retrait.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {retrait.user?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {retrait.user?.email || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {formatAmount(retrait.amount)} $
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(retrait.status)}
                              color={getStatusColor(retrait.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getPaymentMethodText(retrait.payment_method)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(retrait.created_at).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {retrait.paid_at 
                                ? new Date(retrait.paid_at).toLocaleDateString('fr-FR')
                                : 'N/A'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {retrait.processor?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
              />
            </Paper>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default SuiviRetraits;
