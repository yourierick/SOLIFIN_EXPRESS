import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide,
  Zoom,
  Fab,
  Tooltip,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Send as SendIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { useTheme as useCustomTheme } from "../../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import instance from "../../utils/axios";
import ConfirmationModal from "../ConfirmationModal";

/**
 * Composant pour la gestion des messages de diffusion administratifs
 *
 * Permet de créer, modifier, supprimer et prévisualiser les messages
 * qui seront affichés aux utilisateurs lors de leur connexion.
 */
const AdminBroadcastMessages = () => {
  const { isDarkMode } = useCustomTheme();
  const muiTheme = useMuiTheme();

  // États pour la liste des messages
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    views: 0,
  });

  // États pour le modal d'ajout/édition
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' ou 'edit'
  const [currentMessage, setCurrentMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // États pour le modal de prévisualisation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState(null);

  // État pour le modal de confirmation de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Formulaire pour l'ajout/édition de message
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "text", // 'text', 'image', 'video'
    media_url: "",
    media_file: null,
    status: true, // true = actif, false = inactif
    target_type: "all", // 'all', 'subscribed', 'unsubscribed', 'specific_user', 'pack'
    target_users: [],
    target_packs: [],
  });

  // États pour les options de destinataires
  const [users, setUsers] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Créer une fonction de référence pour fetchMessages qui ne change pas à chaque rendu
  const fetchMessagesRef = useCallback(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await instance.get("/api/admin/broadcast-messages", {
          params: {
            page: page + 1,
            per_page: rowsPerPage,
            search: searchTerm,
          },
        });
        setMessages(response.data.data);
        setTotalItems(response.data.total);
      } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
        toast.error("Erreur lors du chargement des messages");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage, searchTerm]);

  // Utiliser la référence pour fetchMessages
  const fetchMessages = fetchMessagesRef;

  // Récupérer les statistiques des messages
  const fetchStats = async () => {
    try {
      const response = await instance.get("/api/admin/broadcast-messages/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  };

  // Récupérer les utilisateurs disponibles
  const fetchUsers = async (searchTerm = "") => {
    try {
      setLoadingUsers(true);
      const response = await instance.get("/api/admin/broadcast-messages/users", {
        params: { search: searchTerm }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Récupérer les packs disponibles
  const fetchPacks = async () => {
    try {
      setLoadingPacks(true);
      const response = await instance.get("/api/admin/broadcast-messages/getpacks");
      setPacks(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
    } finally {
      setLoadingPacks(false);
    }
  };

  // Gérer la recherche d'utilisateurs avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearch && userSearch.length >= 2) {
        fetchUsers(userSearch);
      } else if (userSearch.length === 0) {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearch]);

  // Récupérer la liste des messages au chargement du composant
  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [fetchMessages]);

  // Gestion du changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gestion du changement du nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Ouvrir le modal d'ajout
  const handleOpenAddModal = () => {
    setFormData({
      title: "",
      description: "",
      type: "text",
      media_url: "",
      media_file: null,
      status: true,
      target_type: "all",
      target_users: [],
      target_packs: [],
    });
    setFormErrors({});
    setModalMode("add");
    setOpenModal(true);
    fetchPacks();
  };

  // Ouvrir le modal d'édition
  const handleOpenEditModal = (message) => {
    setModalMode("edit");
    setCurrentMessage(message);
    setFormData({
      title: message.title,
      description: message.description,
      type: message.type,
      media_url: message.media_url || "",
      media_file: null,
      status: Boolean(message.status),
      target_type: message.target_type || "all",
      target_users: message.target_users || [],
      target_packs: message.target_packs || [],
    });
    setFormErrors({});
    setOpenModal(true);
    fetchPacks();
  };

  // Fermer le modal d'ajout/édition
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentMessage(null);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Le titre est requis";
    }

    if (!formData.description.trim()) {
      errors.description = "La description est requise";
    }

    if (formData.type !== "text" && !formData.media_url && !formData.media_file) {
      errors.media_url = "Une URL ou un fichier est requis pour ce type de message";
    }

    if (formData.target_type === "specific_user" && formData.target_users.length === 0) {
      errors.target_users = "Veuillez sélectionner au moins un utilisateur";
    }

    if (formData.target_type === "pack" && formData.target_packs.length === 0) {
      errors.target_packs = "Veuillez sélectionner au moins un pack";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", formData.status ? "1" : "0");
      formDataToSend.append("target_type", formData.target_type);
      
      if (formData.target_type === "specific_user" && formData.target_users.length > 0) {
        formData.target_users.forEach(userId => {
          formDataToSend.append("target_users[]", userId);
        });
      } else if (formData.target_type === "pack" && formData.target_packs.length > 0) {
        formData.target_packs.forEach(packId => {
          formDataToSend.append("target_packs[]", packId);
        });
      }

      if (formData.type !== "text" && formData.media_file) {
        formDataToSend.append("media_file", formData.media_file);
      } else if (formData.type !== "text" && formData.media_url && !formData.media_file) {
        formDataToSend.append("media_url", formData.media_url);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (modalMode === "add") {
        await instance.post("/api/admin/broadcast-messages", formDataToSend, config);
        toast.success("Message créé avec succès");
      } else {
        await instance.post(`/api/admin/broadcast-messages/${currentMessage.id}`, formDataToSend, { ...config, params: { _method: "PUT" } });
        toast.success("Message mis à jour avec succès");
      }

      handleCloseModal();
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du message:", error);

      if (error.response && error.response.data && error.response.data.errors) {
        const apiErrors = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          apiErrors[key] = value[0];
        });
        setFormErrors(apiErrors);
      } else {
        toast.error("Erreur lors de la sauvegarde du message");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le modal de prévisualisation
  const handleOpenPreview = (message) => {
    setPreviewMessage(message);
    setPreviewOpen(true);
  };

  // Fermer le modal de prévisualisation
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewMessage(null);
  };

  // Ouvrir le modal de confirmation de suppression
  const handleOpenDeleteModal = (message) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  // Fermer le modal de confirmation de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  // Supprimer un message
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setDeleting(true);
    try {
      await instance.delete(`/api/admin/broadcast-messages/${messageToDelete.id}`);
      toast.success("Message supprimé avec succès");
      handleCloseDeleteModal();
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
      toast.error("Erreur lors de la suppression du message");
    } finally {
      setDeleting(false);
    }
  };

  // Republier un message
  const handleRepublish = async (message) => {
    try {
      await instance.post(`/api/admin/broadcast-messages/${message.id}/republish`);
      toast.success("Message republié avec succès");
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la republication du message:", error);
      toast.error("Erreur lors de la republication du message");
    }
  };

  // Basculer le statut d'un message
  const handleToggleStatus = async (message) => {
    try {
      await instance.patch(`/api/admin/broadcast-messages/${message.id}/status`, {
        status: !Boolean(message.status),
      });
      toast.success(`Message marqué comme ${!Boolean(message.status) ? "actif" : "inactif"}`);
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  // Rendre le contenu du message selon son type
  const renderMessageContent = () => {
    if (!previewMessage) return null;

    switch (previewMessage.type) {
      case "image":
        return (
          <Box sx={{ textAlign: "center" }}>
            {previewMessage.media_url && (
              <img
                src={previewMessage.media_url}
                alt={previewMessage.title}
                style={{
                  maxWidth: "90%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
            )}
            <Typography
              variant="body1"
              sx={{ maxWidth: "90%", textAlign: "center", mt: 2 }}
            >
              {previewMessage.description}
            </Typography>
          </Box>
        );
      case "video":
        return (
          <Box sx={{ textAlign: "center" }}>
            {previewMessage.media_url && (
              <video
                controls
                style={{
                  maxWidth: "90%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <source src={previewMessage.media_url} />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            )}
            <Typography
              variant="body1"
              sx={{ maxWidth: "90%", textAlign: "center" }}
            >
              {previewMessage.description}
            </Typography>
          </Box>
        );
      case "text":
      default:
        return (
          <Typography
            variant="body1"
            sx={{ mb: 2, textAlign: "center", maxWidth: "90%", mx: "auto" }}
          >
            {previewMessage.description}
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
      />
            {/* Carte des statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card
              sx={{
                p: 3,
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.main, 0.1)} 0%, ${alpha(muiTheme.palette.primary.dark, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.light, 0.1)} 0%, ${muiTheme.palette.primary.contrastText} 100%)`,
                border: `1px solid ${alpha(muiTheme.palette.primary.main, isDarkMode ? 0.3 : 0.1)}`,
                borderRadius: "16px",
                boxShadow: isDarkMode 
                  ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
                  : "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: muiTheme.palette.primary.main,
                    width: 48,
                    height: 48,
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`
                  }}
                >
                  <CampaignIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={muiTheme.palette.primary.main}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Total des messages
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUpIcon sx={{ fontSize: 16, mr: 1, color: muiTheme.palette.primary.main }} />
                <Typography variant="caption" color="text.secondary">
                  +12% ce mois
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card
              sx={{
                p: 3,
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${alpha(muiTheme.palette.success.main, 0.08)} 0%, ${alpha(muiTheme.palette.success.dark, 0.04)} 100%)`
                  : `linear-gradient(135deg, ${alpha(muiTheme.palette.success.light, 0.08)} 0%, ${muiTheme.palette.success.contrastText} 100%)`,
                border: `1px solid ${alpha(muiTheme.palette.success.main, isDarkMode ? 0.2 : 0.1)}`,
                borderRadius: "20px",
                boxShadow: isDarkMode 
                  ? "0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)"
                  : "0 12px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: isDarkMode 
                    ? "0 16px 32px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15)"
                    : "0 16px 32px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.04)",
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: muiTheme.palette.success.main,
                    width: 48,
                    height: 48,
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(muiTheme.palette.success.main, 0.3)}`
                  }}
                >
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={muiTheme.palette.success.main}>
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Messages actifs
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUpIcon sx={{ fontSize: 16, mr: 1, color: muiTheme.palette.success.main }} />
                <Typography variant="caption" color="text.secondary">
                  En cours de diffusion
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card
              sx={{
                p: 3,
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${alpha(muiTheme.palette.error.main, 0.1)} 0%, ${alpha(muiTheme.palette.error.dark, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(muiTheme.palette.error.light, 0.1)} 0%, ${muiTheme.palette.error.contrastText} 100%)`,
                border: `1px solid ${alpha(muiTheme.palette.error.main, isDarkMode ? 0.3 : 0.1)}`,
                borderRadius: "16px",
                boxShadow: isDarkMode 
                  ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
                  : "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${muiTheme.palette.error.main}, ${muiTheme.palette.error.light})`,
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: muiTheme.palette.error.main,
                    width: 48,
                    height: 48,
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(muiTheme.palette.error.main, 0.3)}`
                  }}
                >
                  <CancelIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={muiTheme.palette.error.main}>
                    {stats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Messages inactifs
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: muiTheme.palette.error.main }} />
                <Typography variant="caption" color="text.secondary">
                  En attente
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card
              sx={{
                p: 3,
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${alpha(muiTheme.palette.info.main, 0.1)} 0%, ${alpha(muiTheme.palette.info.dark, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(muiTheme.palette.info.light, 0.1)} 0%, ${muiTheme.palette.info.contrastText} 100%)`,
                border: `1px solid ${alpha(muiTheme.palette.info.main, isDarkMode ? 0.3 : 0.1)}`,
                borderRadius: "16px",
                boxShadow: isDarkMode 
                  ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
                  : "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${muiTheme.palette.info.main}, ${muiTheme.palette.info.light})`,
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: muiTheme.palette.info.main,
                    width: 48,
                    height: 48,
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(muiTheme.palette.info.main, 0.3)}`
                  }}
                >
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={muiTheme.palette.info.main}>
                    {stats.views}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Vues totales
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TrendingUpIcon sx={{ fontSize: 16, mr: 1, color: muiTheme.palette.info.main }} />
                <Typography variant="caption" color="text.secondary">
                  +25% cette semaine
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card
          sx={{
            width: "100%",
            mb: 3,
            background: isDarkMode 
              ? `linear-gradient(135deg, ${alpha('#1F2937', 0.9)} 0%, ${alpha('#111827', 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8fafc', 0.95)} 100%)`,
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: isDarkMode 
              ? "0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2)"
              : "0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)",
            border: `1px solid ${alpha(muiTheme.palette.divider, isDarkMode ? 0.2 : 0.1)}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${alpha(muiTheme.palette.divider, isDarkMode ? 0.2 : 0.1)}`,
              background: isDarkMode 
                ? `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.main, 0.05)} 0%, transparent 100%)`
                : `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.light, 0.05)} 0%, transparent 100%)`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: muiTheme.palette.primary.main,
                  width: 40,
                  height: 40,
                  mr: 2,
                  boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`
                }}
              >
                <CampaignIcon />
              </Avatar>
              <Typography
                variant="h5"
                component="div"
                fontWeight="600"
                sx={{ 
                  color: isDarkMode ? "white" : "inherit",
                  background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Messages de diffusion
              </Typography>
            </Box>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleOpenAddModal}
                sx={{
                  background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
                  boxShadow: `0 8px 16px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                  textTransform: "none",
                  fontWeight: "600",
                  px: 3,
                  py: 1.5,
                  borderRadius: "12px",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${muiTheme.palette.primary.dark}, ${muiTheme.palette.primary.main})`,
                    boxShadow: `0 12px 24px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
                  }
                }}
              >
                Nouveau message
              </Button>
            </motion.div>
          </Box>
          
          <TableContainer 
            sx={{ 
              maxHeight: 500,
              background: "transparent",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: alpha(muiTheme.palette.divider, 0.1),
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: alpha(muiTheme.palette.primary.main, 0.3),
                borderRadius: "4px",
                "&:hover": {
                  background: alpha(muiTheme.palette.primary.main, 0.5),
                },
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    Titre
                  </TableCell>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    Destinataires
                  </TableCell>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      background: isDarkMode ? alpha('#1F2937', 0.6) : alpha('#ffffff', 0.9),
                      color: isDarkMode ? "white" : "inherit",
                      fontWeight: "500",
                      borderBottom: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      letterSpacing: "0.25px",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ color: isDarkMode ? "white" : "inherit" }}
                    >
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ color: isDarkMode ? "white" : "inherit" }}
                    >
                      Aucun message trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  messages
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((message) => (
                      <TableRow
                        hover
                        key={message.id}
                        sx={{
                          "&:hover": {
                            bgcolor: isDarkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <TableCell
                          sx={{ color: isDarkMode ? "white" : "inherit" }}
                        >
                          {message.title}
                        </TableCell>
                        <TableCell
                          sx={{ color: isDarkMode ? "white" : "inherit" }}
                        >
                          <Chip
                            label={
                              message.type === "text"
                                ? "Texte"
                                : message.type === "image"
                                ? "Image"
                                : "Vidéo"
                            }
                            color={
                              message.type === "text"
                                ? "default"
                                : message.type === "image"
                                ? "info"
                                : "secondary"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell
                          sx={{ color: isDarkMode ? "white" : "inherit" }}
                        >
                          <Chip
                            label={
                              message.target_type === "all" 
                                ? "Tous" 
                                : message.target_type === "subscribed"
                                ? "Abonnés"
                                : message.target_type === "unsubscribed"
                                ? "Non abonnés"
                                : message.target_type === "specific_user"
                                ? "Spécifiques"
                                : "Par pack"
                            }
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={Boolean(message.status) ? "Actif" : "Inactif"}
                            color={Boolean(message.status) ? "success" : "error"}
                            size="small"
                            onClick={() => handleToggleStatus(message)}
                            sx={{ cursor: "pointer" }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ color: isDarkMode ? "white" : "inherit" }}
                        >
                          {new Date(message.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <IconButton
                              onClick={() => handleOpenPreview(message)}
                              color="primary"
                              size="small"
                              title="Prévisualiser"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleOpenEditModal(message)}
                              color="primary"
                              size="small"
                              title="Modifier"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleRepublish(message)}
                              color="success"
                              size="small"
                              title="Republier"
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleOpenDeleteModal(message)}
                              color="error"
                              size="small"
                              title="Supprimer"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count}`
            }
            sx={{
              color: isDarkMode ? "white" : "inherit",
              "& .MuiSvgIcon-root": {
                color: isDarkMode ? "white" : "inherit",
              },
            }}
          />
        </Card>
      </motion.div>

      {/* Bouton flottant pour ajouter un message */}
      <Tooltip title="Créer un nouveau message" arrow>
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleOpenAddModal}
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
            boxShadow: `0 8px 24px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
            "&:hover": {
              background: `linear-gradient(135deg, ${muiTheme.palette.primary.dark}, ${muiTheme.palette.primary.main})`,
              boxShadow: `0 12px 32px ${alpha(muiTheme.palette.primary.main, 0.6)}`,
            },
            zIndex: 1000,
          }}
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <AddIcon />
          </motion.div>
        </Fab>
      </Tooltip>

      {/* Modal d'ajout/édition */}
      <AnimatePresence>
        {openModal && (
          <Dialog
            open={openModal}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
            TransitionComponent={Slide}
            transitionDuration={300}
            PaperProps={{
              sx: {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${alpha('#1F2937', 0.95)} 0%, ${alpha('#111827', 0.95)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f8fafc', 0.98)} 100%)`,
                color: isDarkMode ? "white" : "inherit",
                backdropFilter: "blur(20px)",
                boxShadow: isDarkMode 
                  ? "0 25px 50px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.3)"
                  : "0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08)",
                border: `1px solid ${alpha(muiTheme.palette.primary.main, isDarkMode ? 0.3 : 0.1)}`,
                borderRadius: "20px",
                overflow: "hidden",
              },
            }}
            sx={{
              "& .MuiBackdrop-root": {
                backdropFilter: "blur(8px)",
                backgroundColor: isDarkMode
                  ? "rgba(0, 0, 0, 0.7)"
                  : "rgba(0, 0, 0, 0.4)",
              },
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle sx={{ 
                p: 3,
                background: isDarkMode 
                  ? `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.main, 0.1)} 0%, transparent 100%)`
                  : `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.light, 0.1)} 0%, transparent 100%)`,
                borderBottom: `1px solid ${alpha(muiTheme.palette.divider, isDarkMode ? 0.2 : 0.1)}`,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: muiTheme.palette.primary.main,
                        width: 40,
                        height: 40,
                        mr: 2,
                        boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`
                      }}
                    >
                      {modalMode === "add" ? <AddIcon /> : <EditIcon />}
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                      fontWeight="600"
                      sx={{ 
                        background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {modalMode === "add" ? "Créer un message" : "Modifier le message"}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleCloseModal} sx={{ 
                    color: isDarkMode ? "white" : "inherit",
                    "&:hover": {
                      background: alpha(muiTheme.palette.error.main, 0.1),
                      color: muiTheme.palette.error.main,
                    }
                  }}>
                    <XMarkIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
            </motion.div>
            
            <DialogContent sx={{ p: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="title"
                      label="Titre du message"
                      fullWidth
                      value={formData.title}
                      onChange={handleFormChange}
                      error={!!formErrors.title}
                      helperText={formErrors.title}
                      InputProps={{
                        sx: {
                          color: isDarkMode ? "white" : "inherit",
                          background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                            borderWidth: "2px",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: muiTheme.palette.primary.main,
                          },
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                          "&.Mui-focused": {
                            color: muiTheme.palette.primary.main,
                          },
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: "500",
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description du message"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={handleFormChange}
                      error={!!formErrors.description}
                      helperText={formErrors.description}
                      InputProps={{
                        sx: {
                          color: isDarkMode ? "white" : "inherit",
                          background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                            borderWidth: "2px",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: muiTheme.palette.primary.main,
                          },
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                          "&.Mui-focused": {
                            color: muiTheme.palette.primary.main,
                          },
                        },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: "500",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel
                        id="type-label"
                        sx={{
                          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                          "&.Mui-focused": {
                            color: muiTheme.palette.primary.main,
                          },
                        }}
                      >
                        Type de message
                      </InputLabel>
                      <Select
                        labelId="type-label"
                        name="type"
                        value={formData.type}
                        onChange={handleFormChange}
                        label="Type de message"
                        sx={{
                          color: isDarkMode ? "white" : "inherit",
                          background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                            borderWidth: "2px",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: muiTheme.palette.primary.main,
                          },
                          "& .MuiSvgIcon-root": {
                            color: isDarkMode ? "white" : "inherit",
                          },
                        }}
                      >
                        <MenuItem value="text">Texte</MenuItem>
                        <MenuItem value="image">Image</MenuItem>
                        <MenuItem value="video">Vidéo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel
                        id="target-type-label"
                        sx={{
                          color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                        }}
                      >
                        Destinataires
                      </InputLabel>
                      <Select
                        labelId="target-type-label"
                        name="target_type"
                        value={formData.target_type}
                        onChange={handleFormChange}
                        label="Destinataires"
                        sx={{
                          color: isDarkMode ? "white" : "inherit",
                          background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                            borderWidth: "2px",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: muiTheme.palette.primary.main,
                          },
                          "& .MuiSvgIcon-root": {
                            color: isDarkMode ? "white" : "inherit",
                          },
                        }}
                      >
                        <MenuItem value="all">Tous les utilisateurs</MenuItem>
                        <MenuItem value="subscribed">Utilisateurs abonnés</MenuItem>
                        <MenuItem value="unsubscribed">Utilisateurs non abonnés</MenuItem>
                        <MenuItem value="specific_user">Utilisateurs spécifiques</MenuItem>
                        <MenuItem value="pack">Par pack d'abonnement</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Sélection des utilisateurs spécifiques */}
                  {formData.target_type === "specific_user" && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: isDarkMode ? "white" : "inherit" }}>
                        Recherchez et sélectionnez les utilisateurs :
                      </Typography>
                      
                      <TextField
                        fullWidth
                        placeholder="Tapez le nom ou l'email de l'utilisateur..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          sx: {
                            color: isDarkMode ? "white" : "inherit",
                            background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                            borderRadius: "12px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                              borderWidth: "2px",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: muiTheme.palette.primary.main,
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                            "&.Mui-focused": {
                              color: muiTheme.palette.primary.main,
                            },
                          },
                        }}
                        sx={{
                          mb: 2
                        }}
                      />

                      {loadingUsers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress size={20} />
                        </Box>
                      ) : users.length > 0 ? (
                        <Box sx={{ 
                          maxHeight: 200, 
                          overflowY: 'auto', 
                          border: `1px solid ${alpha(muiTheme.palette.divider, isDarkMode ? 0.3 : 0.2)}`,
                          borderRadius: 1,
                          p: 1
                        }}>
                          {users.map((user) => (
                            <Box
                              key={user.id}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                },
                                backgroundColor: formData.target_users.includes(user.id) 
                                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                                  : 'transparent'
                              }}
                              onClick={() => {
                                const isSelected = formData.target_users.includes(user.id);
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    target_users: formData.target_users.filter(id => id !== user.id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    target_users: [...formData.target_users, user.id]
                                  });
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ color: isDarkMode ? "white" : "inherit" }}>
                                <strong>{user.name}</strong>
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }}>
                                {user.email}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : userSearch.length >= 2 ? (
                        <Typography variant="body2" sx={{ color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)", p: 2 }}>
                          Aucun utilisateur trouvé pour "{userSearch}"
                        </Typography>
                      ) : null}

                      {formData.target_users.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: isDarkMode ? "white" : "inherit" }}>
                            Utilisateurs sélectionnés ({formData.target_users.length}) :
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {formData.target_users.map(userId => {
                              const user = users.find(u => u.id === userId);
                              return (
                                <Chip
                                  key={userId}
                                  label={user ? `${user.name} (${user.email})` : `ID: ${userId}`}
                                  onDelete={() => {
                                    setFormData({
                                      ...formData,
                                      target_users: formData.target_users.filter(id => id !== userId)
                                    });
                                  }}
                                  size="small"
                                  sx={{
                                    color: isDarkMode ? "white" : "inherit",
                                    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                                  }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}

                      {formErrors.target_users && (
                        <FormHelperText error sx={{ mt: 1 }}>{formErrors.target_users}</FormHelperText>
                      )}
                    </Grid>
                  )}

                  {/* Sélection des packs */}
                  {formData.target_type === "pack" && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel
                          id="packs-label"
                          sx={{
                            color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                          }}
                        >
                          Sélectionner les packs
                        </InputLabel>
                        <Select
                          labelId="packs-label"
                          multiple
                          value={formData.target_packs}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              target_packs: e.target.value,
                            });
                            if (formErrors.target_packs) {
                              setFormErrors({ ...formErrors, target_packs: null });
                            }
                          }}
                          input={<OutlinedInput label="Packs" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const pack = packs.find(p => p.id === value);
                                return (
                                  <Chip
                                    key={value}
                                    label={pack ? `${pack.name} (${pack.price}$)` : value}
                                    size="small"
                                    sx={{
                                      color: isDarkMode ? "white" : "inherit",
                                      backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                          sx={{
                            color: isDarkMode ? "white" : "inherit",
                            background: isDarkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                            borderRadius: "12px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: alpha(muiTheme.palette.primary.main, 0.3),
                              borderWidth: "2px",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: alpha(muiTheme.palette.primary.main, 0.5),
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: muiTheme.palette.primary.main,
                            },
                          }}
                        >
                          {loadingPacks ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} />
                            </MenuItem>
                          ) : (
                            packs.map((pack) => (
                              <MenuItem key={pack.id} value={pack.id}>
                                <Checkbox
                                  checked={formData.target_packs.indexOf(pack.id) > -1}
                                  sx={{
                                    color: isDarkMode ? "white" : "inherit",
                                  }}
                                />
                                <ListItemText
                                  primary={pack.name}
                                  secondary={`${pack.description} - ${pack.price}$`}
                                  primaryTypographyProps={{
                                    sx: { color: isDarkMode ? "white" : "inherit" }
                                  }}
                                  secondaryTypographyProps={{
                                    sx: { color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)" }
                                  }}
                                />
                              </MenuItem>
                            ))
                          )}
                        </Select>
                        {formErrors.target_packs && (
                          <FormHelperText error>{formErrors.target_packs}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  {formData.type !== "text" && (
                    <Grid item xs={12}>
                      <input
                        accept={formData.type === "image" ? "image/*" : "video/*"}
                        style={{ display: "none" }}
                        id="media-file-upload"
                        type="file"
                        name="media_file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              media_file: file,
                              media_url: URL.createObjectURL(file),
                            });
                            if (formErrors.media_url) {
                              setFormErrors({ ...formErrors, media_url: null });
                            }
                          }
                        }}
                      />
                      <label htmlFor="media-file-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<UploadIcon />}
                          sx={{
                            mb: 2,
                            color: isDarkMode ? "white" : "inherit",
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.23)"
                              : "rgba(0, 0, 0, 0.23)",
                            "&:hover": {
                              borderColor: isDarkMode
                                ? "rgba(255, 255, 255, 0.5)"
                                : "rgba(0, 0, 0, 0.5)",
                            },
                          }}
                        >
                          {formData.type === "image"
                            ? "Sélectionner une image"
                            : "Sélectionner une vidéo"}
                        </Button>
                      </label>
                      {formErrors.media_url && (
                        <FormHelperText error>{formErrors.media_url}</FormHelperText>
                      )}
                      <FormHelperText>
                        {formData.type === "image"
                          ? "Formats supportés: jpg, jpeg, png, gif, webp"
                          : "Formats supportés: mp4, webm, ogg"}
                      </FormHelperText>

                      {formData.media_url && formData.type === "image" && (
                        <Box sx={{ mt: 2, textAlign: "center" }}>
                          <img
                            src={formData.media_url}
                            alt="Prévisualisation"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              borderRadius: "4px",
                            }}
                          />
                        </Box>
                      )}
                      {formData.media_url && formData.type === "video" && (
                        <Box sx={{ mt: 2, textAlign: "center" }}>
                          <video
                            controls
                            style={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              borderRadius: "4px",
                            }}
                          >
                            <source src={formData.media_url} />
                            Votre navigateur ne supporte pas la lecture de vidéos.
                          </video>
                        </Box>
                      )}
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="status"
                          checked={Boolean(formData.status)}
                          onChange={handleFormChange}
                          color="primary"
                        />
                      }
                      label={Boolean(formData.status) ? "Actif" : "Inactif"}
                    />
                    <FormHelperText>
                      {Boolean(formData.status)
                        ? "Le message sera publié et visible par les utilisateurs"
                        : "Le message sera enregistré et désactivé"}
                    </FormHelperText>
                  </Grid>
                </Grid>
              </motion.div>
            </DialogContent>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <DialogActions sx={{ 
                p: 3,
                borderTop: `1px solid ${alpha(muiTheme.palette.divider, isDarkMode ? 0.2 : 0.1)}`,
                background: isDarkMode 
                  ? `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.main, 0.05)} 0%, transparent 100%)`
                  : `linear-gradient(90deg, ${alpha(muiTheme.palette.primary.light, 0.05)} 0%, transparent 100%)`,
              }}>
                <Button
                  onClick={handleCloseModal}
                  sx={{
                    color: isDarkMode ? "white" : "inherit",
                    borderColor: alpha(muiTheme.palette.divider, 0.5),
                    "&:hover": {
                      background: alpha(muiTheme.palette.error.main, 0.1),
                      borderColor: muiTheme.palette.error.main,
                      color: muiTheme.palette.error.main,
                    },
                  }}
                  variant="outlined"
                >
                  Annuler
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
                    sx={{
                      background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.light})`,
                      boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
                      textTransform: "none",
                      fontWeight: "600",
                      px: 3,
                      py: 1,
                      borderRadius: "12px",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${muiTheme.palette.primary.dark}, ${muiTheme.palette.primary.main})`,
                        boxShadow: `0 6px 16px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
                      },
                      "&:disabled": {
                        background: alpha(muiTheme.palette.action.disabled, 0.5),
                        color: muiTheme.palette.action.disabled,
                      },
                    }}
                  >
                    {submitting ? "Envoi en cours..." : (modalMode === "add" ? "Créer le message" : "Mettre à jour")}
                  </Button>
                </motion.div>
              </DialogActions>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Modal de prévisualisation */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? "#1f2937" : "white",
            color: isDarkMode ? "white" : "black",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(8px)",
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h6" component="div">
            {previewMessage?.title}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClosePreview}
            aria-label="close"
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            px: { xs: 2, sm: 3, md: 4 },
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderMessageContent()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePreview} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteMessage}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        confirmButtonColor="error"
        isDarkMode={isDarkMode}
        isLoading={deleting}
        backdropProps={{
          sx: {
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          },
        }}
        paperProps={{
          sx: {
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
      />
    </Box>
  );
};

export default AdminBroadcastMessages;