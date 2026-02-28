import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import axios from "axios";
import WithdrawalForm from "../../components/WithdrawalForm";
import VirtualPurchaseForm from "../../components/VirtualPurchaseForm";
import FundsTransferModal from "../../components/FundsTransferModal";
import TransactionsTable from "./components/TransactionsTable";
import WalletExportButtons from "./components/WalletExportButtons";
import { getOperationType } from "../../components/OperationTypeFormatter";
import FiltreParTypeOperationUser from "../../components/FiltreParTypeOperationUser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../../styles/tooltip.css";
import {
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { FaFilter, FaTimes, FaExchangeAlt, FaFileExcel } from "react-icons/fa";
import {
  Alert,
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const getStatusText = (status) => {
  switch (status) {
    case "active":
      return "Actif";
    case "pending":
      return "En attente";
    case "inactive":
      return "Inactif";
    default:
      return status;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Non disponible";

  try {
    // Si la date est déjà au format français avec heure (JJ/MM/AAAA HH:MM:SS)
    if (typeof dateString === "string" && dateString.includes("/")) {
      // Extraire seulement la partie date (JJ/MM/AAAA)
      const dateParts = dateString.split(" ");
      if (dateParts.length > 0) {
        return dateParts[0]; // Retourne seulement la partie date
      }
      return dateString;
    }

    // Essayer de créer une date valide
    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error("Date invalide:", dateString);
      return "Format de date invalide";
    }

    // Formater la date en français sans l'heure
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  } catch (error) {
    console.error("Erreur de formatage de date:", error, dateString);
    return "Erreur de date";
  }
};

// Drawer pour afficher les détails de transaction
const TransactionDetailsDrawer = () => (
  <Drawer
    anchor="right"
    open={showTransactionDetails}
    onClose={() => setShowTransactionDetails(false)}
    sx={{
      '& .MuiDrawer-paper': {
        width: 500,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderLeft: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
      },
    }}
  >
    {selectedTransaction && (
      <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
            Détails de la transaction
          </Typography>
          <IconButton onClick={() => setShowTransactionDetails(false)}>
            <CloseIcon sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }} />
          </IconButton>
        </Box>

        {/* Carte principale avec montant */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: selectedTransaction.flow === "out"
              ? isDarkMode
                ? "linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
              : isDarkMode
              ? "linear-gradient(135deg, #14532d 0%, #166534 100%)"
              : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: `1px solid ${selectedTransaction.flow === "out"
              ? isDarkMode ? '#7f1d1d' : '#fca5a5'
              : isDarkMode ? '#166534' : '#86efac'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: selectedTransaction.flow === "out"
                ? isDarkMode ? "#fca5a5" : "#991b1b"
                : isDarkMode ? "#86efac" : "#14532d"
              }}>
                {selectedTransaction.flow === "out" ? "Montant débité" : "Montant crédité"}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: selectedTransaction.flow === "out"
                ? isDarkMode ? "#fca5a5" : "#991b1b"
                : isDarkMode ? "#86efac" : "#14532d"
              }}>
                {selectedTransaction.flow === "out" ? "-" : "+"}
                {selectedTransaction.amount} $
              </Typography>
            </Box>
            <Chip
              label={selectedTransaction.status === "pending"
                ? "En attente"
                : selectedTransaction.status === "approved"
                ? "Approuvé"
                : selectedTransaction.status === "rejected"
                ? "Rejeté"
                : selectedTransaction.status === "completed"
                ? "Complété"
                : selectedTransaction.status === "failed"
                ? "Échouée"
                : selectedTransaction.status}
              size="small"
              color={selectedTransaction.status === "completed" ? "success" : 
                     selectedTransaction.status === "pending" ? "warning" :
                     selectedTransaction.status === "failed" ? "error" : "default"}
            />
          </Box>
        </Paper>

        {/* Informations principales */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, background: isDarkMode ? '#374151' : '#f9fafb' }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mb: 1 }}>
                ID de transaction
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: isDarkMode ? '#ffffff' : '#111827' }}>
                #{selectedTransaction.id}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, background: isDarkMode ? '#374151' : '#f9fafb' }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mb: 1 }}>
                Type de transaction
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: isDarkMode ? '#ffffff' : '#111827' }}>
                {getOperationType(selectedTransaction.type)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, background: isDarkMode ? '#374151' : '#f9fafb' }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mb: 1 }}>
                Date de la transaction
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: isDarkMode ? '#ffffff' : '#111827' }}>
                {formatDate(selectedTransaction.created_at)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, background: isDarkMode ? '#374151' : '#f9fafb' }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mb: 1 }}>
                Dernière mise à jour
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: isDarkMode ? '#ffffff' : '#111827' }}>
                {formatDate(selectedTransaction.updated_at)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Métadonnées */}
        {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
          <Paper sx={{ p: 3, background: isDarkMode ? '#374151' : '#f9fafb' }}>
            <Typography variant="h6" sx={{ mb: 2, color: isDarkMode ? '#ffffff' : '#111827' }}>
              Informations supplémentaires
            </Typography>
            {Object.entries(selectedTransaction.metadata).map(([key, value]) => {
              const frenchLabels = {
                withdrawal_request_id: "Identifiant de la demande de retrait",
                payment_method: "Méthode de paiement",
                montant_a_retirer: "Montant à retirer",
                fee_percentage: "Pourcentage de frais",
                frais_de_retrait: "Frais de retrait",
                frais_de_commission: "Frais de commission",
                montant_total_a_payer: "Montant total à payer",
                devise: "Dévise choisie pour le retrait",
                payment_details: "Détails du paiement",
                status: "Statut",
                source: "Source",
                type: "Type",
                amount: "Montant",
                currency: "Devise",
                description: "Description",
                reference: "Référence",
              };

              const label = frenchLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
              
              let formattedValue = value;
              if (key === "status" || key.endsWith("_status")) {
                if (value === "pending") formattedValue = "En attente";
                else if (value === "approved") formattedValue = "Approuvé";
                else if (value === "rejected") formattedValue = "Rejeté";
                else if (value === "cancelled" || value === "canceled") formattedValue = "Annulé";
                else if (value === "completed") formattedValue = "Complété";
                else if (value === "failed") formattedValue = "Échoué";
              }

              if (key === "amount" || key === "montant_a_retirer" || key === "frais_de_retrait" || 
                    key === "frais_de_commission" || key === "montant_total_a_payer" || key.includes("montant") || key.includes("amount")) {
                formattedValue = `${value} $`;
              }

              if (key === "fee_percentage" || key.includes("percentage") || key.includes("pourcentage")) {
                formattedValue = `${value} %`;
              }

              return (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: isDarkMode ? '#9ca3af' : '#6b7280', mb: 0.5 }}>
                    {label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', color: isDarkMode ? '#ffffff' : '#111827', wordBreak: 'break-word' }}>
                    {typeof formattedValue === "object" ? JSON.stringify(formattedValue, null, 2) : String(formattedValue)}
                  </Typography>
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    )}
  </Drawer>
);

export default function Wallets() {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF, selectedCurrency } = useCurrency();

  // Ignorer les erreurs d'extensions navigateur (content_script.js)
  useEffect(() => {
    const handleError = (event) => {
      // Ignorer les erreurs de content scripts d'extensions
      if (event.filename && event.filename.includes('content_script.js')) {
        event.preventDefault();
        console.warn('Erreur d\'extension ignorée:', event.message);
        return true;
      }
      return false;
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [natureFilter, setNatureFilter] = useState("internal");
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [transactions, setTransactions] = useState([]);
  const [transactionsUSD, setTransactionsUSD] = useState([]);
  const [transactionsCDF, setTransactionsCDF] = useState([]);
  const [userWallet, setuserWallet] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showVirtualPurchaseForm, setShowVirtualPurchaseForm] = useState(false);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(0); // Material-UI utilise 0-based
  const [rowsPerPage, setRowsPerPage] = useState(25); // Par défaut 25 éléments
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedPackForConversion, setSelectedPackForConversion] =
    useState(null);
  const [showPointsPerPack, setShowPointsPerPack] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState(0);
  const [selectedPackInfo, setSelectedPackInfo] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const exportMenuRef = useRef(null);

  // Styles CSS pour l'ascenseur personnalisé
  const scrollbarStyles = {
    ".custom-scrollbar::-webkit-scrollbar": {
      width: "8px",
    },
    ".custom-scrollbar::-webkit-scrollbar-track": {
      background: isDarkMode
        ? "rgba(55, 65, 81, 0.3)"
        : "rgba(229, 231, 235, 0.5)",
      borderRadius: "20px",
    },
    ".custom-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: isDarkMode
        ? "rgba(75, 85, 99, 0.8)"
        : "rgba(156, 163, 175, 0.8)",
      borderRadius: "20px",
      border: "2px solid transparent",
      backgroundClip: "padding-box",
    },
    ".dark .custom-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(75, 85, 99, 0.8)",
    },
    ".custom-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: isDarkMode
        ? "rgba(55, 65, 81, 0.9)"
        : "rgba(107, 114, 128, 0.9)",
    },
    ".dark .custom-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(55, 65, 81, 0.9)",
    },
    ".modal-scrollbar::-webkit-scrollbar": {
      width: "10px",
    },
    ".modal-scrollbar::-webkit-scrollbar-track": {
      background: isDarkMode
        ? "rgba(55, 65, 81, 0.5)"
        : "rgba(229, 231, 235, 0.7)",
      borderRadius: "10px",
    },
    ".modal-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: isDarkMode
        ? "rgba(75, 85, 99, 0.9)"
        : "rgba(156, 163, 175, 0.9)",
      borderRadius: "10px",
      border: "2px solid transparent",
      backgroundClip: "padding-box",
    },
    ".modal-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: isDarkMode
        ? "rgba(55, 65, 81, 1)"
        : "rgba(107, 114, 128, 1)",
    },
  };

  // Ajouter les styles au document
  useEffect(() => {
    const styleEl = document.createElement("style");
    let cssRules = "";

    Object.entries(scrollbarStyles).forEach(([selector, rules]) => {
      cssRules += `${selector} { `;
      Object.entries(rules).forEach(([property, value]) => {
        cssRules += `${property}: ${value}; `;
      });
      cssRules += "} ";
    });

    styleEl.textContent = cssRules;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions(true); // Premier chargement avec loading initial
  }, [selectedCurrency]);

  // Effet pour le debounce de la recherche (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Effet pour recharger les données lorsque les filtres changent (sauf recherche)
  useEffect(() => {
    setCurrentPage(0);
    fetchTransactions(false); // Pas de loading global pour les filtres
  }, [debouncedSearchQuery, statusFilter, flowFilter, natureFilter, typeFilter, dateFilter, selectedCurrency]);

  // Effet pour recharger les données lorsque la pagination change
  useEffect(() => {
    fetchTransactions(false);
  }, [currentPage, rowsPerPage]);

  const fetchWalletData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get("/api/userwallet/data");
      if (response.data.success) {
        setuserWallet(response.data.userWallet);

        setTransactions(response.data.data.data);
        setTotalTransactions(
          response.data.total_count || response.data.data.total
        );
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données du portefeuille:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchTransactions = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      setError(null);
      const params = {};

      // Pagination backend
      params.per_page = rowsPerPage;
      params.page = currentPage + 1; // Laravel pagination commence à 1

      // Ajouter les filtres de recherche
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== "all") params.status = statusFilter;
      if (natureFilter) params.nature = natureFilter;
      if (flowFilter !== "all") params.flow = flowFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (dateFilter.startDate) params.date_from = dateFilter.startDate;
      if (dateFilter.endDate) params.date_to = dateFilter.endDate;

      const response = await axios.get("/api/userwallet/data", { params });

      if (response.data.success) {
        setTransactions(response.data.data.data);
        setTotalTransactions(
          response.data.total_count || response.data.data.total
        );
      } else {
        console.error("Erreur lors du chargement des transactions:", response.data.message);
        setError(response.data.message || "Erreur lors du chargement des transactions");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
      setError("Erreur lors du chargement des transactions");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setTableLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchWalletData();
    fetchTransactions(false);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors de la recherche
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleFlowFilter = (e) => {
    setFlowFilter(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleNatureFilter = (e) => {
    setNatureFilter(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleDateFilter = (field) => (e) => {
    setDateFilter((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  // Fonctions d'exportation
  const exportCurrentPage = async () => {
    try {
      setExportLoading(true);
      
      // Préparer les données de la page actuelle
      const currentPageData = transactions.map(transaction => ({
        Référence: transaction.reference || '',
        Type: getOperationType(transaction.type) || '',
        Mouvement: transaction.flow === 'in' ? 'Entrée' : transaction.flow === 'out' ? 'Sortie' : transaction.flow === 'freeze' ? 'Blocage' : 'Déblocage',
        Montant: `${transaction.amount} $`,
        Frais: `${transaction.fee_amount} $`,
        Commission: `${transaction.commission_amount} $`,
        Statut: getStatusText(transaction.status) || '',
        Balance_avant: `${transaction.balance_before} $`,
        Balance_après: `${transaction.balance_after} $`,
        Traité_par : transaction.processor,
        Traité_le : formatDate(transaction.processed_at),
        Déscription : transaction.description,
        Raison : transaction.rejection_reason,
        Date: formatDate(transaction.created_at),
      }));

      if (transaction.metadata) {
        // Si les métadonnées sont déjà un objet

      }

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(currentPageData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions Page Actuelle');
      
      // Télécharger le fichier
      const fileName = `transactions_wallet_page_${currentPage + 1}_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Export de la page actuelle réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export de la page actuelle:', error);
      toast.error('Erreur lors de l\'export de la page actuelle');
    } finally {
      setExportLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "0,00";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportFiltered = async () => {
    try {
      setExportLoading(true);
      
      // Récupérer toutes les données filtrées depuis l'API
      const params = {
        export: 'all', // Indiquer au backend de retourner toutes les données filtrées
      };
      
      // Ajouter les filtres actifs
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (flowFilter !== 'all') params.nature = flowFilter;
      if (natureFilter) params.flow = natureFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (dateFilter.startDate) params.date_from = dateFilter.startDate;
      if (dateFilter.endDate) params.date_to = dateFilter.endDate;

      // Appeler l'API d'export
      const response = await axios.get('/api/userwallet/export', { 
        params,
        responseType: 'blob'
      });

      // Créer un URL pour le blob et télécharger
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_wallet_filtrees_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export des données filtrées réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export des données filtrées:', error);
      toast.error('Erreur lors de l\'export des données filtrées');
    } finally {
      setExportLoading(false);
    }
  };

  const exportAll = async () => {
    try {
      setExportLoading(true);
      
      // Récupérer toutes les transactions de l'utilisateur
      const params = {
        currency: selectedCurrency,
        export: 'all',
      };

      // Appeler l'API d'export
      const response = await axios.get('/api/userwallet/export', { 
        params,
        responseType: 'blob'
      });

      // Créer un URL pour le blob et télécharger
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_wallet_complet_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export de toutes les transactions réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export complet:', error);
      toast.error('Erreur lors de l\'export complet');
    } finally {
      setExportLoading(false);
    }
  };

  // Gestionnaires pour la pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  const getTransactionStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return isDarkMode
          ? "bg-green-900/50 text-green-300"
          : "bg-green-100 text-green-800";
      case "completed":
        return isDarkMode
          ? "bg-green-900/50 text-green-300"
          : "bg-green-100 text-green-800";
      case "pending":
        return isDarkMode
          ? "bg-yellow-900/50 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "failed":
        return isDarkMode
          ? "bg-red-900/50 text-red-300"
          : "bg-red-100 text-red-800";
      case "cancelled":
        return isDarkMode
          ? "bg-gray-900/50 text-gray-300"
          : "bg-gray-100 text-gray-800";
      default:
        return isDarkMode
          ? "bg-gray-900/50 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const handleWithdrawalClick = (walletId, available_balance) => {
    setSelectedWalletForWithdrawal({ id: walletId, available_balance });
    setShowWithdrawalForm(true);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleTransferButtonClick = () => {
    setShowTransferModal(true);
  };

  const handleVirtualPurchaseClick = () => {
    // Ouvrir le modal d'achat de virtuel
    setShowVirtualPurchaseForm(true);
  };

  // Fonction d'exportation Excel améliorée
  const exportToExcel = (exportAll = false) => {
    // Fermer le menu d'exportation
    setShowExportMenu(false);

    // Afficher un message si l'export concerne beaucoup de données
    if (exportAll && totalTransactions > 100) {
      toast.info(
        `Préparation de l'export de ${totalTransactions} transactions...`
      );
    }

    // Déterminer quelles données exporter (filtrées ou toutes)
    if (exportAll) {
      // Exporter toutes les transactions filtrées via le backend
      exportAllTransactions();
    } else {
      // Exporter les transactions de la page actuelle
      exportCurrentPageTransactions();
    }
  };

  // Exporter les transactions de la page actuelle
  const exportCurrentPageTransactions = () => {
    const dataToExport = transactions;

    // Formater les données pour l'export
    const formattedData = dataToExport.map((transaction) => {
      // Traduire le type en français
      const typeTraduction = getOperationType(transaction.type);
      // Traduire le statut en français
      const getStatusText = (status) =>
        status === "pending"
          ? "en attente"
          : status === "processing"
          ? "En cours de traitement"
          : status === "failed"
          ? "echoué"
          : status === "reversed"
          ? "annulé"
          : status === "completed"
          ? "Complété"
          : status;

      // Formater les métadonnées pour une meilleure lisibilité
      let formattedMetadata = "";
      if (transaction.metadata) {
        try {
          // Si les métadonnées sont déjà un objet
          if (typeof transaction.metadata === "object") {
            // Parcourir les propriétés et les formater
            formattedMetadata = Object.entries(transaction.metadata)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | ");
          } else {
            // Si les métadonnées sont une chaîne JSON
            const parsed = JSON.parse(transaction.metadata);
            formattedMetadata = Object.entries(parsed)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | ");
          }
        } catch (error) {
          formattedMetadata = transaction.metadata;
        }
      }

      // Formater le montant avec le signe et la devise
      const montantFormate = (transaction.mouvment === "in" ? "+" : "-") + 
                             parseFloat(transaction.amount).toFixed(2) + 
                             (selectedCurrency === "USD" ? " $" : " FC");

      // Retourner l'objet formaté avec des en-têtes en français
      return {
        Type: typeTraduction,
        Montant: montantFormate,
        Statut: getStatusText(transaction.status),
        "Date de création": new Date(transaction.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        "Méthode de paiement": transaction.metadata?.["Méthode de paiement"] || "-",
        Métadonnées: formattedMetadata,
      };
    });

    // Créer la feuille Excel
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 15 }, // Type
      { wch: 12 }, // Montant
      { wch: 15 }, // Statut
      { wch: 20 }, // Date de création
      { wch: 50 }, // Métadonnées
    ];
    worksheet["!cols"] = columnWidths;

    // Ajouter des informations supplémentaires en haut de la feuille
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          `Exporté le ${new Date().toLocaleDateString(
            "fr-FR"
          )} à ${new Date().toLocaleTimeString("fr-FR")}`,
        ],
        [
          `Filtres appliqués: ${
            statusFilter !== "all"
              ? `Statut: ${getStatusText(statusFilter)}`
              : "Tous les statuts"
          }, ${
            typeFilter !== "all"
              ? `Type: ${
                  getOperationType(typeFilter)
                }`
              : "Tous les types"
          }, ${`Nature: ${
                  natureFilter
                }`
          }, ${
            flowFilter !== "all"
              ? `Type: ${
                  getOperationType(flowFilter)
                }`
              : "Tous les mouvements"
          }`,
        ],
        [
          `Période: ${
            dateFilter.startDate
              ? `Du ${dateFilter.startDate} au ${dateFilter.endDate}`
              : "Toutes dates"
          }`,
        ],
        [`Recherche: ${searchQuery ? `"${searchQuery}"` : "Aucune"}`],
        [`Nombre de transactions: ${formattedData.length}`],
        [""], // Ligne vide pour séparer les en-têtes des données
      ],
      { origin: -1 }
    );

    // Créer le classeur et ajouter la feuille
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Générer le nom du fichier avec la date
    const now = new Date();
    const dateStr = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}`;
    const filename = `transactions_${dateStr}.xlsx`;

    // Exporter le fichier
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(dataBlob, filename);

    // Notification de succès
    toast.success(`${formattedData.length} transactions exportées avec succès`);
  };

  // Gestionnaire de clic à l'extérieur pour fermer le menu d'exportation
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target) &&
        !event.target.closest('button[title="Options d\'exportation Excel"]')
      ) {
        setShowExportMenu(false);
      }
    }

    // Ajouter l'écouteur d'événement lorsque le menu est ouvert
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Drawer pour afficher les détails de transaction
  const TransactionDetailsDrawer = () => (
    <Drawer
      anchor="right"
      open={showTransactionDetails}
      onClose={() => setShowTransactionDetails(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 540,
          background: isDarkMode 
            ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' 
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderLeft: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {selectedTransaction && (
        <Box sx={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
          {/* Header moderne */}
          <Box 
            sx={{
              p: 4,
              background: selectedTransaction.flow === "out"
                ? isDarkMode
                  ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
                  : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                : isDarkMode
                ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
                : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Éléments décoratifs */}
            <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.05 }}>
              <Box sx={{ 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                background: selectedTransaction.flow === "out" 
                  ? isDarkMode ? '#ef4444' : '#dc2626'
                  : isDarkMode ? '#10b981' : '#059669'
              }} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.03 }}>
              <Box sx={{ 
                width: 100, 
                height: 100, 
                borderRadius: '50%', 
                background: selectedTransaction.flow === "out" 
                  ? isDarkMode ? '#f87171' : '#ef4444'
                  : isDarkMode ? '#34d399' : '#10b981'
              }} />
            </Box>
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Barre supérieure */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: selectedTransaction.flow === "out"
                      ? isDarkMode 
                        ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                        : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      : isDarkMode
                      ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                      }}
                    >
                      {selectedTransaction.flow === "out" ? "-" : "+"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: '1.1rem'
                      }}
                    >
                      {selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze"  ? "Débit" : "Crédit"}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '0.875rem'
                      }}
                    >
                      {getOperationType(selectedTransaction.type)}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton 
                  onClick={() => setShowTransactionDetails(false)}
                  sx={{
                    width: 40,
                    height: 40,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '10px',
                    '&:hover': {
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CloseIcon sx={{ 
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '1.2rem'
                  }} />
                </IconButton>
              </Box>
              
              {/* Carte montant améliorée */}
              <Box sx={{ 
                p: 3.5, 
                borderRadius: 3, 
                background: selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze" 
                  ? isDarkMode
                    ? "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)"
                  : isDarkMode
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(4, 120, 87, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
                border: `1px solid ${selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze"
                  ? isDarkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  : isDarkMode ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Ligne décorative */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze"
                    ? isDarkMode 
                      ? "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)"
                      : "linear-gradient(90deg, #ef4444 0%, #f87171 100%)"
                    : isDarkMode
                    ? "linear-gradient(90deg, #059669 0%, #10b981 100%)"
                    : "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 1.5, 
                        color: isDarkMode ? '#cbd5e1' : '#475569',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 500
                      }}
                    >
                      Montant total
                    </Typography>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 800, 
                        color: selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze"
                          ? isDarkMode ? '#f87171' : '#dc2626'
                          : isDarkMode ? '#34d399' : '#059669',
                        lineHeight: 1.1,
                        fontSize: '2.5rem',
                        mb: 2
                      }}
                    >
                      {selectedTransaction.amount} $
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={selectedTransaction.status === "pending"
                        ? "En attente"
                        : selectedTransaction.status === "approved"
                        ? "Approuvé"
                        : selectedTransaction.status === "rejected"
                        ? "Rejeté"
                        : selectedTransaction.status === "completed"
                        ? "Complété"
                        : selectedTransaction.status === "failed"
                        ? "Échouée"
                        : selectedTransaction.status}
                      size="medium"
                      sx={{
                        background: selectedTransaction.status === "completed" 
                          ? isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'
                          : selectedTransaction.status === "pending" 
                          ? isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)'
                          : selectedTransaction.status === "failed" || selectedTransaction.status === "rejected"
                          ? isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                          : isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                        color: selectedTransaction.status === "completed" 
                          ? isDarkMode ? '#4ade80' : '#16a34a'
                          : selectedTransaction.status === "pending" 
                          ? isDarkMode ? '#fbbf24' : '#d97706'
                          : selectedTransaction.status === "failed" || selectedTransaction.status === "rejected"
                          ? isDarkMode ? '#f87171' : '#dc2626'
                          : isDarkMode ? '#cbd5e1' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${selectedTransaction.status === "completed" 
                          ? isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'
                          : selectedTransaction.status === "pending" 
                          ? isDarkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)'
                          : selectedTransaction.status === "failed" || selectedTransaction.status === "rejected"
                          ? isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
                          : isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                        '& .MuiChip-label': {
                          px: 2,
                          py: 0.5
                        }
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Informations secondaires */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  pt: 2,
                  borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                }}>
                  <Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Identifiant de transaction
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDarkMode ? '#e2e8f0' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      #{selectedTransaction.id}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Date
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDarkMode ? '#e2e8f0' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      {formatDate(selectedTransaction.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Contenu principal */}
          <Box sx={{ p: 3 }}>
            {/* Informations essentielles */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box sx={{ 
                  width: 4, 
                  height: 20, 
                  borderRadius: 2,
                  background: selectedTransaction.flow === "out" || selectedTransaction.flow === "freeze"
                    ? isDarkMode ? '#dc2626' : '#ef4444'
                    : isDarkMode ? '#059669' : '#10b981'
                }} />
                Informations de la transaction
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDarkMode 
                          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Date de création
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {formatDate(selectedTransaction.created_at)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDarkMode 
                          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Dernière mise à jour
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {formatDate(selectedTransaction.updated_at)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Détails du traitement */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box sx={{ 
                  width: 4, 
                  height: 20, 
                  borderRadius: 2,
                  background: isDarkMode ? '#3b82f6' : '#2563eb'
                }} />
                Détails du traitement
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Traité par
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {selectedTransaction.processor || 'Non spécifié'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Date de traitement
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {selectedTransaction.processed_at ? formatDate(selectedTransaction.processed_at) : 'Non traité'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Informations additionnelles */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box sx={{ 
                  width: 4, 
                  height: 20, 
                  borderRadius: 2,
                  background: isDarkMode ? '#8b5cf6' : '#7c3aed'
                }} />
                Informations additionnelles
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Flow
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {selectedTransaction.flow === 'in' ? 'Entrée' : 
                       selectedTransaction.flow === 'out' ? 'Sortie' : 
                       selectedTransaction.flow === 'freeze' ? 'Blocage' : 
                       selectedTransaction.flow === 'unfreeze' ? 'Déblocage' : 'Inconnu'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Session
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem',
                        wordBreak: 'break-all'
                      }}
                    >
                      {selectedTransaction.session_id || 'Aucune'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      background: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                        mb: 1,
                        display: 'block'
                      }}
                    >
                      Description
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDarkMode ? '#ffffff' : '#111827',
                        fontSize: '0.95rem'
                      }}
                    >
                      {selectedTransaction.description || 'Aucune description'}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedTransaction.rejection_reason && (
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: 2.5, 
                        background: isDarkMode ? '#1e293b' : '#fef2f2',
                        border: `1px solid ${isDarkMode ? '#334155' : '#fecaca'}`,
                        borderRadius: 2
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: isDarkMode ? '#f87171' : '#dc2626',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.75rem',
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        Raison du rejet/échec
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          color: isDarkMode ? '#fca5a5' : '#991b1b',
                          fontSize: '0.95rem'
                        }}
                      >
                        {selectedTransaction.rejection_reason}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Métadonnées */}
            {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ 
                    width: 4, 
                    height: 20, 
                    borderRadius: 2,
                    background: isDarkMode ? '#f59e0b' : '#d97706'
                  }} />
                  Métadonnées
                </Typography>
                <Paper 
                  sx={{ 
                    p: 3, 
                    background: isDarkMode ? '#1e293b' : '#f8fafc',
                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    borderRadius: 2
                  }}
                >
                  {Object.entries(selectedTransaction.metadata).map(([key, value]) => {
                    const frenchLabels = {
                      withdrawal_request_id: "Identifiant de la demande de retrait",
                      payment_method: "Méthode de paiement",
                      montant_a_retirer: "Montant à retirer",
                      fee_percentage: "Pourcentage de frais",
                      frais_de_retrait: "Frais de retrait",
                      frais_de_commission: "Frais de commission",
                      montant_total_a_payer: "Montant total à payer",
                      devise: "Dévise choisie pour le retrait",
                      payment_details: "Détails du paiement",
                      status: "Statut",
                      source: "Source",
                      type: "Type",
                      amount: "Montant",
                      currency: "Devise",
                      description: "Description",
                      reference: "Référence",
                    };

                    const label = frenchLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                    
                    let formattedValue = value;
                    if (key === "status" || key.endsWith("_status")) {
                      if (value === "pending") formattedValue = "En attente";
                      else if (value === "approved") formattedValue = "Approuvé";
                      else if (value === "rejected") formattedValue = "Rejeté";
                      else if (value === "cancelled" || value === "canceled") formattedValue = "Annulé";
                      else if (value === "completed") formattedValue = "Complété";
                      else if (value === "failed") formattedValue = "Échoué";
                    }

                    if (key === "amount" || key === "montant_a_retirer" || key === "frais_de_retrait" || 
                          key === "frais_de_commission" || key === "montant_total_a_payer" || key.includes("montant") || key.includes("amount")) {
                      formattedValue = `${value} $`;
                    }

                    if (key === "fee_percentage" || key.includes("percentage") || key.includes("pourcentage")) {
                      formattedValue = `${value} %`;
                    }

                    return (
                      <Box key={key} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '0.75rem',
                            mb: 0.5,
                            display: 'block'
                          }}
                        >
                          {label}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600, 
                            color: isDarkMode ? '#ffffff' : '#111827',
                            fontSize: '0.95rem',
                            wordBreak: 'break-word'
                          }}
                        >
                          {typeof formattedValue === "object" ? JSON.stringify(formattedValue, null, 2) : String(formattedValue)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Paper>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-4 sm:mb-6"
      >
        <h5 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
          Mon portefeuille
        </h5>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <ArrowPathIcon
            className={`h-4 w-4 sm:h-5 sm:w-5 ${(initialLoading || tableLoading) ? "animate-spin" : ""}`}
          />
        </motion.button>
      </motion.div>

      {/* Portefeuilles */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 sm:gap-6">
        {/* Portefeuille utilisateur */}
        {userWallet && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-4 sm:p-6 rounded-xl shadow-xl ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
            }`}
          >
            <div className="space-y-6">
              {/* Header principal avec icône et titre */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-xl">
                      <WalletIcon className="h-7 w-7 text-white" />
                    </div>
                    {userWallet.is_active ? 
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" /> 
                      : <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                    }
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold bg-gradient-to-r ${
                        isDarkMode
                          ? "from-blue-400 to-purple-400 text-transparent bg-clip-text"
                          : "from-blue-600 to-purple-600 text-transparent bg-clip-text"
                      }`}
                    >
                      Portefeuille Personnel
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Gérez vos fonds intelligemment
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerte si le wallet est désactivé */}
              {!userWallet.is_active && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                        Portefeuille désactivé
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Votre portefeuille est actuellement désactivé. Vous ne pouvez pas effectuer de transactions pour le moment. Veuillez contacter le support pour plus d'informations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grille de sous-cartes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Carte principale - Balance */}
                <div className="lg:col-span-2">
                  <div
                    className={`p-6 rounded-2xl border shadow-xl ${
                      isDarkMode
                        ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50"
                        : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50"
                    }`}
                  >
                    {/* Header de la carte */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                          <BanknotesIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4
                            className={`text-lg font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Balance Principale
                          </h4>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Solde total disponible
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Montant principal */}
                    <div className="mb-6">
                      <p
                        className={`text-4xl font-bold bg-gradient-to-r bg-clip-text ${
                          isDarkMode
                            ? "from-blue-400 to-purple-400 text-transparent"
                            : "from-blue-600 to-purple-600 text-transparent"
                        }`}
                      >
                        {formatAmount(userWallet.balance)}
                      </p>
                      <p
                        className={`text-sm mt-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Dollars Américains (USD)
                      </p>
                    </div>

                    {/* Mini statistiques */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`p-3 rounded-xl border ${
                          isDarkMode
                            ? "bg-gray-800/50 border-gray-700/50"
                            : "bg-gray-50 border-gray-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Disponibles
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            isDarkMode ? "text-green-400" : "text-green-600"
                          }`}
                        >
                          {formatAmount(userWallet.available_balance)}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDarkMode
                            ? "bg-gray-800/50 border-gray-700/50"
                            : "bg-gray-50 border-gray-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Gelés
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            isDarkMode ? "text-red-400" : "text-red-600"
                          }`}
                        >
                          {formatAmount(userWallet.frozen_balance)}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDarkMode
                            ? "bg-gray-800/50 border-gray-700/50"
                            : "bg-gray-50 border-gray-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Points
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold ${
                            isDarkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                        >
                          {formatAmount(userWallet.points)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte secondaire - Transactions */}
                <div className="space-y-4">
                  <div
                    className={`rounded-2xl border shadow-xl ${
                      isDarkMode
                        ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50"
                        : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <div className="ml-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </div>
                      <div>
                        <h4
                          className={`text-lg font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Entrées
                        </h4>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <p
                        className={`text-3xl font-bold ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {formatAmount(userWallet.total_in)}
                      </p>
                      <p
                        className={`text-sm mt-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Total reçu
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border shadow-xl p-1 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50"
                        : "bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="ml-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      </div>
                      <div>
                        <h4
                          className={`text-lg font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Sorties
                        </h4>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <p
                        className={`text-3xl font-bold ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        {formatAmount(userWallet.total_out)} 
                      </p>
                      <p
                        className={`text-sm mt-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Total dépensé
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 sm:mt-8 flex justify-center space-x-3 sm:space-x-4">
              <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                <button
                  onClick={() => handleWithdrawalClick(userWallet.id, userWallet.available_balance)}
                  disabled={!userWallet.is_active}
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    !userWallet.is_active
                      ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                      : isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-blue-500"
                      : "border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500"
                  }`}
                >
                  <BanknotesIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <span className="tooltip-text">Faire un retrait</span>
              </div>

              <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                <button
                  onClick={handleVirtualPurchaseClick}
                  disabled={!userWallet.is_active}
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    !userWallet.is_active
                      ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                      : isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-green-500"
                      : "border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-600 hover:border-green-500"
                  }`}
                >
                  <CurrencyDollarIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <span className="tooltip-text">Acheter du virtuel</span>
              </div>

              <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                <button
                  onClick={handleTransferButtonClick}
                  disabled={!userWallet.is_active}
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    !userWallet.is_active
                      ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                      : isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-purple-500"
                      : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-500"
                  }`}
                >
                  <FaExchangeAlt className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <span className="tooltip-text">Transférer des fonds</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Historique des transactions */}
      <div
        className={`mt-6 sm:mt-10 rounded-xl shadow-xl overflow-hidden border ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
        }`}
      >
        <div className="p-3 sm:p-4">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            {/* Titre et boutons de contrôle */}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <h2
                  className={`text-base sm:text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Historique des transactions
                </h2>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 shadow-sm ${
                    showFilters
                      ? isDarkMode
                        ? "bg-gray-700 text-blue-400 ring-1 ring-blue-500"
                        : "bg-blue-50 text-blue-600 ring-1 ring-blue-500"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={
                    showFilters ? "Masquer les filtres" : "Afficher les filtres"
                  }
                >
                  {showFilters ? (
                    <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                
                {/* Bouton d'exportation */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                      exportLoading
                        ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                        : isDarkMode
                        ? 'bg-green-600/10 border-green-500/30 text-green-400 hover:bg-green-600/20 hover:border-green-500/50'
                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300'
                    }`}
                    disabled={exportLoading}
                    title="Exporter les transactions"
                  >
                    {exportLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {exportLoading ? 'Export...' : 'Exporter'}
                    </span>
                    <svg className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Menu déroulant d'exportation */}
                  {showExportMenu && !exportLoading && (
                    <div className={`absolute right-0 mt-2 w-72 rounded-lg shadow-xl border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    } z-50 overflow-hidden`}
                         ref={exportMenuRef}>
                      <div className="p-2">
                        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Options d'exportation
                        </div>
                        
                        <button
                          onClick={() => {
                            exportCurrentPageTransactions();
                            setShowExportMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-4h.01M12 12h.01M12 16h.01M9 12h.01M9 16h.01" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Page actuelle</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Exporter les {rowsPerPage} transactions affichées
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            exportFiltered();
                            setShowExportMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDarkMode ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Données filtrées</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Exporter avec les filtres actifs
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            exportAll();
                            setShowExportMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Toutes les données</div>
                            <div className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Exporter tout l'historique
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
               </div>
            </div>

            {/* Champ de recherche */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par référence"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-2 pl-10 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors`}
                />
                <svg
                  className={`absolute left-3 top-2.5 w-5 h-5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filtres */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-b py-4 mt-2 border-gray-200 dark:border-gray-700"
              >
                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="failed">Echoué</option>
                    <option value="completed">complété</option>
                    <option value="reversed">Annulé</option>
                    <option value="processing">En cours</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nature
                  </label>
                  <select
                    value={natureFilter}
                    onChange={handleNatureFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="internal">Interne</option>
                    <option value="external">Externe</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Mouvement
                  </label>
                  <select
                    value={flowFilter}
                    onChange={handleFlowFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous</option>
                    <option value="in">Entrées</option>
                    <option value="out">Sorties</option>
                    <option value="freeze">Blocage</option>
                    <option value="unfreeze">Déblocage</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Type
                  </label>
                  <FiltreParTypeOperationUser
                    value={typeFilter}
                    onChange={handleTypeFilter}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Période
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={handleDateFilter("startDate")}
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                      } transition-all duration-200`}
                    />
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={handleDateFilter("endDate")}
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                      } transition-all duration-200`}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tableau des transactions avec composant séparé */}
          <TransactionsTable
            transactions={transactions}
            loading={tableLoading}
            error={error}
            totalTransactions={totalTransactions}
            currentPage={currentPage}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onTransactionClick={handleTransactionClick}
            selectedCurrency={selectedCurrency}
            isDarkMode={isDarkMode}
            formatDate={formatDate}
            getTransactionStatusColor={getTransactionStatusColor}
          />
        </div>
      </div>

      {/* Drawer pour afficher les détails de transaction */}
      <TransactionDetailsDrawer />

      {/* Modal de retrait */}
      {showWithdrawalForm &&
        createPortal(
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
            onClick={() => setShowWithdrawalForm(false)}
          >
            <div
              className={`max-w-md w-full relative z-[51] ${
                isDarkMode ? "shadow-2xl" : "shadow-xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <WithdrawalForm
                walletId={selectedWalletForWithdrawal?.id}
                available_balance={selectedWalletForWithdrawal?.available_balance || 0}
                onClose={() => setShowWithdrawalForm(false)}
                onSuccess={() => {
                  // Mettre à jour les données du portefeuille après un retrait réussi
                  // Utiliser un petit délai pour éviter les interférences avec la fermeture du modal
                  setTimeout(() => {
                    fetchWalletData();
                    fetchTransactions();
                  }, 100);
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Modal de transfert de fonds */}
      <FundsTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleRefresh}
        available_balance={userWallet?.available_balance || 0}
        userInfo={user}
        isAdmin={false}
      />

      {/* Modal d'achat de virtuel */}
      {showVirtualPurchaseForm &&
        createPortal(
          <VirtualPurchaseForm
            onClose={() => {
              setShowVirtualPurchaseForm(false);
              // Rafraîchir les données du wallet après un achat réussi
              fetchWalletData();
            }}
          />,
          document.body
        )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        zIndex={9999}
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}
