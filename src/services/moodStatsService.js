import { supabase } from '../supabase/supabase.config';

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error al obtener el usuario:', userError);
        return {};
      }

      if (!user) {
        return {};
      }

      // Obtener todas las playlists del usuario que tienen generation_params
      const { data: playlists, error: playlistsError } = await supabase
        .from('spotify_playlists')
        .select('generation_params')
        .eq('user_id', user.id)
        .not('generation_params', 'is', null);

      if (playlistsError) {
        console.error('Error al obtener playlists:', playlistsError);
        return {};
      }

      if (!playlists || playlists.length === 0) {
        return {};
      }

      // Contar las playlists por mood
      const moodStats = {};
      
      playlists.forEach(playlist => {
        if (playlist.generation_params && playlist.generation_params.mood) {
          const mood = playlist.generation_params.mood;
          moodStats[mood] = (moodStats[mood] || 0) + 1;
        }
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
