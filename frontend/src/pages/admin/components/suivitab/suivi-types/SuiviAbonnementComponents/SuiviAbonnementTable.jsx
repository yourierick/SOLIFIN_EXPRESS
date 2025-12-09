import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Person as UserIcon,
  Business as PackIcon,
  CalendarToday as DateIcon,
  CreditCard as PaymentIcon,
  Link as LinkIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import UserPacksFilters from './UserPacksFilters';
import ExportToExcel from './ExportToExcel';

const SuiviAbonnementTable = ({ period, filters, onFiltersChange, currency }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // États pour la pagination et les données
  const [userPacks, setUserPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fonction pour récupérer les données avec pagination
  const fetchUserPacks = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        period: period,
        ...filters,
      };
      
      // Formater les dates pour l'API
      if (filters.purchase_date_start) {
        params.purchase_date_start = filters.purchase_date_start instanceof Date 
          ? filters.purchase_date_start.toISOString().split('T')[0]
          : filters.purchase_date_start;
      }
      if (filters.purchase_date_end) {
        params.purchase_date_end = filters.purchase_date_end instanceof Date 
          ? filters.purchase_date_end.toISOString().split('T')[0]
          : filters.purchase_date_end;
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/user-packs', { params });
      
      setUserPacks(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données quand la pagination ou les filtres changent
  useEffect(() => {
    fetchUserPacks();
  }, [page, rowsPerPage, period, filters]);

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  // Fonction pour obtenir la couleur du statut de paiement
  const getPaymentStatusColor = (status) => {
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

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Fonction pour formater la monnaie
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={{ xs: 2, sm: 0 }}
        sx={{ 
          mb: { xs: 2, sm: 3 },
          mt: { xs: 2, sm: 3 }
        }}
      >
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          fontWeight={600} 
          sx={{ 
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
          }}
        >
          {isMobile ? 'Abonnements' : 'Gestion des Abonnements Utilisateurs'}
        </Typography>
        
        <ExportToExcel 
          period={period}
          filters={filters}
          currentPage={page}
          rowsPerPage={rowsPerPage}
          total={total}
          currency={currency}
        />
      </Stack>
      
      {/* Filtres avancés */}
      <UserPacksFilters 
        filters={filters} 
        onFiltersChange={onFiltersChange} 
        period={period}
      />
      
      <Paper
        sx={{
          borderRadius: { xs: 2, md: 3 },
          overflow: 'hidden',
          boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
          border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }}
      >
        <TableContainer sx={{ 
          maxHeight: { xs: '60vh', sm: '70vh', md: 'none' },
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: isDarkMode ? '#1f2937' : '#f1f5f9',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDarkMode ? '#4b5563' : '#cbd5e1',
            borderRadius: '3px',
          },
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Utilisateur
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Pack
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Statut
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Paiement
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Prix
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Date d'achat
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Date d'expiration
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Parrain
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    bgcolor: isDarkMode ? '#1f2937' : '#f8fafc',
                    borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    letterSpacing: '0.025em',
                  }}
                >
                  Filleuls directs
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && page === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : userPacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">
                      Aucun abonnement trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                userPacks.map((userPack, index) => (
                  <TableRow
                    key={userPack.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                      },
                      backgroundColor: index % 2 === 0 
                        ? (isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.5)')
                        : 'transparent',
                      borderBottom: `1px solid ${isDarkMode ? '#374151' : '#f1f5f9'}`,
                    }}
                  >
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <UserIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {userPack.user?.name || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {userPack.user?.email || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PackIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {userPack.pack?.name || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {userPack.pack?.categorie || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Chip
                        label={userPack.status === 'active' ? 'Actif' : userPack.status === 'inactive' ? 'Inactif' : 'Expiré'}
                        size="small"
                        color={getStatusColor(userPack.status)}
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Chip
                        label={userPack.payment_status === 'completed' ? 'Complété' : userPack.payment_status === 'pending' ? 'En attente' : 'Echoué'}
                        size="small"
                        color={getPaymentStatusColor(userPack.payment_status)}
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      fontWeight: 600,
                    }}>
                      {formatCurrency(userPack.pack?.price, 'USD')}
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {formatDate(userPack.purchase_date)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        {formatDate(userPack.expiry_date)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      {userPack.sponsor ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LinkIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              {userPack.sponsor.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {userPack.referral_code}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: { xs: 1.5, sm: 2 },
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Chip
                          label={userPack.direct_referrals_count || 0}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            minWidth: 40,
                            height: 24,
                          }}
                        />
                      </Box>
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
  );
};

export default SuiviAbonnementTable;
