import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  TablePagination,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClockIcon,
  EyeIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const TransactionSerdipay = () => {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    type: "",
    payment_type: "",
    direction: "",
    date_from: "",
    date_to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackForm, setCallbackForm] = useState({
    message: "",
    transaction_id: "",
    session_id: "",
    status: "success"
  });

  // États pour le modal de finalisation d'achat
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeForm, setFinalizeForm] = useState({
    session_id: "",
    payment_type: "purchase_pack"
  });
  const [finalizeError, setFinalizeError] = useState("");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    paymentMethodStats: [],
    monthlyStats: [],
  });

  const exportMenuRef = useRef(null);

  // Fonction pour traiter le callback manuel
  const handleManualCallback = async () => {
    try {
      setCallbackLoading(true);
      
      const response = await axios.post('/api/payment/callback', callbackForm);
      
      if (response.data.success) {
        toast.success('Callback traité avec succès!');
        setShowCallbackModal(false);
        // Réinitialiser le formulaire
        setCallbackForm({
          message: "",
          payment: {
            status: "success",
            sessionId: "",
            sessionStatus: 3,
            transactionId: ""
          }
        });
        // Rafraîchir les données
        fetchTransactions();
      } else {
        // Afficher les erreurs spécifiques du backend
        if (response.data.message === 'Transaction déjà traitée') {
          toast.error('Cette transaction a déjà été traitée. Impossible de la traiter à nouveau.');
        } else if (response.data.message === 'Transaction non trouvée pour la session') {
          toast.error('Aucune transaction trouvée pour cette session. Vérifiez l\'ID de session.');
        } else {
          // Erreur générale
          toast.error(response.data.message || 'Erreur lors du traitement du callback');
        }
      }
    } catch (error) {
      console.error('Erreur callback manuel:', error);
      
      // Gérer les erreurs réseau ou serveur
      if (error.response?.data?.errors) {
        // Erreurs de validation du backend
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(err => {
          toast.error(err);
        });
      } else {
        // Erreur réseau ou autre
        toast.error(error.response?.data?.message || error.message || 'Erreur lors du traitement du callback');
      }
    } finally {
      setCallbackLoading(false);
    }
  };

  // Fonction pour gérer la finalisation d'achat
  const handleFinalizePurchase = async () => {
    setFinalizeError("");
    
    if (!finalizeForm.session_id.trim()) {
      setFinalizeError("Veuillez entrer un ID de session");
      return;
    }
    
    setFinalizeLoading(true);
    
    try {
      const response = await axios.post('/api/admin/finalize-purchase', finalizeForm);
      
      if (response.data.success) {
        toast.success('Achat finalisé avec succès!');
        setShowFinalizeModal(false);
        // Réinitialiser le formulaire
        setFinalizeForm({
          session_id: "",
          payment_type: "purchase_pack"
        });
        // Rafraîchir les données
        fetchTransactions();
      } else {
        toast.error(response.data.message || "Erreur lors de la finalisation de l'achat");
      }
    } catch (error) {
      console.error('Erreur finalisation achat:', error);
      toast.error('Erreur lors de la finalisation de l\'achat');
    } finally {
      setFinalizeLoading(false);
    }
  };

  // Fonction pour calculer la position du dropdown
  const getDropdownPosition = () => {
    if (!exportMenuRef.current) return {};
    const rect = exportMenuRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    };
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, filters, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        search: searchTerm,
        ...filters,
      };

      // Debug: afficher les paramètres envoyés
      console.log('Paramètres envoyés:', params);

      const response = await axios.get("/api/admin/serdipay-transactions", {
        params,
      });
      setTransactions(response.data.transactions.data);
      setTotalCount(response.data.transactions.total);
      setStats(response.data.stats);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des transactions:", err);
      setError(
        "Impossible de charger les transactions. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`/api/admin/serdipay-transactions/${id}`);
      setSelectedTransaction(response.data.transaction);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Erreur lors du chargement des détails de la transaction:", err);
      toast.error("Impossible de charger les détails de la transaction.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportTransactions = async () => {
    setExportLoading(true);
    try {
      const params = {
        format: 'csv',
        search: searchTerm,
        ...filters,
      };

      const response = await axios.get("/api/admin/serdipay-transactions/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `transactions-serdipay-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export CSV téléchargé avec succès!");
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      toast.error("Impossible d'exporter les transactions.");
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copié dans le presse-papier !"))
      .catch(() => toast.error("Impossible de copier dans le presse-papier."));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTransactionStatusBadge = (status) => {
    const colorClass = getStatusColor(status);
    const statusText = {
      completed: "Complétée",
      pending: "En attente",
      failed: "Échouée",
      expired: "Expirée",
    }[status] || status;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status === "completed" && <CheckCircleIcon className="w-3 h-3 mr-1" />}
        {status === "pending" && <ClockIcon className="w-3 h-3 mr-1" />}
        {status === "failed" && <XCircleIcon className="w-3 h-3 mr-1" />}
        {status === "expired" && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
        {statusText}
      </span>
    );
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      payment_method: "",
      type: "",
      payment_type: "",
      direction: "",
      date_from: "",
      date_to: "",
    });
    setSearchTerm("");
    setPage(0);
    fetchTransactions();
  };

  const renderTransactionTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <CircularProgress size={40} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune transaction trouvée
          </p>
        </div>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
            <TableRow>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                ID
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Référence
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Transaction ID
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Utilisateur
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Téléphone
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Montant
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Méthode
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Type
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Statut
              </TableCell>
              <TableCell className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Date
              </TableCell>
              <TableCell className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {transactions.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className={isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"}
                style={{ transition: "background-color 0.2s" }}
              >
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                      <CreditCardIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{transaction.id}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.session_id || 'Non défini'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.transaction_id || 'Non défini'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction?.user?.name || 'Non défini'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.phone_number || 'Non défini'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.amount} $
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.payment_method}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {transaction.type}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                  {getTransactionStatusBadge(transaction.status)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => fetchTransactionDetails(transaction.id)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Voir les détails"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(transaction.reference)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Copier la référence"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
              <CreditCardIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Transactions Serdipay
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consulter les transactions serdipay
              </p>
            </div>
          </div>          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Bouton Callback Manuel */}
            <button
              onClick={() => setShowCallbackModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              }`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Callback manuel</span>
              <span className="sm:hidden">Callback</span>
            </button>
            
            {/* Bouton Finaliser un achat */}
            <button
              onClick={() => setShowFinalizeModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
              }`}
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Finaliser un achat</span>
              <span className="sm:hidden">Finaliser</span>
            </button>
            
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isDarkMode
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-600"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-400"
                }`}
              >
                {exportLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <DocumentArrowDownIcon className="h-4 w-4" />
                )}
                {exportLoading ? "Exportation..." : "Exporter CSV"}
                {!exportLoading && <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />}
              </button>
              
              {showExportMenu && (
                <div 
                  className={`fixed w-56 rounded-xl shadow-2xl border z-[9999] transform transition-all duration-200 ${
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 shadow-black/50" 
                      : "bg-white border-gray-200 shadow-black/20"
                  }`}
                  style={getDropdownPosition()}
                >
                  <div className="p-2">
                    <button
                      onClick={() => exportTransactions()}
                      disabled={exportLoading}
                      className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-200 flex items-center gap-3 ${
                        isDarkMode 
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {exportLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                          <span className="flex-1">Exportation en cours...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentArrowDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">Exporter en CSV</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Format .csv • Compatible Excel • Date du jour
                            </div>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Footer du dropdown */}
                  <div className={`px-4 py-2 border-t text-xs ${
                    isDarkMode 
                      ? "border-gray-700 text-gray-400" 
                      : "border-gray-200 text-gray-500"
                  }`}>
                    {exportLoading ? "Préparation du fichier..." : "Inclut tous les filtres actifs"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
        } shadow-lg hover:shadow-xl transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Transactions
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalTransactions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                $
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChartBarIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
        } shadow-lg hover:shadow-xl transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Transactions Réussies
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.successfulTransactions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalTransactions > 0 
                  ? `${Math.round((stats.successfulTransactions / stats.totalTransactions) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <ArrowTrendingUpIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
        } shadow-lg hover:shadow-xl transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Transactions Échouées
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.failedTransactions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalTransactions > 0 
                  ? `${Math.round((stats.failedTransactions / stats.totalTransactions) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <ArrowTrendingDownIcon className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-5 blur-xl"></div>
        <div className={`relative p-6 rounded-2xl shadow-xl border ${
          isDarkMode 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-col mb-3 lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 lg:max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par ID, référence, email, téléphone, nom"
                  className={`block w-full pl-10 pr-20 py-3 border rounded-xl leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 m-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </form>

            {/* Filters Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  showFilters
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : isDarkMode
                    ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500"
                    : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
                <span>Filtres avancés</span>
                {Object.values(filters).some(value => value !== "") && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                    {Object.values(filters).filter(value => value !== "").length} actifs
                  </span>
                )}
              </button>

              {Object.values(filters).some(value => value !== "") && (
                <button
                  onClick={resetFilters}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-600 hover:border-gray-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Réinitialiser tout
                </button>
              )}
            </div>
          </div>
          {/* Filters Content */}
          {showFilters && (
            <div className={`p-6 rounded-2xl border shadow-inner ${
              isDarkMode 
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
                : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <option value="">📊 Tous les statuts</option>
                    <option value="completed">✅ Complétée</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="failed">❌ Échouée</option>
                    <option value="expired">⏰ Expirée</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Méthode de paiement
                  </label>
                  <select
                    value={filters.payment_method}
                    onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <option value="">💳 Toutes les méthodes</option>
                    <option value="OM">📱 Orange-money</option>
                    <option value="AM">📱 Airtel-money</option>
                    <option value="MC">💳 Mastercard</option>
                    <option value="VISA">💳 Visa</option>
                    <option value="AE">💳 American Express</option>
                    <option value="MP">📱 M-pesa</option>
                    <option value="AF">📱 Afrimoney</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <option value="">🔄 Tous les types</option>
                    <option value="payment">💰 Paiement</option>
                    <option value="withdrawal">💸 Retrait</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des transactions avec Material-UI */}
      <Paper
        elevation={2}
        sx={{
          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
          borderRadius: "1rem",
          overflow: "hidden",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.7)"
            : "1px solid rgba(229, 231, 235, 1)",
        }}
      >
        {renderTransactionTable()}
        
        {/* Pagination Material-UI */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
            borderTop: isDarkMode 
              ? "1px solid rgba(75, 85, 99, 0.7)" 
              : "1px solid rgba(229, 231, 235, 1)",
            "& .MuiSvgIcon-root": {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            "& .MuiSelect-icon": {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            "& .MuiInputBase-input": {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
          }}
        />
      </Paper>

      {/* Modal de détails */}
      {showDetailModal && selectedTransaction && (
        <div
          className={`fixed inset-0 z-50 ${isDarkMode ? "dark" : ""}`}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay avec blur */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            onClick={() => setShowDetailModal(false)}
          ></div>

          {/* Container pour centrer le modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* Modal */}
            <div
              className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl transform transition-all flex flex-col ${
                isDarkMode 
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" 
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              {/* Header avec gradient */}
              <div className={`relative px-6 py-5 border-b flex-shrink-0 ${
                isDarkMode 
                  ? "border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600" 
                  : "border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <CreditCardIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Transaction #{selectedTransaction.id}
                      </h3>
                      <p className="text-sm text-white text-opacity-80">
                        {formatDate(selectedTransaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                    onClick={() => setShowDetailModal(false)}
                  >
                    <XMarkIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body avec scrollbar */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6">
                  {loadingDetails ? (
                    <div className="flex justify-center items-center py-12">
                      <CircularProgress size={40} />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Section principale */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Référence</h4>
                          <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                            {selectedTransaction.reference || 'Non défini'}
                          </p>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Statut</h4>
                          <div className="text-sm">
                            {getTransactionStatusBadge(selectedTransaction.status)}
                          </div>
                        </div>
                      </div>

                      {/* Session et Transaction IDs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Session ID</h4>
                          <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white break-all">
                            {selectedTransaction.session_id || 'Non défini'}
                          </p>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Transaction ID</h4>
                          <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white break-all">
                            {selectedTransaction.transaction_id || 'Non défini'}
                          </p>
                        </div>
                      </div>

                      {/* Informations utilisateur */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          Informations utilisateur
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nom</h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedTransaction?.user?.name || 'Non défini'}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedTransaction.email || 'Non défini'}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Téléphone</h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedTransaction.phone_number || 'Non défini'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informations transaction */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Détails de la transaction
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Montant</h4>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatAmount(selectedTransaction.amount)} $
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Méthode</h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedTransaction.payment_method || 'Non défini'}
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg border ${
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                          }`}>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedTransaction.type || 'Non défini'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className={`p-4 rounded-lg border ${
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                      }`}>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Dates importantes
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Création</h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {formatDate(selectedTransaction.created_at)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mise à jour</h4>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {formatDate(selectedTransaction.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t flex-shrink-0 ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              } rounded-b-2xl`}>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    onClick={() => setShowDetailModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Callback Manuel */}
      {showCallbackModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
            } rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                    <ArrowPathIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Callback Manuel
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Traiter un callback SerdiPay manuellement
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCallbackModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? "hover:bg-gray-700 text-gray-400" 
                      : "hover:bg-gray-200 text-gray-500"
                  }`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Formulaire */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Message */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Message
                  </label>
                  <input
                    type="text"
                    value={callbackForm.message}
                    onChange={(e) => setCallbackForm({
                      ...callbackForm,
                      message: e.target.value
                    })}
                    placeholder="La référence de la transaction"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Status
                  </label>
                  <select
                    value={callbackForm.payment.status}
                    onChange={(e) => setCallbackForm({
                      ...callbackForm,
                      payment: {
                        ...callbackForm.payment,
                        status: e.target.value
                      }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  >
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Session ID */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={callbackForm.payment.sessionId}
                    onChange={(e) => setCallbackForm({
                      ...callbackForm,
                      payment: {
                        ...callbackForm.payment,
                        sessionId: e.target.value
                      }
                    })}
                    placeholder="Ex: 1720786347"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>

                {/* Session Status */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Session Status
                  </label>
                  <input
                    type="number"
                    value={callbackForm.payment.sessionStatus}
                    onChange={(e) => setCallbackForm({
                      ...callbackForm,
                      payment: {
                        ...callbackForm.payment,
                        sessionStatus: parseInt(e.target.value)
                      }
                    })}
                    placeholder="Ex: 3"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>

                {/* Transaction ID */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={callbackForm.payment.transactionId}
                    onChange={(e) => setCallbackForm({
                      ...callbackForm,
                      payment: {
                        ...callbackForm.payment,
                        transactionId: e.target.value
                      }
                    })}
                    placeholder="Ex: SERDMG7MW6ZV"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 ${
              isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
            } rounded-b-2xl`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCallbackModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleManualCallback}
                  disabled={callbackLoading || !callbackForm.message || !callbackForm.payment.sessionId}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    callbackLoading || !callbackForm.message || !callbackForm.payment.sessionId
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                  }`}
                >
                  {callbackLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Traitement...
                    </div>
                  ) : (
                    "Traiter le callback"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Finalisation d'Achat */}
      {showFinalizeModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0 ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Finaliser un achat
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Traiter manuellement un achat en attente
                  </p>
                </div>
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? "hover:bg-gray-700 text-gray-400" 
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Champ session_id */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    ID de session
                  </label>
                  <input
                    type="text"
                    value={finalizeForm.session_id}
                    onChange={(e) => setFinalizeForm({...finalizeForm, session_id: e.target.value})}
                    placeholder="SERDJIPHWD0P7"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                </div>

                {/* Champ payment_type */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Type de paiement
                  </label>
                  <select
                    value={finalizeForm.payment_type}
                    onChange={(e) => setFinalizeForm({...finalizeForm, payment_type: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? "bg-gray-700 border-gray-600 text-white" 
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    <option value="renew_pack">Renouvellement de pack</option>
                    <option value="purchase_pack">Achat de pack</option>
                    <option value="purchase_virtual">Achat virtuel</option>
                  </select>
                </div>

                {/* Message d'erreur */}
                {finalizeError && (
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
                  } border`}>
                    <p className={`text-sm ${
                      isDarkMode ? "text-red-400" : "text-red-700"
                    }`}>
                      {finalizeError}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 ${
              isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
            } rounded-b-2xl`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleFinalizePurchase}
                  disabled={finalizeLoading || !finalizeForm.session_id.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    finalizeLoading || !finalizeForm.session_id.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  }`}
                >
                  {finalizeLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Traitement...
                    </div>
                  ) : (
                    "Finaliser l'achat"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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

export default TransactionSerdipay;
