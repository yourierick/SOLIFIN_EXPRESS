import React, { useState, useEffect } from "react";
import ModalPortal from "./ModalPortal";
import {
  PencilIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "../../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../../styles/quill-custom.css";
import * as framerMotion from "framer-motion";
const { motion } = framerMotion;

// Définition des paramètres figés
const FIXED_SETTINGS = [
  // Paramètres financiers
  {
    key: "withdrawal_fee_percentage",
    label: "Pourcentage des frais de retrait",
    description:
      "Pourcentage des frais appliqués sur chaque retrait (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "withdrawal_commission",
    label: "Pourcentage de commission sur retrait",
    description:
      "Pourcentage de commission prélevé sur chaque retrait au bénefice du premier parrain (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "transfer_fee_percentage",
    label: "Pourcentage des frais de transfert",
    description:
      "Pourcentage des frais appliqués sur chaque transfert (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "transfer_commission",
    label: "Pourcentage Commission transfert entre wallet",
    description:
      "Pourcentage de la commission du premier parrain pour le transfert entre wallet (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "purchase_fee_percentage",
    label: "Pourcentage des frais d'achat des packs",
    description:
      "Pourcentage des frais d'achat des packs (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "purchase_commission_system",
    label: "Pourcentage Commission système",
    description:
      "Pourcentage des frais de commission système pour la vente des formations (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "jeton_expiration_months",
    label: "Durée d'expiration des jetons Esengo",
    description:
      "Durée d'expiration des jetons Esengo en mois pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "ticket_expiration_months",
    label: "Durée d'expiration des tickets gagnants",
    description:
      "Durée d'expiration des tickets gagnants en mois pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "essai_duration_days",
    label: "Durée de l'essai",
    description: "Durée de l'essai en jours pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "dual_currency",
    label: "Utiliser une deuxième dévise",
    description: "Activer ou desactiver la deuxième dévise",
    placeholder: "oui ou non",
    category: "period",
    isSelect: true,
  },
  // Réseaux sociaux
  {
    key: "facebook_url",
    label: "Lien Facebook",
    description: "URL de la page Facebook de l'entreprise",
    placeholder: "https://facebook.com/votrepage",
    category: "social",
    isText: true,
  },
  {
    key: "youtube_url",
    label: "Lien youtube",
    description: "URL de la chaîne youtube de l'entreprise",
    placeholder: "https://youtube.com/votrechaine",
    category: "social",
    isText: true,
  },
  {
    key: "tiktok_url",
    label: "Lien tiktok",
    description: "URL du compte tiktok de l'entreprise",
    placeholder: "https://tiktok.com/votrechaine",
    category: "social",
    isText: true,
  },
  {
    key: "whatsapp_url",
    label: "Lien WhatsApp",
    description:
      "Remplacez NUMERO par votre numéro de téléphone au format international (sans espaces, parenthèses ou tirets). Par exemple, si votre numéro est +243 812345678, votre lien sera: https://wa.me/243812345678",
    placeholder: "https://wa.me/NUMERO",
    category: "social",
    isText: true,
  },
  {
    key: "twitter_url",
    label: "Lien X (Twitter)",
    description: "URL du compte X (Twitter) de l'entreprise",
    placeholder: "https://x.com/votrecompte",
    category: "social",
    isText: true,
  },
  {
    key: "instagram_url",
    label: "Lien Instagram",
    description: "URL du compte Instagram de l'entreprise",
    placeholder: "https://instagram.com/votrecompte",
    category: "social",
    isText: true,
  },
  {
    key: "linkedIn_url",
    label: "Lien LinkedIn",
    description: "URL du compte LinkedIn de l'entreprise",
    placeholder: "https://linkedin.com/votrecompte",
    category: "social",
    isText: true,
  },

  // Documents légaux
  {
    key: "terms_of_use",
    label: "Conditions d'utilisation",
    description: "Texte des conditions d'utilisation de la plateforme",
    placeholder: "Entrez les conditions d'utilisation...",
    category: "legal",
    isLongText: true,
  },
  {
    key: "privacy_policy",
    label: "Politique de confidentialité",
    description: "Texte de la politique de confidentialité de la plateforme",
    placeholder: "Entrez la politique de confidentialité...",
    category: "legal",
    isLongText: true,
  },

  // Photo du fondateur
  {
    key: "founder_photo",
    label: "Photo du fondateur",
    description: "Photo du fondateur (formats acceptés: JPG, PNG, max 2MB)",
    placeholder: "Sélectionnez une image",
    category: "about",
    isImage: true,
    isUploadable: true,
  },
];
const GeneralSettings = () => {
  const { isDarkMode } = useTheme();
  const { refetch: refetchCurrency } = useCurrency();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [formData, setFormData] = useState({
    value: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("finance");
  
  // États pour la gestion des grades
  const [grades, setGrades] = useState([]);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({
    niveau: '',
    designation: '',
    points: '',
    symbole: null
  });
  const [gradeErrors, setGradeErrors] = useState({});
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  // Catégories disponibles
  const categories = [
    { id: "finance", label: "finances" },
    { id: "social", label: "réseaux" },
    { id: "legal", label: "documents" },
    { id: "about", label: "à propos" },
    { id: "period", label: "validité" },
    { id: "grade", label: "grades" },
  ];

  // Fonction pour filtrer les paramètres par catégorie
  const getSettingsByCategory = (category) => {
    return FIXED_SETTINGS.filter((setting) => setting.category === category);
  };

  // Fonctions pour la gestion des grades
  const fetchGrades = async () => {
    try {
      const response = await axios.get('/api/admin/grades');
      if (response.data.success) {
        setGrades(response.data.grades);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des grades:", error);
      toast.error("Erreur lors de la récupération des grades");
    }
  };

  const handleEditGrade = (grade) => {
    setCurrentGrade(grade);
    setGradeFormData({
      niveau: grade.niveau,
      designation: grade.designation,
      points: grade.points.toString(),
      symbole: null
    });
    setGradeErrors({});
    setShowGradeModal(true);
  };

  const handleDeleteGrade = async (grade) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le grade "${grade.niveau}" ?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/grades/${grade.id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchGrades();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du grade:", error);
      toast.error("Erreur lors de la suppression du grade");
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('niveau', gradeFormData.niveau);
    formData.append('designation', gradeFormData.designation);
    formData.append('points', gradeFormData.points);
    
    if (gradeFormData.symbole) {
      formData.append('symbole', gradeFormData.symbole);
    }

    try {
      setGradeSubmitting(true);
      
      let response;
      if (currentGrade) {
        response = await axios.post(`/api/admin/grades/${currentGrade.id}?_method=PUT`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post('/api/admin/grades', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setShowGradeModal(false);
        setCurrentGrade(null);
        setGradeFormData({
          niveau: '',
          designation: '',
          points: '',
          symbole: null
        });
        fetchGrades();
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du grade:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        setGradeErrors(error.response.data.errors);
      } else {
        toast.error("Erreur lors de la sauvegarde du grade");
      }
    } finally {
      setGradeSubmitting(false);
    }
  };

  const handleGradeChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'symbole' && files && files.length > 0) {
      setGradeFormData(prev => ({
        ...prev,
        symbole: files[0]
      }));
    } else {
      setGradeFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur pour ce champ
    if (gradeErrors[name]) {
      setGradeErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleCloseGradeModal = () => {
    setShowGradeModal(false);
    setCurrentGrade(null);
    setGradeFormData({
      niveau: '',
      designation: '',
      points: '',
      symbole: null
    });
    setGradeErrors({});
  };

  // Récupérer les paramètres au chargement du composant
  useEffect(() => {
    fetchSettings();
    fetchGrades(); // Charger les grades au chargement
  }, [refreshKey]);

  // Fonction pour récupérer les paramètres depuis l'API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/settings");
      if (response.data.success) {
        // Convertir le tableau en objet avec la clé comme propriété
        const settingsObj = {};
        response.data.settings.forEach((setting) => {
          settingsObj[setting.key] = setting;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error);
      toast.error("Erreur lors de la récupération des paramètres");
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour ouvrir le modal d'édition
  const handleOpenEditModal = (settingKey) => {
    const setting = settings[settingKey];
    const fixedSetting = FIXED_SETTINGS.find((s) => s.key === settingKey);

    if (!fixedSetting) {
      toast.error("Paramètre non trouvé");
      return;
    }

    if (setting) {
      // Le paramètre existe déjà, on édite sa valeur
      setFormData({
        key: setting.key,
        value: setting.value,
        description: setting.description,
      });
      // Fusionner les propriétés du paramètre fixe avec celles du paramètre actuel
      setCurrentSetting({ ...fixedSetting, ...setting });
    } else {
      // Le paramètre n'existe pas encore, on prépare sa création
      setFormData({
        key: settingKey,
        value: "",
        description: fixedSetting.description,
      });
      setCurrentSetting(fixedSetting);
    }

    setErrors({});
    setShowModal(true);
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      key: "",
      value: "",
      description: "",
    });
    setErrors({});
    // Réinitialiser les états liés au téléchargement d'images
    setSelectedFile(null);
    setPreviewUrl("");
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Si c'est un téléchargement de fichier
    if (name === "file" && files && files.length > 0) {
      const file = files[0];

      // Vérifier le type de fichier
      if (!file.type.match("image/(jpeg|jpg|png)")) {
        setErrors((prev) => ({
          ...prev,
          file: "Format de fichier non supporté. Utilisez JPG ou PNG.",
        }));
        return;
      }

      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: "L'image est trop volumineuse. Maximum 2MB.",
        }));
        return;
      }

      setSelectedFile(file);

      // Créer une URL pour la prévisualisation
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      fileReader.readAsDataURL(file);

      // Effacer l'erreur pour ce champ
      if (errors.file) {
        setErrors((prev) => ({
          ...prev,
          file: null,
        }));
      }
    } else {
      // Pour les autres champs
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Effacer l'erreur pour ce champ
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    }
  };

  // Fonction pour valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    const currentSetting = FIXED_SETTINGS.find((s) => s.key === formData.key);

    // Validation générale - la valeur est requise pour tous les paramètres
    if (!formData.value.trim() && !currentSetting?.isImage) {
      newErrors.value = "La valeur est requise";

      // Validation spécifique pour les paramètres financiers (pourcentages)
    } else if (
      formData.key === "withdrawal_commission" ||
      formData.key === "withdrawal_fee_percentage" ||
      formData.key === "transfer_commission" ||
      formData.key === "transfer_fee_percentage" ||
      formData.key === "purchase_fee_percentage" ||
      formData.key === "purchase_commission_system"
    ) {
      // Valider que la valeur est un nombre entre 0 et 100
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors.value = "La valeur doit être un nombre entre 0 et 100";
      }

      // Validation pour le prix du boost
    } else if (formData.key === "boost_price") {
      // Valider que la valeur est un nombre positif
      const value = parseFloat(formData.value);
      if (isNaN(value) || value <= 0) {
        newErrors.value = "La valeur doit être un nombre positif";
      }

      // Validation pour les URLs des réseaux sociaux et la photo du fondateur
    } else if (
      formData.key === "facebook_url" ||
      formData.key === "twitter_url" ||
      formData.key === "instagram_url" ||
      formData.key === "founder_photo"
    ) {
      if (formData.value.trim() && !formData.value.startsWith("http")) {
        newErrors.value = "L'URL doit commencer par http:// ou https://";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Vérifier si nous avons un fichier à télécharger pour la photo du fondateur
      if (selectedFile && currentSetting && currentSetting.isUploadable) {
        // Créer un FormData pour envoyer le fichier
        const formDataWithFile = new FormData();
        formDataWithFile.append("file", selectedFile);
        formDataWithFile.append("description", formData.description);

        // Envoyer le fichier au serveur
        const uploadResponse = await axios.post(
          `/api/admin/settings/upload/${formData.key}`,
          formDataWithFile,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.data.success) {
          toast.success(uploadResponse.data.message);
          setRefreshKey((prev) => prev + 1); // Déclencher une actualisation
          handleCloseModal();
        }
      } else {
        // Traitement normal pour les autres types de paramètres
        const response = await axios.put(
          `/api/admin/settings/key/${formData.key}`,
          formData
        );

        if (response.data.success) {
          toast.success(response.data.message);

          // Si c'est le paramètre dual_currency, recharger le CurrencyContext
          if (formData.key === "dual_currency") {
            try {
              await refetchCurrency();
            } catch (error) {
              console.error(
                "Erreur lors du rechargement du CurrencyContext:",
                error
              );
              toast.warning(
                "Le paramètre a été mis à jour, mais une erreur est survenue lors de la synchronisation des devises. Veuillez recharger la page."
              );
            }
          }

          setRefreshKey((prev) => prev + 1); // Déclencher une actualisation
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);

      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(
          "Une erreur est survenue lors de la soumission du formulaire"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-30"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Paramètres du système
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Configurez les paramètres essentiels de votre plateforme
              </p>
            </div>
          </div>
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
          >
            <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Actualiser</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-2 border-purple-600 border-opacity-30"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Onglets de catégories */}
          <div className="relative mb-8">
            <div className="flex space-x-1 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`flex-1 min-w-fit px-6 py-3 rounded-t-xl font-medium text-sm transition-all duration-300 relative group ${
                    activeTab === category.id
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-t-2 border-l-2 border-r-2 border-blue-500 dark:border-blue-400 -mb-px"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t-2 border-l-2 border-r-2 border-transparent"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {category.id === "grade" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {category.id === "finance" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {category.id === "social" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    )}
                    {category.id === "legal" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {category.id === "about" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {category.id === "period" && (
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {category.label}
                  </span>
                  {activeTab === category.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform -translate-y-0"
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Affichage des paramètres par catégorie */}
          <div className="overflow-x-auto">
            {activeTab === "legal" ? (
              // Affichage amélioré pour les documents légaux (texte long)
              <div className="space-y-6">
                {getSettingsByCategory("legal").map((fixedSetting) => {
                  const setting = settings[fixedSetting.key];
                  return (
                    <div
                      key={fixedSetting.key}
                      className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
                    >
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white text-xl mb-2">
                              {fixedSetting.label}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {fixedSetting.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenEditModal(fixedSetting.key)}
                            className="p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transition-all duration-200 transform hover:scale-105"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {setting && setting.value ? (
                        <div className="bg-white dark:bg-gray-800 p-6">
                          <div className="prose dark:prose-invert max-w-none prose-sm overflow-y-auto max-h-96 legal-document">
                            <ReactMarkdown
                              rehypePlugins={[rehypeSanitize]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p
                                    className="mb-4 text-base leading-relaxed"
                                    {...props}
                                  />
                                ),
                                h1: ({ node, ...props }) => (
                                  <h1
                                    className="text-2xl font-bold mb-4 mt-6 border-b pb-2 border-gray-200 dark:border-gray-700"
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className="text-xl font-bold mb-3 mt-5"
                                    {...props}
                                  />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    className="text-lg font-bold mb-2 mt-4"
                                    {...props}
                                  />
                                ),
                                h4: ({ node, ...props }) => (
                                  <h4
                                    className="text-base font-bold mb-2 mt-3"
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className="list-disc pl-5 mb-4 space-y-2"
                                    {...props}
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    className="list-decimal pl-5 mb-4 space-y-2"
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="mb-1" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                  <a
                                    className="text-blue-600 hover:underline"
                                    {...props}
                                  />
                                ),
                                blockquote: ({ node, ...props }) => (
                                  <blockquote
                                    className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4"
                                    {...props}
                                  />
                                ),
                                code: ({ node, inline, ...props }) =>
                                  inline ? (
                                    <code
                                      className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
                                      {...props}
                                    />
                                  ) : (
                                    <code
                                      className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto my-4"
                                      {...props}
                                    />
                                  ),
                                pre: ({ node, ...props }) => (
                                  <pre
                                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto my-4"
                                    {...props}
                                  />
                                ),
                                hr: ({ node, ...props }) => (
                                  <hr
                                    className="my-6 border-t border-gray-300 dark:border-gray-600"
                                    {...props}
                                  />
                                ),
                                table: ({ node, ...props }) => (
                                  <table
                                    className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 my-4"
                                    {...props}
                                  />
                                ),
                                th: ({ node, ...props }) => (
                                  <th
                                    className="px-3 py-2 text-left font-semibold bg-gray-100 dark:bg-gray-700"
                                    {...props}
                                  />
                                ),
                                td: ({ node, ...props }) => (
                                  <td
                                    className="px-3 py-2 border-t border-gray-200 dark:border-gray-700"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {setting.value}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 p-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                              <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-gray-400 italic text-lg">
                              Aucun contenu défini
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "about" ? (
              // Affichage spécial pour la photo du fondateur
              <div className="space-y-6">
                {getSettingsByCategory("about").map((fixedSetting) => {
                  const setting = settings[fixedSetting.key];
                  return (
                    <div
                      key={fixedSetting.key}
                      className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-xl mb-2">
                            {fixedSetting.label}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {fixedSetting.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal(fixedSetting.key)}
                          className="p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transition-all duration-200 transform hover:scale-105"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                      {setting && setting.value ? (
                        <div className="flex justify-center bg-gray-50 dark:bg-gray-700/30 rounded-xl p-8">
                          <img
                            src={setting.value}
                            alt="Photo du fondateur"
                            className="max-h-64 object-cover rounded-xl shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-700/30 h-40 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-gray-400 italic">
                              Aucune image définie
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "grade" ? (
              // Onglet Grades - Gestion CRUD complète
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Gestion des Grades
                  </h3>
                  <button
                    onClick={() => setShowGradeModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un grade
                  </button>
                </div>

                {/* Liste des grades */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                    >
                      {/* Header avec symbole proéminent */}
                      <div className="relative p-8 pb-6">
                        {/* Arrière-plan décoratif */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-400/10 dark:to-purple-400/10"></div>
                        
                        {/* Contenu principal */}
                        <div className="relative z-10">
                          {/* Symbole centré et proéminent */}
                          <div className="flex justify-center mb-6">
                            {grade.symbole ? (
                              <div className="relative">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white dark:border-gray-700">
                                  <img
                                    src={`${grade.symbole_url}`}
                                    alt={`Grade ${grade.niveau}`}
                                    className="w-20 h-20 object-contain drop-shadow-lg"
                                  />
                                </div>
                                {/* Badge de niveau */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                  {grade.niveau}
                                </div>
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white dark:border-gray-700">
                                <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                                  {grade.niveau}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Informations du grade */}
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              {grade.designation}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Niveau {grade.niveau}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section points et actions */}
                      <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          {/* Points */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Points requis</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {parseFloat(grade.points).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditGrade(grade)}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grade)}
                              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110"
                              title="Supprimer"
                            >
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message si aucun grade */}
                {grades.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Aucun grade trouvé
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Commencez par ajouter des grades pour gérer les niveaux des utilisateurs.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Affichage responsive : cards sur mobile, tableau sur desktop
              <>
                <div className="space-y-4 sm:hidden">
                  {/* Cards pour mobile */}
                  {getSettingsByCategory(activeTab).map((fixedSetting) => {
                    const setting = settings[fixedSetting.key];
                    return (
                      <div
                        key={fixedSetting.key}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {fixedSetting.label}
                          </h3>
                          <button
                            onClick={() => handleOpenEditModal(fixedSetting.key)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 transition-all duration-200"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Valeur
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {setting ? setting.value : "Non défini"}{" "}
                              {fixedSetting.isNumber ? "%" : ""}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {fixedSetting.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                          >
                            Paramètre
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                          >
                            Valeur
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {getSettingsByCategory(activeTab).map((fixedSetting) => {
                          const setting = settings[fixedSetting.key];
                          return (
                            <tr
                              key={fixedSetting.key}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {fixedSetting.label}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  {setting ? setting.value : "Non défini"}{" "}
                                  {fixedSetting.isNumber ? "%" : ""}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                {fixedSetting.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleOpenEditModal(fixedSetting.key)}
                                  className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 transition-all duration-200 transform hover:scale-105"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal pour modifier un paramètre */}
      <ModalPortal isOpen={showModal} onClose={handleCloseModal}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
            <div className="relative flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <PencilIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentSetting
                    ? "Modifier un paramètre"
                    : "Ajouter un paramètre"}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="key"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Clé
                  </label>
                  <input
                    type="text"
                    id="key"
                    name="key"
                    value={formData.key}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Champ de valeur dynamique selon le type de paramètre */}
                <div>
                  <label
                    htmlFor="value"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Valeur
                  </label>

                  {/* Éditeur de texte riche avec React Quill */}
                  {currentSetting && currentSetting.isLongText && (
                    <div>
                      <div
                        className={`quill-container ${
                          isDarkMode ? "dark" : ""
                        }`}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        <ReactQuill
                          theme="snow"
                          value={formData.value}
                          onChange={(value) =>
                            handleChange({ target: { name: "value", value } })
                          }
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, 4, 5, 6, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              [{ script: "sub" }, { script: "super" }],
                              [{ indent: "-1" }, { indent: "+1" }],
                              [{ direction: "rtl" }],
                              [{ color: [] }, { background: [] }],
                              [{ font: [] }],
                              [{ align: [] }],
                              ["blockquote", "code-block"],
                              ["link", "image", "video"],
                              ["clean"],
                            ],
                          }}
                          formats={[
                            "header",
                            "font",
                            "size",
                            "bold",
                            "italic",
                            "underline",
                            "strike",
                            "blockquote",
                            "list",
                            "bullet",
                            "indent",
                            "link",
                            "image",
                            "video",
                            "color",
                            "background",
                            "align",
                            "script",
                            "direction",
                          ]}
                          placeholder="Écrivez votre contenu ici..."
                          style={{
                            height: "300px",
                            marginBottom: "50px",
                          }}
                        />
                      </div>
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}

                      {/* Prévisualisation pour les documents légaux */}
                      {currentSetting.category === "legal" &&
                        formData.value && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Prévisualisation
                            </h4>
                            <div
                              className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 prose dark:prose-invert prose-sm max-h-60 overflow-y-auto"
                              dangerouslySetInnerHTML={{
                                __html: formData.value,
                              }}
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Champ pour les images avec prévisualisation */}
                  {currentSetting && currentSetting.isImage && (
                    <div className="space-y-4">
                      {/* Option de téléchargement pour la photo du fondateur */}
                      {currentSetting.isUploadable && (
                        <div className="space-y-2">
                          <label
                            htmlFor="file"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Télécharger une image
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              id="file"
                              name="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleChange}
                              className={`block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-800 ${
                                errors.file ? "border-red-500" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl("");
                              }}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Effacer
                            </button>
                          </div>
                          {errors.file && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {errors.file}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Formats acceptés: JPG, PNG. Taille max: 2MB
                          </p>
                          {previewUrl && (
                            <div className="mt-2 border dark:border-gray-600 rounded-md p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Aperçu du fichier téléchargé:
                              </p>
                              <img
                                src={previewUrl}
                                alt="Aperçu"
                                className="max-h-40 mx-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Champ URL pour toutes les images */}
                      <div className="space-y-2">
                        <label
                          htmlFor="value"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {currentSetting.isUploadable
                            ? "Ou entrez une URL d'image"
                            : "URL de l'image"}
                        </label>
                        <input
                          type="text"
                          id="value"
                          name="value"
                          value={formData.value}
                          onChange={handleChange}
                          className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                            errors.value
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                          placeholder="URL de l'image"
                        />
                        {errors.value && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.value}
                          </p>
                        )}
                        {formData.value &&
                          formData.value.startsWith("http") && (
                            <div className="mt-2 border dark:border-gray-600 rounded-md p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Aperçu:
                              </p>
                              <img
                                src={formData.value}
                                alt="Aperçu"
                                className="max-h-40 mx-auto object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=Image+non+disponible";
                                }}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Champ texte simple */}
                  {currentSetting && currentSetting.isText && (
                    <div>
                      <input
                        type="text"
                        id="value"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.value
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        placeholder={currentSetting.placeholder || ""}
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champ Select */}
                  {currentSetting && currentSetting.isSelect && (
                    <div>
                      <select
                        name="value"
                        id="value"
                        value={formData.value}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.value
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      >
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champ nombre */}
                  {currentSetting && currentSetting.isNumber && (
                    <div>
                      <input
                        type="number"
                        id="value"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.value
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        placeholder={currentSetting.placeholder || ""}
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fallback pour tout autre type de champ */}
                  {!currentSetting && (
                    <div>
                      <input
                        type="text"
                        id="value"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.value
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                      errors.description
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg ${
                    submitting ? "opacity-70 cursor-not-allowed scale-100" : ""
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Traitement...
                    </span>
                  ) : currentSetting ? (
                    <span className="flex items-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      Mettre à jour
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* Modal pour la gestion des grades */}
      <ModalPortal isOpen={showGradeModal} onClose={handleCloseGradeModal}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
            <div className="relative flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentGrade ? "Modifier un grade" : "Ajouter un grade"}
                </h3>
              </div>
              <button
                onClick={handleCloseGradeModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleGradeSubmit} className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="niveau"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Niveau
                    </label>
                    <select
                      id="niveau"
                      name="niveau"
                      value={gradeFormData.niveau}
                      onChange={handleGradeChange}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        gradeErrors.niveau ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <option value="">Sélectionner un niveau</option>
                      <option value="1">Niveau 1</option>
                      <option value="2">Niveau 2</option>
                      <option value="3">Niveau 3</option>
                      <option value="4">Niveau 4</option>
                      <option value="5">Niveau 5</option>
                      <option value="6">Niveau 6</option>
                    </select>
                    {gradeErrors.niveau && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {gradeErrors.niveau}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="designation"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Désignation
                    </label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={gradeFormData.designation}
                      onChange={handleGradeChange}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        gradeErrors.designation ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Ex: Débutant, Intermédiaire, Avancé"
                    />
                    {gradeErrors.designation && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {gradeErrors.designation}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="points"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Points requis
                  </label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={gradeFormData.points}
                    onChange={handleGradeChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      gradeErrors.points ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Ex: 1000"
                  />
                  {gradeErrors.points && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {gradeErrors.points}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="symbole"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Symbole (médaille)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="symbole"
                      name="symbole"
                      onChange={handleGradeChange}
                      accept="image/jpeg,image/jpg,image/png"
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-md shadow-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${
                        gradeErrors.symbole ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    {gradeErrors.symbole && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {gradeErrors.symbole}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formats acceptés: JPG, PNG. Taille max: 2MB. Le symbole sera affiché comme une médaille sur le profil utilisateur.
                    </p>
                    {gradeFormData.symbole && (
                      <div className="mt-2 border dark:border-gray-600 rounded-md p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Aperçu du symbole:
                        </p>
                        <div className="flex justify-center">
                          <img
                            src={URL.createObjectURL(gradeFormData.symbole)}
                            alt="Aperçu du symbole"
                            className="max-h-20 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseGradeModal}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={gradeSubmitting}
                  className={`px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg ${
                    gradeSubmitting ? "opacity-70 cursor-not-allowed scale-100" : ""
                  }`}
                >
                  {gradeSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Traitement...
                    </span>
                  ) : currentGrade ? (
                    <span className="flex items-center gap-2">
                      <PencilIcon className="h-4 w-4" />
                      Mettre à jour
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default GeneralSettings;
