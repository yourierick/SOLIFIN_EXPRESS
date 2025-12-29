import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import publicAxios from "../utils/publicAxios";
import { 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export default function OpportunitiesTable() {
  const { isDarkMode } = useTheme();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchOpportunities = async (page = 1) => {
    try {
      setLoading(true);
      const response = await publicAxios.get(`/api/opportunities/all?page=${page}&limit=${itemsPerPage}`);
      setOpportunities(response.data.opportunities || []);
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

  useEffect(() => {
    fetchOpportunities(currentPage);
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchOpportunities(page);
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

  if (!opportunities.length) {
    return (
      <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="text-center py-12 text-gray-400">
            Aucune opportunité disponible pour le moment.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full py-16 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            Opportunités d'Emploi et d'Affaire
          </h2>
          <p className={`text-lg ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            Découvrez les dernières opportunités professionnelles et business
          </p>
        </motion.div>

        <div className="overflow-x-auto" id="opportunities-table">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <table className={`w-full rounded-lg overflow-hidden ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-lg`}>
              <thead className={
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              }>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Type
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Poste/Opportunité
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Entreprise
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Localisation
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Date limite
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}>
                {opportunities.map((opportunity, index) => (
                  <motion.tr
                    key={`${opportunity.type_opportunite}-${opportunity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`hover:${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOpportunityTypeColor(opportunity.type_opportunite)}`}>
                        {getOpportunityIcon(opportunity.type_opportunite)}
                        <span className="ml-2">{getOpportunityTypeLabel(opportunity.type_opportunite)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        {opportunity.titre}
                      </div>
                      {opportunity.reference && (
                        <div className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          Réf: {opportunity.reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {opportunity.entreprise}
                      </div>
                      {opportunity.secteur && (
                        <div className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {opportunity.secteur}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {opportunity.ville}, {opportunity.pays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}>
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(opportunity.date_limite)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Télécharger le document associé
                          const fileUrl = opportunity.type_opportunite === 'emploi' 
                            ? opportunity.offer_file_url 
                            : opportunity.opportunity_file_url;
                          
                          if (fileUrl) {
                            // Créer un lien temporaire pour le téléchargement
                            const link = document.createElement('a');
                            link.href = fileUrl;
                            link.download = opportunity.type_opportunite === 'emploi' 
                              ? `offre-emploi-${opportunity.reference || opportunity.id}.pdf`
                              : `opportunite-affaire-${opportunity.reference || opportunity.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            // Rediriger vers la page si aucun document n'est disponible
                            if (opportunity.type_opportunite === 'emploi') {
                              window.location.href = `/dashboard/pages/${opportunity.page_id}#job-${opportunity.id}`;
                            } else {
                              window.location.href = `/dashboard/pages/${opportunity.page_id}#opportunity-${opportunity.id}`;
                            }
                          }
                        }}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isDarkMode 
                            ? "bg-primary-600 hover:bg-primary-700 text-white" 
                            : "bg-primary-500 hover:bg-primary-600 text-white"
                        }`}
                      >
                        {opportunity.type_opportunite === 'emploi' 
                          ? (opportunity.offer_file_url ? "Télécharger" : "Voir plus")
                          : (opportunity.opportunity_file_url ? "Télécharger" : "Voir plus")
                        }
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </motion.button>
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
              window.location.href = "/interet";
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
