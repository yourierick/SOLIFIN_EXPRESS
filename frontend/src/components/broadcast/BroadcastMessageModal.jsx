import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import {
  XMarkIcon,
  BellIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";

const BroadcastMessageModal = ({
  open,
  onClose,
  message = null,
  onMessageSeen,
}) => {
  const { isDarkMode } = useTheme();
  
  // États
  const [windowDimension, setWindowDimension] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  const [fadeIn, setFadeIn] = useState(true);
  const [animateIcon, setAnimateIcon] = useState(false);

  // Responsive
  const isMobile = windowDimension.width < 640;
  const isTablet = windowDimension.width < 1024;

  // Détecter le changement de taille de fenêtre
  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Icon animation effect (comme dans l'original)
  useEffect(() => {
    if (fadeIn) {
      const timer = setTimeout(() => setAnimateIcon(true), 200);
      return () => clearTimeout(timer);
    } else {
      setAnimateIcon(false);
    }
  }, [fadeIn]);

  // Mettre à jour le message actuel
  useEffect(() => {
    if (message) {
      // Mark message as seen
      if (onMessageSeen && message.id) {
        onMessageSeen(message.id);
      }
    }
  }, [message, onMessageSeen]);

  const handleClose = () => {
    onClose();
  };

  // Rendu du média
  const renderMedia = () => {
    if (!message) return null;

    switch (message.type) {
      case "image":
        return (
          <div className="relative w-full flex justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 mb-6">
            <img
              src={message.media_url}
              alt={message.title}
              className="w-full max-h-96 object-contain"
            />
          </div>
        );

      case "video":
        return (
          <div className="relative w-full flex justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 mb-6">
            <video
              controls
              className="w-full max-h-96 rounded-xl"
            >
              <source src={message.media_url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        );

      default:
        return null;
    }
  };

  // Icône du type de message
  const getMessageIcon = (type) => {
    const icons = {
      image: PhotoIcon,
      video: FilmIcon,
      text: DocumentTextIcon,
    };

    const Icon = icons[type] || DocumentTextIcon;
    return <Icon className="h-6 w-6" />;
  };

  // Early return si pas de message
  if (!open || !message) {
    return null;
  }

  return (
    <>
      {/* Overlay blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        onClick={handleClose}
      >
        {/* Modal principal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec dégradé */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Icône animée avec état animateIcon */}
                <motion.div
                  animate={{ 
                    rotate: animateIcon ? [0, 10, -10, 0] : 0,
                    scale: animateIcon ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 2, repeat: animateIcon ? Infinity : 0, ease: "easeInOut" }}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-3"
                >
                  <SpeakerWaveIcon className="h-8 w-8" />
                </motion.div>
                
                <div>
                  <motion.h1 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: fadeIn ? 0 : -20, opacity: fadeIn ? 1 : 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold mb-1"
                  >
                    {message.title}
                  </motion.h1>
                  
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: fadeIn ? 0 : -20, opacity: fadeIn ? 1 : 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center space-x-3 text-sm opacity-90"
                  >
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Message diffusé</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Bouton fermer */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Étincelles animées */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[0, 0.3, 0.6].map((delay, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: delay * 2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-yellow-300 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Body avec contenu */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 overflow-y-auto max-h-[60vh]">
            {/* Icône du type de message avec animation */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: animateIcon ? 1 : 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-4">
                {getMessageIcon(message.type)}
              </div>
            </motion.div>

            {/* Média (image/vidéo) avec fadeIn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeIn ? 1 : 0, y: fadeIn ? 0 : 20 }}
              transition={{ delay: 0.5 }}
            >
              {renderMedia()}
            </motion.div>

            {/* Description du message avec fadeIn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeIn ? 1 : 0, y: fadeIn ? 0 : 20 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                {message.description}
              </p>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </>
  );
};

export default BroadcastMessageModal;
