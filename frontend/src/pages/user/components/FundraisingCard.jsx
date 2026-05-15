import axios from "../../../utils/axios";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import VideoModal from "../../../components/VideoModal";
import ReportModal from "../../../components/ReportModal";

const FundraisingCard = ({ 
  fundraising, 
  onLike, 
  onComment, 
  onShare, 
  onView,
  isUserProjects = false,
  onEdit,
  onDelete,
  onPublish,
  onDeleteComment,
  onOpenFinanceModal
}) => {
  const { isDarkMode } = useTheme();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);
  const commentInputRef = useRef(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    userId: null,
    pubType: null,
    pubRef: null
  });
  const percentage = fundraising.percentage_mobilise || 0;
  const isLiked = fundraising.is_liked || false;
  const { user } = useAuth();

  // Formater le montant
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy à HH:mm", { locale: fr });
  };

  // Gérer la soumission d'un commentaire
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await onComment(fundraising.id, comment, 'fundraising');
      setComment("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire:", err);
    }
  };

  // Gérer l'ajout d'un emoji au commentaire
  const handleEmojiClick = (emojiData) => {
    setComment((prev) => prev + emojiData.emoji);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };


  // Activer le mode commentaire
  const activateCommentMode = () => {
    setIsCommenting(true);
    setShowComments(true);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  // Gérer l'ouverture du modal de financement
  const handleOpenFinanceModal = () => {
    onOpenFinanceModal?.(fundraising);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-100 ${
        isDarkMode ? 'border border-gray-700' : 'border border-gray-200'
        }`}
    >
      {/* Image ou vidéo */}
      {fundraising.image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={fundraising.image_url}
            alt={fundraising.titre}
            className="w-full h-full object-cover"
          />
          {fundraising.video && (
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer hover:bg-opacity-50 transition-opacity"
            >
              <PlayIcon className="h-12 w-12 text-white" />
            </button>
          )}
        </div>
      )}

      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {fundraising.titre}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {fundraising.description}
            </p>
          </div>
        </div>

        {/* Barre de progression circulaire */}
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Segment 1: Coût total (gris) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
                className="dark:stroke-gray-600"
              />
              {/* Segment 2: Montant mobilisé (vert) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#gradient-green)"
                strokeWidth="12"
                strokeDasharray={`${(fundraising.mobilise / fundraising.cout_total) * 251.2} 251.2`}
                strokeLinecap="round"
              />
              {/* Segment 3: Gap (orange) */}
              {fundraising.gap > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="12"
                  strokeDasharray={`${(fundraising.gap / fundraising.cout_total) * 251.2} 251.2`}
                  strokeDashoffset={`-${(fundraising.mobilise / fundraising.cout_total) * 251.2}`}
                  strokeLinecap="round"
                />
              )}
              <defs>
                <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            {/* Pourcentage au centre */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex-1 ml-4 space-y-2">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Mobilisé: {formatAmount(fundraising.mobilise)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Reste: {formatAmount(fundraising.gap)}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Total: {formatAmount(fundraising.cout_total)}
              </span>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <BanknotesIcon className="h-4 w-4 mr-1" />
            <span>Objectif: {formatAmount(fundraising.cout_total)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            <span>Reste: {formatAmount(fundraising.gap)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
          {isUserProjects ? (
            // Afficher des étiquettes pour les projets de l'utilisateur
            <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
              <div className="flex items-center space-x-1 text-gray-500">
                <HeartIcon className="h-5 w-5" />
                <span className="text-sm">{fundraising.likes_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span className="text-sm">{fundraising.comments_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <ShareIcon className="h-5 w-5" />
                <span className="text-sm">{fundraising.shares_count || 0}</span>
              </div>
            </div>
          ) : (
            // Afficher des boutons pour le catalogue
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => onLike && onLike(fundraising.id)}
                className={`flex items-center transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                {isLiked ? (
                  <HeartIconSolid className="h-5 w-5" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
                <span className="text-sm hidden sm:inline ml-1">{fundraising.likes_count || 0}</span>
              </button>
              <button
                onClick={() => {
                  if (showComments) {
                    setVisibleCommentsCount(10);
                  }
                  setShowComments(!showComments);
                }}
                className="relative flex items-center text-gray-500 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span className="text-sm hidden sm:inline ml-1">{showComments ? "Masquer" : "Commenter"}</span>
                {fundraising.comments_count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-medium bg-blue-100 text-blue-600">
                    {fundraising.comments_count > 99 ? "99+" : fundraising.comments_count}
                  </span>
                )}
              </button>
              <button 
                onClick={() => onShare && onShare(fundraising.id)}
                className="flex items-center text-gray-500 hover:text-green-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ShareIcon className="h-5 w-5" />
                <span className="text-sm hidden sm:inline ml-1">Partager</span>
              </button>
              {user.id !== fundraising.user.id && (
                <button
                  onClick={() => {
                    setCurrentReportData({
                      userId: fundraising.user.id,
                      pubType: "Fundraising",
                      pubRef: fundraising.pub_reference
                    });
                    setIsReportModalOpen(true);
                  }}
                  className="flex items-center text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Signaler"
                >
                  <ExclamationCircleIcon className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline ml-1">Signaler</span>
                </button>
              )}
              
              {
                user?.id !== fundraising.user_id && (
                  <button
                    onClick={handleOpenFinanceModal}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors ml-auto"
                  >
                    Financer
                  </button>
                )
              }
            </div>
          )}
          {fundraising.lien && (
            <button
              onClick={() => window.open(fundraising.lien, '_blank')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full sm:w-auto text-center"
            >
              En savoir plus
            </button>
          )}
        </div>

        {/* Statut du projet et informations utilisateur */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {fundraising.user && (
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {fundraising.user.picture ? (
                  <img
                    src={fundraising.user.picture_url}
                    alt={fundraising.user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {fundraising.user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {!isUserProjects ? "Publié par " : ""}{fundraising.user.name}
              </span>
            </div>
          )}
          
          {/* Statut du projet */}
          {isUserProjects && fundraising.statut && (
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                fundraising.statut === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : fundraising.statut === 'publié'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : fundraising.statut === 'suspendu'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {fundraising.statut === 'draft' ? 'Brouillon' : 
                 fundraising.statut === 'publié' ? 'Publié' : 
                 fundraising.statut === 'suspendu' ? 'Suspendu' : fundraising.statut}
              </span>
              
              {/* Boutons d'action pour les projets de l'utilisateur */}
              <div className="flex items-center space-x-2">
                {/* Bouton de modification pour les projets en statut draft */}
                {fundraising.statut === 'draft' && onEdit && (
                  <button
                    onClick={() => onEdit(fundraising.id)}
                    className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Modifier
                  </button>
                )}
                
                {/* Bouton de publication pour les projets en statut draft */}
                {fundraising.statut === 'draft' && onPublish && (
                  <button
                    onClick={() => onPublish(fundraising.id)}
                    className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  >
                    Publier
                  </button>
                )}
                
                {/* Bouton de suppression pour tous les projets de l'utilisateur */}
                {onDelete && (
                  <button
                    onClick={() => onDelete(fundraising.id)}
                    className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de lecture vidéo */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={fundraising.video_url}
      />

      {/* Section commentaires */}
      <AnimatePresence>
        {(isCommenting || showComments) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`p-5 ${
              isDarkMode ? "bg-gray-800/50" : "bg-white/50"
            }`}
            style={{ overflow: 'visible' }}
          >
            {/* Formulaire de commentaire */}
            <form
              onSubmit={handleSubmitComment}
              className="flex items-center mb-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mr-3 flex-shrink-0"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt="Photo de profil"
                    className={`h-9 w-9 rounded-full object-cover shadow-md ${
                      isDarkMode
                        ? "ring-1 ring-gray-700"
                        : "ring-1 ring-gray-200"
                    }`}
                  />
                ) : (
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shadow-md ${
                      isDarkMode
                        ? "bg-gray-700 ring-1 ring-gray-600"
                        : "bg-gray-100 ring-1 ring-gray-200"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </motion.div>

              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className={`w-full py-2 px-3 pr-16 rounded-full text-sm shadow-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:bg-gray-650"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200 focus:bg-white"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
                />

                <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 flex items-center space-x-0.5">
                  <motion.button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-1 rounded-full ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600 hover:text-yellow-300"
                        : "text-gray-500 hover:bg-gray-200 hover:text-yellow-500"
                    } transition-colors`}
                    aria-label="Ajouter un emoji"
                  >
                    <FaceSmileIcon className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={!comment.trim()}
                    whileHover={comment.trim() ? { scale: 1.1 } : {}}
                    whileTap={comment.trim() ? { scale: 0.9 } : {}}
                    className={`p-1 rounded-full ${
                      comment.trim()
                        ? isDarkMode
                          ? "text-blue-400 hover:bg-gray-600 hover:text-blue-300"
                          : "text-blue-600 hover:bg-gray-200 hover:text-blue-700"
                        : isDarkMode
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-400 cursor-not-allowed"
                    } transition-colors`}
                    aria-label="Envoyer le commentaire"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 rotate-90" />
                  </motion.button>
                </div>

                {/* Emoji picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-2 z-50"
                    >
                      <div
                        className={`p-2 rounded-lg shadow-xl border backdrop-blur-sm ${
                          isDarkMode
                            ? "bg-gray-800/95 border-gray-700"
                            : "bg-white/95 border-gray-200"
                        }`}
                      >
                        <motion.button
                          onClick={() => setShowEmojiPicker(false)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`absolute top-2 right-2 rounded-full p-1 z-10 ${
                            isDarkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                          }`}
                          aria-label="Fermer le sélecteur d'emoji"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </motion.button>
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          lazyLoadEmojis={true}
                          theme={isDarkMode ? "dark" : "light"}
                          width={280}
                          height={320}
                          searchPlaceHolder="Rechercher un emoji..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Liste des commentaires */}
            {showComments && (
              <div className="space-y-3">
                {fundraising.comments && fundraising.comments.length > 0 ? (
                  fundraising.comments
                    .slice(0, visibleCommentsCount)
                    .map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        className="flex group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.05 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex-shrink-0 mr-2"
                        >
                          {comment.user?.profile_picture ? (
                            <img
                              src={comment.user.profile_picture}
                              alt={comment.user.name}
                              className={`h-8 w-8 rounded-full object-cover shadow-md ${
                                isDarkMode
                                  ? "ring-1 ring-gray-700"
                                  : "ring-1 ring-gray-200"
                              }`}
                            />
                          ) : (
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center shadow-md ${
                                isDarkMode
                                  ? "bg-gray-700 ring-1 ring-gray-600"
                                  : "bg-gray-100 ring-1 ring-gray-200"
                              }`}
                            >
                              <span
                                className={`text-sm font-semibold ${
                                  isDarkMode ? "text-white" : "text-gray-600"
                                }`}
                              >
                                {comment.user?.name?.charAt(0) || "U"}
                              </span>
                            </div>
                          )}
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-semibold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {comment.user?.name || "Utilisateur"}
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {format(
                                new Date(comment.created_at),
                                "d MMM yyyy à HH:mm",
                                { locale: fr }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {comment.contenu}
                          </p>
                          {onDeleteComment && (
                            <motion.button
                              onClick={() => onDeleteComment(comment.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-1 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Supprimer
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <p
                    className={`text-sm text-center ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Aucun commentaire pour le moment. Soyez le premier !
                  </p>
                )}

                {/* Bouton pour charger plus de commentaires */}
                {fundraising.comments &&
                  fundraising.comments.length > 0 &&
                  visibleCommentsCount < fundraising.comments.length && (
                    <motion.button
                      onClick={() =>
                        setVisibleCommentsCount((prev) => prev + 10)
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`mt-3 text-xs font-medium flex items-center justify-center w-full py-2 rounded-lg shadow-sm transition-all duration-200 ${
                        isDarkMode
                          ? "bg-gray-700/50 text-blue-400 hover:bg-gray-700 hover:text-blue-300"
                          : "bg-gray-100/70 text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <span>Afficher plus de commentaires</span>
                    </motion.button>
                  )}

                {/* Bouton pour voir tous les commentaires si certains ne sont pas chargés */}
                {fundraising.comments &&
                  fundraising.comments_count > fundraising.comments.length && (
                  <motion.button
                    onClick={onView}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mt-3 text-xs font-medium flex items-center justify-center w-full py-2 rounded-lg shadow-sm transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700/50 text-blue-400 hover:bg-gray-700 hover:text-blue-300"
                        : "bg-gray-100/70 text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span>Voir tous les {fundraising.comments_count} commentaires</span>
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de signalement */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUserId={currentReportData.userId}
        reportedPubType={currentReportData.pubType}
        reportedPubRef={currentReportData.pubRef}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default FundraisingCard;
