import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  useTheme,
} from '@mui/material';

const SkeletonStatsCard = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.9))' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            {/* Squelette pour le nombre */}
            <Skeleton 
              variant="text" 
              sx={{ 
                fontSize: '2.5rem', 
                fontWeight: 600,
                mb: 1,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }} 
            />
            {/* Squelette pour le titre */}
            <Skeleton 
              variant="text" 
              sx={{ 
                fontSize: '0.875rem',
                width: '80%',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }} 
            />
          </Box>
          {/* Squelette pour l'icône */}
          <Skeleton 
            variant="circular" 
            width={48} 
            height={48}
            sx={{
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SkeletonStatsCard;
