import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabase/supabase.config";
import { useSpotifyTokens } from "./hooks/useSpotifyTokens";
import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";
import { Sidebar } from "./components/organisms/Sidebar";
import { MyRoutes } from "./routes/routes";
import { CircleLoader } from "./components/atoms/CircleLoader";
import "./globals.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Hook para obtener tokens de Spotify (guardados automáticamente por el trigger)
  const { spotifyAccessToken, spotifyRefreshToken, loading: tokensLoading } = useSpotifyTokens();


  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          />
        </div>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;
