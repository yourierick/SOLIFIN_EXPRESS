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
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  LocalActivity as TicketIcon,
  Schedule as ScheduleIcon,
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
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

const SuiviJetonsEsengoFilters = ({ filters, onFiltersChange, period }) => {
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
          background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
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
                Filtres des jetons
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

        {/* Contenu des filtres - Design moderne */}
        <Collapse in={expanded}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
              borderRadius: { xs: 2, md: 3 },
              p: { xs: 3, sm: 4 },
              mb: 3,
              boxShadow: isDarkMode 
                ? '0 10px 40px rgba(0, 0, 0, 0.3)' 
                : '0 10px 40px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.5s ease',
            }}
          >
            {/* Header des filtres */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', mr: 2 }}>
                  <TicketIcon sx={{ 
                    fontSize: { xs: 20, sm: 24 },
                    color: 'primary.main',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'rotate(12deg)' }
                  }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700}
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' 
                        : 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Filtres des jetons Esengo
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Affinez votre recherche
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 2, 
                  height: 2, 
                  bgcolor: 'success.main', 
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Actifs
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Recherche */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1
                    }}>
                      <Box sx={{ 
                        width: 2, 
                        height: 2, 
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }} />
                      Recherche
                    </Box>
                  </Typography>
                  <TextField
                    fullWidth
                    size={isMobile ? 'small' : 'medium'}
                    placeholder="Nom utilisateur ou code"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: 1.5, md: 2 },
                        bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        '&.Mui-focused': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* Pack */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1
                    }}>
                      <Box sx={{ 
                        width: 2, 
                        height: 2, 
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }} />
                      Pack
                    </Box>
                  </Typography>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <Select
                      value={filters.pack_id || ''}
                      onChange={(e) => handleFilterChange('pack_id', e.target.value)}
                      displayEmpty
                      sx={{ 
                        borderRadius: { xs: 1.5, md: 2 },
                        bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        '&.Mui-focused': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
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

              {/* Statut d'utilisation */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1
                    }}>
                      <Box sx={{ 
                        width: 2, 
                        height: 2, 
                        bgcolor: 'warning.main',
                        borderRadius: '50%',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }} />
                      Statut d'utilisation
                    </Box>
                  </Typography>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <Select
                      value={filters.is_used || ''}
                      onChange={(e) => handleFilterChange('is_used', e.target.value)}
                      displayEmpty
                      sx={{ 
                        borderRadius: { xs: 1.5, md: 2 },
                        bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        '&.Mui-focused': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Tous les statuts</em>
                      </MenuItem>
                      <MenuItem value="true">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                          Utilisé
                        </Box>
                      </MenuItem>
                      <MenuItem value="false">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                          Non utilisé
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Statut du jeton */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1
                    }}>
                      <Box sx={{ 
                        width: 2, 
                        height: 2, 
                        bgcolor: 'error.main',
                        borderRadius: '50%',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }} />
                      Statut du jeton
                    </Box>
                  </Typography>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      displayEmpty
                      sx={{ 
                        borderRadius: { xs: 1.5, md: 2 },
                        bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                        '&.Mui-focused': {
                          bgcolor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Tous les statuts</em>
                      </MenuItem>
                      <MenuItem value="valid">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusyIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          Valide
                        </Box>
                      </MenuItem>
                      <MenuItem value="expired">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          Expiré
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Périodes - conteneur groupé */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 2,
                      color: 'text.secondary',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      mr: 1
                    }}>
                      <CalendarIcon sx={{ 
                        fontSize: 16,
                        color: 'info.main',
                        mr: 1
                      }} />
                      Périodes
                    </Box>
                  </Typography>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                      {/* Période d'expiration */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: { xs: 2, sm: 0 } }}>
                          <Typography 
                            variant="caption" 
                            fontWeight={600} 
                            sx={{ 
                              mb: 1, 
                              display: 'block',
                              color: 'text.secondary',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            <Box sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              mr: 1
                            }}>
                              <Box sx={{ 
                                width: 2, 
                                height: 2, 
                                bgcolor: 'info.main',
                                borderRadius: '50%',
                                mr: 1,
                                animation: 'pulse 2s infinite'
                              }} />
                              Période d'expiration
                            </Box>
                          </Typography>
                          <Grid container spacing={{ xs: 2, sm: 2 }}>
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

                      {/* Période d'utilisation */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography 
                            variant="caption" 
                            fontWeight={600} 
                            sx={{ 
                              mb: 1, 
                              display: 'block',
                              color: 'text.secondary',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            <Box sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              mr: 1
                            }}>
                              <Box sx={{ 
                                width: 2, 
                                height: 2, 
                                bgcolor: 'warning.main',
                                borderRadius: '50%',
                                mr: 1,
                                animation: 'pulse 2s infinite'
                              }} />
                              Période d'utilisation
                            </Box>
                          </Typography>
                          <Grid container spacing={{ xs: 2, sm: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="Date de début"
                                value={filters.usage_date_start || null}
                                onChange={(value) => handleFilterChange('usage_date_start', value)}
                                enableAccessibleFieldDOMStructure={false}
                                slots={{
                                  textField: CustomTextField,
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <DatePicker
                                label="Date de fin"
                                value={filters.usage_date_end || null}
                                onChange={(value) => handleFilterChange('usage_date_end', value)}
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
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Boutons d'action modernes */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mt: 3,
              pt: 2,
              borderTop: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    width: 3, 
                    height: 3, 
                    bgcolor: 'success.main', 
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 3,
                    height: 3,
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Filtres actifs
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleReset}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    borderRadius: { xs: 1.5, md: 2 },
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%)' 
                      : 'linear-gradient(135deg, rgba(243, 244, 246, 0.9) 0%, rgba(229, 231, 235, 0.9) 100%)',
                    color: isDarkMode ? '#d1d5db' : '#4b5563',
                    border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, rgba(75, 85, 99, 0.9) 0%, rgba(107, 114, 128, 0.9) 100%)' 
                        : 'linear-gradient(135deg, rgba(229, 231, 235, 0.9) 0%, rgba(209, 213, 219, 0.9) 100%)',
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: isDarkMode 
                        ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
                        : '0 8px 25px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Réinitialiser
                </Button>
                <Button
                  onClick={() => setExpanded(false)}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    borderRadius: { xs: 1.5, md: 2 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: '#ffffff',
                    border: 'none',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
                    },
                  }}
                >
                  Appliquer les filtres
                </Button>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
};

export default SuiviJetonsEsengoFilters;
