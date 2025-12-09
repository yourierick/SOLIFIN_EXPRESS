import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TableChart as TableIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import SuiviAbonnementTable from './SuiviAbonnementTable';
import UserPacksStatistics from './UserPacksStatistics';
import UserPacksFilters from './UserPacksFilters';

const SuiviAbonnementTabs = ({ period, filters, onFiltersChange }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Onglets de navigation */}
      <Box
        sx={{
          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 48, sm: 56 },
              px: { xs: 2, sm: 3 },
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)',
              },
            },
          }}
        >
          <Tab
            icon={<TableIcon sx={{ fontSize: { xs: 18, sm: 20 }, mr: { xs: 0, sm: 1 } }} />}
            label={isMobile ? '' : 'Tableau des abonnements'}
            iconPosition="start"
          />
          <Tab
            icon={<ChartIcon sx={{ fontSize: { xs: 18, sm: 20 }, mr: { xs: 0, sm: 1 } }} />}
            label={isMobile ? '' : 'Statistiques'}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <Box>
            {/* Cartes de statistiques dans l'onglet tableau - placées sous le titre */}
            <UserPacksStatistics 
              period={period}
              filters={filters}
              showCardsOnly={true}
            />
            
            {/* Tableau des abonnements */}
            <SuiviAbonnementTable 
              period={period}
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          </Box>
        )}
        {activeTab === 1 && (
          <UserPacksStatistics 
            period={period}
            filters={filters}
            showChartsOnly={true}
          />
        )}
      </Box>
    </Box>
  );
};

export default SuiviAbonnementTabs;
