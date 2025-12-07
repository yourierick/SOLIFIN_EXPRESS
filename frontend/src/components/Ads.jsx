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

export default function Ads() {
  const { isDarkMode } = useTheme();
  const { user, loading: authLoading } = useAuth(); // Récupère l'utilisateur et l'état de chargement de l'auth
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
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
        setAds(response.data.ads);
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
    if (ads?.length > 1 && !isPaused && !showVideo) {
      // Nettoyer tout intervalle existant
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Créer un nouvel intervalle pour changer automatiquement les publicités toutes les 8 secondes
      intervalRef.current = setInterval(() => {
        nextAd();
      }, 10000); // 10000ms = 10 secondes
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads?.length, isPaused, showVideo]);

  const nextAd = () => {
    setCurrent((prev) => (ads?.length ? (prev + 1) % ads?.length : 0));
  };

  const prevAd = () => {
    setCurrent((prev) =>
      ads?.length ? (prev - 1 + ads?.length) % ads?.length : 0
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
      id="ads"
      className={`w-full py-12 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-100 to-white"
      }`}
    >
      <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              className={`h-1.5 w-24 mx-auto mb-6 rounded-full ${
                isDarkMode ? "bg-green-500" : "bg-green-600"
              }`}
            />
          </div>

          <h2
            className={`text-3xl font-bold tracking-tight sm:text-5xl mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Publicités et{" "}
            <span
              className={`relative inline-block ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Annonces
              <motion.span
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
                className={`absolute bottom-1 left-0 h-0.5 ${
                  isDarkMode ? "bg-green-400/40" : "bg-green-600/40"
                }`}
              />
            </span>
          </h2>
          <p
            className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Profitez des meilleures opportunités de marketing pour vos produits
            et services grâce à la communauté grandissante de{" "}
            <span className="text-primary-600 font-medium">SOLIFIN</span>
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Chargement des publicités...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : !ads?.length ? (
          <div className="text-center py-12 text-gray-400">
            Aucune publicité à afficher.
          </div>
        ) : (
          <div className="relative max-w-6xl mx-auto">
            <motion.div
              key={ads[current]?.id}
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
              {/* Glass morphisme card avec effets avancés */}
              <div className="relative overflow-hidden backdrop-blur-xl rounded-3xl border transition-all duration-500 group-hover:shadow-2xl"
                style={{
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95))",
                  borderColor: isDarkMode ? "rgba(100,116,139,0.3)" : "rgba(203,213,225,0.5)",
                  borderWidth: "1px",
                }}
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05))",
                      "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(34,197,94,0.05))",
                      "linear-gradient(225deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05))",
                      "linear-gradient(315deg, rgba(16,185,129,0.1), rgba(34,197,94,0.05))",
                    ],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 opacity-30"
                      style={{
                        left: `${10 + (i * 12)}%`,
                        top: `${15 + (i * 10)}%`,
                      }}
                      animate={{
                        y: [0, -40, 0],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 4 + (i * 0.5),
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Top decorative animated line */}
                <div className="h-1 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600">
                  <motion.div
                    className="h-full w-full"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>

                <div className="relative z-10 p-8">
                  {/* Header avec badges */}
                  <div className="flex justify-between items-start mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                    >
                      Publicité
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold shadow-lg"
                    >
                      <SparklesIcon className="w-3 h-3" />
                      NOUVEAU
                    </motion.div>
                  </div>

                  {/* Media container */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-8 rounded-2xl overflow-hidden shadow-xl"
                    style={{
                      background: isDarkMode ? "#1e293b" : "#f8fafc",
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
                      {(ads[current]?.image_url || ads[current]?.image) &&
                        (!ads[current]?.video_url || !showVideo) && (
                          <>
                            <img
                              src={ads[current]?.image_url || ads[current]?.image}
                              alt={ads[current]?.titre || ads[current]?.title}
                              className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Bouton play vidéo */}
                            {ads[current]?.video_url && (
                              <motion.button
                                aria-label="Lire la vidéo"
                                onClick={() => {
                                  setShowVideo(true);
                                  pauseAutoScroll();
                                }}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full w-16 h-16 flex items-center justify-center cursor-pointer z-10 shadow-2xl"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <PlayIcon className="w-6 h-6 ml-1" />
                              </motion.button>
                            )}
                          </>
                        )}

                      {/* Lecteur vidéo */}
                      {ads[current]?.video_url && showVideo && (
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
                            url={ads[current].video_url}
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
                      className="text-4xl font-black leading-tight"
                      style={{
                        color: isDarkMode ? "white" : "#0f172a",
                        textShadow: isDarkMode
                          ? "0 2px 8px rgba(0,0,0,0.3)"
                          : "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {ads[current]?.titre || ads[current]?.title}
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
                      {formatPublishedDate(ads[current]?.created_at)}
                    </motion.div>

                    {/* Description */}
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl leading-relaxed"
                      style={{
                        color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(30,41,59,0.9)",
                      }}
                    >
                      {ads[current]?.description || ""}
                    </motion.p>

                    {/* CTA Button */}
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      whileHover={{
                        scale: 1.02,
                        y: -2,
                        boxShadow: "0 20px 40px -10px rgba(34,197,94,0.5)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (user && user.id) {
                          navigate(
                            `/dashboard/pages/${ads[current]?.page_id}#pub-${ads[current]?.id}`
                          );
                        } else {
                          navigate("/interet");
                        }
                      }}
                      className="w-full py-5 px-8 rounded-2xl font-bold text-xl relative overflow-hidden group"
                      style={{
                        background: "linear-gradient(135deg, #22c55e, #10b981)",
                        color: "white",
                        boxShadow: "0 10px 25px -5px rgba(34,197,94,0.4)",
                      }}
                    >
                      {/* Button shine effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                            backgroundSize: "200% 100%",
                          }}
                        >
                          <motion.div
                            animate={{
                              backgroundPosition: ["200% 50%", "-200% 50%"],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="h-full w-full"
                          />
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <ArrowRightIcon className="w-5 h-5" />
                        {ads[current]?.cta || "Je suis intéressé !"}
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
            {ads?.length > 1 && (
              <>
                <button
                  onClick={() => {
                    prevAd();
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow-2xl p-4 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-800 transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Précédent"
                  style={{ left: "-3rem" }}
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    nextAd();
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow-2xl p-4 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-800 transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Suivant"
                  style={{ right: "-3rem" }}
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex justify-center mt-6 space-x-3">
                  {ads?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrent(idx);
                        // Ne pas arrêter la vidéo si elle est en cours de lecture
                        if (!showVideo) {
                          pauseAutoScroll();
                        }
                      }}
                      onMouseEnter={showVideo ? null : pauseAutoScroll}
                      onMouseLeave={showVideo ? null : resumeAutoScroll}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        current === idx
                          ? "bg-green-500 scale-150 shadow-xl"
                          : "bg-gray-300 dark:bg-gray-600 hover:bg-green-400 dark:hover:bg-green-600 hover:scale-125"
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
