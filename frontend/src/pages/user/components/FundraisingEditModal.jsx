import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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

export default function FundraisingEditModal({ isOpen, onClose, onSuccess, editingProject }) {
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
  
  // États pour suivre si les fichiers ont été modifiés
  const [imageChanged, setImageChanged] = useState(false);
  const [videoChanged, setVideoChanged] = useState(false);

  // Mettre à jour les données du formulaire lorsque editingProject change
  useEffect(() => {
    if (editingProject) {
      setFormData({
        titre: editingProject.titre || "",
        description: editingProject.description || "",
        lien: editingProject.lien || "",
        cout_total: editingProject.cout_total || "",
      });
      
      // Précharger les images/vidéos si elles existent
      if (editingProject.image) {
        setImagePreview(editingProject.image_url);
      }
      if (editingProject.video) {
        setVideoPreview(editingProject.video_url);
      }
    }
  }, [editingProject]);

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
        [name]: undefined
      }));
    }
  };

  // Gérer le fichier image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setErrors(prev => ({
          ...prev,
          image: "L'image ne doit pas dépasser 2MB"
        }));
        return;
      }

      setImageFile(file);
      setImageChanged(true);
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
      setVideoChanged(true);
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
    setImageChanged(true);
  };

  // Supprimer la vidéo
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoChanged(true);
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
    setImageChanged(false);
    setVideoChanged(false);
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

      // Gérer l'image (nouvelle ou existante)
      if (imageFile) {
        data.append('image', imageFile);
      } else if (editingProject && editingProject.image && !imageChanged) {
        // En mode édition, si aucune nouvelle image n'est sélectionnée, inclure l'image existante
        data.append('existing_image', editingProject.image);
      }

      // Gérer la vidéo (nouvelle ou existante)
      if (videoFile) {
        data.append('video', videoFile);
      } else if (editingProject && editingProject.video && !videoChanged) {
        // En mode édition, si aucune nouvelle vidéo n'est sélectionnée, inclure la vidéo existante
        data.append('existing_video', editingProject.video);
      }

      // Mode édition - utiliser PUT pour la mise à jour
      const response = await axios.put(`/api/fundraisings/${editingProject.id}`, data, {
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
      console.error('Erreur lors de la mise à jour du levé de fonds:', error);
      setErrors(error.response?.data?.errors || { general: 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
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
          Modifier votre projet
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
              placeholder="Donnez un titre à votre projet"
              required
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
              Description *
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
              placeholder="Décrivez votre projet en détail"
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
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

          {/* Objectif financier */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Objectif financier (USD) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="cout_total"
                value={formData.cout_total}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.cout_total
                    ? 'border-red-500'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="100000"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className={`text-gray-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  <CurrencyDollarIcon className="h-5 w-5" />
                </span>
              </div>
            </div>
            {errors.cout_total && (
              <p className="mt-1 text-sm text-red-500">{errors.cout_total}</p>
            )}
          </div>

          {/* Image */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Image du projet
            </label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu de l'image"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour ajouter une image
                  </p>
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
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Ajouter une image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Vidéo */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Vidéo du projet
            </label>
            <div className="space-y-2">
              {videoPreview ? (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Cliquez pour ajouter une vidéo
                  </p>
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
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Ajouter une vidéo
                  </button>
                </div>
              )}
            </div>
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
              {loading ? 'Modification en cours...' : 'Mettre à jour'}
            </Button>
          </div>
        </Box>
      </DialogContent>
    </Dialog>,
    document.body
  );
}
