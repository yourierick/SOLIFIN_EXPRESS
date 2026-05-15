import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../utils/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { Tab } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import FundraisingCard from "./FundraisingCard";
import FundraisingCreateModal from "./FundraisingCreateModal";
import FundraisingEditModal from "./FundraisingEditModal";
import ConfirmationModal from "../../../components/ConfirmationModal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import {
  CurrencyDollarIcon,
  WalletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePublicationPack } from "../../../contexts/PublicationPackContext";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Fundraising() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // États pour l'onglet Catalogue
  const [catalogueFundraisings, setCatalogueFundraisings] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState(null);
  const [cataloguePage, setCataloguePage] = useState(1);
  const [cataloguePerPage, setCataloguePerPage] = useState(10);
  const [catalogueTotal, setCatalogueTotal] = useState(0);
  const [catalogueSearchQuery, setCatalogueSearchQuery] = useState("");
  
  // États pour l'onglet Mes projets
  const [myFundraisings, setMyFundraisings] = useState([]);
  const [myFundraisingsLoading, setMyFundraisingsLoading] = useState(true);
  const [myFundraisingsError, setMyFundraisingsError] = useState(null);
  const [myFundraisingsPage, setMyFundraisingsPage] = useState(0);
  const [myFundraisingsRowsPerPage, setMyFundraisingsRowsPerPage] = useState(10);
  const [myFundraisingsTotal, setMyFundraisingsTotal] = useState(0);
  const [myFundraisingsStatusFilter, setMyFundraisingsStatusFilter] = useState("all");
  const [myFundraisingsSearchQuery, setMyFundraisingsSearchQuery] = useState("");
  
  // États généraux
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFundraising, setSelectedFundraising] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // États pour les modaux de confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeAmount, setFinanceAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isFinancing, setIsFinancing] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [selectedFundraisingId, setSelectedFundraisingId] = useState(null);
  const [transferFeePercentage, setTransferFeePercentage] = useState(0);
  const {
    isActive: isPackActive,
    canPublish: can_publish,
    packInfo,
    refreshPackStatus,
  } = usePublicationPack();


  // Formater le montant
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Fonction pour récupérer les frais de transfert
  const fetchTransferFees = async () => {
    try {
      const response = await axios.get(`/api/getTransferFees`);

      if (response.data.success) {
        setTransferFeePercentage(response.data.fee_percentage);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de transfert:",
        error
      );
    }
  };

  // Fonction pour charger les levés de fonds du catalogue avec pagination
  const fetchCatalogueFundraisings = useCallback(
    async (retryCount = 0) => {
      try {
        setCatalogueLoading(true);
        setCatalogueError(null);

        const config = {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          params: {
            page: cataloguePage,
            per_page: cataloguePerPage,
            search: catalogueSearchQuery || undefined,
          },
        };

        const response = await axios.get("/api/fundraisings", config);
        setCatalogueFundraisings(response.data.fundraisings?.data || []);
        setCatalogueTotal(response.data.fundraisings?.total || 0);
        setCatalogueLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des levés de fonds:", err);
        
        const isTimeoutError = err.code === "ECONNABORTED" || 
          (err.message && err.message.includes("timeout"));
        
        if (retryCount < 2 && !isTimeoutError) {
          setTimeout(() => {
            fetchCatalogueFundraisings(retryCount + 1);
          }, 2000 * (retryCount + 1));
          return;
        }

        setCatalogueError(
          err.response 
            ? `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`
            : "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
        );
        setCatalogueLoading(false);
      }
    },
    [cataloguePage, cataloguePerPage, catalogueSearchQuery]
  );

  // Fonction pour charger les levés de fonds de l'utilisateur
  const fetchMyFundraisings = useCallback(async () => {
    try {
      setMyFundraisingsLoading(true);
      setMyFundraisingsError(null);

      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        params: {
          page: myFundraisingsPage + 1,
          per_page: myFundraisingsRowsPerPage,
        },
      };

      if (myFundraisingsStatusFilter !== "all") {
        config.params.statut = myFundraisingsStatusFilter;
      }

      if (myFundraisingsSearchQuery) {
        config.params.search = myFundraisingsSearchQuery;
      }

      const response = await axios.get("/api/fundraisings/my-fundraisings", config);
      setMyFundraisings(response.data.fundraisings?.data || []);
      setMyFundraisingsTotal(response.data.fundraisings?.total || 0);
    } catch (err) {
      console.error("Erreur lors du chargement de vos levés de fonds:", err);
      setMyFundraisingsError(
        err.response 
          ? `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`
          : "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
      );
    } finally {
      setMyFundraisingsLoading(false);
    }
  }, [myFundraisingsPage, myFundraisingsRowsPerPage, myFundraisingsStatusFilter, myFundraisingsSearchQuery]);

  // Initialisation au changement d'onglet
  useEffect(() => {
    if (activeTab === 0) {
      // Onglet Catalogue
      setCataloguePage(1);
      fetchCatalogueFundraisings();
    } else if (activeTab === 1) {
      // Onglet Mes projets
      fetchMyFundraisings();
    }
  }, [activeTab, fetchCatalogueFundraisings, fetchMyFundraisings]);

  // Recharger les données quand les filtres changent
  useEffect(() => {
    if (activeTab === 0) {
      const timeoutId = setTimeout(() => {
        setCataloguePage(1);
        fetchCatalogueFundraisings();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [catalogueSearchQuery, activeTab, fetchCatalogueFundraisings]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchCatalogueFundraisings();
    }
  }, [cataloguePage, cataloguePerPage, activeTab, fetchCatalogueFundraisings]);

  // Gérer le like
  const handleLike = async (fundraisingId) => {
    try {
      const response = await axios.post(`/api/fundraisings/${fundraisingId}/like`);
      
      if (response.data.success) {
        // Mettre à jour l'état local
        setCatalogueFundraisings(prev => 
          prev.map(f => 
            f.id === fundraisingId 
              ? { ...f, is_liked: !f.is_liked, likes_count: f.is_liked ? f.likes_count - 1 : f.likes_count + 1 }
              : f
          )
        );
        
        setMyFundraisings(prev => 
          prev.map(f => 
            f.id === fundraisingId 
              ? { ...f, is_liked: !f.is_liked, likes_count: f.is_liked ? f.likes_count - 1 : f.likes_count + 1 }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Gérer la vue des détails
  const handleViewDetails = (fundraisingId) => {
    // Naviguer vers la page de détails du fundraising
    // Pour l'instant, on pourrait ouvrir un modal ou naviguer vers une page dédiée
    navigate(`/fundraisings/${fundraisingId}`);
  };

  // Gérer le financement
  const handleFinance = async () => {
    const amount = parseFloat(financeAmount);
    if (!amount || amount <= 0) return;
    
    // Calculer les frais
    const transferFeeAmount = (amount * transferFeePercentage) / 100;
    const totalCost = amount + transferFeeAmount;
    
    if (selectedFundraising && amount > selectedFundraising.gap) {
      toast.error('Le montant ne peut pas dépasser le reste à financer');
      return;
    }

    if (totalCost > walletBalance) {
      toast.error('Solde insuffisant pour le financement avec frais');
      return;
    }

    try {
      setIsFinancing(true);
      const response = await axios.post(`/api/fundraisings/${selectedFundraisingId}/finance`, {
        amount: amount
      });

      if (response.data.success) {
        setFinanceAmount('');
        setIsFinanceModalOpen(false);
        fetchCatalogueFundraisings();
        fetchMyFundraisings();
        toast.success('Financement effectué avec succès !');
      } else {
        toast.error('Erreur lors du financement. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors du financement:', error);
      toast.error('Erreur lors du financement. Veuillez réessayer.');
    } finally {
      setIsFinancing(false);
    }
  };

  // Récupérer le solde du wallet
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get("/api/userwallet/balance");
      if (response.data.success) {
        const cleanBalance = (response.data.available_balance || "0").replace(
          /[^0-9.-]/g,
          ""
        );
        return parseFloat(cleanBalance);
      }
      return 0;
    } catch (error) {
      console.error("Erreur lors de la récupération du solde:", error);
      return 0;
    }
  };

  // Ouvrir le modal de financement
  const handleOpenFinanceModal = (fundraising) => {
    setSelectedFundraising(fundraising);
    setSelectedFundraisingId(fundraising.id);
    setFinanceAmount('');
    setWalletBalance(0);
    setIsWalletLoading(true);
    setIsFinanceModalOpen(true);
    
    // Charger le solde et les frais après ouverture du modal
    Promise.all([
      fetchWalletBalance(),
      fetchTransferFees()
    ]).then(([balance]) => {
      setWalletBalance(balance);
      setIsWalletLoading(false);
    });
  };

  // Gérer l'édition de projet
  const handleEditProject = (fundraisingId) => {
    // Trouver le projet à éditer
    const project = myFundraisings.find(f => f.id === fundraisingId);
    if (project) {
      // Ouvrir le modal d'édition avec les données du projet
      setEditingProject(project);
      setIsEditModalOpen(true);
    }
  };

  // Gérer la suppression de projet
  const handleDelete = (fundraisingId) => {
    setSelectedProjectId(fundraisingId);
    setDeleteModalOpen(true);
  };

  // Gérer la publication de projet
  const handlePublish = (fundraisingId) => {
    setSelectedProjectId(fundraisingId);
    setPublishModalOpen(true);
  };

  // Confirmer la publication
  const confirmPublish = async () => {
    setActionLoading(true);
    
    try {
      const response = await axios.put(`/api/fundraisings/${selectedProjectId}/publish`);
      
      if (response.data.success) {
        // Mettre à jour l'état local
        setMyFundraisings(prev => 
          prev.map(f => 
            f.id === selectedProjectId 
              ? { ...f, statut: 'publié' }
              : f
          )
        );
        
        // Si le projet est publié, l'ajouter au catalogue
        const updatedProject = response.data.fundraising;
        if (updatedProject.statut === 'publié') {
          setCatalogueFundraisings(prev => {
            const exists = prev.find(f => f.id === selectedProjectId);
            if (!exists) {
              return [updatedProject, ...prev];
            }
            return prev.map(f => f.id === selectedProjectId ? updatedProject : f);
          });
        }
        
        // Fermer le modal
        setPublishModalOpen(false);
        setSelectedProjectId(null);
        
        // Afficher une notification de succès
        toast.success('Projet publié avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      
      // Afficher une notification d'erreur
      const notification = document.createElement('div');
      notification.textContent = 'Erreur lors de la publication du projet.';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    setActionLoading(true);
    
    try {
      const response = await axios.delete(`/api/fundraisings/${selectedProjectId}`);
      
      if (response.data.success) {
        // Mettre à jour l'état local
        setMyFundraisings(prev => prev.filter(f => f.id !== selectedProjectId));
        setCatalogueFundraisings(prev => prev.filter(f => f.id !== selectedProjectId));
        
        // Fermer le modal
        setDeleteModalOpen(false);
        setSelectedProjectId(null);
        
        // Afficher une notification de succès
        toast.success('Projet supprimé avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      
      // Afficher une notification d'erreur
      toast.error('Erreur lors de la suppression du projet.');
    } finally {
      setActionLoading(false);
    }
  };

  // Gérer le succès de la création
  const handleCreateSuccess = (fundraising) => {
    // Mettre à jour les listes locales
    if (editingProject) {
      // Mode édition : mettre à jour le projet existant
      setMyFundraisings(prev => 
        prev.map(f => f.id === fundraising.id ? fundraising : f)
      );
      setCatalogueFundraisings(prev => 
        prev.map(f => f.id === fundraising.id ? fundraising : f)
      );
    } else {
      // Mode création : ajouter le nouveau projet
      setCatalogueFundraisings(prev => [fundraising, ...prev]);
      setMyFundraisings(prev => [fundraising, ...prev]);
    }
    
    // Réinitialiser le projet d'édition
    setEditingProject(null);
    setIsEditModalOpen(false);
    
    // Afficher une notification de succès
    const notification = document.createElement('div');
    notification.textContent = editingProject ? 'Projet modifié avec succès !' : 'Projet créé avec succès !';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  // Gérer le partage
  const handleShare = async (fundraisingId) => {
    try {
      if (navigator.share) {
        // Partage natif sur mobile
        await navigator.share({
          title: 'Découvrez ce projet de levé de fonds',
          text: 'Je vous invite à découvrir ce projet de levé de fonds sur SOLIFIN',
          url: `${window.location.origin}/fundraisings/${fundraisingId}`
        });
      } else {
        // Fallback : copier le lien dans le presse-papiers
        const shareUrl = `${window.location.origin}/fundraisings/${fundraisingId}`;
        await navigator.clipboard.writeText(shareUrl);
        
        // Notification simple
        const notification = document.createElement('div');
        notification.textContent = 'Lien copié dans le presse-papiers !';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 9999;
          font-size: 14px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Gérer l'ajout de commentaire
  const handleComment = async (fundraisingId, content) => {
    try {
      const response = await axios.post(`/api/fundraisings/${fundraisingId}/comment`, {
        contenu: content,
      });

      if (response.data.success) {
        // Rafraîchir les données
        fetchCatalogueFundraisings();
        fetchMyFundraisings();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Levés de fonds
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Découvrez et soutenez des projets qui vous tiennent à cœur
          </p>
        </div>

        {/* Onglets */}
        <Tab.Group
          selectedIndex={activeTab}
          onChange={setActiveTab}
          className="mb-8"
        >
          <Tab.List className="flex space-x-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2 px-4 text-sm font-medium transition-all",
                  selected
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )
              }
            >
              Catalogue
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2 px-4 text-sm font-medium transition-all",
                  selected
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )
              }
            >
              Mes projets
            </Tab>
          </Tab.List>

          <Tab.Panels>
            {/* Onglet Catalogue */}
            <Tab.Panel>
              {/* Barre de recherche et filtres */}
              <div className="mb-6 mt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un projet..."
                    value={catalogueSearchQuery}
                    onChange={(e) => setCatalogueSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Grille des projets */}
              <div className="space-y-4">
                {catalogueFundraisings.map((fundraising) => (
                  <FundraisingCard
                    key={fundraising.id}
                    fundraising={fundraising}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onView={handleViewDetails}
                    onOpenFinanceModal={handleOpenFinanceModal}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {!catalogueLoading && !catalogueError && catalogueTotal > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4 sm:gap-0">
                  <div className={`text-sm w-full sm:w-auto text-center sm:text-left ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Affichage de {(cataloguePage - 1) * cataloguePerPage + 1} à {Math.min(cataloguePage * cataloguePerPage, catalogueTotal)} sur {catalogueTotal} projets
                  </div>
                  <div className="flex items-center justify-center sm:justify-end space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => setCataloguePage(prev => Math.max(1, prev - 1))}
                      disabled={cataloguePage === 1}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border transition-colors ${
                        cataloguePage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Précédent
                    </button>
                    <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}>
                      Page {cataloguePage} sur {Math.ceil(catalogueTotal / cataloguePerPage)}
                    </div>
                    <button
                      onClick={() => setCataloguePage(prev => prev + 1)}
                      disabled={cataloguePage >= Math.ceil(catalogueTotal / cataloguePerPage)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border transition-colors ${
                        cataloguePage >= Math.ceil(catalogueTotal / cataloguePerPage)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}

              {/* États de chargement */}
              {catalogueLoading && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}

              {catalogueError && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{catalogueError}</p>
                  <button
                    onClick={() => setCataloguePage(1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {!catalogueLoading && !catalogueError && catalogueFundraisings.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun projet trouvé pour le moment.
                  </p>
                </div>
              )}
            </Tab.Panel>

            {/* Onglet Mes projets */}
            <Tab.Panel>
              <div className="mb-6 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={myFundraisingsSearchQuery}
                      onChange={(e) => setMyFundraisingsSearchQuery(e.target.value)}
                      className={`w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  <select
                    value={myFundraisingsStatusFilter}
                    onChange={(e) => setMyFundraisingsStatusFilter(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="draft">Draft</option>
                    <option value="publié">Publié</option>
                  </select>
                </div>
                {can_publish && isPackActive && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Nouveau projet</span>
                  </button>
                )}
              </div>

              {/* Liste des projets de l'utilisateur */}
              <div className="space-y-4">
                {myFundraisings.map((fundraising) => (
                  <FundraisingCard 
                    key={fundraising.id} 
                    fundraising={fundraising}
                    isUserProjects={true}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onView={handleViewDetails}
                    onEdit={handleEditProject}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                  />
                ))}
              </div>

              {/* États de chargement */}
              {myFundraisingsLoading && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}

              {myFundraisingsError && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{myFundraisingsError}</p>
                  <button
                    onClick={() => fetchMyFundraisings()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {!myFundraisingsLoading && !myFundraisingsError && myFundraisings.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Vous n'avez pas encore créé de projet de levé de fonds.
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Créer mon premier projet
                  </button>
                </div>
              )}
            </Tab.Panel>
            
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Modal de création */}
      {isCreateModalOpen && (
        <FundraisingCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <FundraisingEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProject(null);
          }}
          onSuccess={handleCreateSuccess}
          editingProject={editingProject}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProjectId(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible et toutes les données associées seront perdues."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        type="danger"
        isLoading={actionLoading}
      />

      {/* Modal de confirmation de publication */}
      <ConfirmationModal
        isOpen={publishModalOpen}
        onClose={() => {
          setPublishModalOpen(false);
          setSelectedProjectId(null);
        }}
        onConfirm={confirmPublish}
        title="Publier le projet"
        message="Êtes-vous sûr de vouloir publier ce projet ? Une fois publié, il sera visible par tous les utilisateurs dans le catalogue."
        confirmButtonText="Publier"
        cancelButtonText="Annuler"
        type="info"
        isLoading={actionLoading}
      />

      {/* Modal de financement */}
      {isFinanceModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ${
              isDarkMode ? 'border border-gray-700' : ''
            }`}>
              {/* Header avec gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Financer le projet
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsFinanceModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Solde wallet */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500 rounded-full">
                      <WalletIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Solde disponible
                      </p>
                      {isWalletLoading ? (
                        <div className="h-7 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                      ) : (
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatAmount(walletBalance)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations du projet */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Projet
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFundraising?.titre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Reste à financer
                    </span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {formatAmount(selectedFundraising?.gap)}
                    </span>
                  </div>
                </div>

                {/* Montant à financer */}
                <div className="mb-6">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    <span>Montant à financer (USD)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={financeAmount}
                      onChange={(e) => setFinanceAmount(e.target.value)}
                      min="1"
                      max={selectedFundraising?.gap}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg font-medium"
                      placeholder="0.00"
                    />
                    <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Maximum autorisé: <span className="font-medium">{formatAmount(selectedFundraising?.gap)}</span>
                  </p>
                </div>

                {/* Résumé des frais */}
                {financeAmount && parseFloat(financeAmount) > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                          Montant à financer:
                        </span>
                        <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                          {parseFloat(financeAmount).toFixed(2)} $
                        </span>
                      </div>
                      {transferFeePercentage > 0 && (
                        <div className="flex justify-between">
                          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                            Frais de transfert ({transferFeePercentage}%):
                          </span>
                          <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                            {((parseFloat(financeAmount) * transferFeePercentage) / 100).toFixed(2)} $
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Total à débiter:
                        </span>
                        <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {(parseFloat(financeAmount) + (parseFloat(financeAmount) * transferFeePercentage) / 100).toFixed(2)} $
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsFinanceModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleFinance}
                    disabled={!financeAmount || parseFloat(financeAmount) <= 0 || isFinancing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    {isFinancing ? 'Traitement...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
