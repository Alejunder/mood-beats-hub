/**
 * Spotify Web Playback SDK Service
 * Gestiona la reproducción de música directamente en la aplicación
 */

class SpotifyPlayerService {
  constructor() {
    this.player = null;
    this.deviceId = null;
    this.isReady = false;
    this.currentTrack = null;
    this.isPaused = true;
    this.volume = 0.5;
    this.listeners = new Set();
  }

  /**
   * Inicializa el Spotify Web Playback SDK
   * @param {string} accessToken - Token de acceso de Spotify
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async initialize(accessToken) {
    if (this.player) {
      return true;
    }

    return new Promise((resolve, reject) => {
      // Cargar el SDK de Spotify si no está cargado
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          this.createPlayer(accessToken, resolve, reject);
        };
      } else {
        this.createPlayer(accessToken, resolve, reject);
      }
    });
  }

  /**
   * Crea el reproductor de Spotify
   */
  createPlayer(accessToken, resolve, reject) {
    this.player = new window.Spotify.Player({
      name: 'MoodBeatsHub Player',
      getOAuthToken: cb => { cb(accessToken); },
      volume: this.volume
    });

    // Errores
    this.player.addListener('initialization_error', ({ message }) => {
      reject(new Error(message));
    });

    this.player.addListener('authentication_error', ({ message }) => {
      reject(new Error(message));
    });

    this.player.addListener('account_error', ({ message }) => {
      reject(new Error(message));
    });

    this.player.addListener('playback_error', ({ message }) => {
      // Playback error occurred
    });

    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      this.deviceId = device_id;
      this.isReady = true;
      resolve(true);
    });

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }) => {
      this.isReady = false;
    });

    // Estado del reproductor
    this.player.addListener('player_state_changed', state => {
      if (!state) return;

      this.currentTrack = state.track_window.current_track;
      this.isPaused = state.paused;
      
      // Notificar a los listeners
      this.notifyListeners({
        track: this.currentTrack,
        isPaused: this.isPaused,
        position: state.position,
        duration: state.duration
      });
    });

    // Conectar el reproductor
    this.player.connect();
  }

  /**
   * Reproduce una playlist
   * @param {string} playlistUri - URI de la playlist (spotify:playlist:xxx)
   * @param {string} accessToken - Token de acceso
   */
  async playPlaylist(playlistUri, accessToken) {
    if (!this.isReady || !this.deviceId) {
      throw new Error('El reproductor no está listo');
    }

    // Esperar un momento para asegurar que el dispositivo esté completamente activo
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Primero, transferir la reproducción a este dispositivo
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: false
        })
      });

      // Pequeño delay para asegurar la transferencia
      await new Promise(resolve => setTimeout(resolve, 300));

      // Ahora reproducir la playlist
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          context_uri: playlistUri,
          offset: { position: 0 },
          position_ms: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Error al reproducir la playlist');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reproduce una canción específica
   * @param {string} trackUri - URI de la canción
   * @param {string} accessToken - Token de acceso
   */
  async playTrack(trackUri, accessToken) {
    if (!this.isReady || !this.deviceId) {
      throw new Error('El reproductor no está listo');
    }

    // Esperar un momento para asegurar que el dispositivo esté completamente activo
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Transferir la reproducción a este dispositivo si es necesario
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_ids: [this.deviceId],
          play: false
        })
      });

      // Pequeño delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Error al reproducir la canción');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Pausa la reproducción
   */
  async pause() {
    if (this.player) {
      await this.player.pause();
    }
  }

  /**
   * Reanuda la reproducción
   */
  async resume() {
    if (this.player) {
      await this.player.resume();
    }
  }

  /**
   * Alterna entre pausa y reproducción
   */
  async togglePlay() {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  /**
   * Siguiente canción
   */
  async nextTrack() {
    if (this.player) {
      await this.player.nextTrack();
    }
  }

  /**
   * Canción anterior
   */
  async previousTrack() {
    if (this.player) {
      await this.player.previousTrack();
    }
  }

  /**
   * Ajusta el volumen
   * @param {number} volume - Volumen entre 0 y 1
   */
  async setVolume(volume) {
    if (this.player && volume >= 0 && volume <= 1) {
      await this.player.setVolume(volume);
      this.volume = volume;
    }
  }

  /**
   * Cambia la posición de reproducción
   * @param {number} positionMs - Posición en milisegundos
   */
  async seek(positionMs) {
    if (this.player && positionMs >= 0) {
      await this.player.seek(positionMs);
    }
  }

  /**
   * Obtiene el estado actual del reproductor
   */
  async getState() {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return null;
  }

  /**
   * Obtiene la posición actual de reproducción
   * @returns {Promise<number>} Posición en milisegundos
   */
  async getCurrentPosition() {
    try {
      const state = await this.getState();
      return state ? state.position : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Suscribe un listener a los cambios de estado
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners(state) {
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Desconecta el reproductor
   */
  disconnect() {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.deviceId = null;
      this.isReady = false;
    }
  }
}

// Instancia singleton
const spotifyPlayerService = new SpotifyPlayerService();

export default spotifyPlayerService;
