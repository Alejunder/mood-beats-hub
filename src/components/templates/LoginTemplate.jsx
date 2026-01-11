import { useState, useEffect } from "react";
import { signInWithOAuth } from "../../services/authService";
import { supabase } from "../../supabase/supabase.config";
import { useLanguage } from "../../context/LanguageContext";
import logo from "../../assets/moodlogo.png";
import "./styles/LoginTemplate.css";

export function LoginTemplate() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay errores de validación de auth
    const authError = localStorage.getItem('authError');
    if (authError) {
      // authError es la key de traducción (ej: 'accountExistsPleaseLogin')
      setError(t(authError));
      localStorage.removeItem('authError');
    }
    
    // Verificar si hay errores en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = window.location.hash;
    
    const errorParam = urlParams.get('error') || (urlHash ? new URLSearchParams(urlHash.substring(1)).get('error') : null);
    const errorDescription = urlParams.get('error_description') || (urlHash ? new URLSearchParams(urlHash.substring(1)).get('error_description') : null);
    
    if (errorParam) {
      // Mostrar el error al usuario
      if (errorDescription) {
        const decodedError = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        setError(`Error: ${decodedError}`);
      } else {
        setError('Error de autenticación. Por favor, intenta de nuevo.');
      }
      
      // Limpiar la URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Limpiar el authMode del localStorage
      localStorage.removeItem('authMode');
      
      // Asegurarse de cerrar cualquier sesión
      supabase.auth.signOut();
    }
  }, [t]);

  useEffect(() => {
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Si hay un error de autenticación o se cierra sesión, restablecer estados
      if (event === 'SIGNED_OUT') {
        setLoading(false);
        setLoadingSignup(false);
      }
      
      // Si se inicia sesión exitosamente, limpiar el authMode
      if (event === 'SIGNED_IN' && session) {
        localStorage.removeItem('authMode');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSpotifyLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Guardar el modo y timestamp en localStorage antes de la redirección
      localStorage.setItem('authMode', 'login');
      localStorage.setItem('authTimestamp', Date.now().toString());

      const result = await signInWithOAuth({
        provider: "spotify",
        redirectTo: `${window.location.origin}/`,
        options: {
          scopes: "user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-modify-public user-library-read streaming playlist-modify-private",
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'login',
            show_dialog: 'false', // No forzar diálogo para login
          },
        },
      });

      if (!result.success) throw new Error(result.error);
    } catch (error) {
      console.error(t('loginError'), error);
      setError(t('errorConnectingSpotify'));
      localStorage.removeItem('authMode');
      localStorage.removeItem('authTimestamp');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifySignup = async () => {
    try {
      setLoadingSignup(true);
      setError(null);
      
      // Guardar el modo y timestamp en localStorage antes de la redirección
      localStorage.setItem('authMode', 'signup');
      localStorage.setItem('authTimestamp', Date.now().toString());

      const result = await signInWithOAuth({
        provider: "spotify",
        redirectTo: `${window.location.origin}/`,
        options: {
          scopes: "user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-modify-public user-library-read streaming playlist-modify-private",
          skipBrowserRedirect: false,
          queryParams: {
            show_dialog: 'true', // Forzar selección de cuenta para signup
          },
        },
      });

      if (!result.success) throw new Error(result.error);
    } catch (error) {
      console.error(t('signupError'), error);
      setError(t('errorConnectingSpotify'));
      localStorage.removeItem('authMode');
      localStorage.removeItem('authTimestamp');
    } finally {
      setLoadingSignup(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <p className="app-subtitle">{t('appSubtitle')}</p>
        </div>

        <div className="login-content">
          <div className="logo-container">
            <img src={logo} alt={t('appName')} className="app-logo" />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="spotify-login-button"
            onClick={handleSpotifyLogin}
            disabled={loading || loadingSignup}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                {t('loginWithSpotify')}
              </>
            )}
          </button>

          <div className="divider">
            <span>{t('or')}</span>
          </div>

          <button
            className="spotify-signup-button"
            onClick={handleSpotifySignup}
            disabled={loading || loadingSignup}
          >
            {loadingSignup ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <svg
                  className="spotify-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                {t('signupWithSpotify')}
              </>
            )}
          </button>

          <p className="terms-text">
            {t('termsAndConditions')}
          </p>
        </div>
      </div>
    </div>
  );
}
