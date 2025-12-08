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
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

const SuiviAbonnement = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all'
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setSubscriptions([
          {
            id: 1,
            client: 'Jean Dupont',
            email: 'jean.dupont@email.com',
            plan: 'Premium',
            status: 'active',
            startDate: '2024-01-15',
            endDate: '2024-12-15',
            price: 29.99
          },
          {
            id: 2,
            client: 'Marie Martin',
            email: 'marie.martin@email.com',
            plan: 'Basic',
            status: 'expired',
            startDate: '2023-06-01',
            endDate: '2024-05-31',
            price: 9.99
          },
          {
            id: 3,
            client: 'Pierre Durand',
            email: 'pierre.durand@email.com',
            plan: 'Premium',
            status: 'active',
            startDate: '2024-03-10',
            endDate: '2025-03-10',
            price: 29.99
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { color: 'success', label: 'Actif' },
      expired: { color: 'error', label: 'Expiré' }
    };
    const config = statusConfig[status] || statusConfig.expired;
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
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filters.status !== 'all' && sub.status !== filters.status) return false;
    if (filters.period !== 'all') {
      const subYear = new Date(sub.startDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (filters.period === 'current' && subYear !== currentYear) return false;
      if (filters.period === 'previous' && subYear === currentYear) return false;
    }
    return true;
  });

  const totalRevenue = filteredSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.price, 0);

  return (
    <Box>
      {/* Cartes de statistiques */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {filteredSubscriptions.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Abonnés
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {filteredSubscriptions.filter(sub => sub.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Abonnés Actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                <MoneyIcon sx={{ fontSize: 28, opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {formatAmount(totalRevenue)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Revenu Mensuel
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
            onClick={() => setFilters({ status: 'all', period: 'all' })}
            size="small"
            color="inherit"
          >
            Réinitialiser
          </Button>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="active">Actifs</MenuItem>
                <MenuItem value="expired">Expirés</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Période</InputLabel>
              <Select
                value={filters.period}
                label="Période"
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="current">Année en cours</MenuItem>
                <MenuItem value="previous">Années précédentes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des abonnements */}
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
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Date de début</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Date de fin</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Prix</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow
                    key={sub.id}
                    sx={{
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <TableCell>{sub.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{sub.client}</TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={sub.plan}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(sub.status)}</TableCell>
                    <TableCell>{formatDate(sub.startDate)}</TableCell>
                    <TableCell>{formatDate(sub.endDate)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatAmount(sub.price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      >
                        Voir
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        variant="contained"
                        color="primary"
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default SuiviAbonnement;
