import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState } from "react";

export default function Hero() {
  const { isDarkMode } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  // Slides data
  const slides = [
    {
      title: (
        <>
          Trouver de nouveaux clients
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
            style={{
              fontSize: "2.5rem",
            }}
          >
            Êtes-vous à la recherche de clientèle pour l’achat ou la location de vos produits et services ?
          </span>
        </>
      ),
      text: "Développez votre activité en élargissant votre réseau et en touchant davantage d’acheteurs ou de locataires.",
      button1: "Commencer Maintenant",
      button2: "En Savoir Plus",
      background: "/img/hero-carousel/background_7.jpg",
    },
    {
      title: (
        <>
          Saisir des opportunités professionnelles
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
            style={{
              fontSize: "2.5rem",
            }}
          >
            Avez-vous besoin d’opportunités d’emplois, d’affaires, de partenariats ou de financement ?
          </span>
        </>
      ),
      text: "Explorez des possibilités d’emploi, d’affaires, de partenariats ou de financements pour booster votre carrière et vos projets.",
      button1: "Rejoindre Maintenant",
      button2: "Découvrir Plus",
      background: "/img/hero-carousel/background_2.jpg",
    },
    {
      title: (
        <>
          Vendre vos connaissances et outils
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
            style={{
              fontSize: "2.5rem",
            }}
          >
            Avez-vous des livres, formations, cours, logiciels ou applications à vendre en ligne ?
          </span>
        </>
      ),
      text: "Transformez vos savoirs et créations en revenus grâce à la vente de livres, formations, cours ou applications en ligne.",
      button1: "Vous inscrire maintenant!",
      button2: "En savoir d'avantage",
      background: "/img/hero-carousel/background_6.jpg",
    },
    {
      title: (
        <>
          Rester connecté en continu
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            Désirez-vous rester connecté avec vos proches 24h/24 ?
          </span>
        </>
      ),
      text: "Profitez des solutions qui vous permettent de garder le contact avec vos proches, où que vous soyez et à tout moment.",
      button1: "Démarrer l'Aventure",
      button2: "En savoir plus",
      background: "/img/hero-carousel/background_9.jpg",
    },
    {
      title: (
        <>
          Atteindre la liberté financière
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            Souhaitez-vous en finir avec vos préoccupations financières ?
          </span>
        </>
      ),
      text: "Découvrez des moyens efficaces pour réduire vos soucis financiers et construire une stabilité durable.",
      button1: "Nous rejoindre!",
      button2: "A propos de nous",
      background: "/img/hero-carousel/background_4.jpg",
    },
    
    {
      title: (
        <>
          Bienvenu chez SOLIFIN!
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            Solution Express Pour L’Indépendance Financière
          </span>
        </>
      ),
      text: "SOLIFIN, Votre Partenaire Fidèle Pour L’Indépendance Financière, Ensemble pour la liberté financière",
      button1: "Vous lancez!",
      button2: "A propos de nous",
      background: "/img/hero-carousel/background_8.jpg",
    },
  ];

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-18 lg:pt-20"
    >
      {/* Image de fond dynamique */}
      <div className="absolute inset-0">
        <img
          src={slides[activeIndex].background}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Superposition semi-transparente */}
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-br from-gray-800/85 to-gray-800/85"
              : "bg-gradient-to-br from-primary-50/70 to-white/70"
          }`}
        />
      </div>

      {/* Effet d'animation */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <div
          className={`absolute transform rotate-45 -top-1/4 -left-1/4 w-1/2 h-1/2 ${
            isDarkMode ? "bg-primary-700/30" : "bg-primary-200/50"
          } rounded-full filter blur-3xl`}
        />
        <div
          className={`absolute transform -rotate-45 -bottom-1/4 -right-1/4 w-1/2 h-1/2 ${
            isDarkMode ? "bg-primary-800/30" : "bg-primary-100/50"
          } rounded-full filter blur-3xl`}
        />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ el: ".custom-swiper-pagination", clickable: true }}
          autoplay={{ delay: 7000, disableOnInteraction: false }}
          loop={true}
          className="max-w-4xl mx-auto"
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        >
          {slides?.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1
                    className={`text-7xl md:text-8xl lg:text-9xl xl:text-10xl font-bold mb-6 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    {slide.title}
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {slide.text}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <RouterLink to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn-primary text-lg md:text-xl lg:text-2xl px-6 md:px-8 py-3 md:py-4 ${
                        isDarkMode
                          ? "bg-primary-500 hover:bg-primary-400 text-white"
                          : ""
                      }`}
                    >
                      {slide.button1}
                    </motion.button>
                  </RouterLink>
                  <ScrollLink
                    to="about"
                    smooth={true}
                    duration={800}
                    offset={-70}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn-primary text-lg md:text-xl lg:text-2xl px-6 md:px-8 py-3 md:py-4 ${
                        isDarkMode
                          ? "bg-gray-800 text-primary-400 border-2 border-primary-500 hover:bg-gray-700"
                          : "bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      {slide.button2}
                    </motion.button>
                  </ScrollLink>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Pagination customisée Swiper */}
        <div className="custom-swiper-pagination flex justify-center mt-8" />
      </div>

      {/* Flèche de défilement */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <ScrollLink
          to="features"
          spy={true}
          smooth={true}
          offset={-70}
          duration={500}
        >
          <ChevronDownIcon
            className={`h-10 w-10 md:h-12 md:w-12 cursor-pointer ${
              isDarkMode ? "text-primary-400" : "text-primary-600"
            }`}
          />
        </ScrollLink>
      </motion.div>
      {/* Style pour les bullets Swiper */}
      <style>{`
        .custom-swiper-pagination {
          position: static !important;
          margin-top: 2rem;
          z-index: 20;
          margin-bottom: 12px
        }
        .custom-swiper-pagination .swiper-pagination-bullet {
          background: ${
            isDarkMode ? "#e5e7eb" : "gray"
          } !important; /* gris très clair */
          opacity: 0.6;
          width: 10px;
          height: 6px;
          border-radius: 3px;
          margin: 0 4px !important;
          transition: width 0.3s, background 0.3s, opacity 0.3s;
          box-shadow: none !important;
        }
        .custom-swiper-pagination .swiper-pagination-bullet-active {
          background:rgb(31, 168, 61) !important; /* gris moyen */
          opacity: 1;
          width: 32px;
        }
      `}</style>
    </section>
  );
}
