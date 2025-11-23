import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpotifyPlayer = (accessToken) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const playerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Función para reconectar automáticamente
  const reconnectPlayer = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts && playerRef.current) {
      reconnectAttempts.current += 1;
      console.log(`🔄 Intentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      
      setTimeout(() => {
        try {
          playerRef.current.connect().then(success => {
            if (success) {
              console.log('✅ Reconexión exitosa');
              setIsReady(true);
              setError(null);
              reconnectAttempts.current = 0;
            } else {
              console.warn('⚠️ Reconexión fallida, reintentando...');
              reconnectPlayer();
            }
          }).catch(err => {
            console.error('❌ Error en reconexión:', err);
            reconnectPlayer();
          });
        } catch (err) {
          console.error('❌ Error crítico en reconexión:', err);
        }
      }, 2000 * reconnectAttempts.current); // Incrementar delay con cada intento
    } else {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      setError('No se pudo conectar al reproductor. Recarga la página.');
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      console.warn('⚠️ No hay accessToken disponible');
      return;
    }

    // Suprimir advertencia de robustness level
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = function(...args) {
      if (args[0]?.includes?.('robustness level') || 
          args[0]?.includes?.('EME')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = function(...args) {
      if (args[0]?.includes?.('robustness level') || 
          args[0]?.includes?.('EME')) {
        return;
      }
      originalError.apply(console, args);
    };

    let scriptLoaded = false;
    
    // Verificar si el SDK ya está cargado
    if (window.Spotify) {
      console.log('✅ SDK de Spotify ya estaba cargado');
      initializePlayer();
    } else {
      // Cargar el SDK de Spotify
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      
      script.onerror = () => {
        console.error('❌ Error cargando SDK de Spotify');
        setError('Error cargando reproductor. Verifica tu conexión.');
      };

      script.onload = () => {
        scriptLoaded = true;
        console.log('✅ SDK de Spotify cargado');
      };

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ SDK de Spotify listo');
        initializePlayer();
      };
    }

    function initializePlayer() {
      try {
        const spotifyPlayer = new window.Spotify.Player({
          name: 'MoodBeatsHub Player',
          getOAuthToken: (cb) => {
            cb(accessToken);
          },
          volume: 0.5,
          enableMediaSession: true,
        });

        playerRef.current = spotifyPlayer;

        // Listeners del reproductor con manejo de errores
        spotifyPlayer.addListener('ready', ({ device_id }) => {
          console.log('✅ Reproductor listo con Device ID:', device_id);
          setDeviceId(device_id);
          setIsReady(true);
          setError(null);
          reconnectAttempts.current = 0;
        });

        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
          console.log('⚠️ Dispositivo no disponible:', device_id);
          setIsReady(false);
          // Intentar reconectar
          reconnectPlayer();
        });

        spotifyPlayer.addListener('player_state_changed', (state) => {
          try {
            if (!state) {
              console.warn('⚠️ Estado del reproductor es null');
              return;
            }

            if (state.track_window?.current_track) {
              setCurrentTrack(state.track_window.current_track);
            }
            
            setIsPaused(state.paused ?? true);
            setPosition(state.position ?? 0);
            setDuration(state.duration ?? 0);
          } catch (error) {
            console.error('❌ Error actualizando estado del player:', error);
          }
        });

        spotifyPlayer.addListener('initialization_error', ({ message }) => {
          console.error('❌ Error de inicialización:', message);
          setError('Error inicializando reproductor');
          // Intentar reconectar
          setTimeout(() => reconnectPlayer(), 3000);
        });

        spotifyPlayer.addListener('authentication_error', ({ message }) => {
          console.error('❌ Error de autenticación:', message);
          setError('Error de autenticación. Cierra sesión y vuelve a iniciar.');
        });

        spotifyPlayer.addListener('account_error', ({ message }) => {
          console.error('❌ Error de cuenta:', message);
          setError('Se requiere Spotify Premium para usar el reproductor');
        });

        spotifyPlayer.addListener('playback_error', ({ message }) => {
          console.error('❌ Error de reproducción:', message);
          // No detener el reproductor, solo registrar el error
        });

        // Conectar con reintentos automáticos
        spotifyPlayer.connect()
          .then(success => {
            if (success) {
              console.log('✅ Conectado al reproductor de Spotify');
              setPlayer(spotifyPlayer);
            } else {
              console.error('❌ No se pudo conectar al reproductor');
              reconnectPlayer();
            }
          })
          .catch(error => {
            console.error('❌ Error conectando reproductor:', error);
            reconnectPlayer();
          });

      } catch (error) {
        console.error('❌ Error crítico inicializando player:', error);
        setError('Error crítico. Recarga la página.');
      }
    }

    return () => {
      // Restaurar console
      console.warn = originalWarn;
      console.error = originalError;
      
      // Desconectar player
      if (playerRef.current) {
        try {
          playerRef.current.disconnect();
          console.log('🔌 Reproductor desconectado');
        } catch (error) {
          console.error('❌ Error desconectando player:', error);
        }
      }
    };
  }, [accessToken, reconnectPlayer]);

  // Funciones con manejo de errores robusto
  const playPlaylist = useCallback(async (playlistUri) => {
    if (!deviceId || !accessToken) {
      console.error('⚠️ Dispositivo no listo o sin token');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: playlistUri }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error ${response.status}`);
      }

      console.log('✅ Playlist reproduciendo');
    } catch (error) {
      console.error('❌ Error al reproducir playlist:', error);
      // No lanzar error, solo registrar
    }
  }, [deviceId, accessToken]);

  const safePlayerAction = useCallback((action, actionName) => {
    return async () => {
      try {
        if (!player) {
          console.warn(`⚠️ Player no disponible para ${actionName}`);
          return;
        }

        if (typeof player[action] !== 'function') {
          console.warn(`⚠️ Función ${action} no existe en player`);
          return;
        }

        await player[action]();
      } catch (error) {
        console.error(`❌ Error en ${actionName}:`, error);
        // No lanzar error, continuar funcionando
      }
    };
  }, [player]);

  const togglePlay = useCallback(() => safePlayerAction('togglePlay', 'togglePlay')(), [safePlayerAction]);
  const nextTrack = useCallback(() => safePlayerAction('nextTrack', 'nextTrack')(), [safePlayerAction]);
  const previousTrack = useCallback(() => safePlayerAction('previousTrack', 'previousTrack')(), [safePlayerAction]);

  const seek = useCallback((positionMs) => {
    if (!player) {
      console.warn('⚠️ Player no disponible para seek');
      return;
    }

    if (typeof positionMs !== 'number' || isNaN(positionMs)) {
      console.warn('⚠️ Posición inválida:', positionMs);
      return;
    }

    try {
      player.seek(positionMs).catch(err => {
        console.error('❌ Error en seek:', err);
      });
    } catch (error) {
      console.error('❌ Error al buscar posición:', error);
    }
  }, [player]);

  const setVolume = useCallback((volume) => {
    if (!player) {
      console.warn('⚠️ Player no disponible para setVolume');
      return;
    }

    if (typeof volume !== 'number' || isNaN(volume)) {
      console.warn('⚠️ Volumen inválido:', volume);
      return;
    }

    try {
      const validVolume = Math.max(0, Math.min(1, volume));
      player.setVolume(validVolume).catch(err => {
        console.error('❌ Error en setVolume:', err);
      });
    } catch (error) {
      console.error('❌ Error al cambiar volumen:', error);
    }
  }, [player]);

  // Siempre retornar funciones, nunca null o undefined
  return {
    isReady: isReady && player !== null && !error,
    isPaused: isPaused ?? true,
    currentTrack: currentTrack || null,
    position: typeof position === 'number' ? position : 0,
    duration: typeof duration === 'number' ? duration : 0,
    error: error || null,
    playPlaylist,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  };
};
