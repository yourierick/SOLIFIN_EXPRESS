import React, { useState, useEffect, useCallback } from 'react';
import { 
  Snackbar, 
  Button, 
  Alert, 
  IconButton,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import serviceWorker from '../utils/serviceWorkerRegistration';

/**
 * ServiceWorkerUpdater - Version optimisée
 * Gère les mises à jour du service worker de manière non-intrusive
 * sans memory leaks et avec une expérience utilisateur améliorée
 */
const ServiceWorkerUpdater = () => {
  const [showReload, setShowReload] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissedUntil, setDismissedUntil] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Vérifier si une mise à jour a été ignorée temporairement
  const shouldShowUpdate = useCallback(() => {
    if (!updateInfo?.hasUpdate) return false;
    if (!dismissedUntil) return true;
    
    return Date.now() > dismissedUntil;
  }, [updateInfo, dismissedUntil]);

  // Gérer les événements de mise à jour du service worker
  useEffect(() => {
    const onUpdate = (event) => {
      const { detail } = event;
      if (detail?.hasUpdate) {
        setUpdateInfo(detail);
        
        // Ne pas montrer immédiatement si l'utilisateur vient de fermer
        const lastDismissed = localStorage.getItem('swUpdateDismissed');
        if (lastDismissed) {
          const dismissedTime = parseInt(lastDismissed);
          const timeSinceDismiss = Date.now() - dismissedTime;
          
          // Attendre au moins 10 minutes avant de réafficher
          if (timeSinceDismiss < 10 * 60 * 1000) {
            setDismissedUntil(dismissedTime + 10 * 60 * 1000);
            return;
          }
        }
        
        setShowReload(true);
      }
    };

    const onStatusChange = () => {
      // Vérifier le statut actuel du service worker
      serviceWorker.getStatus().then(status => {
        if (status.hasUpdate && !showReload) {
          setUpdateInfo({ hasUpdate: true, timestamp: Date.now() });
          setShowReload(true);
        }
      });
    };

    // Écouter les événements
    window.addEventListener('serviceWorkerUpdate', onUpdate);
    window.addEventListener('visibilitychange', onStatusChange);
    
    // Vérification initiale discrète
    const initialCheck = setTimeout(() => {
      serviceWorker.getStatus().then(status => {
        if (status.hasUpdate) {
          setUpdateInfo({ hasUpdate: true, timestamp: Date.now() });
          setShowReload(true);
        }
      });
    }, 5000); // 5 secondes après le chargement

    return () => {
      window.removeEventListener('serviceWorkerUpdate', onUpdate);
      window.removeEventListener('visibilitychange', onStatusChange);
      clearTimeout(initialCheck);
    };
  }, [showReload]);

  // Appliquer la mise à jour
  const handleUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      const updated = await serviceWorker.applyUpdate();
      
      if (updated) {
        // Afficher un message de mise à jour en cours
        setUpdateInfo(prev => ({ ...prev, updating: true }));
        
        // Recharger la page après un court délai pour permettre l'animation
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // L'utilisateur a annulé ou pas de mise à jour disponible
        setShowReload(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      // Afficher une erreur mais garder la notification
      setUpdateInfo(prev => ({ ...prev, error: true }));
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  // Ignorer temporairement
  const handleDismiss = useCallback((duration = 10 * 60 * 1000) => { // 10 minutes par défaut
    const dismissUntil = Date.now() + duration;
    setDismissedUntil(dismissUntil);
    setShowReload(false);
    localStorage.setItem('swUpdateDismissed', Date.now().toString());
    
    // Nettoyer après la durée
    setTimeout(() => {
      setDismissedUntil(null);
      localStorage.removeItem('swUpdateDismissed');
    }, duration);
  }, []);

  // Ignorer définitivement
  const handlePermaDismiss = useCallback(() => {
    setShowReload(false);
    localStorage.setItem('swUpdatePermaDismissed', 'true');
    
    // Réinitialiser après 24h
    setTimeout(() => {
      localStorage.removeItem('swUpdatePermaDismissed');
    }, 24 * 60 * 60 * 1000);
  }, []);

  // Ne pas afficher si déjà ignoré définitivement
  useEffect(() => {
    const permaDismissed = localStorage.getItem('swUpdatePermaDismissed');
    if (permaDismissed === 'true') {
      setShowReload(false);
    }
  }, []);

  // Ne pas afficher si on ne doit pas montrer la mise à jour
  if (!shouldShowUpdate()) {
    return null;
  }

  const getSeverity = () => {
    if (updateInfo?.error) return 'error';
    if (updateInfo?.updating) return 'success';
    if (updateInfo?.urgent) return 'warning';
    return 'info';
  };

  const getMessage = () => {
    if (updateInfo?.updating) return 'Mise à jour en cours...';
    if (updateInfo?.error) return 'Erreur lors de la mise à jour. Réessayez plus tard.';
    if (updateInfo?.urgent) return 'Mise à jour importante requise !';
    return 'Une nouvelle version est disponible !';
  };

  const getTimeAgo = () => {
    if (!updateInfo?.timestamp) return '';
    
    const minutes = Math.floor((Date.now() - updateInfo.timestamp) / 60000);
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  };

  return (
    <Snackbar
      open={showReload}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiSnackbar-root': {
          bottom: { xs: 16, sm: 24 }
        }
      }}
    >
      <Alert 
        severity={getSeverity()}
        variant="filled"
        sx={{
          width: '100%',
          maxWidth: { xs: '90vw', sm: '400px' },
          '& .MuiAlert-message': {
            flex: 1
          }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {!updateInfo?.updating && (
              <>
                <Button 
                  size="small" 
                  color="inherit"
                  onClick={() => handleDismiss(5 * 60 * 1000)} // 5 minutes
                  sx={{ 
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Plus tard
                </Button>
                <Button 
                  size="small" 
                  color="inherit"
                  onClick={handlePermaDismiss}
                  sx={{ 
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 1
                  }}
                >
                  Ignorer
                </Button>
              </>
            )}
            <Button 
              size="small" 
              color="inherit"
              onClick={handleUpdate}
              disabled={isUpdating}
              sx={{
                fontWeight: 600,
                minWidth: 'auto',
                px: 2
              }}
            >
              {isUpdating ? (
                <>
                  <RefreshIcon 
                    sx={{ 
                      fontSize: 16, 
                      mr: 1,
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} 
                  />
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshIcon sx={{ fontSize: 16, mr: 1 }} />
                  Mettre à jour
                </>
              )}
            </Button>
            {!updateInfo?.updating && (
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowReload(false)}
                sx={{ ml: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {getMessage()}
          </Typography>
          {updateInfo?.timestamp && !updateInfo?.updating && (
            <Chip
              label={getTimeAgo()}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ServiceWorkerUpdater;
