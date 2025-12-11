import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import {
  InformationCircleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
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
      className={`max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 ${
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
          Découvrez notre mission et notre vision pour l'indépendance financière
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
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
            <div className="flex items-center mb-6">
              <div
                className={`rounded-full p-3 mr-4 ${
                  isDarkMode ? "bg-green-900/40" : "bg-green-50"
                }`}
              >
                <InformationCircleIcon
                  className={`h-8 w-8 ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
                />
              </div>
              <h3
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Qui sommes-nous?
              </h3>
            </div>

            <div
              className={`text-left mb-6 leading-relaxed ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <p className="mb-4">
                <span className="font-bold text-green-600">
                  SOLUTION EXPRESS POUR L'INDEPENDANCE FINANCIERE (SOLIFIN)
                </span>{" "}
                est un programme en ligne de promotion du secteur
                entrepreneurial offrant à la population multiple services
                libérateurs sur le plan financier.
              </p>

              <p>
                Lancé sur base de constats faits dans bien de sociétés où
                l’accès aisé de la majeure partie de la population aux
                différents services sociaux économiques de qualité(éducation,
                santé, emploi,…) était très limité faute de moyens financiers
                requis ; Ce programme est destiné aux divers usages
                d’entrepreneurs , d’acteurs humanitaires et/ou de développement
                socioéconomique œuvrant réellement pour la promotion de
                conditions vies socioéconomiques et financière de communautés.
              </p>
              <div className="mt-6">
                <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  MISSION
                </h4>
                <div className="space-y-3">
                  <div>
                     SOLIFIN est un programme visant à garantir à toute personne son autonomie financière dans le contexte de promotion de paix et développement socioéconomique  de la population locale. Pour cela, Solifin offre quotidiennement à la population divers services et opportunités libérateurs sur le plan financier.
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  VISION
                </h4>
                <div className="space-y-3">
                  <div>
                     SOLIFIN est dédié à contribuer à une société où chaque personne est financièrement autonome et participe ainsi au processus de consolidation de la paix et de développement socioéconomique  de sa propre société.
                  </div>
                </div>
              </div>
              
              {/* Valeurs */}
              <div className="mt-6">
                <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  VALEURS
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">ACCESSIBILITE:</span> SOLIFIN s'engage à desservir ses abonnés même dans les zones les moins accessibles à travers la digitalisation de ses services, le partenariat local,..
                  </div>
                  <div>
                    <span className="font-semibold">TRANSPARENCE :</span> les données financières sont partagées à temps réel à travers les comptes abonnés par Solifin et les opinions des abonnés sont prises en compte dans le processus de développement de services.
                  </div>
                  <div>
                    <span className="font-semibold">CREDIBILITE :</span> SOLIFIN s'engage de fournir les services de qualité dans le strict respect de clauses convenues, et sa politique contre la fraude et la corruption.
                  </div>
                </div>
              </div>
              
              {/* Principes */}
              <div className="mt-6">
                <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  PRINCIPES
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">AUTONOMIE FINANCIERE:</span> la vision de SOLIFIN est de contribuer à la société où chaque personne est financièrement autonome et participe ainsi au processus de consolidation de la paix et de développement socioéconomique de sa propre société
                  </div>
                  <div>
                    <span className="font-semibold">ABONNES D'ABORD :</span> les services Solifin sont prioritairement fournis à la satisfaction des abonnés à travers la prise en charge à temps réel de leur requêtes, leurs accompagnement/renforcement des capacités en divers modules dont éducation financière,...
                  </div>
                  <div>
                    <span className="font-semibold">DIGITALISATION :</span>Solifin offre la solution numérique flexible par rapport aux besoins actuels des abonnés, un de facteur de croissance de taux d'inclusion numérique.
                  </div>
                  <div>
                    <span className="font-semibold">TRAVAIL EN EQUIPE :</span>Solifin favorise le travail en équipe entre abonnés à travers son programme de fidélité afin d'atteindre le publique plus large dans le processus d'autonomisation de la population sur le plan financier et développement personnel
                  </div>
                </div>
              </div>
              
              {/* Slogan/Devise */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-center font-bold text-lg ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  SLOGAN/DEVISE
                </p>
                <p className={`text-center italic font-medium mt-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                  "Ensemble pour la liberté financière"
                </p>
              </div>
            </div>
          </motion.div>

          {/* Caractéristiques - occupe 1 colonne sur grand écran */}
          <div className="lg:col-span-1">
            <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
              PRINCIPES DU PROGRAMME DE FIDELITE 
            </h4>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              {features?.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700"
                    : "bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100"
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`rounded-full p-2 mr-4 flex-shrink-0 ${
                      isDarkMode ? "bg-green-900/40" : "bg-green-50"
                    }`}
                  >
                    <div
                      className={
                        isDarkMode ? "text-green-400" : "text-green-600"
                      }
                    >
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={itemVariants}
              className={`p-6 rounded-2xl transition-all duration-300 ${
                isDarkMode
                  ? "bg-green-900/30 border border-green-800"
                  : "bg-green-50 border border-green-100"
              }`}
            >
              <p
                className={`text-center font-medium ${
                  isDarkMode ? "text-green-300" : "text-green-700"
                }`}
              >
                Nos bénéficiaires incluent les chômeurs, les salariés, les
                entrepreneurs, les institutions et les ONG.
              </p>
            </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
