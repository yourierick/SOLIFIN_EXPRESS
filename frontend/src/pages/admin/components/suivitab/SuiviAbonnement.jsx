import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as TokenIcon,
  MoneyOff as WithdrawalIcon,
  CardMembership as SubscriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';

const SuiviAbonnement = ({ period, setPeriod, selectedCurrency, isCDFEnabled, toggleCurrency }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    users: {
      active: 0,
      inactive: 0,
      trial: 0,
      total: 0,
    },
    wallets: {
      total_balance_usd: 0,
      total_balance_cdf: 0,
    },
    jetons: {
      total_unused: 0,
      total_used: 0,
    },
    withdrawals: {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      failed: 0,
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
  }, [period, selectedCurrency, isCDFEnabled]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/tableau-de-suivi/suivi-abonnement?period=${period}&currency=${selectedCurrency}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, currency = null) => {
    const displayCurrency = currency || selectedCurrency;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: displayCurrency === 'CDF' ? 'CDF' : 'USD',
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
      
      {/* Première ligne : Solde Total seul occupe toute la largeur */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
              "@keyframes gradient": {
                "0%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
                "100%": { backgroundPosition: "0% 50%" },
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Solde Total Des Comptes Utilisateurs
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>
                      Total Gagné: {formatAmount(
                        selectedCurrency === 'CDF' && isCDFEnabled 
                          ? statistics.wallets.total_earned_cdf 
                          : statistics.wallets.total_earned_usd, 
                        selectedCurrency
                      )}
                    </Box>
                    {' • '}
                    <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      Total Retiré: {formatAmount(
                        selectedCurrency === 'CDF' && isCDFEnabled 
                          ? statistics.wallets.total_withdrawn_cdf 
                          : statistics.wallets.total_withdrawn_usd, 
                        selectedCurrency
                      )}
                    </Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <WalletIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {formatAmount(
                  selectedCurrency === 'CDF' && isCDFEnabled 
                    ? statistics.wallets.total_balance_cdf 
                    : statistics.wallets.total_balance_usd, 
                  selectedCurrency
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Deuxième ligne : 4 autres cartes */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Statistique des utilisateurs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Utilisateurs
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>Actifs: {statistics.users.active.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600 }}>Inactifs: {statistics.users.inactive.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#6366f1', fontWeight: 600 }}>Essais: {statistics.users.trial.toLocaleString()}</Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <PeopleIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {statistics.users.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistique des jetons */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Jetons Esengo
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>Disponibles: {statistics.jetons.total_unused.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600 }}>Utilisés: {statistics.jetons.total_used.toLocaleString()}</Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <TokenIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {(statistics.jetons.total_unused + statistics.jetons.total_used).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistique des retraits */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Retraits
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>Approuvés: {statistics.withdrawals.approved.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600 }}>En attente: {statistics.withdrawals.pending.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#ef4444', fontWeight: 600 }}>Rejetés: {statistics.withdrawals.rejected.toLocaleString()}</Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <WithdrawalIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {statistics.withdrawals.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistique des abonnements */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 50%, #6366f1 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Abonnements
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>Actifs: {statistics.subscriptions.active.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#f59e0b', fontWeight: 600 }}>Inactifs: {statistics.subscriptions.inactive.toLocaleString()}</Box> • <Box component="span" sx={{ color: '#ef4444', fontWeight: 600 }}>Expirés: {statistics.subscriptions.expired.toLocaleString()}</Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <SubscriptionIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {statistics.subscriptions.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuiviAbonnement;
