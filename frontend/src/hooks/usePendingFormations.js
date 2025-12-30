import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook personnalisé pour récupérer le nombre de formations en attente
 * @param {boolean} isAdmin - Indique si l'utilisateur est administrateur
 * @returns {Object} - Objet contenant le nombre de formations en attente et l'état de chargement
 */
const usePendingFormations = (isAdmin = false) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingFormations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/formations/pending/count");
      setPendingCount(response.data.count);
      setError(null);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des formations en attente:",
        err
      );
      setError("Impossible de charger les formations en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetchPendingFormations();

    // Mettre à jour le compteur toutes les 2 minutes
    const interval = setInterval(() => {
      // Vérifier si la page est visible avant de faire la requête
      if (document.visibilityState === "visible" && isAdmin) {
        fetchPendingFormations();
      }
    }, 2 * 60 * 1000);

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAdmin) {
        // Rafraîchir les données quand l'utilisateur revient sur la page
        fetchPendingFormations();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdmin]);

  return { pendingCount, loading, error, refresh: fetchPendingFormations };
};

export default usePendingFormations;
