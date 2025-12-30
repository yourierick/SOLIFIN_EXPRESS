import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import {
  InformationCircleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  FlagIcon,
  EyeIcon,
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function AboutSolifin() {
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: "Réseau Solidaire",
      description:
        "Un programme basé sur le principe de marketing digital dans la vente collective des services SOLIFIN.",
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      title: "Indépendance Financière",
      description:
        "Libérer chaque personne abonnée de sa dépendance financière à travers le paiement des commissions générées sur la vente des services SOLIFIN.",
    },
    {
      icon: <BuildingLibraryIcon className="h-6 w-6" />,
      title: "Développement Socioéconomique",
      description:
        "Chaque abonné contribue à l’amélioration des conditions de vie socioéconomiques dans sa communauté à travers le parrainage de ses proches, la contribution aux actions de développement et/ou humanitaires de sa zone.",
    },
  ];

  return (
    <div
      className={`w-full px-4 py-16 sm:px-6 lg:px-8 ${
        isDarkMode
          ? ""
          : "bg-white hover:shadow-green-500/30 border border-gray-100"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3"
      >
        <h2
          className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          À propos de{" "}
          <span className={isDarkMode ? "text-green-400" : "text-green-600"}>
            SOLIFIN
          </span>
        </h2>

        <div className="mt-4">
          {/* Présentation principale - design moderne avec cartes */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`lg:col-span-2 p-6 rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl border border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-100"
            }`}
          >
            {/* Mission et Vision - sur la même ligne sur grand écran */}
            <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mission */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-green-50 to-green-100 border border-green-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-green-200"
                  }`}>
                    <FlagIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-green-400/70" : "text-green-600"
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    NOTRE MISSION
                  </h3>
                </div>
                <p className={`ml-16 leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  SOLIFIN est un programme visant à garantir à toute personne son autonomie financière 
                  à travers la promotion de conditions d'accès pour tous aux divers services et opportunités prometteurs.
                </p>
              </div>

              {/* Vision */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-blue-200"
                  }`}>
                    <EyeIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-blue-400/70" : "text-blue-600"
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    NOTRE VISION
                  </h3>
                </div>
                <p className={`ml-16 leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Contribuer à une société où chaque personne est financièrement autonome et contribue ainsi 
                  au processus de consolidation de la paix et de développement socioéconomique de sa propre société.
                </p>
              </div>
            </div>
            
            {/* Valeurs et Principes - sur la même ligne sur grand écran */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valeurs */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-purple-200"
                  }`}>
                    <HeartIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-purple-400/70" : "text-purple-600"
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    NOS VALEURS
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-purple-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-purple-300/70" : "text-purple-700"
                    }`}>ACCESSIBILITÉ:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      SOLIFIN s'engage à desservir ses abonnés même dans les zones les moins accessibles 
                      à travers la digitalisation de ses services, le partenariat local...
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-purple-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-purple-300/70" : "text-purple-700"
                    }`}>TRANSPARENCE:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Les données financières sont partagées à temps réel à travers les comptes abonnés 
                      par Solifin et les opinions des abonnés sont prises en compte...
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-purple-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-purple-300/70" : "text-purple-700"
                    }`}>CRÉDIBILITÉ:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      SOLIFIN s'engage de fournir les services de qualité dans le strict respect 
                      de clauses convenues, et sa politique contre la fraude et la corruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Principes */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-orange-200"
                  }`}>
                    <LightBulbIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-orange-400/70" : "text-orange-600"
                    }`} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    NOS PRINCIPES
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-orange-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-orange-300/70" : "text-orange-700"
                    }`}>AUTONOMIE FINANCIÈRE:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      La vision de SOLIFIN est de contribuer à la société où chaque personne est 
                      financièrement autonome et participe ainsi au processus de consolidation...
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-orange-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-orange-300/70" : "text-orange-700"
                    }`}>NOS ABONNÉS D'ABORD:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Les services Solifin sont prioritairement fournis à la satisfaction des abonnés 
                      à travers la prise en charge à temps réel de leur requêtes...
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-orange-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-orange-300/70" : "text-orange-700"
                    }`}>DIGITALISATION:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Solifin offre la solution numérique flexible par rapport aux besoins actuels 
                      des abonnés, un de facteur de croissance de taux d'inclusion numérique.
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600/20" : "bg-orange-50"
                  }`}>
                    <span className={`font-semibold ${
                      isDarkMode ? "text-orange-300/70" : "text-orange-700"
                    }`}>TRAVAIL EN ÉQUIPE:</span>
                    <p className={`mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Solifin favorise le travail en équipe entre abonnés à travers son programme 
                      de fidélité afin d'atteindre le publique plus large...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Slogan/Devise */}
            <div className={`mt-8 p-6 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                : "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
            }`}>
              <div className="flex items-center justify-center mb-4">
                <SparklesIcon className={`h-6 w-6 ${
                  isDarkMode ? "text-yellow-400/70" : "text-yellow-600"
                } mr-3`} />
                <h3 className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  SLOGAN/DEVISE
                </h3>
                <SparklesIcon className={`h-6 w-6 ${
                  isDarkMode ? "text-yellow-400/70" : "text-yellow-600"
                } ml-3`} />
              </div>
              <div className={`p-4 rounded-lg inline-block ${
                isDarkMode ? "bg-gray-600/20" : "bg-yellow-50"
              }`}>
                <p className={`italic text-lg font-medium ${
                  isDarkMode ? "text-yellow-300/70" : "text-yellow-700"
                }`}>
                  "Ensemble pour la liberté financière"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
