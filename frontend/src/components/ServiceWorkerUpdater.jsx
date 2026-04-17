import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Fade,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import serviceWorker from '../utils/serviceWorkerRegistration';

/**
 * ServiceWorkerUpdater - Version subtile et non-intrusive
 * Affiche une petite notification discrète en bas à droite
 */
const ServiceWorkerUpdater = () => {
  const theme = useTheme();
  const [showReload, setShowReload] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Gérer les événements de mise à jour du service worker
  useEffect(() => {
    const onUpdate = (event) => {
      const { detail } = event;
      if (detail?.hasUpdate) {
        setUpdateInfo(detail);
        setShowReload(true);
      }
    };

    // Vérification initiale discrète
    const initialCheck = setTimeout(() => {
      serviceWorker.getStatus().then(status => {
        if (status.hasUpdate) {
          setUpdateInfo({ hasUpdate: true, timestamp: Date.now() });
          setShowReload(true);
        }
      });
    }, 10000); // 10 secondes après le chargement

    window.addEventListener('serviceWorkerUpdate', onUpdate);

    return () => {
      window.removeEventListener('serviceWorkerUpdate', onUpdate);
      clearTimeout(initialCheck);
    };
  }, []);

  // Appliquer la mise à jour
  const handleUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      const updated = await serviceWorker.applyUpdate();
      if (updated) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  // Ignorer temporairement
  const handleDismiss = useCallback(() => {
    setShowReload(false);
    
    // Réafficher après 30 minutes
    setTimeout(() => {
      if (updateInfo?.hasUpdate) {
        setShowReload(true);
      }
    }, 30 * 60 * 1000);
  }, [updateInfo]);

  if (!showReload || !updateInfo?.hasUpdate) {
    return null;
  }

  return (
    <Fade in={showReload} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(31, 41, 55, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '8px 12px',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 25px rgba(0, 0, 0, 0.5)'
              : '0 6px 25px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.75rem',
            color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#374151',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          Mise à jour disponible
        </Typography>

        <Tooltip title="Mettre à jour maintenant" placement="top">
          <IconButton
            size="small"
            onClick={handleUpdate}
            disabled={isUpdating}
            sx={{
              color: theme.palette.mode === 'dark' ? '#60a5fa' : '#3b82f6',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(96, 165, 250, 0.1)' 
                : 'rgba(59, 130, 246, 0.1)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(96, 165, 250, 0.2)' 
                  : 'rgba(59, 130, 246, 0.2)',
              },
              '&.Mui-disabled': {
                opacity: 0.6
              }
            }}
          >
            <RefreshIcon 
              sx={{ 
                fontSize: 16,
                animation: isUpdating ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
          </IconButton>
        </Tooltip>

        <Tooltip title="Plus tard" placement="top">
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(156, 163, 175, 0.1)' 
                  : 'rgba(107, 114, 128, 0.1)',
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Fade>
  );
};

export default ServiceWorkerUpdater;
