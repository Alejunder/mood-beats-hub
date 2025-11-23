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
          setDeviceId(null);
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
          setError(`Error de reproducción: ${message}`);
          // Limpiar el error después de 5 segundos
          setTimeout(() => setError(null), 5000);
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
    if (!accessToken) {
      console.error('⚠️ No hay token de acceso');
      setError('No hay token de acceso. Por favor, recarga la página.');
      return;
    }

    // Si no hay deviceId, intentar obtener un dispositivo activo
    let activeDeviceId = deviceId;
    
    if (!activeDeviceId) {
      console.log('🔍 No hay deviceId, buscando dispositivos activos...');
      try {
        const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json();
          const activeDevice = devicesData.devices?.find(d => d.is_active);
          
          if (activeDevice) {
            activeDeviceId = activeDevice.id;
            console.log('✅ Dispositivo activo encontrado:', activeDeviceId);
            setDeviceId(activeDeviceId);
          } else if (devicesData.devices?.length > 0) {
            // Si hay dispositivos pero ninguno está activo, usar el primero
            activeDeviceId = devicesData.devices[0].id;
            console.log('⚠️ No hay dispositivo activo, usando el primero disponible:', activeDeviceId);
            setDeviceId(activeDeviceId);
          }
        }
      } catch (err) {
        console.warn('⚠️ Error obteniendo dispositivos:', err);
      }
    }

    // Si aún no hay dispositivo, esperar un poco y reintentar
    if (!activeDeviceId) {
      console.warn('⚠️ No se encontró ningún dispositivo disponible');
      setError('No se encontró ningún dispositivo de Spotify. Asegúrate de tener Spotify abierto o recarga la página.');
      
      // Intentar reconectar el player
      if (playerRef.current) {
        try {
          await playerRef.current.connect();
          // Esperar un momento para que el dispositivo se registre
          await new Promise(resolve => setTimeout(resolve, 2000));
          activeDeviceId = deviceId;
        } catch (err) {
          console.error('❌ Error reconectando player:', err);
        }
      }
      
      if (!activeDeviceId) {
        return;
      }
    }

    try {
      // Primero, intentar transferir la reproducción al dispositivo web si es necesario
      if (activeDeviceId !== deviceId) {
        try {
          await fetch(`https://api.spotify.com/v1/me/player`, {
            method: 'PUT',
            body: JSON.stringify({ device_ids: [activeDeviceId], play: false }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log('✅ Reproducción transferida al dispositivo web');
        } catch (transferError) {
          console.warn('⚠️ Error transfiriendo reproducción:', transferError);
        }
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: playlistUri }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Error ${response.status}`;
        
        // Si el error es 404 (device not found), intentar sin device_id
        if (response.status === 404 || errorMessage.includes('Device not found')) {
          console.warn('⚠️ Dispositivo no encontrado, intentando sin device_id...');
          
          const retryResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            body: JSON.stringify({ context_uri: playlistUri }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json().catch(() => ({}));
            throw new Error(retryErrorData.error?.message || `Error ${retryResponse.status}`);
          }
          
          console.log('✅ Playlist reproduciendo (sin device_id)');
          setError(null);
          return;
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Playlist reproduciendo');
      setError(null);
    } catch (error) {
      console.error('❌ Error al reproducir playlist:', error);
      
      // Mensajes de error más amigables
      if (error.message.includes('Device not found') || error.message.includes('404')) {
        setError('Dispositivo no encontrado. Asegúrate de tener Spotify abierto o recarga la página.');
      } else if (error.message.includes('Premium')) {
        setError('Se requiere Spotify Premium para reproducir música.');
      } else {
        setError(`Error al reproducir: ${error.message}`);
      }
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
