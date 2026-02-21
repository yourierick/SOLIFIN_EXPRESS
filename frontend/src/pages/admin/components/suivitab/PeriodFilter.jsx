import React from 'react';
import {
  Box,
  Button,
  useTheme,
} from '@mui/material';

const PeriodFilter = ({ period, setPeriod }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const periods = [
    { key: 'day', label: 'Jour' },
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Année' },
    { key: 'all', label: 'Tout' },
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'inline-flex',
          borderRadius: 1.5,
          boxShadow: isDarkMode 
            ? '0 2px 4px rgba(0, 0, 0, 0.2)' 
            : '0 2px 4px rgba(0, 0, 0, 0.08)',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        }}
      >
        {periods.map((periodOption, index) => (
          <Button
            key={periodOption.key}
            onClick={() => setPeriod(periodOption.key)}
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: 0.75,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: index === 0 ? '6px 0 0 6px' : index === periods.length - 1 ? '0 6px 6px 0' : '0',
              transition: 'all 0.2s ease-in-out',
              backgroundColor: period === periodOption.key 
                ? theme.palette.primary.main 
                : 'transparent',
              color: period === periodOption.key 
                ? '#ffffff' 
                : isDarkMode ? '#9ca3af' : '#6b7280',
              border: 'none',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: period === periodOption.key 
                  ? theme.palette.primary.dark 
                  : isDarkMode ? '#374151' : '#f3f4f6',
                color: period === periodOption.key 
                  ? '#ffffff' 
                  : isDarkMode ? '#e5e7eb' : '#374151',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            {periodOption.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default PeriodFilter;
