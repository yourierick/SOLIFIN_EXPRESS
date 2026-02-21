import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  useTheme as useMuiTheme,
  useMediaQuery,
  alpha,
  Menu,
  MenuItem,
  Button,
  IconButton,
  Fade,
  Grow,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalance as AccountIcon,
  Wallet as WalletIcon,
  MonetizationOn as TokenIcon,
  MoneyOff as WithdrawalIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Lock as LockIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  SuiviAbonnementGestion,
  SuiviSoldesAbonnes,
  SuiviJetonsEsengo,
  SuiviRetraits,
} from './suivi-types';
import SuiviAbonnement from './SuiviAbonnement';
import SuiviFinancier from './SuiviFinancier';
import GradeHistory from './GradeHistory';
import PeriodFilter from './PeriodFilter';
import { useTheme } from "../../../../contexts/ThemeContext";
import axios from 'axios';

const SuiviTab = () => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [subscriptionView, setSubscriptionView] = useState('abonnement-gestion');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [period, setPeriod] = useState('all');

  // États pour les statistiques du solde
  const [walletStatistics, setWalletStatistics] = useState({
    wallets: {
      total_balance: 0,
      availableBalance: 0,
      frozenBalance: 0,
      total_in: 0,
      total_out: 0,
    }
  });
  const [walletLoading, setWalletLoading] = useState(false);

  // Fonction pour récupérer les statistiques du solde
  const fetchWalletStatistics = async () => {
    setWalletLoading(true);
    try {
      const response = await axios.get(`/api/admin/tableau-de-suivi/wallet-statistics`);
      setWalletStatistics(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du solde:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  // Effet pour charger les statistiques du solde quand la période change
  useEffect(() => {
    fetchWalletStatistics();
  }, [period]);

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' $';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (value) => {
    setSubscriptionView(value);
    handleMenuClose();
  };

  const getCurrentLabel = () => {
    switch (subscriptionView) {
      case 'abonnement-gestion':
        return 'Suivi d\'abonnement';
      case 'soldes-abonnes':
        return 'Suivi des soldes abonnés';
      case 'jetons-esengo':
        return 'Suivi des jetons esengo';
      case 'retraits':
        return 'Suivi des retraits';
      default:
        return 'Sélectionner une option';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            {/* Statistiques globales en haut */}
            <SuiviAbonnement
              period={period} 
              setPeriod={setPeriod} 
            />
            
            {/* Menu hamburger pour le suivi d'abonnement - responsive */}
            <Paper
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                mb: { xs: 2, sm: 3, md: 4 },
                borderRadius: { xs: 2, md: 3 },
                background: isDarkMode ? "#1f2937" : "rgba(219, 237, 255, 0.8)",
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
                      {isMobile ? 'Menu suivi' : 'Menu de suivi détaillé'}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: { xs: 'none', sm: 'block' },
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      Accédez aux fonctionnalités spécifiques
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'space-between', sm: 'flex-start' }
                }}
                >
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
                    {subscriptionView === 'abonnement-gestion' && <AccountIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'primary.main' }} />}
                    {subscriptionView === 'soldes-abonnes' && <WalletIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'success.main' }} />}
                    {subscriptionView === 'jetons-esengo' && <TokenIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'warning.main' }} />}
                    {subscriptionView === 'retraits' && <WithdrawalIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'error.main' }} />}
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
                      {isMobile ? getCurrentLabel().replace('et gestion des comptes', '') : getCurrentLabel()}
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
                      bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.95)',
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
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    color="text.primary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Options de suivi détaillé
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: { xs: 'none', sm: 'block' } }}
                  >
                    Sélectionnez une vue pour afficher les détails
                  </Typography>
                </Box>
                
                <MenuItem
                  onClick={() => handleMenuItemClick('abonnement-gestion')}
                  selected={subscriptionView === 'abonnement-gestion'}
                  sx={{
                    py: 2,
                    px: 2,
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${muiTheme.palette.primary.main}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}>
                      <AccountIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Gestion des abonnements
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tableaux détaillés des comptes et abonnements
                      </Typography>
                    </Box>
                    {subscriptionView === 'abonnement-gestion' && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main' 
                      }} />
                    )}
                  </Box>
                </MenuItem>

                <MenuItem
                  onClick={() => handleMenuItemClick('soldes-abonnes')}
                  selected={subscriptionView === 'soldes-abonnes'}
                  sx={{
                    py: 2,
                    px: 2,
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${muiTheme.palette.primary.main}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      color: 'white',
                    }}>
                      <WalletIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Soldes abonnés
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Consultation et gestion des soldes utilisateurs
                      </Typography>
                    </Box>
                    {subscriptionView === 'soldes-abonnes' && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} />
                    )}
                  </Box>
                </MenuItem>

                <MenuItem
                  onClick={() => handleMenuItemClick('jetons-esengo')}
                  selected={subscriptionView === 'jetons-esengo'}
                  sx={{
                    py: 2,
                    px: 2,
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${muiTheme.palette.primary.main}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'warning.main',
                      color: 'white',
                    }}>
                      <TokenIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Jetons Esengo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gestion et suivi des jetons virtuels
                      </Typography>
                    </Box>
                    {subscriptionView === 'jetons-esengo' && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'warning.main' 
                      }} />
                    )}
                  </Box>
                </MenuItem>

                <MenuItem
                  onClick={() => handleMenuItemClick('retraits')}
                  selected={subscriptionView === 'retraits'}
                  sx={{
                    py: 2,
                    px: 2,
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${muiTheme.palette.primary.main}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'white',
                    }}>
                      <WithdrawalIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Retraits
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Validation et suivi des demandes de retrait
                      </Typography>
                    </Box>
                    {subscriptionView === 'retraits' && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'error.main' 
                      }} />
                    )}
                  </Box>
                </MenuItem>
              </Menu>
            </Paper>

            {/* Contenu dynamique selon la sélection */}
            {subscriptionView === 'abonnement-gestion' && <SuiviAbonnementGestion period={period} />}
            {subscriptionView === 'soldes-abonnes' && <SuiviSoldesAbonnes period={period} />}
            {subscriptionView === 'jetons-esengo' && <SuiviJetonsEsengo period={period} setPeriod={setPeriod} />}
            {subscriptionView === 'retraits' && <SuiviRetraits period={period} />}
          </Box>
        );
      case 1:
        return <SuiviFinancier period={period} />;
      case 2:
        return <GradeHistory period={period} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ 
        mb: { xs: 2, sm: 3, md: 4 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'flex-start' },
        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
        gap: { xs: 2, sm: 2, md: 0 }
      }}>
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            fontWeight={700}
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
              lineHeight: { xs: 1.3, sm: 1.2 },
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -2,
                left: 0,
                width: 60,
                height: 3,
                background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                borderRadius: 2,
              }
            }}
          >
            Tableau de Suivi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip 
              icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
              label="Temps réel" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: 24,
                '& .MuiChip-label': { fontWeight: 500 }
              }}
            />
            <Chip 
              icon={<AssessmentIcon sx={{ fontSize: 14 }} />}
              label="Analytics" 
              size="small" 
              color="secondary" 
              variant="outlined"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: 24,
                '& .MuiChip-label': { fontWeight: 500 }
              }}
            />
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              opacity: 0.8,
              fontWeight: 400
            }}
          >
            Suivi complet des abonnements, finances et performances des utilisateurs
          </Typography>
        </Box>
        
        {/* PeriodFilter global - responsive */}
        <Box sx={{ 
          width: { xs: '100%', sm: 'auto', md: 'auto' },
          display: 'flex',
          justifyContent: { xs: 'flex-end', sm: 'flex-end', md: 'flex-end' }
        }}>
          <PeriodFilter period={period} setPeriod={setPeriod} />
        </Box>
      </Box>

      {/* Cartes des soldes globaux */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              transition: 'all 0.3s ease',
              height: { xs: 100, sm: 110, md: 120 },
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
                    Solde Total
                  </Typography>
                  <Chip 
                    icon={<TrendingUpIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                    label="Live" 
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
                  {formatAmount(walletStatistics?.total_balance || 0)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: '#6b7280', 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
                  lineHeight: 1.2 
                }}>
                  <Box component="span" sx={{ 
                    color: '#03a703ff', 
                    fontWeight: 600, 
                    display: 'block' 
                  }}>
                    Entrée: {formatAmount(walletStatistics?.total_in || 0)}
                  </Box>
                  <Box component="span" sx={{ 
                    color: '#f16046ff', 
                    fontWeight: 400, 
                    display: 'block' 
                  }}>
                    Retiré: {formatAmount(walletStatistics?.total_out || 0)}
                  </Box>
                </Typography>
              </Box>
              {walletLoading && (
                <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              transition: 'all 0.3s ease',
              height: { xs: 100, sm: 110, md: 120 },
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
                <AccountBalanceWalletIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#d1d5db' : '#4b5563', 
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    Solde Disponible
                  </Typography>
                  <Chip 
                    icon={<CheckIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                    label="Actif" 
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
                  {formatAmount(walletStatistics?.availableBalance || 0)}
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
                    Fonds utilisables
                  </Box>
                  <Box component="span" sx={{ 
                    color: isDarkMode ? '#9ca3af' : '#6b7280', 
                    fontWeight: 400, 
                    display: 'block' 
                  }}>
                    Non gelés
                  </Box>
                </Typography>
              </Box>
              {walletLoading && (
                <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              transition: 'all 0.3s ease',
              height: { xs: 100, sm: 110, md: 120 },
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
                <LockIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 1 } }}>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#d1d5db' : '#4b5563', 
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}>
                    Solde Gelé
                  </Typography>
                  <Chip 
                    icon={<LockIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                    label="Bloqué" 
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
                  {formatAmount(walletStatistics?.frozenBalance || 0)}
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
                    Fonds bloqués
                  </Box>
                  <Box component="span" sx={{ 
                    color: isDarkMode ? '#9ca3af' : '#6b7280', 
                    fontWeight: 400, 
                    display: 'block' 
                  }}>
                    En attente de déblocage
                  </Box>
                </Typography>
              </Box>
              {walletLoading && (
                <CircularProgress size={18} sx={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        sx={{
          borderRadius: 3,
          bgcolor: isDarkMode
            ? "#1f2937"
            : "rgba(249, 250, 251, 0.8)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          boxShadow: isDarkMode 
            ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
            : "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: isDarkMode 
              ? "0 8px 30px rgba(0, 0, 0, 0.4)" 
              : "0 8px 30px rgba(0, 0, 0, 0.12)",
          }
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
            bgcolor: isDarkMode ? "#1f2937" : "rgba(255, 255, 255, 0.95)",
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: isDarkMode 
                ? 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
                : 'linear-gradient(90deg, transparent, #2563eb, transparent)',
              opacity: 0.3,
            }
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            scrollButtons={false}
            allowScrollButtonsMobile={false}
            centered={false}
            sx={{
              minHeight: 64,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minHeight: 64,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                flex: 1,
                maxWidth: 'none',
                '&:hover': {
                  color: isDarkMode ? '#e5e7eb' : '#374151',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateY(-1px)',
                },
                '&.Mui-selected': {
                  color: muiTheme.palette.primary.main,
                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                  transform: 'translateY(-1px)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                    borderRadius: '3px 3px 0 0',
                  }
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                display: 'none',
              },
            }}
          >
            <Tab
              label="Suivi d'abonnement"
              iconPosition="start"
              sx={{
                px: { xs: 2, sm: 3 },
              }}
            />
            <Tab
              label="Suivi financier"
              iconPosition="start"
              sx={{
                px: { xs: 2, sm: 3 },
              }}
            />
            <Tab
              label="Suivi des grades"
              iconPosition="start"
              sx={{
                px: { xs: 2, sm: 3 },
              }}
            />
          </Tabs>
        </Box>

        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            background: isDarkMode ? "#171f2b" : "transparent",
            minHeight: 400,
            position: 'relative',
          }}
        >
          <Fade in={true} timeout={300}>
            <Box>
              {renderContent()}
            </Box>
          </Fade>
        </Box>
      </Paper>
    </Container>
  );
};

export default SuiviTab;
