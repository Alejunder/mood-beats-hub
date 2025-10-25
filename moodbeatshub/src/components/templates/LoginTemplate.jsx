import { useState } from "react";
import { supabase } from "../../supabase/supabase.config";
import "./styles/LoginTemplate.css";

export function LoginTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSpotifyLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: "user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private playlist-modify-public user-library-read streaming playlist-modify-private" ,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error al conectar con Spotify. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <h1 className="app-title">MoodBeatsHub</h1>
          </div>
          <p className="app-subtitle">Música que entiende tu estado de ánimo</p>
        </div>

        <div className="login-content">
          <div className="welcome-section">
            <h2>Bienvenido</h2>
            <p>
              Conecta tu cuenta de Spotify para descubrir música personalizada
              según tu estado de ánimo
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="spotify-login-button"
            onClick={handleSpotifyLogin}
            disabled={loading}
          >
            {loading ? (
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
                Iniciar sesión con Spotify
              </>
            )}
          </button>

          <p className="terms-text">
            Al iniciar sesión, aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
