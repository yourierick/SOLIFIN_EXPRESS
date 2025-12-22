import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AdBlockDetector() {
  const [hasAdBlock, setHasAdBlock] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkAdBlock = () => {
      // Créer une div "bait" que AdBlock va cibler
      const bait = document.createElement('div');
      bait.innerHTML = '&nbsp;';
      bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad';
      bait.style.cssText = 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;';
      
      document.body.appendChild(bait);
      
      // Vérifier si la div a été bloquée
      setTimeout(() => {
        if (bait.offsetHeight === 0) {
          setHasAdBlock(true);
        }
        document.body.removeChild(bait);
      }, 100);
    };

    // Vérifier également certains éléments communs bloqués
    const checkBlockedElements = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = 'test';
      testAd.className = 'adsbox';
      testAd.style.cssText = 'position: absolute; top: -10px; left: -10px;';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        if (testAd.offsetHeight === 0) {
          setHasAdBlock(true);
        }
        document.body.removeChild(testAd);
      }, 100);
    };

    // Vérifier si des scripts publicitaires sont bloqués
    const checkBlockedScripts = () => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.onload = () => setHasAdBlock(false);
      script.onerror = () => setHasAdBlock(true);
      document.head.appendChild(script);
      
      setTimeout(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }, 1000);
    };

    // Exécuter toutes les détections
    checkAdBlock();
    checkBlockedElements();
    checkBlockedScripts();
  }, []);

  if (!hasAdBlock || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1.5 sm:p-2 rounded-md text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors mr-2 sm:mr-3"
            aria-label="Fermer l'alerte"
          >
            <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <div className="flex items-center flex-1 min-w-0">
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 leading-tight">
                <span className="font-medium block sm:inline">AdBlock détecté!</span>
                <span className="hidden sm:inline ml-1">Pour une meilleure expérience, veuillez désactiver AdBlock ou ajouter notre site à votre liste blanche.</span>
                <span className="sm:hidden ml-1">Désactivez AdBlock pour une meilleure expérience.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
