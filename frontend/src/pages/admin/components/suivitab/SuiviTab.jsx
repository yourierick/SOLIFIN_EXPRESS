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

const SuiviTab = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [subscriptionView, setSubscriptionView] = useState('abonnement-gestion');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
            {/* Menu hamburger pour le suivi d'abonnement */}
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
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                },
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
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
                    gap: 2,
                    p: 1,
                    borderRadius: 2,
                    transition: 'background-color 0.3s ease',
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
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                      },
                      transition: 'all 0.3s ease',
                      '&:active': {
                        transform: 'scale(0.95)',
                      },
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                  
                  <Box>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      Menu de suivi
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choisissez une option
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                      border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    }}
                  >
                    {subscriptionView === 'abonnement-gestion' && <AccountIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />}
                    {subscriptionView === 'soldes-abonnes' && <WalletIcon sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />}
                    {subscriptionView === 'jetons-esengo' && <TokenIcon sx={{ fontSize: 16, mr: 1, color: 'warning.main' }} />}
                    {subscriptionView === 'retraits' && <WithdrawalIcon sx={{ fontSize: 16, mr: 1, color: 'error.main' }} />}
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ 
                        color: theme.palette.primary.main,
                      }}
                    >
                      {getCurrentLabel()}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      display: { xs: 'none', sm: 'block' },
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
                    borderRadius: 2,
                    minWidth: 320,
                    maxWidth: 400,
                    bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    mt: 1,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -8,
                      left: 24,
                      width: 16,
                      height: 16,
                      bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      transform: 'rotate(45deg)',
                      borderLeft: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                      borderTop: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              >
                <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}` }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                    Options de suivi
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sélectionnez le type de suivi à afficher
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
                        Suivi d'abonnement
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gestion complète des comptes et abonnements
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
                        Consultation et suivi des soldes utilisateurs
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
                        Suivi et validation des demandes de retrait
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
            {subscriptionView === 'abonnement-gestion' && <SuiviAbonnementGestion />}
            {subscriptionView === 'soldes-abonnes' && <SuiviSoldesAbonnes />}
            {subscriptionView === 'jetons-esengo' && <SuiviJetonsEsengo />}
            {subscriptionView === 'retraits' && <SuiviRetraits />}
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          fontWeight={700}
          sx={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Tableau de Suivi Administrateur
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gérez les abonnements et suivez les finances de la plateforme
        </Typography>
      </Box>

      <Paper
        sx={{
          borderRadius: 3,
          bgcolor: isDarkMode
            ? "rgba(31, 41, 55, 0.5)"
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
            bgcolor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
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
