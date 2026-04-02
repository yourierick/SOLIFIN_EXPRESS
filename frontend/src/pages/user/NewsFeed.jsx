import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Tab } from "@headlessui/react";
import Formations from "./components/Formations";
import {
  NewspaperIcon,
  BriefcaseIcon,
  LightBulbIcon,
  PlusIcon,
  ChevronDownIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  ArrowPathIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import PostCard from "./components/PostCard";
import PostDetailModal from "./components/PostDetailModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  TablePagination,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon
} from '@mui/icons-material';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function NewsFeed({ initialActiveTab = 0, showTabs = true }) {
  // Ajuster l'initialActiveTab si c'était l'onglet Pages (index 4)
  // Maintenant que l'onglet Pages a été supprimé, nous devons ajuster l'index
  const adjustedInitialActiveTab =
    initialActiveTab === 4 ? 0 : initialActiveTab;
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [activeTab, setActiveTab] = useState(adjustedInitialActiveTab);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // État pour le chargement infini
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState(0);

  // États pour la pagination des offres d'emploi (Material-UI)
  const [jobOffersPage, setJobOffersPage] = useState(0);
  const [jobOffersRowsPerPage, setJobOffersRowsPerPage] = useState(10);
  const [jobOffersTotal, setJobOffersTotal] = useState(0);
  const [loadingJobOffers, setLoadingJobOffers] = useState(false);

  // États pour la pagination des opportunités d'affaires (Material-UI)
  const [oppoPage, setOppoPage] = useState(0);
  const [oppoRowsPerPage, setOppoRowsPerPage] = useState(10);
  const [oppoTotal, setOppoTotal] = useState(0);
  const [loadingOppo, setLoadingOppo] = useState(false);

  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all"); // 'all', 'active', 'recent', 'expired'

  // États pour les filtres des offres d'emploi
  const [postTypeFilter, setPostTypeFilter] = useState(""); // "offre_emploi" ou "appel_manifestation_interet"
  const [contractTypeFilter, setContractTypeFilter] = useState("");

  // États pour les filtres des opportunités d'affaires
  const [oppoTypeFilter, setOppoTypeFilter] = useState(""); // "appel_projet", "partenariat", "appel_offre"
  const [oppoDateFilter, setOppoDateFilter] = useState(""); // Filtre sur date_limite

  // États pour les filtres du fil d'actualités
  const [showNewsFilters, setShowNewsFilters] = useState(false);
  const [newsTypeFilter, setNewsTypeFilter] = useState(""); // "publicite" ou "annonce"
  const [newsCategoryFilter, setNewsCategoryFilter] = useState(""); // "produit" ou "service"
  const [newsDeliveryFilter, setNewsDeliveryFilter] = useState(""); // "OUI" ou "NON"
  const [newsStatusFilter, setNewsStatusFilter] = useState("all"); // "all", "disponible", "termine"

  // États pour les listes de valeurs uniques pour les filtres d'offres d'emploi
  const [uniquePostTypes, setUniquePostTypes] = useState([]);
  const [uniqueContractTypes, setUniqueContractTypes] = useState([]);

  // États pour les listes de valeurs uniques pour les filtres d'opportunités d'affaires
  // (plus besoin de pays, secteurs, villes - couverts par la recherche)

  // États pour les listes de valeurs uniques pour les filtres du fil d'actualités
  const [uniqueNewsCategories, setUniqueNewsCategories] = useState([]);
  const [uniqueOppoTypes, setUniqueOppoTypes] = useState([]);

  // État pour contrôler l'affichage du panneau de filtres
  const [showFilters, setShowFilters] = useState(false);
  const [showOppoFilters, setShowOppoFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const observer = useRef();
  const limit = 10; // Nombre de posts à charger à chaque fois

  const tabTypes = ["publicites", "offres-emploi", "opportunites-affaires"];

  // Fonction pour extraire les valeurs uniques pour les filtres
  const extractUniqueValues = useCallback((posts) => {
    if (!posts || posts.length === 0) return;

    const jobPosts = posts.filter((post) => post.type === "offres-emploi");
    const oppoPosts = posts.filter(
      (post) => post.type === "opportunites-affaires"
    );
    const newsPosts = posts.filter(
      (post) => post.type === "publicites" || post.type === "annonces"
    );

    // Extraire les valeurs uniques pour les offres d'emploi
    if (jobPosts.length > 0) {
      // Extraire les types de contrat uniques
      const contractTypes = [
        "CDI", "CDD", "Stage", "Freelance", "Temps partiel", "Non défini"
      ];
      setUniqueContractTypes(contractTypes);
    }

    // Extraire les valeurs uniques pour les opportunités d'affaires
    if (oppoPosts.length > 0) {
      // Extraire les types d'opportunités uniques
      const oppoTypes = [
        ...new Set(oppoPosts.map((post) => post.post_type).filter(Boolean)),
      ];
      setUniqueOppoTypes(oppoTypes);
    }

    // Extraire les valeurs uniques pour le fil d'actualités
    if (newsPosts.length > 0) {
      // Extraire les catégories uniques
      const newsCategories = [
        ...new Set(
          newsPosts
            .map((post) => post.categorie || post.autre_categorie)
            .filter(Boolean)
        ),
      ];
      setUniqueNewsCategories(newsCategories);
    }
  }, []);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setPostTypeFilter("");
    setContractTypeFilter("");
    setSearchQuery("");
    setJobFilter("all");
  };

  // Fonction pour réinitialiser les filtres des opportunités d'affaires
  const resetOppoFilters = () => {
    setOppoTypeFilter("");
    setOppoDateFilter("");
    setSearchQuery("");
    setJobFilter("all");
  };

  // Fonction pour réinitialiser les filtres du fil d'actualités
  const resetNewsFilters = () => {
    setNewsTypeFilter("");
    setNewsCategoryFilter("");
    setNewsDeliveryFilter("");
    setNewsStatusFilter("all");
    setSearchQuery("");
  };

  // Fonction pour charger les offres d'emploi avec pagination backend
  const fetchJobOffersWithPagination = useCallback(async (page, rowsPerPage) => {
    try {
      setLoadingJobOffers(true);
      
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        params: {
          type: 'offres-emploi',
          page: page + 1, // Material-UI utilise 0-based, backend 1-based
          limit: rowsPerPage,
          search: searchQuery || undefined,
        },
        timeout: 10000,
      };

      // Ajouter les filtres des offres d'emploi
      if (postTypeFilter) config.params.type_offre = postTypeFilter;
      if (contractTypeFilter) config.params.type_contrat = contractTypeFilter;
      if (jobFilter !== "all") config.params.statut = jobFilter;

      const response = await axios.get('/api/feed', config);
      
      // Mettre à jour les publications avec les offres d'emploi paginées
      const jobOffers = response.data.posts || [];
      
      // Filtrer les posts existants pour ne garder que les offres d'emploi
      setPosts(prevPosts => {
        const otherPosts = prevPosts.filter(post => post.type !== 'offres-emploi');
        return [...otherPosts, ...jobOffers];
      });
      
      setJobOffersTotal(response.data.total || jobOffers.length);
     
    } catch (err) {
      console.error("Erreur lors du chargement des offres d'emploi:", err);
      setError("Erreur lors du chargement des offres d'emploi");
    } finally {
      setLoadingJobOffers(false);
    }
  }, [searchQuery, postTypeFilter, contractTypeFilter, jobFilter]);

  // Effet optimisé pour les offres d'emploi (un seul effet pour tout gérer)
  useEffect(() => {
    if (activeTab === 1) { // Onglet offres d'emploi
      fetchJobOffersWithPagination(jobOffersPage, jobOffersRowsPerPage);
    }
  }, [jobOffersPage, jobOffersRowsPerPage, activeTab, fetchJobOffersWithPagination]);

  // Effet pour réinitialiser la page quand les filtres changent (sans appeler l'API)
  const filterDependencies = [searchQuery, postTypeFilter, contractTypeFilter, jobFilter];
  const prevFilterRef = useRef(filterDependencies);
  
  useEffect(() => {
    if (activeTab === 1) {
      // Vérifier si les filtres ont changé
      const filtersChanged = filterDependencies.some((dep, index) => dep !== prevFilterRef.current[index]);
      
      if (filtersChanged) {
        setJobOffersPage(0); // Réinitialiser la page seulement
        prevFilterRef.current = filterDependencies;
      }
    }
  }, filterDependencies.concat([activeTab]));

  // Fonctions pour gérer la pagination des offres d'emploi
  const handleJobOffersPageChange = (event, newPage) => {
    setJobOffersPage(newPage);
  };

  const handleJobOffersRowsPerPageChange = (event) => {
    setJobOffersRowsPerPage(parseInt(event.target.value, 10));
    setJobOffersPage(0); // Revenir à la première page
  };

  // Fonction pour charger les opportunités d'affaires avec pagination backend
  const fetchOppoWithPagination = useCallback(async (page, rowsPerPage) => {
    try {
      setLoadingOppo(true);
      
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        params: {
          type: 'opportunites-affaires',
          page: page + 1, // Material-UI utilise 0-based, backend 1-based
          limit: rowsPerPage,
          search: searchQuery || undefined,
        },
        timeout: 10000,
      };

      // Ajouter les filtres des opportunités d'affaires
      if (oppoTypeFilter) config.params.type_opportunite = oppoTypeFilter;
      if (oppoDateFilter) {
        config.params.date_limite = oppoDateFilter;
      }
      if (jobFilter !== "all") config.params.statut = jobFilter;

      const response = await axios.get('/api/feed', config);
      
      // Mettre à jour les publications avec les opportunités paginées
      const oppoPosts = response.data.posts || [];
      
      // Filtrer les posts existants pour ne garder que les opportunités
      setPosts(prevPosts => {
        const otherPosts = prevPosts.filter(post => post.type !== 'opportunites-affaires');
        return [...otherPosts, ...oppoPosts];
      });
      
      setOppoTotal(response.data.total || oppoPosts.length);
     
    } catch (err) {
      console.error("Erreur lors du chargement des opportunités d'affaires:", err);
      setError("Erreur lors du chargement des opportunités d'affaires");
    } finally {
      setLoadingOppo(false);
    }
  }, [searchQuery, oppoTypeFilter, oppoDateFilter, jobFilter]);

  // Effet optimisé pour les opportunités d'affaires (un seul effet pour tout gérer)
  useEffect(() => {
    if (activeTab === 2) { // Onglet opportunités d'affaires
      fetchOppoWithPagination(oppoPage, oppoRowsPerPage);
    }
  }, [oppoPage, oppoRowsPerPage, activeTab, fetchOppoWithPagination]);

  // Effet pour réinitialiser la page quand les filtres d'opportunités changent (sans appeler l'API)
  const oppoFilterDependencies = [searchQuery, oppoTypeFilter, oppoDateFilter, jobFilter];
  const prevOppoFilterRef = useRef(oppoFilterDependencies);
  
  useEffect(() => {
    if (activeTab === 2) {
      // Vérifier si les filtres ont changé
      const filtersChanged = oppoFilterDependencies.some((dep, index) => dep !== prevOppoFilterRef.current[index]);
      
      if (filtersChanged) {
        setOppoPage(0); // Réinitialiser la page seulement
        prevOppoFilterRef.current = oppoFilterDependencies;
      }
    }
  }, oppoFilterDependencies.concat([activeTab]));

  // Fonctions pour gérer la pagination des opportunités d'affaires
  const handleOppoPageChange = (event, newPage) => {
    setOppoPage(newPage);
  };

  const handleOppoRowsPerPageChange = (event) => {
    setOppoRowsPerPage(parseInt(event.target.value, 10));
    setOppoPage(0); // Revenir à la première page
  };
  const fetchPosts = useCallback(
    async (reset = false, retryCount = 0) => {
      try {
        if (!hasMore && !reset) return;

        // Utiliser loadingMore pour le chargement infini, loading pour le chargement initial
        if (reset) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        // Configuration pour la requête
        const config = {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          params: {
            type: tabTypes[activeTab],
            last_id: reset ? 0 : lastId,
            limit: limit,
            search: searchQuery || undefined,
          },
          // Timeout plus court pour une meilleure réactivité
          timeout: 10000,
        };

        // Ajouter les paramètres de filtre en fonction de l'onglet actif
        if (activeTab === 0) {
          // Publicités
          if (newsTypeFilter) config.params.type_publication = newsTypeFilter;
          if (newsCategoryFilter) config.params.categorie = newsCategoryFilter;
          if (newsDeliveryFilter)
            config.params.besoin_livreurs = newsDeliveryFilter;
          if (newsStatusFilter !== "all")
            config.params.statut = newsStatusFilter;
        } else if (activeTab === 1) {
          // Offres d'emploi
          if (postTypeFilter) config.params.type_offre = postTypeFilter;
          if (contractTypeFilter) config.params.type_contrat = contractTypeFilter;
          if (jobFilter !== "all") config.params.statut = jobFilter;
        } else if (activeTab === 2) {
          // Opportunités d'affaires
          if (oppoTypeFilter) config.params.type_opportunite = oppoTypeFilter;
          if (oppoDateFilter) config.params.date_limite = oppoDateFilter;
        }

        const response = await axios.get("/api/feed", config);

        const newPosts = response.data.posts || [];

        if (reset) {
          setPosts(newPosts);
          // Extraire les valeurs uniques pour les filtres
          extractUniqueValues(newPosts);
        } else {
          setPosts((prevPosts) => {
            // Filtrer les doublons en utilisant un Map pour garantir l'unicité des IDs
            const postsMap = new Map();

            // Ajouter d'abord les posts existants au Map
            prevPosts.forEach((post) => {
              postsMap.set(post.id, post);
            });

            // Ajouter ensuite les nouveaux posts, en écrasant les anciens si même ID
            newPosts.forEach((post) => {
              postsMap.set(post.id, post);
            });

            // Convertir le Map en tableau
            const combinedPosts = Array.from(postsMap.values());

            // Extraire les valeurs uniques pour les filtres
            extractUniqueValues(combinedPosts);
            return combinedPosts;
          });
        }

        if (newPosts.length > 0) {
          setLastId(newPosts[newPosts.length - 1].id);
        }

        setHasMore(response.data.has_more);
        setLoading(false);
        setLoadingMore(false); // Réinitialiser le chargement infini
      } catch (err) {
        console.error("Erreur lors du chargement des publications:", err);

        // Vérifier si l'erreur est liée aux ressources insuffisantes ou au timeout
        const isResourceError =
          err.message &&
          (err.message.includes("ERR_INSUFFICIENT_RESOURCES") ||
            err.message.includes("ERR_NETWORK"));

        const isTimeoutError =
          err.code === "ECONNABORTED" ||
          (err.message && err.message.includes("timeout"));

        // Mécanisme de retry limité (maximum 2 tentatives et pas de retry pour les erreurs de ressources)
        // Pour les erreurs de timeout, on fait quand même une tentative mais avec un délai plus long
        if (retryCount < 2 && (!isResourceError || isTimeoutError)) {
          // Utiliser un délai plus long entre les tentatives
          setTimeout(() => {
            fetchPosts(reset, retryCount + 1);
          }, 2000 * (retryCount + 1));
          return;
        }

        // Message d'erreur plus détaillé
        if (err.response) {
          // Erreur de réponse du serveur (ex: 500)
          setError(
            `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`
          );
        } else if (isTimeoutError) {
          // Erreur spécifique au timeout
          setError(
            "Le temps de réponse du serveur est trop long. Veuillez réessayer dans quelques instants."
          );
        } else if (isResourceError) {
          // Erreur spécifique aux ressources insuffisantes
          setError(
            "Le serveur est actuellement surchargé. Veuillez réessayer dans quelques instants."
          );
        } else if (err.request) {
          // Pas de réponse reçue du serveur
          setError(
            "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
          );
        } else {
          // Erreur lors de la configuration de la requête
          setError("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
        setLoading(false);
        setLoadingMore(false); // Réinitialiser le chargement infini en cas d'erreur
      }
    },
    [
      activeTab,
      hasMore,
      lastId,
      limit,
      tabTypes,
      extractUniqueValues,
      searchQuery,
      // Filtres pour le fil d'actualités
      newsTypeFilter,
      newsCategoryFilter,
      newsDeliveryFilter,
      newsStatusFilter,
      // Filtres pour les offres d'emploi
      postTypeFilter,
      contractTypeFilter,
      jobFilter,
      // Filtres pour les opportunités d'affaires
      oppoTypeFilter,
      oppoDateFilter,
    ]
  );

  const [loadingPages, setLoadingPages] = useState(false);

  // Initialiser le chargement des posts et des pages
  useEffect(() => {
    // Utiliser une variable pour suivre si le composant est monté
    let isMounted = true;

    const initFetch = async () => {
      if (isMounted) {
        setLoadingPages(true);
        setPosts([]);
        setLastId(0);
        setHasMore(true);

        // Ajouter un petit délai pour éviter les appels simultanés
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted) {
          // Charger les posts et les pages en parallèle
          await Promise.all([
            fetchPosts(true),
          ]);

          setLoadingPages(false);
        }
      }
    };

    initFetch();

    // Nettoyage lors du démontage
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Ne dépendre que de activeTab pour éviter les boucles infinies

  // Configuration de l'intersection observer pour le défilement infini
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return; // Bloquer si déjà en chargement
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          // Se déclencher quand l'élément est visible à 50% (plus tôt pour un chargement plus fluide)
          if (entries[0].isIntersecting && hasMore) {
            fetchPosts();
          }
        },
        {
          // Se déclencher plus tôt pour un chargement plus fluide
          threshold: 0.5,
          // Marge pour déclencher avant que l'utilisateur n'arrive complètement en bas
          rootMargin: '100px',
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchPosts]
  );

  // Gérer l'action "J'aime"
  const handleLike = async (postId, type) => {
    try {
      // Configuration pour la requête
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 8000, // Timeout raisonnable pour cette action simple
      };

      const response = await axios.post(
        `/api/${type}/${postId}/like`,
        {},
        config
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: response.data.liked,
                likes_count: response.data.likes_count,
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          is_liked: response.data.liked,
          likes_count: response.data.likes_count,
        });
      }
    } catch (err) {
      console.error("Erreur lors de l'action \"J'aime\":", err);

      // Gérer l'erreur silencieusement sans alerter l'utilisateur
      // pour une expérience utilisateur plus fluide
      if (err.response && err.response.status === 401) {
        // L'utilisateur n'est pas authentifié
        alert("Veuillez vous connecter pour aimer cette publication.");
      } else if (err.response && err.response.status === 429) {
        // Trop de requêtes
        console.warn(
          "Trop de requêtes. Veuillez patienter avant de réessayer."
        );
      }
      // Pour les autres erreurs, on ne montre pas d'alerte pour ne pas perturber l'expérience utilisateur
    }
  };

  // Gérer l'ajout d'un commentaire
  const handleAddComment = async (postId, content, type) => {
    try {
      const response = await axios.post(`/api/${type}/${postId}/comment`, {
        content,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: response.data.comments_count,
                comments: [response.data.comment, ...post.comments].slice(0, 3), // Garder les 3 commentaires les plus récents
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments_count: response.data.comments_count,
          comments: [response.data.comment, ...selectedPost.comments],
        });
      }

      return response.data.comment;
    } catch (err) {
      console.error("Erreur lors de l'ajout d'un commentaire:", err);
      throw err;
    }
  };

  // Gérer la suppression d'un commentaire
  const handleDeleteComment = async (commentId, postId, type) => {
    try {
      const response = await axios.delete(`/api/${type}/comments/${commentId}`);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: response.data.comments_count,
                comments: post.comments.filter(
                  (comment) => comment.id !== commentId
                ),
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments_count: response.data.comments_count,
          comments: selectedPost.comments.filter(
            (comment) => comment.id !== commentId
          ),
        });
      }
    } catch (err) {
      console.error("Erreur lors de la suppression d'un commentaire:", err);
    }
  };

  // Gérer le partage d'un post
  const handleShare = async (type, postId, platform) => {
    try {
      const response = await axios.post(`/api/${type}/${postId}/share`, {
        platform,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                shares_count: response.data.shares_count,
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          shares_count: response.data.shares_count,
        });
      }

      // Ouvrir le lien de partage approprié
      let shareUrl = "";
      const postUrl = `${window.location.origin}/dashboard/news-feed/post/${postId}`;
      const text = "Découvrez cette publication intéressante sur SOLIFIN!";

      switch (platform) {
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            postUrl
          )}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(postUrl)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            postUrl
          )}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(
            text + " " + postUrl
          )}`;
          break;
        default:
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank");
      }
    } catch (err) {
      console.error("Erreur lors du partage:", err);
    }
  };

  // Ouvrir le modal de détail d'un post
  const openPostDetail = async (postId, type) => {
    try {
      // Afficher un indicateur de chargement
      setLoading(true);

      // Configuration pour la requête
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 10000, // Augmenter le timeout pour éviter les erreurs de réseau
      };

      const response = await axios.get(
        `/api/${type}/${postId}/details`,
        config
      );
      setSelectedPost(response.data.post);
      setIsPostDetailModalOpen(true);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des détails de la publication:",
        err
      );

      // Message d'erreur plus détaillé
      let errorMessage = "Impossible de charger les détails de la publication.";

      if (err.response) {
        errorMessage = `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`;
      } else if (err.request) {
        errorMessage =
          "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto">
        <Tab.Group
          selectedIndex={activeTab}
          onChange={(index) => {
            setActiveTab(index);
            // Réinitialiser les filtres appropriés lors du changement d'onglet
            if (index === 0) {
              // Si on passe à l'onglet Publicités, réinitialiser les filtres des autres onglets
              resetFilters();
              resetOppoFilters();
            } else if (index === 1) {
              // Si on passe à l'onglet Offres d'emploi, réinitialiser les filtres des autres onglets
              resetNewsFilters();
              resetOppoFilters();
            } else if (index === 2) {
              // Si on passe à l'onglet Opportunités, réinitialiser les filtres des autres onglets
              resetNewsFilters();
              resetFilters();
            } else {
              // Pour les autres onglets, réinitialiser tous les filtres
              resetNewsFilters();
              resetFilters();
              resetOppoFilters();
            }

            // Recharger les publications avec les nouveaux paramètres
            fetchPosts(true);
          }}
        >
        {/* {showTabs && (
          <Tab.List className="flex space-x-2 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-2 mb-8 shadow-lg backdrop-blur-sm">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-300 transform",
                  "flex items-center justify-center",
                  selected
                    ? "bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 shadow-lg text-primary-600 dark:text-white scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-white hover:scale-102"
                )
              }
            >
              <NewspaperIcon className="h-5 w-5 mr-2" />
              <span>Publicités</span>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-300 transform",
                  "flex items-center justify-center",
                  selected
                    ? "bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 shadow-lg text-primary-600 dark:text-white scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-white hover:scale-102"
                )
              }
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              <span>Offres d'emploi</span>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-xl py-3 px-4 text-sm font-semibold leading-5 transition-all duration-300 transform",
                  "flex items-center justify-center",
                  selected
                    ? "bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 shadow-lg text-primary-600 dark:text-white scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-white hover:scale-102"
                )
              }
            >
              <LightBulbIcon className="h-5 w-5 mr-2" />
              <span>Opportunités</span>
            </Tab>
          </Tab.List>
        )} */}

        <Tab.Panels className="mt-2">
          {/* Premier onglet: Fil d'actualité */}
          <Tab.Panel
            className={classNames(
              "rounded-xl",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none"
            )}
          >
            {/* Header */}
            <div className={`${isMobile ? "px-3" : "px-6"} ${isMobile ? "mb-6" : "mb-8"}`}>
              <div className={`flex ${isMobile ? "flex-col space-y-4" : "items-center justify-between"}`}>
                {/* Bouton filtre */}
                <div className={`mt-2${isMobile ? "flex" : ""}`}>
                  <button
                    onClick={() => setShowNewsFilters(!showNewsFilters)}
                    className={`relative group ${isMobile ? "px-5 py-2.5" : "px-6 py-3"} rounded-full text-sm font-medium transition-all duration-500 ${
                      showNewsFilters
                        ? "bg-gray-900 text-white shadow-2xl shadow-black/20"
                        : "bg-white text-gray-700 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-900/50"
                    } border border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className={`w-4 h-4 transition-transform duration-500 ${showNewsFilters ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>{showNewsFilters ? 'Filtrage actif' : 'Filtrer'}</span>
                    </div>
                    {showNewsFilters && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Panneau de filtres */}
            {showNewsFilters && (
              <div className={`${isMobile ? "px-3" : "px-6"} mb-8`}>
                <div className={`relative overflow-hidden rounded-2xl transition-all duration-700 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-gray-800/50' 
                    : 'bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 border border-gray-200/50'
                } backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30`}>
                  
                  {/* Header du panneau */}
                  <div className={`px-6 py-4 border-b ${
                    isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Filtres avancés</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Affinez votre recherche</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setNewsStatusFilter("all");
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                        }`}
                      >
                        Tout effacer
                      </button>
                    </div>
                  </div>

                  {/* Contenu des filtres */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Recherche */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Recherche
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Mots-clés..."
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                              isDarkMode
                                ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:bg-gray-800/80"
                                : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:bg-white"
                            }`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statut
                        </label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setNewsStatusFilter("all")}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                              newsStatusFilter === "all"
                                ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            Tous
                          </button>
                          <button
                            onClick={() => setNewsStatusFilter("available")}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                              newsStatusFilter === "available"
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            Actifs
                          </button>
                          <button
                            onClick={() => setNewsStatusFilter("unavailable")}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                              newsStatusFilter === "unavailable"
                                ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            Terminés
                          </button>
                        </div>
                      </div>

                      {/* Actions rapides */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowNewsFilters(false)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                              isDarkMode
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panneau de filtres avancés pour le fil d'actualités */}
            {showNewsFilters && (
              <div
                className={`p-6 mb-6 rounded-2xl shadow-xl backdrop-blur-sm transform transition-all duration-500 animate-in slide-in-from-top-2 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-gray-700/50 shadow-gray-900/50"
                    : "bg-gradient-to-br from-white/95 to-gray-50/95 border border-gray-200/50 shadow-gray-200/50"
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3
                    className={`text-lg font-bold bg-gradient-to-r ${
                      isDarkMode 
                        ? "from-blue-400 to-purple-400 text-transparent bg-clip-text" 
                        : "from-blue-600 to-purple-600 text-transparent bg-clip-text"
                    }`}
                  >
                    Filtres avancés
                  </h3>
                  <button
                    className={`text-sm px-4 py-2 rounded-xl flex items-center font-medium transition-all duration-300 transform hover:scale-105 ${
                      isDarkMode
                        ? "text-primary-400 hover:text-primary-300 hover:bg-gray-700/50 border border-gray-600/50"
                        : "text-primary-600 hover:text-primary-700 hover:bg-gray-100/50 border border-gray-300/50"
                    }`}
                    onClick={resetNewsFilters}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Filtre par type */}
                  <div className="group">
                    <label
                      className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-200 group-focus-within:text-primary-400" : "text-gray-700 group-focus-within:text-primary-600"
                      }`}
                    >
                      Type
                    </label>
                    <div className="relative">
                      <select
                        className={`block w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-300 transform focus:scale-[1.02] focus:shadow-lg ${
                          isDarkMode
                            ? "bg-gray-700/50 border-gray-600 text-white focus:border-primary-500 focus:bg-gray-700/80 focus:shadow-primary-500/20"
                            : "bg-white/80 border-gray-300 text-gray-900 focus:border-primary-500 focus:bg-white focus:shadow-primary-500/20"
                        }`}
                        value={newsTypeFilter}
                        onChange={(e) => setNewsTypeFilter(e.target.value)}
                      >
                        <option value="">Tous les types</option>
                        <option value="publicite">Publicité</option>
                        <option value="annonce">Annonce</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                      {newsTypeFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-10 flex items-center group"
                          onClick={() => setNewsTypeFilter("")}
                          title="Effacer la sélection"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors duration-200" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtre par catégorie */}
                  <div className="group">
                    <label
                      className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-200 group-focus-within:text-primary-400" : "text-gray-700 group-focus-within:text-primary-600"
                      }`}
                    >
                      Catégorie
                    </label>
                    <div className="relative">
                      <select
                        className={`block w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-300 transform focus:scale-[1.02] focus:shadow-lg ${
                          isDarkMode
                            ? "bg-gray-700/50 border-gray-600 text-white focus:border-primary-500 focus:bg-gray-700/80 focus:shadow-primary-500/20"
                            : "bg-white/80 border-gray-300 text-gray-900 focus:border-primary-500 focus:bg-white focus:shadow-primary-500/20"
                        }`}
                        value={newsCategoryFilter}
                        onChange={(e) => setNewsCategoryFilter(e.target.value)}
                      >
                        <option value="">Toutes les catégories</option>
                        {uniqueNewsCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                      {newsCategoryFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-10 flex items-center group"
                          onClick={() => setNewsCategoryFilter("")}
                          title="Effacer la sélection"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors duration-200" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtre par besoin de livreurs */}
                  <div className="group">
                    <label
                      className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-200 group-focus-within:text-primary-400" : "text-gray-700 group-focus-within:text-primary-600"
                      }`}
                    >
                      Besoin de livreurs
                    </label>
                    <div className="relative">
                      <select
                        className={`block w-full px-4 py-3 pr-10 rounded-xl border-2 transition-all duration-300 transform focus:scale-[1.02] focus:shadow-lg ${
                          isDarkMode
                            ? "bg-gray-700/50 border-gray-600 text-white focus:border-primary-500 focus:bg-gray-700/80 focus:shadow-primary-500/20"
                            : "bg-white/80 border-gray-300 text-gray-900 focus:border-primary-500 focus:bg-white focus:shadow-primary-500/20"
                        }`}
                        value={newsDeliveryFilter}
                        onChange={(e) => setNewsDeliveryFilter(e.target.value)}
                      >
                        <option value="">Tous</option>
                        <option value="OUI">Oui</option>
                        <option value="NON">Non</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                      {newsDeliveryFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-10 flex items-center group"
                          onClick={() => setNewsDeliveryFilter("")}
                          title="Effacer la sélection"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors duration-200" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des publications */}
            <div className="space-y-6">
              {error && (
                <div
                  className={`p-6 rounded-lg text-center ${
                    isDarkMode
                      ? "bg-gray-800 text-red-300"
                      : "bg-white text-red-500"
                  }`}
                >
                  <p className="text-lg font-medium">{error}</p>
                  <button
                    onClick={() => fetchPosts(true, 0)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Réessayer
                  </button>
                </div>
              )}

              {/* Filtrer les publications en fonction des critères de recherche et des filtres */}
              {(() => {
                // Filtrer les publications en fonction des critères de recherche et des filtres
                let filteredPosts = [...posts];

                // Filtrage pour le premier onglet (Publicités)
                if (activeTab === 0) {
                  // Filtrer par texte de recherche
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filteredPosts = filteredPosts.filter(
                      (post) =>
                        (post.titre &&
                          post.titre.toLowerCase().includes(query)) ||
                        (post.description &&
                          post.description.toLowerCase().includes(query)) ||
                        (post.contenu &&
                          post.contenu.toLowerCase().includes(query)) ||
                        (post.pays &&
                          post.pays.toLowerCase().includes(query)) ||
                        (post.ville &&
                          post.ville.toLowerCase().includes(query)) ||
                        (post.categorie &&
                          post.categorie.toLowerCase().includes(query)) ||
                        (post.autre_categorie &&
                          post.autre_categorie.toLowerCase().includes(query)) ||
                        (post.sous_categorie &&
                          post.sous_categorie.toLowerCase().includes(query)) ||
                        (post.autre_sous_categorie &&
                          post.autre_sous_categorie.toLowerCase().includes(query))
                    );
                  }

                  // Filtrer par type (publicité ou annonce)
                  if (newsTypeFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.type === newsTypeFilter
                    );
                  }

                  // Filtrer par catégorie
                  if (newsCategoryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.categorie === newsCategoryFilter
                    );
                  }

                  // Filtrer par besoin de livreurs
                  if (newsDeliveryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.besoin_livreurs === newsDeliveryFilter
                    );
                  }

                  // Filtrer par statut
                  if (newsStatusFilter !== "all") {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.etat === newsStatusFilter
                    );
                  }
                }

                // Afficher un message si aucune publication ne correspond aux critères
                if (filteredPosts.length === 0 && !loading) {
                  return (
                    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 border border-gray-700/50"
                        : "bg-gradient-to-br from-white/70 via-gray-50/70 to-white/70 border border-gray-200/50"
                    } backdrop-blur-xl shadow-xl shadow-black/10 dark:shadow-black/30`}>
                      
                      {/* Header décoratif */}
                      <div className={`px-8 py-6 border-b ${
                        isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                      }`}>
                        <div className="flex items-center justify-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400' 
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500'
                          }`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0L20.808 7.192a4 4 0 00-5.656-5.656L9.172 7.757a4 4 0 000 5.656l-1.414 1.415a6 6 0 11-8.486-8.486l4.95-4.95a6 6 0 018.485 0l5.657 5.657a6 6 0 010 8.485l-1.414 1.414a5 5 0 01-7.071-7.07l1.414-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Contenu principal */}
                      <div className="px-8 py-8 text-center">
                        <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-3">
                          Aucune publication trouvée
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          Essayez d'ajuster vos filtres ou votre recherche pour découvrir plus de contenu
                        </p>
                        
                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setNewsStatusFilter("all");
                            }}
                            className={`group px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                              isDarkMode
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-600"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Réinitialiser</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setShowNewsFilters(true)}
                            className={`group px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                              isDarkMode
                                ? "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-700/40"
                                : "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-600/40"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                              <span>Ajuster les filtres</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Footer décoratif */}
                      <div className={`px-8 py-4 border-t ${
                        isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                      }`}>
                        <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Conseil
                          </span>
                          <span>•</span>
                          <span>Élargissez votre recherche</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Si aucune publication n'est disponible (sans filtres)
                if (posts.length === 0 && !loading) {
                  return (
                    <div
                      className={`p-6 rounded-lg text-center ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      <p className="text-lg font-medium">
                        Aucune publication disponible
                      </p>
                      <p className="mt-2">
                        Soyez le premier à partager quelque chose !
                      </p>
                      <button
                        onClick={() => navigate("/dashboard/my-page")}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Créer une publication
                      </button>
                    </div>
                  );
                }

                // Afficher les publications filtrées
                return filteredPosts.map((post, index) => {
                  // Si c'est le dernier élément, ajouter la ref pour l'infinite scroll
                  if (index === posts.length - 1) {
                    return (
                      <div key={post.id} ref={lastPostElementRef} className={isMobile ? "flex justify-center" : ""}>
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onComment={handleAddComment}
                          onDeleteComment={handleDeleteComment}
                          onShare={handleShare}
                          onViewDetails={() =>
                            openPostDetail(post.id, post.type)
                          }
                          isDarkMode={isDarkMode}
                          user={user}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={post.id} className={isMobile ? "flex justify-center" : ""}>
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onComment={handleAddComment}
                          onDeleteComment={handleDeleteComment}
                          onShare={handleShare}
                          onViewDetails={() => openPostDetail(post.id, post.type)}
                          isDarkMode={isDarkMode}
                          user={user}
                        />
                      </div>
                    );
                  }
                });
              })()}

              {/* Indicateur de chargement infini */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}

              {loading && (
                <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Deuxième onglet: Offres d'emploi */}
          <Tab.Panel
            className={classNames(
              "rounded-xl",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none"
            )}
          >
            {/* Header responsive pour mobile */}
            <div>
              {/* Titre et description responsive */}
              <div>
                <p className={`mt-1 ${isMobile ? "text-xs" : "text-sm"} ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Découvrez les dernières opportunités professionnelles
                </p>
              </div>

              {/* Avis aux candidats responsive */}
              <div className={`p-3 rounded-lg ${
                isDarkMode ? "bg-yellow-900/30 text-yellow-200" : "bg-yellow-50 text-yellow-800"
              }`}>
                <p className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}>AVIS AUX CANDIDATS</p>
                <p className={`mt-1 ${isMobile ? "text-xs" : "text-sm"}`}>
                  <span className="font-semibold">
                    NE PAS ENVOYER DE L'ARGENT
                  </span>{" "}
                  sous quelque forme que ce soit (cash, virement, transfert Western Union, mobile money,...). 
                  Merci de signaler immédiatement toute demande suspecte.
                </p>
              </div>
            </div>

            {/* Header minimaliste et élégant pour les offres - Responsive */}
            <div className={`mt-4 ${isMobile ? "px-3" : "px-6"} ${isMobile ? "mb-6" : "mb-8"} max-w-full overflow-hidden`}>
              <div className={`flex ${isMobile ? "flex-col space-y-4" : "items-center justify-between"}`}>
                {!isMobile && (<div className={`${isMobile ? "text-center" : ""}`}>
                  <h1 
                    style={{fontWeight : 'bold'}}
                    className="font-light text-gray-900 dark:text-white">
                    Offres d'emploi
                  </h1>
                </div>)
                }
                
                {/* Bouton filtre élégant - Responsive */}
                <div className={`${isMobile ? "flex" : ""}`}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`relative group ${isMobile ? "px-5 py-2.5" : "px-6 py-3"} rounded-full text-sm font-medium transition-all duration-500 ${
                      showFilters
                        ? "bg-gray-900 text-white shadow-2xl shadow-black/20"
                        : "bg-white text-gray-700 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-900/50"
                    } border border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className={`w-4 h-4 transition-transform duration-500 ${showFilters ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>{showFilters ? 'Filtrage actif' : 'Filtrer'}</span>
                    </div>
                    {showFilters && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Panneau de filtres ultra-moderne pour les offres - Responsive */}
            {showFilters && (
              <div className={`${isMobile ? "px-3" : "px-6"} mb-8 max-w-full overflow-hidden`}>
                <div className={`relative overflow-hidden rounded-2xl transition-all duration-700 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-gray-800/50' 
                    : 'bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 border border-gray-200/50'
                } backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30`}>
                  
                  {/* Header du panneau - Responsive */}
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  }`}>
                    <div className={`flex ${isMobile ? "flex-col space-y-3" : "items-center justify-between"}`}>
                      <div className={`flex items-center space-x-3 ${isMobile ? "justify-center" : ""}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className={`${isMobile ? "text-center" : ""}`}>
                          <h3 className={`font-semibold ${isMobile ? "text-sm" : "text-base"} text-gray-900 dark:text-white`}>Filtres des offres</h3>
                          <p className={`text-xs text-gray-500 dark:text-gray-400 ${isMobile ? "mt-1" : ""}`}>Affinez votre recherche d'emploi</p>
                        </div>
                      </div>
                      <div className={`${isMobile ? "flex justify-center" : ""}`}>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setJobFilter("all");
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300 ${
                            isDarkMode
                              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                          }`}
                        >
                          Tout effacer
                        </button>
                      </div>
                    </div>
                  </div>
            
                  {/* Contenu des filtres - Responsive */}
                  <div className={`p-4 ${isMobile ? "space-y-4" : ""} max-w-full overflow-x-hidden`}>
                    <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-3 gap-6"}`}>
                      
                      {/* Recherche - Responsive */}
                      <div className="space-y-2">
                        <label className={`text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isMobile ? "text-center" : ""}`}>
                          Recherche
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Mots-clés..."
                            className={`w-full ${isMobile ? "px-3 py-2" : "px-4 py-3"} rounded-xl border transition-all duration-300 ${
                              isDarkMode
                                ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:bg-gray-800/80"
                                : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:bg-white"
                            }`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
            
                      {/* Statut - Responsive */}
                      <div className="space-y-2">
                        <label className={`text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isMobile ? "text-center" : ""}`}>
                          Statut
                        </label>
                        <div className={`${isMobile ? "space-y-2" : "flex space-x-2"}`}>
                          <button
                            onClick={() => setJobFilter("all")}
                            className={`${isMobile ? "w-full" : "flex-1"} ${isMobile ? "px-3 py-2" : "px-4 py-3"} rounded-xl text-sm font-medium transition-all duration-300 ${
                              jobFilter === "all"
                                ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            Toutes
                          </button>
                          <button
                            onClick={() => setJobFilter("available")}
                            className={`${isMobile ? "w-full" : "flex-1"} ${isMobile ? "px-3 py-2" : "px-4 py-3"} rounded-xl text-sm font-medium transition-all duration-300 ${
                              jobFilter === "available"
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            Actives
                          </button>
                        </div>
                      </div>
            
                      {/* Actions rapides - Responsive */}
                      <div className="space-y-2">
                        <label className={`text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isMobile ? "text-center" : ""}`}>
                          Actions
                        </label>
                        <div className={`${isMobile ? "space-y-2" : "flex space-x-2"}`}>
                          <button
                            onClick={() => setShowFilters(false)}
                            className={`${isMobile ? "w-full" : "flex-1"} ${isMobile ? "px-3 py-2" : "px-4 py-3"} rounded-xl text-sm font-medium transition-all duration-300 ${
                              isDarkMode
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            Appliquer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panneau de filtres avancés */}
            {showFilters && (
              <div
                className={`p-4 mb-4 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {isMobile ? 'Avancés': 'Filtres avancés'}
                  </h3>
                  <button
                    className={`text-sm px-2 py-1 rounded ${
                      isDarkMode
                        ? "text-primary-400 hover:text-primary-300 hover:bg-gray-700"
                        : "text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                    }`}
                    onClick={resetFilters}
                  >
                    <span className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Réinitialiser les filtres
                    </span>
                  </button>
                </div>
            
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filtre par type de publication */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Type de publication
                    </label>
                    <div className="relative">
                      <select
                        className={`block w-full px-3 py-2 pr-8 rounded border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        value={postTypeFilter}
                        onChange={(e) => setPostTypeFilter(e.target.value)}
                      >
                        <option value="">Tous les types</option>
                        <option value="offre_emploi">Offre d'emploi</option>
                        <option value="appel_manifestation_interet">
                          Appel à manifestation d'intérêt
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                      {postTypeFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-8 flex items-center"
                          onClick={() => setPostTypeFilter("")}
                          title="Effacer la sélection"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
            
                  {/* Filtre par type de contrat */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Type de contrat
                    </label>
                    <div className="relative">
                      <select
                        className={`block w-full px-3 py-2 pr-8 rounded border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        value={contractTypeFilter}
                        onChange={(e) =>
                          setContractTypeFilter(e.target.value)
                        }
                      >
                        <option value="">Tous les contrats</option>
                        {uniqueContractTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                      {contractTypeFilter && (
                        <button
                          className="absolute inset-y-0 right-0 pr-8 flex items-center"
                          onClick={() => setContractTypeFilter("")}
                          title="Effacer la sélection"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            
                {/* Indicateurs de filtres actifs */}
                {(postTypeFilter ||
                  contractTypeFilter) && (
                  <div
                    className={`mt-6 pt-4 border-t ${
                      isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtres actifs:
                      </span>
                      {postTypeFilter && (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                            isDarkMode
                              ? "bg-gradient-to-r from-primary-600/20 to-primary-700/20 text-primary-300 border border-primary-600/30 hover:border-primary-500/50"
                              : "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300/50 hover:border-primary-400/50"
                          }`}
                        >
                          Type: {postTypeFilter === "offre_emploi" ? "Offre d'emploi" : "Appel à manifestation d'intérêt"}
                          <XMarkIcon
                            className="h-3 w-3 ml-2 cursor-pointer hover:text-red-500 transition-colors duration-200"
                            onClick={() => setPostTypeFilter("")}
                          />
                        </span>
                      )}
                      {contractTypeFilter && (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                            isDarkMode
                              ? "bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-blue-300 border border-blue-600/30 hover:border-blue-500/50"
                              : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300/50 hover:border-blue-400/50"
                          }`}
                        >
                          Contrat: {contractTypeFilter}
                          <XMarkIcon
                            className="h-3 w-3 ml-2 cursor-pointer hover:text-red-500 transition-colors duration-200"
                            onClick={() => setContractTypeFilter("")}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Options de tri et informations */}
            <div
              className={`flex flex-wrap justify-between items-center gap-3 p-4 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-1" />
                <span>Cliquez sur une offre pour voir les détails</span>
              </div>
            </div>

            {/* Tableau Material-UI des offres d'emploi avec pagination */}
            <Box sx={{ width: '100%' }}>
              {isMobile ? (
                // Vue cartes pour mobile
                <div className="space-y-4">
                  {posts
                    .filter((post) => post.type === "offres-emploi")
                    .map((post) => (
                      <div
                        key={post.id}
                        onClick={() => openPostDetail(post.id, post.type)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* Header de la carte */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  post.etat === 'available' ? 'bg-green-500' : 
                                  post.etat === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
                                }`}
                              />
                              <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {post.title}
                              </h3>
                            </div>
                            {post.reference && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Réf: {post.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Informations principales */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {post.company_name || "Non précisé"}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {post.pays || "Non précisé"}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {post.date_limite
                                ? new Date(post.date_limite).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Date non spécifiée"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-4">
                            {/* Actions sociales */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post.id, post.type);
                              }}
                              className={`flex items-center space-x-1 ${
                                post.is_liked ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={post.is_liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-xs">{post.likes_count || 0}</span>
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPostDetail(post.id, post.type);
                              }}
                              className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="text-xs">{post.comments_count || 0}</span>
                            </button>
                          </div>

                          {/* Bouton détails */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPostDetail(post.id, post.type);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                          >
                            Voir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                // Vue tableau pour desktop
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {loadingJobOffers && <LinearProgress />}
                  <Table>
                    <TableHead sx={{ backgroundColor: isDarkMode ? '#374151' : '#f9fafb' }}>
                      <TableRow>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Titre
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Organisme
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Pays
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Date de clôture
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {posts
                        .filter((post) => post.type === "offres-emploi")
                        .map((post) => (
                          <TableRow 
                            key={post.id}
                            sx={{ 
                              '&:hover': { backgroundColor: isDarkMode ? '#374151' : '#f9fafb' },
                              cursor: 'pointer'
                            }}
                            onClick={() => openPostDetail(post.id, post.type)}
                          >
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: post.etat === 'available' ? '#10b981' : 
                                                    post.etat === 'unavailable' ? '#ef4444' : '#f59e0b',
                                    mr: 1,
                                    mt: 1
                                  }}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                    {post.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {post.reference || "Réf. non précisée"}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              {post.company_name || "Non précisé"}
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              {post.pays || "Non précisé"}
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              {post.date_limite
                                ? new Date(post.date_limite).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Date non spécifiée"}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* Actions sociales */}
                                <Tooltip title="J'aime">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLike(post.id, post.type);
                                    }}
                                    sx={{ color: post.is_liked ? '#ef4444' : 'text.secondary' }}
                                  >
                                    {post.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                  </IconButton>
                                </Tooltip>
                                
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {post.likes_count || 0}
                                </Typography>

                                <Tooltip title="Commentaires">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPostDetail(post.id, post.type);
                                    }}
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    <CommentIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {post.comments_count || 0}
                                </Typography>

                                {/* Bouton détails */}
                                <Tooltip title="Voir les détails">
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPostDetail(post.id, post.type);
                                    }}
                                    sx={{ 
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      '&:hover': { backgroundColor: '#2563eb' }
                                    }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Pagination Material-UI */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={jobOffersTotal}
                rowsPerPage={jobOffersRowsPerPage}
                page={jobOffersPage}
                onPageChange={handleJobOffersPageChange}
                onRowsPerPageChange={handleJobOffersRowsPerPageChange}
                labelRowsPerPage={isMobile ? "" : "Lignes par page:"}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
                sx={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    color: isDarkMode ? '#ffffff' : '#000000'
                  },
                  '.MuiTablePagination-selectLabel': {
                    display: isMobile ? 'none' : 'block'
                  },
                  '.MuiTablePagination-toolbar': {
                    justifyContent: isMobile ? 'flex-start' : 'space-between',
                    paddingLeft: isMobile ? '16px' : '0'
                  },
                  '.MuiTablePagination-spacer': {
                    display: isMobile ? 'none' : 'block'
                  }
                }}
              />
            </Box>
          </Tab.Panel>

          {/* Troisième onglet: Opportunités d'affaires /partenariat et appel à projet */}
          <Tab.Panel
            className={classNames(
              "rounded-xl",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none"
            )}
          >
            {/* Barre de recherche et filtres */}
            <div
              className={`mb-6 rounded-lg overflow-hidden ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div
                className={`border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Opportunités d'affaires, partenariats et appels à projets
                </h2>
                <p
                  className={`mt-1 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Découvrez les dernières opportunités d'affaires et de
                  partenariats
                </p>
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    isDarkMode
                      ? "bg-yellow-900/30 text-yellow-200"
                      : "bg-yellow-50 text-yellow-800"
                  }`}
                >
                  <p className="text-sm font-medium">AVIS IMPORTANT</p>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">
                      VÉRIFIEZ LA LÉGITIMITÉ DES OFFRES
                    </span>{" "}
                    avant tout engagement. Assurez-vous de bien comprendre les
                    termes et conditions de chaque opportunité.
                  </p>

                </div>
                
                {/* Bouton filtre élégant - Responsive */}
                <div className={`mt-4 mb-3 ${isMobile ? "flex justify-center" : ""}`}>
                  <button
                    onClick={() => setShowOppoFilters(!showOppoFilters)}
                    className={`relative group ${isMobile ? "px-5 py-2.5" : "px-6 py-3"} rounded-full text-sm font-medium transition-all duration-500 ${
                      showOppoFilters
                        ? "bg-gray-900 text-white shadow-2xl shadow-black/20"
                        : "bg-white text-gray-700 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-900/50"
                    } border border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className={`w-4 h-4 transition-transform duration-500 ${showOppoFilters ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>{showOppoFilters ? 'Filtrage actif' : 'Filtrer'}</span>
                    </div>
                    {showOppoFilters && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres et recherche - Caché par défaut */}
            {showOppoFilters && (
              <div className={`${isMobile ? "px-3" : "px-6"} mb-8 max-w-full overflow-hidden`}>
                <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                  {/* Barre de recherche */}
                  <div className="relative w-full md:w-1/3">
                    <input
                      type="text"
                      placeholder="Rechercher une opportunité..."
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    {searchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setSearchQuery("")}
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Filtres de statut */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        jobFilter === "all"
                          ? isDarkMode
                            ? "bg-primary-600 text-white"
                            : "bg-primary-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setJobFilter("all")}
                    >
                      <span className="text-sm">Toutes</span>
                    </button>
                    <button
                      className={`px-4 py-2 rounded-xl flex items-center justify-center font-medium transition-all duration-300 transform hover:scale-105 ${
                        jobFilter === "available"
                          ? isDarkMode
                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-900/30"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                          : isDarkMode
                            ? "bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 border border-gray-600/50"
                            : "bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 border border-gray-300/50"
                      }`}
                      onClick={() => setJobFilter("available")}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">En cours</span>
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        jobFilter === "recent"
                          ? isDarkMode
                            ? "bg-orange-600 text-white"
                            : "bg-orange-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setJobFilter("recent")}
                    >
                      <span className="text-sm">Récentes</span>
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        jobFilter === "expired"
                          ? isDarkMode
                            ? "bg-red-600 text-white"
                            : "bg-red-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setJobFilter("expired")}
                    >
                      <span className="text-sm">Expirées</span>
                    </button>
                  </div>
                </div>

                {/* Panneau de filtres avancés pour les opportunités d'affaires */}
                <div
                  className={`p-4 mb-4 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Filtres avancés
                    </h3>
                    <button
                      className={`text-sm px-2 py-1 rounded ${
                        isDarkMode
                          ? "text-primary-400 hover:text-primary-300 hover:bg-gray-700"
                          : "text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                      }`}
                      onClick={resetOppoFilters}
                    >
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Réinitialiser les filtres
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filtre par type d'opportunité */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Type d'opportunité
                      </label>
                      <div className="relative">
                        <select
                          className={`block w-full px-3 py-2 pr-8 rounded border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          value={oppoTypeFilter}
                          onChange={(e) => setOppoTypeFilter(e.target.value)}
                        >
                          <option value="">Tous les types</option>
                          <option value="opportunité">Opportunités</option>
                          <option value="appel_projet">Appel à projet</option>
                          <option value="partenariat">Partenariat</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {oppoTypeFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoTypeFilter("")}
                            title="Effacer la sélection"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filtre par date limite */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Date limite
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          className={`block w-full px-3 py-2 rounded border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          value={oppoDateFilter}
                          onChange={(e) => setOppoDateFilter(e.target.value)}
                        />
                        {oppoDateFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoDateFilter("")}
                            title="Effacer la sélection"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicateurs de filtres actifs */}
                  {(oppoTypeFilter || oppoDateFilter) && (
                    <div
                      className={`mt-4 pt-3 border-t ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Filtres actifs:
                        </span>
                        {oppoTypeFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Type:{" "}
                            {oppoTypeFilter === "appel_offre"
                              ? "Appel d'offre"
                              : oppoTypeFilter === "appel_projet"
                              ? "Appel à projet"
                              : "Partenariat"}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoTypeFilter("")}
                            />
                          </span>
                        )}
                        {oppoDateFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Date limite: {new Date(oppoDateFilter).toLocaleDateString('fr-FR')}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoDateFilter("")}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

            {/* Tableau Material-UI des opportunités d'affaires avec pagination */}
            <Box sx={{ width: '100%' }}>
              {isMobile ? (
                // Vue cartes pour mobile
                <div className="space-y-4">
                  {posts
                    .filter((post) => post.type === "opportunites-affaires")
                    .map((post) => (
                      <div
                        key={post.id}
                        onClick={() => openPostDetail(post.id, post.type)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* Header de la carte */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  post.etat === 'available' ? 'bg-green-500' :
                                  post.etat === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
                                }`}
                              />
                              <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {post.title || "Non précisé"}
                              </h3>
                            </div>
                            {post.reference && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Réf: {post.reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Informations principales */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              post.type === 'opportunité' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              post.type === 'appel_projet' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {post.type === 'opportunité' ? 'Opportunité' :
                               post.type === 'appel_projet' ? 'Appel à projet' :
                               'Partenariat'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {post.company_name || "Non précisé"}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {post.date_limite
                                ? new Date(post.date_limite).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Date non spécifiée"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-4">
                            {/* Actions sociales */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post.id, post.type);
                              }}
                              className={`flex items-center space-x-1 ${
                                post.is_liked ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={post.is_liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-xs">{post.likes_count || 0}</span>
                            </button>
                            

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPostDetail(post.id, post.type);
                              }}
                              className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="text-xs">{post.comments_count || 0}</span>
                            </button>
                          </div>

                          {/* Bouton détails */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPostDetail(post.id, post.type);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                          >
                            Voir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                // Vue tableau pour desktop
                <TableContainer
                  component={Paper}
                  sx={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {loadingOppo && <LinearProgress />}
                  <Table>
                    <TableHead sx={{ backgroundColor: isDarkMode ? '#374151' : '#f9fafb' }}>
                      <TableRow>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Titre
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Type
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Entreprise
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Date de clôture
                        </TableCell>
                        <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827', fontWeight: 'bold' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {posts
                        .filter((post) => post.type === "opportunites-affaires")
                        .map((post) => (
                          <TableRow
                            key={post.id}
                            sx={{
                              '&:hover': { backgroundColor: isDarkMode ? '#374151' : '#f9fafb' },
                              cursor: 'pointer'
                            }}
                            onClick={() => openPostDetail(post.id, post.type)}
                          >
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: post.etat === 'available' ? '#10b981' :
                                                    post.etat === 'unavailable' ? '#ef4444' : '#f59e0b',
                                    mr: 1,
                                    mt: 1
                                  }}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                    {post.title || "Non précisé"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {post.reference || "Réf. non précisée"}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                post.type === 'opportunité' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                post.type === 'appel_projet' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {post.type === 'opportunité' ? 'Opportunité' :
                                 post.type === 'appel_projet' ? 'Appel à projet' :
                                 'Partenariat'}
                              </span>
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              {post.company_name || "Non précisé"}
                            </TableCell>
                            <TableCell sx={{ color: isDarkMode ? '#ffffff' : '#111827' }}>
                              {post.date_limite
                                ? new Date(post.date_limite).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Date non spécifiée"}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* Actions sociales */}
                                <Tooltip title="J'aime">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLike(post.id, post.type);
                                    }}
                                    sx={{ color: post.is_liked ? '#ef4444' : 'text.secondary' }}
                                  >
                                    {post.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                  </IconButton>
                                </Tooltip>

                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {post.likes_count || 0}
                                </Typography>

                                <Tooltip title="Commentaires">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPostDetail(post.id, post.type);
                                    }}
                                    sx={{ color: 'text.secondary' }}
                                  >
                                    <CommentIcon />
                                  </IconButton>
                                </Tooltip>

                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {post.comments_count || 0}
                                </Typography>

                                {/* Bouton détails */}
                                <Tooltip title="Voir les détails">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPostDetail(post.id, post.type);
                                    }}
                                    sx={{
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      '&:hover': { backgroundColor: '#2563eb' }
                                    }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination Material-UI */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={oppoTotal}
                rowsPerPage={oppoRowsPerPage}
                page={oppoPage}
                onPageChange={handleOppoPageChange}
                onRowsPerPageChange={handleOppoRowsPerPageChange}
                labelRowsPerPage={isMobile ? "" : "Lignes par page:"}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
                sx={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    color: isDarkMode ? '#ffffff' : '#000000'
                  },
                  '.MuiTablePagination-selectLabel': {
                    display: isMobile ? 'none' : 'block'
                  },
                  '.MuiTablePagination-toolbar': {
                    justifyContent: isMobile ? 'flex-start' : 'space-between',
                    paddingLeft: isMobile ? '16px' : '0'
                  },
                  '.MuiTablePagination-spacer': {
                    display: isMobile ? 'none' : 'block'
                  }
                }} 
              />
            </Box>
          </Tab.Panel>

          {/* Quatrième onglet: Formations */}
          <Tab.Panel
            className={classNames(
              "rounded-xl p-3",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
          >
            <Formations />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal pour afficher les détails d'une publication */}
      {selectedPost && (
        <PostDetailModal
          isOpen={isPostDetailModalOpen}
          onClose={() => setIsPostDetailModalOpen(false)}
          post={selectedPost}
          onLike={handleLike}
          onComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onShare={handleShare}
          isDarkMode={isDarkMode}
        />
      )}
      </div>
    </div>
  );
}
