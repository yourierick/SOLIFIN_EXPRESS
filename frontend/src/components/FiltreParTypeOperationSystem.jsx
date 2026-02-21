import React from 'react';

/**
 * Composant réutilisable pour les types d'opérations de transactions systèmes.
 * Permet de filtrer les transactions par type avec une liste prédéfinie d'opérations système.
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.value - La valeur sélectionnée
 * @param {function} props.onChange - Fonction appelée lors du changement
 * @param {boolean} props.isDarkMode - Mode sombre/clair
 * @param {string} props.className - Classes CSS supplémentaires (optionnel)
 */
const FiltreParTypeOperationSystem = ({ 
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
      <option value="pack_sale">Vente de pack</option>
      <option value="boost_sale">Vente de boost de publication</option>
      <option value="virtual_sale">Vente de virtuels</option>
      <option value="virtual_send">Envoi de virtuels</option>
      <option value="withdrawal_commission">Commission sur retrait des fonds</option>
      <option value="transfer_commission">Commission sur transfert des fonds</option>
      <option value="sale_commission">Commission sur la vente</option>
      <option value="funds_withdrawal">Retrait des fonds</option>
      <option value="esengo_funds_transfer">Paiement des fonds esengo</option>
      <option value="balance_adjustment">Ajustement de solde</option>
      <option value="sponsorship_commission">Commission de parrainage</option>
      <option value="solifin_funds_withdrawal">Retrait SOLIFIN</option>
    </select>
  );
};

export default FiltreParTypeOperationSystem;
