import React from 'react';

/**
 * Composant réutilisable pour formater les types d'opérations
 * @param {string} operation - Le type d'opération à formater
 * @returns {string} - Le libellé formaté de l'opération
 */
export const getOperationType = (operation) => {
  if (!operation) {
    return 'Non défini';
  }
  
  switch (operation.toLowerCase()) {
    // Types de wallet_system_transactions
    case "pack_sale":
      return "Vente de pack";
    case "solifin_funds_withdrawal":
      return "Retrait SOLIFIN";
    case "boost_sale":
      return "Vente de boost de publication";
    case "virtual_sale":
      return "Vente de virtuels";
    case "virtual_send":
      return "Envoi de virtuels";
    case "withdrawal_commission":
      return "Commission sur retrait des fonds";
    case "transfer_commission":
      return "Commission sur transfert des fonds";
    case "sale_commission":
      return "Commission sur la vente";
    case "funds_withdrawal":
      return "Retrait des fonds";
    case "esengo_funds_transfer":
      return "Paiement des fonds esengo";
    case "balance_adjustment":
      return "Ajustement de solde";
    case "sponsorship_commission":
      return "Commission de parrainage";
    case "funds_receipt":
      return "Réception de fonds";
    case "freeze_funds":
      return "Gel des fonds";
    case "unfreeze_funds":
      return "Déblocage des fonds";
    case "funds_transfer":
      return "Transfert des fonds";
    case "pack_purchase":
      return "Achat d'abonnement au pack";
    case "virtual_purchase":
      return "Achat de virtuels";
    case "virtual_receipt":
      return "Réception de virtuels";
    case "boost_purchase":
      return "Achat de boost de publication";
    case "digital_product_purchase":
      return "Achat de produit digital";
    case "digital_product_sale":
      return "Vente de produit digital";
    case "withdrawal_reverse":
      return "Annulation de retrait";
    
    default:
      return operation;
  }
};

/**
 * Composant pour afficher le type d'opération formaté
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.operation - Le type d'opération à afficher
 * @param {string} props.className - Classes CSS supplémentaires (optionnel)
 */
const OperationTypeFormatter = ({ operation, className = "" }) => {
  return (
    <span className={className}>
      {getOperationType(operation)}
    </span>
  );
};

export default OperationTypeFormatter;
