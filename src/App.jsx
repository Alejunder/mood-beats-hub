import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabase/supabase.config";
import { useSpotifyTokens } from "./hooks/useSpotifyTokens";
import { validateCurrentUserIntent } from "./services/authIntentService";
import { validateAuthIntentSimple } from "./services/authIntentServiceSimple";
import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";
import { Sidebar } from "./components/organisms/Sidebar";
import { MyRoutes } from "./routes/routes";
import { CircleLoader } from "./components/atoms/CircleLoader";
import { SessionExpiredModal } from "./components/molecules/SessionExpiredModal";
import { SpotifyPlayer } from "./components/molecules/SpotifyPlayer";
import "./globals.css";
import "./components/molecules/SweetAlertStyles.css";

// Flag para controlar el método de validación
const USE_BACKEND_VALIDATION = false; // true = backend RPC, false = validación simple frontend

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [playingPlaylist, setPlayingPlaylist] = useState(null);
  const location = useLocation();
  
  // Hook para obtener tokens de Spotify (guardados automáticamente por el trigger)
  const { 
    spotifyAccessToken, 
    spotifyRefreshToken, 
    loading: tokensLoading,
    sessionExpired,
    clearSession,
    refreshToken
  } = useSpotifyTokens();

  // Manejar cierre del modal de sesión expirada
  const handleSessionExpiredClose = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Funciones para controlar el reproductor global
  const handlePlayPlaylist = (playlist) => {
    if (!spotifyAccessToken || !playlist) return;
    
    setPlayingPlaylist({
      uri: playlist.uri,
      name: playlist.name
    });
    setShowPlayer(true);
    setIsPlayerMinimized(false);
  };

  const handleMinimizePlayer = () => {
    setShowPlayer(false);
    setIsPlayerMinimized(true);
  };

  const handleMaximizePlayer = () => {
    setShowPlayer(true);
    setIsPlayerMinimized(false);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setIsPlayerMinimized(false);
    setPlayingPlaylist(null);
  };


  useEffect(() => {
    // Verificar sesión actual y manejar OAuth redirect con reintentos para iOS
    const initializeAuth = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Pequeño delay para iOS Safari
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session) {
            console.log('✅ Sesión encontrada en intento:', attempts + 1);
            setUser(session.user);
            setLoading(false);
            return;
          }
          
          if (error) {
            console.error('Error obteniendo sesión:', error);
          }
          
          attempts++;
        } catch (error) {
          console.error('Error en inicialización de auth:', error);
          attempts++;
        }
      }
      
      // Si no hay sesión después de los intentos
      setUser(null);
      setLoading(false);
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session ? '✅ Con sesión' : '❌ Sin sesión');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Usuario autenticado:', session.user.email);
        
        // Verificar el modo de autenticación (login/signup) y validar con el backend
        const authMode = localStorage.getItem('authMode');
        const authTimestamp = localStorage.getItem('authTimestamp');
        
        if (authMode && authTimestamp) {
          console.log('🔍 Validando intent con backend:', authMode);
          
          try {
            let validation;

            if (USE_BACKEND_VALIDATION) {
              // Validación con backend (RPC)
              console.log('📡 Usando validación con backend RPC');
              await new Promise(resolve => setTimeout(resolve, 500));
              validation = await validateCurrentUserIntent(
                authMode,
                parseInt(authTimestamp)
              );
            } else {
              // Validación simple solo en frontend
              console.log('💻 Usando validación simple en frontend');
              validation = validateAuthIntentSimple(
                authMode,
                parseInt(authTimestamp),
                session.user.created_at
              );
            }

            console.log('📊 Resultado de validación:', validation);

            // Si hubo fallback (error en validación), permitir continuar
            if (validation.fallback) {
              console.warn('⚠️ Validación falló, pero permitiendo acceso por seguridad');
              localStorage.removeItem('authMode');
              localStorage.removeItem('authTimestamp');
              setUser(session.user);
              setLoading(false);
              return;
            }

            if (!validation.valid) {
              // La validación falló
              console.error('❌ Validación fallida:', validation.error_code || validation.error);
              
              setLoading(false);
              
              // Guardar el error para mostrarlo en login
              if (validation.error) {
                localStorage.setItem('authError', validation.error);
              }
              
              // Limpiar auth state
              localStorage.removeItem('authMode');
              localStorage.removeItem('authTimestamp');
              
              // Si el backend indica logout, cerrar sesión
              if (validation.should_logout) {
                await supabase.auth.signOut();
                window.location.replace('/login');
              }
              
              return;
            }

            // Validación exitosa
            console.log('✅ Validación exitosa:', {
              email: validation.user_email,
              isNew: validation.is_new_user
            });
            
            localStorage.removeItem('authMode');
            localStorage.removeItem('authTimestamp');
          } catch (error) {
            console.error('💥 Error en validación:', error);
            // En caso de error, permitir continuar pero limpiar
            localStorage.removeItem('authMode');
            localStorage.removeItem('authTimestamp');
          }
        }
        
        setUser(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ Usuario desconectado');
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔄 Listener para refrescar token cuando expire (disparado por spotifyService)
  useEffect(() => {
    const handleTokenExpired = async () => {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          // Disparar evento de éxito con el nuevo token
          window.dispatchEvent(new CustomEvent('spotify:token:refreshed', {
            detail: { accessToken: newToken }
          }));
        } else {
          // Si falló el refresh, cerrar sesión
          handleSessionExpiredClose();
        }
      } catch (error) {
        console.error('❌ Error refrescando token:', error);
        handleSessionExpiredClose();
      }
    };

    // Listener para logout forzado
    const handleAuthFailed = () => {
      console.error('❌ Autenticación fallida, cerrando sesión...');
      handleSessionExpiredClose();
    };

    window.addEventListener('spotify:token:expired', handleTokenExpired);
    window.addEventListener('spotify:auth:failed', handleAuthFailed);

    return () => {
      window.removeEventListener('spotify:token:expired', handleTokenExpired);
      window.removeEventListener('spotify:auth:failed', handleAuthFailed);
    };
  }, [refreshToken, handleSessionExpiredClose]);

  if (loading) {
    return (
      <div className="app-container">
        <CircleLoader />
      </div>
    );
  }

  // Rutas donde no se debe mostrar la sidebar
  const routesWithoutSidebar = ['/login', '/genplaylist'];
  const showSidebar = user && !routesWithoutSidebar.includes(location.pathname);

  return (
    <LanguageProvider>
      <SettingsProvider>
        <div className="app-container">
          {showSidebar && (
            <Sidebar
              state={sidebarOpen}
              setState={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
          <MyRoutes 
            user={user} 
            spotifyAccessToken={spotifyAccessToken}
            spotifyRefreshToken={spotifyRefreshToken}
            tokensLoading={tokensLoading}
            onPlayPlaylist={handlePlayPlaylist}
          />
          
          {/* Modal de sesión expirada */}
          <SessionExpiredModal 
            isOpen={sessionExpired} 
            onClose={handleSessionExpiredClose}
          />

          {/* Reproductor de Spotify Global - Persistente en toda la app */}
          {(showPlayer || isPlayerMinimized) && playingPlaylist && spotifyAccessToken && (
            <div className={showPlayer ? "player-overlay" : "player-minimized"}>
              <SpotifyPlayer
                spotifyAccessToken={spotifyAccessToken}
                playlistUri={playingPlaylist.uri}
                playlistName={playingPlaylist.name}
                onClose={showPlayer ? handleMinimizePlayer : handleClosePlayer}
                isMinimized={isPlayerMinimized}
                onMaximize={handleMaximizePlayer}
              />
            </div>
          )}
        </div>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;
