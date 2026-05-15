import React, { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import useDashboardCounters from "../../../hooks/useDashboardCounters";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "../../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Alert,
  TablePagination,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Backdrop,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from "../../../components/ConfirmationModal";

const ReportManagement = () => {
  const { isDarkMode } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    publication_type: "",
    reason: "",
    search: "",
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les modaux de confirmation
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: null,
    confirmButtonText: 'Confirmer'
  });

  // État pour le modal d'action multifonction
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedActions, setSelectedActions] = useState({
    suspendaccount: false,
    suspendpublicationright: false,
    retirepublication: false,
    ignorereport: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les signalements
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page,
        per_page: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      const response = await axios.get(`/api/admin/reports?${params}`);
      
      setReports(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (err) {
      console.error("Erreur lors du chargement des signalements:", err);
      setError("Une erreur est survenue lors du chargement des signalements");
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const fetchStatistics = async () => {
    try {
      const response = await axios.get("/api/admin/reports/statistics");
      setStatistics(response.data.data);
      setStatsModalOpen(true);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError("Une erreur est survenue lors du chargement des statistiques");
    }
  };

  // Supprimer un signalement
  const handleDelete = (id) => {
    openConfirmationModal(
      'danger',
      'Supprimer le signalement',
      'Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible.',
      async () => {
        try {
          await axios.delete(`/api/admin/reports/${id}`);
          fetchReports();
          closeConfirmationModal();
        } catch (error) {
          console.error("Error deleting report:", error);
        }
      },
      'Supprimer'
    );
  };

  // Gérer l'ouverture du modal d'action
  const handleAction = () => {
    setSelectedActions({
      suspendaccount: false,
      suspendpublicationright: false,
      retirepublication: false,
      ignorereport: false
    });
    setActionModalOpen(true);
  };

  // Gérer le changement des cases à cocher
  const handleActionChange = (action) => {
    setSelectedActions(prev => {
      const newActions = { ...prev, [action]: !prev[action] };
      
      // Si "ignorer le signalement" est sélectionné, décocher toutes les autres actions
      if (action === 'ignorereport' && newActions.ignorereport) {
        return {
          ignorereport: true,
          suspendaccount: false,
          suspendpublicationright: false,
          retirepublication: false
        };
      }
      
      // Si une autre action est sélectionnée et "ignorer le signalement" était coché, le décocher
      if (action !== 'ignorereport' && newActions[action] && prev.ignorereport) {
        return {
          ...newActions,
          ignorereport: false
        };
      }
      
      return newActions;
    });
  };

  // Exécuter les actions sélectionnées
  const executeActions = async () => {
    if (!selectedReport?.id) return;

    // Vérifier qu'au moins une action est sélectionnée
    const hasSelectedAction = Object.values(selectedActions).some(value => value === true);
    if (!hasSelectedAction) {
      alert('Veuillez sélectionner au moins une action à effectuer.');
      return;
    }

    // Préparer les actions à envoyer
    const actionsToSend = {};
    Object.keys(selectedActions).forEach(key => {
      if (selectedActions[key]) {
        actionsToSend[key] = true;
      }
    });

    try {
      setIsSubmitting(true);
      const response = await axios.post(`/api/admin/reports/${selectedReport.id}/handle-report`, {
        action: actionsToSend
      });
      setActionModalOpen(false);
      setDetailsModalOpen(false);
      fetchReports();
      if (response.data.success) {
        setSuccess(response.data.message)
      }
    } catch (error) {
      console.error("Error executing actions:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voir les détails
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsModalOpen(true);
  };

  // Fonction helper pour ouvrir les modaux de confirmation
  const openConfirmationModal = (type, title, message, onConfirm, confirmButtonText = 'Confirmer') => {
    setConfirmationModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmButtonText
    });
  };

  // Fermer le modal de confirmation
  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: 'danger',
      title: '',
      message: '',
      onConfirm: null,
      confirmButtonText: 'Confirmer'
    });
  };

  const setSuccess = (message) => {
    toast.success(message);
    console.log(message);
  };

  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value,
    });
    setPage(1);
  };

  // Couleurs de statut
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "reviewed":
        return "success";
      case "Ignored":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "reviewed":
        return "Traité";
      case "ignored":
        return "Ignoré";
      default:
        return status;
    }
  };

  const getPublicationTypeLabel = (type) => {
    switch (type) {
      case "post":
        return "Publication";
      case "Publicité":
        return "Publicité";
      case "Formation":
        return "Formation";
      case "Offre d'emploi":
        return "Offre d'emploi";
      case "Opportunité d'affaire":
        return "Opportunité d'affaire";
      case "Produit numérique":
        return "Produit numérique";
      default:
        return type;
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case "inappropriate_content":
        return "Contenu inapproprié";
      case "harassment":
        return "Harcèlement";
      case "scam":
        return "Escroquerie";
      case "spam":
        return "Spam ou contenu commercial";
      case "false_information":
        return "Fausses informations";
      case "hate_speech":
        return "Discours haineux";
      case "violence":
        return "Violence ou contenu choquant";
      case "intellectual_property":
        return "Violation de propriété intellectuelle";
      case "other":
        return "Autre raison";
      default:
        return reason;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, filters]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion des Signalements
        </Typography>
      </div>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Actions principales */}
      <Box className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<ExclamationTriangleIcon />}
            size="small"
            className="flex items-center gap-2"
          >
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={fetchStatistics}
            startIcon={<ExclamationTriangleIcon />}
            size="small"
            className="flex items-center gap-2"
          >
            Statistiques
          </Button>
        </div>
        
        {/* Indicateurs de filtres actifs */}
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Chip
              label={`Statut: ${getStatusLabel(filters.status)}`}
              size="small"
              color="primary"
              onDelete={() => handleFilterChange("status")({ target: { value: "" } })}
              className="text-xs"
            />
          )}
          {filters.publication_type && (
            <Chip
              label={`Type: ${getPublicationTypeLabel(filters.publication_type)}`}
              size="small"
              color="primary"
              onDelete={() => handleFilterChange("publication_type")({ target: { value: "" } })}
              className="text-xs"
            />
          )}
          {filters.reason && (
            <Chip
              label={`Raison: ${getReasonLabel(filters.reason)}`}
              size="small"
              color="primary"
              onDelete={() => handleFilterChange("reason")({ target: { value: "" } })}
              className="text-xs"
            />
          )}
          {filters.search && (
            <Chip
              label={`Recherche: ${filters.search}`}
              size="small"
              color="primary"
              onDelete={() => handleFilterChange("search")({ target: { value: "" } })}
              className="text-xs"
            />
          )}
        </div>
      </Box>

      {/* Filtres déroulants */}
      {showFilters && (
        <Box className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Statut
              </label>
              <FormControl size="small" fullWidth>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange("status")}
                  displayEmpty
                  className="bg-white dark:bg-gray-700"
                >
                  <MenuItem value="">Tous les statuts</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="reviewed">Traité</MenuItem>
                  <MenuItem value="ignored">Ignoré</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Type de publication
              </label>
              <FormControl size="small" fullWidth>
                <Select
                  value={filters.publication_type}
                  onChange={handleFilterChange("publication_type")}
                  displayEmpty
                  className="bg-white dark:bg-gray-700"
                >
                  <MenuItem value="">Tous les types</MenuItem>
                  <MenuItem value="post">Publication</MenuItem>
                  <MenuItem value="Publicité">Publicité</MenuItem>
                  <MenuItem value="Formation">Formation</MenuItem>
                  <MenuItem value="Offre d'emploi">Offre d'emploi</MenuItem>
                  <MenuItem value="Opportunité d'affaire">Opportunité d'affaire</MenuItem>
                  <MenuItem value="Produit numérique">Produit numérique</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Raison
              </label>
              <FormControl size="small" fullWidth>
                <Select
                  value={filters.reason}
                  onChange={handleFilterChange("reason")}
                  displayEmpty
                  className="bg-white dark:bg-gray-700"
                >
                  <MenuItem value="">Toutes les raisons</MenuItem>
                  <MenuItem value="inappropriate_content">Contenu inapproprié</MenuItem>
                  <MenuItem value="harassment">Harcèlement</MenuItem>
                  <MenuItem value="scam">Escroquerie</MenuItem>
                  <MenuItem value="spam">Spam ou contenu commercial</MenuItem>
                  <MenuItem value="false_information">Fausses informations</MenuItem>
                  <MenuItem value="hate_speech">Discours haineux</MenuItem>
                  <MenuItem value="violence">Violence ou contenu choquant</MenuItem>
                  <MenuItem value="intellectual_property">Violation de propriété intellectuelle</MenuItem>
                  <MenuItem value="other">Autre raison</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Recherche
              </label>
              <TextField
                size="small"
                fullWidth
                value={filters.search}
                onChange={handleFilterChange("search")}
                placeholder="Nom, email, description..."
                className="bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Actions rapides des filtres */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2">
            <Button
              variant="text"
              color="primary"
              onClick={() => setFilters({ status: "", publication_type: "", reason: "", search: "" })}
              size="small"
              className="text-xs"
            >
              Réinitialiser tous les filtres
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-auto">
              {total} résultat{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
            </div>
          </div>
        </Box>
      )}

      {/* Tableau des signalements */}
      <TableContainer 
        className="mb-4"
        component={Paper}
        sx={{
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
          boxShadow: isDarkMode 
            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
        >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Signaleur</TableCell>
              <TableCell>Signalé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Raison</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Aucun signalement trouvé
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <img
                        src={report.reporter?.picture_url}
                        alt={report.reporter?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{report.reporter?.name}</div>
                        <div className="text-sm text-gray-500">{report.reporter?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <img
                        src={report.reported_user?.picture_url}
                        alt={report.reported_user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{report.reported_user?.name}</div>
                        <div className="text-sm text-gray-500">{report.reported_user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPublicationTypeLabel(report.publication_type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getReasonLabel(report.reason)}
                      size="small"
                      color={getStatusColor(report.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(report.status)}
                      size="small"
                      color={getStatusColor(report.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Tooltip title="Voir les détails">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(report)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(report.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
        }
      />

      {/* Modal des détails */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }
        }}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            boxShadow: isDarkMode 
              ? '0 10px 40px rgba(0, 0, 0, 0.3)'
              : '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.06)',
          }
        }}
      >
        {/* Header subtil */}
        <Box sx={{
          borderBottom: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
          px: 3,
          py: 2.5,
          background: isDarkMode 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
        }}>
          <DialogTitle sx={{
            color: isDarkMode ? '#f1f5f9' : '#1e293b',
            p: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              background: isDarkMode 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ExclamationTriangleIcon sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            Détails du Signalement #{selectedReport?.id}
          </DialogTitle>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {selectedReport && (
            <Box sx={{ p: 3 }}>
              {/* Section utilisateurs */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                mb: 4,
              }}>
                {/* Signaleur */}
                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                  background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    mb: 2, 
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}>
                    Signaleur
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={selectedReport.reporter?.picture_url}
                        alt={selectedReport.reporter?.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ 
                        color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        mb: 0.25,
                      }}>
                        {selectedReport.reporter?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}>
                        {selectedReport.reporter?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Utilisateur signalé */}
                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.08)',
                  background: isDarkMode ? 'rgba(127, 29, 29, 0.1)' : 'rgba(254, 242, 242, 0.5)',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#f87171' : '#dc2626', 
                    mb: 2, 
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}>
                    Utilisateur signalé
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={selectedReport.reported_user?.picture_url}
                        alt={selectedReport.reported_user?.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ 
                        color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        mb: 0.25,
                      }}>
                        {selectedReport.reported_user?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}>
                        {selectedReport.reported_user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Informations principales */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2,
                mb: 4,
              }}>
                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.08)',
                  background: isDarkMode ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#60a5fa' : '#2563eb', 
                    mb: 1, 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    Type
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}>
                    {getPublicationTypeLabel(selectedReport.publication_type)}
                  </Typography>
                </Box>

                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(217, 119, 6, 0.08)',
                  background: isDarkMode ? 'rgba(217, 119, 6, 0.05)' : 'rgba(217, 119, 6, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#fbbf24' : '#d97706', 
                    mb: 1, 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    Statut
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedReport.status)}
                    size="small"
                    color={getStatusColor(selectedReport.status)}
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(22, 163, 74, 0.08)',
                  background: isDarkMode ? 'rgba(22, 163, 74, 0.05)' : 'rgba(22, 163, 74, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#34d399' : '#16a34a', 
                    mb: 1, 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    Date
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}>
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {/* Informations détaillées */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 3,
                mb: 4,
              }}>
                {selectedReport.publication_reference && (
                  <Box sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                    background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: isDarkMode ? '#94a3b8' : '#64748b', 
                      mb: 1.5, 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      Référence
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      p: 1.5,
                      borderRadius: '6px',
                      background: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    }}>
                      {selectedReport.publication_reference}
                    </Typography>
                  </Box>
                )}

                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.08)',
                  background: isDarkMode ? 'rgba(127, 29, 29, 0.1)' : 'rgba(254, 242, 242, 0.5)',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#f87171' : '#dc2626', 
                    mb: 1.5, 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    Raison
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}>
                    {getReasonLabel(selectedReport.reason)}
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              {selectedReport.description && (
                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(124, 58, 237, 0.08)',
                  background: isDarkMode ? 'rgba(124, 58, 237, 0.05)' : 'rgba(124, 58, 237, 0.02)',
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: isDarkMode ? '#a78bfa' : '#7c3aed', 
                    mb: 1.5, 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                  }}>
                    {selectedReport.description}
                  </Typography>
                </Box>
              )}

              {/* Preuve et traitement */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 3,
              }}>
                {selectedReport.evidence && (
                  <Box sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.08)',
                    background: isDarkMode ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.02)',
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: isDarkMode ? '#60a5fa' : '#2563eb', 
                      mb: 1.5, 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      Preuve
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      href={selectedReport.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderColor: isDarkMode ? '#60a5fa' : '#2563eb',
                        color: isDarkMode ? '#60a5fa' : '#2563eb',
                        fontSize: '0.85rem',
                        '&:hover': {
                          borderColor: isDarkMode ? '#3b82f6' : '#1d4ed8',
                          backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.04)' : 'rgba(37, 99, 235, 0.04)',
                        },
                      }}
                    >
                      Voir la preuve
                    </Button>
                  </Box>
                )}

                {selectedReport.admin_note && (
                  <Box sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(22, 163, 74, 0.08)',
                    background: isDarkMode ? 'rgba(22, 163, 74, 0.05)' : 'rgba(22, 163, 74, 0.02)',
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: isDarkMode ? '#34d399' : '#16a34a', 
                      mb: 1.5, 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      Note admin
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                      fontSize: '0.9rem',
                    }}>
                      {selectedReport.admin_note}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Informations de traitement */}
              {selectedReport.reviewed_by && (
                <Box sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                  background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ 
                      color: isDarkMode ? '#9ca3af' : '#6b7280', 
                      mb: 0.5, 
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      Traité par
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}>
                      {selectedReport.reviewer?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? '#9ca3af' : '#6b7280', 
                      fontSize: '0.75rem',
                    }}>
                      {new Date(selectedReport.updated_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          borderTop: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
          background: isDarkMode 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {selectedReport?.status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  onClick={handleAction}
                  variant="contained"
                  size="small"
                  sx={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    px: 3,
                    py: 1.5,
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': {
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)'
                        : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Prendre action
                </Button>
              </Box>
            )}
            
            <Button 
              onClick={() => setDetailsModalOpen(false)}
              variant="outlined"
              sx={{
                borderColor: isDarkMode ? '#667eea' : '#667eea',
                color: isDarkMode ? '#667eea' : '#667eea',
                px: 3,
                py: 1,
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': {
                  borderColor: isDarkMode ? '#5a67d8' : '#5a67d8',
                  backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.08)' : 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              Fermer
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Modal des statistiques */}
      <Dialog
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }
        }}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            boxShadow: isDarkMode 
              ? '0 10px 40px rgba(0, 0, 0, 0.3)'
              : '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.2)' 
              : '1px solid rgba(0, 0, 0, 0.06)',
          }
        }}
      >
        {/* Header subtil */}
        <Box sx={{
          borderBottom: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
          px: 3,
          py: 2.5,
          background: isDarkMode 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
        }}>
          <DialogTitle sx={{
            color: isDarkMode ? '#f1f5f9' : '#1e293b',
            p: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              background: isDarkMode 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ExclamationTriangleIcon sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            Statistiques des Signalements
          </DialogTitle>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {statistics && (
            <Box sx={{ p: 3 }}>
              {/* Cartes de statistiques principales */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 4,
              }}>
                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.08)',
                  background: isDarkMode ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="h4" sx={{ 
                    color: isDarkMode ? '#60a5fa' : '#2563eb', 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 0.5,
                  }}>
                    {statistics.total}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    fontSize: '0.875rem',
                  }}>
                    Total
                  </Typography>
                </Box>

                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(217, 119, 6, 0.08)',
                  background: isDarkMode ? 'rgba(217, 119, 6, 0.05)' : 'rgba(217, 119, 6, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="h4" sx={{ 
                    color: isDarkMode ? '#fbbf24' : '#d97706', 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 0.5,
                  }}>
                    {statistics.pending}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    fontSize: '0.875rem',
                  }}>
                    En attente
                  </Typography>
                </Box>

                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(22, 163, 74, 0.08)',
                  background: isDarkMode ? 'rgba(22, 163, 74, 0.05)' : 'rgba(22, 163, 74, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="h4" sx={{ 
                    color: isDarkMode ? '#34d399' : '#16a34a', 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 0.5,
                  }}>
                    {statistics.reviewed}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    fontSize: '0.875rem',
                  }}>
                    Traités
                  </Typography>
                </Box>

                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.08)',
                  background: isDarkMode ? 'rgba(220, 38, 38, 0.05)' : 'rgba(220, 38, 38, 0.02)',
                  textAlign: 'center',
                }}>
                  <Typography variant="h4" sx={{ 
                    color: isDarkMode ? '#f87171' : '#dc2626', 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mb: 0.5,
                  }}>
                    {statistics.ignored}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b', 
                    fontSize: '0.875rem',
                  }}>
                    Ignorés
                  </Typography>
                </Box>
              </Box>

              {/* Sections détaillées */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}>
                {/* Par type de publication */}
                {statistics.by_type && statistics.by_type.length > 0 && (
                  <Box sx={{
                    p: 3,
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                    background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                      mb: 2, 
                      fontSize: '1rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}>
                      <Box sx={{
                        width: 28,
                        height: 28,
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #f1f5f9 0%, #e5e7eb 100%)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDarkMode ? '#60a5fa' : '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        <span>T</span>
                      </Box>
                      Par type
                    </Typography>
                    <Box sx={{ spaceY: 1.5 }}>
                      {statistics.by_type.map((item, index) => (
                        <Box key={item.publication_type} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: '8px',
                          mb: index < statistics.by_type.length - 1 ? 1 : 0,
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}>
                            {getPublicationTypeLabel(item.publication_type)}
                          </Typography>
                          <Box sx={{
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                              : 'linear-gradient(135deg, #f1f5f9 0%, #e5e7eb 100%)',
                            color: isDarkMode ? '#60a5fa' : '#2563eb',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            {item.count}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Par raison */}
                {statistics.by_reason && statistics.by_reason.length > 0 && (
                  <Box sx={{
                    p: 3,
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.08)',
                    background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                      mb: 2, 
                      fontSize: '1rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}>
                      <Box sx={{
                        width: 28,
                        height: 28,
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'
                          : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDarkMode ? '#f87171' : '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        <span>R</span>
                      </Box>
                      Par raison
                    </Typography>
                    <Box sx={{ spaceY: 1.5 }}>
                      {statistics.by_reason.map((item, index) => (
                        <Box key={item.reason} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: '8px',
                          mb: index < statistics.by_reason.length - 1 ? 1 : 0,
                          background: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}>
                            {getReasonLabel(item.reason)}
                          </Typography>
                          <Box sx={{
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'
                              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            color: isDarkMode ? '#f87171' : '#dc2626',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            {item.count}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Signalements récents */}
              {statistics.recent && statistics.recent.length > 0 && (
                <Box sx={{
                  p: 3,
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(124, 58, 237, 0.08)',
                  background: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                }}>
                  <Typography variant="h6" sx={{ 
                    color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                    mb: 2, 
                    fontSize: '1rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}>
                    <Box sx={{
                      width: 28,
                      height: 28,
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, #581c87 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDarkMode ? '#a78bfa' : '#7c3aed',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      <span>R</span>
                    </Box>
                    Récents
                  </Typography>
                  <Box sx={{ spaceY: 1.5 }}>
                    {statistics.recent.map((item, index) => (
                      <Box key={item.id} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: '8px',
                        mb: index < statistics.recent.length - 1 ? 1 : 0,
                        background: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            mb: 0.25,
                          }}>
                            {item.reporter?.name} → {item.reported_user?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: isDarkMode ? '#9ca3af' : '#6b7280', 
                            fontSize: '0.75rem',
                          }}>
                            {getPublicationTypeLabel(item.publication_type)} • {new Date(item.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusLabel(item.status)}
                          size="small"
                          color={getStatusColor(item.status)}
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5, 
          borderTop: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
          background: isDarkMode 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
        }}>
          <Button 
            onClick={() => setStatsModalOpen(false)}
            variant="outlined"
            sx={{
              borderColor: isDarkMode ? '#667eea' : '#667eea',
              color: isDarkMode ? '#667eea' : '#667eea',
              px: 3,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: isDarkMode ? '#5a67d8' : '#5a67d8',
                backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.08)' : 'rgba(102, 126, 234, 0.04)',
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmButtonText={confirmationModal.confirmButtonText}
        type={confirmationModal.type}
      />

    {/* Modal d'action multifonction */}
    <Dialog
      open={actionModalOpen}
      onClose={() => setActionModalOpen(false)}
      maxWidth="sm"
      fullWidth
      BackdropComponent={Backdrop}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      }}
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: '12px',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(0, 0, 0, 0.3)'
            : '0 10px 40px rgba(0, 0, 0, 0.08)',
          border: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
        }
      }}
    >
      {/* Header du modal d'action */}
      <Box sx={{
        borderBottom: isDarkMode 
          ? '1px solid rgba(75, 85, 99, 0.2)' 
          : '1px solid rgba(0, 0, 0, 0.06)',
        px: 3,
        py: 2.5,
        background: isDarkMode 
          ? 'rgba(31, 41, 55, 0.8)' 
          : 'rgba(255, 255, 255, 0.9)',
      }}>
        <DialogTitle sx={{
          color: isDarkMode ? '#f1f5f9' : '#1e293b',
          p: 0,
          fontSize: '1.25rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            background: isDarkMode 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ExclamationTriangleIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          Actions à effectuer
        </DialogTitle>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ 
            color: isDarkMode ? '#94a3b8' : '#64748b', 
            mb: 3,
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}>
            Sélectionnez une ou plusieurs actions à effectuer pour ce signalement :
          </Typography>

          {/* Options à cocher */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2,
              borderRadius: '8px',
              border: isDarkMode 
                ? '1px solid rgba(220, 38, 38, 0.2)' 
                : '1px solid rgba(220, 38, 38, 0.08)',
              background: isDarkMode 
                ? 'rgba(220, 38, 38, 0.05)' 
                : 'rgba(220, 38, 38, 0.02)',
              cursor: 'pointer',
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(220, 38, 38, 0.08)' 
                  : 'rgba(220, 38, 38, 0.04)',
              }
            }}>
              <Checkbox
                checked={selectedActions.suspendaccount}
                onChange={() => handleActionChange('suspendaccount')}
                disabled={selectedActions.ignorereport}
                sx={{
                  color: isDarkMode ? '#dc2626' : '#dc2626',
                  '&.Mui-checked': {
                    color: isDarkMode ? '#dc2626' : '#dc2626',
                  },
                  '&.Mui-disabled': {
                    color: isDarkMode ? '#4b5563' : '#d1d5db',
                  },
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}>
                  Suspendre le compte
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? '#6b7280' : '#9ca3af', 
                  fontSize: '0.8rem',
                  display: 'block',
                  mt: 0.25,
                }}>
                  L'utilisateur ne pourra plus se connecter à la plateforme
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2,
              borderRadius: '8px',
              border: isDarkMode 
                ? '1px solid rgba(217, 119, 6, 0.2)' 
                : '1px solid rgba(217, 119, 6, 0.08)',
              background: isDarkMode 
                ? 'rgba(217, 119, 6, 0.05)' 
                : 'rgba(217, 119, 6, 0.02)',
              cursor: 'pointer',
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(217, 119, 6, 0.08)' 
                  : 'rgba(217, 119, 6, 0.04)',
              }
            }}>
              <Checkbox
                checked={selectedActions.suspendpublicationright}
                onChange={() => handleActionChange('suspendpublicationright')}
                disabled={selectedActions.ignorereport}
                sx={{
                  color: isDarkMode ? '#d97706' : '#d97706',
                  '&.Mui-checked': {
                    color: isDarkMode ? '#d97706' : '#d97706',
                  },
                  '&.Mui-disabled': {
                    color: isDarkMode ? '#4b5563' : '#d1d5db',
                  },
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}>
                  Suspendre le droit de publication
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? '#6b7280' : '#9ca3af', 
                  fontSize: '0.8rem',
                  display: 'block',
                  mt: 0.25,
                }}>
                  L'utilisateur pourra se connecter mais ne pourra plus publier
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2,
              borderRadius: '8px',
              border: isDarkMode 
                ? '1px solid rgba(22, 163, 74, 0.2)' 
                : '1px solid rgba(22, 163, 74, 0.08)',
              background: isDarkMode 
                ? 'rgba(22, 163, 74, 0.05)' 
                : 'rgba(22, 163, 74, 0.02)',
              cursor: 'pointer',
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(22, 163, 74, 0.08)' 
                  : 'rgba(22, 163, 74, 0.04)',
              }
            }}>
              <Checkbox
                checked={selectedActions.retirepublication}
                onChange={() => handleActionChange('retirepublication')}
                disabled={selectedActions.ignorereport}
                sx={{
                  color: isDarkMode ? '#16a34a' : '#16a34a',
                  '&.Mui-checked': {
                    color: isDarkMode ? '#16a34a' : '#16a34a',
                  },
                  '&.Mui-disabled': {
                    color: isDarkMode ? '#4b5563' : '#d1d5db',
                  },
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}>
                  Retirer la publication
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? '#6b7280' : '#9ca3af', 
                  fontSize: '0.8rem',
                  display: 'block',
                  mt: 0.25,
                }}>
                  La publication signalée sera retirée de la plateforme
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2,
              borderRadius: '8px',
              border: isDarkMode 
                ? '1px solid rgba(107, 114, 128, 0.2)' 
                : '1px solid rgba(107, 114, 128, 0.08)',
              background: isDarkMode 
                ? 'rgba(107, 114, 128, 0.05)' 
                : 'rgba(107, 114, 128, 0.02)',
              cursor: 'pointer',
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(107, 114, 128, 0.08)' 
                  : 'rgba(107, 114, 128, 0.04)',
              }
            }}>
              <Checkbox
                checked={selectedActions.ignorereport}
                onChange={() => handleActionChange('ignorereport')}
                sx={{
                  color: isDarkMode ? '#6b7280' : '#6b7280',
                  '&.Mui-checked': {
                    color: isDarkMode ? '#6b7280' : '#6b7280',
                  },
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: isDarkMode ? '#f1f5f9' : '#1e293b', 
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}>
                  Ignorer le signalement
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: isDarkMode ? '#6b7280' : '#9ca3af', 
                  fontSize: '0.8rem',
                  display: 'block',
                  mt: 0.25,
                }}>
                  Aucune action ne sera prise sur ce signalement
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2.5, 
        borderTop: isDarkMode 
          ? '1px solid rgba(75, 85, 99, 0.15)' 
          : '1px solid rgba(0, 0, 0, 0.06)',
        background: isDarkMode 
          ? 'rgba(31, 41, 55, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          width: '100%'
        }}>
          <Button 
            onClick={() => setActionModalOpen(false)}
            variant="outlined"
            sx={{
              borderColor: isDarkMode ? '#6b7280' : '#6b7280',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              px: 3,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: isDarkMode ? '#4b5563' : '#4b5563',
                backgroundColor: isDarkMode ? 'rgba(107, 114, 128, 0.08)' : 'rgba(107, 114, 128, 0.04)',
              },
            }}
          >
            Annuler
          </Button>
          
          <Button 
            onClick={executeActions}
            variant="contained"
            disabled={isSubmitting}
            sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              px: 3,
              py: 1,
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)'
                  : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#fff' }} />
                <span>Exécution...</span>
              </Box>
            ) : (
              'Exécuter les actions'
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>

    <ToastContainer
      position="top-right"
      autoClose={10000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={isDarkMode ? "dark" : "light"}
    />
    </div>
  );
};

export default ReportManagement;
