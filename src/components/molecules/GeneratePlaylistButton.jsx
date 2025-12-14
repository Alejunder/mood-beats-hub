import React, { useState, useEffect } from 'react';
import { usePlaylistGeneration } from '../../hooks/usePlaylistGeneration';
import { supabase } from '../../supabase/supabase.config';
import CircleLoader from '../atoms/CircleLoader';
import { PlaylistQuizModal } from '../organisms/PlaylistQuizModal';
import './GeneratePlaylistButton.css';

/**
 * 🎵 COMPONENTE: BOTÓN PARA GENERAR PLAYLIST CON QUIZ
 * 
 * Ahora el quiz es OBLIGATORIO. El botón abre el quiz antes de generar.
 * 
 * Props:
 * - mood: string ('feliz', 'triste', 'motivado', 'relajado')
 * - onPlaylistGenerated: función callback cuando se genera exitosamente
 */
const GeneratePlaylistButton = ({ mood, onPlaylistGenerated }) => {
  const { generatePlaylist, loading, error, generatedPlaylist } = usePlaylistGeneration();
  const [currentUser, setCurrentUser] = useState(null);
  const [moodInfo, setMoodInfo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

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

  // Abrir el quiz
  const handleOpenQuiz = () => {
    if (!currentUser || !moodInfo) {
      console.error('Usuario o mood no disponibles');
      return;
    }
    setShowQuiz(true);
  };

  // Manejar respuestas del quiz y generar playlist
  const handleQuizSubmit = async (quizAnswers) => {
    setShowQuiz(false);

    const result = await generatePlaylist(
      mood,
      currentUser.id,
      moodInfo.id,
      quizAnswers
    );

    if (result && onPlaylistGenerated) {
      onPlaylistGenerated(result);
    }
  };

  return (
    <div className="generate-playlist-container">
      <button
        onClick={handleOpenQuiz}
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
            <span>Personalizar y Generar Playlist</span>
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

      {/* Modal del Quiz */}
      {showQuiz && (
        <PlaylistQuizModal
          onClose={() => setShowQuiz(false)}
          onSubmit={handleQuizSubmit}
        />
      )}
    </div>
  );
};

export default GeneratePlaylistButton;
