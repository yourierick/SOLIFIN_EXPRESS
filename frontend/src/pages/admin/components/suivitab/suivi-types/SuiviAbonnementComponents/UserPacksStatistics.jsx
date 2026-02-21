import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as UsersIcon,
  Business as PackIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const UserPacksStatistics = ({ period, filters, showCardsOnly = false, showChartsOnly = false }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Couleurs pour les graphiques
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    status: {
      active: theme.palette.success.main,
      inactive: theme.palette.warning.main,
      expired: theme.palette.error.main,
      pending: theme.palette.warning.main,
      completed: theme.palette.success.main,
      failed: theme.palette.error.main,
    },
  };

  const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error];

  // Récupérer les statistiques depuis l'API
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {
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
      
      const response = await axios.get('/api/admin/tableau-de-suivi/user-packs-statistics', { params });
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [period, filters]);

  // Formater les nombres
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          Aucune donnée statistique disponible
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : statistics ? (
        <>
          {/* Afficher uniquement les cartes si showCardsOnly est true */}
          {!showChartsOnly && (
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: showCardsOnly ? 0 : 3 }}>
              <Grid item xs={12} sm={6}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  <Box sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#eff6ff',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#3b82f6',
                        width: 36,
                        height: 36
                      }}
                    >
                      <UsersIcon sx={{ fontSize: 18, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#3b82f6' : '#1e3a8a', fontWeight: 500 }}>
                        Abonnements totaux
                      </Typography>
                      <Typography variant="h4" sx={{ color: isDarkMode ? '#3b82f6' : '#1e3a8a', fontWeight: 700, lineHeight: 1.2 }}>
                        {formatNumber(statistics.total)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card 
                  sx={{ 
                    background: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  <Box sx={{ 
                    backgroundColor: isDarkMode ? 'transparent' : '#f0fdf4',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#10b981',
                        width: 36,
                        height: 36
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 18, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 500 }}>
                        Abonnements actifs
                      </Typography>
                      <Typography variant="h4" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 700, lineHeight: 1.2 }}>
                        {formatNumber(statistics.active)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Afficher uniquement les graphiques si showChartsOnly est true */}
          {!showCardsOnly && (
            <Box>
              {/* En-tête de la section */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: theme.palette.primary.main }} />
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}
                  >
                    {isMobile ? 'Stats' : 'Analyse Statistique'}
                  </Typography>
                </Box>
                {(period !== 'month' || Object.keys(filters).length > 0) && (
                  <Chip
                    label="Filtré"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Graphique d'évolution temporelle */}
                <Grid item xs={12} lg={8}>
                  <Paper
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, md: 3 },
                      background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Évolution des abonnements
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                      <LineChart data={statistics.daily_evolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="date" 
                          stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="new_subscriptions" 
                          stroke={theme.palette.primary.main} 
                          strokeWidth={2}
                          name="Nouveaux abonnés"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="active_subscriptions" 
                          stroke={theme.palette.success.main} 
                          strokeWidth={2}
                          name="Abonnés actifs"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Graphique circulaire des statuts */}
                <Grid item xs={12} lg={4}>
                  <Paper
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, md: 3 },
                      background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Répartition par statut
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                      <PieChart>
                        <Pie
                          data={statistics.status_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statistics.status_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.status[entry.name.toLowerCase()] || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Graphique des packs les plus populaires */}
                <Grid item xs={12} lg={6}>
                  <Paper
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, md: 3 },
                      background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Packs les plus populaires
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                      <BarChart data={statistics.top_packs}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="name" 
                          stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="count" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Graphique des statuts de paiement */}
                <Grid item xs={12} lg={6}>
                  <Paper
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, md: 3 },
                      background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Statuts de paiement
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                      <BarChart data={statistics.payment_status_distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="status" 
                          stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="count" fill={theme.palette.success.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            Aucune statistique disponible
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UserPacksStatistics;
