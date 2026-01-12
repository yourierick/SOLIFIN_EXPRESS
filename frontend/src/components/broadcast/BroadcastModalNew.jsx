import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";

const BroadcastModalNew = ({
  open,
  onClose,
  messages = [],
  onMessageSeen,
}) => {
  const { isDarkMode } = useTheme();
  
  // États
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [windowDimension, setWindowDimension] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  const [fadeIn, setFadeIn] = useState(true);
  const [animateIcon, setAnimateIcon] = useState(false);

  // Message actuel
  const message = messages[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < messages.length - 1;
  const isLast = currentIndex === messages.length - 1;

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

  // Mettre à jour le message actuel (exactement comme l'original)
  useEffect(() => {
    if (messages && messages.length > 0 && currentIndex < messages.length) {
      setCurrentMessage(messages[currentIndex]);

      // Mark message as seen
      if (onMessageSeen && messages[currentIndex]) {
        onMessageSeen(messages[currentIndex].id);
      }
    } else {
      setCurrentMessage(null);
    }
  }, [currentIndex, messages, onMessageSeen]);

  // Handlers avec transitions (comme dans l'original)
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setFadeIn(true);
      }, 300);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < messages.length - 1) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setFadeIn(true);
      }, 300);
    } else {
      onClose();
    }
  }, [currentIndex, messages.length, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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
  if (!open || !message || messages.length === 0) {
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
                      <span>{currentIndex + 1}/{messages.length}</span>
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

          {/* Footer avec navigation */}
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              {/* Bouton précédent */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasPrevious
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                {!isMobile && <span>Précédent</span>}
              </motion.button>

              {/* Indicateur de progression */}
              <div className="flex items-center space-x-2">
                {isMobile ? (
                  <div className="flex space-x-1">
                    {Array.from({ length: messages.length }, (_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? 'bg-blue-500 w-6'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Message {currentIndex + 1} sur {messages.length}
                    </div>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / messages.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton suivant/fermer */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasNext
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                <span>{hasNext ? (isMobile ? '' : 'Suivant') : 'Fermer'}</span>
                {hasNext ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BroadcastModalNew;
