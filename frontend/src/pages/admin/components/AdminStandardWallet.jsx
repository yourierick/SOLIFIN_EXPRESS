/* Dashboard pour les utilisateurs admin non super-admin */

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import axios from "axios";
import Notification from "../../../components/Notification";
import WithdrawalForm from "../../../components/WithdrawalForm";
import FundsTransferModal from "../../../components/FundsTransferModal";
import AdminTransactionsTable from "./AdminTransactionsTable";
import AdminExportButtons from "./AdminExportButtons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../../../styles/tooltip.css";
import "../../../styles/custom-scrollbar.css";
import {
  Alert,
} from "@mui/material";

// Import des icônes Heroicons
import {
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Import des icônes FontAwesome
import {
  FaFilter,
  FaTimes,
  FaFileExcel,
  FaCheckCircle,
  FaTags,
  FaCalendarAlt,
  FaExchangeAlt,
  FaUser,
  FaWallet,
  FaMoneyBillWave,
  FaHistory,
} from "react-icons/fa";

export default function AdminStandardWallet() {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF, selectedCurrency } = useCurrency();
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [transactions, setTransactions] = useState([]);
  const [userWallet, setuserWallet] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(0); // Material-UI utilise 0-based
  const [rowsPerPage, setRowsPerPage] = useState(25); // Par défaut 25 éléments
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  // Fonction pour formater les dates (sans l'heure)
  const formatDate = (dateString) => {
    try {
      // Si la chaîne est vide ou null, retourner une valeur par défaut
      if (!dateString) {
        return "Non définie";
      }

      // Si la date est déjà au format français (JJ/MM/AAAA ou JJ-MM-AAAA), la retourner telle quelle
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateString)) {
        // Normaliser le format pour utiliser des slashes
        return dateString.replace(/-/g, "/");
      }

      // Si c'est une date au format français avec heure (JJ/MM/AAAA HH:MM), extraire seulement la date
      if (
        /^\d{2}[\/\-]\d{2}[\/\-]\d{4} \d{2}:\d{2}(:\d{2})?$/.test(dateString)
      ) {
        // Extraire seulement la partie date (avant l'espace)
        return dateString.split(" ")[0].replace(/-/g, "/");
      }

      // Sinon, formater la date (format ISO ou timestamp)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return "Date invalide";
    }
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString) => {
    try {
      // Si la chaîne est vide ou null
      if (!dateString) {
        return "";
      }

      // Si c'est une date au format français avec heure (JJ/MM/AAAA HH:MM)
      if (
        /^\d{2}[\/\-]\d{2}[\/\-]\d{4} \d{2}:\d{2}(:\d{2})?$/.test(dateString)
      ) {
        // Extraire seulement la partie heure (après l'espace)
        return dateString.split(" ")[1].split(":").slice(0, 2).join(":");
      }

      // Sinon, formater l'heure à partir d'une date ISO ou timestamp
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `à ${hours}h${minutes}`;
    } catch (error) {
      console.error("Erreur lors du formatage de l'heure:", error);
      return "";
    }
  };

  // Fonction pour tronquer le texte
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Fonction pour obtenir la couleur du statut de transaction
  const getTransactionStatusColor = (status) => {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-yellow-900/30 text-yellow-400"
          : "bg-yellow-100 text-yellow-800";
      case "approved":
      case "completed":
        return isDarkMode
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-800";
      case "rejected":
      case "failed":
        return isDarkMode
          ? "bg-red-900/30 text-red-400"
          : "bg-red-100 text-red-800";
      case "cancelled":
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-200 text-gray-700";
      default:
        return isDarkMode
          ? "bg-blue-900/30 text-blue-400"
          : "bg-blue-100 text-blue-800";
    }
  };

  // Effet pour fermer le menu d'exportation lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target) &&
        !event.target.closest('button[title="Exporter les transactions"]')
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
    fetchTransactions(true); // Premier chargement avec loading initial (met à jour userWallet et transactions)
  }, []);

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
  }, [debouncedSearchQuery, statusFilter, typeFilter, dateFilter, selectedCurrency]);

  // Effet pour recharger les données lorsque la pagination change
  useEffect(() => {
    fetchTransactions(false);
  }, [currentPage, rowsPerPage]);
  // Chargement des données
  // Fonction pour récupérer les données du portefeuille
  const fetchWalletData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get("/api/userwallet/data");
      if (response.data.success) {
        setuserWallet(response.data.userWallet);
        setTransactions(response.data.transactions || []);
      }
    } catch (err) {
      setError(err.message);
      toast.error("Erreur lors du chargement des données");
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
      if (typeFilter !== "all") params.type = typeFilter;
      if (dateFilter.startDate) params.date_from = dateFilter.startDate;
      if (dateFilter.endDate) params.date_to = dateFilter.endDate;
      params.currency = selectedCurrency;

      const response = await axios.get("/api/userwallet/data", { params });

      if (response.data.success) {
        setuserWallet(response.data.userWallet);
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

  // Gestion des filtres
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

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleDateFilter = (field) => (e) => {
    setDateFilter((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  // Gestionnaires pour la pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  // Fonctions d'exportation
  const exportCurrentPage = async () => {
    try {
      setExportLoading(true);
      
      // Préparer les données de la page actuelle
      const currentPageData = transactions.map(transaction => ({
        ID: transaction.id || '',
        Type: transaction.type || '',
        Montant: `${transaction.amount} ${selectedCurrency}`,
        Statut: transaction.status || '',
        Description: transaction.description || '',
        Date: formatDate(transaction.created_at),
        'Dernière mise à jour': formatDate(transaction.updated_at),
      }));

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
      if (typeFilter !== 'all') params.type = typeFilter;
      if (dateFilter.startDate) params.date_from = dateFilter.startDate;
      if (dateFilter.endDate) params.date_to = dateFilter.endDate;
      params.currency = selectedCurrency;

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

  // Exportation Excel
  const exportToExcel = (exportAll) => {
    // Afficher un message si l'export concerne beaucoup de données
    if (exportAll && totalTransactions > 100) {
      toast.info(
        `Préparation de l'export de ${totalTransactions} transactions...`
      );
    }

    // Déterminer quelles données exporter (filtrées ou toutes)
    if (exportAll) {
      // Exporter toutes les transactions filtrées via le backend
      exportFiltered();
    } else {
      // Exporter les transactions de la page actuelle
      exportCurrentPage();
    }
  };

  const exportAll = async () => {
    try {
      setExportLoading(true);
      
      // Récupérer toutes les données depuis l'API sans filtres
      const response = await axios.get('/api/userwallet/export', { 
        params: { export: 'all_data', currency: selectedCurrency },
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
      
      toast.success('Export de toutes les données réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export complet:', error);
      toast.error('Erreur lors de l\'export complet');
    } finally {
      setExportLoading(false);
    }
  };

  // Gestion des transactions
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleWithdrawalClick = (wallet) => {
    setSelectedWalletForWithdrawal(wallet);
    setShowWithdrawalForm(true);
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Une erreur est survenue: {error}
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
      {/* Portefeuille utilisateur */}
      <div className="mb-8">
        {userWallet ? (
          <>
            {/* Debug temporaire */}
            {console.log("userWallet dans AdminStandardWallet:", userWallet)}
            {console.log("balance_usd:", userWallet.balance_usd)}
            {console.log("balance_cdf:", userWallet.balance_cdf)}
            {console.log("selectedCurrency:", selectedCurrency)}
            <motion.div
            initial={{ opacity: 1, y: 20 }}
            transition={{ duration: 0.5 }}
            className={`p-4 sm:p-6 rounded-xl shadow-xl ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
            }`}
          >
            <div className="sm:flex-row sm:items-start sm:justify-between gap-6">
              {/* En-tête du wallet */}
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FaWallet className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Mon Portefeuille
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Gérez vos fonds en {selectedCurrency}
                  </p>
                </div>
              </div>

              {/* Informations de la devise sélectionnée */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1">
                {/* Carte de la devise sélectionnée */}
                <div
                  className={`p-4 rounded-xl border ${
                    selectedCurrency === "USD"
                      ? isDarkMode
                        ? "bg-blue-900/20 border-blue-700/30"
                        : "bg-blue-50 border-blue-200"
                      : isDarkMode
                      ? "bg-green-900/20 border-green-700/30"
                      : "bg-green-50 border-green-200"
                  }`}
                  style={{ border: "3px solid red !important", backgroundColor: "yellow !important" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`p-1.5 rounded-lg bg-gradient-to-br ${
                        selectedCurrency === "USD"
                          ? "from-blue-500 to-blue-600"
                          : "from-green-500 to-green-600"
                      }`}
                    >
                      <BanknotesIcon className="h-4 w-4 text-white" />
                    </div>
                    <h4
                      className={`text-sm font-semibold ${
                        selectedCurrency === "USD"
                          ? isDarkMode
                            ? "text-blue-300"
                            : "text-blue-700"
                          : isDarkMode
                          ? "text-green-300"
                          : "text-green-700"
                      }`}
                    >
                      {selectedCurrency === "USD" ? "Dollars Américains" : "Francs Congolais"}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Solde disponible
                      </p>
                      <p
                        className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                          selectedCurrency === "USD"
                            ? "from-blue-600 to-blue-700"
                            : "from-green-600 to-green-700"
                        }`}
                      >
                        {selectedCurrency === "USD"
                          ? `${userWallet.balance_usd} $`
                          : `${userWallet.balance_cdf} FC`}
                      </p>
                    </div>

                    <div
                      className={`grid grid-cols-2 gap-3 pt-2 border-t ${
                        selectedCurrency === "USD"
                          ? "border-blue-700/20"
                          : "border-green-700/20"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Total gagné
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            selectedCurrency === "USD"
                              ? isDarkMode
                                ? "text-blue-300"
                                : "text-blue-700"
                              : isDarkMode
                              ? "text-green-300"
                              : "text-green-700"
                          }`}
                        >
                          + {selectedCurrency === "USD"
                            ? `${userWallet.total_earned_usd} $`
                            : `${userWallet.total_earned_cdf} FC`}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Total retiré
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            isDarkMode ? "text-red-300" : "text-red-700"
                          }`}
                        >
                          - {selectedCurrency === "USD"
                            ? `${userWallet.total_withdrawn_usd} $`
                            : `${userWallet.total_withdrawn_cdf} FC`}
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
                    onClick={() => handleWithdrawalClick(userWallet)}
                    className={`p-2.5 sm:p-3 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-blue-500"
                        : "border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500"
                    }`}
                  >
                    <BanknotesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <span className="tooltip-text">Faire un retrait</span>
                </div>

                <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className={`p-2.5 sm:p-3 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-purple-500"
                        : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-500"
                    }`}
                  >
                    <FaExchangeAlt className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <span className="tooltip-text">Transférer des fonds</span>
                </div>
              </div>
            </div>
          </motion.div>
          </>
        ) : (
          <div
            className={`text-center p-8 rounded-lg ${
              isDarkMode
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <p>Aucun portefeuille disponible</p>
          </div>
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
                  Historique des transactions ({selectedCurrency})
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
                
                {/* Bouton d'exportation moderne */}
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
                            exportCurrentPage();
                            setShowExportMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-300' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Exporter la page actuelle
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Exporter les {transactions.length} transactions affichées
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
                            isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Exporter les données filtrées
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Exporter toutes les transactions correspondant aux filtres
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
                            isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Exporter toutes les données
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Exporter l'intégralité des transactions
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  } transition-all duration-200 focus:outline-none focus:ring-2`}
                />
              </div>
            </div>
          {/* Filtres */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaCheckCircle className="inline-block mr-1.5 text-blue-500" />
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Refusé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaTags className="inline-block mr-1.5 text-green-500" />
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={handleTypeFilter}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les types</option>
                    <option value="purchase">Achat</option>
                    <option value="virtual_purchase">Achat des virtuels</option>
                    <option value="sale">Vente</option>
                    <option value="withdrawal">Retrait</option>
                    <option value="commission de parrainage">
                      Commission de parrainage
                    </option>
                    <option value="commission de retrait">
                      Commission de retrait
                    </option>
                    <option value="remboursement">Remboursement</option>
                    <option value="transfer">Transfert</option>
                    <option value="reception">Réception</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaCalendarAlt className="inline-block mr-1.5 text-purple-500" />
                    Période
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={handleDateFilter("startDate")}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        } transition-all duration-200`}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={handleDateFilter("endDate")}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        } transition-all duration-200`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDateFilter({ startDate: "", endDate: "" });
                    setSearchQuery("");
                  }}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Réinitialiser les filtres</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

          {/* Tableau des transactions */}
          <div className="mt-4 pb-4">
            <AdminTransactionsTable
              transactions={transactions}
              loading={tableLoading}
              error={error}
              totalTransactions={totalTransactions}
              currentPage={currentPage}
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
      </div>
      {/* Modal de détails de transaction */}
      {showTransactionDetails &&
        selectedTransaction &&
        createPortal(
          <div
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className={`relative p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50"
                  : "bg-gradient-to-br from-white via-white to-gray-50 border-gray-200/50"
              }`}
            >
              {/* En-tête avec décoration */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/20">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedTransaction.mouvment === "out"
                        ? "bg-gradient-to-br from-red-500 to-red-600"
                        : "bg-gradient-to-br from-green-500 to-green-600"
                    }`}
                  >
                    {selectedTransaction.mouvment === "out" ? (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-bold bg-gradient-to-r ${
                        isDarkMode
                          ? "text-white from-blue-400 to-purple-400"
                          : "text-gray-900 from-blue-600 to-purple-600"
                      }`}
                    >
                      Détails de la transaction
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {selectedTransaction.type === "withdrawal"
                        ? "Retrait de fonds"
                        : selectedTransaction.type === "purchase"
                        ? "Achat de pack"
                        : selectedTransaction.type === "virtual_purchase"
                        ? "Achat virtuel"
                        : selectedTransaction.type === "transfer"
                        ? "Transfert des fonds"
                        : selectedTransaction.type === "reception"
                        ? "Réception des fonds"
                        : selectedTransaction.type === "digital_product_sale"
                        ? "Vente de produit numérique"
                        : selectedTransaction.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isDarkMode
                      ? "hover:bg-gray-700/50 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div
                className={`mb-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                } overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent`}
              >
                {/* Carte principale avec montant */}
                <div
                  className={`p-6 rounded-xl mb-6 ${
                    selectedTransaction.mouvment === "out"
                      ? isDarkMode
                        ? "bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/30"
                        : "bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/50"
                      : isDarkMode
                      ? "bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30"
                      : "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`text-sm font-medium mb-2 ${
                          selectedTransaction.mouvment === "out"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {selectedTransaction.mouvment === "out"
                          ? "Montant débité"
                          : "Montant crédité"}
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          selectedTransaction.mouvment === "out"
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {selectedTransaction.mouvment === "out" ? "-" : "+"}
                        {selectedTransaction.amount} {selectedCurrency === "USD" ? "$" : "FC"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getTransactionStatusColor(
                          selectedTransaction.status
                        )}`}
                      >
                        {selectedTransaction.status === "pending"
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
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-gray-50 border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-4 h-4 ${
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
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ID de transaction
                      </p>
                    </div>
                    <p
                      className={`font-mono font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      #{selectedTransaction.id}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-gray-50 border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-4 h-4 ${
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Type de transaction
                      </p>
                    </div>
                    <p
                      className={`font-medium capitalize ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {selectedTransaction.type === "withdrawal"
                        ? "retrait"
                        : selectedTransaction.type === "purchase"
                        ? "achat"
                        : selectedTransaction.type === "virtual_purchase"
                        ? "Virtuels"
                        : selectedTransaction.type === "transfer"
                        ? "Transfert des fonds"
                        : selectedTransaction.type === "reception"
                        ? "Réception des fonds"
                        : selectedTransaction.type === "digital_product_sale"
                        ? "Vente de produit numérique"
                        : selectedTransaction.type}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-gray-50 border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-4 h-4 ${
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date de la transaction
                      </p>
                    </div>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-gray-50 border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-4 h-4 ${
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Dernière mise à jour
                      </p>
                    </div>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatDate(selectedTransaction.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Métadonnées */}
                {selectedTransaction.metadata &&
                  Object.keys(selectedTransaction.metadata).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isDarkMode
                              ? "bg-gradient-to-br from-purple-600 to-purple-700"
                              : "bg-gradient-to-br from-purple-500 to-purple-600"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4
                          className={`text-lg font-semibold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Informations supplémentaires
                        </h4>
                      </div>
                      <div
                        className={`p-4 rounded-xl border ${
                          isDarkMode
                            ? "bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-gray-700/50"
                            : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50"
                        }`}
                      >
                        {Object.entries(selectedTransaction.metadata).map(
                          ([key, value]) => {
                            // Traduire les clés en français
                            const frenchLabels = {
                              withdrawal_request_id:
                                "Identifiant de la demande de retrait",
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
                            };

                            return (
                              <div
                                key={key}
                                className="flex justify-between items-center py-3 border-b border-gray-200/10 last:border-b-0"
                              >
                                <span
                                  className={`text-sm font-medium ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {frenchLabels[key] || key}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Pied de page */}
              <div className="flex justify-end pt-4 border-t border-gray-200/20">
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
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
                walletType={selectedWalletForWithdrawal?.type}
                onClose={() => setShowWithdrawalForm(false)}
              />
            </div>
          </div>,
          document.body
        )}
      {/* Modal de transfert de fonds */}
      <FundsTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={fetchWalletData}
        userWallet={userWallet}
        userInfo={null}
        isAdmin={true}
      />
      {/* Notifications */}
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
}
