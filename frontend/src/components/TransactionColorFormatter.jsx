/**
 * TransactionColorFormatter.jsx
 * Composant utilitaire pour formater les couleurs des transactions selon leur type
 */

/**
 * Obtenir la couleur pour un type de transaction
 * @param {string} transactionType - Le type de transaction
 * @param {boolean} isDarkMode - Mode sombre ou clair
 * @returns {string} La couleur hexadécimale
 */
export const getTransactionColor = (transactionType, isDarkMode = false) => {
  const colors = {
    // Transactions de retrait
    "funds_withdrawal": isDarkMode ? "#4b5563" : "#e5e7eb",
    "withdrawal_commission": isDarkMode ? "#1e40af" : "#dbeafe",
    "freeze_funds": isDarkMode ? "#1e40af" : "#dbeafe",
    "solifin_funds_withdrawal": isDarkMode ? "#de893aff" : "#fff5d1",
    
    // Commissions
    "sponsorship_commission": isDarkMode ? "#9f1239" : "#fee2e2",
    "transfer_commission": isDarkMode ? "#9f1239" : "#fee2e2",
    "sale_commission": isDarkMode ? "#059669" : "#dcfce7",
    
    // Ventes de packs
    "pack_sale": isDarkMode ? "#92400e" : "#fef3c7",
    "pack_purchase": isDarkMode ? "#064e3b" : "#d1fae5",
    
    // Ventes de produits et services
    "boost_sale": isDarkMode ? "#064e3b" : "#d1fae5",
    "digital_product_sale": isDarkMode ? "#064e3b" : "#d1fae5",
    "virtual_sale": isDarkMode ? "#064e3b" : "#d1fae5",
    
    // Achats
    "digital_product_purchase": isDarkMode ? "#064e3b" : "#d1fae5",
    "virtual_purchase": isDarkMode ? "#064e3b" : "#d1fae5",
    "boost_purchase": isDarkMode ? "#064e3b" : "#d1fae5",
    
    // Transferts
    "funds_transfer": isDarkMode ? "#064e3b" : "#d1fae5",
    "funds_receipt": isDarkMode ? "#10b981" : "#34d399",
    "unfreeze_funds": isDarkMode ? "#10b981" : "#34d399",
    
    // Transactions spéciales
    "esengo_funds_transfer": isDarkMode ? "#7c3aed" : "#ddd6fe",
    "withdrawal_reverse": isDarkMode ? "#1f880cff" : "#d1ffdaff",
    
    // Valeur par défaut
    "default": isDarkMode ? "#1f2937" : "#f3f4f6"
  };
  
  return colors[transactionType] || colors.default;
};

/**
 * Obtenir la couleur de fond pour un type de transaction
 * @param {string} transactionType - Le type de transaction
 * @param {boolean} isDarkMode - Mode sombre ou clair
 * @returns {string} La couleur de fond (plus claire)
 */
export const getTransactionBackgroundColor = (transactionType, isDarkMode = false) => {
  const color = getTransactionColor(transactionType, isDarkMode);
  // Retourner une version plus claire de la couleur pour le fond
  return isDarkMode ? `${color}20` : `${color}10`;
};

/**
 * Obtenir la couleur de texte pour un type de transaction
 * @param {string} transactionType - Le type de transaction
 * @param {boolean} isDarkMode - Mode sombre ou clair
 * @returns {string} La couleur de texte (contraste élevé)
 */
export const getTransactionTextColor = (transactionType, isDarkMode = false) => {
  const color = getTransactionColor(transactionType, isDarkMode);
  // Retourner blanc ou noir selon le fond pour un bon contraste
  return isDarkMode ? "#ffffff" : "#000000";
};

export default {
  getTransactionColor,
  getTransactionBackgroundColor,
  getTransactionTextColor
};
