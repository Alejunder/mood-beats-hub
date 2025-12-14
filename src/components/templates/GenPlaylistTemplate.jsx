import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getPlaylistsByMood } from '../../services/spotifyService';
import { generatePlaylistByMood } from '../../services/playlistGenerationService';
import { savePlaylistAsFavorite, isPlaylistFavorite, deletePlaylistCompletely } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { PlaylistQuizModal } from '../organisms/PlaylistQuizModal';
import { AVAILABLE_MOODS } from '../../services/playlistQuizService';
import { PlaylistTracksModal } from '../organisms/PlaylistTracksModal';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslatedAvailableMoods } from '../../utils/moodTranslations';
import { showConfirmDeletePlaylist } from '../molecules/ConfirmDeletePlaylistModal';
import { useAppSettings } from '../../hooks/useAppSettings';
import './styles/GenPlaylistTemplate.css';

export function SelectMoodTemplate({ spotifyAccessToken, tokensLoading }) {
  const { t } = useLanguage();
  const { showNotification } = useAppSettings();
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
  const [showTracksModal, setShowTracksModal] = useState(false);

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
            const { spotifyService } = await import('../../services/spotifyService');
            await spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
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
        const { spotifyService } = await import('../../services/spotifyService');
        await spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
      } catch (error) {
        console.warn('⚠️ Error eliminando playlist de Spotify:', error.message);
        // Continuar navegando aunque falle
      }
    }
    navigate('/home');
  };

  const handlePlaylist = (playlist) => {
    
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
      // Primero intentar búsqueda case-insensitive
      let { data: moodData, error: moodError } = await supabase
        .from('moods')
        .select('id, name')
        .ilike('name', moodNameInDb)
        .single();

      // Si falla, intentar búsqueda exacta
      if (moodError || !moodData) {
        console.warn('⚠️ Búsqueda case-insensitive falló, intentando exacta...', moodError);
        const exactResult = await supabase
          .from('moods')
          .select('id, name')
          .eq('name', moodNameInDb)
          .single();
        
        if (!exactResult.error && exactResult.data) {
          moodData = exactResult.data;
          moodError = null;
        } else {
          moodError = exactResult.error;
        }
      }

      // Si aún falla, listar todos los moods disponibles para debugging
      if (moodError || !moodData) {
        console.error('❌ Error obteniendo mood:', moodError);
        
        // Intentar listar todos los moods para ver qué hay disponible
        const { data: allMoods, error: listError } = await supabase
          .from('moods')
          .select('id, name, is_active')
          .eq('is_active', true);
        
        if (listError) {
          console.error('❌ Error listando moods:', listError);
          throw new Error(`No se pudo acceder a la tabla moods. Verifica que la tabla exista y tengas permisos. Error: ${listError.message}`);
        }

        if (!allMoods || allMoods.length === 0) {
          throw new Error(`No hay moods disponibles en la base de datos. Por favor, crea la tabla moods e inserta los registros necesarios.`);
        }
        
        // Intentar encontrar el mood manualmente
        const foundMood = allMoods.find(m => 
          m.name.toLowerCase() === moodNameInDb.toLowerCase() ||
          m.name.toLowerCase().trim() === moodNameInDb.toLowerCase().trim()
        );
        
        if (foundMood) {
          moodData = foundMood;
          moodError = null;
        } else {
          throw new Error(`No se pudo obtener información del mood "${moodNameInDb}". Moods disponibles: ${allMoods.map(m => m.name).join(', ')}`);
        }
      }
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

      setGeneratedPlaylist(formattedPlaylist);
      
      // Enviar notificación de playlist generada
      showNotification('🎵 ' + t('playlistGenerated'), {
        body: `${formattedPlaylist.name} - ${formattedPlaylist.tracks} ${t('songs')}`,
        tag: 'playlist-generated',
        requireInteraction: false
      });
      
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
        // Confirmar eliminación completa (de Spotify y favoritos)
        const confirmed = await showConfirmDeletePlaylist(generatedPlaylist.name, t);
        
        if (!confirmed) {
          setSavingFavorite(false);
          return;
        }

        // Eliminar completamente de Spotify y de favoritos
        const result = await deletePlaylistCompletely(
          generatedPlaylist.id,
          spotifyAccessToken,
          userData.id
        );
        if (result.success) {
          setIsFavorite(false);
          setGeneratedPlaylist(null);
        } else {
          throw new Error(result.error || 'Error al eliminar la playlist');
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
                <button 
                  className="spotify-button"
                  onClick={() => setShowTracksModal(true)}
                >
                  <span>🎵</span>
                  {t('viewSongs') || 'Ver Canciones'}
                </button>
                <button 
                  className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={savingFavorite}
                  title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <span>{isFavorite ? '❤️' : '🤍'}</span>
                  {savingFavorite ? t('saving') : (isFavorite ? t('favorite') : t('favorites'))}
                </button>
                {isFavorite && (
                  <button 
                    className="view-favorites-button"
                    onClick={() => navigate('/playlists-favoritas')}
                    title={t('myPlaylists') || 'Ver mis playlists favoritas'}
                  >
                    <span>⭐</span>
                    {t('myPlaylists') || 'Mis Playlists'}
                  </button>
                )}
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

      {/* Modal de Ver Canciones */}
      {generatedPlaylist && (
        <PlaylistTracksModal
          isOpen={showTracksModal}
          onClose={() => setShowTracksModal(false)}
          playlist={{
            spotify_playlist_id: generatedPlaylist.id,
            name: generatedPlaylist.name,
            description: generatedPlaylist.description,
            image_url: generatedPlaylist.imageUrl,
            spotify_url: generatedPlaylist.spotifyUrl
          }}
          spotifyAccessToken={spotifyAccessToken}
        />
      )}
    </div>
  );
}
