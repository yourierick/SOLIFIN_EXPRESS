import { useState, useEffect } from "react";
import PublicationsDisplay from "./PublicationsDisplay";
import publicAxios from "../utils/publicAxios";

export default function PublicationsWrapper() {
  const [hasAds, setHasAds] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Vérifier s'il y a des publicités approuvées
    const checkAds = async () => {
      try {
        const response = await publicAxios.get("/api/ads/approved");
        
        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted) {
          const ads = response.data.ads || [];
          setHasAds(ads.length > 0);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des publicités", error);
        
        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted) {
          setHasAds(false);
          setLoading(false);
        }
      }
    };

    checkAds();

    // Cleanup function pour éviter les fuites de mémoire
    return () => {
      isMounted = false;
    };
  }, []);

  // Ne rien afficher pendant le chargement ou s'il n'y a pas de publicités
  if (loading || !hasAds) {
    return null;
  }

  // Afficher le composant Ads seulement s'il y a des données
  return <Ads />;
}
