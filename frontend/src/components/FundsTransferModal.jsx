import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FaExchangeAlt,
  FaUser,
  FaDollarSign,
  FaFileAlt,
  FaPercent,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

const FundsTransferModal = ({
  isOpen,
  onClose,
  onSuccess,
  available_balance,
  userInfo,
  isAdmin = false,
}) => {
  const { isDarkMode } = useTheme();

  const [walletData, setWalletData] = useState({
    available_balance: parseFloat(available_balance) || 0,
  });
  const [transferData, setTransferData] = useState({
    recipient_account_id: "",
    amount: "",
    original_amount: "",
    fee_amount: 0,
    fee_percentage: 0,
    commission_amount: 0,
    commission_percentage: 0,
    total_fee_amount: 0,
    note: "",
    password: "",
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferFeePercentage, setTransferFeePercentage] = useState(0);
  const [transferCommissionPercentage, setTransferCommissionPercentage] =
    useState(0);
  const [transferFeeAmount, setTransferFeeAmount] = useState(0);
  const [transferCommissionAmount, setTransferCommissionAmount] = useState(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);
  const [showConfirmTransferModal, setShowConfirmTransferModal] =
    useState(false);
  const [recipientInfo, setRecipientInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [isMultipleTransfer, setIsMultipleTransfer] = useState(false);
  const [multipleRecipients, setMultipleRecipients] = useState([
    { recipient_account_id: "", amount: "", name: "", fee_amount: 0, commission_amount: 0, total_fee: 0 }
  ]);

  // Mettre à jour walletData si les props changent
  useEffect(() => {
    setWalletData({
      available_balance: parseFloat(available_balance) || 0,
    });
  }, [available_balance]);

  // Récupérer les frais de transfert à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      fetchTransferFees();
      resetForm();
    }
  }, [isOpen]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setTransferData({
      recipient_account_id: "",
      amount: "",
      original_amount: "",
      fee_amount: 0,
      fee_percentage: 0,
      commission_amount: 0,
      commission_percentage: 0,
      total_fee_amount: 0,
      note: "",
      password: "",
    });
    setErrors({});
    setTransferFeeAmount(0);
    setTransferCommissionAmount(0);
    setTotalFeeAmount(0);
    setIsMultipleTransfer(false);
    setMultipleRecipients([
      { recipient_account_id: "", amount: "", name: "", fee_amount: 0, commission_amount: 0, total_fee: 0 }
    ]);
  };

  // Fonction pour récupérer les frais de transfert
  const fetchTransferFees = async () => {
    try {
      const response = await axios.get(`/api/getTransferFees`);

      if (response.data.success) {
        setTransferFeePercentage(response.data.fee_percentage);
        setTransferCommissionPercentage(response.data.fee_commission);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de transfert:",
        error
      );
      toast.error("Impossible de récupérer les frais de transfert");
    }
  };

  // Effet pour calculer les frais de transfert lorsque le montant change
  useEffect(() => {
    if (transferData.amount) {
      const amount = parseFloat(transferData.amount);
      if (!isNaN(amount)) {
        // Calculer les frais de transfert
        const fee =
          transferFeePercentage > 0
            ? (amount * transferFeePercentage) / 100
            : 0;
        setTransferFeeAmount(fee);

        // Calculer les frais de commission
        const commission =
          transferCommissionPercentage > 0
            ? (amount * transferCommissionPercentage) / 100
            : 0;
        setTransferCommissionAmount(commission);

        // Calculer le total des frais
        setTotalFeeAmount(fee + commission);
      } else {
        setTransferFeeAmount(0);
        setTransferCommissionAmount(0);
        setTotalFeeAmount(0);
      }
    } else {
      setTransferFeeAmount(0);
      setTransferCommissionAmount(0);
      setTotalFeeAmount(0);
    }
  }, [
    transferData.amount,
    transferFeePercentage,
    transferCommissionPercentage,
  ]);

  // Gestion des changements dans le formulaire
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur lorsque l'utilisateur commence à corriger
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Gestion des changements pour les transferts multiples
  const handleMultipleRecipientChange = (index, field, value) => {
    const updatedRecipients = [...multipleRecipients];
    updatedRecipients[index][field] = value;
    
    // Calculer les frais pour ce destinataire si le montant change
    if (field === 'amount' && value && !isNaN(parseFloat(value))) {
      const amount = parseFloat(value);
      const fee = transferFeePercentage > 0 ? (amount * transferFeePercentage) / 100 : 0;
      const commission = transferCommissionPercentage > 0 ? (amount * transferCommissionPercentage) / 100 : 0;
      const totalFee = fee + commission;
      
      updatedRecipients[index].fee_amount = fee;
      updatedRecipients[index].commission_amount = commission;
      updatedRecipients[index].total_fee = totalFee;
    } else if (field === 'amount' && (!value || isNaN(parseFloat(value)))) {
      updatedRecipients[index].fee_amount = 0;
      updatedRecipients[index].commission_amount = 0;
      updatedRecipients[index].total_fee = 0;
    }
    
    // Si c'est un account_id et qu'il n'y a pas encore de nom, récupérer le nom
    if (field === 'recipient_account_id' && value && !updatedRecipients[index].name) {
      // Ajouter un petit délai pour éviter trop de requêtes pendant la saisie
      setTimeout(() => {
        fetchSingleRecipientName(index, value);
      }, 500);
    }
    
    setMultipleRecipients(updatedRecipients);
  };

  // Récupérer le nom d'un seul destinataire (pour l'auto-complétion)
  const fetchSingleRecipientName = async (index, accountId) => {
    try {
      const response = await axios.post('/api/recipients-info', {
        account_ids: [accountId]
      });

      if (response.data.success && response.data.recipients[accountId]?.success) {
        const updatedRecipients = [...multipleRecipients];
        updatedRecipients[index].name = response.data.recipients[accountId].user?.name || '';
        setMultipleRecipients(updatedRecipients);
      }
    } catch (error) {
      // Silencieux pour ne pas perturber l'utilisateur pendant la saisie
    }
  };

  // Ajouter un destinataire
  const addRecipient = () => {
    setMultipleRecipients([...multipleRecipients, 
      { recipient_account_id: "", amount: "", name: "", fee_amount: 0, commission_amount: 0, total_fee: 0 }
    ]);
  };

  // Supprimer un destinataire
  const removeRecipient = (index) => {
    if (multipleRecipients.length > 1) {
      const updatedRecipients = multipleRecipients.filter((_, i) => i !== index);
      setMultipleRecipients(updatedRecipients);
    }
  };

  // Calculer le total pour les transferts multiples
  const calculateMultipleTransferTotal = () => {
    return multipleRecipients.reduce((total, recipient) => {
      const amount = parseFloat(recipient.amount) || 0;
      const totalFee = parseFloat(recipient.total_fee) || 0;
      return total + amount + totalFee;
    }, 0);
  };

  // Calculer le montant total transféré (sans frais)
  const calculateTotalAmountTransferred = () => {
    return multipleRecipients.reduce((total, recipient) => {
      return total + (parseFloat(recipient.amount) || 0);
    }, 0);
  };

  // Calculer le total des frais
  const calculateTotalFees = () => {
    return multipleRecipients.reduce((total, recipient) => {
      return total + (parseFloat(recipient.total_fee) || 0);
    }, 0);
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (isMultipleTransfer) {
      // Validation pour transfert multiple
      multipleRecipients.forEach((recipient, index) => {
        if (!recipient.recipient_account_id) {
          newErrors[`recipient_account_id_${index}`] = "L'identifiant du compte destinataire est requis";
        }
        
        if (!recipient.amount || isNaN(recipient.amount) || parseFloat(recipient.amount) <= 0) {
          newErrors[`amount_${index}`] = "Veuillez entrer un montant valide";
        }
        
        // Vérifier si l'utilisateur essaie de se transférer des fonds à lui-même
        if (recipient.recipient_account_id === userInfo?.account_id) {
          newErrors[`recipient_account_id_${index}`] = "Vous ne pouvez pas vous transférer des fonds";
        }
      });

      // Vérifier si le portefeuille a suffisamment de fonds pour le total
      const totalAmount = calculateMultipleTransferTotal();
      const availableBalance = walletData?.available_balance;
      
      if (totalAmount > availableBalance) {
        newErrors.total = `Solde insuffisant dans votre portefeuille pour couvrir tous les transferts et frais`;
      }
    } else {
      // Validation pour transfert simple (existante)
      if (
        !transferData.amount ||
        isNaN(transferData.amount) ||
        parseFloat(transferData.amount) <= 0
      ) {
        newErrors.amount = "Veuillez entrer un montant valide";
      }

      if (!transferData.recipient_account_id) {
        newErrors.recipient_account_id =
          "L'identifiant du compte destinataire est requis";
      }

      if (transferData.recipient_account_id === userInfo?.account_id) {
        newErrors.recipient_account_id =
          "Vous ne pouvez pas vous transférer des fonds";
      }

      const transferAmount = parseFloat(transferData.amount);
      if (!isNaN(transferAmount)) {
        const totalAmount = transferAmount + totalFeeAmount;
        const availableBalance = walletData?.available_balance;

        if (totalAmount > availableBalance) {
          newErrors.amount = `Montant insuffisant dans votre portefeuille pour couvrir le transfert et les frais`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Récupérer les informations du destinataire (pour les utilisateurs non-admin)
  const fetchRecipientInfo = async () => {
    if (!validateForm()) return;

    if (isMultipleTransfer) {
      // Pour les transferts multiples, récupérer les infos de chaque destinataire
      await fetchMultipleRecipientsInfo();
      setShowConfirmTransferModal(true);
      return;
    }

    setTransferLoading(true);

    try {
      // Utiliser la même URL que celle utilisée dans Wallet.jsx
      const response = await axios.get(
        `/api/recipient-info/${transferData.recipient_account_id}`
      );

      if (response.data.success) {
        setRecipientInfo(response.data.recipient || response.data.user);
        setShowConfirmTransferModal(true);
      } else {
        toast.error(response.data.message || "Destinataire introuvable");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des informations du destinataire"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // Récupérer les informations de plusieurs destinataires
  const fetchMultipleRecipientsInfo = async () => {
    setTransferLoading(true);
    
    try {
      const updatedRecipients = [...multipleRecipients];
      
      // Extraire les account_ids des destinataires qui n'ont pas de nom
      const accountIdsToFetch = multipleRecipients
        .filter(r => r.recipient_account_id && !r.name)
        .map(r => r.recipient_account_id);

      if (accountIdsToFetch.length === 0) {
        // Tous les noms sont déjà récupérés
        setTransferLoading(false);
        return;
      }

      // Appel unique pour tous les destinataires
      const response = await axios.post('/api/recipients-info', {
        account_ids: accountIdsToFetch
      });

      if (response.data.success) {
        // Mettre à jour les destinataires avec les informations récupérées
        multipleRecipients.forEach((recipient, index) => {
          if (recipient.recipient_account_id && !recipient.name) {
            const recipientInfo = response.data.recipients[recipient.recipient_account_id];
            if (recipientInfo && recipientInfo.success) {
              updatedRecipients[index].name = recipientInfo.user?.name || '';
            }
          }
        });
        
        setMultipleRecipients(updatedRecipients);
      } else {
        toast.error("Erreur lors de la récupération des informations des destinataires");
      }
      
    } catch (error) {
      toast.error(
        "Erreur lors de la récupération des informations des destinataires"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Afficher le modal de confirmation avec les informations du destinataire
    fetchRecipientInfo();
  };

  // Effectuer le transfert de fonds
  const handleTransferFunds = async () => {
    if (!transferData.password) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }

    setTransferLoading(true);
    try {
      let apiData;

      if (isMultipleTransfer) {
        // Préparer les données pour le transfert multiple
        const validRecipients = multipleRecipients.filter(r => r.recipient_account_id && r.amount && parseFloat(r.amount) > 0);
        
        apiData = {
          is_multiple: true,
          recipients: validRecipients.map(r => ({
            recipient_account_id: r.recipient_account_id,
            amount: parseFloat(r.amount).toFixed(2),
            frais_de_transaction: r.fee_amount.toFixed(2),
            frais_de_commission: r.commission_amount.toFixed(2),
          })),
          note: transferData.note || "",
          password: transferData.password,
          total_amount: calculateTotalAmountTransferred().toFixed(2),
          total_fees: calculateTotalFees().toFixed(2),
        };
      } else {
        // Préparer les données pour le transfert simple (existante)
        const amount = parseFloat(transferData.amount);
        const totalAmount = amount + totalFeeAmount;

        apiData = {
          is_multiple: false,
          amount: amount.toFixed(2),
          frais_de_transaction: transferFeeAmount.toFixed(2),
          frais_de_commission: transferCommissionAmount.toFixed(2),
          recipient_account_id: transferData.recipient_account_id,
          note: transferData.note || "",
          password: transferData.password,
        };
      }

      const response = await axios.post("/api/funds-transfer", apiData);

      if (response.data.success) {
        toast.success("Transfert effectué avec succès");
        setShowConfirmTransferModal(false);
        resetForm();
        
        // Retarder la fermeture pour laisser le temps au toast de s'afficher
        setTimeout(() => {
          
        }, 5000); // 5 seconde de délai
      } else {
        toast.error(response.data.message || "Erreur lors du transfert");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors du transfert de fonds"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // Fermer le modal de confirmation et revenir au modal de transfert
  const handleBackToTransfer = () => {
    setShowConfirmTransferModal(false);
  };

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <AnimatePresence>
        {showConfirmTransferModal ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col border ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-full ${
                    isDarkMode
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <FaExchangeAlt className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Confirmer le transfert
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Vérifiez les détails avant envoi
                  </p>
                </div>
              </div>
              <button
                onClick={handleBackToTransfer}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div
                className={`mb-6 p-6 rounded-xl border ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
              {isMultipleTransfer ? (
                // Affichage pour transfert multiple
                <div>
                  <div className="flex items-center mb-4">
                    <div
                      className={`p-2 rounded-full mr-3 ${
                        isDarkMode
                          ? "bg-gray-600 text-gray-300"
                          : "bg-white text-blue-600 shadow-sm"
                      }`}
                    >
                      <FaUser className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Destinataires
                      </p>
                      <p
                        className={`font-bold text-lg ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {multipleRecipients.filter(r => r.amount && parseFloat(r.amount) > 0).length} destinataires
                      </p>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                    {multipleRecipients
                      .filter(r => r.amount && parseFloat(r.amount) > 0)
                      .map((recipient, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg text-sm ${
                            isDarkMode ? "bg-gray-600/30" : "bg-white/50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {recipient.name ? `${recipient.name} (ID: ${recipient.recipient_account_id})` : `ID: ${recipient.recipient_account_id}`}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Montant: {parseFloat(recipient.amount).toFixed(2)} $
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {(parseFloat(recipient.amount) + parseFloat(recipient.total_fee)).toFixed(2)} $
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Frais: {parseFloat(recipient.total_fee).toFixed(2)} $
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                // Affichage pour transfert simple (existante)
                <div className="flex items-center mb-6">
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      isDarkMode
                        ? "bg-gray-600 text-gray-300"
                        : "bg-white text-blue-600 shadow-sm"
                    }`}
                  >
                    <FaUser className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Destinataire
                    </p>
                    <p
                      className={`font-bold text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {recipientInfo?.name ||
                        `ID: ${transferData.recipient_account_id}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center mb-6">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    isDarkMode
                      ? "bg-green-600/20 text-green-400"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  <FaDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Montant à transférer
                  </p>
                  <p
                    className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {isMultipleTransfer 
                      ? calculateTotalAmountTransferred().toFixed(2)
                      : parseFloat(transferData.amount).toFixed(2)
                    }{" "}
                    <span
                      className={`text-lg text-blue-500`}
                    >
                      $ 
                    </span>
                  </p>
                </div>
              </div>

              {(isMultipleTransfer ? calculateTotalFees() > 0 : totalFeeAmount > 0) && (
                <div className="flex items-center mb-6">
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      isDarkMode
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    <FaPercent className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Frais totaux
                    </p>
                    <p
                      className={`font-medium text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span className="text-yellow-500">
                        {isMultipleTransfer 
                          ? calculateTotalFees().toFixed(2)
                          : totalFeeAmount.toFixed(2)
                        }{" "}
                        $
                      </span>{" "}
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        (
                        {(
                          transferFeePercentage + transferCommissionPercentage
                        ).toFixed(2)}
                        %)
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center pt-4 border-t border-gray-600 dark:border-gray-600">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    isDarkMode
                      ? "bg-red-600/20 text-red-400"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <FaDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Montant total à débiter
                  </p>
                  <p
                    className={`font-bold text-xl ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {isMultipleTransfer 
                      ? calculateMultipleTransferTotal().toFixed(2)
                      : (parseFloat(transferData.amount) + totalFeeAmount).toFixed(2)
                    }{" "}
                    <span className="text-red-500">
                      $
                    </span>
                  </p>
                </div>
              </div>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-1 rounded mr-2 ${
                      isDarkMode
                        ? "bg-red-600/20 text-red-400"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <FaLock className="w-4 h-4" />
                  </div>
                  Mot de passe de confirmation
                </div>
              </label>
              <input
                type="password"
                name="password"
                value={transferData.password}
                onChange={handleTransferChange}
                placeholder="Entrez votre mot de passe pour confirmer"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                } focus:outline-none`}
              />
              {errors.password && (
                <div className="mt-2 flex items-center text-sm text-red-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBackToTransfer}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-md hover:shadow-lg"
                }`}
              >
                <div className="flex items-center">
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </div>
              </button>
              <button
                onClick={handleTransferFunds}
                disabled={transferLoading}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                } ${
                  transferLoading
                    ? "opacity-70 cursor-not-allowed transform-none"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  {transferLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt className="w-4 h-4 mr-2" />
                      Confirmer le transfert
                    </>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-full ${
                    isDarkMode
                      ? "bg-green-900/50 text-green-400"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  <FaExchangeAlt className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Transfert de fonds
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Envoyer de l'argent à un autre utilisateur
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Sélection du type de transfert */}
              <div className="mb-6">
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Type de transfert
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMultipleTransfer(false)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      !isMultipleTransfer
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <FaUser className="w-4 h-4 mr-2" />
                      <span className="font-medium">Transfert simple</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultipleTransfer(true)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      isMultipleTransfer
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <FaExchangeAlt className="w-4 h-4 mr-2" />
                      <span className="font-medium">Transfert multiple</span>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Affichage automatique de la devise selon le contexte global */}
                <div className="mb-6">
                  <label
                    className={`block text-sm font-medium mb-3 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Compte à débiter
                  </label>
                  <div className="grid gap-4 grid-cols-1">
                    {/* Portefeuille automatiquement sélectionné */}
                    <div
                      className={`p-5 rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-xl`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg bg-blue-500 text-white`}
                        >
                          <span className="text-lg font-bold">
                            $
                          </span>
                        </div>
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold mb-1 text-blue-700 dark:text-blue-300`}
                      >
                        Fonds disponibles dans votre portefeuille
                      </p>
                      <p
                        className={`text-xs mb-2 text-blue-600 dark:text-blue-400`}
                      >
                        Solde disponible
                      </p>
                      <p
                        className={`text-xl font-bold text-blue-700 dark:text-blue-300`}
                      >
                        {console.log(walletData)}
                        {walletData?.available_balance?.toFixed(2) || "0.00"} $
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {isMultipleTransfer ? (
                    // Interface pour transfert multiple
                    <div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <FaUser className="inline-block mr-1" />
                            Destinataires multiples
                          </label>
                          <button
                            type="button"
                            onClick={addRecipient}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              isDarkMode
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                          >
                            + Ajouter un destinataire
                          </button>
                        </div>
                        
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                          {multipleRecipients.map((recipient, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className={`text-sm font-medium ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}>
                                  Destinataire {index + 1}
                                </span>
                                {multipleRecipients.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRecipient(index)}
                                    className={`p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors`}
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    value={recipient.recipient_account_id}
                                    onChange={(e) => handleMultipleRecipientChange(index, 'recipient_account_id', e.target.value)}
                                    placeholder="ID du compte destinataire"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                      isDarkMode
                                        ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                  />
                                  {errors[`recipient_account_id_${index}`] && (
                                    <p className="mt-1 text-xs text-red-500">
                                      {errors[`recipient_account_id_${index}`]}
                                    </p>
                                  )}
                                </div>
                                
                                <div>
                                  <div className="flex items-center">
                                    <span className="text-gray-600 mr-2 font-bold dark:text-gray-300 text-sm">
                                      $
                                    </span>
                                    <input
                                      type="number"
                                      value={recipient.amount}
                                      onChange={(e) => handleMultipleRecipientChange(index, 'amount', e.target.value)}
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                        isDarkMode
                                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                  </div>
                                  {errors[`amount_${index}`] && (
                                    <p className="mt-1 text-xs text-red-500">
                                      {errors[`amount_${index}`]}
                                    </p>
                                  )}
                                </div>
                                
                                {recipient.amount && parseFloat(recipient.amount) > 0 && (
                                  <div className={`p-2 rounded text-xs ${
                                    isDarkMode ? "bg-gray-600" : "bg-gray-100"
                                  }`}>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                        Frais: {(parseFloat(recipient.total_fee)).toFixed(2)} $
                                      </span>
                                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                        Total: {(parseFloat(recipient.amount) + parseFloat(recipient.total_fee)).toFixed(2)} $
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Interface pour transfert simple (existante)
                    <div>
                      <div className="mb-4">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <FaUser className="inline-block mr-1" />
                          ID du compte destinataire
                        </label>
                        <input
                          type="text"
                          name="recipient_account_id"
                          value={transferData.recipient_account_id}
                          onChange={handleTransferChange}
                          placeholder="ID du compte destinataire"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.recipient_account_id && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.recipient_account_id}
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Montant
                        </label>
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2 font-bold dark:text-gray-300">
                            $
                          </span>
                          <input
                            type="number"
                            name="amount"
                            value={transferData.amount}
                            onChange={handleTransferChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.amount}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <FaFileAlt className="inline-block mr-1" /> Description
                      (optionnelle)
                    </label>
                    <textarea
                      name="note"
                      value={transferData.note}
                      onChange={handleTransferChange}
                      placeholder="Raison du transfert (optionnel)"
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>

                  {/* Affichage des frais de transfert */}
                  {((isMultipleTransfer && multipleRecipients.some(r => r.amount && parseFloat(r.amount) > 0)) || 
                    (!isMultipleTransfer && transferData.amount && parseFloat(transferData.amount) > 0)) && (
                      <div
                        className={`mb-4 p-3 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <h4
                          className={`font-medium mb-2 ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          <FaPercent className="inline-block mr-1" /> Résumé
                          {isMultipleTransfer ? " des transferts" : " du transfert"}
                        </h4>
                        
                        {isMultipleTransfer ? (
                          // Résumé pour transfert multiple
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                Nombre de destinataires:
                              </span>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                {multipleRecipients.filter(r => r.amount && parseFloat(r.amount) > 0).length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                Montant total transféré:
                              </span>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                {calculateTotalAmountTransferred().toFixed(2)}{" "}
                                $
                              </span>
                            </div>
                            {calculateTotalFees() > 0 && (
                              <div className="flex justify-between">
                                <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                  Total des frais:
                                </span>
                                <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                  {calculateTotalFees().toFixed(2)}{" "}
                                  $
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                              <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                Total à débiter:
                              </span>
                              <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {calculateMultipleTransferTotal().toFixed(2)}{" "}
                                $
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Résumé pour transfert simple (existante)
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                Montant du transfert:
                              </span>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                {parseFloat(transferData.amount).toFixed(2)}{" "}
                                $
                              </span>
                            </div>
                            {transferFeePercentage > 0 && (
                              <div className="flex justify-between">
                                <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                  Frais de transfert ({transferFeePercentage}%):
                                </span>
                                <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                  {transferFeeAmount.toFixed(2)}{" "}
                                  $
                                </span>
                              </div>
                            )}
                            {transferCommissionPercentage > 0 && (
                              <div className="flex justify-between">
                                <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                  Commission ({transferCommissionPercentage}%):
                                </span>
                                <span className={isDarkMode ? "text-white" : "text-gray-900"}>
                                  {transferCommissionAmount.toFixed(2)}{" "}
                                  $
                                </span>
                              </div>
                            )}
                            {(transferFeePercentage > 0 || transferCommissionPercentage > 0) && (
                              <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                                <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                  Total à débiter:
                                </span>
                                <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {(parseFloat(transferData.amount) + totalFeeAmount).toFixed(2)}{" "}
                                  $
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {errors.total && (
                    <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {errors.total}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      * Votre mot de passe sera demandé à l'étape suivante pour
                      confirmer le transfert.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={transferLoading}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      } ${
                        transferLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {transferLoading ? "Traitement..." : "Suivant"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        zIndex={9999}
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f3f4f6'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#6b7280' : '#9ca3af'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#9ca3af' : '#6b7280'};
        }
      `}</style>
    </div>,
    document.body
  );
};

export default FundsTransferModal;
