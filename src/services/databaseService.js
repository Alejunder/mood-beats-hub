import { supabase } from '../supabase/supabase.config';

/**
 * 💾 DATABASE SERVICE - FACADE
 * 
 * Servicio centralizado para operaciones de base de datos con Supabase.
 * Siguiendo el patrón Facade: ningún componente debe llamar directamente a supabase.from()
 * 
 * PRINCIPIOS:
 * - Una función = una responsabilidad clara
 * - Errores explícitos y semánticos
 * - No exponer detalles internos de Supabase
 * - Todas las operaciones con try/catch obligatorio
 * - RLS siempre activado (validado en BD)
 */

/**
 * 📊 SPOTIFY PLAYLISTS - CRUD
 */

/**
 * Obtiene las playlists de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de filtrado
 * @param {boolean} options.favorites - Solo favoritas
 * @param {boolean} options.generated - Solo generadas
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getUserPlaylists = async (userId, options = {}) => {
  try {
    let query = supabase
      .from('spotify_playlists')
      .select('*')
      .eq('user_id', userId);

    if (options.favorites !== undefined) {
      query = query.eq('is_favorite', options.favorites);
    }

    if (options.generated !== undefined) {
      query = query.eq('is_generated', options.generated);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo playlists:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo playlists:', error);
    return { success: false, error: 'Error interno al obtener playlists' };
  }
};

/**
 * Obtiene una playlist por su ID de Spotify
 * @param {string} userId - ID del usuario
 * @param {string} spotifyPlaylistId - ID de la playlist en Spotify
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getPlaylistBySpotifyId = async (userId, spotifyPlaylistId) => {
  try {
    const { data, error } = await supabase
      .from('spotify_playlists')
      .select('*')
      .eq('user_id', userId)
      .eq('spotify_playlist_id', spotifyPlaylistId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no encontrado
      console.error('❌ Error obteniendo playlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo playlist:', error);
    return { success: false, error: 'Error interno al obtener playlist' };
  }
};

/**
 * Inserta una nueva playlist
 * @param {Object} playlistData - Datos de la playlist
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const insertPlaylist = async (playlistData) => {
  try {
    const { data, error } = await supabase
      .from('spotify_playlists')
      .insert(playlistData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error insertando playlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error inesperado insertando playlist:', error);
    return { success: false, error: 'Error interno al insertar playlist' };
  }
};

/**
 * Actualiza una playlist existente
 * @param {string} playlistId - ID de la playlist en Supabase
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updatePlaylist = async (playlistId, updates) => {
  try {
    const { data, error } = await supabase
      .from('spotify_playlists')
      .update(updates)
      .eq('id', playlistId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando playlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error inesperado actualizando playlist:', error);
    return { success: false, error: 'Error interno al actualizar playlist' };
  }
};

/**
 * Actualiza una playlist por su Spotify ID
 * @param {string} userId - ID del usuario
 * @param {string} spotifyPlaylistId - ID de la playlist en Spotify
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePlaylistBySpotifyId = async (userId, spotifyPlaylistId, updates) => {
  try {
    const { error } = await supabase
      .from('spotify_playlists')
      .update(updates)
      .eq('user_id', userId)
      .eq('spotify_playlist_id', spotifyPlaylistId);

    if (error) {
      console.error('❌ Error actualizando playlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error inesperado actualizando playlist:', error);
    return { success: false, error: 'Error interno al actualizar playlist' };
  }
};

/**
 * Elimina una playlist
 * @param {string} userId - ID del usuario
 * @param {string} spotifyPlaylistId - ID de la playlist en Spotify
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deletePlaylist = async (userId, spotifyPlaylistId) => {
  try {
    const { error } = await supabase
      .from('spotify_playlists')
      .delete()
      .eq('user_id', userId)
      .eq('spotify_playlist_id', spotifyPlaylistId);

    if (error) {
      console.error('❌ Error eliminando playlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error inesperado eliminando playlist:', error);
    return { success: false, error: 'Error interno al eliminar playlist' };
  }
};

/**
 * 👤 USERS - Operaciones
 */

/**
 * Obtiene un usuario por su ID de auth
 * @param {string} authUserId - ID del usuario en auth.users
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserByAuthId = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_auth_supabase', authUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error obteniendo usuario:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo usuario:', error);
    return { success: false, error: 'Error interno al obtener usuario' };
  }
};

/**
 * 🎭 MOODS - Operaciones de lectura
 */

/**
 * Obtiene todos los moods activos
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getActiveMoods = async () => {
  try {
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo moods:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo moods:', error);
    return { success: false, error: 'Error interno al obtener moods' };
  }
};

/**
 * 📈 USER MOOD SESSIONS - Historial
 */

/**
 * Inserta una nueva sesión de mood
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const insertMoodSession = async (sessionData) => {
  try {
    const { data, error } = await supabase
      .from('user_mood_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error insertando sesión de mood:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error inesperado insertando sesión de mood:', error);
    return { success: false, error: 'Error interno al insertar sesión' };
  }
};

/**
 * 🎵 USER MUSIC TASTES - Preferencias
 */

/**
 * Obtiene las preferencias musicales de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getUserMusicTastes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_music_tastes')
      .select('*')
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo preferencias musicales:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo preferencias:', error);
    return { success: false, error: 'Error interno al obtener preferencias' };
  }
};

/**
 * 🎯 HELPERS - Funciones auxiliares
 */

/**
 * Ejecuta una query personalizada (para casos especiales)
 * USAR CON PRECAUCIÓN - Preferir funciones específicas
 * @param {Function} queryBuilder - Función que construye la query
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const executeCustomQuery = async (queryBuilder) => {
  try {
    const result = await queryBuilder(supabase);
    
    if (result.error) {
      console.error('❌ Error en query personalizada:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('❌ Error inesperado en query personalizada:', error);
    return { success: false, error: 'Error interno en query' };
  }
};

// Exportación por defecto
export default {
  // Playlists
  getUserPlaylists,
  getPlaylistBySpotifyId,
  insertPlaylist,
  updatePlaylist,
  updatePlaylistBySpotifyId,
  deletePlaylist,
  
  // Users
  getUserByAuthId,
  
  // Moods
  getActiveMoods,
  
  // Sessions
  insertMoodSession,
  
  // Music Tastes
  getUserMusicTastes,
  
  // Custom
  executeCustomQuery
};
