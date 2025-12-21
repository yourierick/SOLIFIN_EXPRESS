import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import publicAxios from "../utils/publicAxios";
import { CheckIcon, CalendarIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, CubeIcon } from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function Packages() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await publicAxios.get("/api/packs");
        if (response.data && response.data.data) {
          setPacks(response.data.data.filter((pack) => pack.status));
        } else {
          console.error("Format de réponse invalide:", response.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des packs:", error);
        setError("Erreur lors du chargement des packs");
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  const handleSubscribeClick = (pack) => {
    if (!user) {
      navigate("/register");
    } else {
      if (user.is_admin) {
        navigate("/admin/mespacks");
      } else {
        navigate("/dashboard/packs");
      }
    }
  };

  const getDiscountText = (category) => {
    const discounts = {
      "Cloud Startup": "71% OFF",
      "E-commerce": "75% OFF",
      Business: "71% OFF",
      Débutant: "65% OFF",
      Intermédiaire: "60% OFF",
      Expert: "55% OFF",
      VIP: "50% OFF",
    };
    return discounts[category] || "";
  };

  const isPopular = (category) => {
    return category === "Business";
  };

  // Fonctions pour gérer la pause du carrousel
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.stop();
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.start();
    }
  };

  return (
    <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold tracking-tight sm:text-5xl mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Notre programme <span className={isDarkMode ? "text-green-400" : "text-green-600"}>de Fidélité</span>
          </h2>
          <p className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Choisissez le pack qui vous convient le mieux et profitez de toutes nos fonctionnalités premium pour développer votre activité sur
            <span className="text-green-500 font-medium"> SOLIFIN</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : !packs?.length ? (
          <div className="text-center py-12 text-gray-400">
            Aucun pack disponible pour le moment.
          </div>
        ) : (
          <>
            {/* Carrousel desktop */}
            <div className="relative max-w-6xl mx-auto hidden lg:block">
              <Swiper
                ref={swiperRef}
                modules={[Autoplay, Navigation]}
                spaceBetween={24}
                slidesPerView="auto"
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                loop={packs.length > 4}
                speed={800}
                grabCursor={true}
                className="w-full packages-carousel"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                breakpoints={{
                  1024: {
                    slidesPerView: 3,
                  },
                  1280: {
                    slidesPerView: 3,
                  },
                }}
              >
                {packs.map((pack) => {
                  const category = pack.categorie || "default";
                  const isPackPopular = isPopular(category);
                  const discountText = getDiscountText(category);

                  return (
                    <SwiperSlide key={pack.id} className="h-auto">
                      <div
                        className="h-full rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg"
                        style={{
                          background: isDarkMode ? "#1e293b" : "#ffffff",
                          borderColor: isPackPopular ? "#22c55e" : isDarkMode ? "#334155" : "#e2e8f0",
                        }}
                      >
                        {isPackPopular && (
                          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500" />
                        )}

                        <div className="p-6 flex flex-col h-full">
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                                style={{
                                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  color: "white",
                                }}
                              >
                                {category}
                              </span>
                              {isPackPopular && (
                                <span className="text-xs font-bold text-green-500">
                                  ★ POPULAIRE
                                </span>
                              )}
                            </div>

                            {discountText && (
                              <div 
                                className="inline-block px-3 py-1 rounded-lg text-sm font-bold text-white mb-3"
                                style={{
                                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                }}
                              >
                                {discountText}
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  }}
                                >
                                  <CubeIcon className="w-5 h-5 text-white" />
                                </div>
                                <h3 
                                  className="text-2xl font-bold"
                                  style={{
                                    color: isDarkMode ? "white" : "#1f2937",
                                  }}
                                >
                                  {pack.name}
                                </h3>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span 
                                    className="font-bold"
                                    style={{
                                      fontSize: "2rem",
                                      color: "#22c55e",
                                    }}
                                  >
                                    {pack.price}
                                  </span>
                                  <span 
                                    className="font-semibold text-base"
                                    style={{
                                      color: isDarkMode ? "#22c55e" : "#16a34a",
                                    }}
                                  >
                                    $
                                  </span>
                                </div>
                                <div 
                                  className="text-xs font-medium"
                                  style={{
                                    color: isDarkMode ? "rgba(34,197,94,0.8)" : "rgba(16,185,129,0.9)",
                                  }}
                                >
                                  {pack.abonnement === "mensuel"
                                    ? "/mois"
                                    : pack.abonnement === "trimestriel"
                                    ? "/trimestre"
                                    : pack.abonnement === "semestriel"
                                    ? "/semestre"
                                    : pack.abonnement === "annuel"
                                    ? "/an"
                                    : `/${pack.abonnement}`}
                                </div>
                              </div>
                            </div>

                            <p 
                              className="text-sm mb-4"
                              style={{
                                color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(55,65,81,0.8)",
                              }}
                            >
                              {pack.description}
                            </p>
                          </div>

                          <div className="flex-grow mb-6">
                            {pack?.avantages && pack.avantages?.length > 0 && (
                              <div>
                                <h4 
                                  className="font-bold mb-3 text-sm"
                                  style={{
                                    color: isDarkMode ? "white" : "#1f2937",
                                  }}
                                >
                                  Avantages inclus
                                </h4>
                                <div className="space-y-2">
                                  {pack.avantages.map((avantage, index) => (
                                    <div 
                                      key={index}
                                      className="flex items-center gap-3 p-2 rounded-lg"
                                      style={{
                                        background: isDarkMode ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.02)",
                                      }}
                                    >
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                                        }}
                                      >
                                        <StarIcon className="w-4 h-4 text-white" />
                                      </div>
                                      <span 
                                        className="text-sm font-medium"
                                        style={{
                                          color: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(31,41,55,0.9)",
                                        }}
                                      >
                                        {avantage}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleSubscribeClick(pack)}
                            className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, #22c55e, #16a34a)",
                              boxShadow: "0 4px 15px -3px rgba(34,197,94,0.3)",
                            }}
                          >
                            {user ? "Acheter ce pack" : "Commencer maintenant"}
                          </button>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Carrousel mobile */}
            <div className="lg:hidden">
              <Swiper
                ref={swiperRef}
                modules={[Autoplay, Navigation]}
                spaceBetween={16}
                slidesPerView={1}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                loop={packs.length > 1}
                speed={800}
                className="w-full"
              >
                {packs.map((pack) => {
                  const category = pack.categorie || "default";
                  const isPackPopular = isPopular(category);
                  const discountText = getDiscountText(category);

                  return (
                    <SwiperSlide key={pack.id}>
                      <div
                        className="h-full rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg"
                        style={{
                          background: isDarkMode ? "#1e293b" : "#ffffff",
                          borderColor: isPackPopular ? "#22c55e" : isDarkMode ? "#334155" : "#e2e8f0",
                        }}
                      >
                        {isPackPopular && (
                          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500" />
                        )}

                        <div className="p-6 flex flex-col h-full">
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                                style={{
                                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  color: "white",
                                }}
                              >
                                {category}
                              </span>
                              {isPackPopular && (
                                <span className="text-xs font-bold text-green-500">
                                  ★ POPULAIRE
                                </span>
                              )}
                            </div>

                            {discountText && (
                              <div 
                                className="inline-block px-3 py-1 rounded-lg text-sm font-bold text-white mb-3"
                                style={{
                                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                }}
                              >
                                {discountText}
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  }}
                                >
                                  <CubeIcon className="w-5 h-5 text-white" />
                                </div>
                                <h3 
                                  className="text-2xl font-bold"
                                  style={{
                                    color: isDarkMode ? "white" : "#1f2937",
                                  }}
                                >
                                  {pack.name}
                                </h3>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="flex items-baseline justify-end gap-1">
                                  <span 
                                    className="font-bold"
                                    style={{
                                      fontSize: "2rem",
                                      color: "#22c55e",
                                    }}
                                  >
                                    {pack.price}
                                  </span>
                                  <span 
                                    className="font-semibold text-base"
                                    style={{
                                      color: isDarkMode ? "#22c55e" : "#16a34a",
                                    }}
                                  >
                                    $
                                  </span>
                                </div>
                                <div 
                                  className="text-xs font-medium"
                                  style={{
                                    color: isDarkMode ? "rgba(34,197,94,0.8)" : "rgba(16,185,129,0.9)",
                                  }}
                                >
                                  {pack.abonnement === "mensuel"
                                    ? "/mois"
                                    : pack.abonnement === "trimestriel"
                                    ? "/trimestre"
                                    : pack.abonnement === "semestriel"
                                    ? "/semestre"
                                    : pack.abonnement === "annuel"
                                    ? "/an"
                                    : `/${pack.abonnement}`}
                                </div>
                              </div>
                            </div>

                            <p 
                              className="text-sm mb-4"
                              style={{
                                color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(55,65,81,0.8)",
                              }}
                            >
                              {pack.description}
                            </p>
                          </div>

                          <div className="flex-grow mb-6">
                            {pack?.avantages && pack.avantages?.length > 0 && (
                              <div>
                                <h4 
                                  className="font-bold mb-3 text-sm"
                                  style={{
                                    color: isDarkMode ? "white" : "#1f2937",
                                  }}
                                >
                                  Avantages inclus
                                </h4>
                                <div className="space-y-2">
                                  {pack.avantages.map((avantage, index) => (
                                    <div 
                                      key={index}
                                      className="flex items-center gap-3 p-2 rounded-lg"
                                      style={{
                                        background: isDarkMode ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.02)",
                                      }}
                                    >
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                                        }}
                                      >
                                        <StarIcon className="w-4 h-4 text-white" />
                                      </div>
                                      <span 
                                        className="text-sm font-medium"
                                        style={{
                                          color: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(31,41,55,0.9)",
                                        }}
                                      >
                                        {avantage}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleSubscribeClick(pack)}
                            className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, #22c55e, #16a34a)",
                              boxShadow: "0 4px 15px -3px rgba(34,197,94,0.3)",
                            }}
                          >
                            {user ? "Acheter ce pack" : "Commencer maintenant"}
                          </button>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Boutons de navigation mobile */}
              <div className="flex justify-center items-center mt-6 gap-4">
                <button
                  className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
                  onClick={() => {
                    if (swiperRef.current && swiperRef.current.swiper) {
                      swiperRef.current.swiper.autoplay.stop();
                      swiperRef.current.swiper.slidePrev();
                      setTimeout(() => {
                        if (!isPaused && swiperRef.current && swiperRef.current.swiper) {
                          swiperRef.current.swiper.autoplay.start();
                        }
                      }, 1000);
                    }
                  }}
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                
                <button
                  className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
                  onClick={() => {
                    if (swiperRef.current && swiperRef.current.swiper) {
                      swiperRef.current.swiper.autoplay.stop();
                      swiperRef.current.swiper.slideNext();
                      setTimeout(() => {
                        if (!isPaused && swiperRef.current && swiperRef.current.swiper) {
                          swiperRef.current.swiper.autoplay.start();
                        }
                      }, 1000);
                    }
                  }}
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
