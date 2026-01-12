import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import DashboardCarousel from "../../components/DashboardCarousel";
import TrialAlert from "../../components/TrialAlert";
import Confetti from "react-confetti";
import { createPortal } from "react-dom";
import {
  BanknotesIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
  ChartBarIcon,
  PhotoIcon,
  HomeIcon,
  TrophyIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  StarIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import axios from "../../utils/axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const getStatusColor = (status, isDarkMode) => {
  switch (status) {
    case "completed":
      return isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800";
    case "pending":
      return isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800";
    case "failed":
      return isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
    default:
      return isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "Complété";
    case "pending":
      return "En attente";
    case "failed":
      return "Échoué";
    default:
      return status;
  }
};

// Composant de modal de célébration avec createPortal
const GradeCelebrationModal = ({ showGradeCelebration, currentGrade, nextGrade, markGradeNotificationAsSeen, windowDimension }) => {
  if (!showGradeCelebration || !currentGrade) return null;

  return createPortal(
    <>
      {/* Confetti */}
      <Confetti
        width={windowDimension.width}
        height={windowDimension.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.1}
        colors={['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB']}
      />
      
      {/* Overlay blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        onClick={markGradeNotificationAsSeen}
      >
        {/* Modal de célébration */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Empêche la propagation au overlay
        >
          {/* Header avec dégradé */}
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 p-8 text-white">
            <div className="flex items-center justify-center space-x-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-6xl"
              >
                🏆
              </motion.div>
              <div className="text-center">
                <motion.h2 
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold mb-2"
                >
                  Félicitations !
                </motion.h2>
                <motion.p 
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl"
                >
                  Vous avez atteint le grade <span className="font-bold underline">{currentGrade.designation}</span> !
                </motion.p>
              </div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-6xl"
              >
                ⭐
              </motion.div>
            </div>
          </div>
          
          {/* Body avec détails */}
          <div className="p-8 bg-gray-50">
            <div className="flex items-center justify-around mb-6">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm text-gray-600">Niveau</p>
                <p className="text-2xl font-bold text-gray-900">{currentGrade.niveau}</p>
              </motion.div>
              
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">💎</div>
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold text-gray-900">{currentGrade.points}</p>
              </motion.div>
              
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl mb-2">🚀</div>
                <p className="text-sm text-gray-600">Prochain</p>
                <p className="text-2xl font-bold text-gray-900">{nextGrade?.designation || 'Max'}</p>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-gray-600 mb-6">
                Continuez votre excellent travail pour atteindre les progrades niveaux !
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markGradeNotificationAsSeen}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg"
              >
                Super ! Continuer 🎉
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

export default function UserDashboard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isCDFEnabled, canUseCDF, selectedCurrency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trialAlert, setTrialAlert] = useState(null);
  const [grades, setGrades] = useState([]);
  const [lastGradePoint, setLastGradePoints] = useState(0);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [nextGrade, setNextGrade] = useState(null);
  const [userPoints, setUserPoints] = useState(0);

  // États pour l'animation de nouveau grade
  const [showGradeCelebration, setShowGradeCelebration] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    fetchStats();
    checkTrialStatus();
  }, [selectedCurrency]); // Recharger les stats quand la devise change

  // Vérifier si l'utilisateur est en période d'essai en utilisant localStorage
  const checkTrialStatus = () => {
    try {
      const trialInfoStr = localStorage.getItem("trialInfo");
      if (trialInfoStr) {
        const trialInfo = JSON.parse(trialInfoStr);

        if (trialInfo && trialInfo.isTrialUser) {
          const { daysRemaining } = trialInfo;

          // Déterminer le type d'alerte en fonction des jours restants
          let alertType = "info";
          if (daysRemaining <= 3) {
            alertType = "error";
          } else if (daysRemaining <= 7) {
            alertType = "warning";
          }

          // Configurer l'alerte de période d'essai
          setTrialAlert({
            type: alertType,
            message: trialInfo.message,
          });

          // Supprimer l'info du localStorage pour ne l'afficher qu'une fois
          localStorage.removeItem("trialInfo");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut d'essai:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Inclure la devise dans les paramètres de l'API
      const params = new URLSearchParams();
      if (isCDFEnabled) {
        params.append('currency', selectedCurrency);
      } else {
        params.append('currency', 'USD');
      }
      
      const response = await axios.get(`/api/stats/global?${params.toString()}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      setError("Erreur lors de la récupération des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const response = await axios.get('/api/grades');
      
      if (response.data.success) {
        const gradesData = response.data.data.grades;
        const lastGradePoint = response.data.data.progress.last_grade_point
        setGrades(gradesData);
        setLastGradePoints(lastGradePoint);
        
        // Utiliser les données du backend pour le grade actuel et prochain grade
        setCurrentGrade(response.data.data.current_grade);
        setNextGrade(response.data.data.next_grade);
        setUserPoints(parseFloat(response.data.data.user_points));

        // Vérifier si l'utilisateur a une notification de grade non vue
        if (user?.seen_grade_notif === false && currentGrade) {
          setShowGradeCelebration(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des grades:", error);
    } finally {
      setGradesLoading(false);
    }
  };

  // Fonction pour marquer la notification de grade comme vue
  const markGradeNotificationAsSeen = async () => {
    // Fermer le modal immédiatement pour un meilleur UX
    setShowGradeCelebration(false);
    
    // Faire l'appel API en arrière-plan
    try {
      await axios.post('/api/dashboard/grade-notification-seen');
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      // En cas d'erreur, on ne réaffiche pas le modal pour éviter la frustration
    }
  };

  // Détecter le changement de taille de fenêtre pour le confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Vérifier si l'utilisateur a une notification de grade non vue
  useEffect(() => {
    if (user?.seen_grade_notif === false && currentGrade) {
      setShowGradeCelebration(true);
    }
  }, [user, currentGrade]);

  useEffect(() => {
    fetchStats();
    checkTrialStatus();
  }, [selectedCurrency]); // Recharger les stats quand la devise change

  useEffect(() => {
    if (stats) {
      fetchGrades();
    }
  }, [stats]); // Recharger les grades quand les stats sont disponibles

  return (
    <div
      className={`space-y-6 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
    >
      {/* Modal de célébration avec createPortal */}
      <GradeCelebrationModal
        showGradeCelebration={showGradeCelebration}
        currentGrade={currentGrade}
        nextGrade={nextGrade}
        markGradeNotificationAsSeen={markGradeNotificationAsSeen}
        windowDimension={windowDimension}
      />

      {trialAlert && (
        <TrialAlert
          type={trialAlert.type}
          message={trialAlert.message}
          onClose={() => setTrialAlert(null)}
        />
      )}

      {/* Carrousel */}
      <SectionDivider
        title="Actualités et événements"
        icon={
          <HomeIcon
            className={`h-6 w-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-6 rounded-xl ${
          isDarkMode 
            ? "bg-gray-800/50 border border-gray-700/50" 
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <DashboardCarousel />
      </motion.div>

      {/* Statistiques */}
      <SectionDivider
        title="Vos statistiques financières"
        icon={
          <ChartBarIcon
            className={`h-6 w-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Afficher des squelettes de chargement modernes avec couleurs spécifiques
          <>
            {/* Squelette Solde (Bleu) */}
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(59, 130, 246, 0.20)"
                      : "rgba(59, 130, 246, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-24 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div className="space-y-2">
                        <div
                          className={`h-6 w-20 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-4 w-16 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Commissions (Vert) */}
            <motion.div
              key="commission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(16, 185, 129, 0.20)"
                      : "rgba(16, 185, 129, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-32 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div className="space-y-2">
                        <div
                          className={`h-6 w-24 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-4 w-20 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Retraits (Orange) */}
            <motion.div
              key="withdrawal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(251, 146, 60, 0.20)"
                      : "rgba(251, 146, 60, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-28 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div
                        className={`h-8 w-12 rounded-sm ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                  </div>
                  {/* Badge de squelette */}
                  <div
                    className={`absolute -top-2 -right-2 h-6 w-20 rounded-full ${
                      isDarkMode ? "bg-orange-900/60" : "bg-orange-100"
                    } animate-pulse`}
                  />
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Filleuls (Violet) */}
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(147, 51, 234, 0.20)"
                      : "rgba(147, 51, 234, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-28 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div
                        className={`h-8 w-8 rounded-sm ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            <StatCard
              icon={
                <BanknotesIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Solde actuel"
              value={
                <div className="space-y-1">
                  <div className="text-sm">
                    {selectedCurrency === "USD" ? (
                      <>USD: ${parseFloat(
                        stats?.general_stats?.wallet?.balance_usd || "0"
                      ).toFixed(2) || "0.00"}</>
                    ) : (
                      <>CDF: {new Intl.NumberFormat("fr-CD", {
                        style: "currency",
                        currency: "CDF",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        parseFloat(
                          stats?.general_stats?.wallet?.balance_cdf || "0"
                        )
                      )}</>
                    )}
                  </div>
                  <div className='text-sm'>
                    POINTS: <span>{stats?.general_stats?.wallet?.points}</span>
                  </div>
                </div>
              }
              isDarkMode={isDarkMode}
              cardType="balance"
            />

            <StatCard
              icon={
                <GiftIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title={`Commissions mensuelles (${selectedCurrency})`}
              value={
                <div className="space-y-1">
                  <div className="text-sm">
                    {selectedCurrency === "USD" ? (
                      <>USD: ${parseFloat(
                        stats?.financial_info?.commission_by_currency?.usd
                          ?.completed || "0"
                      ).toFixed(2) || "0.00"}</>
                    ) : (
                      <>CDF: {new Intl.NumberFormat("fr-CD", {
                        style: "currency",
                        currency: "CDF",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        parseFloat(
                          stats?.financial_info?.commission_by_currency?.cdf
                            ?.completed || "0"
                        )
                      )}</>
                    )}
                  </div>
                </div>
              }
              isDarkMode={isDarkMode}
              cardType="commission"
            />

            <StatCard
              icon={
                <ArrowDownTrayIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Demandes de retrait"
              value={`${stats?.withdrawals.stats.pending_count || 0}`}
              isDarkMode={isDarkMode}
              badge={
                stats?.withdrawals.stats.pending_count > 0
                  ? {
                      text: `${stats?.withdrawals.stats.pending_count} en attente`,
                      color: isDarkMode
                        ? "bg-orange-900/90 text-orange-300 border-orange-600/50 backdrop-blur-sm"
                        : "bg-orange-100 text-orange-800 border-orange-300",
                    }
                  : null
              }
              cardType="withdrawal"
            />

            <StatCard
              icon={
                <UsersIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Total des filleuls"
              value={stats?.general_stats?.total_referrals || 0}
              isDarkMode={isDarkMode}
              cardType="referrals"
            />
          </>
        )}
      </div>

      {/* Graphiques financiers */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Graphique des commissions mensuelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {loading ? (
            // Squelette de chargement pour le graphique
            <div>
              <div
                className={`h-6 w-40 rounded mb-2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-4 w-48 rounded mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-64 rounded ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
            </div>
          ) : (
            <>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Évolution des commissions ({selectedCurrency})
              </h3>
              {selectedCurrency === "CDF" && (
                <p
                  className={`text-sm mb-4 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  * Les montants CDF sont affichés en milliers (K CDF)
                </p>
              )}
              {stats?.progression?.monthly_commissions && (
                <div className="h-64">
                  <Line
                    data={{
                      labels: Object.keys(
                        stats.progression.monthly_commissions
                      ).reverse(),
                      datasets: [
                        {
                          label: selectedCurrency === "USD" 
                            ? "Commissions USD ($)" 
                            : "Commissions CDF (K)",
                          data: Object.values(
                            stats.progression.monthly_commissions
                          )
                            .map((item) => 
                              selectedCurrency === "USD" 
                                ? (item.usd || 0)
                                : (item.cdf || 0) / 1000 // Convertir en milliers pour CDF
                            )
                            .reverse(),
                          borderColor: selectedCurrency === "USD" ? "#3b82f6" : "#10b981",
                          backgroundColor: selectedCurrency === "USD" 
                            ? "rgba(59, 130, 246, 0.5)" 
                            : "rgba(16, 185, 129, 0.5)",
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                          },
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            callback: function(value) {
                              if (selectedCurrency === "CDF") {
                                return value + 'K';
                              }
                              return '$' + value;
                            }
                          },
                          grid: {
                            color: isDarkMode
                              ? "rgba(75, 85, 99, 0.2)"
                              : "rgba(209, 213, 219, 0.5)",
                          },
                        },
                        x: {
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                          },
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Graphique des inscriptions mensuelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {loading ? (
            // Squelette de chargement pour le graphique
            <div>
              <div
                className={`h-6 w-40 rounded mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-64 rounded ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
            </div>
          ) : (
            <>
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Évolution des inscriptions
              </h3>
              {stats?.progression?.monthly_signups && (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: Object.keys(
                        stats.progression.monthly_signups
                      ).reverse(),
                      datasets: [
                        {
                          label: "Nouveaux filleuls",
                          data: Object.values(
                            stats.progression.monthly_signups
                          ).reverse(),
                          backgroundColor: isDarkMode
                            ? "rgba(147, 51, 234, 0.5)"
                            : "rgba(147, 51, 234, 0.3)",
                          borderColor: "#9333ea",
                          borderWidth: 2,
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                            font: {
                              size: 12,
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          titleColor: isDarkMode ? "#e5e7eb" : "#374151",
                          bodyColor: isDarkMode ? "#e5e7eb" : "#374151",
                          borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          borderWidth: 1,
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Demandes de retrait en attente */}
      {loading ? (
        // Squelette de chargement pour les demandes de retrait
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`h-6 w-48 rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              } animate-pulse`}
            />
            <div
              className={`h-5 w-20 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              } animate-pulse`}
            />
          </div>
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-20 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-20 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        stats?.withdrawals?.pending &&
        stats.withdrawals.pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-8 rounded-lg p-6 shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Demandes de retrait en attente
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {stats.withdrawals.pending.length} demande(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y divide-gray-200 ${
                  isDarkMode ? "divide-gray-700" : ""
                }`}
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Montant
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Devise
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Méthode
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}
                >
                  {stats.withdrawals.pending.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {withdrawal.date}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {withdrawal.currency === "USD"
                          ? `$${parseFloat(withdrawal.amount).toFixed(2)}`
                          : new Intl.NumberFormat("fr-CD", {
                              style: "currency",
                              currency: "CDF",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(parseFloat(withdrawal.amount))}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            withdrawal.currency === "USD"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {withdrawal.currency === "USD" ? "$US" : "FC"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {withdrawal.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          En attente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      )}

      {/* Performances par pack - Jetons Esengo Hebdomadaires */}
      <SectionDivider
        title="Performance de vos packs - Jetons Esengo"
        icon={
          <GiftIcon
            className={`h-4 w-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <div>
        <div className="mb-4">
          <h3
            className={`text-lg font-medium leading-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Jetons Esengo obtenus cette semaine
          </h3>
          <p
            className={`mt-1 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Performance hebdomadaire (lundi au dimanche) par pack d'affiliation
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats?.packs_performance?.map((pack, index) => {
            const weeklyReferrals = pack?.weekly_referrals || 0;
            const requiredReferrals = pack?.bonus_rates?.nombre_filleuls || 1;
            const tokensEarned = Math.floor(
              weeklyReferrals / requiredReferrals
            );
            const progressToNextToken =
              ((weeklyReferrals % requiredReferrals) / requiredReferrals) * 100;
            const tokensPerThreshold = pack?.bonus_rates?.points_attribues || 1;
            const totalTokensEarned = tokensEarned * tokensPerThreshold;

            return (
              <motion.div
                key={pack?.id || `pack-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`overflow-hidden rounded-xl px-4 py-5 shadow-lg sm:p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-gray-800 shadow-gray-900/50 border-gray-700"
                    : "bg-white shadow-gray-200/70 border-gray-100"
                }`}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className={`text-lg font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {pack?.name || "Pack inconnu"}
                      </h4>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {requiredReferrals} filleul
                        {requiredReferrals > 1 ? "s" : ""} ={" "}
                        {tokensPerThreshold} jeton
                        {tokensPerThreshold > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                          totalTokensEarned > 0
                            ? isDarkMode
                              ? "bg-green-900 text-green-200 border border-green-700"
                              : "bg-green-100 text-green-800 border border-green-300"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300 border border-gray-600"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <GiftIcon className="h-4 w-4 mr-1" />
                        {totalTokensEarned} jeton
                        {totalTokensEarned > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Filleuls cette semaine
                        </p>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {weeklyReferrals} / {requiredReferrals}
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div
                        className={`w-full rounded-full h-2 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progressToNextToken, 100)}%`,
                          }}
                        />
                      </div>

                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {progressToNextToken === 100
                          ? "Prochain jeton obtenu !"
                          : weeklyReferrals >= requiredReferrals
                          ? `${tokensEarned} jeton${
                              tokensEarned > 1 ? "s" : ""
                            } obtenu${tokensEarned > 1 ? "s" : ""} !`
                          : `Encore ${
                              requiredReferrals - weeklyReferrals
                            } filleul${
                              requiredReferrals - weeklyReferrals > 1 ? "s" : ""
                            } pour le prochain jeton`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Total filleuls
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {pack?.total_referrals || 0}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Commissions
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedCurrency === "USD"
                            ? `$${Number(
                                pack?.total_commissions_usd || 0
                              ).toFixed(2)}`
                            : new Intl.NumberFormat("fr-CD", {
                                style: "currency",
                                currency: "CDF",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                Number(pack?.total_commissions_cdf || 0)
                              )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicateur de performance */}
                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Performance cette semaine
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {weeklyReferrals >= 10 ? (
                          <>
                            <span className="text-green-500 text-lg mr-2">
                              🔥
                            </span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Excellent !
                            </span>
                          </>
                        ) : weeklyReferrals >= 6 ? (
                          <>
                            <span className="text-blue-500 text-lg mr-2">
                              ⭐
                            </span>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Bien !
                            </span>
                          </>
                        ) : weeklyReferrals >= 2 ? (
                          <>
                            <span className="text-yellow-500 text-lg mr-2">
                              📈
                            </span>
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              En progression
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400 text-lg mr-2">
                              💪
                            </span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Commencez dès maintenant
                            </span>
                          </>
                        )}
                      </div>

                      {/* Système d'étoiles basé sur les filleuls (5 étoiles max) */}
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => {
                          // Chaque étoile représente 20% du seuil (2 filleuls = 1 étoile)
                          const starThreshold = (i + 1) * 2; // 2, 4, 6, 8, 10
                          const isStarActive = weeklyReferrals >= starThreshold;

                          return (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + i * 0.05 }}
                              className={`inline-block text-lg ${
                                isStarActive
                                  ? "text-yellow-500"
                                  : isDarkMode
                                  ? "text-gray-600"
                                  : "text-gray-300"
                              }`}
                              title={`Étoile ${
                                i + 1
                              }: ${starThreshold} filleuls`}
                            >
                              {isStarActive ? "★" : "☆"}
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Texte informatif sur la progression */}
                    <p
                      className={`text-xs mt-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {weeklyReferrals >= 10
                        ? "🎉 Objectif atteint ! 10/10 filleuls"
                        : weeklyReferrals >= 8
                        ? `Plus que ${10 - weeklyReferrals} filleul${
                            10 - weeklyReferrals > 1 ? "s" : ""
                          } pour l'objectif !`
                        : weeklyReferrals >= 6
                        ? "Bon progression, continuez !"
                        : weeklyReferrals >= 4
                        ? "Vous êtes sur la bonne voie !"
                        : weeklyReferrals >= 2
                        ? "Début prometteur !"
                        : "Chaque filleul vous rapproche du jeton !"}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Information sur la période */}
        <div
          className={`mt-6 p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start">
            <InformationCircleIcon
              className={`h-5 w-5 mt-0.5 mr-3 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                📅 Période hebdomadaire : Lundi au Dimanche
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Les jetons Esengo sont calculés chaque semaine en fonction du
                nombre de filleuls parrainés. Le compteur se réinitialise chaque
                lundi matin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suivi des Grades */}
      <SectionDivider
        title="Votre parcours de grades"
        icon={
          <AcademicCapIcon
            className={`h-4 w-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-xl p-6 ${
          isDarkMode 
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" 
            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        {gradesLoading ? (
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-2 w-full rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* En-tête avec grade actuel */}
            <div className="text-center">
              {currentGrade?.symbole && (
                <div className="flex justify-center">
                  <div className="h-32 w-32 sm:h-40 sm:w-40 flex items-center justify-center">
                    <img 
                      src={currentGrade.symbole_url_or_default} 
                      alt={currentGrade.designation}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
              <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                {currentGrade ? `Grade ${currentGrade.designation}` : "Commencez votre parcours"}
              </h3>
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {currentGrade 
                  ? `${userPoints} points accumulés`
                  : "Gagnez des points pour débloquer votre premier grade"
                }
              </p>
            </div>

            {/* Barre de progression unique avec étoiles */}
            <div className="mt-12">
              {/* Ligne de progression principale */}
              <div className="relative">
                {/* Barre de progression de fond */}
                <div className={`w-full h-3 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-300"
                }`}>
                  {/* Barre de progression active */}
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                    style={{
                      width: (() => {
                        return `${Math.min((userPoints / lastGradePoint) * 100, 100)}%`;
                      })()
                    }}
                  />
                </div>

                {/* Étoiles des grades sur la ligne */}
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full px-1 sm:px-2">
                  {grades.map((grade, index) => {
                    const isCompleted = parseFloat(grade.points) <= userPoints;
                    const isCurrent = currentGrade?.id === grade.id;
                    
                    // Calculer la position en fonction des points requis
                    const position = lastGradePoint > 0 
                      ? (parseFloat(grade.points) / lastGradePoint) * 100
                      : (index / (grades.length - 1)) * 100;
                    
                    return (
                      <div
                        key={grade.id}
                        className="absolute"
                        style={{
                          left: `${position}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {/* Étoile avec tooltip */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative group cursor-pointer"
                        >
                          {isCompleted ? (
                            <StarIconSolid className={`h-5 w-5 sm:h-6 sm:w-6 ${
                              isCurrent ? "text-yellow-400" : "text-green-500"
                            }`} />
                          ) : (
                            <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          )}
                          
                          {/* Tooltip au hover - optimisé mobile */}
                          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${
                            isDarkMode 
                              ? "bg-gray-800 text-white border border-gray-700" 
                              : "bg-gray-900 text-white border border-gray-700"
                          }`}>
                            <div className="font-semibold text-xs sm:text-sm">{grade.designation}</div>
                            <div className="text-gray-300 text-xs">{grade.points} pts</div>
                            {/* Flèche du tooltip */}
                            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 ${
                              isDarkMode 
                                ? "border-l-transparent border-r-transparent border-t-gray-800" 
                                : "border-l-transparent border-r-transparent border-t-gray-900"
                            }`} />
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                {/* Indicateur de progression actuelle - optimisé mobile */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full border-2 border-white shadow-lg transition-all duration-500"
                  style={{
                    left: (() => {
                      // Position basée sur les points actuels comme la barre de progression
                      return `${Math.min((userPoints / lastGradePoint) * 100, 100)}%`;
                    })(),
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-12">
                {/* Points actuels */}
                <div className={`text-center p-3 sm:p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
                }`}>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                    {userPoints}
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Points actuels
                  </div>
                </div>

                {/* Grade actuel */}
                <div className={`text-center p-3 sm:p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
                }`}>
                  <div className="text-base sm:text-lg font-bold">
                    {currentGrade ? (
                      <span className="text-yellow-400">{currentGrade.designation}</span>
                    ) : (
                      <span className="text-gray-400">Aucun grade</span>
                    )}
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Grade actuel
                  </div>
                </div>

                {/* Prochain grade */}
                <div className={`text-center p-3 sm:p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
                }`}>
                  <div className="text-base sm:text-lg font-bold text-blue-500">
                    {nextGrade ? nextGrade.designation : "Maximum"}
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Prochain grade
                  </div>
                </div>
              </div>
            </div>

            {/* Message d'encouragement */}
            <div className={`text-center mt-10 p-3 sm:p-4 rounded-lg ${
              isDarkMode ? "bg-gray-800/50 border border-gray-700" : "bg-blue-50 border border-blue-200"
            }`}>
              <div className="flex items-center justify-center mb-2">
                <TrophyIcon className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 ${
                  isDarkMode ? "text-yellow-400" : "text-yellow-600"
                }`} />
                <span className={`font-medium text-sm sm:text-base ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {(() => {
                    if (!nextGrade) {
                      return "🏆 Félicitations ! Vous avez atteint le grade le plus élevé !";
                    }
                    
                    const progress = (userPoints / parseFloat(nextGrade.points)) * 100;
                    
                    if (progress >= 80) {
                      return "🔥 Plus qu'un effort ! Le prochain grade est à portée de main !";
                    } else if (progress >= 50) {
                      return "⭐ Excellent progression ! Continuez comme ça !";
                    } else if (progress >= 25) {
                      return "📈 Bon début ! Vous êtes sur la bonne voie !";
                    } else {
                      return "💪 Chaque grand voyage commence par un premier pas !";
                    }
                  })()}
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {(() => {
                  if (!nextGrade) {
                    return "Vous êtes au sommet de la hiérarchie !";
                  }
                  
                  const pointsNeeded = parseFloat(nextGrade.points) - userPoints;
                  return `Encore ${pointsNeeded} points pour atteindre le grade ${nextGrade.designation}`;
                })()}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Comment gagner des points ? */}
      <SectionDivider
        title="Comment gagner des points ?"
        icon={
          <InformationCircleIcon
            className={`h-4 w-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-xl p-6 ${
          isDarkMode 
            ? "bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/30" 
            : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200"
        }`}
      >
        <div className="space-y-6">
          {/* En-tête */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className={`p-3 rounded-full ${
                isDarkMode 
                  ? "bg-gradient-to-br from-blue-600 to-purple-600" 
                  : "bg-gradient-to-br from-blue-500 to-purple-500"
              }`}>
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Gagnez des points avec les Jetons Esengo
            </h3>
            <p className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}>
              Transformez vos jetons en points pour atteindre les grades supérieurs
            </p>
          </div>

          {/* Explication principale */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? "bg-blue-800/30 border-blue-600/30" 
              : "bg-blue-100 border-blue-300"
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <StarIcon className={`h-5 w-5 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`} />
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  🎯 Chaque Jeton Esengo = Points Instantanés
                </h4>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  À chaque <strong>Jeton Esengo gagné</strong>, vous accumulez automatiquement des points 
                  selon la <strong>valeur du jeton</strong>. Plus votre pack d'affiliation est élevé, 
                  plus les points gagnés sont conséquents !
                </p>
              </div>
            </div>
          </div>

          {/* Message d'encouragement final */}
          <div className={`text-center p-4 rounded-lg ${
            isDarkMode 
              ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600/30" 
              : "bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300"
          }`}>
            <TrophyIcon className={`h-8 w-8 mx-auto mb-2 text-yellow-500`} />
            <p className={`font-semibold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              🚀 Stratégie gagnante
            </p>
            <p className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Parrainez activement, gagnez des jetons chaque semaine, et transformez-les 
              en points pour atteindre rapidement les grades supérieurs !
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Composant réutilisable pour les cartes de stats
function StatCard({
  icon,
  title,
  value,
  isDarkMode,
  badge = null,
  cardType = "default",
}) {
  // Définition des couleurs de fond pour chaque type de carte (style bg-*-50)
  const cardColors = {
    balance: {
      light: "bg-blue-50", // bg-blue-50 pour solde
      dark: "bg-blue-900/20",
      iconBg: "bg-blue-500",
      borderColor: "border-blue-200",
    },
    commission: {
      light: "bg-green-50", // bg-green-50 pour commissions
      dark: "bg-green-900/20",
      iconBg: "bg-green-500",
      borderColor: "border-green-200",
    },
    withdrawal: {
      light: "bg-orange-50", // bg-orange-50 pour retraits
      dark: "bg-orange-900/20",
      iconBg: "bg-orange-500",
      borderColor: "border-orange-200",
    },
    referrals: {
      light: "bg-purple-50", // bg-purple-50 pour filleuls
      dark: "bg-purple-900/20",
      iconBg: "bg-purple-500",
      borderColor: "border-purple-200",
    },
    default: {
      light: "bg-indigo-50", // bg-indigo-50 par défaut
      dark: "bg-indigo-900/20",
      iconBg: "bg-indigo-500",
      borderColor: "border-indigo-200",
    },
  };

  const colors = cardColors[cardType] || cardColors.default;
  const bgClass = isDarkMode ? colors.dark : colors.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      whileHover={{
        y: -4,
        boxShadow: isDarkMode
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      className={`relative rounded-2xl shadow-lg p-6 overflow-hidden transition-all duration-300 ${
        isDarkMode
          ? `bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700`
          : `${bgClass} border ${colors.borderColor}`
      }`}
    >
      {/* Coin supérieur gauche avec couleur transparente */}
      <div
        className="absolute top-0 left-0 w-24 h-24 opacity-60"
        style={{
          background: `linear-gradient(135deg, ${
            isDarkMode ? "rgba(251, 146, 60, 0.20)" : "rgba(251, 146, 60, 0.15)"
          } 0%, transparent 70%)`,
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`flex-shrink-0 p-3 rounded-xl ${
                isDarkMode
                  ? `${colors.iconBg}/20 border ${colors.iconBg}/30`
                  : `${colors.iconBg}/100 border ${colors.iconBg}/200`
              }`}
            >
              <div
                className={`transform transition-transform duration-300 group-hover:scale-110 text-white`}
              >
                {icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <dt
                className={`text-sm font-semibold uppercase tracking-wide ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {title}
              </dt>
              <dd
                className={`mt-2 text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {typeof value === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: value }} />
                ) : (
                  value
                )}
              </dd>
            </div>
          </div>

          {badge && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`absolute -top-2 -right-2 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg ${
                badge.color ||
                (isDarkMode
                  ? "bg-yellow-900/90 text-yellow-300 border-yellow-600/50 backdrop-blur-sm"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300")
              }`}
            >
              <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse" />
              {badge.text}
            </motion.div>
          )}
        </div>

        {/* Ligne décorative en bas */}
        <div
          className={`mt-4 pt-4 border-t ${
            isDarkMode ? "border-gray-700" : colors.borderColor
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`h-1 w-16 rounded-full ${
                isDarkMode
                  ? `bg-gradient-to-r ${colors.iconBg} to-${colors.iconBg.replace('bg-', '').replace('500', '600')}`
                  : `bg-gradient-to-r ${colors.iconBg} to-${colors.iconBg.replace('bg-', '').replace('500', '600')}`
              }`}
            />
            <div
              className={`text-xs font-medium ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Mis à jour
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant réutilisable pour les séparateurs de section
function SectionDivider({ title, icon, isDarkMode }) {
  return (
    <div className="relative py-2">
      <div className="flex items-center space-x-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </span>
        {/* <div
          className={`flex-grow h-px ${
            isDarkMode ? "bg-gray-700/50" : "bg-gray-200/70"
          }`}
        /> */}
      </div>
    </div>
  );
}
