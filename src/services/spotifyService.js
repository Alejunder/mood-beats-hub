import { tokenCache } from './tokenCacheService.js';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Variables para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshSubscribers = [];

// Notificar a peticiones en cola cuando el token se renueve
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// Agregar petición a la cola de espera
function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

async function spotifyFetch(url, accessToken, options = {}, retryCount = 0) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // ⚠️ DETECTAR ERROR 401: Token expirado
  if (response.status === 401 && retryCount === 0) {
    // Evitar múltiples refreshes simultáneos
    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          resolve(spotifyFetch(url, newToken, options, retryCount + 1));
        });
      });
    }

    isRefreshing = true;

    try {
      // Disparar evento para que App.jsx refresque el token
      const refreshEvent = new CustomEvent('spotify:token:expired');
      window.dispatchEvent(refreshEvent);

      // Esperar el nuevo token (máximo 5 segundos)
      const newToken = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout refreshing token')), 5000);
        
        const handler = (e) => {
          clearTimeout(timeout);
          window.removeEventListener('spotify:token:refreshed', handler);
          resolve(e.detail.accessToken);
        };
        
        window.addEventListener('spotify:token:refreshed', handler);
      });

      isRefreshing = false;
      onTokenRefreshed(newToken);

      // Reintentar la petición con el nuevo token
      return spotifyFetch(url, newToken, options, retryCount + 1);

    } catch (refreshError) {
      isRefreshing = false;
      
      // Disparar evento de logout forzado
      window.dispatchEvent(new CustomEvent('spotify:auth:failed'));
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: { message: errorText || `HTTP ${response.status}` } };
    }
    
    throw new Error(error.error?.message || `Spotify API error: ${response.status}`);
  }

  return response.json();
}

export const spotifyService = {
  getUserPlaylists: async (accessToken, limit = 20) => {
    const url = `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}`;
    return spotifyFetch(url, accessToken);
  },

  searchPlaylists: async (accessToken, query, limit = 20) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `${SPOTIFY_API_BASE}/search?q=${encodedQuery}&type=playlist&limit=${limit}`;
    return spotifyFetch(url, accessToken);
  },

  searchArtists: async (query, accessToken, limit = 10) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `${SPOTIFY_API_BASE}/search?q=${encodedQuery}&type=artist&limit=${limit}`;
    return spotifyFetch(url, accessToken);
  },

  getUserTopTracks: async (accessToken, limit = 20, timeRange = 'medium_term') => {
    const url = `${SPOTIFY_API_BASE}/me/top/tracks?limit=${limit}&time_range=${timeRange}`;
    return spotifyFetch(url, accessToken);
  },

  getUserTopArtists: async (accessToken, limit = 20, timeRange = 'medium_term') => {
    const url = `${SPOTIFY_API_BASE}/me/top/artists?limit=${limit}&time_range=${timeRange}`;
    return spotifyFetch(url, accessToken);
  },

  getUserProfile: async (accessToken) => {
    const url = `${SPOTIFY_API_BASE}/me`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🎵 CREAR PLAYLIST EN SPOTIFY
   * Crea una nueva playlist en la cuenta del usuario
   * 
   * @param {string} userId - ID de Spotify del usuario (obtenido de getUserProfile)
   * @param {object} playlistData - Datos de la playlist
   * @param {string} playlistData.name - Nombre de la playlist
   * @param {string} playlistData.description - Descripción (opcional)
   * @param {boolean} playlistData.public - Si es pública o privada (default: false)
   * @param {string} accessToken - Token de acceso de Spotify
   * @returns {Promise<object>} Playlist creada con id, name, external_urls
   * 
   * IMPORTANTE: Requiere scope 'playlist-modify-public' o 'playlist-modify-private'
   */
  createPlaylist: async (userId, playlistData, accessToken) => {
    const url = `${SPOTIFY_API_BASE}/users/${userId}/playlists`;
    
    const body = {
      name: playlistData.name,
      description: playlistData.description || 'Creada con MoodBeatsHub',
      public: playlistData.public ?? false // Default: privada
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Error creando playlist: ${response.status}`);
    }

    return response.json();
  },

  /**
   * 🎶 AGREGAR TRACKS A PLAYLIST
   * Añade canciones a una playlist existente
   * 
   * @param {string} playlistId - ID de la playlist en Spotify
   * @param {string[]} trackUris - Array de URIs de Spotify (formato: 'spotify:track:xxxxx')
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Snapshot ID de la playlist actualizada
   * 
   * EJEMPLO: ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh', 'spotify:track:1301WleyT98MSxVHPZCA6M']
   */
  addTracksToPlaylist: async (playlistId, trackUris, accessToken) => {
    const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: trackUris })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Error agregando tracks: ${response.status}`);
    }

    return response.json();
  },

  /**
   * 📋 OBTENER CANCIONES DE UNA PLAYLIST
   * Obtiene todas las canciones de una playlist de Spotify
   * 
   * @param {string} playlistId - ID de la playlist en Spotify
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Objeto con items (array de tracks)
   */
  getPlaylistTracks: async (playlistId, accessToken) => {
    const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?fields=items(track(id,name,uri,artists(name),album(name,images)))`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🗑️ ELIMINAR PLAYLIST DE SPOTIFY
   * Elimina (unfollow) una playlist de la cuenta del usuario
   * 
   * @param {string} playlistId - ID de la playlist en Spotify
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<void>}
   * 
   * IMPORTANTE: Requiere scope 'playlist-modify-public' o 'playlist-modify-private'
   * Solo el dueño de la playlist puede eliminarla
   */
  deletePlaylist: async (playlistId, accessToken) => {
    const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}/followers`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Error eliminando playlist: ${response.status}`);
    }

    // DELETE retorna 200 sin body si es exitoso
    return { success: true };
  },

  /**
   * 🎯 OBTENER RECOMENDACIONES PERSONALIZADAS
   * Usa el algoritmo de Spotify para generar tracks basados en seeds y parámetros de audio
   * 
   * @param {object} params - Parámetros de la recomendación
   * @param {string[]} params.seed_tracks - Hasta 5 IDs de tracks como "semilla"
   * @param {string[]} params.seed_artists - Hasta 5 IDs de artistas como "semilla"
   * @param {string[]} params.seed_genres - Hasta 5 géneros como "semilla"
   * @param {number} params.target_valence - Positividad musical (0.0-1.0)
   * @param {number} params.target_energy - Energía (0.0-1.0)
   * @param {number} params.target_danceability - Bailabilidad (0.0-1.0)
   * @param {number} params.target_tempo - Tempo en BPM
   * @param {number} params.limit - Número de tracks (default: 20, max: 100)
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Array de tracks recomendados
   * 
   * EJEMPLO MOOD FELIZ:
   * { seed_tracks: ['4iV5W9u...'], target_valence: 0.8, target_energy: 0.7, limit: 20 }
   */
  getRecommendations: async (params, accessToken) => {
    // Construir query string con parámetros
    const queryParams = new URLSearchParams();
    
    // Agregar seeds (mínimo 1, máximo 5 combinados)
    if (params.seed_tracks) {
      queryParams.append('seed_tracks', params.seed_tracks.join(','));
    }
    if (params.seed_artists) {
      queryParams.append('seed_artists', params.seed_artists.join(','));
    }
    if (params.seed_genres) {
      queryParams.append('seed_genres', params.seed_genres.join(','));
    }
    
    // 🌍 IMPORTANTE: Agregar market (región) del usuario
    // Spotify requiere esto para evitar errores 404 en algunos casos
    if (params.market) {
      queryParams.append('market', params.market);
    } else {
      // Por defecto, usar "from_token" para obtener el mercado del usuario automáticamente
      queryParams.append('market', 'from_token');
    }
    
    // Parámetros de audio (target_* para valores deseados)
    if (params.target_valence !== undefined) {
      queryParams.append('target_valence', params.target_valence);
    }
    if (params.target_energy !== undefined) {
      queryParams.append('target_energy', params.target_energy);
    }
    if (params.target_danceability !== undefined) {
      queryParams.append('target_danceability', params.target_danceability);
    }
    if (params.target_tempo !== undefined) {
      queryParams.append('target_tempo', params.target_tempo);
    }
    if (params.target_acousticness !== undefined) {
      queryParams.append('target_acousticness', params.target_acousticness);
    }
    if (params.target_instrumentalness !== undefined) {
      queryParams.append('target_instrumentalness', params.target_instrumentalness);
    }
    
    // Límite de resultados
    queryParams.append('limit', params.limit || 20);
    
    const url = `${SPOTIFY_API_BASE}/recommendations?${queryParams.toString()}`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🎼 OBTENER CARACTERÍSTICAS DE AUDIO
   * Analiza las características musicales de uno o múltiples tracks
   * 
   * @param {string[]} trackIds - Array de IDs de tracks (máximo 100)
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Características de audio de cada track
   * 
   * RETORNA:
   * - valence: Positividad (0.0 = triste, 1.0 = feliz)
   * - energy: Energía (0.0 = calma, 1.0 = intensa)
   * - danceability: Qué tan bailable es (0.0-1.0)
   * - tempo: Velocidad en BPM
   * - acousticness: Qué tan acústico es (0.0-1.0)
   * - instrumentalness: Nivel instrumental vs vocal (0.0-1.0)
   * - loudness: Volumen en dB
   * - speechiness: Qué tan hablado es (0.0-1.0)
   * 
   * USO: Analizar tracks del usuario para generar recomendaciones similares
   */
  getAudioFeatures: async (trackIds, accessToken) => {
    const url = `${SPOTIFY_API_BASE}/audio-features?ids=${trackIds.join(',')}`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🎭 OBTENER GÉNEROS DISPONIBLES
   * Lista de géneros que Spotify acepta como seeds para recomendaciones
   * 
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Array de géneros disponibles
   * 
   * EJEMPLOS: 'pop', 'rock', 'hip-hop', 'electronic', 'classical', etc.
   */
  getAvailableGenreSeeds: async (accessToken) => {
    const url = `${SPOTIFY_API_BASE}/recommendations/available-genre-seeds`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 📊 OBTENER TRACKS RECIENTEMENTE ESCUCHADOS
   * Historial de reproducción del usuario (últimos 50)
   * 
   * @param {string} accessToken - Token de acceso
   * @param {number} limit - Número de tracks (default: 20, max: 50)
   * @returns {Promise<object>} Tracks escuchados recientemente con timestamp
   */
  getRecentlyPlayed: async (accessToken, limit = 20) => {
    const url = `${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🎵 OBTENER INFORMACIÓN DE MÚLTIPLES TRACKS
   * Verifica y obtiene detalles de hasta 50 tracks por ID
   * 
   * @param {string[]} trackIds - Array de IDs de tracks
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Información de los tracks
   */
  getTracksInfo: async (trackIds, accessToken) => {
    if (!trackIds || trackIds.length === 0) {
      return { tracks: [] };
    }
    const ids = trackIds.slice(0, 50).join(','); // Máximo 50 tracks
    const url = `${SPOTIFY_API_BASE}/tracks?ids=${ids}`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🎤 OBTENER INFORMACIÓN DE MÚLTIPLES ARTISTAS
   * Verifica y obtiene detalles de hasta 50 artistas por ID
   * 
   * @param {string[]} artistIds - Array de IDs de artistas
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Información de los artistas
   */
  getArtistsInfo: async (artistIds, accessToken) => {
    if (!artistIds || artistIds.length === 0) {
      return { artists: [] };
    }
    const ids = artistIds.slice(0, 50).join(','); // Máximo 50 artistas
    const url = `${SPOTIFY_API_BASE}/artists?ids=${ids}`;
    return spotifyFetch(url, accessToken);
  },

  /**
   * 🔍 BUSCAR TRACKS CON FILTROS (ALTERNATIVA A /recommendations)
   * Busca tracks usando queries de búsqueda avanzada
   * 
   * @param {object} params - Parámetros de búsqueda
   * @param {string[]} params.genres - Géneros musicales
   * @param {string[]} params.artists - Nombres de artistas
   * @param {number} params.year - Año (para variedad)
   * @param {string} params.mood - Término de mood para la búsqueda
   * @param {number} params.limit - Número de resultados
   * @param {string} accessToken - Token de acceso
   * @returns {Promise<object>} Tracks encontrados
   */
  searchTracksAdvanced: async (params, accessToken) => {
    const { genres = [], artists = [], year, mood, limit = 50 } = params;
    
    // Construir query de búsqueda simple (Spotify search es sensible)
    let query = '';
    
    // Prioridad: mood keyword (más genérico funciona mejor)
    if (mood) {
      query = mood;
    }
    
    // Si tenemos artista, agregar
    if (artists && artists.length > 0 && artists[0]) {
      query = artists[0]; // Solo el artista, más simple
    }
    
    // Si tenemos género, usar solo género
    if (genres && genres.length > 0 && genres[0]) {
      query = `genre:${genres[0]}`;
    }
    
    // Fallback a un término genérico
    if (!query) {
      query = year ? `year:${year}` : 'popular';
    }
    
    const url = `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
    
    return spotifyFetch(url, accessToken);
  }
};

export const getPlaylistsByMood = async (accessToken, mood) => {
  const moodQueries = {
    feliz: 'happy upbeat positive',
    triste: 'sad melancholic emotional',
    motivado: 'workout motivation energetic',
    relajado: 'chill relax calm ambient'
  };

  const query = moodQueries[mood.toLowerCase()] || mood;
  
  try {
    const data = await spotifyService.searchPlaylists(accessToken, query, 20);
    return data;
  } catch (error) {
    throw error;
  }
};
