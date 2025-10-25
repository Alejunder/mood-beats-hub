import React, { useState, useEffect } from 'react';
import { usePlaylistGeneration } from '../../hooks/usePlaylistGeneration';
import { supabase } from '../../supabase/supabase.config';
import CircleLoader from '../atoms/CircleLoader';
import './GeneratePlaylistButton.css';

/**
 * 🎵 COMPONENTE DE EJEMPLO: BOTÓN PARA GENERAR PLAYLIST
 * 
 * Demuestra cómo usar el sistema completo de generación de playlists
 * 
 * Props:
 * - mood: string ('feliz', 'triste', 'motivado', 'relajado')
 * - onPlaylistGenerated: función callback cuando se genera exitosamente
 */
const GeneratePlaylistButton = ({ mood, onPlaylistGenerated }) => {
  const { generatePlaylist, loading, error, generatedPlaylist } = usePlaylistGeneration();
  const [currentUser, setCurrentUser] = useState(null);
  const [moodInfo, setMoodInfo] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtener ID del usuario en la tabla users
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        setCurrentUser(userData);
      }
    };

    fetchUser();
  }, []);

  // Obtener información del mood
  useEffect(() => {
    const fetchMoodInfo = async () => {
      const { data } = await supabase
        .from('moods')
        .select('id, name, emoji')
        .ilike('name', mood)
        .single();
      
      setMoodInfo(data);
    };

    if (mood) {
      fetchMoodInfo();
    }
  }, [mood]);

  // Manejar generación
  const handleGenerate = async () => {
    if (!currentUser || !moodInfo) {
      console.error('Usuario o mood no disponibles');
      return;
    }

    const result = await generatePlaylist(
      mood,
      currentUser.id,
      moodInfo.id
    );

    if (result && onPlaylistGenerated) {
      onPlaylistGenerated(result);
    }
  };

  return (
    <div className="generate-playlist-container">
      <button
        onClick={handleGenerate}
        disabled={loading || !currentUser || !moodInfo}
        className="generate-playlist-btn"
      >
        {loading ? (
          <>
            <CircleLoader size="small" />
            <span>Generando tu playlist {moodInfo?.emoji}...</span>
          </>
        ) : (
          <>
            <span className="emoji">{moodInfo?.emoji || '🎵'}</span>
            <span>Generar Playlist {mood}</span>
          </>
        )}
      </button>

      {error && (
        <div className="error-message">
          ❌ Error: {error}
        </div>
      )}

      {generatedPlaylist && (
        <div className="success-message">
          <h3>✅ ¡Playlist creada!</h3>
          <p>{generatedPlaylist.name}</p>
          <p>{generatedPlaylist.trackCount} canciones</p>
          <a 
            href={generatedPlaylist.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="spotify-link"
          >
            🎧 Abrir en Spotify
          </a>
        </div>
      )}
    </div>
  );
};

export default GeneratePlaylistButton;
