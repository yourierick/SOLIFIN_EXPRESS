import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  MoneyOff as MoneyOffIcon,
  Pending as PendingIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as ProcessIcon,
  BarChart as BarChartIcon,
  List as ListIcon,
} from '@mui/icons-material';

const SuiviFinancier = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    period: 'all',
    status: 'all'
  });
  const [viewMode, setViewMode] = useState('chart');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setTransactions([
          {
            id: 1,
            client: 'Jean Dupont',
            type: 'subscription',
            amount: 29.99,
            currency: 'EUR',
            status: 'completed',
            date: '2024-12-01',
            description: 'Abonnement Premium Mensuel'
          },
          {
            id: 2,
            client: 'Marie Martin',
            type: 'payment',
            amount: 99.99,
            currency: 'EUR',
            status: 'completed',
            date: '2024-12-02',
            description: 'Paiement service additionnel'
          },
          {
            id: 3,
            client: 'Pierre Durand',
            type: 'refund',
            amount: -29.99,
            currency: 'EUR',
            status: 'completed',
            date: '2024-12-03',
            description: 'Remboursement abonnement'
          },
          {
            id: 4,
            client: 'Sophie Bernard',
            type: 'subscription',
            amount: 9.99,
            currency: 'EUR',
            status: 'pending',
            date: '2024-12-04',
            description: 'Abonnement Basic Mensuel'
          },
          {
            id: 5,
            client: 'Lucas Petit',
            type: 'payment',
            amount: 199.99,
            currency: 'EUR',
            status: 'failed',
            date: '2024-12-05',
            description: 'Paiement premium annuel'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { color: 'success', label: 'Complété' },
      pending: { color: 'warning', label: 'En attente' },
      failed: { color: 'error', label: 'Échoué' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        size="small"
        label={config.label}
        color={config.color}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getTypeChip = (type) => {
    const typeConfig = {
      subscription: { color: 'primary', label: 'Abonnement' },
      payment: { color: 'info', label: 'Paiement' },
      refund: { color: 'error', label: 'Remboursement' }
    };
    const config = typeConfig[type] || typeConfig.payment;
    return (
      <Chip
        size="small"
        label={config.label}
        color={config.color}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredTransactions = transactions.filter(trans => {
    if (filters.type !== 'all' && trans.type !== filters.type) return false;
    if (filters.status !== 'all' && trans.status !== filters.status) return false;
    if (filters.period !== 'all') {
      const transDate = new Date(trans.date);
      const now = new Date();
      if (filters.period === 'month' && transDate.getMonth() !== now.getMonth()) return false;
      if (filters.period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (transDate < weekAgo) return false;
      }
    }
    return true;
  });

  const totalRevenue = filteredTransactions
    .filter(trans => trans.status === 'completed' && trans.amount > 0)
    .reduce((sum, trans) => sum + trans.amount, 0);

  const totalRefunds = Math.abs(filteredTransactions
    .filter(trans => trans.status === 'completed' && trans.amount < 0)
    .reduce((sum, trans) => sum + trans.amount, 0));

  const pendingAmount = filteredTransactions
    .filter(trans => trans.status === 'pending')
    .reduce((sum, trans) => sum + trans.amount, 0);

  const netRevenue = totalRevenue - totalRefunds;

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* En-tête avec toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, sm: 4 } }}>
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
          Suivi Financier
        </Typography>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{
            bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)',
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main + '20',
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <ToggleButton value="chart">
            <BarChartIcon sx={{ mr: 1, fontSize: 18 }} />
            Graphique
          </ToggleButton>
          <ToggleButton value="list">
            <ListIcon sx={{ mr: 1, fontSize: 18 }} />
            Liste
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(40, 167, 69, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {formatAmount(totalRevenue)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Revenu Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(0, 123, 255, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {formatAmount(netRevenue)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Revenu Net
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(220, 53, 69, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyOffIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {formatAmount(totalRefunds)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Remboursements
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(255, 193, 7, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {formatAmount(pendingAmount)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                En Attente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: isDarkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(249, 250, 251, 0.8)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          boxShadow: "none",
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Filtres
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={() => setFilters({ type: 'all', period: 'all', status: 'all' })}
            size="small"
            color="inherit"
          >
            Réinitialiser
          </Button>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="subscription">Abonnements</MenuItem>
                <MenuItem value="payment">Paiements</MenuItem>
                <MenuItem value="refund">Remboursements</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="completed">Complétés</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="failed">Échoués</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select
                value={filters.period}
                label="Période"
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="month">Ce mois</MenuItem>
                <MenuItem value="week">Cette semaine</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Contenu principal */}
      {viewMode === 'chart' ? (
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            bgcolor: isDarkMode
              ? "rgba(31, 41, 55, 0.5)"
              : "rgba(249, 250, 251, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
            boxShadow: "none",
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <BarChartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Graphique des revenus
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Intégrez votre bibliothèque de graphiques préférée ici (Chart.js, Recharts, etc.)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, height: 200 }}>
              {[60, 80, 45, 90, 70].map((height, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 40,
                    height: `${height}%`,
                    background: 'linear-gradient(to top, #3b82f6, #2563eb)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scaleY(1.05)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper
          sx={{
            borderRadius: 3,
            bgcolor: isDarkMode
              ? "rgba(31, 41, 55, 0.5)"
              : "rgba(249, 250, 251, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
            boxShadow: "none",
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Montant</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((trans) => (
                    <TableRow
                      key={trans.id}
                      sx={{
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <TableCell>{trans.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{trans.client}</TableCell>
                      <TableCell>{getTypeChip(trans.type)}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: trans.amount > 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {trans.amount > 0 ? '+' : ''}{formatAmount(trans.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(trans.status)}</TableCell>
                      <TableCell>{formatDate(trans.date)}</TableCell>
                      <TableCell>{trans.description}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        >
                          Voir
                        </Button>
                        {trans.status === 'pending' && (
                          <Button
                            size="small"
                            startIcon={<ProcessIcon />}
                            variant="contained"
                            color="success"
                          >
                            Traiter
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SuiviFinancier;
