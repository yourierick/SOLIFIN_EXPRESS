import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  UploadFile as UploadIcon,
  PhotoCamera as PhotoIcon,
  Videocam as VideoCameraIcon,
  AttachMoney as CurrencyDollarIcon,
  Info as InformationCircleIcon,
} from "@mui/icons-material";
import axios from "../../../utils/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";

export default function FundraisingCreateModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    lien: "",
    cout_total: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Gérer le fichier image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({
          ...prev,
          image: "L'image ne doit pas dépasser 5MB"
        }));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gérer le fichier vidéo
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB
        setErrors(prev => ({
          ...prev,
          video: "La vidéo ne doit pas dépasser 20MB"
        }));
        return;
      }

      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer l'image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Supprimer la vidéo
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est obligatoire";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire";
    }

    if (!formData.cout_total || parseFloat(formData.cout_total) <= 0) {
      newErrors.cout_total = "Le coût total doit être supérieur à 0";
    }

    if (formData.lien && !isValidUrl(formData.lien)) {
      newErrors.lien = "Veuillez entrer une URL valide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Valider une URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data = new FormData();
      data.append('titre', formData.titre);
      data.append('description', formData.description);
      data.append('lien', formData.lien);
      data.append('cout_total', formData.cout_total);

      // Gérer l'image
      if (imageFile) {
        data.append('image', imageFile);
      }

      // Gérer la vidéo
      if (videoFile) {
        data.append('video', videoFile);
      }

      // Mode création uniquement
      const response = await axios.post('/api/fundraisings', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        onSuccess(response.data.fundraising);
        onClose();
        resetForm();
        
        // Réinitialiser les états de changement de fichiers
        setImageChanged(false);
        setVideoChanged(false);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du levé de fonds:', error);
      setErrors(error.response?.data?.errors || { general: 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      titre: "",
      description: "",
      lien: "",
      cout_total: "",
    });
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
    setErrors({});
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
          boxShadow: isDarkMode
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.6)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        },
      }}
      sx={{
        backdropFilter: "blur(8px)",
        "& .MuiBackdrop-root": {
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Créer votre projet et lever de fonds pour sa réalisation
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Erreur générale */}
            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Titre */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Titre du projet *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.titre
                    ? 'border-red-500'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Entrez le titre de votre projet"
              />
              {errors.titre && (
                <p className="mt-1 text-sm text-red-500">{errors.titre}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Description brève *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.description
                    ? 'border-red-500'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Décrivez brièvement votre projet..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Image et Vidéo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Image du projet
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                    errors.image
                      ? 'border-red-500'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        Cliquez pour ajouter une image
                      </Typography>
                    </div>
                  )}
                </button>
                {errors.image && (
                  <p className="mt-1 text-sm text-red-500">{errors.image}</p>
                )}
              </div>

              {/* Vidéo */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Vidéo du projet
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                    errors.video
                      ? 'border-red-500'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {videoPreview ? (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        className="w-full h-32 object-cover rounded-lg"
                        controls={false}
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Cliquez pour ajouter une vidéo
                      </p>
                    </div>
                  )}
                </button>
                {errors.video && (
                  <p className="mt-1 text-sm text-red-500">{errors.video}</p>
                )}
              </div>
            </div>

            {/* Informations financières */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coût total */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Coût total *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="cout_total"
                    value={formData.cout_total}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      errors.cout_total
                        ? 'border-red-500'
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="0.00"
                  />
                </div>
                {errors.cout_total && (
                  <p className="mt-1 text-sm text-red-500">{errors.cout_total}</p>
                )}
              </div>
            </div>

            {/* Lien pour en savoir plus */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Lien pour en savoir plus
              </label>
              <input
                type="url"
                name="lien"
                value={formData.lien}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.lien
                    ? 'border-red-500'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="https://exemple.com"
              />
              {errors.lien && (
                <p className="mt-1 text-sm text-red-500">{errors.lien}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: '#1e40af',
                  '&:hover': {
                    bgcolor: '#1d4ed8',
                  },
                  '&:disabled': {
                    bgcolor: '#9ca3af',
                  },
                }}
              >
                {loading ? 'Création en cours...' : 'Créer le projet'}
              </Button>
            </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
