import React, { useState, useEffect, lazy, Suspense } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../../utils/axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import { getOperationType } from "../../components/OperationTypeFormatter";
import { getTransactionColor } from "../../components/TransactionColorFormatter";
import useDashboardCounters from "../../hooks/useDashboardCounters";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import SuiviInterneSolifin from "./components/comptabilite_interne_solifin/SuiviFinancier";
import SuiviVenteSolifin from "./components/comptabilite_des_ventes_solifin/SuiviFinancier";

// Hook personnalisé pour debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  AllInclusive,
  Menu as MenuIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  DateRange as DateRangeIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ErrorOutline as ErrorOutlineIcon,
  Warning as WarningIcon,
  HourglassEmpty as HourglassEmptyIcon,
  FileDownload as FileDownloadIcon,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  BarChart as BarChartIcon,
  CardGiftcard as CardGiftcardIcon,
  MonetizationOn as MonetizationOnIcon,
  Payment as PaymentIcon,
  SwapHoriz as SwapHorizIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  RocketLaunch as RocketLaunchIcon,
  Devices as DevicesIcon,
  CloudDownload as CloudDownloadIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ShoppingBag as ShoppingBagIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

// Import des composants avec lazy loading
const Commissions = lazy(() => import("./Commissions"));
const WithdrawalRequests = lazy(() =>
  import("../../components/WithdrawalRequests")
);

// Composant principal
const Finances = () => {
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [systemBalance, setSystemBalance] = useState(null);
  const [statsByType, setStatsByType] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    userId: "",
    packId: "",
    searchTerm: "",
  });

  // États pour les onglets
  const [activeTab, setActiveTab] = useState(0);

  // État pour gérer le mode mobile et la pagination
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [currentMobileTabIndex, setCurrentMobileTabIndex] = useState(0);

  // État pour les permissions
  const [userPermissions, setUserPermissions] = useState([]);
  const { user } = useAuth();
  const { pendingCount } = useDashboardCounters(user?.is_admin);

  // États pour le modal de retrait
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalPassword, setWithdrawalPassword] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [serdipayFees, setSerdipayFees] = useState(0);
  const [loadingFees, setLoadingFees] = useState(false);

  // États pour le modal d'ajustement de solde
  const [showBalanceAdjustmentModal, setShowBalanceAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    source_account: '',
    destination_account: '',
    amount: '',
    reason: '',
    password: ''
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState('');

  // Définir les couleurs de base en fonction du mode sombre/clair
  const themeColors = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    card: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    text: {
      primary: isDarkMode ? "text-gray-100" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    }
  };

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileMode(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Chargement initial des données
  useEffect(() => {
    fetchSystemBalance();
    fetchStatsByType();
  }, []);

  // Appliquer les filtres et la pagination lorsqu'ils changent
  useEffect(() => {
    if (!loading) {
      fetchStatsByType();
    }
  }, [filters, page, rowsPerPage]);


  // Récupérer les permissions de l'utilisateur
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await axios.get(`/api/user/permissions`);
        if (response.data && response.data.permissions) {
          const permissionSlugs = response.data.permissions.map(
            (permission) => permission.slug
          );
          setUserPermissions(permissionSlugs);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des permissions");
      }
    };

    if (user) {
      fetchUserPermissions();
    }
  }, [user]);

  // Fonction pour récupérer le solde du système
  const fetchSystemBalance = async () => {
    try {
      const response = await axios.get("/api/admin/finances/system-balance");

      if (response.data.success) {
        setSystemBalance(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du solde du système");
    }
  };

  // Fonction pour récupérer les statistiques par type
  const fetchStatsByType = async () => {
    try {
      const params = {};

      if (filters.startDate) params.date_from = filters.startDate;
      if (filters.endDate) params.date_to = filters.endDate;

      const response = await axios.get("/api/admin/finances/stats-by-type", {
        params,
      });

      if (response.data.success) {
        setStatsByType(
          response.data.data.stats
        );
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques par type");
    }
  };

  // Effet pour recharger les données lorsque la devise change
  useEffect(() => {
    if (userPermissions.length > 0) {
      fetchStatsByType();
    }
  }, [filters, userPermissions]);

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (isMobileMode) {
      setCurrentMobileTabIndex(newValue);
    }
  };

  // Fonctions de navigation mobile
  const goToPreviousTab = () => {
    if (currentMobileTabIndex > 0) {
      const newIndex = currentMobileTabIndex - 1;
      setCurrentMobileTabIndex(newIndex);
      setActiveTab(newIndex);
    }
  };

  const goToNextTab = () => {
    const maxTabIndex = 4; // 5 onglets (0-4)
    if (currentMobileTabIndex < maxTabIndex) {
      const newIndex = currentMobileTabIndex + 1;
      setCurrentMobileTabIndex(newIndex);
      setActiveTab(newIndex);
    }
  };

  const goToTab = (index) => {
    setCurrentMobileTabIndex(index);
    setActiveTab(index);
  };

  // Fonction pour gérer le retrait des bénéfices
  const handleWithdrawal = async () => {
    setWithdrawalError("");
    setAmountError("");
    
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setAmountError("Veuillez entrer un montant valide");
      return;
    }
    
    if (!withdrawalPassword) {
      setWithdrawalError("Veuillez entrer votre mot de passe");
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    const availableBalance = systemBalance?.plateforme_benefices || 0;
    const totalAmount = amount + (amount * (serdipayFees / 100));
    const feeAmount = amount * (serdipayFees / 100);
    
    if (totalAmount > availableBalance) {
      setAmountError("Le montant total avec les frais ne peut pas dépasser le solde disponible");
      return;
    }
    
    setWithdrawalLoading(true);
    
    try {
      const response = await axios.post("/api/admin/wallets/withdraw-benefits", {
        amount: amount,
        fees: feeAmount,
        totalAmount: totalAmount,
        password: withdrawalPassword
      });
      
      if (response.data.success) {
        // Réinitialiser le formulaire
        setWithdrawalAmount("");
        setWithdrawalPassword("");
        setShowWithdrawalModal(false);
        setAmountError("");
        
        // Rafraîchir le solde
        await fetchSystemBalance();
        
        // Afficher un message de succès
        toast.success("Retrait effectué avec succès!");
      } else {
        setWithdrawalError(response.data.message || "Une erreur est survenue");
      }
    } catch (error) {
      setWithdrawalError(error.response?.data?.message || "Une erreur est survenue lors du retrait");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Fonction pour valider le montant en temps réel
  const validateAmount = (value) => {
    setWithdrawalAmount(value);
    setAmountError("");
    
    const amount = parseFloat(value);
    const availableBalance = systemBalance?.plateforme_benefices || 0;
    const totalAmount = amount + (amount * (serdipayFees / 100));
    
    if (!value || value.trim() === "" || amount <= 0) {
      setAmountError("Veuillez entrer un montant valide");
    } else if (totalAmount > availableBalance) {
      setAmountError("Le montant total avec les frais ne peut pas dépasser le solde disponible");
    }
  };

  // Vérifier si le bouton doit être désactivé
  const isWithdrawButtonDisabled = () => {
    const amount = parseFloat(withdrawalAmount);
    const availableBalance = systemBalance?.plateforme_benefices || 0;
    const totalAmount = amount + (amount * (serdipayFees / 100));
    
    return !withdrawalAmount || 
           withdrawalAmount.trim() === "" || 
           amount <= 0 || 
           totalAmount > availableBalance || 
           !withdrawalPassword || 
           withdrawalLoading;
  };

  // Fonction pour récupérer les frais serdipay
  const fetchSerdipayFees = async () => {
    setLoadingFees(true);
    try {
      const response = await axios.get("/api/admin/settings/key/serdipay_fees");
      if (response.data.success) {
        setSerdipayFees(parseFloat(response.data.setting.value) || 0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des frais serdipay:", error);
      setSerdipayFees(0); // Valeur par défaut
    } finally {
      setLoadingFees(false);
    }
  };

  // Fonction pour ouvrir le modal et charger les frais
  const openWithdrawalModal = async () => {
    await fetchSerdipayFees();
    setShowWithdrawalModal(true);
  };

  // Fonction pour gérer l'ajustement de solde
  const handleBalanceAdjustment = async () => {
    // Validation des champs
    if (!adjustmentForm.source_account || !adjustmentForm.destination_account || !adjustmentForm.amount || !adjustmentForm.reason.trim() || !adjustmentForm.password.trim()) {
      setAdjustmentError("Tous les champs sont obligatoires");
      return;
    }

    const amount = parseFloat(adjustmentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setAdjustmentError("Le montant doit être supérieur à 0");
      return;
    }

    setAdjustmentLoading(true);
    setAdjustmentError('');

    try {
      const response = await axios.post("/api/admin/wallets/adjust-balance", {
        source_account: adjustmentForm.source_account,
        destination_account: adjustmentForm.destination_account,
        amount: amount,
        reason: adjustmentForm.reason.trim(),
        password: adjustmentForm.password.trim()
      });

      if (response.data.success) {
        // Réinitialiser le formulaire
        setAdjustmentForm({
          source_account: '',
          destination_account: '',
          amount: '',
          reason: '',
          password: ''
        });
        setShowBalanceAdjustmentModal(false);
        setAdjustmentError('');

        // Rafraîchir le solde
        await fetchSystemBalance();

        // Afficher un message de succès
        toast.success("Ajustement de solde effectué avec succès!");
      } else {
        setAdjustmentError(response.data.message || "Une erreur est survenue");
      }
    } catch (error) {
      setAdjustmentError(error.response?.data?.message || "Une erreur est survenue lors de l'ajustement");
    } finally {
      setAdjustmentLoading(false);
    }
  };

  // Calculer les frais et le montant total
  const calculateFees = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    const fees = amount * (serdipayFees / 100);
    return {
      fees: fees,
      totalAmount: amount + fees
    };
  };

  // Configuration des onglets pour mobile
  const getMobileTabConfig = (index) => {
    const tabs = [
      {
        name: "Comptabilité des ventes",
        icon: ShoppingBagIcon,
        color: "orange"
      },
      {
        name: "Comptabilité interne",
        icon: CreditCardIcon,
        color: "blue"
      },
      {
        name: "Stats globales",
        icon: WalletIcon,
        color: "green"
      },
      {
        name: "Commissions",
        icon: MonetizationOnIcon,
        color: "purple"
      },
      {
        name: "Retraits",
        icon: PaymentIcon,
        color: "orange"
      }
    ];
    return tabs[index] || null;
  };

  // Vérifier si un onglet est disponible selon les permissions
  const isTabAvailable = (index) => {
    switch (index) {
      case 0: // Ventes
        return userPermissions.includes("view-finances") || userPermissions.includes("super-admin");
      case 1: // Transactions
        return userPermissions.includes("view-finances") || userPermissions.includes("super-admin");
      case 2: // Stats globales
        return userPermissions.includes("view-transactions") || userPermissions.includes("super-admin");
      case 3: // Commissions
        return userPermissions.includes("manage-commissions") || userPermissions.includes("super-admin");
      case 4: // Demandes de retrait
        return userPermissions.includes("manage-withdrawals") || userPermissions.includes("super-admin");
      default:
        return false;
    }
  };

  // Obtenir les onglets disponibles pour la pagination mobile
  const getAvailableTabs = () => {
    const tabs = [];
    for (let i = 0; i < 5; i++) {
      if (isTabAvailable(i)) {
        tabs.push(i);
      }
    }
    return tabs;
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

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Fonction pour exporter les statistiques par type au format Excel
  const exportStatsToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = statsByType.map((stat) => ({
      Type: getOperationType(stat.type),
      Nombre: stat.count,
      "Montant total": `${stat.total_amount} $`,
      "Première transaction": formatDate(stat.first_transaction),
      "Dernière transaction": formatDate(stat.last_transaction),
    }));

    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistiques");

    // Génération du nom de fichier avec date
    const fileName = `statistiques_${format(
      new Date(),
      "yyyy-MM-dd_HH-mm"
    )}.xlsx`;

    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 },
        minHeight: "100vh",
        background: isDarkMode 
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" 
          : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >

      {/* Cartes de résumé financier - Design moderne épuré */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Carte 1: Solde actuel */}
        <div className={`${themeColors.card} rounded-xl p-6 shadow-lg border ${themeColors.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide`}>
                Solde marchand
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Balance disponible
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <AccountBalanceIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {
                formatAmount(systemBalance?.solde_marchand || 0)
              }
            </div>
            <div className="relative group">
              <button
                onClick={() => setShowBalanceAdjustmentModal(true)}
                className={`p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-110 active:scale-95 animate-pulse`}
              >
                <SwapHorizIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Ajustement de solde
                <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 2: Total des entrées */}
        <div className={`${themeColors.card} rounded-xl p-6 shadow-lg border ${themeColors.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide`}>
                Bénéfices SOLIFIN
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span>Divers profits accumulés par SOLIFIN</span><br />
                <span>en frais, en commissions, en ventes.</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <AttachMoneyIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                formatAmount(systemBalance?.plateforme_benefices || 0)
              }
            </div>
            <div className="relative group">
              <button
                onClick={openWithdrawalModal}
                disabled={loadingFees}
                className={`p-2 rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse`}
              >
                {loadingFees ? (
                  <CircularProgress size={20} className="text-green-600 dark:text-green-400" />
                ) : (
                  <BanknotesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {loadingFees ? "Chargement..." : "Effectuer un retrait sur le compte principal"}
                <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 3: Total des sorties */}
        <div className={`${themeColors.card} rounded-xl p-6 shadow-lg border ${themeColors.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide`}>
                Engagement utilisateurs
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ce que SOLIFIN doit aux utilisateurs
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <MoneyOffIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {
              formatAmount(systemBalance?.engagement_users || 0)
            }
          </div>
        </div>
      </div>

      {/* Onglets avec design moderne professionnel */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          mb: { xs: 3, sm: 4 },
          background: isDarkMode ? "#1e293b" : "#ffffff",
          border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: isDarkMode 
              ? "linear-gradient(90deg, transparent 0%, #475569 50%, transparent 100%)" 
              : "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
          },
        }}
      >
        {!isMobileMode ? (
            // Version Desktop - Tabs MUI originales
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{
                style: {
                  backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                  height: "3px",
                  borderRadius: "3px 3px 0 0",
                },
              }}
              sx={{
                "& .MuiTabs-flexContainer": {
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  justifyContent: "flex-start",
                },
                "& .MuiTab-root": {
                  minHeight: { xs: 56, sm: 64 },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: { xs: "0.875rem", sm: "0.95rem" },
                  px: { xs: 2.5, sm: 3.5 },
                  py: 1.5,
                  color: isDarkMode ? "#94a3b8" : "#64748b",
                  borderRadius: "12px",
                  mx: 0.5,
                  position: "relative",
                  "&:hover": {
                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)" 
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)",
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-selected": {
                    color: isDarkMode ? "#60a5fa" : "#2563eb",
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)" 
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
                    transform: "translateY(-1px)",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "30px",
                      height: "3px",
                      backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                      borderRadius: "3px 3px 0 0",
                    },
                  },
                  "&.Mui-disabled": {
                    color: isDarkMode ? "#475569" : "#94a3b8",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  },
                },
              }}
            >
              <Tab
                icon={<ShoppingBagIcon fontSize="small" />}
                iconPosition="start"
                label="Comptabilité des ventes"
                disabled={
                  !userPermissions.includes("view-transactions") &&
                  !userPermissions.includes("super-admin")
                }
              />
              <Tab
                icon={<CreditCardIcon fontSize="small" />}
                iconPosition="start"
                label="Comptabilité interne"
                disabled={
                  !userPermissions.includes("view-transactions") &&
                  !userPermissions.includes("super-admin")
                }
              />
              <Tab
                icon={<WalletIcon fontSize="small" />}
                iconPosition="start"
                label="Stats globales par type"
                disabled={
                  !userPermissions.includes("view-transactions") &&
                  !userPermissions.includes("super-admin")
                }
              />
              <Tab
                icon={<MonetizationOnIcon fontSize="small" />}
                iconPosition="start"
                label="Commissions"
                disabled={
                  !userPermissions.includes("manage-commissions") &&
                  !userPermissions.includes("super-admin")
                }
              />
              <Tab
                icon={
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <PaymentIcon fontSize="small" />
                    {pendingCount > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </Box>
                    )}
                  </Box>
                }
                iconPosition="start"
                label="Demandes de retrait"
                disabled={
                  !userPermissions.includes("manage-withdrawals") &&
                  !userPermissions.includes("super-admin")
                }
              />
            </Tabs>
          ) : (
            // Version Mobile - Pagination
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
              {/* Indicateurs de page */}
              <div className="flex justify-center items-center gap-2 py-2 mb-3">
                {getAvailableTabs().map((tabIndex, index) => (
                  <button
                    key={tabIndex}
                    onClick={() => goToTab(tabIndex)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      tabIndex === currentMobileTabIndex
                        ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Aller à l'onglet ${index + 1}`}
                  />
                ))}
              </div>

              {/* Onglet actuel */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={goToPreviousTab}
                  disabled={currentMobileTabIndex === 0 || !isTabAvailable(currentMobileTabIndex - 1)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    currentMobileTabIndex === 0 || !isTabAvailable(currentMobileTabIndex - 1)
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  aria-label="Onglet précédent"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                <div className="flex-1 mx-4">
                  <div className="flex items-center justify-center gap-3">
                    {isTabAvailable(currentMobileTabIndex) && getMobileTabConfig(currentMobileTabIndex) && (
                      <>
                        <div className={`relative text-${getMobileTabConfig(currentMobileTabIndex).color}-500`}>
                          {React.createElement(getMobileTabConfig(currentMobileTabIndex).icon, { className: "h-5 w-5" })}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {getMobileTabConfig(currentMobileTabIndex).name}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={goToNextTab}
                  disabled={currentMobileTabIndex === 4 || !isTabAvailable(currentMobileTabIndex + 1)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    currentMobileTabIndex === 4 || !isTabAvailable(currentMobileTabIndex + 1)
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  aria-label="Onglet suivant"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
      </Paper>

      {/* Contenu de l'onglet actif */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: isDarkMode ? '#fff' : '#111827',
            textAlign: 'center'
          }}>
            🛍 Section Ventes et Retraits effectués - Compte marchand
          </Typography>
          <Typography variant="body1" sx={{ 
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
            mb: 4
          }}>
            Suivez les statistiques de ventes et rapports des retraits effectués.
          </Typography>
          <SuiviVenteSolifin />
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: isDarkMode ? '#fff' : '#111827',
            textAlign: 'center'
          }}>
            🛍 Section des Sorties et Entrées - Compte Solifin
          </Typography>
          <Typography variant="body1" sx={{ 
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
            mb: 4
          }}>
            Suivez les statistiques de ventes et rapports des retraits effectués.
          </Typography>
          <SuiviInterneSolifin />
        </Box>
      )}

      {/* Statistiques par type */}
      {activeTab === 2 && (
        <Box>
          {/* Header avec titre et actions - Optimisé mobile */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            mb: isMobile ? 2 : 3,
            pb: isMobile ? 1.5 : 2,
            borderBottom: `2px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
                fontWeight: 'bold', 
                color: isDarkMode ? '#fff' : '#111827',
                mb: 1,
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>
                📊 Statistiques globales par type
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}>
                Analyse détaillée des transactions par catégorie
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'flex-end' : 'flex-start'
            }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportStatsToExcel}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: isDarkMode ? '#3b82f6' : '#2563eb',
                  color: isDarkMode ? '#60a5fa' : '#2563eb',
                  '&:hover': {
                    backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                    color: 'white',
                    borderColor: isDarkMode ? '#3b82f6' : '#2563eb',
                  },
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  py: isMobile ? 1 : 1.5
                }}
              >
                {isMobile ? 'Exporter' : 'Exporter Excel'}
              </Button>
            </Box>
          </Box>

          {statsByType.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: isMobile ? 250 : 300,
              bgcolor: isDarkMode ? '#1f2937' : '#f9fafb',
              borderRadius: 2,
              border: `2px dashed ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
              p: isMobile ? 2 : 3
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ 
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  mb: 1,
                  fontSize: isMobile ? '1rem' : '1.25rem'
                }}>
                  📭 Aucune statistique disponible
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }}>
                  Les données apparaîtront ici une fois les transactions enregistrées
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* Tableau amélioré - Optimisé pour mobile */}
              <Card sx={{
                borderRadius: isMobile ? 2 : 3,
                boxShadow: isDarkMode 
                  ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                bgcolor: isDarkMode ? '#1f2937' : '#ffffff'
              }}>
                <Box sx={{ 
                  bgcolor: isDarkMode ? '#111827' : '#f8fafc',
                  px: isMobile ? 2 : 3,
                  py: isMobile ? 1.5 : 2,
                  borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`
                }}>
                  <Typography variant={isMobile ? "h6" : "h6"} sx={{ 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#fff' : '#1e293b',
                    fontSize: isMobile ? '1rem' : '1.125rem'
                  }}>
                    📋 Détail des transactions par type
                  </Typography>
                </Box>
                
                {/* Version mobile optimisée */}
                {isMobile ? (
                  <Box sx={{ p: 2 }}>
                    {statsByType.map((stat, index) => (
                      <Card 
                        key={stat.type}
                        sx={{
                          mb: 2,
                          bgcolor: isDarkMode ? '#374151' : '#f8fafc',
                          border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                          borderRadius: 2,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          {/* Header type */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ mr: 1.5 }}>
                              {(() => {
                                switch (stat.type) {
                                  case "funds_withdrawal":
                                    return <MoneyOffIcon sx={{ color: '#ef4444', fontSize: 18 }} />;
                                  case "sponsorship_commission":
                                    return <TrendingUpIcon sx={{ color: '#10b981', fontSize: 18 }} />;
                                  case "withdrawal_commission":
                                    return <AccountBalanceWalletIcon sx={{ color: '#3b82f6', fontSize: 18 }} />;
                                  case "transfer_commission":
                                    return <SwapHorizIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />;
                                  case "pack_sale":
                                  case "pack_purchase":
                                    return <ShoppingCartIcon sx={{ color: '#10b981', fontSize: 18 }} />;
                                  case "boost_sale":
                                  case "boost_purchase":
                                    return <RocketLaunchIcon sx={{ color: '#f59e0b', fontSize: 18 }} />;
                                  case "virtual_sale":
                                  case "virtual_purchase":
                                    return <DevicesIcon sx={{ color: '#06b6d4', fontSize: 18 }} />;
                                  case "digital_product_sale":
                                  case "digital_product_purchase":
                                    return <CloudDownloadIcon sx={{ color: '#ec4899', fontSize: 18 }} />;
                                  case "funds_transfer":
                                    return <ArrowForwardIcon sx={{ color: '#6b7280', fontSize: 18 }} />;
                                  case "funds_receipt":
                                    return <ArrowBackIcon sx={{ color: '#6b7280', fontSize: 18 }} />;
                                  case "sale_commission":
                                    return <TrendingUpIcon sx={{ color: '#059669', fontSize: 18 }} />;
                                  case "esengo_funds_transfer":
                                    return <AccountBalanceIcon sx={{ color: '#7c3aed', fontSize: 18 }} />;
                                  case "refund":
                                    return <RefreshIcon sx={{ color: '#dc2626', fontSize: 18 }} />;
                                  default:
                                    return <ReceiptIcon sx={{ color: '#9ca3af', fontSize: 18 }} />;
                                }
                              })()}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Chip
                                label={
                                  getOperationType(stat.type)
                                }
                                size="small"
                                sx={{
                                  bgcolor: (() => {
                                    switch (stat.type) {
                                      default:
                                        return getTransactionColor(stat.type, isDarkMode);
                                    }
                                  })(),
                                  color: (() => {
                                    isDarkMode ? "#b7b7b7ff" : "#3a3a3aff";
                                  })(),
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Stats principales */}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.75rem',
                                mb: 0.5
                              }}>
                                Nombre
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold',
                                color: isDarkMode ? '#e5e7eb' : '#374151',
                                fontSize: '1.1rem'
                              }}>
                                {stat.count}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.75rem',
                                mb: 0.5
                              }}>
                                Montant total
                              </Typography>
                              <Typography variant="h6" sx={{
                                color: stat.type === "withdrawal" 
                                  ? "#ef4444" 
                                  : "#10b981",
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                              }}>
                                {formatAmount(stat.total_amount)}
                              </Typography>
                            </Grid>
                          </Grid>

                          {/* Devise et dates */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.7rem',
                                display: 'block'
                              }}>
                                {formatDate(stat.first_transaction)}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.7rem'
                              }}>
                                → {formatDate(stat.last_transaction)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  /* Version desktop */
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{
                          bgcolor: isDarkMode ? '#111827' : '#f1f5f9',
                        }}>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#e5e7eb' : '#475569',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Type de transaction
                          </TableCell>
                          <TableCell align="center" sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#e5e7eb' : '#475569',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Nombre
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#e5e7eb' : '#475569',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Montant total
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#e5e7eb' : '#475569',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Première transaction
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'bold', 
                            color: isDarkMode ? '#e5e7eb' : '#475569',
                            fontSize: '0.875rem',
                            py: 2
                          }}>
                            Dernière transaction
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {statsByType.map((stat, index) => (
                          <TableRow
                            key={stat.type}
                            sx={{
                              "&:hover": {
                                bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                              },
                              borderBottom: `1px solid ${
                                isDarkMode ? "#374151" : "#f1f5f9"
                              }`,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ mr: 2 }}>
                                  {(() => {
                                    switch (stat.type) {
                                      case "funds_withdrawal":
                                        return <MoneyOffIcon sx={{ color: '#ef4444', fontSize: 18 }} />;
                                      case "sponsorship_commission":
                                        return <TrendingUpIcon sx={{ color: '#10b981', fontSize: 18 }} />;
                                      case "withdrawal_commission":
                                        return <AccountBalanceWalletIcon sx={{ color: '#3b82f6', fontSize: 18 }} />;
                                      case "transfer_commission":
                                        return <SwapHorizIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />;
                                      case "pack_sale":
                                      case "pack_purchase":
                                        return <ShoppingCartIcon sx={{ color: '#10b981', fontSize: 18 }} />;
                                      case "boost_sale":
                                      case "boost_purchase":
                                        return <RocketLaunchIcon sx={{ color: '#f59e0b', fontSize: 18 }} />;
                                      case "virtual_sale":
                                      case "virtual_purchase":
                                        return <DevicesIcon sx={{ color: '#06b6d4', fontSize: 18 }} />;
                                      case "digital_product_sale":
                                      case "digital_product_purchase":
                                        return <CloudDownloadIcon sx={{ color: '#ec4899', fontSize: 18 }} />;
                                      case "funds_transfer":
                                        return <ArrowForwardIcon sx={{ color: '#6b7280', fontSize: 18 }} />;
                                      case "funds_receipt":
                                        return <ArrowBackIcon sx={{ color: '#6b7280', fontSize: 18 }} />;
                                      case "sale_commission":
                                        return <TrendingUpIcon sx={{ color: '#059669', fontSize: 18 }} />;
                                      case "esengo_funds_transfer":
                                        return <AccountBalanceIcon sx={{ color: '#7c3aed', fontSize: 18 }} />;
                                      case "refund":
                                        return <RefreshIcon sx={{ color: '#dc2626', fontSize: 18 }} />;
                                      default:
                                        return <ReceiptIcon sx={{ color: '#9ca3af', fontSize: 18 }} />;
                                    }
                                  })()}
                                </Box>
                                <Chip
                                  label={
                                    getOperationType(stat.type)
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: (() => {
                                      switch (stat.type) {
                                        default:
                                          return getTransactionColor(stat.type, isDarkMode);
                                      }
                                    })(),
                                    color: (() => {
                                      isDarkMode ? "#b7b7b7ff" : "#3a3a3aff";
                                    })(),
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body1" sx={{ 
                                fontWeight: 'bold',
                                color: isDarkMode ? '#e5e7eb' : '#374151'
                              }}>
                                {stat.count}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{
                                color: stat.type === "withdrawal" 
                                  ? "#ef4444" 
                                  : "#10b981",
                                fontWeight: 'bold',
                                fontSize: '1rem',
                              }}>
                                {formatAmount(stat.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.875rem'
                              }}>
                                {formatDate(stat.first_transaction)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ 
                                color: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: '0.875rem'
                              }}>
                                {formatDate(stat.last_transaction)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </>
          )}
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          {/* Composant Commissions */}
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="400px"
              >
                <CircularProgress color="primary" />
                <Typography variant="body1" ml={2} color="textSecondary">
                  Chargement des commissions...
                </Typography>
              </Box>
            }
          >
            <Commissions />
          </Suspense>
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          {/* Composant WithdrawalRequests */}
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="400px"
              >
                <CircularProgress color="primary" />
                <Typography variant="body1" ml={2} color="textSecondary">
                  Chargement des demandes de retrait...
                </Typography>
              </Box>
            }
          >
            <WithdrawalRequests />
          </Suspense>
        </Box>
      )}

      {/* Modal de retrait des bénéfices */}
      {showWithdrawalModal && (
        <>
          {/* Overlay avec effet de flou et voûte noire */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
            onClick={() => {
              setShowWithdrawalModal(false);
              setWithdrawalAmount("");
              setWithdrawalPassword("");
              setWithdrawalError("");
              setAmountError("");
            }}
          />
          
          {/* Contenu du modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className={`${themeColors.card} rounded-xl shadow-2xl transform transition-all duration-300 scale-100 opacity-100 w-full max-w-md max-h-[90vh] flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Entête sticky */}
              <div className="flex items-center justify-between p-6 pb-4 sticky top-0 z-10 bg-inherit border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-xl font-bold ${themeColors.text.primary}`}>
                  Retrait du compte principal SOLIFIN
                </h3>
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setWithdrawalAmount("");
                    setWithdrawalPassword("");
                    setWithdrawalError("");
                    setAmountError("");
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                >
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Contenu défilant */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Solde disponible */}
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${themeColors.text.secondary} mb-1`}>
                    Solde disponible
                  </p>
                  <p className={`text-2xl font-bold text-green-600 dark:text-green-400`}>
                    {formatAmount(systemBalance?.plateforme_benefices || 0)}
                  </p>
                </div>

                {/* Formulaire de retrait */}
                <div className="space-y-4">
                  {/* Champ montant */}
                  <div>
                    <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                      Montant à retirer
                    </label>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => validateAmount(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.background} ${themeColors.text.primary} focus:ring-2 focus:ring-green-500 focus:border-transparent ${amountError ? 'border-red-500' : ''}`}
                      placeholder="Entrez le montant"
                      min="0"
                      max={systemBalance?.plateforme_benefices || 0}
                    />
                    {/* Alerte sous le champ montant */}
                    {amountError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <ErrorIcon className="w-4 h-4 mr-1" />
                        {amountError}
                      </p>
                    )}
                  </div>

                  {/* Champ mot de passe */}
                  <div>
                    <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={withdrawalPassword}
                      onChange={(e) => setWithdrawalPassword(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.background} ${themeColors.text.primary} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>

                  {/* Résumé du retrait */}
                  {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${themeColors.border}`}>
                      <h4 className={`text-sm font-semibold ${themeColors.text.primary} mb-3`}>
                        Résumé du retrait
                      </h4>
                      {loadingFees ? (
                        <div className="flex items-center justify-center py-4">
                          <CircularProgress size={24} className="text-green-600 dark:text-green-400 mr-2" />
                          <span className={`text-sm ${themeColors.text.secondary}`}>Chargement des frais...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${themeColors.text.secondary}`}>Montant demandé:</span>
                            <span className={`text-sm font-medium ${themeColors.text.primary}`}>
                              {formatAmount(parseFloat(withdrawalAmount) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${themeColors.text.secondary}`}>Frais API ({serdipayFees}%):</span>
                            <span className={`text-sm font-medium text-orange-600 dark:text-orange-400`}>
                              +{formatAmount(calculateFees().fees)}
                            </span>
                          </div>
                          <div className={`pt-2 mt-2 border-t ${themeColors.border}`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-semibold ${themeColors.text.primary}`}>Montant total à prélever:</span>
                              <span className={`text-sm font-bold text-red-600 dark:text-red-400`}>
                                {formatAmount(calculateFees().totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {withdrawalError && (
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {withdrawalError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pied de page sticky */}
              <div className="sticky bottom-0 z-10 bg-inherit p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowWithdrawalModal(false);
                      setWithdrawalAmount("");
                      setWithdrawalPassword("");
                      setWithdrawalError("");
                      setAmountError("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    disabled={withdrawalLoading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleWithdrawal}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isWithdrawButtonDisabled()}
                  >
                    {withdrawalLoading ? "Traitement..." : "Confirmer le retrait"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal d'ajustement de solde */}
      {showBalanceAdjustmentModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${themeColors.card} rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden`}>
              {/* En-tête */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Ajustement de solde
                  </h2>
                  <button
                    onClick={() => {
                      setShowBalanceAdjustmentModal(false);
                      setAdjustmentForm({
                        source_account: '',
                        destination_account: '',
                        amount: '',
                        reason: '',
                        password: ''
                      });
                      setAdjustmentError('');
                    }}
                    className={`p-2 rounded-lg ${themeColors.text.secondary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Corps du formulaire */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Source account */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                    Compte source
                  </label>
                  <select
                    value={adjustmentForm.source_account}
                    onChange={(e) => {
                      setAdjustmentForm({
                        ...adjustmentForm,
                        source_account: e.target.value,
                        destination_account: '' // Réinitialiser la destination
                      });
                      setAdjustmentError('');
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Sélectionner une source</option>
                    <option value="api_provider">API Provider</option>
                    <option value="solifin_benefits">Bénéfices SOLIFIN</option>
                    <option value="engagement_users">Engagements utilisateurs</option>
                  </select>
                </div>

                {/* Destination account */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                    Compte destination
                  </label>
                  <select
                    value={adjustmentForm.destination_account}
                    onChange={(e) => {
                      setAdjustmentForm({
                        ...adjustmentForm,
                        destination_account: e.target.value
                      });
                      setAdjustmentError('');
                    }}
                    disabled={!adjustmentForm.source_account}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50`}
                  >
                    <option value="">Sélectionner une destination</option>
                    {adjustmentForm.source_account === 'api_provider' && (
                      <option value="solde_marchand">Solde marchand</option>
                    )}
                    {adjustmentForm.source_account === 'solifin_benefits' && (
                      <option value="engagement_users">Engagements utilisateurs</option>
                    )}
                    {adjustmentForm.source_account === 'engagement_users' && (
                      <option value="solifin_benefits">Bénéfices SOLIFIN</option>
                    )}
                  </select>
                </div>

                {/* Montant */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                    Montant
                  </label>
                  <input
                    type="number"
                    value={adjustmentForm.amount}
                    onChange={(e) => {
                      setAdjustmentForm({
                        ...adjustmentForm,
                        amount: e.target.value
                      });
                      setAdjustmentError('');
                    }}
                    placeholder="Entrez le montant"
                    min="0.01"
                    step="0.01"
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                {/* Raison */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                    Raison de l'ajustement
                  </label>
                  <textarea
                    value={adjustmentForm.reason}
                    onChange={(e) => {
                      setAdjustmentForm({
                        ...adjustmentForm,
                        reason: e.target.value
                      });
                      setAdjustmentError('');
                    }}
                    placeholder="Décrivez la raison de cet ajustement"
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  />
                </div>

                {/* Mot de passe */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
                    Mot de passe administrateur
                  </label>
                  <input
                    type="password"
                    value={adjustmentForm.password}
                    onChange={(e) => {
                      setAdjustmentForm({
                        ...adjustmentForm,
                        password: e.target.value
                      });
                      setAdjustmentError('');
                    }}
                    placeholder="Entrez votre mot de passe"
                    className={`w-full px-3 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                {/* Message d'erreur */}
                {adjustmentError && (
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {adjustmentError}
                    </p>
                  </div>
                )}
              </div>

              {/* Pied de page */}
              <div className="sticky bottom-0 z-10 bg-inherit p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBalanceAdjustmentModal(false);
                      setAdjustmentForm({
                        source_account: '',
                        destination_account: '',
                        amount: '',
                        reason: '',
                        password: ''
                      });
                      setAdjustmentError('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border ${themeColors.border} ${themeColors.text.primary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    disabled={adjustmentLoading}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBalanceAdjustment}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={adjustmentLoading || !adjustmentForm.source_account || !adjustmentForm.destination_account || !adjustmentForm.amount || parseFloat(adjustmentForm.amount) <= 0 || !adjustmentForm.reason.trim() || !adjustmentForm.password.trim()}
                  >
                    {adjustmentLoading ? "Traitement..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Conteneur pour les notifications Toast */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme={isDarkMode ? "dark" : "light"}
      />
    </Box>
  );
};

export default Finances;
