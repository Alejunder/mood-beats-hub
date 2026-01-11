import { getPlaylistBySpotifyId, insertPlaylist, updatePlaylist, getUserPlaylists, deletePlaylist } from './databaseService';

/**
 * Guarda una playlist como favorita del usuario
 * AHORA: También guarda en spotify_playlists (solo cuando el usuario marca como favorito)
 */
export const savePlaylistAsFavorite = async (userId, playlistData) => {
  try {
    // PASO 1: Verificar si ya existe en spotify_playlists
    const existingResult = await getPlaylistBySpotifyId(userId, playlistData.id);
    
    if (!existingResult.success) {
      throw new Error(existingResult.error);
    }

    let playlistInDb = existingResult.data;

    // PASO 2: Si no existe, crear en spotify_playlists
    if (!playlistInDb) {
      const insertResult = await insertPlaylist({
        user_id: userId,
        spotify_playlist_id: playlistData.id,
        name: playlistData.name,
        description: playlistData.description || '',
        image_url: playlistData.imageUrl,
        spotify_url: playlistData.spotifyUrl,
        is_generated: true,
        is_favorite: true, // ✨ Marcar como favorita
        mood_id: playlistData.moodId,
        generation_params: playlistData.generationParams
      });

      if (!insertResult.success) throw new Error(insertResult.error);
      playlistInDb = insertResult.data;
    } else {
      // Si ya existe, actualizar a favorita
      const updateResult = await updatePlaylist(playlistInDb.id, { is_favorite: true });
      if (!updateResult.success) throw new Error(updateResult.error);
    }

    return { success: true, data: playlistInDb };
  } catch (error) {
    console.error('Error guardando playlist favorita:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene las playlists favoritas de un usuario
 */
export const getFavoritePlaylists = async (userId) => {
  try {
    const result = await getUserPlaylists(userId, { favorites: true });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error obteniendo playlists favoritas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Elimina una playlist de favoritos DEL USUARIO
 * ⚠️ IMPORTANTE: NO elimina de Spotify, solo de la base de datos del usuario
 * La playlist sigue existiendo en Spotify
 */
export const removeFavoritePlaylist = async (userId, spotifyPlaylistId) => {
  try {
    // Eliminar SOLO de Supabase (la playlist sigue en Spotify)
    const result = await deletePlaylist(userId, spotifyPlaylistId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando playlist de favoritos:', error);
    return { success: false, error: error.message };
  }
};
/**
 * Elimina una playlist COMPLETAMENTE (de Spotify y de la BD)
 * ⚠️ SOLO usar para playlists generadas que NO fueron guardadas como favoritas
 */
export const deletePlaylistCompletely = async (spotifyPlaylistId, accessToken, userId = null) => {
  try {
    // PASO 1: Eliminar de Spotify
    if (accessToken) {
      try {
        const { spotifyService } = await import('./spotifyService');
        await spotifyService.deletePlaylist(spotifyPlaylistId, accessToken);
      } catch (spotifyError) {
        console.warn('⚠️ Error eliminando de Spotify:', spotifyError.message);
      }
    }
    
    // PASO 2: Eliminar de BD si se proporcionó userId
    if (userId) {
      const result = await deletePlaylist(userId, spotifyPlaylistId);
      if (!result.success) {
        console.warn('⚠️ Error eliminando de BD:', result.error);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error en eliminación completa:', error);
    return { success: false, error: error.message };
  }
};
/**
 * Verifica si una playlist es favorita
 */
export const isPlaylistFavorite = async (userId, spotifyPlaylistId) => {
  try {
    const result = await getPlaylistBySpotifyId(userId, spotifyPlaylistId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return { 
      success: true, 
      isFavorite: result.data?.is_favorite || false 
    };
  } catch (error) {
    console.error('Error verificando playlist favorita:', error);
    return { success: false, error: error.message, isFavorite: false };
  }
};