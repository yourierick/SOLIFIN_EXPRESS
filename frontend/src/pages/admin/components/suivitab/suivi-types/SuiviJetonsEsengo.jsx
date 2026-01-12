import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  useTheme as useMuiTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Backdrop,
  Fade,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Person as UserIcon,
  LocalActivity as TicketIcon,
  Event as DateIcon,
  CheckCircle as UsedIcon,
  Cancel as ExpiredIcon,
  Schedule as PendingIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useTheme } from '../../../../../contexts/ThemeContext';
import PeriodFilter from '../PeriodFilter';
import SuiviJetonsEsengoFilters from './SuiviJetonComponents/SuiviJetonsEsengoFilters';
import SuiviTicketsGagnantsFilters from './SuiviJetonComponents/SuiviTicketsGagnantsFilters';
import SkeletonStatsCard from './SuiviJetonComponents/SkeletonStatsCard';
import ExportButtons from './SuiviJetonComponents/ExportButtons';

const SuiviJetonsEsengo = ({ period, setPeriod }) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // États pour les onglets
  const [activeTab, setActiveTab] = useState(0);
  
  // États pour les filtres
  const [filters, setFilters] = useState({});
  const [ticketsFilters, setTicketsFilters] = useState({});
  
  // États pour l'exportation
  const [allJetons, setAllJetons] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // États pour le chargement des statistiques
  const [jetonsStatsLoading, setJetonsStatsLoading] = useState(true);
  const [ticketsStatsLoading, setTicketsStatsLoading] = useState(true);
  
  // États pour les statistiques
  const [jetonsStats, setJetonsStats] = useState({
    attribues: 0,
    utilises: 0,
    non_utilises: 0,
    expires: 0,
  });
  
  const [ticketsStats, setTicketsStats] = useState({
    attribues: 0,
    consommes: 0,
    programmes: 0,
    expires: 0,
    non_consommes: 0,
  });
  
  // États pour la pagination et les données des jetons
  const [jetons, setJetons] = useState([]);
  const [jetonsLoading, setJetonsLoading] = useState(false);
  const [jetonsPage, setJetonsPage] = useState(0);
  const [jetonsRowsPerPage, setJetonsRowsPerPage] = useState(10);
  const [jetonsTotal, setJetonsTotal] = useState(0);
  
  // États pour la pagination et les données des tickets
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsPage, setTicketsPage] = useState(0);
  const [ticketsRowsPerPage, setTicketsRowsPerPage] = useState(10);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  
  // États pour le modal d'historique
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedJetonHistory, setSelectedJetonHistory] = useState([]);
  const [selectedJeton, setSelectedJeton] = useState(null);

  // Référence pour le dialog
  const dialogRef = useRef(null);

  // Charger les statistiques des jetons
  const fetchJetonsStats = async () => {
    setJetonsStatsLoading(true);
    try {
      const params = {
        period: period,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (filters.expiry_date_start) {
        params.expiry_date_start = new Date(filters.expiry_date_start).toISOString().split('T')[0];
      }
      if (filters.expiry_date_end) {
        params.expiry_date_end = new Date(filters.expiry_date_end).toISOString().split('T')[0];
      }
      if (filters.usage_date_start) {
        params.usage_date_start = new Date(filters.usage_date_start).toISOString().split('T')[0];
      }
      if (filters.usage_date_end) {
        params.usage_date_end = new Date(filters.usage_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/jetons-esengo/stats', { params });
      setJetonsStats(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des jetons:', error);
    } finally {
      setJetonsStatsLoading(false);
    }
  };

  // Charger les statistiques des tickets
  const fetchTicketsStats = async () => {
    setTicketsStatsLoading(true);
    try {
      const params = {
        period: period,
        ...Object.fromEntries(
          Object.entries(ticketsFilters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (ticketsFilters.expiry_date_start) {
        params.expiry_date_start = new Date(ticketsFilters.expiry_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.expiry_date_end) {
        params.expiry_date_end = new Date(ticketsFilters.expiry_date_end).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_start) {
        params.consumption_date_start = new Date(ticketsFilters.consumption_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_end) {
        params.consumption_date_end = new Date(ticketsFilters.consumption_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/tickets-gagnants/stats', { params });
      setTicketsStats(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des tickets:', error);
    } finally {
      setTicketsStatsLoading(false);
    }
  };

  // Charger les jetons
  const fetchJetons = async () => {
    setJetonsLoading(true);
    try {
      const params = {
        page: jetonsPage + 1,
        per_page: jetonsRowsPerPage,
        period: period,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (filters.expiry_date_start) {
        params.expiry_date_start = new Date(filters.expiry_date_start).toISOString().split('T')[0];
      }
      if (filters.expiry_date_end) {
        params.expiry_date_end = new Date(filters.expiry_date_end).toISOString().split('T')[0];
      }
      if (filters.usage_date_start) {
        params.usage_date_start = new Date(filters.usage_date_start).toISOString().split('T')[0];
      }
      if (filters.usage_date_end) {
        params.usage_date_end = new Date(filters.usage_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/jetons-esengo', { params });
      setJetons(response.data.data || []);
      setJetonsTotal(response.data.total || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des jetons:', error);
    } finally {
      setJetonsLoading(false);
    }
  };

  // Charger les tickets
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const params = {
        page: ticketsPage + 1,
        per_page: ticketsRowsPerPage,
        period: period,
        ...Object.fromEntries(
          Object.entries(ticketsFilters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (ticketsFilters.expiry_date_start) {
        params.expiry_date_start = new Date(ticketsFilters.expiry_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.expiry_date_end) {
        params.expiry_date_end = new Date(ticketsFilters.expiry_date_end).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_start) {
        params.consumption_date_start = new Date(ticketsFilters.consumption_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_end) {
        params.consumption_date_end = new Date(ticketsFilters.consumption_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/tickets-gagnants', { params });
      setTickets(response.data.data || []);
      setTicketsTotal(response.data.total || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  // Charger l'historique d'un jeton
  const fetchJetonHistory = async (jetonId) => {
    try {
      const response = await axios.get(`/api/admin/tableau-de-suivi/jetons-esengo/${jetonId}/history`);
      setSelectedJetonHistory(response.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      setSelectedJetonHistory([]);
    }
  };

  // Ouvrir le modal d'historique
  const handleOpenHistory = async (jeton) => {
    setSelectedJeton(jeton);
    await fetchJetonHistory(jeton.id);
    setHistoryModalOpen(true);
  };

  // Fermer le modal d'historique
  const handleCloseHistory = () => {
    setHistoryModalOpen(false);
    setSelectedJeton(null);
    setSelectedJetonHistory([]);
    
    // Nettoyer le focus et le restaurer sur l'élément précédent
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }, 50);
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtenir la couleur pour le statut du jeton
  const getJetonStatusColor = (jeton) => {
    if (jeton.is_used) return 'success';
    if (jeton.isExpired) return 'error';
    return 'warning';
  };

  // Obtenir le texte pour le statut du jeton
  const getJetonStatusText = (jeton) => {
    if (jeton.is_used) return 'Utilisé';
    if (jeton.isExpired) return 'Expiré';
    return 'Disponible';
  };

  // Obtenir la couleur pour le statut du ticket
  const getTicketStatusColor = (consomme) => {
    switch (consomme) {
      case 'consommé': return 'success';
      case 'programmé': return 'info';
      case 'expiré': return 'error';
      case 'non consommé': return 'warning';
      default: return 'default';
    }
  };

  // Effets
  useEffect(() => {
    fetchJetonsStats();
    fetchTicketsStats();
  }, [period, filters, ticketsFilters]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchJetons();
    }
  }, [jetonsPage, jetonsRowsPerPage, period, activeTab, filters]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchTickets();
    }
  }, [ticketsPage, ticketsRowsPerPage, period, activeTab, ticketsFilters]);

  // Gérer le changement de filtre
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setJetonsPage(0); // Réinitialiser la page lors du changement de filtres
  };

  // Gérer le changement de filtre pour les tickets
  const handleTicketsFiltersChange = (newFilters) => {
    setTicketsFilters(newFilters);
    setTicketsPage(0); // Réinitialiser la page lors du changement de filtres
  };

  // Charger toutes les données pour l'exportation
  const fetchAllJetonsForExport = async () => {
    try {
      const params = {
        period: period,
        export_all: true,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (filters.expiry_date_start) {
        params.expiry_date_start = new Date(filters.expiry_date_start).toISOString().split('T')[0];
      }
      if (filters.expiry_date_end) {
        params.expiry_date_end = new Date(filters.expiry_date_end).toISOString().split('T')[0];
      }
      if (filters.usage_date_start) {
        params.usage_date_start = new Date(filters.usage_date_start).toISOString().split('T')[0];
      }
      if (filters.usage_date_end) {
        params.usage_date_end = new Date(filters.usage_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/jetons-esengo/export', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les données des jetons:', error);
      return [];
    }
  };

  const fetchAllTicketsForExport = async () => {
    try {
      const params = {
        period: period,
        export_all: true,
        ...Object.fromEntries(
          Object.entries(ticketsFilters).filter(([_, value]) => value !== null && value !== '')
        )
      };
      
      // Formater les dates pour l'API
      if (ticketsFilters.expiry_date_start) {
        params.expiry_date_start = new Date(ticketsFilters.expiry_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.expiry_date_end) {
        params.expiry_date_end = new Date(ticketsFilters.expiry_date_end).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_start) {
        params.consumption_date_start = new Date(ticketsFilters.consumption_date_start).toISOString().split('T')[0];
      }
      if (ticketsFilters.consumption_date_end) {
        params.consumption_date_end = new Date(ticketsFilters.consumption_date_end).toISOString().split('T')[0];
      }
      
      const response = await axios.get('/api/admin/tableau-de-suivi/tickets-gagnants/export', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les données des tickets:', error);
      return [];
    }
  };

  // Fonctions d'exportation pour les jetons
  const exportJetonsFiltered = async () => {
    setExportLoading(true);
    try {
      const data = await fetchAllJetonsForExport();
      // Formater les données pour l'export Excel
      return data.map(jeton => ({
        'ID': jeton.id,
        'Code Unique': jeton.code_unique,
        'Utilisateur': jeton.user?.name || 'N/A',
        'Pack': jeton.pack?.name || `Pack ID: ${jeton.pack_id || 'N/A'}`,
        'Statut': jeton.is_used ? 'Utilisé' : (jeton.isExpired ? 'Expiré' : 'Disponible'),
        'Date d\'Expiration': jeton.date_expiration ? new Date(jeton.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
        'Date d\'Utilisation': jeton.date_utilisation ? new Date(jeton.date_utilisation).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Création': new Date(jeton.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export des jetons filtrés:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const exportJetonsCurrentPage = () => {
    // Transformer les données actuelles pour l'export
    return jetons.map(jeton => ({
      'ID': jeton.id,
      'Code Unique': jeton.code_unique,
      'Utilisateur': jeton.user?.name || 'N/A',
      'Pack': jeton.pack?.name || `Pack ID: ${jeton.pack_id || 'N/A'}`,
      'Statut': jeton.is_used ? 'Utilisé' : (jeton.isExpired ? 'Expiré' : 'Disponible'),
      'Date d\'Expiration': jeton.date_expiration ? new Date(jeton.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
      'Date d\'Utilisation': jeton.date_utilisation ? new Date(jeton.date_utilisation).toLocaleDateString('fr-FR') : 'N/A',
      'Date de Création': new Date(jeton.created_at).toLocaleDateString('fr-FR'),
    }));
  };

  const exportJetonsAll = async () => {
    setExportLoading(true);
    try {
      const params = {
        period: period,
        export_all: true
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/jetons-esengo/export', { params });
      // Formater les données pour l'export Excel
      return response.data.map(jeton => ({
        'ID': jeton.id,
        'Code Unique': jeton.code_unique,
        'Utilisateur': jeton.user?.name || 'N/A',
        'Pack': jeton.pack?.name || `Pack ID: ${jeton.pack_id || 'N/A'}`,
        'Statut': jeton.is_used ? 'Utilisé' : (jeton.isExpired ? 'Expiré' : 'Disponible'),
        'Date d\'Expiration': jeton.date_expiration ? new Date(jeton.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
        'Date d\'Utilisation': jeton.date_utilisation ? new Date(jeton.date_utilisation).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Création': new Date(jeton.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export de tous les jetons:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  // Fonctions d'exportation pour les tickets
  const exportTicketsFiltered = async () => {
    setExportLoading(true);
    try {
      const data = await fetchAllTicketsForExport();
      // Formater les données pour l'export Excel
      return data.map(ticket => ({
        'ID': ticket.id,
        'Code Jeton': ticket.code_jeton,
        'Code Vérification': ticket.code_verification,
        'Utilisateur': ticket.user?.name || 'N/A',
        'Cadeau': ticket.cadeau?.nom || 'N/A',
        'Statut': ticket.consomme,
        'Distributeur': ticket.admin?.name || 'N/A',
        'Date d\'Expiration': ticket.date_expiration ? new Date(ticket.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Consommation': ticket.date_consommation ? new Date(ticket.date_consommation).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Création': new Date(ticket.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export des tickets filtrés:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const exportTicketsCurrentPage = () => {
    return tickets.map(ticket => ({
      'ID': ticket.id,
      'Code Jeton': ticket.code_jeton,
      'Code Vérification': ticket.code_verification,
      'Utilisateur': ticket.user?.name || 'N/A',
      'Cadeau': ticket.cadeau?.nom || 'N/A',
      'Statut': ticket.consomme,
      'Distributeur': ticket.admin?.name || 'N/A',
      'Date d\'Expiration': ticket.date_expiration ? new Date(ticket.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
      'Date de Consommation': ticket.date_consommation ? new Date(ticket.date_consommation).toLocaleDateString('fr-FR') : 'N/A',
      'Date de Création': new Date(ticket.created_at).toLocaleDateString('fr-FR'),
    }));
  };

  const exportTicketsAll = async () => {
    setExportLoading(true);
    try {
      const params = {
        period: period,
        export_all: true
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/tickets-gagnants/export', { params });
      // Formater les données pour l'export Excel
      return response.data.map(ticket => ({
        'ID': ticket.id,
        'Code Jeton': ticket.code_jeton,
        'Code Vérification': ticket.code_verification,
        'Utilisateur': ticket.user?.name || 'N/A',
        'Cadeau': ticket.cadeau?.nom || 'N/A',
        'Statut': ticket.consomme,
        'Distributeur': ticket.admin?.name || 'N/A',
        'Date d\'Expiration': ticket.date_expiration ? new Date(ticket.date_expiration).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Consommation': ticket.date_consommation ? new Date(ticket.date_consommation).toLocaleDateString('fr-FR') : 'N/A',
        'Date de Création': new Date(ticket.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (error) {
      console.error('Erreur lors de l\'export de tous les tickets:', error);
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  // Gestion du focus pour le modal
  useEffect(() => {
    if (historyModalOpen && dialogRef.current) {
      // Forcer le focus sur le dialog après un court délai
      setTimeout(() => {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements?.length > 0) {
          focusableElements[0].focus();
        }
      }, 100);
    }
  }, [historyModalOpen]);

  // Composant pour les cartes de statistiques
  const StatsCard = ({ title, value, color, icon }) => (
    <Card 
      sx={{ 
        background: isDarkMode ? '#1f2937' : '#ffffff',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        height: 120,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
    >
      <Box sx={{ 
        backgroundColor: isDarkMode ? 'transparent' : `${color}15`,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: isDarkMode ? color : `${color}cc`, fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color: isDarkMode ? color : `${color}99`, fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: color,
            width: 36,
            height: 36
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 18, color: 'white' }})}
        </Avatar>
      </Box>
    </Card>
  );

  return (
    <Box>
      {/* Onglets */}
      <Paper
        sx={{
          mb: 3,
          background: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          <Tab icon={<TicketIcon />} label="Jetons Esengo" />
          <Tab icon={<TicketIcon />} label="Tickets Gagnants" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Filtres pour les jetons */}
          <SuiviJetonsEsengoFilters 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            period={period}
          />

          {/* Statistiques des jetons */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {jetonsStatsLoading ? (
              // Afficher les squelettes pendant le chargement
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SkeletonStatsCard />
                </Grid>
              </>
            ) : (
              // Afficher les vraies cartes une fois chargées
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Jetons attribués"
                    value={jetonsStats.attribues}
                    color="primary.main"
                    icon={<TicketIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Jetons utilisés"
                    value={jetonsStats.utilises}
                    color="success.main"
                    icon={<UsedIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Jetons non utilisés"
                    value={jetonsStats.non_utilises}
                    color="warning.main"
                    icon={<PendingIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Jetons expirés"
                    value={jetonsStats.expires}
                    color="error.main"
                    icon={<ExpiredIcon />}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Tableau des jetons */}
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, md: 3 },
              background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Liste des Jetons Esengo
              </Typography>
              <ExportButtons
                data={jetons}
                filteredData={jetons}
                currentPageData={exportJetonsCurrentPage()}
                fileName="jetons_esengo"
                isLoading={exportLoading}
                sheetName="Jetons Esengo"
                onExportFiltered={exportJetonsFiltered}
                onExportCurrentPage={exportJetonsCurrentPage}
                onExportAll={exportJetonsAll}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Code unique</TableCell>
                    <TableCell>Pack</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date d'expiration</TableCell>
                    <TableCell>Date d'utilisation</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jetonsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : jetons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          Aucun jeton trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jetons.map((jeton) => (
                      <TableRow key={jeton.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <UserIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {jeton.user?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {jeton.code_unique}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {jeton.pack?.name || `Pack ID: ${jeton.pack_id || 'N/A'}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getJetonStatusText(jeton)}
                            color={getJetonStatusColor(jeton)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(jeton.date_expiration)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(jeton.date_utilisation)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Voir l'historique">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenHistory(jeton)}
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                                '&:hover': {
                                  bgcolor: isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(0, 0, 0, 0.1)',
                                },
                              }}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={jetonsTotal}
              rowsPerPage={jetonsRowsPerPage}
              page={jetonsPage}
              onPageChange={(e, newPage) => setJetonsPage(newPage)}
              onRowsPerPageChange={(e) => {
                setJetonsRowsPerPage(parseInt(e.target.value, 10));
                setJetonsPage(0);
              }}
              sx={{ mt: 2 }}
            />
          </Paper>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Filtres pour les tickets */}
          <SuiviTicketsGagnantsFilters 
            filters={ticketsFilters}
            onFiltersChange={handleTicketsFiltersChange}
            period={period}
          />

          {/* Statistiques des tickets */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {ticketsStatsLoading ? (
              // Afficher les squelettes pendant le chargement
              <>
                <Grid item xs={12} sm={6} md={2.4}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <SkeletonStatsCard />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <SkeletonStatsCard />
                </Grid>
              </>
            ) : (
              // Afficher les vraies cartes une fois chargées
              <>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatsCard
                    title="Tickets attribués"
                    value={ticketsStats.attribues}
                    color="primary.main"
                    icon={<TicketIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatsCard
                    title="Tickets consommés"
                    value={ticketsStats.consommes}
                    color="success.main"
                    icon={<UsedIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatsCard
                    title="Tickets programmés"
                    value={ticketsStats.programmes}
                    color="info.main"
                    icon={<PendingIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatsCard
                    title="Tickets expirés"
                    value={ticketsStats.expires}
                    color="error.main"
                    icon={<ExpiredIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatsCard
                    title="Tickets non consommés"
                    value={ticketsStats.non_consommes}
                    color="warning.main"
                    icon={<PendingIcon />}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Tableau des tickets */}
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, md: 3 },
              background: isDarkMode ? '#1f2937' : 'rgba(249, 250, 251, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Liste des Tickets Gagnants
              </Typography>
              <ExportButtons
                data={tickets}
                filteredData={tickets}
                currentPageData={exportTicketsCurrentPage()}
                fileName="tickets_gagnants"
                isLoading={exportLoading}
                sheetName="Tickets Gagnants"
                onExportFiltered={exportTicketsFiltered}
                onExportCurrentPage={exportTicketsCurrentPage}
                onExportAll={exportTicketsAll}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Code du Jeton</TableCell>
                    <TableCell>Code de vérification</TableCell>
                    <TableCell>Cadeau</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date d'expiration</TableCell>
                    <TableCell>Date de consommation</TableCell>
                    <TableCell>Distributeur</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          Aucun ticket trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <UserIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {ticket.user?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {ticket.code_jeton}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {ticket.code_verification}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ticket.cadeau?.nom || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.consomme}
                            color={getTicketStatusColor(ticket.consomme)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(ticket.date_expiration)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(ticket.date_consommation)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ticket.admin?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={ticketsTotal}
              rowsPerPage={ticketsRowsPerPage}
              page={ticketsPage}
              onPageChange={(e, newPage) => setTicketsPage(newPage)}
              onRowsPerPageChange={(e) => {
                setTicketsRowsPerPage(parseInt(e.target.value, 10));
                setTicketsPage(0);
              }}
              sx={{ mt: 2 }}
            />
          </Paper>
        </Box>
      )}

      {/* Modal d'historique des jetons */}
      <Dialog
        ref={dialogRef}
        open={historyModalOpen}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
          },
        }}
        PaperProps={{
          sx: {
            background: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}`,
            borderRadius: 3,
          },
        }}
        aria-labelledby="history-dialog-title"
        aria-describedby="history-dialog-description"
      >
        <DialogTitle id="history-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Historique du jeton {selectedJeton?.code_unique}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseHistory} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent id="history-dialog-description" sx={{ p: 3 }}>
          {selectedJetonHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Aucun historique trouvé pour ce jeton
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Cadeau</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedJetonHistory.map((history) => (
                    <TableRow key={history.id} hover>
                      <TableCell>
                        <Chip
                          label={history.action_type}
                          color={
                            history.action_type === 'attribution' ? 'primary' :
                            history.action_type === 'utilisation' ? 'success' :
                            history.action_type === 'expiration' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.action_type === 'attribution' ? formatDate(history.created_at) : 
                          history.action_type === 'utilisation' ? formatDate(history.jeton.date_utilisation) : 
                          formatDate(history.jeton.date_expiration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.cadeau?.nom || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseHistory} variant="outlined">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuiviJetonsEsengo;
