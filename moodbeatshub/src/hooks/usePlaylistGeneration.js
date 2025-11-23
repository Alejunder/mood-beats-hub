import { useState } from 'react';
import { generatePlaylistByMood, getUserGeneratedPlaylists, deleteGeneratedPlaylist } from '../services/playlistGenerationService';
import { useSpotifyTokens } from './useSpotifyTokens';

/**
 * 🎵 HOOK PARA GESTIÓN DE PLAYLISTS GENERADAS
 * 
 * Proporciona funciones y estado para:
 * - Generar playlists personalizadas por mood
 * - Listar playlists generadas del usuario
 * - Eliminar playlists generadas
 */
export const usePlaylistGeneration = () => {
  const { accessToken } = useSpotifyTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);

  /**
   * 🎨 Generar nueva playlist
   * 
   * @param {string} mood - Mood ('feliz', 'triste', 'motivado', 'relajado')
   * @param {string} userId - ID del usuario en Supabase
   * @param {string} moodId - ID del mood en la BD
   * @param {object} quizAnswers - OBLIGATORIO: Respuestas del quiz
   */
  const generatePlaylist = async (mood, userId, moodId, quizAnswers) => {
    if (!accessToken) {
      setError('No hay token de Spotify disponible');
      return null;
    }

    if (!quizAnswers) {
      setError('Se requieren las respuestas del cuestionario');
      return null;
    }

    setLoading(true);
    setError(null);
    setGeneratedPlaylist(null);

    try {
      console.log(`🚀 Generando playlist para mood: ${mood}`);
      console.log('📋 Quiz answers:', quizAnswers);
      const result = await generatePlaylistByMood(mood, accessToken, userId, moodId, quizAnswers);
      
      setGeneratedPlaylist(result.playlist);
      console.log('✅ Playlist generada exitosamente:', result.playlist.name);
      
      return result;
    } catch (err) {
      console.error('❌ Error en generatePlaylist:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📋 Obtener todas las playlists generadas del usuario
   */
  const fetchUserPlaylists = async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const playlists = await getUserGeneratedPlaylists(userId);
      return playlists;
    } catch (err) {
      console.error('❌ Error obteniendo playlists:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🗑️ Eliminar playlist
   */
  const removePlaylist = async (playlistId, userId) => {
    setLoading(true);
    setError(null);

    try {
      await deleteGeneratedPlaylist(playlistId, userId);
      console.log('🗑️ Playlist eliminada');
      return true;
    } catch (err) {
      console.error('❌ Error eliminando playlist:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 Resetear estado
   */
  const resetState = () => {
    setError(null);
    setGeneratedPlaylist(null);
  };

  return {
    // Estados
    loading,
    error,
    generatedPlaylist,
    
    // Funciones
    generatePlaylist,
    fetchUserPlaylists,
    removePlaylist,
    resetState
  };
};
