import React from 'react';

/**
 * Composant réutilisable pour les types d'opérations de transactions utilisateur.
 * Permet de filtrer les transactions par type avec une liste prédéfinie d'opérations utilisateur.
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.value - La valeur sélectionnée
 * @param {function} props.onChange - Fonction appelée lors du changement
 * @param {boolean} props.isDarkMode - Mode sombre/clair
 * @param {string} props.className - Classes CSS supplémentaires (optionnel)
 */
const FiltreParTypeOperationUser = ({ 
  value, 
  onChange, 
  isDarkMode, 
  className = "" 
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-md ${
        isDarkMode
          ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
          : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
      } transition-all duration-200 ${className}`}
    >
      <option value="all">Tous les types</option>
      <option value="funds_receipt">Réception de fonds</option>
      <option value="freeze_funds">Gel des fonds</option>
      <option value="unfreeze_funds">Déblocage des fonds</option>
      <option value="funds_transfer">Transfert des fonds</option>
      <option value="funds_withdrawal">Retrait des fonds</option>
      <option value="pack_purchase">Achat d'abonnement au pack</option>
      <option value="virtual_purchase">Achat de virtuels</option>
      <option value="virtual_receipt">Réception de virtuels</option>
      <option value="boost_purchase">Achat de boost de publication</option>
      <option value="digital_product_purchase">Achat de produit digital</option>
      <option value="digital_product_sale">Vente de produit digital</option>
      <option value="sponsorship_commission">Commission de parrainage</option>
      <option value="withdrawal_commission">Commission sur retrait des fonds</option>
      <option value="transfer_commission">Commission sur transfert des fonds</option>
    </select>
  );
};

export default FiltreParTypeOperationUser;
