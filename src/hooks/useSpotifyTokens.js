import { useState, useEffect } from 'react';
import { refreshSession, getCurrentSession } from '../services/authService';
import { supabase } from '../supabase/supabase.config';

// 🔥 CACHE EN MEMORIA (evita queries constantes a BD)
const TokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  lastUpdate: 0,
  
  set(accessToken, refreshToken, expiresAt) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.lastUpdate = Date.now();
    
    try {
      sessionStorage.setItem('spotify_tokens', JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt,
        cached: Date.now()
      }));
    } catch (_e) {
      console.warn('No se pudo guardar en sessionStorage');
    }
  },
  
  get() {
    // Si está en memoria y es reciente (< 5 min), usar cache
    const CACHE_VALIDITY = 5 * 60 * 1000; // 5 minutos
    if (this.accessToken && (Date.now() - this.lastUpdate) < CACHE_VALIDITY) {
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
        fromCache: true
      };
    }
    
    // Intentar recuperar de sessionStorage
    try {
      const cached = sessionStorage.getItem('spotify_tokens');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.cached < 10 * 60 * 1000) {
          this.accessToken = data.accessToken;
          this.refreshToken = data.refreshToken;
          this.expiresAt = data.expiresAt;
          this.lastUpdate = data.cached;
          return { ...data, fromCache: true };
        }
      }
    } catch (_e) {
      console.warn('Error leyendo cache');
    }
    
    return null;
  },
  
  clear() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.lastUpdate = 0;
    try {
      sessionStorage.removeItem('spotify_tokens');
    } catch (_e) {
      // Ignorar
    }
  }
};

export function useSpotifyTokens() {
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    let refreshTimer = null;
    let lastDbFetch = 0;
    const MIN_DB_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutos entre consultas a BD
    /**
     * 🔄 REFRESH AUTOMÁTICO DE TOKEN
     * Se ejecuta 5 minutos ANTES de que expire
     */
    const refreshAccessToken = async (forceRefresh = false) => {
      try {
        const result = await refreshSession();

        if (!result.success || !result.data) {
          console.error('Error al refrescar sesión:', result.error);
          
          // Si el error es de autenticación, marcar sesión como expirada
          if (result.error?.includes('refresh_token_not_found') || 
              result.error?.includes('invalid_grant') ||
              result.error?.includes('401')) {
            console.error('❌ Sesión expirada - Se requiere nuevo login');
            if (mounted) {
              setSessionExpired(true);
              setError('Sesión expirada');
              TokenCache.clear();
            }
          } else {
            if (mounted) {
              setError('Error al refrescar token');
            }
          }
          return false;
        }

        const session = result.data;

        if (!session?.provider_token) {
          console.error('❌ No se pudo obtener provider_token - Se requiere nuevo login con Spotify');
          if (mounted) {
            setSessionExpired(true);
            setError('Sesión con Spotify expirada');
            TokenCache.clear();
          }
          return false;
        }

        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
        
        // Solo guardar en BD si el token cambió
        const cachedData = TokenCache.get();
        const tokenChanged = !cachedData || cachedData.accessToken !== session.provider_token;
        
        if (tokenChanged || forceRefresh) {
          const { error: upsertError } = await supabase
            .from('user_spotify_tokens')
            .upsert({
              user_id: session.user.id,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token,
              token_expires_at: expiresAt
            }, {
              onConflict: 'user_id'
            });

          if (upsertError) {
            console.error('Error al guardar token refrescado:', upsertError);
            return false;
          }
          
        }

        // Actualizar cache
        TokenCache.set(session.provider_token, session.provider_refresh_token, expiresAt);

        if (mounted) {
          setSpotifyAccessToken(session.provider_token);
          setSpotifyRefreshToken(session.provider_refresh_token);
          setTokenExpiresAt(expiresAt);
          setSessionExpired(false);
          setError(null);
        }

        // ⭐ PROGRAMAR PRÓXIMO REFRESH AUTOMÁTICO
        scheduleNextRefresh(expiresAt);

        return true;

      } catch (err) {
        console.error('Error al refrescar token:', err);
        if (mounted) {
          setError('Error al refrescar token');
        }
        return false;
      }
    };

    /**
     * ⏰ PROGRAMAR REFRESH AUTOMÁTICO
     * Se ejecuta 5 minutos ANTES de que expire el token
     * SOLO si el usuario está ACTIVO
     */
    const scheduleNextRefresh = (expiresAt) => {
      // Limpiar timer anterior
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      if (!expiresAt) return;

      const expirationTime = new Date(expiresAt);
      const now = new Date();
      const timeUntilExpiry = expirationTime - now;
      
      // Refrescar 5 minutos ANTES de que expire
      const FIVE_MINUTES = 5 * 60 * 1000;
      const refreshTime = timeUntilExpiry - FIVE_MINUTES;

      if (refreshTime > 0) {
        
        refreshTimer = setTimeout(() => {
          // Verificar si el usuario está activo
          const timeInactive = Date.now() - lastUserActivity;
          const INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutos
          
          if (timeInactive < INACTIVITY_THRESHOLD) {
            refreshAccessToken().then(success => {
              if (!success && mounted) {
                console.error('❌ Refresh automático falló - Marcando sesión como expirada');
                setSessionExpired(true);
                TokenCache.clear();
              }
            });
          } 
        }, refreshTime);
      } else {
        // Si ya está muy cerca de expirar, refrescar inmediatamente
        refreshAccessToken().then(success => {
          if (!success && mounted) {
            console.error('❌ Refresh inmediato falló - Marcando sesión como expirada');
            setSessionExpired(true);
            TokenCache.clear();
          }
        });
      }
    };

    /**
     * 🚀 CAPTURA Y CONSULTA TOKENS
     */
    const captureAndFetchTokens = async (skipCache = false) => {
      try {
        // PASO 1: Intentar usar CACHE primero
        if (!skipCache) {
          const cached = TokenCache.get();
          if (cached && cached.accessToken) {
            if (mounted) {
              setSpotifyAccessToken(cached.accessToken);
              setSpotifyRefreshToken(cached.refreshToken);
              setTokenExpiresAt(cached.expiresAt);
              setLoading(false);
              setError(null);
            }
            
            // Programar refresh automático
            scheduleNextRefresh(cached.expiresAt);
            return;
          }
        }
        
        // PASO 2: Prevenir consultas muy frecuentes a BD
        const now = Date.now();
        if (now - lastDbFetch < MIN_DB_FETCH_INTERVAL && !skipCache) {
          return;
        }
        lastDbFetch = now; 
        // PASO 3: Obtener sesión actual
        const sessionResult = await getCurrentSession();

        if (!sessionResult.success) {
          console.warn('Advertencia al obtener sesión:', sessionResult.error);
        }

        const session = sessionResult.data;
        const user = session?.user ?? null;

        if (!user) {
          if (mounted) {
            setLoading(false);
            setError(null);
            TokenCache.clear();
          }
          return;
        }

        // PASO 4: CAPTURA INTELIGENTE desde la sesión
        let shouldSaveToDb = false;
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
        
        if (session?.provider_token && session?.provider_refresh_token) {
          const cachedData = TokenCache.get();
          
          if (!cachedData || cachedData.accessToken !== session.provider_token) {
            shouldSaveToDb = true;
          }
          
          if (shouldSaveToDb) {
            const { error: upsertError } = await supabase
              .from('user_spotify_tokens')
              .upsert({
                user_id: user.id,
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token,
                token_expires_at: expiresAt
              }, {
                onConflict: 'user_id'
              });

            if (upsertError) {
              console.error('Error al guardar tokens:', upsertError);
            } 
          }
          
          TokenCache.set(session.provider_token, session.provider_refresh_token, expiresAt);
          
          if (mounted) {
            setSpotifyAccessToken(session.provider_token);
            setSpotifyRefreshToken(session.provider_refresh_token);
            setTokenExpiresAt(expiresAt);
            setError(null);
          }

          // ⭐ PROGRAMAR REFRESH AUTOMÁTICO
          scheduleNextRefresh(expiresAt);
          
          return;
        }

        // PASO 5: CONSULTA A BD si no hay tokens en sesión
        const { data, error: tokensError } = await supabase
          .from('user_spotify_tokens')
          .select('access_token, refresh_token, token_expires_at')
          .eq('user_id', user.id)
          .single();

        if (tokensError || !data) {
          console.warn('No se encontraron tokens en BD:', tokensError?.message);
          
          if (mounted) {
            setError('Tokens de Spotify no disponibles');
            setLoading(false);
          }
          return;
        }

        if (data && mounted) {
          TokenCache.set(data.access_token, data.refresh_token, data.token_expires_at);
          
          // Verificar si necesita refresh inmediato
          const expirationTime = new Date(data.token_expires_at);
          const now = new Date();
          const timeUntilExpiry = expirationTime - now;
          const FIVE_MINUTES = 5 * 60 * 1000;

          if (timeUntilExpiry < FIVE_MINUTES) {
            const refreshSuccess = await refreshAccessToken(true);
            
            // Si el refresh falló, no continuar con tokens expirados
            if (!refreshSuccess) {
              console.error('❌ No se pudo refrescar token - Marcando sesión como expirada');
              if (mounted) {
                setSessionExpired(true);
                setError('No se pudo refrescar el token de Spotify');
                TokenCache.clear();
              }
            }
          } else {
            setSpotifyAccessToken(data.access_token);
            setSpotifyRefreshToken(data.refresh_token);
            setTokenExpiresAt(data.token_expires_at);
            setError(null);
            
            // ⭐ PROGRAMAR REFRESH AUTOMÁTICO
            scheduleNextRefresh(data.token_expires_at);
            
            const timeLeft = Math.round(timeUntilExpiry / 1000 / 60);
          }
        }

      } catch (err) {
        console.error('Error al procesar tokens:', err);
        if (mounted) {
          setError(err?.message ?? String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // ⭐ INICIALIZACIÓN
    captureAndFetchTokens(true);

    // ⭐ DETECTAR ACTIVIDAD DEL USUARIO
    const updateActivity = () => {
      setLastUserActivity(Date.now());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // ⭐ LISTENER DE VISIBILIDAD DE LA PÁGINA
    // Refrescar token cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden && spotifyAccessToken) {
        const cached = TokenCache.get();
        if (cached?.expiresAt) {
          const expirationTime = new Date(cached.expiresAt);
          const now = new Date();
          const timeUntilExpiry = expirationTime - now;
          const FIVE_MINUTES = 5 * 60 * 1000;

          // Si ya expiró, intentar refrescar y marcar como expirado si falla
          if (timeUntilExpiry < 0) {
            refreshAccessToken().then(success => {
              if (!success && mounted) {
                console.error('❌ No se pudo refrescar - Sesión expirada');
                setSessionExpired(true);
                TokenCache.clear();
              }
            });
          } else if (timeUntilExpiry < FIVE_MINUTES) {
            refreshAccessToken();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [spotifyAccessToken, lastUserActivity]);

  // Método para limpiar sesión manualmente
  const clearSession = () => {
    TokenCache.clear();
    setSpotifyAccessToken(null);
    setSpotifyRefreshToken(null);
    setTokenExpiresAt(null);
    setSessionExpired(false);
    setError(null);
  };

  // Exponer refreshAccessToken para uso externo
  const handleRefreshToken = async () => {
    try {
      const result = await refreshSession();

      if (!result.success || !result.data?.provider_token) {
        console.error('❌ Error refrescando token:', result.error);
        setSessionExpired(true);
        TokenCache.clear();
        return null;
      }

      const session = result.data;
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      
      // Guardar en BD
      await supabase
        .from('user_spotify_tokens')
        .upsert({
          user_id: session.user.id,
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token,
          token_expires_at: expiresAt
        }, {
          onConflict: 'user_id'
        });

      // Actualizar cache y estado
      TokenCache.set(session.provider_token, session.provider_refresh_token, expiresAt);
      setSpotifyAccessToken(session.provider_token);
      setSpotifyRefreshToken(session.provider_refresh_token);
      setTokenExpiresAt(expiresAt);
      setSessionExpired(false);
      setError(null);

      return session.provider_token;
    } catch (err) {
      console.error('❌ Error en handleRefreshToken:', err);
      setSessionExpired(true);
      TokenCache.clear();
      return null;
    }
  };

  return {
    spotifyAccessToken,
    spotifyRefreshToken,
    tokenExpiresAt,
    loading,
    error,
    sessionExpired,
    clearSession,
    refreshToken: handleRefreshToken
  };
}