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
          className="text-center mb-16"
        >
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-5xl mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Programme de fidélité des abonnés aux Services SOLIFIN{" "}
            <span
              className={`relative inline-block ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Pour la croissance de vos revenus
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
            Découvrez les avantages uniques qui font de notre système MLM la
            référence dans le domaine du marketing digital.
          </p>
        </motion.div>

        {/* Section Principes du Programme de Fidélité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className={`p-8 rounded-2xl ${
            isDarkMode 
              ? "bg-gray-800 shadow-lg border border-gray-700" 
              : "bg-white shadow-lg border border-gray-100"
          }`}>
            <h3 className={`text-2xl font-bold text-center mb-8 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              I. PRINCIPES DU PROGRAMME DE FIDELITE
            </h3>
            
            <div className="space-y-6">
              {/* Réseau Solidaire */}
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-4 mt-1 flex-shrink-0 ${
                  isDarkMode ? "bg-green-900/30" : "bg-green-100"
                }`}>
                  <UserGroupIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className={`font-bold text-lg mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Réseau Solidaire
                  </h4>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}>
                    Un programme basé sur le principe de marketing digital dans la vente collective des services SOLIFIN. Cette approche permet à chaque abonné de bénéficier de la force du réseau pour développer ses activités et accroître ses revenus grâce à la collaboration mutuelle.
                  </p>
                </div>
              </div>

              {/* Indépendance Financière */}
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-4 mt-1 flex-shrink-0 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}>
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className={`font-bold text-lg mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Indépendance Financière
                  </h4>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}>
                    Libérer chaque personne abonnée de sa dépendance financière à travers le paiement de commission générée sur la vente des services SOLIFIN. Chaque membre devient acteur de sa réussite financière en construisant des sources de revenus passifs et durables.
                  </p>
                </div>
              </div>

              {/* Appui au Développement Socioéconomique */}
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-4 mt-1 flex-shrink-0 ${
                  isDarkMode ? "bg-purple-900/30" : "bg-purple-100"
                }`}>
                  <BuildingLibraryIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className={`font-bold text-lg mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Appui au Développement Socioéconomique
                  </h4>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}>
                    Chaque abonné contribue à l'amélioration des conditions de vie socioéconomiques dans sa communauté à travers le parrainage de ses proches, la contribution aux actions de développement et/ou humanitaires de sa zone. Le programme crée un impact positif qui s'étend bien au-delà des bénéfices individuels.
                  </p>
                </div>
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
          className="mb-16"
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
            
            <div className="space-y-6">
              {features?.map((feature, index) => (
                <div key={feature.name} className="flex items-start">
                  <div className={`p-2 rounded-lg mr-4 mt-1 flex-shrink-0 ${
                    isDarkMode ? "bg-primary-900/30" : "bg-primary-100"
                  }`}>
                    <feature.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg mb-2 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {feature.name}
                    </h4>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
