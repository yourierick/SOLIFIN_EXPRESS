import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRef, useState, useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    scale: 1.03,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.7,
    },
  },
};

export default function OurServices() {
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const swiperRef = useRef(null);
  const desktopSwiperRef = useRef(null);
  
  // Fonction pour gérer le clic sur une carte de service
  const handleServiceClick = () => {
    if (isAuthenticated) {
      // Si l'utilisateur est connecté, rediriger vers le tableau de bord
      navigate("/dashboard");
    } else {
      // Sinon, rediriger vers la page de connexion
      navigate("/login");
    }
  };

  // Gérer le survol pour mettre en pause le défilement
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (desktopSwiperRef.current) {
      desktopSwiperRef.current.autoplay.stop();
    }
    if (swiperRef.current) {
      swiperRef.current.autoplay.stop();
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    if (desktopSwiperRef.current) {
      desktopSwiperRef.current.autoplay.start();
    }
    if (swiperRef.current) {
      swiperRef.current.autoplay.start();
    }
  };

  const services = [
    {
      images: [
        "/img/blog/services.jpg",
        "/img/blog/location-auto.jpg",
        "/img/blog/maison-for-sale.jpg",
        "/img/blog/terrain.png",
      ],
      title: "Publicité en ligne de vos produits et services",
      description:
        "Boostez rapidement vos produits et services, y compris vos services de locations ou de vente de maisons/appartement, parcelles, véhicule/machines… à travers l'espace publicitaire numérique fourni sans coût sur la plateforme SOLIFIN, les réseaux sociaux, etc.",
    },
    {
      image: "/img/blog/partenaire.jpg",
      title:
        "Publication et accès aux opportunités d'affaires, d'emploi, de financement, de partenariat",
      description:
        "Élargissez les champs de vos publications d'opportunités d'emplois, opportunités de partenariat, appel à projet, appel à manifestation d'intérêt, opportunités d'affaires, diverses annonces/informations… pour permettre l'accès au public le plus large.",
    },
    {
      image: "/img/blog/formation.jpg",
      title:
        "Publicité et vente/offre de vos cours et formations en ligne, applications, e-books et articles",
      description:
        "Contribuez au développement du capital humain et des entreprises à travers vos ventes en ligne de cours/formations, outils de gestion/applications/logiciels, e-books… publiés sur la plateforme SOLIFIN.",
    },
    {
      image: "/img/blog/social.jpg",
      title: "Partagez vos évènements avec vos proches",
      description:
        "Faites-vous informer et partagez avec vos proches vos évènements : naissances, anniversaires, divertissement, mariages, décès…",
    },
    {
      image: "/img/blog/argent.jpg",
      title: "Croissance rapide de revenus et accès aux capitaux",
      description:
        "Pour votre indépendance financière, abonnez-vous directement sur le Pack de votre choix pour encaisser infiniment les recettes sur vos ventes en ligne, vos commissions sur chacun de vos parrainages directs et/ou indirects, vos bonus sur les retraits et les bonus mensuels.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        variants={titleVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
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
          className={`text-3xl font-extrabold tracking-tight sm:text-5xl mb-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Nos{" "}
          <span
            className={`relative inline-block ${
              isDarkMode ? "text-green-400" : "text-green-600"
            }`}
          >
            Services
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
          Découvrez les services que nous proposons pour vous accompagner vers
          l'indépendance financière et le développement de votre activité
        </p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Carrousel desktop - défilement par slides */}
          <div className="hidden md:block">
            <Swiper
              ref={desktopSwiperRef}
              modules={[Autoplay]}
              spaceBetween={24}
              slidesPerView="auto"
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={false}
              speed={800}
              grabCursor={true}
              className="w-full services-carousel"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {services?.map((service, index) => (
                <SwiperSlide key={index} className="w-auto" style={{ width: '320px' }}>
                  <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                    className={`flex flex-col h-full p-0 rounded-2xl transition-all duration-300 overflow-hidden shadow-xl ${
                      isDarkMode
                        ? "bg-gray-800 hover:shadow-green-500/40 border border-gray-700"
                        : "bg-white hover:shadow-green-500/40 border border-gray-100"
                    }`}
                  >
              <div className="w-full h-40 md:h-44 lg:h-48 xl:h-44 overflow-hidden bg-gray-100 dark:bg-gray-900">
                {index === 0 ? (
                  <Swiper
                    spaceBetween={30}
                    centeredSlides={true}
                    autoplay={{
                      delay: 3000,
                      disableOnInteraction: false,
                    }}
                    pagination={{
                      clickable: true,
                    }}
                    navigation={true}
                    modules={[Autoplay, Pagination, Navigation]}
                    className="h-full w-full rounded-t-2xl"
                  >
                    {service?.images?.map((img, imgIndex) => (
                      <SwiperSlide key={imgIndex} className="w-full h-full">
                        <img
                          src={img}
                          alt={`${service.title} ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <img
                    src={service?.image}
                    alt={service?.title}
                    className="object-cover w-full h-full rounded-t-2xl"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex flex-col flex-1 p-6">
                <h3
                  className={`text-lg font-bold mb-3 leading-tight ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {service?.title}
                </h3>
                <p
                  className={`mb-4 flex-grow text-sm leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {service?.description}
                </p>
                
                {/* Bouton d'action avec animation */}
                <div className="mt-auto">
                  {isAuthenticated ? (
                    <button
                      className={`flex items-center justify-center w-full py-2 px-4 rounded-lg transition-all duration-300 ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Évite le déclenchement du onClick du parent
                        handleServiceClick();
                      }}
                    >
                      <span>Accéder au service</span>
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </button>
                  ) : (
                    <motion.button
                      className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Évite le déclenchement du onClick du parent
                        handleServiceClick();
                      }}
                      animate={{
                        y: [0, -5, 0],
                        boxShadow: [
                          "0 0 0 rgba(34, 197, 94, 0)",
                          "0 4px 12px rgba(34, 197, 94, 0.5)",
                          "0 0 0 rgba(34, 197, 94, 0)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Se connecter pour accéder</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }}
                      >
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
                </div>
              </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Carrousel mobile - un card à la fois */}
          <div className="md:hidden">
            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              centeredSlides={false}
              slidesPerView={1}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              allowTouchMove={false}
              simulateTouch={false}
              className="w-full"
              speed={300}
              onSlideChange={(swiper) => {
                // Mettre à jour les indicateurs de position
                const dots = document.querySelectorAll('.mobile-dot');
                dots.forEach((dot, index) => {
                  if (index === swiper.activeIndex) {
                    dot.className = 'w-6 h-2 rounded-full bg-green-500 transition-all duration-200 mobile-dot';
                  } else {
                    dot.className = 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-200 mobile-dot';
                  }
                });
              }}
            >
              {services?.map((service, index) => (
                <SwiperSlide key={index} className="flex items-stretch justify-center">
                  <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                    className={`w-full flex flex-col h-full p-0 rounded-2xl transition-all duration-300 overflow-hidden shadow-xl ${
                      isDarkMode
                        ? "bg-gray-800 hover:shadow-green-500/40 border border-gray-700"
                        : "bg-white hover:shadow-green-500/40 border border-gray-100"
                    }`}
                    onTouchStart={() => {
                      if (swiperRef.current) {
                        swiperRef.current.autoplay.stop();
                      }
                    }}
                    onTouchEnd={() => {
                      setTimeout(() => {
                        if (!isPaused && swiperRef.current) {
                          swiperRef.current.autoplay.start();
                        }
                      }, 2000); // Reprend après 2 secondes
                    }}
                    onMouseEnter={() => {
                      if (swiperRef.current) {
                        swiperRef.current.autoplay.stop();
                      }
                    }}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (!isPaused && swiperRef.current) {
                          swiperRef.current.autoplay.start();
                        }
                      }, 2000); // Reprend après 2 secondes
                    }}
                  >
                    <div className="w-full h-40 md:h-44 lg:h-48 xl:h-44 overflow-hidden bg-gray-100 dark:bg-gray-900">
                      {index === 0 ? (
                        <Swiper
                          spaceBetween={30}
                          centeredSlides={true}
                          autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                          }}
                          pagination={{
                            clickable: true,
                          }}
                          navigation={true}
                          modules={[Autoplay, Pagination, Navigation]}
                          className="h-full w-full rounded-t-2xl"
                        >
                          {service?.images?.map((img, imgIndex) => (
                            <SwiperSlide key={imgIndex} className="w-full h-full">
                              <img
                                src={img}
                                alt={`${service.title} ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      ) : (
                        <img
                          src={service?.image}
                          alt={service?.title}
                          className="object-cover w-full h-full rounded-t-2xl"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <h3
                        className={`text-lg font-bold mb-3 leading-tight ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {service?.title}
                      </h3>
                      <p
                        className={`mb-4 flex-grow text-sm leading-relaxed ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {service?.description}
                      </p>
                      
                      {/* Bouton d'action avec animation */}
                      <div className="mt-auto">
                        {isAuthenticated ? (
                          <button
                            className={`flex items-center justify-center w-full py-2 px-4 rounded-lg transition-all duration-300 ${
                              isDarkMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation(); // Évite le déclenchement du onClick du parent
                              handleServiceClick();
                            }}
                          >
                            <span>Accéder au service</span>
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                          </button>
                        ) : (
                          <motion.button
                            className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${
                              isDarkMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation(); // Évite le déclenchement du onClick du parent
                              handleServiceClick();
                            }}
                            animate={{
                              y: [0, -5, 0],
                              boxShadow: [
                                "0 0 0 rgba(34, 197, 94, 0)",
                                "0 4px 12px rgba(34, 197, 94, 0.5)",
                                "0 0 0 rgba(34, 197, 94, 0)"
                              ]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut"
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>Se connecter pour accéder</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut"
                              }}
                            >
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </motion.div>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Boutons de navigation personnalisés pour mobile */}
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                className="swiper-button-prev-custom p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
                onClick={() => {
                  if (swiperRef.current) {
                    swiperRef.current.autoplay.stop();
                    swiperRef.current.slidePrev();
                    setTimeout(() => {
                      if (!isPaused && swiperRef.current) {
                        swiperRef.current.autoplay.start();
                      }
                    }, 1000);
                  }
                }}
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <div className="flex gap-2">
                {services?.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 mobile-dot ${
                      index === 0 ? 'bg-green-500 w-6' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    onClick={() => {
                      if (swiperRef.current) {
                        swiperRef.current.autoplay.stop();
                        swiperRef.current.slideTo(index);
                        // Mettre à jour manuellement les indicateurs
                        const dots = document.querySelectorAll('.mobile-dot');
                        dots.forEach((dot, dotIndex) => {
                          if (dotIndex === index) {
                            dot.className = 'w-6 h-2 rounded-full bg-green-500 transition-all duration-200 mobile-dot';
                          } else {
                            dot.className = 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-200 mobile-dot';
                          }
                        });
                        setTimeout(() => {
                          if (!isPaused && swiperRef.current) {
                            swiperRef.current.autoplay.start();
                          }
                        }, 1000);
                      }
                    }}
                  />
                ))}
              </div>
              
              <button
                className="swiper-button-next-custom p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-lg"
                onClick={() => {
                  if (swiperRef.current) {
                    swiperRef.current.autoplay.stop();
                    swiperRef.current.slideNext();
                    setTimeout(() => {
                      if (!isPaused && swiperRef.current) {
                        swiperRef.current.autoplay.start();
                      }
                    }, 1000);
                  }
                }}
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
