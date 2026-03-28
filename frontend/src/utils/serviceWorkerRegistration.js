/**
 * Service Worker Registration - Version optimisée
 * Gère l'enregistrement et les mises à jour du service worker de manière non-intrusive
 */

// Configuration
const CONFIG = {
  UPDATE_CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes
  NOTIFICATION_DELAY: 5000, // 5 secondes avant notification
  MAX_RETRY_ATTEMPTS: 3
};

// État global
let updateCheckTimer = null;
let retryCount = 0;
let pendingUpdate = false;

// Vérifier si le service worker est supporté
const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Wrapper pour les fonctions nécessitant le support du service worker
const withSupport = (fn) => (...args) => 
  isServiceWorkerSupported ? fn(...args) : Promise.resolve(null);

/**
 * Enregistrer le service worker de manière optimisée
 */
export const register = withSupport(() => {
  return navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      
      // Configurer la détection de mises à jour de manière passive
      setupUpdateDetection(registration);
      
      // Démarrer la vérification périodique
      startPeriodicUpdateCheck(registration);
      
      return registration;
    })
    .catch(error => {
      console.warn('⚠️ Erreur d\'enregistrement du Service Worker:', error);
      return null;
    });
});

/**
 * Configurer la détection de mises à jour de manière non-intrusive
 */
const setupUpdateDetection = (registration) => {
  registration.onupdatefound = () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;
    
    installingWorker.onstatechange = () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Nouvelle version disponible - notification différée
        pendingUpdate = true;
        scheduleUpdateNotification();
      }
    };
  };
};

/**
 * Planifier une notification de mise à jour non-intrusive
 */
const scheduleUpdateNotification = () => {
  // Attendre que l'utilisateur soit inactif ou après un délai
  setTimeout(() => {
    if (!pendingUpdate) return;
    
    // Ne pas notifier si l'utilisateur est actif sur la page
    if (document.visibilityState === 'visible' && isUserActive()) {
      // Retarder encore plus
      setTimeout(scheduleUpdateNotification, CONFIG.NOTIFICATION_DELAY);
      return;
    }
    
    notifyUserUpdate();
  }, CONFIG.NOTIFICATION_DELAY);
};

/**
 * Vérifier si l'utilisateur est actif
 */
const isUserActive = () => {
  const lastActivity = localStorage.getItem('lastUserActivity');
  if (!lastActivity) return true;
  
  const timeSinceActivity = Date.now() - parseInt(lastActivity);
  return timeSinceActivity < 30000; // Actif depuis moins de 30 secondes
};

/**
 * Démarrer la vérification périodique des mises à jour
 */
const startPeriodicUpdateCheck = (registration) => {
  // Nettoyer le timer existant
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
  }
  
  updateCheckTimer = setInterval(() => {
    if (document.visibilityState === 'hidden') return; // Ne pas vérifier si page cachée
    
    checkForUpdates(registration);
  }, CONFIG.UPDATE_CHECK_INTERVAL);
};

/**
 * Vérifier les mises à jour du service worker
 */
export const checkForUpdates = withSupport((registration = null) => {
  const targetReg = registration || navigator.serviceWorker.ready;
  
  return targetReg.then(reg => reg.update())
    .then(() => {
      retryCount = 0; // Réinitialiser le compteur de retry
      return true;
    })
    .catch(error => {
      console.warn('⚠️ Erreur de vérification de mise à jour:', error);
      
      // Retry logic
      if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
        retryCount++;
        setTimeout(() => checkForUpdates(registration), 5000 * retryCount);
      }
      
      return false;
    });
});

/**
 * Appliquer la mise à jour du service worker avec confirmation
 */
export const applyUpdate = withSupport(() => {
  return navigator.serviceWorker.ready
    .then(registration => {
      if (!registration.waiting) {
        console.warn('⚠️ Aucune mise à jour en attente');
        return false;
      }
      
      // Demander confirmation à l'utilisateur (optionnel)
      if (window.confirm('Une nouvelle version est disponible. Voulez-vous appliquer la mise à jour maintenant?')) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        pendingUpdate = false;
        console.log('✅ Mise à jour appliquée');
        return true;
      }
      
      return false;
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'application de la mise à jour:', error);
      return false;
    });
});

/**
 * Désinscrire le service worker
 */
export const unregister = withSupport(() => {
  return navigator.serviceWorker.ready
    .then(registration => registration.unregister())
    .then(success => {
      if (success) {
        console.log('✅ Service Worker désinscrit');
        cleanup();
      }
      return success;
    })
    .catch(error => {
      console.error('❌ Erreur de désinscription:', error);
      return false;
    });
});

/**
 * Nettoyer le cache du service worker de manière sélective
 */
export const cleanCache = withSupport((options = {}) => {
  const { aggressive = false, olderThan = 7 * 24 * 60 * 60 * 1000 } = options; // 7 jours par défaut
  
  return navigator.serviceWorker.ready
    .then(registration => {
      registration.active.postMessage({
        type: 'CLEAN_CACHE',
        options: { aggressive, olderThan }
      });
      console.log('🧹 Nettoyage du cache initié');
      return true;
    })
    .catch(error => {
      console.error('❌ Erreur de nettoyage du cache:', error);
      return false;
    });
});

/**
 * Notifier l'utilisateur qu'une mise à jour est disponible (version améliorée)
 */
const notifyUserUpdate = () => {
  // Éviter les notifications multiples
  if (localStorage.getItem('updateNotified') === 'true') return;
  
  localStorage.setItem('updateNotified', 'true');
  
  // Événement custom pour l'application
  const event = new CustomEvent('serviceWorkerUpdate', {
    detail: {
      hasUpdate: true,
      timestamp: Date.now(),
      version: 'latest'
    }
  });
  
  window.dispatchEvent(event);
  
  // Notification console plus discrète
  console.log('🔄 Nouvelle version disponible - utilisez applyUpdate() pour l\'installer');
  
  // Nettoyer le flag après 10 minutes
  setTimeout(() => {
    localStorage.removeItem('updateNotified');
  }, 10 * 60 * 1000);
};

/**
 * Suivre l'activité de l'utilisateur pour les notifications intelligentes
 */
export const trackUserActivity = () => {
  const updateActivity = () => {
    localStorage.setItem('lastUserActivity', Date.now().toString());
  };
  
  // Écouter les événements d'activité
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
  
  return () => {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  };
};

/**
 * Nettoyer les ressources et timers
 */
const cleanup = () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
  pendingUpdate = false;
  retryCount = 0;
};

/**
 * Obtenir le statut actuel du service worker
 */
export const getStatus = withSupport(() => {
  return navigator.serviceWorker.ready
    .then(registration => ({
      isRegistered: !!registration,
      hasUpdate: !!registration.waiting,
      isActive: !!registration.active,
      pendingUpdate
    }))
    .catch(() => ({
      isRegistered: false,
      hasUpdate: false,
      isActive: false,
      pendingUpdate: false
    }));
});

// Export par défaut optimisé
export default {
  register,
  unregister,
  cleanCache,
  checkForUpdates,
  applyUpdate,
  getStatus,
  trackUserActivity,
  cleanup,
  isSupported: isServiceWorkerSupported,
  CONFIG
};
