import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Pagination,
  InputAdornment,
  Tooltip,
  Avatar,
  LinearProgress,
  alpha,
  Menu,
} from "@mui/material";
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  BarChart as ChartBarIcon,
  Schedule as ClockIcon,
  AutoAwesome as SparklesIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import { useTheme } from "../../../../contexts/ThemeContext";
import axios from "axios";
import * as XLSX from 'xlsx';
import Alert from "../../../../components/Alert";

const GradeHistory = ({ period }) => {
  const { isDarkMode } = useTheme();
  
  // États
  const [histories, setHistories] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: 0,
    to: 0,
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    grade_id: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  // États pour l'export
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // État pour les alertes
  const [alert, setAlert] = useState({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  // État pour la visibilité des filtres
  const [showFilters, setShowFilters] = useState(false);

  // Charger les grades pour le filtre
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get("/api/admin/grades");
        if (response.data.success) {
          setGrades(response.data.grades);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des grades:", error);
      }
    };

    fetchGrades();
  }, []);

  // Charger l'historique des grades
  useEffect(() => {
    fetchGradeHistory();
  }, [pagination.current_page, filters, period]);

  const fetchGradeHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Ajouter la période
      if (period) {
        params.append('period', period);
      }
      
      // Ajouter les filtres non vides
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      params.append('page', pagination.current_page);
      params.append('per_page', pagination.per_page);

      const response = await axios.get(`/api/admin/grades/history?${params.toString()}`);
      if (response.data.success) {
        setHistories(response.data.data.histories);
        setPagination(response.data.data.pagination);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      // Afficher un message d'erreur mais ne pas bloquer l'affichage
      setHistories([]);
      setStatistics(null);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 })); // Réinitialiser à la première page
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({
      grade_id: "",
      start_date: "",
      end_date: "",
      search: "",
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  // Fonction d'export Excel
  const handleExport = async (exportType) => {
    try {
      let params = {
        period: period,
        export_type: exportType,
      };
      
      // Ajouter les filtres aux paramètres
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      
      // Pour l'export de la page actuelle, ajouter les infos de pagination
      if (exportType === 'current_page') {
        params.page = pagination.current_page;
        params.per_page = pagination.per_page;
      }
      
      const response = await axios.get('/api/admin/grades/history/export', {
        params: params
      });
      
      // Préparer les données pour Excel
      const headers = [
        'Date',
        'Utilisateur',
        'ID Compte',
        'Grade Niveau',
        'Grade Désignation'
      ];
      
      // Les données sont déjà formatées par le backend
      const rows = response.data.data;
      
      // Combiner les en-têtes et les données
      const finalData = [headers, ...rows];
      
      // Créer le workbook Excel avec XLSX
      const ws = XLSX.utils.aoa_to_sheet(finalData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Historique des Grades");
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 20 }, // Date
        { wch: 25 }, // Utilisateur
        { wch: 15 }, // ID Compte
        { wch: 15 }, // Grade Niveau
        { wch: 30 }, // Grade Désignation
      ];
      ws['!cols'] = colWidths;
      
      // Télécharger le fichier
      const filename = `historique-grades-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      // Afficher un message d'erreur à l'utilisateur
      showAlert('error', 'Erreur d\'export', 'Erreur lors de l\'export Excel. Veuillez réessayer.');
    }
  };

  // Gérer le menu d'export
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  // Fonctions d'export
  const handleExportFiltered = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('filtered');
    } catch (error) {
      console.error('Erreur lors de l\'export des données filtrées:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurrentPage = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('current_page');
    } catch (error) {
      console.error('Erreur lors de l\'export de la page actuelle:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    handleExportMenuClose();
    try {
      await handleExport('all');
    } catch (error) {
      console.error('Erreur lors de l\'export de toutes les données:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (niveau) => {
    const colors = [
      '#10b981', // Vert - Niveau 1
      '#3b82f6', // Bleu - Niveau 2
      '#8b5cf6', // Violet - Niveau 3
      '#f59e0b', // Orange - Niveau 4
      '#ef4444', // Rouge - Niveau 5
      '#fbbf24', // Jaune - Niveau 6
    ];
    return colors[niveau - 1] || '#6b7280';
  };

  // Fonction pour afficher une alerte
  const showAlert = (type, title, message) => {
    setAlert({
      show: true,
      type,
      title,
      message
    });
  };

  // Fonction pour fermer l'alerte
  const closeAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Alertes */}
      {alert.show && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          dismissible={true}
          onDismiss={closeAlert}
          sx={{ mb: 3 }}
        />
      )}
      {/* En-tête avec statistiques */}
      {statistics && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 3, 
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <SparklesIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
            Tableau de bord des grades
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ 
                  backgroundColor: isDarkMode ? 'transparent' : '#fefce8',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#f59e0b',
                      width: 36,
                      height: 36
                    }}
                  >
                    <StarIcon sx={{ fontSize: 18, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#d97706' : '#92400e', fontWeight: 500 }}>
                      Total attributions
                    </Typography>
                    <Typography variant="h4" sx={{ color: isDarkMode ? '#d97706' : '#78350f', fontWeight: 700, lineHeight: 1.2 }}>
                      {statistics.total_attributions}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ 
                  backgroundColor: isDarkMode ? 'transparent' : '#f0fdf4',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#059669',
                      width: 36,
                      height: 36
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 18, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#059669' : '#064e3b', fontWeight: 500 }}>
                      Aujourd'hui
                    </Typography>
                    <Typography variant="h4" sx={{ color: isDarkMode ? '#059669' : '#064e3b', fontWeight: 700, lineHeight: 1.2 }}>
                      {statistics.today_attributions}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ 
                  backgroundColor: isDarkMode ? 'transparent' : '#eff6ff',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#2563eb',
                      width: 36,
                      height: 36
                    }}
                  >
                    <UsersIcon sx={{ fontSize: 18, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#2563eb' : '#1e3a8a', fontWeight: 500 }}>
                      Moyenne/jour
                    </Typography>
                    <Typography variant="h4" sx={{ color: isDarkMode ? '#2563eb' : '#1e3a8a', fontWeight: 700, lineHeight: 1.2 }}>
                      {statistics.average_per_day}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ 
                  backgroundColor: isDarkMode ? 'transparent' : '#faf5ff',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1
                }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#7c3aed',
                      width: 36,
                      height: 36
                    }}
                  >
                    <ChartBarIcon sx={{ fontSize: 18, color: 'white' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#7c3aed' : '#5b21b6', fontWeight: 500 }}>
                      Le plus attribué
                    </Typography>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#7c3aed' : '#5b21b6', fontWeight: 700, lineHeight: 1.2 }}>
                      {statistics.most_attributed_grade ? (
                        <>
                          Niv. {statistics.most_attributed_grade.niveau}
                          <Typography variant="caption" sx={{ display: 'block', color: isDarkMode ? '#8b5cf6' : '#6d28d9' }}>
                            {statistics.most_attributed_grade.designation} ({statistics.most_attributed_grade.count} fois)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
                          </Typography>
                        </>
                      ) : (
                        <>
                          N/A
                          <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontSize: '0.75rem' }}>
                            {period === 'day' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année'}
                          </Typography>
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Filtres */}
      <Card 
        sx={{ 
          mb: 3, 
          background: isDarkMode ? '#1f2937' : '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                  width: 32,
                  height: 32
                }}
              >
                <SettingsIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#111827' }}>
                  Filtres de recherche
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Affinez votre recherche avec les critères ci-dessous
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                color: '#3b82f6',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
                }
              }}
            >
              {showFilters ? 'Masquer' : 'Afficher'} les filtres
            </Button>
          </Box>
          
          {showFilters && (
            <>
              <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Recherche (Nom ou ID)"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                    },
                    '&.Mui-focused': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                      boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  px: 1
                }}>Grade</InputLabel>
                <Select
                  value={filters.grade_id}
                  label="Grade"
                  onChange={(e) => handleFilterChange('grade_id', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                      },
                      '&.Mui-focused': {
                        backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                        boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
                      },
                    }
                  }}
                >
                  <MenuItem value="">Tous les grades</MenuItem>
                  {grades && grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: getGradeColor(grade.niveau) 
                          }} 
                        />
                        Niv. {grade.niveau} - {grade.designation}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date de début"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                    },
                    '&.Mui-focused': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                      boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date de fin"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                    },
                    '&.Mui-focused': {
                      backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                      boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
                    },
                  }
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={fetchGradeHistory}
              disabled={loading}
              startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }
              }}
            >
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              Appliquer les filtres
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                '&:hover': {
                  borderColor: '#3b82f6',
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)',
                }
              }}
            >
              Réinitialiser
            </Button>
          </Box>
            </>
          )}
        </CardContent>
      </Card>

      
      {/* Tableau d'historique */}
      <Card 
        sx={{ 
          background: isDarkMode ? '#1f2937' : '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  width: 32,
                  height: 32
                }}
              >
                <ClockIcon sx={{ fontSize: 16, color: '#10b981' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#111827' }}>
                  Historique des attributions
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  {pagination.total > 0 ? `${pagination.total} attribution${pagination.total > 1 ? 's' : ''} trouvée${pagination.total > 1 ? 's' : ''}` : 'Aucune attribution trouvée'}
                </Typography>
              </Box>
            </Box>

            <Button
              onClick={handleExportMenuOpen}
              disabled={isExporting}
              startIcon={isExporting ? <div className="animate-spin" /> : <ExportIcon />}
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                backgroundColor: '#3b82f6',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  color: '#6b7280',
                }
              }}
            >
              {isExporting ? 'Exportation...' : 'Exporter'}
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ mb: 2, color: '#3b82f6' }} />
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Chargement de l'historique...
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 0.8)'
                    }}>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        py: 2,
                        fontSize: '0.875rem'
                      }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        py: 2,
                        fontSize: '0.875rem'
                      }}>
                        Utilisateur
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        py: 2,
                        fontSize: '0.875rem'
                      }}>
                        Grade
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {histories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 8 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: isDarkMode ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.08)',
                                width: 48,
                                height: 48,
                                mb: 2,
                                mx: 'auto'
                              }}
                            >
                              <ClockIcon sx={{ width: 24, height: 24, color: '#9ca3af' }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                              Aucun historique trouvé
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                              Essayez de modifier vos filtres pour voir plus de résultats
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      histories.map((history, index) => (
                        <TableRow 
                          key={history.id} 
                          sx={{ 
                            '&:hover': {
                              background: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)',
                            },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#111827',
                            py: 2,
                            fontSize: '0.875rem'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                              {formatDate(history.created_at)}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#111827',
                            py: 2,
                            fontSize: '0.875rem'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.75rem',
                                  bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                  color: '#3b82f6'
                                }}
                              >
                                {history.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {history.user?.name || 'Utilisateur inconnu'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280', fontFamily: 'monospace' }}>
                                  ID: {history.user?.account_id || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#111827',
                            py: 2,
                            fontSize: '0.875rem'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip
                                label={`Niv. ${history.grade?.niveau || 'N/A'}`}
                                size="small"
                                sx={{
                                  backgroundColor: getGradeColor(history.grade?.niveau || 1) + '20',
                                  color: getGradeColor(history.grade?.niveau || 1),
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  borderRadius: 12,
                                }}
                              />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {history.grade?.designation || 'N/A'}
                                </Typography>
                                {history.grade?.niveau && (
                                  <Box sx={{ display: 'flex', mt: 0.5 }}>
                                    {[...Array(Math.min(history.grade.niveau, 5))].map((_, i) => (
                                      <StarIcon 
                                        key={i} 
                                        sx={{ 
                                          fontSize: 12, 
                                          color: getGradeColor(history.grade.niveau),
                                          marginRight: 0.5 
                                        }} 
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination améliorée */}
              {pagination.total > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 3,
                  pt: 2,
                  borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Affichage de {pagination.from} à {pagination.to} sur {pagination.total} résultats
                  </Typography>
                  <Pagination
                    count={pagination.last_page}
                    page={pagination.current_page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="small"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: isDarkMode ? '#ffffff' : '#111827',
                        borderRadius: 1,
                      },
                      '& .MuiPaginationItem-ellipsis': {
                        color: '#6b7280',
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      
      {/* Menu d'export */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={handleExportFiltered}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter les données filtrées
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter uniquement les résultats actuels
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={handleExportCurrentPage}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter la page actuelle
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter les données de cette page
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={handleExportAll}
          sx={{
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Exporter toutes les données
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter l'ensemble des données
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GradeHistory;
