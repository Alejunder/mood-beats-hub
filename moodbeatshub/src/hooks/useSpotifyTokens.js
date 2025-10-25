import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabase.config';

/**
 * Hook personalizado para capturar y consultar tokens de Spotify
 * 
 * FLUJO:
 * 1. Obtiene la sesión de Supabase
 * 2. Si hay tokens de OAuth en la sesión, los guarda en la BD
 * 3. Consulta tokens guardados para uso posterior
 * 
 * @returns {Object} { spotifyAccessToken, spotifyRefreshToken, tokenExpiresAt, loading, error }
 */
export function useSpotifyTokens() {
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let interval = null;
    let refreshInterval = null;
    let lastFetchTime = 0;
    const MIN_FETCH_INTERVAL = 10000; // Mínimo 10 segundos entre consultas

    /**
     * Refresca el access token cuando está a punto de expirar
     * Llamado automáticamente antes de la expiración
     */
    const refreshAccessToken = async () => {
      try {
        console.log('🔄 Refrescando access token de Spotify...');
        
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Error al refrescar sesión:', refreshError);
          if (mounted) {
            setError('Error al refrescar token');
          }
          return false;
        }

        if (!session?.provider_token) {
          console.warn('No se pudo obtener nuevo token del refresh');
          return false;
        }

        // Guardar el nuevo token en BD
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
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

        if (mounted) {
          setSpotifyAccessToken(session.provider_token);
          setSpotifyRefreshToken(session.provider_refresh_token);
          setTokenExpiresAt(expiresAt);
          setError(null);
        }

        console.log('✅ Token refrescado exitosamente');
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
     * Verifica si el token ha expirado o está por expirar (dentro de 5 minutos)
     * @param {string} expiresAt - ISO timestamp de expiración
     * @returns {boolean} true si debe refrescarse
     */
    const shouldRefreshToken = (expiresAt) => {
      if (!expiresAt) return false;
      
      const now = new Date();
      const expirationTime = new Date(expiresAt);
      const timeUntilExpiry = expirationTime - now;
      
      // Refrescar si faltan menos de 5 minutos para expirar
      const FIVE_MINUTES = 5 * 60 * 1000;
      return timeUntilExpiry < FIVE_MINUTES;
    };

    const captureAndFetchTokens = async () => {
      try {
        // Prevenir llamadas demasiado frecuentes
        const now = Date.now();
        if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
          console.log('⏭️ Omitiendo consulta (demasiado reciente)');
          return;
        }
        lastFetchTime = now;

        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Advertencia al obtener sesión:', sessionError.message);
        }

        const user = session?.user ?? null;

        if (!user) {
          if (mounted) {
            setLoading(false);
            setError(null);
          }
          return;
        }

        // CAPTURA: Si hay tokens en la sesión, guardarlos en la BD
        if (session?.provider_token && session?.provider_refresh_token) {
          console.log('🔑 Capturando tokens de Spotify desde sesión...');
          
          const expiresIn = 3600; // Spotify tokens típicamente expiran en 1 hora
          const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

          // Verificar si ya existen tokens en BD para evitar upsert innecesario
          const { data: existingTokens } = await supabase
            .from('user_spotify_tokens')
            .select('access_token, token_expires_at')
            .eq('user_id', user.id)
            .single();

          // Solo hacer upsert si los tokens son diferentes o están por expirar
          const shouldUpdate = !existingTokens || 
                              existingTokens.access_token !== session.provider_token ||
                              shouldRefreshToken(existingTokens.token_expires_at);

          if (shouldUpdate) {
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
            } else {
              console.log('✅ Tokens guardados exitosamente');
            }
          } else {
            console.log('⏭️ Tokens ya están actualizados en BD');
          }
        }

        // CONSULTA: Obtener tokens desde la BD
        const { data, error: tokensError } = await supabase
          .from('user_spotify_tokens')
          .select('access_token, refresh_token, token_expires_at')
          .eq('user_id', user.id)
          .single();

        if (tokensError) {
          console.warn('No se encontraron tokens en BD:', tokensError.message);
          
          // Si tenemos tokens en la sesión pero no en BD, usar los de la sesión directamente
          if (session?.provider_token && mounted) {
            setSpotifyAccessToken(session.provider_token);
            setSpotifyRefreshToken(session.provider_refresh_token);
            setTokenExpiresAt(new Date(Date.now() + 3600 * 1000).toISOString());
            setError(null);
            console.log('✅ Usando tokens directamente de la sesión');
          } else if (mounted) {
            setError('Tokens de Spotify no disponibles');
            setLoading(false);
          }
          return;
        }

        if (data && mounted) {
          // 🔐 VALIDACIÓN DE EXPIRACIÓN: Verificar si el token está expirado o próximo a expirar
          if (shouldRefreshToken(data.token_expires_at)) {
            console.log('⚠️ Token expirado o próximo a expirar, refrescando...');
            const refreshed = await refreshAccessToken();
            
            if (!refreshed) {
              // Si no se pudo refrescar, usar los tokens existentes (pueden fallar al hacer llamadas)
              setSpotifyAccessToken(data.access_token);
              setSpotifyRefreshToken(data.refresh_token);
              setTokenExpiresAt(data.token_expires_at);
              setError('Token expirado - refresco fallido');
            }
          } else {
            // Token válido, usar normalmente
            setSpotifyAccessToken(data.access_token);
            setSpotifyRefreshToken(data.refresh_token);
            setTokenExpiresAt(data.token_expires_at);
            setError(null);
            
            console.log('✅ Tokens cargados desde BD (válidos hasta ' + new Date(data.token_expires_at).toLocaleTimeString() + ')');
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

    // Capturar y consultar tokens al montar
    captureAndFetchTokens();

    // Verificar tokens cada 30 segundos
    interval = setInterval(captureAndFetchTokens, 30000);

    // Refrescar proactivamente cada 50 minutos (antes de que expire a los 60)
    refreshInterval = setInterval(async () => {
      console.log('⏰ Refresh programado - Verificando si necesita actualización...');
      const { data: tokensData } = await supabase
        .from('user_spotify_tokens')
        .select('token_expires_at')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (tokensData?.token_expires_at && shouldRefreshToken(tokensData.token_expires_at)) {
        await refreshAccessToken();
      }
    }, 50 * 60 * 1000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []); // 🔥 DEPENDENCIAS VACÍAS para evitar loop infinito

  return {
    spotifyAccessToken,
    spotifyRefreshToken,
    tokenExpiresAt,
    loading,
    error
  };
}
