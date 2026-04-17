import axios from 'axios';

export const refreshSession = async () => {
    try {
        // Obtenir un nouveau cookie CSRF
        await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        
        // Rafraîchir la session
        await axios.post(`${import.meta.env.VITE_API_URL}/api/refresh-session`, {}, {
            withCredentials: true
        });

        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement de session:', error);
        
        // Gérer les erreurs de connexion
        let errorMessage = "Erreur de connexion";
        if (error.isNetworkError) {
            errorMessage = error.message;
        } else if (error.response?.status === 401) {
            errorMessage = "Session expirée";
        }
        
        // Si le rafraîchissement échoue, on redirige vers la page de connexion
        window.location.href = '/login';
        return Promise.reject(error);
    }
};
