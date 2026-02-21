import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook centralisé pour récupérer tous les compteurs du dashboard en une seule requête
 * @param {boolean} isAdmin - Indique si l'utilisateur est administrateur
 * @returns {Object} - Objet contenant tous les compteurs et l'état de chargement
 */
const useDashboardCounters = (isAdmin = false) => {
  const [counters, setCounters] = useState({
    withdrawals: 0,
    formations: 0,
    digital_products: 0,
    advertisements: 0,
    job_offers: 0,
    social_events: 0,
    business_opportunities: 0,
    testimonials: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false); // Protection contre doubles appels

  const fetchCounters = async () => {
    // Protection contre les doubles appels (React Strict Mode)
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      // Ajouter un délai court pour éviter le clignotement
      const loadingTimeout = setTimeout(() => setLoading(true), 300);
      
      const response = await axios.get("/api/admin/dashboard/counters");
      clearTimeout(loadingTimeout);
      
      if (response.data.success) {
        setCounters(response.data.data);
        setError(null);
      } else {
        console.error("Erreur lors de la récupération des compteurs:", response.data.message);
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des compteurs:", err);
      setError("Impossible de charger les compteurs");
      // En cas d'erreur, mettre tous les compteurs à 0 pour éviter NaN
      setCounters({
        withdrawals: 0,
        formations: 0,
        digital_products: 0,
        advertisements: 0,
        job_offers: 0,
        social_events: 0,
        business_opportunities: 0,
        testimonials: 0,
      });
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setCounters({
        withdrawals: 0,
        formations: 0,
        digital_products: 0,
        advertisements: 0,
        job_offers: 0,
        social_events: 0,
        business_opportunities: 0,
        testimonials: 0,
      });
      return;
    }

    fetchCounters();

    // Rafraîchir les compteurs toutes les 5 minutes
    const intervalId = setInterval(() => {
      // Vérifier si la page est visible avant de faire la requête
      if (document.visibilityState === "visible" && isAdmin) {
        fetchCounters();
      }
    }, 5 * 60 * 1000);

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAdmin) {
        // Rafraîchir les données quand l'utilisateur revient sur la page
        fetchCounters();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdmin]);

  return { 
    counters, 
    loading, 
    error, 
    refresh: fetchCounters,
    // Compteurs individuels pour compatibilité avec le code existant
    pendingCount: counters.withdrawals,
    pendingFormationsCount: counters.formations,
    pendingTestimonialsCount: counters.testimonials,
    pendingPublicationsCount: counters.digital_products + counters.advertisements + counters.job_offers + counters.social_events + counters.business_opportunities,
  };
};

export default useDashboardCounters;
