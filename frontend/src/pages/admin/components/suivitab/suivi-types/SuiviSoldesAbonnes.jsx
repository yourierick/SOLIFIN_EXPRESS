import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme as useMuiTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Stack,
  Button,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ExportToExcelTransactions from './SuiviSoldeComponents/ExportToExcelTransactions';

// Composant TextField avec forwardRef pour MUI X DatePicker
const CustomTextField = React.forwardRef((props, ref) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  
  return (
    <TextField
      {...props}
      inputRef={ref}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: { xs: 1.5, md: 2 },
          bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            borderColor: muiTheme.palette.primary.main,
          },
        },
      }}
    />
  );
});

CustomTextField.displayName = 'CustomTextField';

const SuiviSoldesAbonnes = ({ period }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // États pour les statistiques
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // États pour le tableau des transactions
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expanded, setExpanded] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    flow: '',
    status: '',
    date_start: null,
    date_end: null,
  });

  // Formater les montants selon la devise sélectionnée (pas de conversion)
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Formater la date pour l'affichage
  const formatDateDisplay = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formater le type de transaction en français
  const formatType = (type) => {
    const typeTranslations = {
      'withdrawal': 'Retrait',
      'commission de parrainage': 'Commission de parrainage',
      'commission de transfert': 'Commission de transfert',
      'transfer': 'Transfert',
      'digital_product_sale': 'Vente produit numérique',
      'reception': 'Réception',
      'commission de retrait': 'Commission de retrait',
      'purchase': 'Achat',
      'virtual_purchase': 'Achat de virtuel',
      'remboursement': 'Remboursement'
    };
    
    return typeTranslations[type] || type;
  };

  // Gérer les changements de filtres
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(0); // Réinitialiser la page lors du changement de filtre
  };

  // Effacer tous les filtres
  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      flow: '',
      status: '',
      date_start: null,
      date_end: null,
    });
    setPage(0);
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  // Charger les statistiques
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/tableau-de-suivi/wallet-statistics?period=${period}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les transactions
  const fetchTransactions = async () => {
    try {
      // Préparer les filtres avec formatage des dates
      const formattedFilters = { ...filters };
      
      // Formater les dates pour l'API
      if (filters.date_start) {
        formattedFilters.date_start = filters.date_start instanceof Date 
          ? filters.date_start.toISOString().split('T')[0]
          : filters.date_start;
      }
      if (filters.date_end) {
        formattedFilters.date_end = filters.date_end instanceof Date 
          ? filters.date_end.toISOString().split('T')[0]
          : filters.date_end;
      }

      const params = new URLSearchParams({
        page: page + 1,
        per_page: rowsPerPage,
        period: period,
        ...Object.fromEntries(
          Object.entries(formattedFilters).filter(([_, value]) => value !== null && value !== '')
        )
      });

      const response = await axios.get(`/api/admin/tableau-de-suivi/wallet-transactions?${params}`);
      setTransactions(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
    }
  };

  // Effets pour charger les données
  useEffect(() => {
    fetchStatistics();
  }, [period]);

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, filters, period]);

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Obtenir la couleur pour le type de mouvement
  const getFlowColor = (flow) => {
    switch (flow) {
      case 'in':
        return 'success';
      case 'out':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtenir la couleur pour le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {/* Cartes de statistiques */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          {/* Carte Solde Total */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: "100%",
                background: isDarkMode ? '#1f2937' : '#ffffff',
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}>
                    <WalletIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={600}
                      sx={{ 
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        lineHeight: 1.2,
                      }}
                    >
                      {statistics ? formatAmount(statistics.solde) : formatAmount(0)}
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  variant="body1" 
                  fontWeight={600}
                  sx={{ 
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main' 
                  }} />
                  Solde : Entrées - Sorties
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte Total Entré */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: "100%",
                background: isDarkMode ? '#1f2937' : '#ffffff',
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={600}
                      sx={{ 
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        lineHeight: 1.2,
                      }}
                    >
                      {statistics ? formatAmount(statistics.total_in) : formatAmount(0)}
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  variant="body1" 
                  fontWeight={600}
                  sx={{ 
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main' 
                  }} />
                  Total Entrées
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Carte Total Sorti */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: "100%",
                background: isDarkMode ? '#1f2937' : '#ffffff',
                border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                borderRadius: { xs: 2, md: 3 },
                borderLeft: "4px solid #EF4444",
                boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px) scale(1.02)",
                  boxShadow: isDarkMode ? "0 8px 25px rgba(0, 0, 0, 0.3)" : "0 8px 25px rgba(0, 0, 0, 0.1)",
                }
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  }}>
                    <TrendingDownIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={600}
                      sx={{ 
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        lineHeight: 1.2,
                      }}
                    >
                      {statistics ? formatAmount(statistics.total_out) : formatAmount(0)}
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  variant="body1" 
                  fontWeight={600}
                  sx={{ 
                    color: isDarkMode ? '#d1d5db' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'error.main' 
                  }} />
                  Total Sorties
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tableau des transactions */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 2, md: 3 },
            background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          }}
        >
          {/* En-tête avec titre et filtres */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight={600}
              sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              Transactions
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    minWidth: 'auto',
                  }}
                >
                  Effacer
                </Button>
              )}
              
              <ExportToExcelTransactions 
                period={period}
                filters={filters}
                currentPage={page}
                rowsPerPage={rowsPerPage}
                total={total}
              />
              
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                {expanded ? (
                  <ExpandLessIcon sx={{ color: 'text.secondary' }} />
                ) : (
                  <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
                )}
              </IconButton>
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
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      sx={{ 
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' 
                          : 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Filtres avancés
                    </Typography>
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
                {/* Recherche */}
                <Grid item xs={12} sm={6} md={3}>
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
                      placeholder="Nom d'utilisateur ou référence"
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
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

                {/* Type de transaction */}
                <Grid item xs={12} sm={6} md={3}>
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
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          mr: 1,
                          animation: 'pulse 2s infinite'
                        }} />
                        Type
                      </Box>
                    </Typography>
                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                      <Select
                        value={filters.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
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
                          <em>Tous les types</em>
                        </MenuItem>
                        <MenuItem value="withdrawal">Retrait des fonds</MenuItem>
                        <MenuItem value="commission de parrainage">Commission de parrainage</MenuItem>
                        <MenuItem value="commission de transfert">Commission de transfert</MenuItem>
                        <MenuItem value="transfer">Transfert des fonds</MenuItem>
                        <MenuItem value="digital_product_sale">Vente de produit numérique</MenuItem>
                        <MenuItem value="reception">Réception des fonds</MenuItem>
                        <MenuItem value="commission de retrait">Commission de retrait</MenuItem>
                        <MenuItem value="purchase">Achat ou renouvellement de pack</MenuItem>
                        <MenuItem value="virtual_purchase">Achat de virtuel</MenuItem>
                        <MenuItem value="remboursement">Remboursement sur retrait</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                {/* Type de mouvement */}
                <Grid item xs={12} sm={6} md={3}>
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
                        Mouvement
                      </Box>
                    </Typography>
                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                      <Select
                        value={filters.flow || ''}
                        onChange={(e) => handleFilterChange('flow', e.target.value)}
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
                          <em>Tous les mouvements</em>
                        </MenuItem>
                        <MenuItem value="in">Entrée</MenuItem>
                        <MenuItem value="out">Sortie</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                {/* Statut */}
                <Grid item xs={12} sm={6} md={3}>
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
                          bgcolor: 'error.main',
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
                        <MenuItem value="pending">En attente</MenuItem>
                        <MenuItem value="completed">Complété</MenuItem>
                        <MenuItem value="failed">Échoué</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                {/* Périodes - conteneur groupé */}
                <Grid item xs={12} sm={6}>
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
                      <Grid container spacing={{ xs: 2, sm: 6 }}>
                      {/* Période personnalisée */}
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
                            }}>
                              <Box sx={{ 
                                width: 2, 
                                height: 2, 
                                bgcolor: 'info.main',
                                borderRadius: '50%',
                                mr: 1,
                                animation: 'pulse 2s infinite'
                              }} />
                              Période personnalisée
                            </Box>
                          </Typography>
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="Date de début"
                                value={filters.date_start || null}
                                onChange={(value) => handleFilterChange('date_start', value)}
                                enableAccessibleFieldDOMStructure={false}
                                slots={{
                                  textField: CustomTextField,
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="Date de fin"
                                value={filters.date_end || null}
                                onChange={(value) => handleFilterChange('date_end', value)}
                                enableAccessibleFieldDOMStructure={false}
                                slots={{
                                  textField: CustomTextField,
                                }}
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
                    onClick={clearFilters}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                      Réinitialiser
                    </Box>
                  </Button>
                  <Button
                    onClick={() => setExpanded(false)}
                    variant="contained"
                    sx={{
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      borderRadius: { xs: 1.5, md: 2 },
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ fontSize: 16 }} />
                      Appliquer
                    </Box>
                  </Button>
                </Box>
              </Box>

              {/* Filtres actifs */}
              {hasActiveFilters && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Filtres actifs:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {filters.search && (
                      <Chip
                        label={`Recherche: ${filters.search}`}
                        onDelete={() => handleFilterChange('search', '')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.type && (
                      <Chip
                        label={`Type: ${filters.type}`}
                        onDelete={() => handleFilterChange('type', '')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.flow && (
                      <Chip
                        label={`Mouvement: ${filters.flow === 'in' ? 'Entrée' : 'Sortie'}`}
                        onDelete={() => handleFilterChange('flow', '')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filters.status && (
                      <Chip
                        label={`Statut: ${filters.status}`}
                        onDelete={() => handleFilterChange('status', '')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {(filters.date_start || filters.date_end) && (
                      <Chip
                        label={`Période: ${filters.date_start ? formatDateDisplay(filters.date_start) : '...'} - ${filters.date_end ? formatDateDisplay(filters.date_end) : '...'}`}
                        onDelete={() => {
                          setFilters(prev => ({
                            ...prev,
                            date_start: null,
                            date_end: null,
                          }));
                        }}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
          </Collapse>

          {/* Tableau */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Utilisateur
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Référence
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Mouvement
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Montant
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Statut
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Aucune transaction trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      sx={{
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.wallet.user?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.reference || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatType(transaction.type)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.mouvment === 'in' ? 'Entrée' : 'Sortie'}
                          size="small"
                          color={getFlowColor(transaction.flow)}
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ 
                            color: transaction.mouvment === 'in' ? 'success.main' : 'error.main',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          {formatAmount(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status === 'completed' ? 'Complété' : 
                                 transaction.status === 'pending' ? 'En attente' : 'Échoué'}
                          size="small"
                          color={getStatusColor(transaction.status)}
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatDateDisplay(transaction.created_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            sx={{
              borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              '& .MuiTablePagination-toolbar': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
              backgroundColor: isDarkMode ? '#1f2937' : '#fff',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
            }}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default SuiviSoldesAbonnes;
