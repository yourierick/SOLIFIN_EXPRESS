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
          : "bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
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
        <p
          className={`text-lg max-w-3xl mx-auto ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          En savoir plus sur la Solution Express Pour l'indépendance Financière
        </p>

        <div className="mt-16">
          {/* Présentation principale - occupe 2 colonnes sur grand écran */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`lg:col-span-2 p-8 rounded-2xl transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700"
                : "bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100"
            }`}
          >
            <div
              className={`text-left mb-6 leading-relaxed ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {/* Mission */}
              <div className="mt-6">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isDarkMode ? "bg-green-900/30" : "bg-green-100"
                  }`}>
                    <FlagIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    1. MISSION
                  </h4>
                </div>
                <div className="ml-10 space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-green-500">
                     SOLIFIN est un programme visant à garantir à toute personne son autonomie financière  à travers la promotion de conditions d'accès pour tous  aux  divers services et opportunités prometteurs.
                  </div>
                </div>
              </div>

              {/* Vision */}
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                  }`}>
                    <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    2. VISION
                  </h4>
                </div>
                <div className="ml-10 space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-blue-500">
                     Contribuer à une société où chaque personne est financièrement autonome et contribue ainsi au processus de consolidation de la paix et de développement socioéconomique  de sa propre société.
                  </div>
                </div>
              </div>
              
              {/* Valeurs */}
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isDarkMode ? "bg-purple-900/30" : "bg-purple-100"
                  }`}>
                    <HeartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    3. VALEURS
                  </h4>
                </div>
                <div className="ml-10 space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-purple-500">
                    <span className="font-semibold">ACCESSIBILITE:</span> SOLIFIN s'engage à desservir ses abonnés même dans les zones les moins accessibles à travers la digitalisation de ses services, le partenariat local,..
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-purple-500">
                    <span className="font-semibold">TRANSPARENCE :</span> les données financières sont partagées à temps réel à travers les comptes abonnés  par Solifin et les opinions des abonnés  sont prises en compte dans le processus de développement de services.
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-purple-500">
                    <span className="font-semibold">CREDIBILITE :</span> SOLIFIN s'engage de fournir les services de qualité dans le strict respect de clauses convenues, et sa politique contre la fraude et la corruption.
                  </div>
                </div>
              </div>
              
              {/* Principes */}
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isDarkMode ? "bg-orange-900/30" : "bg-orange-100"
                  }`}>
                    <LightBulbIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h4 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    PRINCIPES
                  </h4>
                </div>
                <div className="ml-10 space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-orange-500">
                    <span className="font-semibold">AUTONOMIE FINANCIERE:</span> la vision de SOLIFIN est  de contribuer à la société où chaque personne est financièrement autonome et participe ainsi au processus de consolidation de la paix et de développement  socioéconomique de sa propre société
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-orange-500">
                    <span className="font-semibold">NOS ABONNES D'ABORD :</span> les services Solifin sont prioritairement fournis à la satisfaction des abonnés à travers la prise en charge à temps réel de leur requêtes, leurs accompagnement/renforcement des capacités en divers modules dont l'éducation financière,...
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-orange-500">
                    <span className="font-semibold">DIGITALISATION :</span>Solifin offre la solution numérique flexible par rapport aux besoins actuels des abonnés, un de facteur de croissance de taux d'inclusion numérique.
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-orange-500">
                    <span className="font-semibold">TRAVAIL EN EQUIPE :</span>Solifin  favorise le travail en équipe  entre abonnés à travers son programme de fidélité  afin d’atteindre le publique plus large dans le processus d’autonomisation de la population sur le plan financier et développement personnel
                  </div>
                </div>
              </div>
              
              {/* Slogan/Devise */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <SparklesIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <p className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      SLOGAN/DEVISE
                    </p>
                    <SparklesIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 ml-2" />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-l-2 border-yellow-500 inline-block">
                    <p className={`italic font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      "Ensemble pour la liberté financière"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
