import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import ConfirmationModal from "./ConfirmationModal";
import WithdrawalExportButtons from "./WithdrawalExportButtons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  Box,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  Check,
  Close,
  Save,
  Visibility,
  Warning,
  FilterList,
  Search,
  ArrowBack,
  ArrowForward,
  Schedule,
  Cancel,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CurrencyEuroIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);


const WithdrawalRequests = () => {
  const { isDarkMode } = useTheme();

  // États principaux
  const [requestsArray, setRequestsArray] = useState([]);
  const [filteredRequestsArray, setFilteredRequestsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // États pour les filtres de l'onglet demandes en attente
  const [pendingFilters, setPendingFilters] = useState({
    initiated_by: "",
    payment_method: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  const [showPendingFilters, setShowPendingFilters] = useState(false);

  // États pour les actions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // États pour les modals
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  // États pour la pagination des demandes en attente
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(25);

  // États pour la pagination Material-UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalPendingRequests, setTotalPendingRequests] = useState(0);
  const [totalAllRequests, setTotalAllRequests] = useState(0);

  // États pour les onglets
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' ou 'all'

  // États pour l'exportation
  const [exportLoading, setExportLoading] = useState(false);

  // États pour l'onglet d'analyse complète
  const [allRequests, setAllRequests] = useState([]);
  const [allRequestsLoading, setAllRequestsLoading] = useState(false);
  const [allRequestsMeta, setAllRequestsMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  // Effet pour charger les données initiales
  useEffect(() => {
    // Réinitialiser la page courante lors du changement d'onglet
    setCurrentPage(1);

    if (activeTab === "pending") {
      fetchPendingRequests(1);
    } else if (activeTab === "all") {
      fetchAllRequests(1);
    }
  }, [activeTab]);

  // Effet pour filtrer les demandes en attente ou recharger avec les filtres
  useEffect(() => {
    if (activeTab === "pending") {
      // Si nous utilisons la pagination backend, refaire la requête avec les filtres
      fetchPendingRequests(1);
    } else if (requestsArray.length > 0) {
      // Sinon, appliquer les filtres côté client
      applyPendingFilters();
    } else {
      setFilteredRequestsArray([]);
    }
  }, [pendingFilters, activeTab]);

  // Fonction pour récupérer les demandes en attente avec pagination
  const fetchPendingRequests = async (page = 1) => {
    try {
      setLoading(true);

      // Construire l'URL avec les paramètres de pagination et filtrage
      let url = `/api/admin/withdrawal/requests?page=${page}&per_page=${rowsPerPage}`;

      if (pendingFilters.payment_method) {
        url += `&payment_method=${pendingFilters.payment_method}`;
      }

      if (pendingFilters.initiated_by) {
        url += `&initiated_by=${pendingFilters.initiated_by}`;
      }

      if (pendingFilters.start_date) {
        url += `&start_date=${pendingFilters.start_date}`;
      }

      if (pendingFilters.end_date) {
        url += `&end_date=${pendingFilters.end_date}`;
      }

      if (pendingFilters.search) {
        url += `&search=${encodeURIComponent(pendingFilters.search)}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        // Vérifier si les données sont paginées
        if (response.data.data) {
          // Format paginé (nouvelle structure)
          const requests = response.data.data.data || [];
          setRequestsArray(requests);
          setFilteredRequestsArray(requests); // Initialiser filteredRequestsArray avec les mêmes données
          setAllRequestsMeta({
            current_page: response.data.data.current_page || 1,
            last_page: response.data.data.last_page || 1,
            per_page: response.data.data.per_page || 10,
            total: response.data.data.total || 0,
            from: response.data.data.from || 0,
            to: response.data.data.to || 0,
          });
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalPendingRequests(response.data.data.total || 0);
        } else if (response.data.requests?.data) {
          // Format paginé (ancienne structure pour compatibilité)
          const requests = response.data.requests.data || [];
          setRequestsArray(requests);
          setFilteredRequestsArray(requests); // Initialiser filteredRequestsArray avec les mêmes données
          setAllRequestsMeta({
            current_page: response.data.requests.current_page || 1,
            last_page: response.data.requests.last_page || 1,
            per_page: response.data.requests.per_page || 10,
            total: response.data.requests.total || 0,
            from: response.data.requests.from || 0,
            to: response.data.requests.to || 0,
          });
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalPendingRequests(response.data.requests.total || 0);
        } else {
          // Format non paginé (pour compatibilité)
          setRequestsArray(response.data.requests || []);
          setFilteredRequestsArray(response.data.requests || []);
          
          // Mettre à jour les métadonnées de pagination
          const meta = response.data.meta || {
            current_page: 1,
            last_page: 1,
            per_page: rowsPerPage,
            total: (response.data.requests || []).length,
            from: 1,
            to: (response.data.requests || []).length,
          };
          setAllRequestsMeta(meta);
          setTotalPendingRequests(meta.total);
        }

        // Si nous avons des données paginées, mettre à jour la page courante
        if (response.data.data) {
          setCurrentPage(response.data.data.current_page || 1);
        } else {
          setCurrentPage(response.data.requests?.current_page || 1);
        }
      } else {
        toast.error("Erreur lors de la récupération des demandes");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error);
      toast.error("Erreur lors de la récupération des demandes");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater les montants selon la devise sélectionnée
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "0.00";

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "0.00";

    return new Intl.NumberFormat("fr-Fr", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  };

  // Fonction pour appliquer les filtres aux demandes en attente
  const applyPendingFilters = () => {
    // Si nous utilisons la pagination backend, les filtres sont déjà appliqués via l'API
    // Cette fonction est maintenant principalement utilisée comme fallback pour le filtrage côté client
    if (activeTab !== "pending" || !allRequestsMeta) {
      let filtered = [...requestsArray];

      if (pendingFilters.payment_method) {
        filtered = filtered.filter(
          (request) => request.payment_method === pendingFilters.payment_method
        );
      }

      if (pendingFilters.initiated_by) {
        // TODO: Remplacer par l'ID réel de l'utilisateur courant
        // Pour l'instant, nous utilisons une logique basique
        const currentUserId = 1; // À remplacer par l'ID réel de l'utilisateur connecté
        
        if (pendingFilters.initiated_by === "self") {
          filtered = filtered.filter(
            (request) => request.user_id === currentUserId
          );
        } else if (pendingFilters.initiated_by === "others") {
          filtered = filtered.filter(
            (request) => request.user_id !== currentUserId
          );
        }
      }

      if (pendingFilters.start_date) {
        const startDate = new Date(pendingFilters.start_date);
        filtered = filtered.filter((request) => {
          const requestDate = new Date(request.created_at);
          return requestDate >= startDate;
        });
      }

      if (pendingFilters.end_date) {
        const endDate = new Date(pendingFilters.end_date);
        filtered = filtered.filter((request) => {
          const requestDate = new Date(request.created_at);
          return requestDate <= endDate;
        });
      }

      if (pendingFilters.search) {
        const searchLower = pendingFilters.search.toLowerCase();
        filtered = filtered.filter(
          (request) =>
            (request.user?.name &&
              request.user.name.toLowerCase().includes(searchLower)) ||
            (request.user?.email &&
              request.user.email.toLowerCase().includes(searchLower))
        );
      }

      setFilteredRequestsArray(filtered);
      setCurrentPage(1); // Réinitialiser à la première page après filtrage
    }
  };

  // Fonction pour réinitialiser les filtres des demandes en attente
  const resetPendingFilters = () => {
    setPendingFilters({
      initiated_by: "",
      payment_method: "",
      start_date: "",
      end_date: "",
      search: "",
    });

    // Réinitialiser la page courante et recharger les données
    if (activeTab === "pending") {
      fetchPendingRequests(1);
    }
  };

  // Fonction pour récupérer toutes les demandes avec filtres
  const fetchAllRequests = async (page = 1) => {
    try {
      setAllRequestsLoading(true);

      // Construire l'URL avec les paramètres de filtrage
      let url = `/api/admin/withdrawal/all?page=${page}&per_page=${rowsPerPage}`;

      if (filters.status) {
        url += `&status=${filters.status}`;
      }

      if (filters.payment_method) {
        url += `&payment_method=${filters.payment_method}`;
      }

      if (filters.start_date) {
        url += `&start_date=${filters.start_date}`;
      }

      if (filters.end_date) {
        url += `&end_date=${filters.end_date}`;
      }

      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        // Vérifier si les données sont paginées
        if (response.data.withdrawal_requests) {
          const requests = response.data.withdrawal_requests.data || [];
          setAllRequests(requests);
          setAllRequestsMeta({
            current_page: response.data.withdrawal_requests.current_page || 1,
            last_page: response.data.withdrawal_requests.last_page || 1,
            per_page: response.data.withdrawal_requests.per_page || 10,
            total: response.data.withdrawal_requests.total || 0,
            from: response.data.withdrawal_requests.from || 0,
            to: response.data.withdrawal_requests.to || 0,
          });
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalAllRequests(response.data.withdrawal_requests.total || 0);
        } else {
          // Format non paginé (pour compatibilité)
          setAllRequests(response.data.withdrawal_requests || []);
          setAllRequestsMeta(null);
          setTotalAllRequests((response.data.withdrawal_requests || []).length);
        }

        // Adapter les données pour correspondre à la structure attendue par le composant
        const statsData = response.data.stats || {};

        // S'assurer que toutes les propriétés nécessaires sont présentes
        const formattedStats = {
          ...statsData,
          // Utiliser les propriétés du backend ou des valeurs par défaut
          total_amount: statsData.total_amount || 0,
          pending_amount: statsData.pending_amount || 0,
          approved_amount: statsData.approved_amount || 0,
          rejected_amount: statsData.rejected_amount || 0,
          paid_amount: statsData.paid_amount || 0,

          // Renommer les propriétés pour correspondre à celles attendues par le composant
          pending_requests: statsData.pending_requests || 0,
          approved_requests: statsData.approved_requests || 0,
          rejected_requests: statsData.rejected_requests || 0,

          // Adapter les données pour les graphiques
          monthly_stats: statsData.monthly_stats || [],
          payment_method_stats: statsData.payment_method_stats || [],
        };

        setStats(formattedStats);
      } else {
        toast.error("Erreur lors de la récupération des données d'analyse");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données d'analyse:",
        error
      );
      toast.error("Erreur lors de la récupération des données d'analyse");
    } finally {
      setAllRequestsLoading(false);
    }
  };
  // Fonctions pour gérer les actions sur les demandes
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `/api/admin/withdrawal/requests/${requestId}/approve`,
        {
          admin_note: adminNote,
        }
      );

      if (response.data.success) {
        toast.success("Demande approuvée avec succès");
        setSelectedRequest(null);

        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors de l'approbation de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la demande:", error);
      toast.error("Erreur lors de l'approbation de la demande");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `/api/admin/withdrawal/requests/${requestId}/reject`,
        {
          admin_note: adminNote,
        }
      );

      if (response.data.success) {
        toast.success("Demande rejetée avec succès");
        setSelectedRequest(null);

        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors du rejet de la demande");
      }
    } catch (error) {
      console.error("Erreur lors du rejet de la demande:", error);
      toast.error("Erreur lors du rejet de la demande");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setIsCancelling(true);
      const response = await axios.post(
        `/api/withdrawal/request/${requestId}/cancel`
      );

      if (response.data.success) {
        toast.success("Demande annulée avec succès");
        
        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors de l'annulation de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande:", error);
      toast.error("Erreur lors de l'annulation de la demande");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelClick = (request) => {
    setRequestToCancel(request);
    setShowCancelConfirmation(true);
  };

  const handleRetryPayment = async (request, note = null) => {
    try {
      setIsRetryingPayment(true);
      const payload = note ? { admin_note: note } : {};
      const response = await axios.post(`/api/admin/withdrawal/requests/${request.id}/approve`, payload);
      
      if (response.data.success) {
        toast.success("La demande de retrait a été renvoyée pour paiement avec succès");
        // Rafraîchir les données
        fetchWithdrawalRequests();
        // Fermer le modal si c'est depuis le modal
        if (selectedRequest) {
          setSelectedRequest(null);
        }
      } else {
        toast.error(response.data.message || "Erreur lors du renvoi de la demande");
      }
    } catch (error) {
      console.error("Erreur lors du retry du paiement:", error);
      toast.error(error.response?.data?.message || "Une erreur est survenue lors du renvoi de la demande");
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    
    setShowCancelConfirmation(false);
    await handleCancelRequest(requestToCancel.id);
    setRequestToCancel(null);
  };

  // Fonctions pour les filtres
  const applyFilters = () => {
    fetchAllRequests(1); // Réinitialiser à la première page lors de l'application des filtres
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      payment_method: "",
      start_date: "",
      end_date: "",
      search: "",
    });
    fetchAllRequests(1); // Réinitialiser à la première page lors de l'application des filtres
  };

  // Fonction pour gérer le changement de page dans les deux onglets
  const handlePageChange = (page) => {
    if (activeTab === "pending") {
      fetchPendingRequests(page);
    } else if (activeTab === "all") {
      fetchAllRequests(page);
    }
  };

  // Gestionnaires de pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    handlePageChange(newPage + 1); // Convertir en pagination 1-based pour le backend
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    handlePageChange(1); // Recharger à la première page avec le nouveau nombre de lignes
  };

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-yellow-900 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "approved":
        return isDarkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800";
      case "rejected":
        return isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800";
      case "failed":
        return isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800";
      case "paid":
        return isDarkMode
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-800";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4" />;
      case "paid":
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Pagination pour l'onglet des demandes en attente
  // Si nous avons des métadonnées de pagination du backend, nous les utilisons
  // Sinon, nous utilisons la pagination côté client comme fallback
  let currentRequests = [];
  let pendingTotalPages = 1;

  if (allRequestsMeta && activeTab === "pending") {
    // Utilisation de la pagination du backend
    currentRequests = requestsArray;
    pendingTotalPages = allRequestsMeta.last_page || 1;
  } else {
    // Fallback à la pagination côté client
    const indexOfLastRequest = currentPage * requestsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
    currentRequests = filteredRequestsArray.slice(
      indexOfFirstRequest,
      indexOfLastRequest
    );
    pendingTotalPages = Math.max(
      1,
      Math.ceil(filteredRequestsArray.length / requestsPerPage)
    );
  }

  // Fonctions de pagination
  const handlePendingPageChange = (pageNumber) => {
    handlePageChange(pageNumber);
  };

  const nextPendingPage = () => {
    if (activeTab === "pending" && allRequestsMeta) {
      handlePageChange(
        Math.min(allRequestsMeta.current_page + 1, allRequestsMeta.last_page)
      );
    } else {
      setCurrentPage((prev) => Math.min(prev + 1, pendingTotalPages));
    }
  };

  const prevPendingPage = () => {
    if (activeTab === "pending" && allRequestsMeta) {
      handlePageChange(Math.max(allRequestsMeta.current_page - 1, 1));
    } else {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  // Fonctions d'exportation
  const fetchPendingRequestsForExport = async () => {
    try {
      const response = await axios.get('/api/admin/withdrawal/export-pending', {
        params: {
          payment_method: pendingFilters.payment_method || undefined,
          initiated_by: pendingFilters.initiated_by || undefined,
          start_date: pendingFilters.start_date || undefined,
          end_date: pendingFilters.end_date || undefined,
          search: pendingFilters.search || undefined,
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes en attente pour export:', error);
      throw error;
    }
  };

  const fetchAllRequestsForExport = async () => {
    try {
      const response = await axios.get('/api/admin/withdrawal/export-all', {
        params: {
          status: filters.status || undefined,
          payment_method: filters.payment_method || undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          search: filters.search || undefined,
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les demandes pour export:', error);
      throw error;
    }
  };

  const exportToExcel = (data, filename) => {
    try {
      // Préparer les données pour l'export
      const exportData = data.map(request => ({
        'ID': request.id,
        'Utilisateur': request.user?.name || 'N/A',
        'Email': request.user?.email || 'N/A',
        'Montant': request.amount,
        'Méthode de paiement': request.payment_method,
        'Statut': request.status === 'pending' ? 'En attente' : 
                 request.status === 'approved' ? 'Approuvé' : 
                 request.status === 'rejected' ? 'Rejeté' :
                 request.status === 'failed' ? 'Echoué' :
                 request.status === 'paid' ? 'Payé' : 
                 request.status === 'cancelled' ? 'Annulé' : request.status,
        'Date de demande': format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Date de traitement': request.processed_at ? 
          format(new Date(request.processed_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A',
        'Notes': request.notes || '',
        'Téléphone': request.user?.phone || 'N/A',
      }));

      // Créer le workbook et la worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Demandes de retrait');

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 8 },  // ID
        { wch: 20 }, // Utilisateur
        { wch: 25 }, // Email
        { wch: 12 }, // Montant
        { wch: 18 }, // Méthode de paiement
        { wch: 12 }, // Statut
        { wch: 20 }, // Date de demande
        { wch: 20 }, // Date de traitement
        { wch: 30 }, // Notes
        { wch: 15 }, // Téléphone
      ];
      ws['!cols'] = colWidths;

      // Télécharger le fichier
      XLSX.writeFile(wb, `${filename}_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: fr })}.xlsx`);
      
      toast.success('Exportation réussie !');
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const exportCurrentPage = async () => {
    setExportLoading(true);
    try {
      let currentData = [];
      
      if (activeTab === "pending") {
        currentData = allRequestsMeta ? requestsArray : 
          filteredRequestsArray.slice((currentPage - 1) * requestsPerPage, currentPage * requestsPerPage);
      } else {
        currentData = allRequests.slice((page) * rowsPerPage, (page + 1) * rowsPerPage);
      }
      
      const filename = activeTab === "pending" ? 
        'demandes_en_attente_page_actuelle' : 
        'demandes_retraits_page_actuelle';
      
      exportToExcel(currentData, filename);
    } catch (error) {
      toast.error('Erreur lors de l\'exportation de la page actuelle');
    } finally {
      setExportLoading(false);
    }
  };

  const exportFiltered = async () => {
    setExportLoading(true);
    try {
      let filteredData = [];
      
      if (activeTab === "pending") {
        filteredData = await fetchPendingRequestsForExport();
      } else {
        filteredData = await fetchAllRequestsForExport();
      }
      
      const filename = activeTab === "pending" ? 
        'demandes_en_attente_filtrees' : 
        'demandes_retraits_filtrees';
      
      exportToExcel(filteredData, filename);
    } catch (error) {
      toast.error('Erreur lors de l\'exportation des données filtrées');
    } finally {
      setExportLoading(false);
    }
  };

  const exportAll = async () => {
    setExportLoading(true);
    try {
      let allData = [];
      
      if (activeTab === "pending") {
        allData = await fetchPendingRequestsForExport();
      } else {
        allData = await fetchAllRequestsForExport();
      }
      
      const filename = activeTab === "pending" ? 
        'toutes_demandes_en_attente' : 
        'toutes_demandes_retraits';
      
      exportToExcel(allData, filename);
    } catch (error) {
      toast.error('Erreur lors de l\'exportation de toutes les données');
    } finally {
      setExportLoading(false);
    }
  };

  // Rendu du composant
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3 sm:p-4 md:p-6 xl:p-8">
      {/* En-tête */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Demandes de retrait
          </h3>
          <span className="text-sm sm:text-base font-normal text-gray-500 dark:text-gray-400">
            Gestion et analyse des demandes de retrait
          </span>
        </div>
      </div>

      {/* Onglets avec design moderne et ascenseur horizontal pour mobile */}
      <div className="mb-4 sm:mb-6 relative">
        {/* Conteneur avec ascenseur horizontal pour mobile */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="min-w-max sm:min-w-0">
            {/* Ligne de séparation supérieure */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <ul className="flex text-sm font-medium">
                {/* Onglet "Demandes en attente" */}
                <li className="relative">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`group relative px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === "pending"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-all duration-200 ${
                          activeTab === "pending" ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold">Demandes en attente</span>
                    </span>
                    {/* Indicateur actif */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transform transition-all duration-300 ${
                        activeTab === "pending" ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                </li>

                {/* Onglet "Analyse complète" */}
                <li className="relative">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`group relative px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === "all"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-all duration-200 ${
                          activeTab === "all" ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="font-semibold">Analyse complète</span>
                    </span>
                    {/* Indicateur actif */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 transform transition-all duration-300 ${
                        activeTab === "all" ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de défilement pour mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none sm:hidden z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none sm:hidden z-10" />
      </div>
      {/* Contenu des onglets */}
      {activeTab === "pending" ? (
        // Onglet des demandes en attente
        <div>
          {/* Section des filtres pour les demandes en attente */}
          <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Filtres
              </h4>
              <div className="flex items-center gap-3">
                <WithdrawalExportButtons
                  onExportCurrentPage={exportCurrentPage}
                  onExportFiltered={exportFiltered}
                  onExportAll={exportAll}
                  loading={exportLoading}
                  disabled={loading}
                  currentPageCount={allRequestsMeta ? requestsArray.length : 
                    filteredRequestsArray.slice((currentPage - 1) * requestsPerPage, currentPage * requestsPerPage).length}
                  filteredCount={totalPendingRequests}
                  totalCount={totalPendingRequests}
                />
                <button
                  onClick={() => setShowPendingFilters(!showPendingFilters)}
                  className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none"
                >
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  {showPendingFilters
                    ? "Masquer les filtres"
                    : "Afficher les filtres"}
                </button>
              </div>
            </div>

            {showPendingFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initié par
                  </label>
                  <select
                    value={pendingFilters.initiated_by}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        initiated_by: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="self">Par moi</option>
                    <option value="others">Par d'autres</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Méthode de paiement
                  </label>
                  <select
                    value={pendingFilters.payment_method}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Toutes</option>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="orange-money">Orange Money</option>
                    <option value="airtel-money">Airtel Money</option>
                    <option value="afrimoney">Afrimoney</option>
                    <option value="m-pesa">M-Pesa</option>
                    <option value="american-express">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={pendingFilters.start_date}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={pendingFilters.end_date}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
                <div className="relative">
                  <input
                    type="text"
                    value={pendingFilters.search}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        search: e.target.value,
                      })
                    }
                    placeholder="Rechercher par ID, utilisateur..."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={resetPendingFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Indicateur de chargement */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
          {filteredRequestsArray.length === 0 ? (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {requestsArray.length === 0
                ? `Aucune demande de retrait en cours`
                : `Aucune demande ne correspond aux critères de recherche`}
            </div>
          ) : (
            <>
              <Paper
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead
                      sx={{
                        backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                      }}
                    >
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          ID
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Utilisateur
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Montant
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Méthode de paiement
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Statut de traitement
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequestsArray.map((request) => (
                        <TableRow
                          key={request.id}
                          sx={{
                            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                            "&:hover": {
                              backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                            },
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: isDarkMode ? "#ffffff" : "#111827",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.id}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.user
                              ? request.user.name
                              : "Utilisateur inconnu"}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(request.amount)}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.payment_method}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                request.status
                              )}`}
                            >
                              <span className="flex items-center">
                                {getStatusIcon(request.status)}
                                <span className="ml-1">
                                  {request.status === "pending" && "En attente"}
                                  {request.status === "approved" && "Approuvé"}
                                  {request.status === "rejected" && "Rejeté"}
                                  {request.status === "cancelled" && "Annulé"}
                                  {request.status === "failed" && "Échoué"}
                                </span>
                              </span>
                            </span>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {new Date(request.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewRequest(request)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              
                              {/* Bouton annuler - seulement pour les demandes de l'utilisateur courant */}
                              {request.user_id === 1 && request.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelClick(request)}
                                  disabled={isCancelling}
                                  className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                                  title="Annuler ma demande"
                                >
                                  {isCancelling ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                                  ) : (
                                    <XMarkIcon className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                              
                              {/* Bouton réessayer le paiement - seulement pour les demandes approuvées mais échouées */}
                              {request.status === 'failed' && (
                                <button
                                  onClick={() => handleRetryPayment(request)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Réessayer le paiement"
                                >
                                  <ArrowPathIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Pagination Material-UI pour les demandes en attente */}
              <TablePagination
                component="div"
                count={totalPendingRequests}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                }
                sx={{
                  color: isDarkMode ? "#ffffff" : "#475569",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "& .MuiTablePagination-toolbar": {
                    minHeight: { xs: "40px", sm: "52px" },
                    padding: { xs: "8px", sm: "16px" },
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                  "& .MuiTablePagination-selectIcon": {
                    color: isDarkMode ? "#ffffff" : "#475569",
                  },
                  "& .MuiTablePagination-select": {
                    backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                    borderRadius: 1,
                    padding: "4px 8px",
                    border: isDarkMode
                      ? "1px solid #374151"
                      : "1px solid #e2e8f0",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                  "& .MuiTablePagination-actions button": {
                    color: isDarkMode ? "#ffffff" : "#475569",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                    },
                  },
                }}
              />
            </>
          )}
        </div>
      ) : (
        // Onglet d'analyse complète
        <div>
          {/* Section des filtres - Design Moderne */}
          <Box
            sx={{
              background: isDarkMode ? "#1f2937" : "#ffffff",
              borderRadius: 2,
              p: { xs: 2, sm: 3 },
              mb: 3,
              border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
              boxShadow: isDarkMode 
                ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header de la section filtres */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <FilterList sx={{ 
                  fontSize: 20, 
                  color: "#3b82f6", 
                  mr: 1 
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: isDarkMode ? "#ffffff" : "#1e293b",
                  fontSize: { xs: "1rem", sm: "1.125rem" }
                }}>
                  Filtres de recherche
                </Typography>
              </Box>
              <WithdrawalExportButtons
                data={filteredRequestsArray}
                filename="retrait_demandes"
                title="Demandes de retrait"
              />
            </Box>

            {/* Bouton toggle pour filtres avancés */}
            <Box sx={{ mb: 2 }}>
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                startIcon={<FunnelIcon />}
                size="small"
                sx={{
                  backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                  color: isDarkMode ? "#ffffff" : "#475569",
                  fontWeight: 500,
                  textTransform: "none",
                  px: 2,
                  py: 1,
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#4b5563" : "#e2e8f0",
                  },
                }}
              >
                {showAdvancedFilters ? "Masquer" : "Afficher"} les filtres avancés
              </Button>
            </Box>
            
            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: isDarkMode ? "#111827" : "#f8fafc",
                  borderRadius: 1.5,
                  border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? "#9ca3af" : "#64748b",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5
                    }}>
                      Statut
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      sx={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        "& .MuiOutlinedInput-root": {
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: "0.875rem",
                        },
                      }}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="pending">En attente</MenuItem>
                      <MenuItem value="approved">Approuvé</MenuItem>
                      <MenuItem value="rejected">Rejeté</MenuItem>
                      <MenuItem value="cancelled">Annulé</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? "#9ca3af" : "#64748b",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5
                    }}>
                      Méthode de paiement
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={filters.payment_method}
                      onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                      sx={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        "& .MuiOutlinedInput-root": {
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: "0.875rem",
                        },
                      }}
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      <MenuItem value="visa">Visa</MenuItem>
                      <MenuItem value="mastercard">Mastercard</MenuItem>
                      <MenuItem value="orange-money">Orange Money</MenuItem>
                      <MenuItem value="airtel-money">Airtel Money</MenuItem>
                      <MenuItem value="afrimoney">Afrimoney</MenuItem>
                      <MenuItem value="m-pesa">M-Pesa</MenuItem>
                      <MenuItem value="american-express">American Express</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? "#9ca3af" : "#64748b",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5
                    }}>
                      Date de début
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                      sx={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        "& .MuiOutlinedInput-root": {
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: "0.875rem",
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" sx={{ 
                      color: isDarkMode ? "#9ca3af" : "#64748b",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "block",
                      mb: 0.5
                    }}>
                      Date de fin
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                      sx={{
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        "& .MuiOutlinedInput-root": {
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: "0.875rem",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Barre de recherche et boutons d'action */}
            <Box sx={{ 
              display: "flex", 
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { xs: "stretch", sm: "center" }
            }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Rechercher par ID, utilisateur..."
                  InputProps={{
                    startAdornment: <Search sx={{ color: "#9ca3af", mr: 1 }} />,
                  }}
                  sx={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                    "& .MuiOutlinedInput-root": {
                      color: isDarkMode ? "#ffffff" : "#1e293b",
                      fontSize: "0.875rem",
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={applyFilters}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: "#3b82f6",
                    "&:hover": { backgroundColor: "#2563eb" },
                    fontWeight: 500,
                    textTransform: "none",
                    px: 2,
                  }}
                >
                  Appliquer
                </Button>
                <Button
                  onClick={resetFilters}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                    color: isDarkMode ? "#ffffff" : "#374151",
                    "&:hover": {
                      borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
                      backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                    },
                    fontWeight: 500,
                    textTransform: "none",
                    px: 2,
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            </Box>
          </Box>
          {/* Section des statistiques - Design Moderne */}
          {allRequestsLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
                background: isDarkMode ? "#1f2937" : "#ffffff",
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  border: "3px solid #3b82f6",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <Typography variant="body2" sx={{ color: isDarkMode ? "#9ca3af" : "#64748b" }}>
                  Chargement des statistiques...
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {stats && (
                <Box sx={{ mb: 3 }}>
                  {/* Header de la section statistiques */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        borderRadius: 2,
                        mr: 2,
                      }}
                    />
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: isDarkMode ? "#ffffff" : "#1e293b",
                      fontSize: { xs: "1rem", sm: "1.125rem" }
                    }}>
                      Statistiques générales
                    </Typography>
                  </Box>

                  {/* Cartes de statistiques */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          background: isDarkMode ? "#1f2937" : "#ffffff",
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                          borderLeft: "4px solid #3b82f6",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: isDarkMode 
                              ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                              : "0 8px 25px rgba(0, 0, 0, 0.1)",
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#eff6ff",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CurrencyDollarIcon sx={{ 
                              fontSize: 20, 
                              color: "#3b82f6" 
                            }} />
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            Montant total
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" }
                        }}>
                          ${stats.total_amount?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          background: isDarkMode ? "#1f2937" : "#ffffff",
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                          borderLeft: "4px solid #f59e0b",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: isDarkMode 
                              ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                              : "0 8px 25px rgba(0, 0, 0, 0.1)",
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#fef3c7",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ClockIcon sx={{ 
                              fontSize: 20, 
                              color: "#f59e0b" 
                            }} />
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            En attente
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" }
                        }}>
                          {stats.pending_requests} (${stats.pending_amount?.toFixed(2)})
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          background: isDarkMode ? "#1f2937" : "#ffffff",
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                          borderLeft: "4px solid #10b981",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: isDarkMode 
                              ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                              : "0 8px 25px rgba(0, 0, 0, 0.1)",
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#d1fae5",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircleIcon sx={{ 
                              fontSize: 20, 
                              color: "#10b981" 
                            }} />
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            Payés
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" }
                        }}>
                          {stats.approved_requests} (${stats.approved_amount?.toFixed(2)})
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{
                          background: isDarkMode ? "#1f2937" : "#ffffff",
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                          borderLeft: "4px solid #ef4444",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: isDarkMode 
                              ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                              : "0 8px 25px rgba(0, 0, 0, 0.1)",
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#fee2e2",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <XCircleIcon sx={{ 
                              fontSize: 20, 
                              color: "#ef4444" 
                            }} />
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            Rejetés
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" }
                        }}>
                          {stats.rejected_requests} (${stats.rejected_amount?.toFixed(2)})
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Section des graphiques - Design Moderne */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 24,
                      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      borderRadius: 2,
                      mr: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    fontSize: { xs: "1rem", sm: "1.125rem" }
                  }}>
                    Visualisations
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* Graphique en barres - Demandes par mois */}
                  <Grid item xs={12} lg={6}>
                    <Box
                      sx={{
                        background: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        height: 300,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? "#ffffff" : "#1e293b",
                        mb: 2,
                        fontSize: "0.875rem"
                      }}>
                        Demandes par mois
                      </Typography>
                      <Box sx={{ height: 240 }}>
                        {stats.monthly_stats && (
                          <Bar
                            data={{
                              labels: stats.monthly_stats.map(
                                (item) => `${item.month}/${item.year}`
                              ),
                              datasets: [
                                {
                                  label: "Montant total",
                                  data: stats.monthly_stats.map(
                                    (item) => item.total_amount
                                  ),
                                  backgroundColor: isDarkMode
                                    ? "rgba(139, 92, 246, 0.7)"
                                    : "rgba(139, 92, 246, 0.5)",
                                  borderColor: "#8b5cf6",
                                  borderWidth: 1,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    fontSize: "0.75rem",
                                  },
                                  grid: {
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)",
                                  },
                                },
                                x: {
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    fontSize: "0.75rem",
                                  },
                                  grid: {
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)",
                                  },
                                },
                              },
                              plugins: {
                                legend: {
                                  labels: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    fontSize: "0.75rem",
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Graphique en camembert - Méthodes de paiement */}
                  <Grid item xs={12} lg={6}>
                    <Box
                      sx={{
                        background: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        height: 300,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? "#ffffff" : "#1e293b",
                        mb: 2,
                        fontSize: "0.875rem"
                      }}>
                        Méthodes de paiement
                      </Typography>
                      <Box sx={{ height: 240 }}>
                        {stats.payment_method_stats && (
                          <Pie
                            data={{
                              labels: stats.payment_method_stats.map(
                                (item) => item.payment_method
                              ),
                              datasets: [
                                {
                                  data: stats.payment_method_stats.map(
                                    (item) => item.total_amount
                                  ),
                                  backgroundColor: [
                                    "rgba(59, 130, 246, 0.7)",
                                    "rgba(245, 158, 11, 0.7)",
                                    "rgba(16, 185, 129, 0.7)",
                                    "rgba(239, 68, 68, 0.7)",
                                  ],
                                  borderColor: [
                                    "#3b82f6",
                                    "#f59e0b",
                                    "#10b981",
                                    "#ef4444",
                                  ],
                                  borderWidth: 1,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "right",
                                  labels: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    fontSize: "0.75rem",
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Tableau des demandes filtrées - Design Moderne */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 24,
                      background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                      borderRadius: 2,
                      mr: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    fontSize: { xs: "1rem", sm: "1.125rem" }
                  }}>
                    Liste des demandes
                  </Typography>
                </Box>

                <Paper
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: isDarkMode 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                  }}
                >
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: isDarkMode ? "#111827" : "#f8fafc" 
                        }}>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            ID
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Utilisateur
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Montant
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Méthode
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Statut
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Date
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRequestsArray.map((request) => (
                          <TableRow
                            key={request.id}
                            sx={{
                              backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                              "&:hover": {
                                backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                              },
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            <TableCell sx={{ 
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: isDarkMode ? "#ffffff" : "#111827",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              #{request.id}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              {request.user ? request.user.name : "Utilisateur inconnu"}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#3b82f6",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              ${request.amount?.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              {request.payment_method}
                            </TableCell>
                            <TableCell sx={{ 
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              <Chip
                                label={
                                  request.status === "pending" ? "En attente" :
                                  request.status === "approved" ? "Approuvé" :
                                  request.status === "rejected" ? "Rejeté" :
                                  request.status === "cancelled" ? "Annulé" :
                                  request.status === "failed" ? "Échoué" :
                                  request.status
                                }
                                color={
                                  request.status === "paid" ? "success" :
                                  request.status === "rejected" || request.status === "failed" ? "error" :
                                  request.status === "cancelled" ? "warning" :
                                  "default"
                                }
                                size="small"
                                sx={{ fontSize: "0.7rem", height: 24 }}
                              />
                            </TableCell>
                            <TableCell sx={{ 
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              {new Date(request.created_at).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell sx={{ 
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewRequest(request)}
                                  sx={{
                                    color: "#3b82f6",
                                    "&:hover": {
                                      backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                                    },
                                  }}
                                >
                                  <Visibility sx={{ fontSize: 16 }} />
                                </IconButton>
                                
                                {request.user_id === 1 && request.status === 'pending' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCancelClick(request)}
                                    disabled={isCancelling}
                                    sx={{
                                      color: "#f59e0b",
                                      "&:hover": {
                                        backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.05)",
                                      },
                                    }}
                                  >
                                    {isCancelling ? (
                                      <Box sx={{ 
                                        width: 16, 
                                        height: 16, 
                                        border: "2px solid #f59e0b",
                                        borderTop: "2px solid transparent",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite"
                                      }} />
                                    ) : (
                                      <Close sx={{ fontSize: 16 }} />
                                    )}
                                  </IconButton>
                                )}
                                
                                {request.status === 'failed' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRetryPayment(request)}
                                    sx={{
                                      color: "#10b981",
                                      "&:hover": {
                                        backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)",
                                      },
                                    }}
                                  >
                                    <ArrowPathIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
                <Paper>
                  <TableContainer>
                    <Table>
                      <TableHead
                        sx={{
                          backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                        }}
                      >
                        <TableRow>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            ID
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Utilisateur
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Montant
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Méthode de paiement
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Statut de traitement
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Date
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allRequests.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              sx={{
                                fontSize: "0.875rem",
                                color: isDarkMode ? "#d1d5db" : "#6b7280",
                                textAlign: "center",
                                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                              }}
                            >
                              Aucune demande trouvée
                            </TableCell>
                          </TableRow>
                        ) : (
                          allRequests.map((request) => (
                            <TableRow
                              key={request.id}
                              sx={{
                                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                                "&:hover": {
                                  backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                                },
                                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  color: isDarkMode ? "#ffffff" : "#111827",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.id}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.user
                                  ? request.user.name
                                  : "Utilisateur inconnu"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(request.amount)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.payment_method}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    request.status
                                  )}`}
                                >
                                  <span className="flex items-center">
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1">
                                      {request.status === "pending" &&
                                        "En attente"}
                                      {request.status === "processing" &&
                                        "En cours de traitement"}
                                      {request.status === "rejected" &&
                                        "Rejeté"}
                                      {request.status === "cancelled" &&
                                        "Annulé"}
                                      {request.status === "failed" && 
                                        "Échoué"}
                                      {request.status === "paid" && 
                                        "Payé"}
                                    </span>
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewRequest(request)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    <EyeIcon className="w-5 h-5" />
                                  </button>
                                  
                                  {/* Bouton annuler - seulement pour les demandes de l'utilisateur courant */}
                                  {request.user_id === 1 && request.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelClick(request)}
                                      disabled={isCancelling}
                                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                                      title="Annuler ma demande"
                                    >
                                      {isCancelling ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                                      ) : (
                                        <XMarkIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Bouton réessayer le paiement - seulement pour les demandes approuvées mais échouées */}
                                  {request.status === 'failed' && (
                                    <button
                                      onClick={() => handleRetryPayment(request)}
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                      title="Réessayer le paiement"
                                    >
                                      <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Pagination Material-UI pour l'onglet d'analyse complète */}
                <TablePagination
                  component="div"
                  count={totalAllRequests}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                  }
                  sx={{
                    color: isDarkMode ? "#fff" : "#475569",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "& .MuiTablePagination-toolbar": {
                      minHeight: { xs: "40px", sm: "52px" },
                      padding: { xs: "8px", sm: "16px" },
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                    "& .MuiTablePagination-selectIcon": {
                      color: isDarkMode ? "#fff" : "#475569",
                    },
                    "& .MuiTablePagination-select": {
                      backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                      borderRadius: 1,
                      padding: "4px 8px",
                      border: isDarkMode
                        ? "1px solid #374151"
                        : "1px solid #e2e8f0",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                    "& .MuiTablePagination-actions button": {
                      color: isDarkMode ? "#fff" : "#475569",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                      },
                    },
                  }}
                />
              </Box>
            </>
          )}
        </div>
      )}

      {/* Modal de détails de la demande - Design Moderne */}
      <Dialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "95vh",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
            background: isDarkMode 
              ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
            mx: { xs: 1, sm: 2 }, // Marges optimisées pour mobile
          },
        }}
        transitionDuration={{
          enter: 300,
          exit: 200,
        }}
      >
        {selectedRequest && (
          <>
            {/* Header moderne avec gradient */}
            <DialogTitle
              sx={{
                background: isDarkMode 
                  ? "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 0,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
                },
              }}
            >
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                p: { xs: 2, sm: 3 }, // Padding réduit pour mobile
                position: "relative",
                zIndex: 1,
                width: "100%"
              }}>
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "50%",
                    p: { xs: 1, sm: 1.5 }, // Padding adaptatif
                    mr: { xs: 1.5, sm: 2.5 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Visibility sx={{ 
                    fontSize: { xs: 20, sm: 24 }, // Taille adaptative
                    color: "#ffffff" 
                  }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      fontSize: { xs: "1.1rem", sm: "1.25rem" } // Taille adaptative
                    }}
                  >
                    Demande #{selectedRequest.id}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      fontWeight: 500
                    }}
                  >
                    Détails complets
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSelectedRequest(null)}
                  size="small"
                  sx={{
                    color: "rgba(255, 255, 255, 0.9)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                    p: { xs: 1, sm: 1.5 } // Padding adaptatif
                  }}
                >
                  <Close sx={{ 
                    fontSize: { xs: 18, sm: 20 } 
                  }} />
                </IconButton>
              </Box>
            </DialogTitle>

            {/* Contenu moderne */}
            <DialogContent sx={{ 
              p: 0, 
              backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
              maxHeight: "calc(95vh - 180px)",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: isDarkMode ? "#374151" : "#f1f5f9",
              },
              "&::-webkit-scrollbar-thumb": {
                background: isDarkMode ? "#6b7280" : "#cbd5e1",
                borderRadius: "3px",
              },
            }}>
              {/* Carte d'informations principales */}
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                      : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: 3,
                    p: { xs: 2, sm: 2.5 },
                    mb: { xs: 2, sm: 2.5 },
                    border: `1px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
                    boxShadow: isDarkMode 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    mb: { xs: 2, sm: 2.5 },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: { xs: "1rem", sm: "1.125rem" }
                  }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        borderRadius: 2,
                      }}
                    />
                    Informations essentielles
                  </Typography>
                  
                  <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? "#9ca3af" : "#64748b",
                          mb: { xs: 0.5, sm: 0.75 },
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          letterSpacing: "0.05em",
                        }}>
                          ID
                        </Typography>
                        <Typography sx={{ 
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontWeight: 700,
                          fontSize: { xs: "1rem", sm: "1.125rem" },
                        }}>
                          #{selectedRequest.id}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? "#9ca3af" : "#64748b",
                          mb: { xs: 0.5, sm: 0.75 },
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          letterSpacing: "0.05em",
                        }}>
                          Montant
                        </Typography>
                        <Typography sx={{ 
                          color: isDarkMode ? "#10b981" : "#059669",
                          fontWeight: 700,
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}>
                          {selectedRequest.amount} $
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? "#9ca3af" : "#64748b",
                          mb: { xs: 0.5, sm: 0.75 },
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          letterSpacing: "0.05em",
                        }}>
                          Statut
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getStatusIcon(selectedRequest.status)}
                          <Chip
                            label={
                              selectedRequest.status === "pending"
                                ? "En attente"
                                : selectedRequest.status === "approved"
                                ? "Approuvé"
                                : selectedRequest.status === "rejected"
                                ? "Rejeté"
                                : selectedRequest.status === "cancelled"
                                ? "Annulé"
                                : selectedRequest.status === "failed"
                                ? "Échoué"
                                : selectedRequest.status === "paid"
                                ? "Payé"
                                : selectedRequest.status
                            }
                            color={
                              selectedRequest.status === "paid"
                                ? "success"
                                : selectedRequest.status === "rejected" ||
                                  selectedRequest.status === "failed"
                                ? "error"
                                : selectedRequest.status === "cancelled"
                                ? "warning"
                                : "default"
                            }
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Carte des détails supplémentaires */}
                <Box
                  sx={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                      : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: 3,
                    p: 2.5,
                    mb: 2.5,
                    border: `1px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
                    boxShadow: isDarkMode 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    mb: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        borderRadius: 2,
                      }}
                    />
                    Informations détaillées
                  </Typography>
                  
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography sx={{ 
                              color: isDarkMode ? "#9ca3af" : "#64748b",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                            }}>
                              👤
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                          }}>
                            Utilisateur
                          </Typography>
                        </Box>
                        <Typography sx={{ 
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}>
                          {selectedRequest.user?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography sx={{ 
                              color: isDarkMode ? "#9ca3af" : "#64748b",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                            }}>
                              💳
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                          }}>
                            Méthode
                          </Typography>
                        </Box>
                        <Typography sx={{ 
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}>
                          {selectedRequest.payment_method || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ 
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        borderRadius: 2,
                        p: 2,
                        border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode 
                            ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                            : "0 8px 25px rgba(0, 0, 0, 0.1)",
                        }
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                          <Box
                            sx={{
                              backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                              borderRadius: "50%",
                              p: 1,
                              mr: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography sx={{ 
                              color: isDarkMode ? "#9ca3af" : "#64748b",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                            }}>
                              📅
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: isDarkMode ? "#9ca3af" : "#64748b",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                          }}>
                            Date
                          </Typography>
                        </Box>
                        <Typography sx={{ 
                          color: isDarkMode ? "#ffffff" : "#1e293b",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}>
                          {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Carte des métadonnées */}
                {selectedRequest.payment_details && (
                  <Box
                    sx={{
                      background: isDarkMode 
                        ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                        : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderRadius: 3,
                      p: 2.5,
                      mb: 2.5,
                      border: `1px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
                      boxShadow: isDarkMode 
                        ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      color: isDarkMode ? "#ffffff" : "#1e293b",
                      mb: 2.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}>
                      <Box
                        sx={{
                          width: 4,
                          height: 24,
                          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          borderRadius: 2,
                        }}
                      />
                      Métadonnées de paiement
                    </Typography>
                    
                    <Box sx={{ 
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      borderRadius: 2,
                      p: 2.5,
                      border: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)",
                      }
                    }}>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#1e293b",
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                      }}>
                        {(() => {
                          try {
                            const details = typeof selectedRequest.payment_details === 'string' 
                              ? JSON.parse(selectedRequest.payment_details) 
                              : selectedRequest.payment_details;
                            
                            return Object.entries(details).map(([key, value]) => {
                              return (
                                <Box key={key} sx={{ mb: 1 }}>
                                  <Typography component="span" sx={{ 
                                    color: isDarkMode ? "#8b5cf6" : "#7c3aed",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                  }}>
                                    {key}:
                                  </Typography>
                                  <Typography component="span" sx={{ 
                                    color: isDarkMode ? "#10b981" : "#059669",
                                    ml: 1,
                                    fontSize: "0.875rem",
                                  }}>
                                    {value}
                                  </Typography>
                                </Box>
                              );
                            });
                          } catch (error) {
                            return selectedRequest.payment_details;
                          }
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Carte de note administrative */}
                <Box
                  sx={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                      : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: 3,
                    p: 2.5,
                    mb: 2.5,
                    border: `1px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
                    boxShadow: isDarkMode 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    mb: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                        borderRadius: 2,
                      }}
                    />
                    Note administrative
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ajouter une note administrative..."
                    sx={{
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        color: isDarkMode ? "#ffffff" : "#1e293b",
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: isDarkMode ? "#374151" : "#e2e8f0",
                          borderWidth: "2px",
                        },
                        '&:hover fieldset': {
                          borderColor: isDarkMode ? "#6b7280" : "#cbd5e1",
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: "#3b82f6",
                          borderWidth: "2px",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>

            {/* Actions modernes */}
            <DialogActions
              sx={{
                p: { xs: 2, sm: 3 },
                borderTop: `1px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
                background: isDarkMode 
                  ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 2 },
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleApproveRequest(selectedRequest.id)}
                      variant="contained"
                      disabled={isProcessing}
                      startIcon={<Check />}
                      sx={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        fontWeight: 600,
                        px: { xs: 2, sm: 2.5 },
                        py: { xs: 1.5, sm: 1.25 },
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        minWidth: { xs: "48px", sm: "auto" },
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
                        },
                        "&:disabled": {
                          background: isDarkMode ? "#374151" : "#e5e7eb",
                          color: isDarkMode ? "#9ca3af" : "#9ca3af",
                        },
                        transition: "all 0.2s ease-in-out",
                        "& .MuiButton-startIcon": {
                          display: { xs: "flex", sm: "none" },
                          margin: 0,
                        },
                        "& .MuiButton-endIcon": {
                          display: { xs: "flex", sm: "none" },
                          margin: 0,
                        },
                      }}
                    >
                      <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        {isProcessing ? "Traitement..." : "Approuver"}
                      </Box>
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(selectedRequest.id)}
                      variant="contained"
                      disabled={isProcessing}
                      startIcon={<Close />}
                      sx={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "#ffffff",
                        fontWeight: 600,
                        px: { xs: 2, sm: 2.5 },
                        py: { xs: 1.5, sm: 1.25 },
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        minWidth: { xs: "48px", sm: "auto" },
                        boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(239, 68, 68, 0.4)",
                        },
                        "&:disabled": {
                          background: isDarkMode ? "#374151" : "#e5e7eb",
                          color: isDarkMode ? "#9ca3af" : "#9ca3af",
                        },
                        transition: "all 0.2s ease-in-out",
                        "& .MuiButton-startIcon": {
                          display: { xs: "flex", sm: "none" },
                          margin: 0,
                        },
                      }}
                    >
                      <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        {isProcessing ? "Traitement..." : "Rejéter"}
                      </Box>
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'failed' && (
                  <Button
                    onClick={() => handleRetryPayment(selectedRequest, adminNote)}
                    variant="contained"
                    disabled={isRetryingPayment}
                    startIcon={<Save />}
                    sx={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "#ffffff",
                      fontWeight: 600,
                      px: { xs: 2, sm: 2.5 },
                      py: { xs: 1.5, sm: 1.25 },
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      minWidth: { xs: "48px", sm: "auto" },
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
                      },
                      "&:disabled": {
                        background: isDarkMode ? "#374151" : "#e5e7eb",
                        color: isDarkMode ? "#9ca3af" : "#9ca3af",
                      },
                      transition: "all 0.2s ease-in-out",
                      "& .MuiButton-startIcon": {
                        display: { xs: "flex", sm: "none" },
                        margin: 0,
                      },
                    }}
                  >
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      {isRetryingPayment ? "Requête en cours..." : "Réessayer le paiement"}
                    </Box>
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => setSelectedRequest(null)}
                  startIcon={<Close />}
                  sx={{
                    borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontWeight: 600,
                    px: { xs: 2, sm: 2.5 },
                    py: { xs: 1.5, sm: 1.25 },
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    minWidth: { xs: "48px", sm: "auto" },
                    borderWidth: "2px",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#374151" : "#f8fafc",
                      borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.2s ease-in-out",
                    "& .MuiButton-startIcon": {
                      display: { xs: "flex", sm: "none" },
                      margin: 0,
                    },
                  }}
                >
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    Fermer
                  </Box>
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Modal de confirmation d'annulation */}
      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => {
          setShowCancelConfirmation(false);
          setRequestToCancel(null);
        }}
        onConfirm={confirmCancelRequest}
        title="Annuler la demande de retrait"
        message={`Êtes-vous sûr de vouloir annuler votre demande de retrait de ${requestToCancel ? formatAmount(requestToCancel.amount) : ''} ? Cette action est irréversible.`}
        confirmText="Oui, annuler"
        cancelText="Non, garder"
        type="warning"
        isLoading={isCancelling}
      />
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
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

export default WithdrawalRequests;
