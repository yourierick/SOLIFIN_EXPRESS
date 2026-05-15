import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  PlayIcon,
  ClockIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-toastify";
import VideoModal from "../../../components/VideoModal";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function FundRaisingValidation() {
  const { isDarkMode } = useTheme();
  const [fundraisings, setFundraisings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFundraising, setSelectedFundraising] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fundraisingToDelete, setFundraisingToDelete] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const abortControllerRef = useRef(null);

  // Fetch fundraisings
  const fetchFundraisings = async (page = 1) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      const response = await axios.get("api/admin/fundraisings", {
        params: { 
          statut: filter !== "all" ? filter : undefined,
          page: page,
          per_page: 10,
          search: searchQuery && searchQuery.trim() !== "" ? searchQuery : undefined,
        },
        signal: controller.signal,
      });
      setFundraisings(response.data.fundraisings?.data || []);
      setPagination({
        currentPage: response.data.fundraisings?.current_page || 1,
        totalPages: response.data.fundraisings?.last_page || 1,
        total: response.data.fundraisings?.total || 0,
      });
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error("Erreur lors du chargement des fundraisings:", error);
        toast.error("Erreur lors du chargement des fundraisings");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisings(1);
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFundraisings(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    fetchFundraisings(page);
  };

  // Approve fundraising
  const handleApprove = async (id) => {
    try {
      const response = await axios.post(`api/admin/fundraisings/${id}/approve`);
      if (response.data.success) {
        toast.success("Fundraising approuvé avec succès");
        fetchFundraisings(pagination.currentPage);
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  // Reject fundraising
  const handleReject = async (id) => {
    try {
      const response = await axios.post(`api/admin/fundraisings/${id}/suspend`);
      if (response.data.success) {
        toast.success("Fundraising suspendu avec succès");
        fetchFundraisings(pagination.currentPage);
      }
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      toast.error("Erreur lors du rejet");
    }
  };

  // Delete fundraising
  const handleDelete = async () => {
    if (!fundraisingToDelete) return;

    try {
      const response = await axios.delete(
        `api/admin/fundraisings/${fundraisingToDelete.id}`
      );
      if (response.data.success) {
        toast.success("Fundraising supprimé avec succès");
        setIsDeleteModalOpen(false);
        setFundraisingToDelete(null);
        fetchFundraisings(pagination.currentPage);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    handleDelete();
  };

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Pending count
  const pendingCount = useMemo(() => {
    return fundraisings.filter((f) => f.statut === "pending").length;
  }, [fundraisings]);

  return (
    <div className="space-y-6">
      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] sm:w-64">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }`}
        >
          <option value="all">Tous les statuts</option>
          <option value="publié">Publié</option>
          <option value="suspendu">Suspendus</option>
        </select>
      </div>

      {/* Fundraisings List */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {fundraisings.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              Aucun fundraising trouvé
            </div>
          ) : (
            fundraisings.map((fundraising) => (
              <div
                key={fundraising.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  {fundraising.image_url && (
                    <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0">
                      <img
                        src={fundraising.image_url}
                        alt={fundraising.titre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {fundraising.titre}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              fundraising.statut === "publié"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : fundraising.statut === "suspendu"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {fundraising.statut}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                          {fundraising.description}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedFundraising(fundraising);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(fundraising.id)}
                          className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Publier"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleReject(fundraising.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Suspendre"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setFundraisingToDelete(fundraising);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <BanknotesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Objectif</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatAmount(fundraising.cout_total)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Mobilisé</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatAmount(fundraising.mobilise)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <BanknotesIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Reste</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatAmount(fundraising.gap)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Author */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {fundraising.user?.picture ? (
                            <img
                              src={fundraising.user.picture_url}
                              alt={fundraising.user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {fundraising.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Par {fundraising.user?.name}
                        </span>
                      </div>
                      {fundraising.video && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Vidéo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.total} éléments)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                pagination.currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pagination.currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`p-2 rounded-lg transition-colors ${
                pagination.currentPage === pagination.totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedFundraising &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 animate-in fade-in zoom-in duration-200`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Détails du Fundraising
                  </h2>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Image */}
                {selectedFundraising.image_url && (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={selectedFundraising.image_url}
                        alt={selectedFundraising.titre}
                        className="w-full h-full object-cover"
                      />
                      {selectedFundraising.video_url && (
                        <button
                          onClick={() => setIsVideoModalOpen(true)}
                          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-opacity"
                        >
                          <PlayIcon className="h-16 w-16 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedFundraising.titre}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {selectedFundraising.description}
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Objectif</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatAmount(selectedFundraising.cout_total)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mobilisé</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatAmount(selectedFundraising.mobilise)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reste</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatAmount(selectedFundraising.gap)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedFundraising.statut}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progression</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedFundraising.cout_total > 0 
                        ? Math.round((selectedFundraising.mobilise / selectedFundraising.cout_total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${selectedFundraising.cout_total > 0 
                          ? (selectedFundraising.mobilise / selectedFundraising.cout_total) * 100 
                          : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Author */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {selectedFundraising.user?.picture ? (
                      <img
                        src={selectedFundraising.user.picture_url}
                        alt={selectedFundraising.user.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {selectedFundraising.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Créé par</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedFundraising.user?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFundraisingToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce fundraising ?"
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        type="danger"
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedFundraising?.video_url}
        zIndex="z-[10000]"
      />
    </div>
  );
}
