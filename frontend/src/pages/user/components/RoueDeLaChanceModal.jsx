import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  XMarkIcon,
  GiftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  SparklesIcon,
  TrophyIcon,
  TicketIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notification from "../../../components/Notification";

/**
 * Modal pour la roue de la chance (utilisation des jetons Esengo)
 * Version corrigée avec roue correctement dessinée et calcul simplifié
 */
const RoueDeLaChanceModal = ({ open, onClose, jeton, onResult }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState(null);
  const [cadeaux, setCadeaux] = useState([]);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  // Couleurs pour les segments de la roue
  const colors = [
    "#FF6384", // Rose
    "#36A2EB", // Bleu
    "#FFCE56", // Jaune
    "#4BC0C0", // Turquoise
    "#9966FF", // Violet
    "#FF9F40", // Orange
    "#C9CBCF", // Gris
    "#7ED321", // Vert
  ];

  useEffect(() => {
    if (open) {
      fetchCadeaux();
      setResult(null);
      setRotation(0);
    }
  }, [open]);

  // Récupérer la liste des cadeaux disponibles
  const fetchCadeaux = async () => {
    if (!jeton || !jeton.pack_id) {
      setError("Impossible de récupérer les cadeaux: pack du jeton non défini");
      Notification.error({
        message: "Impossible de récupérer les cadeaux: pack du jeton non défini",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/user/finances/jetons-esengo/packs/${jeton.pack_id}/cadeaux`
      );

      if (response.data.success) {
        setCadeaux(response.data.cadeaux || response.data.data || []);
      } else {
        Notification.error({
          message: "Erreur lors de la récupération des cadeaux",
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des cadeaux:", err);
      Notification.error({
        message: "Erreur lors de la récupération des cadeaux",
      });
      setError("Impossible de récupérer les cadeaux du serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Calculer l'angle pour un index donné (pointeur en haut)
  const calculateAngle = (index) => {
    if (cadeaux.length === 0) return 0;
    const segmentAngle = 360 / cadeaux.length;
    // Le pointeur est en haut, donc on ajuste l'angle
    // Le segment 0 commence en haut, donc on le centre sous le pointeur
    return index * segmentAngle + (segmentAngle / 2);
  };

  // Faire tourner la roue
  const spinWheel = async () => {
    if (spinning || !jeton || cadeaux.length === 0) return;

    setSpinning(true);
    setError(null);

    let backendTicket = null;

    // 1. Appeler le backend pour déterminer le cadeau gagnant
    try {
      // Appel à l'API pour utiliser le jeton et obtenir un cadeau
      const response = await axios.post(
        `/api/user/finances/jetons-esengo/use`,
        { jeton_id: jeton.id }
      );

      if (response.data.success) {
        backendTicket = response.data.ticket;
      } else {
        setSpinning(false);
        setError(
          response.data.message || "Erreur lors de l'utilisation du jeton"
        );
        return;
      }
    } catch (err) {
      console.error("Erreur détaillée lors de l'utilisation du jeton:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);
      console.error("Response headers:", err.response?.headers);
      
      setSpinning(false);
      setError(err.response?.data?.message || "Erreur de connexion au serveur");
      return;
    }

    // Calculer l'angle de rotation final
    const winningIndex = cadeaux.findIndex(c => c.id === backendTicket.cadeau?.id);
    
    if (winningIndex === -1) {
      setSpinning(false);
      setError("Cadeau gagné non trouvé dans la liste des cadeaux disponibles");
      return;
    }

    const targetAngle = calculateAngle(winningIndex);
    const spins = 5; // Nombre de tours complets
    const finalRotation = spins * 360 + (360 - targetAngle); // Rotation inverse pour que le cadeau s'arrête sous le pointeur

    // Animer la rotation
    setRotation(finalRotation);

    // Afficher le résultat après l'animation
    setTimeout(() => {
      setSpinning(false);
      setResult(backendTicket);
      if (onResult && typeof onResult === "function") {
        onResult(backendTicket);
      }
    }, 4000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    try {
      if (typeof dateString === "string" && dateString.includes("/")) {
        const dateParts = dateString.split(" ");
        if (dateParts.length > 0) {
          return dateParts[0];
        }
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Date invalide:", dateString);
        return "Format de date invalide";
      }
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={!spinning ? onClose : undefined}
      />

      {/* Conteneur du modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden transition-all duration-300 transform`}
        style={{
          background: isDarkMode 
            ? "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))"
            : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.6)"}`,
          borderRadius: "20px",
          boxShadow: isDarkMode 
            ? "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        }}
      >
        {/* Header */}
        <div
          className="relative px-8 py-6 border-b"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.06))"
              : "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(139, 92, 246, 0.03))",
            borderColor: isDarkMode ? "rgba(148, 163, 184, 0.12)" : "rgba(203, 213, 225, 0.6)",
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-2xl transition-all duration-300 hover:scale-105 hover:rotate-12 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.15))`,
                  boxShadow: "0 4px 15px rgba(139, 92, 246, 0.2)",
                }}
              >
                <SparklesIcon className="h-6 w-6" style={{ color: "#8b5cf6" }} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold leading-tight" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                  Roue de la Chance
                </h3>
                <p className="text-sm mt-1" style={{ color: isDarkMode ? "#a5b4fc" : "#6366f1" }}>
                  Tentez de gagner un cadeau avec votre jeton
                </p>
              </div>
            </div>
            
            <button
              onClick={!spinning ? onClose : undefined}
              className="p-3 rounded-2xl transition-all duration-300 hover:scale-105 hover:bg-opacity-20 shadow-md"
              style={{
                background: isDarkMode ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.1)",
                border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.18)" : "rgba(100, 116, 139, 0.15)"}`,
              }}
              disabled={spinning}
              aria-label="Fermer"
            >
              <XMarkIcon className="h-6 w-6" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
            </button>
          </div>
        </div>

        <div className={`px-6 py-4 flex-1 ${spinning ? 'overflow-hidden' : 'overflow-y-auto'}`} style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mb-4"
                style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }}
              ></div>
              <p style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                Chargement des cadeaux...
              </p>
            </div>
          ) : error ? (
            <div className="mb-4 p-4 rounded-xl flex items-center shadow-sm" style={{
              background: isDarkMode 
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))"
                : "linear-gradient(135deg, rgba(252, 165, 165, 0.2), rgba(248, 113, 113, 0.1))",
              border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(252, 165, 165, 0.3)"}`,
            }}>
              <div 
                className="p-2 rounded-xl mr-3"
                style={{
                  background: isDarkMode 
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))"
                    : "linear-gradient(135deg, rgba(252, 165, 165, 0.3), rgba(248, 113, 113, 0.15))",
                }}
              >
                <ExclamationCircleIcon className="h-5 w-5" style={{ color: "#ef4444" }} />
              </div>
              <p style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {cadeaux.length === 0 && !loading && !error && (
                <div className="flex flex-col justify-center items-center h-64">
                  <GiftIcon className="h-12 w-12 mb-4" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                  <p style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                    Aucun cadeau disponible pour ce pack
                  </p>
                </div>
              )}
              
              {cadeaux.length > 0 && (
                <>
                  {/* Informations du jeton */}
                  {jeton && (
                <div
                  className="mb-8 p-6 rounded-2xl border shadow-sm"
                  style={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(51, 65, 85, 0.5))"
                      : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.7))",
                    borderColor: isDarkMode ? "rgba(148, 163, 184, 0.18)" : "rgba(203, 213, 225, 0.6)",
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-3 rounded-2xl shadow-md transition-all duration-300 hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.15))`,
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)",
                        }}
                      >
                        <GiftIcon className="h-6 w-6" style={{ color: "#8b5cf6" }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xl" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                          Informations du jeton
                        </h4>
                        <p className="text-sm mt-1" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                          Détails de votre jeton Esengo
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8b5cf6" }}></div>
                        <p className="text-sm font-medium uppercase tracking-wide" style={{ color: isDarkMode ? "#a5b4fc" : "#6366f1" }}>
                          Code unique
                        </p>
                      </div>
                      <div 
                        className="font-mono font-semibold text-base p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md"
                        style={{
                          background: isDarkMode 
                            ? "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
                          borderColor: isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)",
                          color: isDarkMode ? "#fff" : "#1a202c",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {jeton.code_unique}
                      </div>
                    </div>

                    {jeton.date_expiration && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }}></div>
                          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: isDarkMode ? "#fbbf24" : "#d97706" }}>
                            Date d'expiration
                          </p>
                        </div>
                        <div 
                          className="p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))"
                              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
                            borderColor: isDarkMode ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.2)",
                          }}
                        >
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: "#f59e0b" }} />
                            <p className="font-semibold text-base" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                              {formatDate(jeton.date_expiration)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div 
                    className="mt-6 p-4 rounded-2xl border flex items-center shadow-sm transition-all duration-300 hover:shadow-md"
                    style={{
                      background: isDarkMode 
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.06))"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(139, 92, 246, 0.03))",
                      borderColor: isDarkMode ? "rgba(139, 92, 246, 0.25)" : "rgba(124, 58, 237, 0.2)",
                    }}
                  >
                    <div 
                      className="p-2 rounded-xl mr-4 flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1))`,
                      }}
                    >
                      <SparklesIcon className="h-6 w-6" style={{ color: "#8b5cf6" }} />
                    </div>
                    <div>
                      <p className="font-medium text-base mb-1" style={{ color: isDarkMode ? "#c4b5fd" : "#6d28d9" }}>
                        Prêt à tenter votre chance ?
                      </p>
                      <p className="text-sm" style={{ color: isDarkMode ? "#a5b4fc" : "#8b5cf6" }}>
                        Cliquez sur "Tourner la roue" pour gagner un cadeau !
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Roue de la chance */}
              <div className="flex justify-center my-8">
                <div className="relative" style={{ width: "340px", height: "340px" }}>
                  {/* Pointeur - positionné au-dessus de la roue */}
                  <div 
                    className="absolute z-30"
                    style={{ 
                      top: "-20px", 
                      left: "50%", 
                      transform: "translateX(-50%)",
                      filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))"
                    }}
                  >
                    <div className="relative">
                      {/* Pointeur extérieur rouge */}
                      <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-t-[36px] border-l-transparent border-r-transparent" 
                           style={{ borderTopColor: "#dc2626" }}></div>
                      {/* Pointeur intérieur blanc */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[18px] border-r-[18px] border-t-[28px] border-l-transparent border-r-transparent" 
                           style={{ borderTopColor: "#ffffff" }}></div>
                      {/* Centre du pointeur */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent" 
                           style={{ borderTopColor: "#dc2626" }}></div>
                    </div>
                  </div>

                  {/* Conteneur de la roue avec effet de profondeur */}
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)",
                    filter: "blur(1px)",
                    zIndex: 1
                  }}></div>

                  {/* Roue SVG */}
                  <div 
                    className="relative rounded-full overflow-hidden shadow-2xl"
                    style={{
                      background: isDarkMode 
                        ? "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))"
                        : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
                      border: `6px solid ${isDarkMode ? "rgba(139, 92, 246, 0.4)" : "rgba(124, 58, 237, 0.3)"}`,
                      boxShadow: isDarkMode 
                        ? "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.1)"
                        : "0 20px 40px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.9)",
                      transition: `transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`,
                      transform: `rotate(${rotation}deg)`,
                      zIndex: 2
                    }}
                  >
                    <svg width="340" height="340" viewBox="0 0 340 340">
                      {/* Définition des dégradés */}
                      <defs>
                        {colors.map((color, index) => (
                          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={color} stopOpacity="1" />
                          </linearGradient>
                        ))}
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feFlood floodColor="#000000" floodOpacity="0.3"/>
                          <feComposite in2="offsetblur" operator="in"/>
                          <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {cadeaux.length > 0 && cadeaux.map((cadeau, index) => {
                        const segmentAngle = 360 / cadeaux.length;
                        const angle = segmentAngle * index;
                        const nextAngle = segmentAngle * (index + 1);
                        const startAngle = (angle - 90) * (Math.PI / 180);
                        const endAngle = (nextAngle - 90) * (Math.PI / 180);
                        const largeArcFlag = nextAngle - angle > 180 ? 1 : 0;
                        
                        const x1 = 170 + 150 * Math.cos(startAngle);
                        const y1 = 170 + 150 * Math.sin(startAngle);
                        const x2 = 170 + 150 * Math.cos(endAngle);
                        const y2 = 170 + 150 * Math.sin(endAngle);
                        
                        const textAngle = angle - 90 + segmentAngle / 2;
                        const textRadius = 110;
                        const textX = 170 + textRadius * Math.cos(textAngle * Math.PI / 180);
                        const textY = 170 + textRadius * Math.sin(textAngle * Math.PI / 180);
                        
                        return (
                          <g key={index}>
                            {/* Segment principal */}
                            <path
                              d={`M 170 170 L ${x1} ${y1} A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={`url(#gradient-${index})`}
                              stroke="white"
                              strokeWidth="3"
                              filter="url(#shadow)"
                            />
                            
                            {/* Bordure intérieure pour effet de profondeur */}
                            <path
                              d={`M 170 170 L ${x1} ${y1} A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill="none"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="1"
                            />
                            
                            {/* Texte avec ombre */}
                            <text
                              x={textX}
                              y={textY}
                              fill="white"
                              fontSize="15"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                              style={{ 
                                textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
                                filter: "url(#shadow)"
                              }}
                            >
                              {cadeau.nom.length > 15 ? cadeau.nom.substring(0, 15) + "..." : cadeau.nom}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Cercle central amélioré */}
                      <circle
                        cx="170"
                        cy="170"
                        r="35"
                        fill={isDarkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.98)"}
                        stroke={isDarkMode ? "rgba(139, 92, 246, 0.4)" : "rgba(124, 58, 237, 0.3)"}
                        strokeWidth="4"
                        filter="url(#shadow)"
                      />
                      <circle
                        cx="170"
                        cy="170"
                        r="30"
                        fill="none"
                        stroke={isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.1)"}
                        strokeWidth="1"
                      />
                      <text
                        x="170"
                        y="170"
                        fill={isDarkMode ? "#8b5cf6" : "#7c3aed"}
                        fontSize="18"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ textShadow: "0 0 4px rgba(139, 92, 246, 0.3)" }}
                      >
                        SPIN
                      </text>
                    </svg>
                  </div>

                  {/* Effet de brillance */}
                  <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                    background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), transparent 40%)",
                    zIndex: 3
                  }}></div>
                </div>
              </div>

              {/* Résultat */}
              {result && (
                <div 
                  className="mt-6 p-6 rounded-2xl shadow-lg border relative overflow-hidden"
                  style={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))"
                      : "linear-gradient(135deg, rgba(134, 239, 172, 0.3), rgba(74, 222, 128, 0.15))",
                    borderColor: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(134, 239, 172, 0.4)",
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
                    }}
                  ></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-4">
                      <div 
                        className="p-3 rounded-2xl"
                        style={{
                          background: isDarkMode 
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
                            : "linear-gradient(135deg, rgba(134, 239, 172, 0.4), rgba(74, 222, 128, 0.2))",
                        }}
                      >
                        <TrophyIcon className="h-8 w-8" style={{ color: "#10b981" }} />
                      </div>
                    </div>

                    <h4 className="font-bold text-2xl mb-3 text-center" style={{ color: isDarkMode ? "#fff" : "#064e3b" }}>
                      Félicitations !
                    </h4>

                    <div className="text-center mb-4">
                      <p className="text-lg mb-2" style={{ color: isDarkMode ? "#d1fae5" : "#047857" }}>
                        Vous avez gagné :
                      </p>
                      <p 
                        className="font-bold text-xl"
                        style={{ color: isDarkMode ? "#a7f3d0" : "#059669" }}
                      >
                        {result.cadeau?.nom}
                      </p>
                    </div>

                    {result.cadeau?.image_url && (
                      <div className="flex justify-center my-4">
                        <div className="relative">
                          <img
                            src={result.cadeau.image_url}
                            alt={result.cadeau.nom}
                            className="h-24 w-24 object-cover rounded-2xl shadow-md border-2"
                            style={{
                              borderColor: isDarkMode ? "rgba(16, 185, 129, 0.3)" : "rgba(134, 239, 172, 0.5)",
                            }}
                          />
                          <div 
                            className="absolute -bottom-2 -right-2 p-1 rounded-full border-2"
                            style={{
                              background: isDarkMode 
                                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
                                : "linear-gradient(135deg, rgba(134, 239, 172, 0.4), rgba(74, 222, 128, 0.2))",
                              borderColor: isDarkMode ? "rgba(16, 185, 129, 0.3)" : "rgba(134, 239, 172, 0.5)",
                            }}
                          >
                            <CheckCircleIcon className="h-5 w-5" style={{ color: "#10b981" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                      className="rounded-2xl p-4 mt-4 border"
                      style={{
                        background: isDarkMode 
                          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8))"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))",
                        borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                      }}
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                            Code de vérification
                          </p>
                          <div 
                            className="font-mono font-bold text-lg p-3 rounded-xl border text-center"
                            style={{
                              background: isDarkMode 
                                ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                                : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))",
                              borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                              color: isDarkMode ? "#fff" : "#1a202c",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {result.code_verification}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                            Date d'expiration
                          </p>
                          <p className="font-medium flex items-center justify-center" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                            <CalendarIcon className="h-4 w-4 mr-2" style={{ color: "#ef4444" }} />
                            {formatDate(result.date_expiration)}
                          </p>
                        </div>
                      </div>

                      <div 
                        className="mt-4 pt-4 border-t text-center text-sm"
                        style={{
                          borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                          color: isDarkMode ? "#94a3b8" : "#64748b",
                        }}
                      >
                        <p>
                          Veuillez présenter ce code au personnel avant sa date d'expiration
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        <div
          className="px-6 py-5 flex justify-center border-t"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.4))"
              : "linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6))",
            borderColor: isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(203, 213, 225, 0.5)",
          }}
        >
          <button
            onClick={spinWheel}
            disabled={spinning || loading || !jeton || result || cadeaux.length < 2}
            className={`px-6 py-3 rounded-2xl flex items-center justify-center font-medium shadow-lg transition-all duration-300 relative overflow-hidden group/btn ${
              spinning || loading || !jeton || result || cadeaux.length < 2
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-xl hover:scale-105"
            }`}
            style={{
              background: result
                ? "linear-gradient(135deg, #10b981, #059669)"
                : cadeaux.length < 2
                ? isDarkMode 
                  ? "linear-gradient(135deg, #6b7280, #4b5563)"
                  : "linear-gradient(135deg, #9ca3af, #6b7280)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "white",
              minWidth: "180px",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {spinning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" style={{ borderTopColor: "transparent" }}></div>
                  <span>La roue tourne...</span>
                </>
              ) : result ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Cadeau gagné !</span>
                </>
              ) : cadeaux.length < 2 ? (
                <>
                  <ExclamationCircleIcon className="h-5 w-5" />
                  <span>Pas assez de cadeaux</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Tourner la roue</span>
                </>
              )}
            </span>
            
            <div 
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent)",
              }}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoueDeLaChanceModal;
