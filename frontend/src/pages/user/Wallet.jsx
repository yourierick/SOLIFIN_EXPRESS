import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import axios from "axios";
import WithdrawalForm from "../../components/WithdrawalForm";
import VirtualPurchaseForm from "../../components/VirtualPurchaseForm";
import FundsTransferModal from "../../components/FundsTransferModal";
import TransactionsTable from "./components/TransactionsTable";
import WalletExportButtons from "./components/WalletExportButtons";
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
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { FaFilter, FaTimes, FaExchangeAlt, FaFileExcel } from "react-icons/fa";
import {
  Alert,
} from "@mui/material";

const getStatusColor = (status, isDarkMode) => {
  switch (status) {
    case "active":
      return isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800";
    case "pending":
      return isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800";
    case "inactive":
      return isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
    default:
      return isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800";
  }
};

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
  }, [debouncedSearchQuery, statusFilter, typeFilter, dateFilter, selectedCurrency]);

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
        setTransactionsUSD(response.data.transactions_usd || []);
        setTransactionsCDF(response.data.transactions_cdf || []);
        // Définir les transactions actives selon la devise sélectionnée
        setTransactions(
          selectedCurrency === "USD"
            ? response.data.transactions_usd || []
            : response.data.transactions_cdf || []
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

      // Filtrer par devise
      params.currency = selectedCurrency;

      // Ajouter les filtres de recherche
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== "all") params.status = statusFilter;
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
        Type: transaction.type || '',
        Mouvement: transaction.mouvment === 'in' ? 'Entrée' : 'Sortie',
        Montant: `${transaction.amount} ${selectedCurrency}`,
        Statut: transaction.status || '',
        Date: formatDate(transaction.created_at),
        'Méthode de paiement': transaction.metadata?.['Méthode de paiement'] || '-',
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
        currency: selectedCurrency,
        export: 'all', // Indiquer au backend de retourner toutes les données filtrées
      };
      
      // Ajouter les filtres actifs
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
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

  const handleWithdrawalClick = (walletId, type) => {
    setSelectedWalletForWithdrawal({ id: walletId, type });
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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = JSON.stringify(transaction.metadata)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      transaction.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    // Amélioration du filtrage par date
    let matchesDate = true;

    if (dateFilter.startDate || dateFilter.endDate) {
      try {
        // Convertir la date de transaction en objet Date
        let transactionDate;

        if (typeof transaction.created_at === "string") {
          // Si la date est au format "JJ/MM/AAAA HH:MM:SS" (format français)
          if (transaction.created_at.includes("/")) {
            // Extraire seulement la partie date (JJ/MM/AAAA)
            const parts = transaction.created_at.split("/");
            if (parts.length === 3) {
              // Format JJ/MM/AAAA
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript

              // Extraire l'année et l'heure si présente
              let year, time;
              if (parts[2].includes(" ")) {
                [year, time] = parts[2].split(" ");
                year = parseInt(year, 10);
              } else {
                year = parseInt(parts[2], 10);
              }

              transactionDate = new Date(year, month, day);
            } else {
              transactionDate = new Date(transaction.created_at);
            }
          } else {
            // Format standard ISO
            transactionDate = new Date(transaction.created_at);
          }
        } else {
          transactionDate = new Date(transaction.created_at);
        }

        // Convertir les dates de filtre en objets Date
        // Pour la date de début, on définit l'heure à 00:00:00
        let startDate = null;
        if (dateFilter.startDate) {
          startDate = new Date(dateFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
        }

        // Pour la date de fin, on définit l'heure à 23:59:59
        let endDate = null;
        if (dateFilter.endDate) {
          endDate = new Date(dateFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
        }

        // Vérifier si la date de transaction est dans la plage
        matchesDate =
          (!startDate || transactionDate >= startDate) &&
          (!endDate || transactionDate <= endDate);
      } catch (error) {
        console.error("Erreur lors du filtrage par date:", error);
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

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
      const typeTraduction = 
        transaction.mouvment === "withdrawal"
          ? "Retrait"
          : transaction.type === "purchase"
          ? "Achat"
          : transaction.type === "virtual_purchase"
          ? "Virtuels"
          : transaction.type === "reception"
          ? "Réception des fonds"
          : transaction.type === "transfer"
          ? "Transfert des fonds"
          : transaction.type === "remboursement"
          ? "Remboursement"
          : transaction.type === "digital_product_sale"
          ? "Vente de produit numérique"
          : transaction.type === "commission de parrainage"
          ? "Commission de parrainage"
          : transaction.type === "commission de transfert"
          ? "Commission de transfert"
          : transaction.type === "commission de retrait"
          ? "Commission de retrait"
          : transaction.type;

      // Traduire le statut en français
      const getStatusText = (status) =>
        status === "pending"
          ? "en attente"
          : status === "completed"
          ? "completé"
          : status === "failed"
          ? "failed"
          : status === "cancelled"
          ? "annulé"
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
                  typeFilter === "deposit"
                    ? "Dépôt"
                    : typeFilter === "withdrawal"
                    ? "Retrait"
                    : typeFilter === "transfer"
                    ? "Transfert"
                    : typeFilter === "payment"
                    ? "Paiement"
                    : typeFilter === "refund"
                    ? "Remboursement"
                    : typeFilter === "commission"
                    ? "Commission"
                    : typeFilter === "conversion"
                    ? "Conversion"
                    : typeFilter
                }`
              : "Tous les types"
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
            <div className="sm:flex-row sm:items-start sm:justify-between gap-6">
              {/* En-tête du wallet */}
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <WalletIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Portefeuille Personnel
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
                  onClick={() => handleWithdrawalClick(userWallet.id, "admin")}
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    isDarkMode
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
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    isDarkMode
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
                  className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-purple-500"
                      : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-500"
                  }`}
                >
                  <FaExchangeAlt className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <span className="tooltip-text">Transférer des fonds</span>
              </div>
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
                    <option value="cancelled">Annulé</option>
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
                  <select
                    value={typeFilter}
                    onChange={handleTypeFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les types</option>
                    <option value="purchase">Achat</option>
                    <option value="virtual_purchase">Achat des virtuels</option>
                    <option value="digital_product_sale">
                      Vente des produits num.
                    </option>
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

          {/* En-tête avec bouton d'exportation */}
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Transactions {selectedCurrency}
            </h3>
          </div>

          {/* Tableau des transactions avec composant séparé */}
          <TransactionsTable
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
                        {selectedTransaction.amount}
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
                              currency: "Devise",
                              description: "Description",
                              reference: "Référence",
                            };

                            const label =
                              frenchLabels[key] ||
                              key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());

                            // Formater la valeur selon son type
                            let formattedValue = value;

                            // Traduction des statuts
                            if (key === "status" || key.endsWith("_status")) {
                              if (value === "pending")
                                formattedValue = "En attente";
                              else if (value === "approved")
                                formattedValue = "Approuvé";
                              else if (value === "rejected")
                                formattedValue = "Rejeté";
                              else if (
                                value === "cancelled" ||
                                value === "canceled"
                              )
                                formattedValue = "Annulé";
                              else if (value === "completed")
                                formattedValue = "Complété";
                              else if (value === "failed")
                                formattedValue = "Échoué";
                            }

                            // Ajout de symboles pour les valeurs monétaires
                            if (
                              key === "amount" ||
                              key === "montant_a_retirer" ||
                              key === "frais_de_retrait" ||
                              key === "frais_de_commission" ||
                              key === "montant_total_a_payer" ||
                              key.includes("montant") ||
                              key.includes("amount")
                            ) {
                              formattedValue = `${value} $`;
                            }

                            // Ajout de symboles pour les pourcentages
                            if (
                              key === "fee_percentage" ||
                              key.includes("percentage") ||
                              key.includes("pourcentage")
                            ) {
                              formattedValue = `${value} %`;
                            }

                            return (
                              <div key={key} className="mb-3 last:mb-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isDarkMode
                                        ? "bg-purple-400"
                                        : "bg-purple-500"
                                    }`}
                                  />
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {label}
                                  </p>
                                </div>
                                <p
                                  className={`font-medium break-words ml-3.5 ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {typeof formattedValue === "object"
                                    ? JSON.stringify(formattedValue, null, 2)
                                    : String(formattedValue)}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200/20">
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg"
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
                balance_usd={userWallet?.balance_usd || 0}
                balance_cdf={userWallet?.balance_cdf || 0}
                onClose={() => setShowWithdrawalForm(false)}
                onSuccess={() => {
                  // Mettre à jour les données du portefeuille après un retrait réussi
                  // Utiliser un petit délai pour éviter les interférences avec la fermeture du modal
                  setTimeout(() => {
                    fetchWalletData();
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
        balance_usd={userWallet?.balance_usd || 0}
        balance_cdf={userWallet?.balance_cdf || 0}
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
