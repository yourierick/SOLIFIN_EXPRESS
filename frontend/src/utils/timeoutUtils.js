// Utilitaires pour les timeouts et intervals sécurisés
// Évite l'utilisation de chaînes de caractères dans setTimeout/setInterval

/**
 * Crée un timeout sécurisé avec une fonction fléchée
 * @param {Function} callback - La fonction à exécuter
 * @param {number} delay - Le délai en millisecondes
 * @returns {number} - L'ID du timeout
 */
export const createTimeout = (callback, delay) => {
  return setTimeout(callback, delay);
};

/**
 * Crée un interval sécurisé avec une fonction fléchée
 * @param {Function} callback - La fonction à exécuter
 * @param {number} interval - L'intervalle en millisecondes
 * @returns {number} - L'ID de l'intervalle
 */
export const createInterval = (callback, interval) => {
  return setInterval(callback, interval);
};

/**
 * Efface un timeout de manière sécurisée
 * @param {number} timeoutId - L'ID du timeout à effacer
 */
export const clearTimer = (timeoutId) => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
};

/**
 * Efface un interval de manière sécurisée
 * @param {number} intervalId - L'ID de l'intervalle à effacer
 */
export const clearInterval = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

/**
 * Crée un debounce sécurisé
 * @param {Function} func - La fonction à debouncer
 * @param {number} wait - Le délai d'attente
 * @returns {Function} - La fonction debouncée
 */
export const createDebounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = createTimeout(later, wait);
  };
};
