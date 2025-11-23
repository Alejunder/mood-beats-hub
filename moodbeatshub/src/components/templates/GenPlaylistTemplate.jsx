import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getPlaylistsByMood } from '../../services/spotifyService';
import { generatePlaylistByMood } from '../../services/playlistGenerationService';
import { savePlaylistAsFavorite, isPlaylistFavorite, removeFavoritePlaylist, deletePlaylistCompletely } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { PlaylistQuizModal } from '../organisms/PlaylistQuizModal';
import { AVAILABLE_MOODS } from '../../services/playlistQuizService';
import { SpotifyPlayer } from '../molecules/SpotifyPlayer';
import { useSpotifyPlayer } from '../../hooks/useSpotifyPlayer';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslatedAvailableMoods } from '../../utils/moodTranslations';
import './styles/GenPlaylistTemplate.css';

export function SelectMoodTemplate({ spotifyAccessToken, tokensLoading }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [hasShownInitialQuiz, setHasShownInitialQuiz] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  // Hook del reproductor de Spotify
  const {
    isReady: playerReady,
    isPaused,
    currentTrack,
    position,
    duration,
    playPlaylist,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  } = useSpotifyPlayer(spotifyAccessToken);

  const loadFallbackPlaylists = useCallback(() => {
    if (!selectedMood) return;
    
    const playlistTitles = {
      feliz: [
        { title: 'Energía Positiva', emoji: '😊', description: 'Vibras alegres para sonreír' },
        { title: 'Good Vibes Only', emoji: '✨', description: 'Solo buenas vibras aquí' },
        { title: 'Fiesta Continua', emoji: '🎉', description: 'La celebración no para' },
        { title: 'Felicidad Pura', emoji: '💛', description: 'Alegría en cada nota' },
        { title: 'Ritmos Alegres', emoji: '🌟', description: 'Melodías que levantan el ánimo' },
        { title: 'Sonrisas Musicales', emoji: '�', description: 'Música que te hace feliz' }
      ],
      triste: [
        { title: 'Lágrimas y Melodías', emoji: '💙', description: 'Para procesar emociones' },
        { title: 'Refugio Melancólico', emoji: '🌧️', description: 'Compañía en momentos difíciles' },
        { title: 'Corazón Roto', emoji: '💔', description: 'Canciones que entienden tu dolor' },
        { title: 'Soledad Sonora', emoji: '🌙', description: 'Abrazando la tristeza' },
        { title: 'Reflexiones Profundas', emoji: '🌊', description: 'Para pensar y sentir' },
        { title: 'Lluvia Interior', emoji: '☔', description: 'Catarsis emocional' }
      ],
      motivado: [
        { title: 'Energía Máxima', emoji: '⚡', description: 'Impulso para alcanzar tus metas' },
        { title: 'Fuerza Imparable', emoji: '🔥', description: 'Nada puede detenerte ahora' },
        { title: 'Workout Beast', emoji: '💪', description: 'Perfecta para el gimnasio' },
        { title: 'Actitud de Campeón', emoji: '🏆', description: 'Mentalidad ganadora en cada beat' },
        { title: 'Poder Interior', emoji: '🚀', description: 'Despierta tu mejor versión' },
        { title: 'Sin Límites', emoji: '⚔️', description: 'Rompe todas las barreras' }
      ],
      relajado: [
        { title: 'Paz Interior', emoji: '🧘', description: 'Calma para tu mente' },
        { title: 'Oasis Sonoro', emoji: '🌿', description: 'Desconexión total' },
        { title: 'Mindfulness Musical', emoji: '☮️', description: 'Presente en cada nota' },
        { title: 'Serenidad Total', emoji: '�️', description: 'Tranquilidad absoluta' },
        { title: 'Chill Vibes', emoji: '😌', description: 'Relajación profunda' },
        { title: 'Atardecer Sonoro', emoji: '🌅', description: 'Para descansar y renovar' }
      ]
    };

    const selectedPlaylists = playlistTitles[selectedMood] || playlistTitles.motivado;
    const formattedPlaylists = selectedPlaylists.map((item, index) => ({
      id: index + 1,
      title: item.title,
      description: item.description,
      emoji: item.emoji,
      tracks: 45 + Math.floor(Math.random() * 15),
      duration: `${2 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}min`
    }));
    
    setPlaylists(formattedPlaylists);
  }, [selectedMood]);

  // Mostrar el quiz automáticamente al inicio si no hay mood seleccionado
  useEffect(() => {
    if (!selectedMood && !hasShownInitialQuiz) {
      setShowQuizModal(true);
      setHasShownInitialQuiz(true);
    }
  }, [selectedMood, hasShownInitialQuiz]);

  // Limpiar playlist no guardada cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Al salir del componente, si hay una playlist generada que NO es favorita, eliminarla
      if (generatedPlaylist && !isFavorite && spotifyAccessToken) {
        (async () => {
          try {
            console.log('🧹 Limpiando playlist no guardada al salir...');
            const { spotifyService } = await import('../../services/spotifyService');
            await spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
            console.log('✅ Playlist limpiada exitosamente');
          } catch (error) {
            console.warn('⚠️ Error limpiando playlist:', error.message);
          }
        })();
      }
    };
  }, [generatedPlaylist, isFavorite, spotifyAccessToken]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const loadSpotifyPlaylists = async () => {
      // No cargar playlists hasta que se seleccione un mood
      if (!selectedMood) {
        setLoading(false);
        return;
      }

      if (!spotifyAccessToken) {
        loadFallbackPlaylists();
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPlaylistsByMood(spotifyAccessToken, selectedMood);
        
        const formattedPlaylists = data.tracks?.map((track, index) => ({
          id: track.id || index,
          title: track.name,
          description: track.artists?.map(a => a.name).join(', ') || 'Artista desconocido',
          emoji: ['⚡', '🔥', '💪', '🏆', '🚀', '⚔️'][index % 6],
          tracks: 1,
          duration: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`,
          spotifyUri: track.uri,
          previewUrl: track.preview_url,
        })) || [];

        setPlaylists(formattedPlaylists.slice(0, 6));
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        loadFallbackPlaylists();
      } finally {
        setLoading(false);
      }
    };

    if (!tokensLoading) {
      loadSpotifyPlaylists();
    }
  }, [spotifyAccessToken, tokensLoading, selectedMood, loadFallbackPlaylists]);

  const handleBack = async () => {
    // Si hay una playlist generada que NO es favorita, eliminarla de Spotify
    if (generatedPlaylist && !isFavorite && spotifyAccessToken) {
      try {
        console.log('🗑️ Eliminando playlist no guardada de Spotify...');
        const { spotifyService } = await import('../../services/spotifyService');
        await spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
        console.log('✅ Playlist eliminada de Spotify');
      } catch (error) {
        console.warn('⚠️ Error eliminando playlist de Spotify:', error.message);
        // Continuar navegando aunque falle
      }
    }
    navigate('/home');
  };

  const handlePlaylist = (playlist) => {
    console.log('Reproduciendo playlist:', playlist);
    
    // Si el reproductor está listo y tenemos un URI de Spotify
    if (playerReady && playlist.spotifyUri) {
      playPlaylist(playlist.spotifyUri);
    } else if (playlist.previewUrl) {
      window.open(playlist.previewUrl, '_blank');
    } else if (playlist.spotifyUrl) {
      window.open(playlist.spotifyUrl, '_blank');
    }
  };

  const handleGeneratePlaylist = async () => {
    if (!spotifyAccessToken) {
      setError('No hay token de Spotify disponible');
      return;
    }

    setShowQuizModal(true);
  };

  const handleQuizClose = () => {
    setShowQuizModal(false);
    // Si cierra sin seleccionar mood, volver a home
    if (!selectedMood) {
      navigate('/home');
    }
  };

  const handleQuizSubmit = async (quizAnswers) => {
    setShowQuizModal(false);
    
    // Establecer el mood seleccionado del cuestionario
    const moodId = quizAnswers.mood;
    setSelectedMood(moodId);
    
    setIsGenerating(true);
    setError(null);

    try {
      const moodConfig = AVAILABLE_MOODS[moodId];
      console.log(`🎵 Generando playlist personalizada para mood: ${moodConfig.label}...`);
      console.log('📝 Respuestas del cuestionario:', quizAnswers);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) {
        throw new Error('No se pudo obtener información del usuario');
      }

      // Buscar el mood en la base de datos con el nombre correcto
      const moodNameInDb = moodConfig.label; // 'Feliz', 'Triste', 'Motivado', 'Relajado'
      const { data: moodData, error: moodError } = await supabase
        .from('moods')
        .select('id, name')
        .eq('name', moodNameInDb)
        .single();

      if (moodError || !moodData) {
        console.error('Error obteniendo mood:', moodError);
        throw new Error(`No se pudo obtener información del mood ${moodNameInDb}`);
      }

      console.log('🎭 Mood obtenido:', moodData);

      const result = await generatePlaylistByMood(
        moodId,
        spotifyAccessToken,
        userData.id,
        moodData.id,
        quizAnswers
      );

      if (!result || !result.playlist) {
        throw new Error('No se pudo generar la playlist');
      }

      // ✅ Crear el URI de Spotify a partir del ID
      const spotifyUri = `spotify:playlist:${result.playlist.id}`;

      console.log('📦 Resultado completo del servicio:', result);
      console.log('🎵 Datos de la playlist:', result.playlist);
      
      const formattedPlaylist = {
        id: result.playlist.id,
        name: result.playlist.name,
        description: result.playlist.description,
        spotifyUrl: result.playlist.url,
        spotifyUri: spotifyUri,  // ✨ URI para el reproductor
        imageUrl: result.playlist.imageUrl,
        tracks: result.playlist.trackCount,
        duration: `${Math.floor(result.playlist.trackCount * 3.5)}min`,
        createdAt: new Date().toISOString(),
        // ✨ Información adicional para guardar en favoritos
        userId: result.playlist.userId,
        moodId: result.playlist.moodId,
        generationParams: result.playlist.generationParams
      };

      console.log('📝 Playlist formateada:', formattedPlaylist);
      setGeneratedPlaylist(formattedPlaylist);
      console.log('✅ Estado actualizado - Playlist generada exitosamente');
      
      // Verificar si la playlist es favorita
      checkIfFavorite(userData.id, result.playlist.id);
      
    } catch (err) {
      console.error('❌ Error generando playlist:', err);
      setError('Error al generar playlist: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkIfFavorite = async (userId, playlistId) => {
    const result = await isPlaylistFavorite(userId, playlistId);
    if (result.success) {
      setIsFavorite(result.isFavorite);
    }
  };

  const handleToggleFavorite = async () => {
    if (!generatedPlaylist || savingFavorite) return;

    setSavingFavorite(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) {
        throw new Error('No se pudo obtener información del usuario');
      }

      if (isFavorite) {
        // Confirmar eliminación
        const confirmDelete = window.confirm(
          `${t('removeFavoriteOnly') || '¿Quitar de favoritos?'}\n\n` +
          `✓ Se quitará de tus favoritos en MoodBeatsHub\n` +
          `✓ La playlist seguirá en tu cuenta de Spotify\n\n` +
          `¿Continuar?`
        );
        if (!confirmDelete) {
          setSavingFavorite(false);
          return;
        }

        // Remover SOLO de favoritos (NO elimina de Spotify)
        const result = await removeFavoritePlaylist(userData.id, generatedPlaylist.id);
        if (result.success) {
          setIsFavorite(false);
          console.log('✅ Playlist quitada de favoritos (permanece en Spotify)');
        } else {
          throw new Error(result.error);
        }
      } else {
        // Agregar a favoritos (ahora se guarda en spotify_playlists)
        const result = await savePlaylistAsFavorite(userData.id, {
          id: generatedPlaylist.id,
          name: generatedPlaylist.name,
          description: generatedPlaylist.description,
          spotifyUrl: generatedPlaylist.spotifyUrl,
          imageUrl: generatedPlaylist.imageUrl,
          moodId: generatedPlaylist.moodId,
          generationParams: generatedPlaylist.generationParams
        });
        
        if (result.success) {
          setIsFavorite(true);
          console.log('✅ Playlist guardada en favoritos y en spotify_playlists');
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('❌ Error con favoritos:', err);
      setError('Error al guardar en favoritos: ' + err.message);
    } finally {
      setSavingFavorite(false);
    }
  };

  if (loading || tokensLoading) {
    return (
      <div className="mood-container">
        <CircleLoader />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          {tokensLoading ? t('loadingTokens') : t('loadingPlaylists2')}
        </p>
      </div>
    );
  }

  // Obtener configuración del mood seleccionado o default (con traducciones)
  const translatedMoods = getTranslatedAvailableMoods(t);
  const moodConfig = selectedMood ? translatedMoods[selectedMood] : null;
  const containerStyle = moodConfig ? {
    background: moodConfig.bgGradient,
    '--mood-color': moodConfig.color,
    '--mood-rgb': moodConfig.rgb
  } : {};

  return (
    <div className="mood-container" style={containerStyle}>
      {moodConfig && (
        <>
          <div className="mood-header">
            <button className="back-button" onClick={handleBack}>
              ← {t('back')}
            </button>
            <div className="mood-info">
              <span className="mood-emoji">{moodConfig.headerEmoji}</span>
              <div className="mood-text">
                <h1>{t('state')}: {moodConfig.label}</h1>
                <p>{moodConfig.description}</p>
              </div>
            </div>
            <div className="user-badge">
              <span>{user?.user_metadata?.name || user?.email || t('user')}</span>
            </div>
          </div>

          <main className="mood-main">
            <div className="welcome-card">
              <h2>¡{selectedMood === 'feliz' ? t('enjoy') : 
                     selectedMood === 'triste' ? t('accompanying') :
                     selectedMood === 'motivado' ? t('letsGo') : 
                     t('breathe')} {moodConfig.emoji}</h2>
              <p>
                {spotifyAccessToken 
                  ? t('perfectMusic').replace('{mood}', moodConfig.label.toLowerCase())
                  : t('connectSpotify')
                }
              </p>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.9em' }}>⚠️ {error}</p>}
            </div>

            {/* 🎵 SECCIÓN DE GENERACIÓN DE PLAYLIST */}
            <div className="generate-section">
              <div className="generate-card">
                <div className="generate-header">
                  <div className="generate-icon">🎵</div>
                  <div className="generate-text">
                    <h3>{t('generateTitle')}</h3>
                    <p>{t('generateDesc').replace('{mood}', moodConfig.label.toLowerCase())}</p>
                  </div>
                </div>
                
                <button 
                  className="generate-button"
                  onClick={handleGeneratePlaylist}
                  disabled={isGenerating || !spotifyAccessToken}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner"></span>
                      {t('generating')}
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      {t('generateButton').replace('{mood}', moodConfig.label)}
                    </>
                  )}
                </button>
              </div>

          {generatedPlaylist && (
            <div className="generated-playlist-card">
              <div className="generated-header">
                <span className="success-badge">✅ {t('generated')}</span>
                <span className="generated-time">
                  {new Date(generatedPlaylist.createdAt).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="generated-content">
                <div className="generated-icon">🎵</div>
                <div className="generated-info">
                  <h4>{generatedPlaylist.name}</h4>
                  <p>{generatedPlaylist.description}</p>
                  <div className="generated-meta">
                    <span>{generatedPlaylist.tracks} {t('songs')}</span>
                    <span>•</span>
                    <span>{generatedPlaylist.duration}</span>
                  </div>
                </div>
              </div>

              <div className="generated-actions">
                <a 
                  href={generatedPlaylist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-button"
                  onClick={(e) => {
                    if (playerReady && generatedPlaylist.spotifyUri) {
                      e.preventDefault();
                      playPlaylist(generatedPlaylist.spotifyUri);
                    }
                  }}
                >
                  <span>▶</span>
                  {playerReady ? t('playInPlayer') : t('openInSpotify2')}
                </a>
                <button 
                  className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={savingFavorite}
                  title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <span>{isFavorite ? '❤️' : '🤍'}</span>
                  {savingFavorite ? t('saving') : (isFavorite ? t('favorite') : t('favorites'))}
                </button>
                <button 
                  className="regenerate-button"
                  onClick={handleGeneratePlaylist}
                  disabled={isGenerating}
                >
                  🔄 {t('regenerate')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className="playlist-card"
              onClick={() => handlePlaylist(playlist)}
              style={{
                '--mood-card-color': moodConfig.color,
                '--mood-card-rgb': moodConfig.rgb
              }}
            >
              <div className="playlist-icon">{playlist.emoji}</div>
              <div className="playlist-content">
                <h3>{playlist.title}</h3>
                <p className="playlist-description">{playlist.description}</p>
                <div className="playlist-meta">
                  <span className="meta-item">{playlist.tracks} canciones</span>
                  <span className="meta-divider">•</span>
                  <span className="meta-item">{playlist.duration}</span>
                </div>
              </div>
              <div className="play-button">
                <span>▶</span>
              </div>
            </button>
          ))}
        </div>
      </main>
      </>
      )}

      {/* Mostrar mensaje si no hay mood seleccionado */}
      {!moodConfig && !showQuizModal && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '60vh',
          gap: '20px'
        }}>
          <h2>🎭 {t('selectMood')}</h2>
          <p>{t('completeSurvey')}</p>
          <button 
            className="generate-button"
            onClick={() => setShowQuizModal(true)}
            style={{ padding: '15px 30px', fontSize: '1.1em' }}
          >
            🎵 {t('startSurvey')}
          </button>
        </div>
      )}

      {/* Quiz Modal - FUERA del bloque condicional */}
      {showQuizModal && (
        <PlaylistQuizModal
          onClose={handleQuizClose}
          onSubmit={handleQuizSubmit}
          spotifyAccessToken={spotifyAccessToken}
        />
      )}

      {/* Reproductor de Spotify */}
      {spotifyAccessToken && (
        <SpotifyPlayer
          isReady={playerReady}
          isPaused={isPaused}
          currentTrack={currentTrack}
          position={position}
          duration={duration}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onPrevious={previousTrack}
          onSeek={seek}
          onVolumeChange={setVolume}
        />
      )}
    </div>
  );
}
