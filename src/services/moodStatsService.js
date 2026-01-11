import { getCurrentUser } from './authService';
import { getUserPlaylists } from './databaseService';

/**
 * Servicio para obtener estadísticas de emociones basadas en las playlists guardadas
 */
export const moodStatsService = {
  /**
   * Obtiene las estadísticas de emociones contando las playlists guardadas por cada mood
   * @returns {Promise<Object>} Un objeto con los IDs de mood como claves y el conteo como valores
   */
  async getMoodStats() {
    try {
      // Obtener el usuario actual
      const userResult = await getCurrentUser();
      
      if (!userResult.success) {
        console.error('Error al obtener el usuario:', userResult.error);
        return {};
      }

      if (!userResult.data) {
        return {};
      }

      // Obtener todas las playlists del usuario
      const playlistsResult = await getUserPlaylists(userResult.data.id);

      if (!playlistsResult.success) {
        console.error('Error al obtener playlists:', playlistsResult.error);
        return {};
      }

      const playlists = playlistsResult.data;

      if (!playlists || playlists.length === 0) {
        return {};
      }

      // Filtrar solo las que tienen generation_params
      const playlistsWithParams = playlists.filter(
        playlist => playlist.generation_params && playlist.generation_params.mood
      );

      // Contar las playlists por mood
      const moodStats = {};
      
      playlistsWithParams.forEach(playlist => {
        const mood = playlist.generation_params.mood;
        moodStats[mood] = (moodStats[mood] || 0) + 1;
      });

      return moodStats;
    } catch (error) {
      console.error('Error al obtener estadísticas de mood:', error);
      return {};
    }
  },

  /**
   * Obtiene las estadísticas de emociones con información detallada
   * @returns {Promise<Array>} Array de objetos con información de mood y conteo
   */
  async getDetailedMoodStats() {
    try {
      const moodStats = await this.getMoodStats();
      
      // Convertir a array ordenado por conteo
      const statsArray = Object.entries(moodStats).map(([mood, count]) => ({
        mood,
        count
      })).sort((a, b) => b.count - a.count);

      return statsArray;
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      return [];
    }
  }
};
