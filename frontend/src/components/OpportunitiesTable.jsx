import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import publicAxios from "../utils/publicAxios";
import { 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

export default function OpportunitiesTable() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedType, setSelectedType] = useState('all'); // Filtre par type
  const itemsPerPage = 10;

  const fetchOpportunities = async (page = 1, type = 'all') => {
    try {
      setLoading(true);
      
      // Construire l'URL avec le filtre
      let url = `/api/opportunities/all?page=${page}&limit=${itemsPerPage}`;
      if (type !== 'all') {
        url += `&type=${type}`;
      }
      
      const response = await publicAxios.get(url);
      
      // Gérer le cas où opportunities est un objet ou un tableau
      let opportunitiesData = [];
      if (response.data.opportunities) {
        if (Array.isArray(response.data.opportunities)) {
          opportunitiesData = response.data.opportunities;
        } else if (typeof response.data.opportunities === 'object') {
          // Convertir l'objet en tableau
          opportunitiesData = Object.values(response.data.opportunities);
        }
      }
      
      setOpportunities(opportunitiesData);
      setFilteredOpportunities(opportunitiesData); // Plus besoin de filtrer côté frontend
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
      setCurrentPage(page);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des opportunités", error);
      setError("Erreur lors du chargement des opportunités");
      setLoading(false);
    }
  };

  const handleTypeFilter = (type) => {
    setSelectedType(type);
    setCurrentPage(1); // Revenir à la première page lors du changement de filtre
    fetchOpportunities(1, type); // Recharger avec le nouveau filtre
  };

  useEffect(() => {
    fetchOpportunities(currentPage, selectedType);
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchOpportunities(page, selectedType);
      // Scroll vers le haut du tableau
      document.getElementById('opportunities-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getOpportunityIcon = (type) => {
    switch (type) {
      case 'emploi':
        return <BriefcaseIcon className="h-5 w-5" />;
      case 'affaire':
        return <BuildingOfficeIcon className="h-5 w-5" />;
      default:
        return <BriefcaseIcon className="h-5 w-5" />;
    }
  };

  const getOpportunityTypeLabel = (type) => {
    switch (type) {
      case 'emploi':
        return "Offre d'emploi";
      case 'affaire':
        return "Opportunité d'affaire";
      default:
        return "Opportunité";
    }
  };

  const getOpportunityTypeColor = (type) => {
    switch (type) {
      case 'emploi':
        return isDarkMode ? "text-blue-400 bg-blue-900/30" : "text-blue-600 bg-blue-50";
      case 'affaire':
        return isDarkMode ? "text-green-400 bg-green-900/30" : "text-green-600 bg-green-50";
      default:
        return isDarkMode ? "text-gray-400 bg-gray-900/30" : "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-400">Chargement des opportunités...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        </div>
      </section>
    );
  }

  if (!filteredOpportunities.length && !loading) {
    return (
      <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
              <BriefcaseIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Aucune opportunité trouvée
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Essayez de modifier vos filtres pour voir plus de résultats
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full py-16 ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-green-50 via-emerald-50 to-green-50"}`}>
      <div className={`w-full px-4 mx-auto sm:px-6 lg:px-8`}>
        {/* Header moderne simplifié */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <div className="inline-block">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                className={`h-1 w-20 mx-auto mb-2 rounded-full ${
                  isDarkMode ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-green-500 to-emerald-500"
                }`}
              />
            </div>
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Opportunités d'Emploi et d'Affaire
            </h2>
            <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Découvrez les meilleures opportunités pour votre carrière
            </p>
          </div>

          {/* Statistiques */}
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm ${
              isDarkMode ? "bg-gray-800/50 text-gray-300 border border-gray-700" : "bg-white/80 text-gray-600 border border-gray-200"
            }`}>
              <span className="font-medium">{filteredOpportunities.length}</span>
              <span className="ml-1">opportunité{filteredOpportunities.length > 1 ? 's' : ''} trouvée{filteredOpportunities.length > 1 ? 's' : ''}</span>
              {selectedType !== 'all' && (
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                  {selectedType === 'emploi' ? 'Emploi' : 'Affaire'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <div className={`overflow-x-auto rounded-2xl shadow-2xl border ${isDarkMode ? "bg-gray-800/90 border-gray-700/50 backdrop-blur-sm" : "bg-white/90 border-gray-200/50 backdrop-blur-sm"}`} id="opportunities-table">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-2"
          >
            <table className={`w-full rounded-xl overflow-hidden ${
              isDarkMode ? "bg-gray-800/50" : "bg-white/50"
            }`}>
              <thead className={
                isDarkMode ? "bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm border-b border-gray-700/50" : "bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/50"
              }>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    <div className="relative">
                      <select
                        value={selectedType}
                        onChange={(e) => handleTypeFilter(e.target.value)}
                        className={`appearance-none bg-transparent border-none text-sm font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-0 pr-8 ${
                          isDarkMode 
                            ? "text-gray-200 hover:text-white" 
                            : "text-gray-700 hover:text-gray-900"
                        }`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23${isDarkMode ? '9CA3AF' : '6B7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 4px center',
                          backgroundSize: '16px 16px'
                        }}
                      >
                        <option value="all" className={isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700"}>
                          Tous les types
                        </option>
                        <option value="emploi" className={isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700"}>
                          Emploi uniquement
                        </option>
                        <option value="affaire" className={isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700"}>
                          Affaire uniquement
                        </option>
                      </select>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    Poste/Opportunité
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    Entreprise
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span>Localisation</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Date limite</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b ${
                    isDarkMode ? "text-gray-200 border-gray-700/50" : "text-gray-700 border-gray-200/50"
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? "divide-gray-700/50" : "divide-gray-100/50"
              }`}>
                {filteredOpportunities.map((opportunity, index) => (
                  <motion.tr
                    key={`${opportunity.type_opportunite}-${opportunity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`hover:${
                      isDarkMode ? "bg-gray-700/30" : "bg-gray-50/50"
                    } transition-all duration-300 border-b ${
                      isDarkMode ? "border-gray-700/30" : "border-gray-100/50"
                    } hover:shadow-lg hover:scale-[1.01]`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold ${getOpportunityTypeColor(opportunity.type_opportunite)} shadow-md border ${
                        isDarkMode ? "border-gray-600/50" : "border-gray-300/50"
                      } backdrop-blur-sm`}>
                        {getOpportunityIcon(opportunity.type_opportunite)}
                        <span className="ml-2">{getOpportunityTypeLabel(opportunity.type_opportunite)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        {opportunity.titre}
                      </div>
                      {opportunity.reference && (
                        <div className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          Réf: {opportunity.reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}>
                        {opportunity.entreprise}
                      </div>
                      {opportunity.secteur && (
                        <div className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {opportunity.secteur}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center text-sm font-bold ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}>
                        <MapPinIcon className="h-4 w-4 mr-1 text-primary-500" />
                        {opportunity.ville}, {opportunity.pays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm font-bold ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}>
                        <CalendarIcon className="h-4 w-4 mr-1 text-orange-500" />
                        {formatDate(opportunity.date_limite)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                          href={opportunity.type_opportunite === 'emploi' 
                            ? opportunity.offer_file_url 
                            : opportunity.opportunity_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 ${
                            isDarkMode 
                              ? "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white border border-primary-500/50" 
                              : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border border-primary-400/50"
                          }`}
                          download
                        >
                          {opportunity.type_opportunite === 'emploi' 
                            ? (opportunity.offer_file_url ? "Télécharger" : "Voir plus")
                            : (opportunity.opportunity_file_url ? "Télécharger" : "Voir plus")
                          }
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Pagination */}
        {true && ( // Temporairement forcer l'affichage pour debug
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-6"
          >
            <div className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}>
              Page {currentPage} / {totalPages}   Total : {totalItems} 
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Bouton précédent */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? isDarkMode 
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDarkMode 
                      ? "bg-gray-600 hover:bg-gray-500 text-white" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Précédent
              </motion.button>

              {/* Numéros de page */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? isDarkMode 
                            ? "bg-primary-600 text-white" 
                            : "bg-primary-500 text-white"
                          : isDarkMode 
                            ? "bg-gray-600 hover:bg-gray-500 text-gray-300" 
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              {/* Bouton suivant */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? isDarkMode 
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDarkMode 
                      ? "bg-gray-600 hover:bg-gray-500 text-white" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Suivant
              </motion.button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigate("/interet");
            }}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
          >
            En savoir plus!
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
