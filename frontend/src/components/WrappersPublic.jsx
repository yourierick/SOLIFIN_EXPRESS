import { useState, useEffect } from "react";
import DisplayPublic from "./DisplayPublic";
import publicAxios from "../utils/publicAxios";

export default function PublicationsWrapper() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Vérifier s'il y a des publicités approuvées
    const checkPublications = async () => {
      try {
        const response = await publicAxios.get("/api/publications/approved");
        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted) {
          const xpublications = response.data.publications || [];
          setPublications(xpublications);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des publicités", error);
        
        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted) {
          setPublications([]);
          setError("Erreur lors du chargement des publicités");
          setLoading(false);
        }
      }
    };

    checkPublications();

    // Cleanup function pour éviter les fuites de mémoire
    return () => {
      isMounted = false;
    };
  }, []);

  // Afficher toujours le composant PublicationsDisplay avec les données
  return <DisplayPublic publications={publications} loading={loading} error={error} />;
}
