import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * ReferralHandler - Composant pour gérer les codes de parrainage
 * 
 * Ce composant détecte automatiquement les codes de parrainage dans les paramètres d'URL
 * et les enregistre dans le localStorage pour utilisation ultérieure.
 */
const ReferralHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const referralCode = searchParams.get('referral_code');
    
    if (referralCode) {
      // Enregistrer le code de parrainage dans localStorage
      localStorage.setItem('referral_code', referralCode);
      
      // Optionnel: nettoyer l'URL pour enlever le paramètre
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      console.log('Code de parrainage détecté et enregistré:', referralCode);
    }
  }, [searchParams, navigate]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default ReferralHandler;
