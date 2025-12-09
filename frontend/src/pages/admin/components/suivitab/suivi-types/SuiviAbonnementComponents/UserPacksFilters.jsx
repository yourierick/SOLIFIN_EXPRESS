import React, { useState, useEffect, forwardRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  Grid,
  Button,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

// Composant TextField avec forwardRef pour MUI X DatePicker
const CustomTextField = React.forwardRef((props, ref) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <TextField
      {...props}
      inputRef={ref}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: { xs: 1.5, md: 2 },
          bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            borderColor: theme.palette.primary.main,
          },
        },
      }}
    />
  );
});

CustomTextField.displayName = 'CustomTextField';

const UserPacksFilters = ({ filters, onFiltersChange, period }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);
  const [packs, setPacks] = useState([]);

  // Charger les packs actifs
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await axios.get('/api/admin/tableau-de-suivi/packs');
        setPacks(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des packs:', error);
      }
    };
    fetchPacks();
  }, []);

  // Gérer le changement des filtres
  const handleFilterChange = (field, value) => {
    // Créer une copie des filtres actuels
    const newFilters = { ...filters };
    
    // Si la valeur est vide, null ou undefined, supprimer le champ
    if (value === '' || value === null || value === undefined) {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    
    // Appeler la fonction de changement avec les nouveaux filtres
    onFiltersChange(newFilters);
  };

  // Fonction pour formater l'affichage des dates
  const formatDateDisplay = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return '';
  };

  // Réinitialiser tous les filtres
  const handleReset = () => {
    onFiltersChange({});
  };

  // Compter le nombre de filtres actifs
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      // Vérifier si la valeur est significative
      if (value === '' || value === null || value === undefined) {
        return false;
      }
      // Pour les dates, vérifier si c'est une date valide
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      // Pour les autres types, vérifier si ce n'est pas vide
      return true;
    }).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          mt: { xs:3, sm:3 },
          borderRadius: { xs: 2, md: 3 },
          bgcolor: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          boxShadow: 'none',
        }}
      >
        {/* Header des filtres */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            mb: expanded ? 2 : 0,
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                },
              }}
            >
              <FilterIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
            
            <Box>
              <Typography 
                variant="subtitle1" 
                fontWeight={600}
                sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
              >
                Filtres avancés
              </Typography>
              {hasActiveFilters && (
                <Typography variant="caption" color="primary">
                  {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasActiveFilters && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main' },
                }}
              >
                <ClearIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            )}
            
            {expanded ? (
              <ExpandLessIcon sx={{ color: 'text.secondary' }} />
            ) : (
              <ExpandMoreIcon sx={{ color: 'text.secondary' }} />
            )}
          </Box>
        </Box>

        {/* Contenu des filtres */}
        <Collapse in={expanded}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Recherche */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 0, sm: 1 } }}>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  🔍 Recherche
                </Typography>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  placeholder="Nom ou code parrain"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Pack */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 0, sm: 1 } }}>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  📦 Pack
                </Typography>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <Select
                    value={filters.pack_id || ''}
                    onChange={(e) => handleFilterChange('pack_id', e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tous les packs</em>
                    </MenuItem>
                    {packs.map((pack) => (
                      <MenuItem key={pack.id} value={pack.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {pack.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pack.categorie} • {pack.abonnement}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Statut */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 0, sm: 1 } }}>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  🏷️ Statut
                </Typography>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tous les statuts</em>
                    </MenuItem>
                    <MenuItem value="active">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                        Actif
                      </Box>
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        Inactif
                      </Box>
                    </MenuItem>
                    <MenuItem value="expired">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        Expiré
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Statut de paiement */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 0, sm: 1 } }}>
                <Typography 
                  variant="caption" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  💳 Paiement
                </Typography>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <Select
                    value={filters.payment_status || ''}
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                    displayEmpty
                    sx={{ 
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tous les paiements</em>
                    </MenuItem>
                    <MenuItem value="completed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                        Complété
                      </Box>
                    </MenuItem>
                    <MenuItem value="pending">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        En attente
                      </Box>
                    </MenuItem>
                    <MenuItem value="failed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        Échoué
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Date d'achat - conteneur groupé */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  📅 Période d'achat
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date de début"
                      value={filters.purchase_date_start || null}
                      onChange={(value) => handleFilterChange('purchase_date_start', value)}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{
                        textField: CustomTextField,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date de fin"
                      value={filters.purchase_date_end || null}
                      onChange={(value) => handleFilterChange('purchase_date_end', value)}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{
                        textField: CustomTextField,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Date d'expiration - conteneur groupé */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600} 
                  color="text.secondary"
                  sx={{ mb: 1.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  ⏰ Période d'expiration
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date de début"
                      value={filters.expiry_date_start || null}
                      onChange={(value) => handleFilterChange('expiry_date_start', value)}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{
                        textField: CustomTextField,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date de fin"
                      value={filters.expiry_date_end || null}
                      onChange={(value) => handleFilterChange('expiry_date_end', value)}
                      enableAccessibleFieldDOMStructure={false}
                      slots={{
                        textField: CustomTextField,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* Filtres actifs */}
          {hasActiveFilters && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Filtres actifs:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {filters.search && (
                  <Chip
                    label={`Recherche: ${filters.search}`}
                    onDelete={() => handleFilterChange('search', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.pack_id && (
                  <Chip
                    label={`Pack: ${packs.find(p => p.id === filters.pack_id)?.name || filters.pack_id}`}
                    onDelete={() => handleFilterChange('pack_id', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`Statut: ${filters.status}`}
                    onDelete={() => handleFilterChange('status', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.payment_status && (
                  <Chip
                    label={`Paiement: ${filters.payment_status}`}
                    onDelete={() => handleFilterChange('payment_status', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {(filters.purchase_date_start || filters.purchase_date_end) && (
                  <Chip
                    label={`Achat: ${filters.purchase_date_start ? formatDateDisplay(filters.purchase_date_start) : '...'} - ${filters.purchase_date_end ? formatDateDisplay(filters.purchase_date_end) : '...'}`}
                    onDelete={() => {
                      const newFilters = { ...filters };
                      delete newFilters.purchase_date_start;
                      delete newFilters.purchase_date_end;
                      onFiltersChange(newFilters);
                    }}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {(filters.expiry_date_start || filters.expiry_date_end) && (
                  <Chip
                    label={`Expiration: ${filters.expiry_date_start ? formatDateDisplay(filters.expiry_date_start) : '...'} - ${filters.expiry_date_end ? formatDateDisplay(filters.expiry_date_end) : '...'}`}
                    onDelete={() => {
                      const newFilters = { ...filters };
                      delete newFilters.expiry_date_start;
                      delete newFilters.expiry_date_end;
                      onFiltersChange(newFilters);
                    }}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
};

export default UserPacksFilters;
