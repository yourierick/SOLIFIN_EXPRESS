/**
 * AuthContext.jsx - Contexte d'authentification
 *
 * Gère l'état d'authentification global de l'application.
 * Fournit les fonctionnalités de connexion, déconnexion et gestion de session.
 *
 * État géré :
 * - Utilisateur courant
 * - Token d'authentification
 * - État de chargement
 * - Erreurs d'authentification
 *
 * Fonctionnalités :
 * - Login (email/password)
 * - Logout
 * - Rafraîchissement du token
 * - Vérification de session
 * - Gestion des rôles
 * - Expiration de session
 *
 * Méthodes exposées :
 * - login(email, password)
 * - logout()
 * - updateUser(data)
 * - refreshToken()
 * - checkAuth()
 *
 * Sécurité :
 * - Stockage sécurisé des tokens
 * - Validation des JWT
 * - Protection CSRF
 * - Gestion de l'expiration
 *
 * Persistence :
 * - LocalStorage pour "Remember me"
 * - SessionStorage pour session unique
 * - Nettoyage à la déconnexion
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "../utils/axios";
import { useNavigate } from "react-router-dom";
import { sessionEvents } from "../utils/axios";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

// Catégories de routes selon votre logique
const GUEST_ONLY_ROUTES = [
  "/login",
  "/register", 
  "/forgot-password",
  "/reset-password",
  "/verification-success",
  "/verification-error",
  "/interet"
];

const ALWAYS_ACCESSIBLE = ["/"];

// Fonction pour vérifier si une route est accessible uniquement aux non-connectés
const isGuestOnlyRoute = (path) => {
  // Vérification exacte pour les routes statiques
  if (GUEST_ONLY_ROUTES.includes(path)) {
    return true;
  }
  // Vérification pour reset-password avec token
  if (path.startsWith("/reset-password/")) {
    return true;
  }
  return false;
};

// Fonction pour vérifier si une route est toujours accessible
const isAlwaysAccessible = (path) => {
  return ALWAYS_ACCESSIBLE.includes(path);
};

// Durée d'inactivité avant expiration de session (en millisecondes)
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes

// Hook personnalisé pour utiliser le contexte d'authentification
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export { useAuth };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastVisitedUrl, setLastVisitedUrl] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Utiliser useRef pour stocker les intervalles et éviter les problèmes de dépendance
  const authCheckIntervalRef = useRef(null);
  const inactivityCheckIntervalRef = useRef(null);

  // Utiliser useRef pour suivre si l'utilisateur est authentifié
  const isAuthenticatedRef = useRef(false);

  // Fonction pour mettre à jour le timestamp de dernière activité
  // Cette fonction ne sera appelée que pour les interactions utilisateur réelles
  // et non pour les appels API automatiques
  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const currentPath = window.location.pathname;
        
        // Vérifier l'authentification (sauf pour la page d'accueil)
        let isAuthenticated = false;
        if (!isAlwaysAccessible(currentPath)) {
          isAuthenticated = await checkAuth();
          isAuthenticatedRef.current = isAuthenticated;
        } else if (isAlwaysAccessible(currentPath)) {
          // Pour la page d'accueil, vérifier l'auth et mettre à jour l'état
          try {
            isAuthenticated = await checkAuth();
            isAuthenticatedRef.current = isAuthenticated;
            // Si authentifié, l'état user est déjà mis à jour dans checkAuth()
            // Si non authentifié, l'état user est déjà null (géré dans checkAuth)
          } catch (error) {
            // Ignorer les erreurs sur la page d'accueil
            isAuthenticated = false;
            isAuthenticatedRef.current = false;
          }
        }
        
        if (isAuthenticated) {
          // Si connecté et sur route guest-only -> rediriger vers dashboard
          // Mais PAS pour la page d'accueil (toujours accessible)
          if (isGuestOnlyRoute(currentPath)) {
            const isAdmin = user.is_admin === 1 || user.is_admin === true || user.role === "admin";
            navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
            return;
          }
        } else if (!isAuthenticated) {
          // Si non connecté et sur route protégée -> rediriger vers login
          // Mais PAS pour les routes guest-only (elles sont accessibles aux non-connectés)
          // Et JAMAIS pour la page d'accueil (toujours accessible sans redirection)
          const shouldRedirectToLogin = !isGuestOnlyRoute(currentPath) && !isAlwaysAccessible(currentPath) && currentPath !== "/";
          
          if (shouldRedirectToLogin) {
            navigate("/login", { replace: true });
            return;
          }
        }
      } catch (error) {
        // En cas d'erreur, ne PAS rediriger automatiquement
        // Laisser l'utilisateur accéder aux routes publiques/guest-only
        // Seules les routes protégées devraient rediriger vers login
        const currentPath = window.location.pathname;
        if (!isGuestOnlyRoute(currentPath) && !isAlwaysAccessible(currentPath) && currentPath !== "/") {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Nettoyage des intervalles au démontage du composant
    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }
    };
  }, []);

  // Écouter les événements d'expiration de session
  useEffect(() => {
    const handleSessionExpired = () => {
      // Éviter de déclencher plusieurs fois si l'utilisateur est déjà déconnecté
      if (isAuthenticatedRef.current) {
        // Nettoyer l'état d'authentification
        setUser(null);
        isAuthenticatedRef.current = false;

        // Nettoyer les intervalles
        if (authCheckIntervalRef.current) {
          clearInterval(authCheckIntervalRef.current);
        }
        if (inactivityCheckIntervalRef.current) {
          clearInterval(inactivityCheckIntervalRef.current);
        }
      }
    };

    // Ajouter l'écouteur d'événement
    sessionEvents.expired.addEventListener(
      "session-expired",
      handleSessionExpired
    );

    // Nettoyer l'écouteur d'événement
    return () => {
      sessionEvents.expired.removeEventListener(
        "session-expired",
        handleSessionExpired
      );
    };
  }, []);

  // Mettre à jour l'activité de l'utilisateur
  useEffect(() => {
    if (user) {
      // Mettre à jour l'activité sur les événements d'interaction utilisateur
      const events = ["mousedown", "keydown", "touchstart", "scroll"];

      const handleUserActivity = () => {
        updateLastActivity();
      };

      // Ajouter les écouteurs d'événements
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });

      // Nettoyer les écouteurs d'événements
      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [user, updateLastActivity]);

  // Vérifier périodiquement l'état de la session
  useEffect(() => {
    // Nettoyer les intervalles existants
    if (authCheckIntervalRef.current) {
      clearInterval(authCheckIntervalRef.current);
    }
    if (inactivityCheckIntervalRef.current) {
      clearInterval(inactivityCheckIntervalRef.current);
    }

    if (user) {
      isAuthenticatedRef.current = true;

      // Vérifier l'authentification toutes les 5 minutes
      authCheckIntervalRef.current = setInterval(async () => {
        try {
          await checkAuth();
        } catch (error) {
          console.error(
            "Erreur lors de la vérification d'authentification:",
            error
          );
        }
      }, 5 * 60 * 1000);

      // Vérifier l'inactivité toutes les minutes
      inactivityCheckIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastActivity;

        // Si l'utilisateur est inactif depuis plus longtemps que le délai d'expiration
        if (inactiveTime > SESSION_TIMEOUT) {
          // Déconnecter l'utilisateur explicitement côté backend
          // Utiliser une fonction spécifique qui n'actualise pas lastActivity
          logoutDueToInactivity();

          // Rediriger vers la page de connexion
          navigate("/login", { replace: true });
        }
      }, 60 * 1000); // Vérifier chaque minute
    } else {
      isAuthenticatedRef.current = false;
    }
  }, [user, lastActivity, navigate]);

  // Sauvegarder la dernière URL visitée
  useEffect(() => {
    if (user) {
      const currentPath = window.location.pathname;
      // Ne pas sauvegarder les URLs de login/register
      if (
        ![
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ].includes(currentPath)
      ) {
        localStorage.setItem(`lastUrl_${user.id}`, currentPath);
      }
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      // Ajouter un paramètre pour indiquer que c'est une vérification d'authentification
      // et non une activité utilisateur
      const response = await axios.get("/api/user?check_only=true", {
        // Ajouter un en-tête pour indiquer que cette requête ne doit pas être considérée
        // comme une activité utilisateur
        headers: {
          "X-No-Activity-Update": "true",
        },
      });

      if (response.data) {
        setUser(response.data);
        isAuthenticatedRef.current = true;
        // Ne pas mettre à jour le timestamp de dernière activité pour les vérifications automatiques
        // updateLastActivity(); -- Supprimé pour ne pas considérer les vérifications comme des activités
        setLoading(false);
        return true;
      }

      isAuthenticatedRef.current = false;
      setLoading(false);
      return false;
    } catch (error) {
      setUser(null);
      isAuthenticatedRef.current = false;
      setLoading(false);
      return false;
    }
  };

  const login = async (login, password) => {
    try {
      setLoading(true);
      // Obtenir un cookie CSRF avant la connexion
      await axios.get("/sanctum/csrf-cookie");

      const response = await axios.post("/api/login", { login, password });

      if (response.data.user) {
        setUser(response.data.user);
        isAuthenticatedRef.current = true;
        // Mettre à jour le timestamp de dernière activité
        updateLastActivity();
        // Récupérer la dernière URL visitée pour cet utilisateur
        const lastUrl = localStorage.getItem(
          `lastUrl_${response.data.user.id}`
        );
        if (lastUrl) {
          setLastVisitedUrl(lastUrl);
        }

        // Les notifications pour les utilisateurs en période d'essai sont maintenant gérées dans LoginForm.jsx

        return {
          success: true,
          user: response.data.user,
          lastVisitedUrl,
          trial: response.data.trial,
        };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Erreur de connexion:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion standard, appelée par l'utilisateur
  const logout = async () => {
    try {
      setLoading(true);
      await axios.post("/api/logout");
      setUser(null);
      isAuthenticatedRef.current = false;

      // Nettoyer les intervalles
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }

      return true;
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction spécifique pour la déconnexion due à l'inactivité
  // Cette fonction ne met pas à jour lastActivity
  const logoutDueToInactivity = async () => {
    try {
      setLoading(true);
      // Utiliser un paramètre spécifique pour indiquer que c'est une déconnexion due à l'inactivité
      await axios.post(
        "/api/logout?reason=inactivity",
        {},
        {
          // Éviter que cette requête ne soit considérée comme une activité utilisateur
          headers: {
            "X-No-Activity-Update": "true",
          },
        }
      );
      setUser(null);
      isAuthenticatedRef.current = false;

      // Nettoyer les intervalles
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }

      return true;
    } catch (error) {
      console.error("Erreur de déconnexion due à l'inactivité:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      // Obtenir un cookie CSRF avant l'inscription
      await axios.get("/sanctum/csrf-cookie");

      const response = await axios.post("/api/register", userData);

      if (response.data.user) {
        setUser(response.data.user);
        isAuthenticatedRef.current = true;
        // Mettre à jour le timestamp de dernière activité
        updateLastActivity();
        return {
          success: true,
          user: response.data.user,
        };
      }
    } catch (error) {
      let errorMessage = "Erreur lors de l'inscription";

      if (error.response?.status === 422) {
        return {
          success: false,
          errors: error.response.data.errors,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      // Gestion spécifique pour l'erreur 404 (utilisateur non trouvé)
      if (error.response?.status === 404) {
        return {
          success: false,
          error: "Aucun compte n'est associé à cette adresse email.",
          errorType: "user_not_found",
        };
      }

      // Vérifier si l'erreur est due à la limitation de fréquence (throttling)
      const errorMessage = error.response?.data?.error || "";
      if (errorMessage.includes("passwords.throttled")) {
        return {
          success: false,
          error:
            "Vous avez déjà demandé un lien de réinitialisation récemment.",
          errorType: "throttled",
          hint: "Veuillez attendre une minute avant de réessayer ou vérifiez votre boîte de réception.",
        };
      }

      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Une erreur est survenue lors de la demande de réinitialisation.",
        errorType: "general_error",
      };
    }
  };

  const resetPassword = async (
    token,
    email,
    password,
    password_confirmation
  ) => {
    try {
      const response = await axios.post("/api/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Une erreur est survenue",
      };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await axios.post("/api/resend-verification", { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Une erreur est survenue",
      };
    }
  };

  const value = {
    user,
    loading,
    lastVisitedUrl,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    resendVerificationEmail,
    checkAuth,
    updateLastActivity,
    logoutDueToInactivity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
