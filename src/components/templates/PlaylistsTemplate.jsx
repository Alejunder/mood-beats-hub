import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getFavoritePlaylists, removeFavoritePlaylist, deletePlaylistCompletely } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { AVAILABLE_MOODS } from '../../services/playlistQuizService';
import { SpotifyPlayer } from '../molecules/SpotifyPlayer';
import { useSpotifyPlayer } from '../../hooks/useSpotifyPlayer';
import { AddSongsModal } from '../organisms/AddSongsModal';
import { PlaylistTracksModal } from '../organisms/PlaylistTracksModal';
import { useLanguage } from '../../context/LanguageContext';
import './styles/PlaylistsTemplate.css';

export function PlaylistsTemplate({ spotifyAccessToken, tokensLoading }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [showTracksModal, setShowTracksModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

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

  useEffect(() => {
    loadFavoritePlaylists();
  }, []);

  const loadFavoritePlaylists = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error(t('errorUser'));
      }

      setUser(authUser);

      // Obtener usuario de la BD
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) {
        throw new Error(t('errorLoadUser'));
      }

      // Obtener playlists favoritas
      const result = await getFavoritePlaylists(userData.id);
      
      if (result.success) {
        setPlaylists(result.data || []);
        console.log('✅ Playlists favoritas cargadas:', result.data?.length || 0);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error cargando playlists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayInPlayer = (playlist) => {
    if (playerReady && playlist.spotify_playlist_id) {
      const spotifyUri = `spotify:playlist:${playlist.spotify_playlist_id}`;
      playPlaylist(spotifyUri);
      console.log('▶ Reproduciendo en player:', playlist.name);
    }
  };

  const handleOpenInSpotify = (playlist) => {
    if (playlist.spotify_url) {
      window.open(playlist.spotify_url, '_blank');
      console.log('🔗 Abriendo en Spotify:', playlist.name);
    }
  };

  const handleAddSongs = (playlist) => {
    if (!spotifyAccessToken) {
      alert(t('spotifyRequired') || 'Se requiere conexión con Spotify');
      return;
    }
    setSelectedPlaylist(playlist);
    setShowAddSongsModal(true);
  };

  const handleSongsAdded = () => {
    // Recargar las playlists para actualizar el conteo de canciones
    loadFavoritePlaylists();
  };

  const handleViewTracks = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowTracksModal(true);
  };

  const handleRemoveFromFavorites = async (playlist) => {
    if (!user) return;

    // Opción 1: Solo quitar de favoritos (mantener en Spotify)
    // Opción 2: Eliminar completamente (quitar de Spotify también)
    const choice = window.confirm(
      `${t('removeFavoritesConfirm') || '¿Quitar "${playlist.name}" de favoritos?'}\n\n` +
      `✓ Se quitará de tus favoritos en MoodBeatsHub\n` +
      `✓ La playlist seguirá en tu cuenta de Spotify\n\n` +
      `Para eliminarla completamente de Spotify, cancela y ábrela en Spotify.`
    );
    
    if (!choice) return;

    try {
      setDeletingId(playlist.id);

      // Obtener usuario de la BD
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        throw new Error(t('errorLoadUser'));
      }

      // Solo eliminar de favoritos (NO de Spotify)
      const result = await removeFavoritePlaylist(
        userData.id, 
        playlist.spotify_playlist_id
      );
      
      if (result.success) {
        console.log('✅ Playlist quitada de favoritos (permanece en Spotify)');
        // Recargar la lista
        await loadFavoritePlaylists();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error quitando de favoritos:', err);
      alert(t('deleteError') + ': ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getMoodConfig = (moodId) => {
    if (!moodId) return null;
    
    // Buscar en los moods disponibles
    const mood = Object.values(AVAILABLE_MOODS).find(m => m.id === moodId);
    return mood;
  };

  const formatDuration = (generationParams) => {
    if (generationParams?.track_count) {
      const minutes = Math.floor(generationParams.track_count * 3.5);
      return `${minutes}min`;
    }
    return 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo').replace('{days}', diffDays);
    if (diffDays < 30) return t('weeksAgo').replace('{weeks}', Math.floor(diffDays / 7));
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="favorites-container">
        <CircleLoader />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#d5b9b2' }}>
          {t('loadingPlaylists')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-container">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>{t('errorLoading')}</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadFavoritePlaylists}>
            🔄 {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div className="header-content">
          <h1>⭐ {t('favoritePlaylists')}</h1>
          <p>{t('savedPlaylists')}</p>
        </div>
        <button className="create-new-btn" onClick={() => navigate('/home')}>
          ➕ {t('createNew')}
        </button>
      </div>

      {playlists.length > 0 ? (
        <div className="favorites-grid">
          {playlists.map((playlist) => {
            const moodConfig = getMoodConfig(playlist.mood_id);
            const trackCount = playlist.generation_params?.track_count || 0;
            
            return (
              <div 
                key={playlist.id} 
                className="favorite-card"
                style={{
                  '--card-mood-color': moodConfig?.color || '#597081',
                  '--card-mood-rgb': moodConfig?.rgb || '89, 112, 129'
                }}
              >
                <div className="favorite-cover">
                  {playlist.image_url ? (
                    <img src={playlist.image_url} alt={playlist.name} />
                  ) : (
                    <div className="cover-placeholder">
                      <span className="cover-emoji">{moodConfig?.emoji || '🎵'}</span>
                    </div>
                  )}
                  <div className="cover-overlay">
                    <button 
                      className="overlay-play-btn"
                      onClick={() => playerReady ? handlePlayInPlayer(playlist) : handleOpenInSpotify(playlist)}
                      title={playerReady ? t('playInPlayer') : t('openInSpotify')}
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="favorite-info">
                  <div className="favorite-header-info">
                    <h3 className="favorite-name" title={playlist.name}>
                      {playlist.name}
                    </h3>
                    {moodConfig && (
                      <span 
                        className="mood-badge"
                        style={{
                          backgroundColor: `rgba(${moodConfig.rgb}, 0.2)`,
                          color: moodConfig.color,
                          borderColor: moodConfig.color
                        }}
                      >
                        {moodConfig.emoji} {moodConfig.label}
                      </span>
                    )}
                  </div>

                  <p className="favorite-description">
                    {playlist.description || t('customPlaylist')}
                  </p>

                  <div className="favorite-stats">
                    <span className="stat-item">
                      <span className="stat-icon">🎵</span>
                      {trackCount} {t('songs')}
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item">
                      <span className="stat-icon">⏱️</span>
                      {formatDuration(playlist.generation_params)}
                    </span>
                  </div>

                  <p className="favorite-date">
                    {t('saved')}: {formatDate(playlist.created_at)}
                  </p>
                </div>

                <div className="favorite-actions">
                  <div className="actions-row">
                    {playerReady ? (
                      <button 
                        className="action-btn play-btn"
                        onClick={() => handlePlayInPlayer(playlist)}
                        title={t('playInPlayer')}
                      >
                        <span className="btn-icon">▶</span>
                        {t('play')}
                      </button>
                    ) : (
                      <button 
                        className="action-btn play-btn disabled"
                        disabled
                        title={t('playerNotAvailable')}
                      >
                        <span className="btn-icon">⏳</span>
                        {t('loadingPlayer')}
                      </button>
                    )}
                    <button 
                      className="action-btn spotify-btn"
                      onClick={() => handleOpenInSpotify(playlist)}
                      title={t('openInSpotify')}
                    >
                      <span className="btn-icon">🔗</span>
                      {t('spotify')}
                    </button>
                  </div>
                  <button 
                    className="action-btn view-tracks-btn centered"
                    onClick={() => handleViewTracks(playlist)}
                    title={t('viewSongs') || 'Ver canciones'}
                  >
                    <span className="btn-icon">🎵</span>
                    {t('viewSongs') || 'Ver Canciones'}
                  </button>
                  <button 
                    className="action-btn add-songs-btn centered"
                    onClick={() => handleAddSongs(playlist)}
                    title={t('addSongs') || 'Agregar canciones'}
                  >
                    <span className="btn-icon">➕</span>
                    {t('addSongs') || 'Agregar'}
                  </button>
                  <button 
                    className="action-btn remove-btn centered"
                    onClick={() => handleRemoveFromFavorites(playlist)}
                    disabled={deletingId === playlist.id}
                    title={t('deletePlaylist')}
                  >
                    <span className="btn-icon">{deletingId === playlist.id ? '⏳' : '🗑️'}</span>
                    {deletingId === playlist.id ? t('deleting2') : t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🎵</span>
          <h2>{t('emptyPlaylists')}</h2>
          <p>{t('emptyPlaylistsDesc')}</p>
          <button 
            className="create-playlist-btn"
            onClick={() => navigate('/home')}
          >
            <span>✨</span>
            {t('createFirst')}
          </button>
        </div>
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

      {/* Modal de Agregar Canciones */}
      <AddSongsModal
        isOpen={showAddSongsModal}
        onClose={() => setShowAddSongsModal(false)}
        onAddSongs={handleSongsAdded}
        spotifyAccessToken={spotifyAccessToken}
        playlistId={selectedPlaylist?.spotify_playlist_id}
      />

      {/* Modal de Ver Canciones */}
      <PlaylistTracksModal
        isOpen={showTracksModal}
        onClose={() => setShowTracksModal(false)}
        playlist={selectedPlaylist}
        spotifyAccessToken={spotifyAccessToken}
      />
    </div>
  );
}
