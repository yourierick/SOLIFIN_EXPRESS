import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  alpha,
  Menu,
  MenuItem,
  Button,
  IconButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalance as AccountIcon,
  Wallet as WalletIcon,
  MonetizationOn as TokenIcon,
  MoneyOff as WithdrawalIcon,
} from '@mui/icons-material';
import {
  SuiviAbonnementGestion,
  SuiviSoldesAbonnes,
  SuiviJetonsEsengo,
  SuiviRetraits,
} from './suivi-types';
import SuiviAbonnement from './SuiviAbonnement';
import PeriodFilter from './PeriodFilter';
import { useCurrency } from "../../../../contexts/CurrencyContext";

const SuiviTab = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [subscriptionView, setSubscriptionView] = useState('abonnement-gestion');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [period, setPeriod] = useState('month');
  const { selectedCurrency, isCDFEnabled, toggleCurrency } = useCurrency();

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
        return 'Suivi d\'abonnement et gestion des comptes';
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
              selectedCurrency={selectedCurrency}
              isCDFEnabled={isCDFEnabled}
              toggleCurrency={toggleCurrency}
            />
            
            {/* Menu hamburger pour le suivi d'abonnement - responsive */}
            <Paper
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                mb: { xs: 2, sm: 3, md: 4 },
                borderRadius: { xs: 2, md: 3 },
                bgcolor: isDarkMode
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
                      color: theme.palette.primary.main,
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
                    {subscriptionView === 'abonnement-gestion' && <AccountIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'primary.main' }} />}
                    {subscriptionView === 'soldes-abonnes' && <WalletIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'success.main' }} />}
                    {subscriptionView === 'jetons-esengo' && <TokenIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'warning.main' }} />}
                    {subscriptionView === 'retraits' && <WithdrawalIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1, color: 'error.main' }} />}
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ 
                        color: theme.palette.primary.main,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isMobile ? getCurrentLabel().replace('Suivi ', '').replace('des ', '').replace('et gestion des comptes', '') : getCurrentLabel()}
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
                    bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.95)',
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
                      border: `1px solid ${theme.palette.primary.main}`,
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
                      border: `1px solid ${theme.palette.primary.main}`,
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
                      border: `1px solid ${theme.palette.primary.main}`,
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
                      border: `1px solid ${theme.palette.primary.main}`,
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
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Suivi financier
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contenu à implémenter
            </Typography>
          </Box>
        );
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
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
              lineHeight: { xs: 1.3, sm: 1.2 },
            }}
          >
            {isMobile ? 'Suivi Admin' : 'Tableau de Suivi Administrateur'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Gérez les abonnements et suivez les finances de la plateforme
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

      <Paper
        sx={{
          borderRadius: 3,
          bgcolor: isDarkMode
            ? "#1f2937"
            : "rgba(249, 250, 251, 0.8)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
            bgcolor: isDarkMode ? "#1f2937" : "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
            centered={false}
            sx={{
              minHeight: 64,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minHeight: 64,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                '&:hover': {
                  color: isDarkMode ? '#e5e7eb' : '#374151',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
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
          </Tabs>
        </Box>

        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: isDarkMode ? 'transparent' : 'transparent',
          }}
        >
          {renderContent()}
        </Box>
      </Paper>
    </Container>
  );
};

export default SuiviTab;
