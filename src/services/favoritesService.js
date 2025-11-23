import { supabase } from '../supabase/supabase.config';

/**
 * Guarda una playlist como favorita del usuario
 * AHORA: También guarda en spotify_playlists (solo cuando el usuario marca como favorito)
 */
export const savePlaylistAsFavorite = async (userId, playlistData) => {
  try {
    // PASO 1: Verificar si ya existe en spotify_playlists
    const { data: existingPlaylist } = await supabase
      .from('spotify_playlists')
      .select('id')
      .eq('spotify_playlist_id', playlistData.id)
      .eq('user_id', userId)
      .single();

    let playlistInDb = existingPlaylist;

    // PASO 2: Si no existe, crear en spotify_playlists
    if (!existingPlaylist) {
      console.log('💾 Guardando playlist en spotify_playlists...');
      
      const { data: newPlaylist, error: playlistError } = await supabase
        .from('spotify_playlists')
        .insert({
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
        })
        .select()
        .single();

      if (playlistError) throw playlistError;
      playlistInDb = newPlaylist;
      console.log('✅ Playlist guardada en spotify_playlists');
    } else {
      // Si ya existe, actualizar a favorita
      console.log('📝 Actualizando playlist existente como favorita...');
      
      const { error: updateError } = await supabase
        .from('spotify_playlists')
        .update({ is_favorite: true })
        .eq('id', existingPlaylist.id);

      if (updateError) throw updateError;
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
    const { data, error } = await supabase
      .from('spotify_playlists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
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
    console.log('🗑️ Eliminando playlist de favoritos del usuario...');
    console.log('   User ID:', userId);
    console.log('   Spotify Playlist ID:', spotifyPlaylistId);

    // Eliminar SOLO de Supabase (la playlist sigue en Spotify)
    const { error } = await supabase
      .from('spotify_playlists')
      .delete()
      .eq('user_id', userId)
      .eq('spotify_playlist_id', spotifyPlaylistId);

    if (error) throw error;
    
    console.log('✅ Playlist eliminada de favoritos (permanece en Spotify)');
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
    console.log('🗑️ Eliminando playlist COMPLETAMENTE...');
    console.log('   Spotify Playlist ID:', spotifyPlaylistId);

    // PASO 1: Eliminar de Spotify
    if (accessToken) {
      try {
        const { spotifyService } = await import('./spotifyService');
        await spotifyService.deletePlaylist(spotifyPlaylistId, accessToken);
        console.log('✅ Playlist eliminada de Spotify');
      } catch (spotifyError) {
        console.warn('⚠️ Error eliminando de Spotify:', spotifyError.message);
      }
    }

    // PASO 2: Eliminar de BD si se proporcionó userId
    if (userId) {
      const { error } = await supabase
        .from('spotify_playlists')
        .delete()
        .eq('user_id', userId)
        .eq('spotify_playlist_id', spotifyPlaylistId);

      if (error) {
        console.warn('⚠️ Error eliminando de BD:', error.message);
      } else {
        console.log('✅ Playlist eliminada de BD');
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
    const { data, error } = await supabase
      .from('spotify_playlists')
      .select('id, is_favorite')
      .eq('user_id', userId)
      .eq('spotify_playlist_id', spotifyPlaylistId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, isFavorite: data?.is_favorite || false };
  } catch (error) {
    console.error('Error verificando playlist favorita:', error);
    return { success: false, error: error.message, isFavorite: false };
  }
};
