import { motion } from "framer-motion";
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";

const features = [
  {
    name: "Gains Exponentiels",
    description:
      "Profitez d’un système de rémunération innovant qui vous permet d’accumuler des commissions sur plusieurs niveaux de parrainage de vos filleuls (abonnés), maximisant ainsi vos revenus à chaque nouvelle adhésion dans votre réseau.",
    icon: CurrencyDollarIcon,
  },
  {
    name: "Communauté Solidaire",
    description:
      "Rejoignez une communauté dynamique d’abonnés où l’entraide et le partage sont au cœur de nos valeurs. Ensemble, nous créons un réseau solide où chacun contribue à la réussite collective tout en atteignant ses propres objectifs.",
    icon: UserGroupIcon,
  },
  {
    name: "Croissance Rapide",
    description:
      "Bénéficiez d’un modèle de développement accéléré qui vous permet d’atteindre l’indépendance financière plus rapidement grâce à notre système de parrainage efficace et à nos outils de croissance performants.",
    icon: ChartBarIcon,
  },
  {
    name: "Sécurité Garantie",
    description:
      "Votre confiance est notre priorité. SOLIFIN assure la sécurité de vos transactions et la protection de vos données personnelles grâce à des protocoles de sécurité avancés et une gestion transparente des opérations.",
    icon: ShieldCheckIcon,
  },
  {
    name: "Innovation Continue",
    description:
      "Nous investissons constamment dans le développement de nouvelles fonctionnalités et l’amélioration de notre plateforme pour vous offrir les meilleures solutions numériques, adaptées aux évolutions du marché.",
    icon: RocketLaunchIcon,
  },
  {
    name: "Portée Internationale",
    description:
      "Étendez votre réseau au-delà des frontières grâce à notre présence mondiale. SOLIFIN vous permet de construire une équipe internationale et de saisir des opportunités d’affaires à l’échelle globale.",
    icon: GlobeAltIcon,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
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

export default function Features() {
  const { isDarkMode } = useTheme();

  return (
    <section
      id="features"
      className={`section-padding ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <div className="inline-block">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              className={`h-1 w-20 mx-auto mb-4 rounded-full ${
                isDarkMode ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-green-500 to-emerald-500"
              }`}
            />
          </div>
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Programme de fidélité pour les  abonnés aux services {" "}
            <span className={isDarkMode ? "text-green-400" : "text-green-600"}>
              SOLIFIN
            </span>
          </h2>
        </motion.div>

        {/* Section Principes du Programme de Fidélité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className={`p-5 rounded-2xl ${
            isDarkMode 
              ? "bg-gray-800 shadow-lg border border-gray-700" 
              : "bg-white shadow-lg border border-gray-100"
          }`}>
            <h3 className={`text-2xl font-bold text-center mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              I. PRINCIPES DU PROGRAMME DE FIDELITE
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Réseau Solidaire */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-green-50 to-green-100 border border-green-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-green-200"
                  }`}>
                    <UserGroupIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-green-400/70" : "text-green-600"
                    }`} />
                  </div>
                  <h4 className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Réseau Solidaire
                  </h4>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Un programme basé sur le principe de marketing digital dans la vente collective des services SOLIFIN. Cette approche permet à chaque abonné de bénéficier de la force du réseau pour développer ses activités et accroître ses revenus grâce à la collaboration mutuelle.
                </p>
              </div>

              {/* Indépendance Financière */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-blue-200"
                  }`}>
                    <CurrencyDollarIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-blue-400/70" : "text-blue-600"
                    }`} />
                  </div>
                  <h4 className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Indépendance Financière
                  </h4>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Libérer chaque personne abonnée de sa dépendance financière à travers le paiement de commission générée sur la vente des services SOLIFIN. Chaque membre devient acteur de sa réussite financière en construisant des sources de revenus passifs et durables.
                </p>
              </div>

              {/* Appui au Développement Socioéconomique */}
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-700/40 to-gray-600/20 border border-gray-600/40"
                  : "bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200"
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl mr-4 ${
                    isDarkMode ? "bg-gray-600/40" : "bg-purple-200"
                  }`}>
                    <BuildingLibraryIcon className={`h-6 w-6 ${
                      isDarkMode ? "text-purple-400/70" : "text-purple-600"
                    }`} />
                  </div>
                  <h4 className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Appui au Développement Socioéconomique
                  </h4>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Chaque abonné contribue à l'amélioration des conditions de vie socioéconomiques dans sa communauté à travers le parrainage de ses proches, la contribution aux actions de développement et/ou humanitaires de sa zone. Le programme crée un impact positif qui s'étend bien au-delà des bénéfices individuels.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Pourquoi choisir notre programme de fidélité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={`p-8 rounded-2xl ${
            isDarkMode 
              ? "bg-gray-800 shadow-lg border border-gray-700" 
              : "bg-white shadow-lg border border-gray-100"
          }`}>
            <h3 className={`text-2xl font-bold text-center mb-8 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              2. POURQUOI CHOISIR NOTRE PROGRAMME DE FIDELITE ?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features?.map((feature, index) => {
                // Définir les couleurs alternatives
                const colorSchemes = [
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-green-50 to-green-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-green-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-green-200",
                    iconColor: isDarkMode ? "text-green-400/70" : "text-green-600"
                  },
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-blue-50 to-blue-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-blue-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-blue-200",
                    iconColor: isDarkMode ? "text-blue-400/70" : "text-blue-600"
                  },
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-purple-50 to-purple-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-purple-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-purple-200",
                    iconColor: isDarkMode ? "text-purple-400/70" : "text-purple-600"
                  },
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-orange-50 to-orange-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-orange-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-orange-200",
                    iconColor: isDarkMode ? "text-orange-400/70" : "text-orange-600"
                  },
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-pink-50 to-pink-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-pink-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-pink-200",
                    iconColor: isDarkMode ? "text-pink-400/70" : "text-pink-600"
                  },
                  {
                    bg: isDarkMode ? "from-gray-700/40 to-gray-600/20" : "from-indigo-50 to-indigo-100",
                    border: isDarkMode ? "border-gray-600/40" : "border-indigo-200",
                    iconBg: isDarkMode ? "bg-gray-600/40" : "bg-indigo-200",
                    iconColor: isDarkMode ? "text-indigo-400/70" : "text-indigo-600"
                  }
                ];
                
                const colorScheme = colorSchemes[index % colorSchemes.length];
                
                return (
                  <div key={feature.name} className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${colorScheme.bg} border ${colorScheme.border}`}>
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-xl mr-4 ${colorScheme.iconBg}`}>
                        <feature.icon className={`h-6 w-6 ${colorScheme.iconColor}`} />
                      </div>
                      <h4 className={`font-bold text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        {feature.name}
                      </h4>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
