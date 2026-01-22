import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeftIcon, BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function NotificationCenter() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 30,
    total: 0,
  });
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications?page=${page}`);
      
      // Laravel pagination retourne { data: [], current_page, last_page, per_page, total }
      let notificationsData = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: 30,
        total: 0,
      };
      
      if (response.data && response.data.data) {
        // Si c'est une réponse paginée Laravel
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          notificationsData = response.data.data.data;
          paginationData = {
            current_page: response.data.data.current_page || 1,
            last_page: response.data.data.last_page || 1,
            per_page: response.data.data.per_page || 30,
            total: response.data.data.total || 0,
          };
        } else if (Array.isArray(response.data.data)) {
          // Si c'est directement un tableau
          notificationsData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        // Fallback si la réponse est directement un tableau
        notificationsData = response.data;
      }
      
      setNotifications(notificationsData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      showToast("Erreur lors du chargement des notifications", "error");
      setNotifications([]); // S'assurer que notifications est un tableau même en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      fetchNotifications(page);
    }
  };

  const goToPreviousPage = () => {
    if (pagination.current_page > 1) {
      goToPage(pagination.current_page - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      goToPage(pagination.current_page + 1);
    }
  };

  const markAsRead = async (id, link) => {
    try {
      await axios.post(`/api/notifications/${id}/read`);
      // Mettre à jour la liste des notifications après avoir marqué comme lu
      setNotifications(prevNotifications => (prevNotifications || []).map((notif) => 
        notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
      ));

      // Si un lien est fourni dans les métadonnées, rediriger l'utilisateur
      if (link) {
        navigate(link);
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        error
      );
      showToast("Erreur lors du marquage de la notification comme lue", "error");
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/api/notifications/mark-all-read");
      setNotifications(prevNotifications => (prevNotifications || []).map((notif) => ({ 
        ...notif, 
        read_at: notif.read_at || new Date().toISOString() 
      })));
      showToast("Toutes les notifications ont été marquées comme lues", "success");
    } catch (error) {
      console.error(
        "Erreur lors du marquage de toutes les notifications comme lues:",
        error
      );
      showToast("Erreur lors du marquage des notifications comme lues", "error");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Formater la date de la notification
  const formatNotificationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Déterminer l'icône et la couleur en fonction du type de notification
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return {
          bgColor: isDarkMode ? "bg-green-900/20" : "bg-green-100",
          textColor: isDarkMode ? "text-green-400" : "text-green-800",
          icon: <CheckCircleIcon className="h-5 w-5" />,
        };
      case "warning":
        return {
          bgColor: isDarkMode ? "bg-yellow-900/20" : "bg-yellow-100",
          textColor: isDarkMode ? "text-yellow-400" : "text-yellow-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "danger":
        return {
          bgColor: isDarkMode ? "bg-red-900/20" : "bg-red-100",
          textColor: isDarkMode ? "text-red-400" : "text-red-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          bgColor: isDarkMode ? "bg-blue-900/20" : "bg-blue-100",
          textColor: isDarkMode ? "text-blue-400" : "text-blue-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode
                    ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                    : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Centre de notifications
                </h1>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Gérez toutes vos notifications
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Tout marquer comme lu</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className={`rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm w-full`}>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <p className={`text-lg font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Aucune notification
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"} mt-1`}>
                Vous n'avez aucune notification pour le moment
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 w-full">
              {Array.isArray(notifications) && notifications.map((notification) => {
                const style = getNotificationStyle(
                  notification.data?.type || "info"
                );
                const notificationLink =
                  notification.data?.link ||
                  notification.data?.lien ||
                  null;
                const isRead = !!notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      isRead ? "opacity-75" : ""
                    }`}
                    onClick={() => notificationLink && markAsRead(notification.id, notificationLink)}
                  >
                    <div className="p-4 w-full">
                      <div className="flex items-start gap-3 w-full">
                        <div
                          className={`flex-shrink-0 p-2 rounded-full ${style.bgColor} ${style.textColor}`}
                        >
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                } ${!isRead ? "font-semibold" : ""}`}
                              >
                                {notification.data?.titre || notification.data?.title || "Notification"}
                              </p>
                              <p
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                } mt-1`}
                              >
                                {notification.data?.message ||
                                  notification.data?.content ||
                                  ""}
                              </p>
                              <p
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-500" : "text-gray-400"
                                } mt-2`}
                              >
                                {formatNotificationDate(notification.created_at)}
                                {!isRead && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Non lue
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Contrôles de pagination */}
        {pagination.last_page > 1 && (
          <div className={`mt-6 flex items-center justify-between ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            <div className="text-sm">
              Affichage de {notifications.length} sur {pagination.total} notifications
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={pagination.current_page === 1}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  pagination.current_page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
                } ${isDarkMode ? "bg-gray-800" : "bg-white border border-gray-300"}`}
              >
                Précédent
              </button>
              
              <span className="px-3 py-1 text-sm">
                Page {pagination.current_page} sur {pagination.last_page}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={pagination.current_page === pagination.last_page}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  pagination.current_page === pagination.last_page
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
                } ${isDarkMode ? "bg-gray-800" : "bg-white border border-gray-300"}`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
