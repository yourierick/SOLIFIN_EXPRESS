import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import publicAxios from "../utils/publicAxios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PromptLoginOrSubscribe from "./PromptLoginOrSubscribe";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReactPlayer from "react-player";
// import "video-react/dist/video-react.css";
// import { Player } from "video-react";
// Les imports video-react ne sont plus utilisés
import { 
  SparklesIcon, 
  PlayIcon, 
  XMarkIcon, 
  ArrowRightIcon,
  CalendarIcon 
} from "@heroicons/react/24/outline";

// Fonction pour formater la date de publication de manière relative
const formatPublishedDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error("Erreur lors du formatage de la date", error);
    return "";
  }
};

export default function PublicationsDisplay() {
  const { isDarkMode } = useTheme();
  const { user, loading: authLoading } = useAuth(); // Récupère l'utilisateur et l'état de chargement de l'auth
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false); // Pour afficher la modale si non authentifié
  const [isPaused, setIsPaused] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false); // État pour suivre si l'utilisateur est en train de chercher dans la vidéo
  const intervalRef = useRef(null);
  const videoRef = useRef(null); // Référence à l'élément vidéo

  useEffect(() => {
    setLoading(true);
    publicAxios
      .get("/api/ads/approved")
      .then((response) => {
        setPublications(response.data.ads);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des publicités", error);
        setError("Erreur lors du chargement des publicités");
        setLoading(false);
      });
  }, []);

  // Effet pour le défilement automatique du carrousel
  useEffect(() => {
    // Démarrer le défilement automatique seulement si nous avons plus d'une publicité
    // et si aucune vidéo n'est en cours de lecture
    if (publications?.length > 1 && !isPaused && !showVideo) {
      // Nettoyer tout intervalle existant
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Créer un nouvel intervalle pour changer automatiquement les publicités toutes les 8 secondes
      intervalRef.current = setInterval(() => {
        nextPublication();
      }, 10000); // 10000ms = 10 secondes
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [publications?.length, isPaused, showVideo]);

  const nextPublication = () => {
    setCurrentIndex((prev) => (publications?.length ? (prev + 1) % publications?.length : 0));
  };

  const prevPublication = () => {
    setCurrentIndex((prev) =>
      publications?.length ? (prev - 1 + publications?.length) % publications?.length : 0
    );
  };

  // Fonctions pour mettre en pause et reprendre le défilement automatique
  const pauseAutoScroll = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeAutoScroll = () => {
    setIsPaused(false);
  };

  return (
    <section
      id="publications"
      className={`w-full py-10 sm:py-20 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800"
          : "bg-gradient-to-br from-gray-50 via-white to-slate-50"
      }`}
    >
      <div className="w-full px-4 mx-auto sm:px-6 lg:px-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="inline-block">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              className={`h-1 w-20 mx-auto mb-2 rounded-full ${
                isDarkMode ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-green-500 to-emerald-500"
              }`}
            />
          </div>

          <h2
          className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Annonces et Publicités
        </h2>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Chargement des publicités...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : !publications?.length ? (
          <div className="text-center py-12 text-gray-400">
            Aucune publicité à afficher.
          </div>
        ) : (
          <div className="relative max-w-6xl mx-auto">
            <motion.div
              key={publications[currentIndex]?.id}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="relative group"
            >
              {/* Modern card design */}
              <div className="relative overflow-hidden rounded-3xl transition-all duration-500 group-hover:shadow-2xl"
                style={{
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
                  borderColor: isDarkMode ? "rgba(100,116,139,0.2)" : "rgba(203,213,225,0.3)",
                  borderWidth: "1px",
                  boxShadow: isDarkMode 
                    ? "0 20px 40px -10px rgba(0,0,0,0.3)" 
                    : "0 20px 40px -10px rgba(0,0,0,0.1)",
                }}
              >
                {/* Subtle animated background */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(34,197,94,0.05), rgba(16,185,129,0.02))",
                      "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(34,197,94,0.02))",
                      "linear-gradient(225deg, rgba(34,197,94,0.05), rgba(16,185,129,0.02))",
                      "linear-gradient(315deg, rgba(16,185,129,0.05), rgba(34,197,94,0.02))",
                    ],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                <div className="relative z-10 p-8 md:p-10">
                  {/* Media container */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-8 rounded-2xl overflow-hidden"
                    style={{
                      background: isDarkMode ? "#1e293b" : "#f8fafc",
                      boxShadow: isDarkMode 
                        ? "0 10px 30px -10px rgba(0,0,0,0.5)" 
                        : "0 10px 30px -10px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      className="w-full"
                      style={{
                        position: "relative",
                        paddingTop: "42.5%",
                      }}
                    >
                      {/* Image ou vidéo */}
                      {(publications[currentIndex]?.image_url || publications[currentIndex]?.image) &&
                        (!publications[currentIndex]?.video_url || !showVideo) && (
                          <>
                            <img
                              src={publications[currentIndex]?.image_url || publications[currentIndex]?.image}
                              alt={publications[currentIndex]?.titre || publications[currentIndex]?.title}
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Bouton play vidéo */}
                            {publications[currentIndex]?.video_url && (
                              <motion.button
                                aria-label="Lire la vidéo"
                                onClick={() => {
                                  setShowVideo(true);
                                  pauseAutoScroll();
                                }}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/80 text-white rounded-full w-16 h-16 flex items-center justify-center cursor-pointer z-10 shadow-2xl hover:bg-gray-900 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <PlayIcon className="w-6 h-6 ml-1" />
                              </motion.button>
                            )}
                          </>
                        )}

                      {/* Lecteur vidéo */}
                      {publications[currentIndex]?.video_url && showVideo && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                          <motion.button
                            onClick={() => {
                              setShowVideo(false);
                              resumeAutoScroll();
                            }}
                            className="absolute top-4 right-4 z-20 bg-gray-900/80 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors"
                            aria-label="Fermer la vidéo"
                            whileHover={{ scale: 1.1 }}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </motion.button>

                          <ReactPlayer
                            ref={videoRef}
                            url={publications[currentIndex].video_url}
                            width="100%"
                            height="100%"
                            playing={true}
                            controls={true}
                            config={{
                              file: {
                                attributes: {
                                  controlsList: "nodownload",
                                  disablePictureInPicture: true,
                                },
                              },
                            }}
                            style={{
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                            }}
                            // Ne pas masquer la vidéo lors des interactions avec la barre de progression
                            onPause={() => {
                              // Ne rien faire - la vidéo reste visible même en pause
                            }}
                            // Masquer la vidéo uniquement quand elle se termine
                            onEnded={() => {
                              setShowVideo(false);
                              resumeAutoScroll();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-6">
                    {/* Title */}
                    <motion.h3
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight"
                      style={{
                        color: isDarkMode ? "white" : "#0f172a",
                        textShadow: isDarkMode
                          ? "0 2px 8px rgba(0,0,0,0.3)"
                          : "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {publications[currentIndex]?.titre || publications[currentIndex]?.title}
                    </motion.h3>

                    {/* Date */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{
                        color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(71,85,105,0.9)",
                      }}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {formatPublishedDate(publications[currentIndex]?.created_at)}
                    </motion.div>

                    {/* Description */}
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg md:text-xl leading-relaxed"
                      style={{
                        color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(30,41,59,0.9)",
                      }}
                    >
                      {publications[currentIndex]?.description || ""}
                    </motion.p>

                    {/* CTA Button */}
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (user && user.id) {
                          navigate(
                            `/dashboard/pages/${publications[currentIndex]?.page_id}#pub-${publications[currentIndex]?.id}`
                          );
                        } else {
                          navigate("/interet");
                        }
                      }}
                      className="w-full py-4 px-8 rounded-xl font-semibold text-lg relative overflow-hidden transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, #22c55e, #10b981)",
                        color: "white",
                        boxShadow: "0 10px 25px -5px rgba(34,197,94,0.3)",
                      }}
                    >
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <ArrowRightIcon className="w-5 h-5" />
                        {publications[currentIndex]?.cta || "Je suis intéressé !"}
                      </div>
                    </motion.button>

                    {/* Login prompt */}
                    {showPrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <button
                          onClick={() => setShowPrompt(false)}
                          className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold bg-white dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                          aria-label="Fermer"
                        >
                          ×
                        </button>
                        <PromptLoginOrSubscribe />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            {publications?.length > 1 && (
              <>
                <button
                  onClick={() => {
                    prevPublication();
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 shadow-xl p-3 rounded-xl transition-all duration-300 hover:scale-110 z-10 ${
                    isDarkMode 
                      ? "bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600"
                      : "bg-white/90 hover:bg-gray-50 text-gray-800 border border-gray-200"
                  }`}
                  aria-label="Précédent"
                  style={{ left: "-2rem" }}
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    nextPublication();
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 shadow-xl p-3 rounded-xl transition-all duration-300 hover:scale-110 z-10 ${
                    isDarkMode 
                      ? "bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600"
                      : "bg-white/90 hover:bg-gray-50 text-gray-800 border border-gray-200"
                  }`}
                  aria-label="Suivant"
                  style={{ right: "-2rem" }}
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex justify-center mt-8 space-x-2">
                  {publications?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        // Ne pas arrêter la vidéo si elle est en cours de lecture
                        if (!showVideo) {
                          pauseAutoScroll();
                        }
                      }}
                      onMouseEnter={showVideo ? null : pauseAutoScroll}
                      onMouseLeave={showVideo ? null : resumeAutoScroll}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentIndex === idx
                          ? "bg-green-500 w-8 shadow-lg"
                          : isDarkMode
                            ? "bg-gray-600 hover:bg-gray-500"
                            : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Aller à la publicité ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
