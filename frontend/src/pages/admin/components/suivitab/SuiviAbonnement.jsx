import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme as useMuiTheme,
  Fade,
  Grow,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as TokenIcon,
  MoneyOff as WithdrawalIcon,
  CardMembership as SubscriptionIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useTheme } from "../../../../contexts/ThemeContext";

const SuiviAbonnement = ({ period, setPeriod }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    users: {
      active: 0,
      inactive: 0,
      trial: 0,
      total: 0,
    },
    wallets: {
      total_balance: 0,
      available_balance: 0,
      frozen_balance: 0,
      total_in: 0,
      total_out: 0,
    },
    jetons: {
      total_unused: 0,
      total_used: 0,
    },
    withdrawals: {
      pending: 0,
      processing: 0,
      rejected: 0,
      cancelled: 0,
      failed: 0,
      paid: 0,
      total: 0,
    },
    subscriptions: {
      active: 0,
      inactive: 0,
      expired: 0,
      total: 0,
    },
  });

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/tableau-de-suivi/suivi-abonnement?period=${period}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cartes de statistiques globales - Design Finances.jsx */}

      {/* Deuxième ligne : 4 autres cartes */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Statistique des utilisateurs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
              }
            }}
          >
            <Box sx={{ 
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
                <PeopleIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 500 }}>
                  Utilisateurs
                </Typography>
                <Typography variant="h4" sx={{ color: isDarkMode ? '#10b981' : '#064e3b', fontWeight: 700, lineHeight: 1.2 }}>
                  {statistics.users.total.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', lineHeight: 1.2 }}>
                  <Box component="span" sx={{ color: '#10b981', fontWeight: 400, display: 'block' }}>Actifs: {statistics.users.active.toLocaleString()}</Box>
                  <Box component="span" sx={{ color: '#f59e0b', fontWeight: 400, display: 'block' }}>Inactifs: {statistics.users.inactive.toLocaleString()}</Box>
                  <Box component="span" sx={{ color: '#6366f1', fontWeight: 400, display: 'block' }}>Essais: {statistics.users.trial.toLocaleString()}</Box>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Statistique des jetons */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
              }
            }}
          >
            <Box sx={{ 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#f59e0b',
                  width: 36,
                  height: 36
                }}
              >
                <TokenIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#f59e0b' : '#92400e', fontWeight: 500 }}>
                  Jetons Esengo
                </Typography>
                <Typography variant="h4" sx={{ color: isDarkMode ? '#f59e0b' : '#78350f', fontWeight: 700, lineHeight: 1.2 }}>
                  {(statistics.jetons.total_unused + statistics.jetons.total_used).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', lineHeight: 1.2 }}>
                  <Box component="span" sx={{ color: '#10b981', fontWeight: 400, display: 'block' }}>Disponibles: {statistics.jetons.total_unused.toLocaleString()}</Box>
                  <Box component="span" sx={{ color: '#f59e0b', fontWeight: 400, display: 'block' }}>Utilisés: {statistics.jetons.total_used.toLocaleString()}</Box>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Statistique des retraits */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
              }
            }}
          >
            <Box sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#ef4444',
                  width: 36,
                  height: 36
                }}
              >
                <WithdrawalIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ef4444' : '#991b1b', fontWeight: 500 }}>
                  Retraits en attente
                </Typography>
                <Typography variant="h4" sx={{ color: isDarkMode ? '#ef4444' : '#991b1b', fontWeight: 700, lineHeight: 1.2 }}>
                  {statistics.withdrawals.pending.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Statistique des abonnements */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
              }
            }}
          >
            <Box sx={{ 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#8b5cf6',
                  width: 36,
                  height: 36
                }}
              >
                <SubscriptionIcon sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#8b5cf6' : '#5b21b6', fontWeight: 500 }}>
                  Abonnements
                </Typography>
                <Typography variant="h4" sx={{ color: isDarkMode ? '#8b5cf6' : '#5b21b6', fontWeight: 700, lineHeight: 1.2 }}>
                  {statistics.subscriptions.total.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', lineHeight: 1.2 }}>
                  <Box component="span" sx={{ color: '#10b981', fontWeight: 400, display: 'block' }}>Actifs: {statistics.subscriptions.active.toLocaleString()}</Box>
                  <Box component="span" sx={{ color: '#f59e0b', fontWeight: 400, display: 'block' }}>Inactifs: {statistics.subscriptions.inactive.toLocaleString()}</Box>
                  <Box component="span" sx={{ color: '#ef4444', fontWeight: 400, display: 'block' }}>Expirés: {statistics.subscriptions.expired.toLocaleString()}</Box>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuiviAbonnement;
