import React, { useState } from 'react';
import SuiviAbonnementTabs from './SuiviAbonnementComponents/SuiviAbonnementTabs';

const SuiviAbonnementGestion = ({ period }) => {
  // États pour les filtres
  const [filters, setFilters] = useState({});

  // Gestionnaire des filtres
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <SuiviAbonnementTabs 
      period={period}
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  );
};

export default SuiviAbonnementGestion;
