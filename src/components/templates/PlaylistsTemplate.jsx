import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Music, Clock, Play, Plus, Trash2, Eye, AlertTriangle, RotateCw, Sparkles } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { supabase } from '../../supabase/supabase.config';
import { getFavoritePlaylists, deletePlaylistCompletely } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { AVAILABLE_MOODS } from '../../services/playlistQuizService';
import { AddSongsModal } from '../organisms/AddSongsModal';
import { PlaylistTracksModal } from '../organisms/PlaylistTracksModal';
import { useLanguage } from '../../context/LanguageContext';
import { showWarningAlert, showErrorAlert } from '../molecules/AlertModal';
import { showConfirmDeletePlaylist } from '../molecules/ConfirmDeletePlaylistModal';
import './styles/PlaylistsTemplate.css';

export function PlaylistsTemplate({ spotifyAccessToken, tokensLoading: _tokensLoading, onPlayPlaylist }) {
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
  const [playlistStats, setPlaylistStats] = useState({});
  const [playingPlaylistId, setPlayingPlaylistId] = useState(null);

  const loadFavoritePlaylists = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario autenticado
      const userResult = await getCurrentUser();
      if (!userResult.success || !userResult.data) {
        throw new Error(t('errorUser'));
      }

      const authUser = userResult.data;
      setUser(authUser);

      // Usar authUser.id que es el auth.uid() requerido por RLS
      const userAuthId = authUser.id;

      // Obtener playlists favoritas
      const result = await getFavoritePlaylists(userAuthId);
      
      if (result.success) {
        setPlaylists(result.data || []);
        
        // Cargar estadísticas reales de cada playlist
        if (result.data && result.data.length > 0) {
          loadPlaylistStats(result.data);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistStats = async (playlistsData) => {
    if (!spotifyAccessToken) return;

    const stats = {};
    
    for (const playlist of playlistsData) {
      if (playlist.spotify_playlist_id) {
        try {
          const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.spotify_playlist_id}/tracks?fields=total,items(track(duration_ms))`,
            {
              headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const trackCount = data.total;
            const totalDurationMs = data.items.reduce((acc, item) => {
              return acc + (item.track?.duration_ms || 0);
            }, 0);
            const durationMinutes = Math.floor(totalDurationMs / 60000);

            stats[playlist.id] = {
              trackCount,
              durationMinutes
            };
          }
        } catch (error) {
          // Error loading playlist stats
        }
      }
    }

    setPlaylistStats(stats);
  };

  useEffect(() => {
    loadFavoritePlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyAccessToken]);

  const handleOpenInSpotify = (playlist) => {
    if (playlist.spotify_url) {
      window.open(playlist.spotify_url, '_blank');
    }
  };

  const handlePlayInApp = async (playlist) => {
    if (!spotifyAccessToken) {
      await showWarningAlert(t('spotifyRequired') || 'Se requiere conexión con Spotify', t);
      return;
    }

    // Verificar que tenemos el URI de la playlist
    if (!playlist.spotify_playlist_id) {
      await showErrorAlert(t('playlistNotAvailable') || 'Esta playlist no está disponible para reproducción', t);
      return;
    }

    // Construir el URI de Spotify
    const playlistUri = `spotify:playlist:${playlist.spotify_playlist_id}`;
    
    // Marcar esta playlist como la que está reproduciendo
    setPlayingPlaylistId(playlist.id);
    
    // Usar la función global para reproducir
    onPlayPlaylist({
      uri: playlistUri,
      name: playlist.name
    });
  };

  const handleAddSongs = async (playlist) => {
    if (!spotifyAccessToken) {
      await showWarningAlert(t('spotifyRequired') || 'Se requiere conexión con Spotify', t);
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

  const handleTracksUpdated = () => {
    // Recargar las playlists para actualizar estadísticas
    loadFavoritePlaylists();
  };

  const handleRemoveFromFavorites = async (playlist) => {
    if (!user || !spotifyAccessToken) return;

    // Confirmar eliminación completa (de Spotify y favoritos)
    const confirmed = await showConfirmDeletePlaylist(playlist.name, t);
    
    if (!confirmed) return;

    try {
      setDeletingId(playlist.id);

      // Usar user.id que es el auth.uid() requerido por RLS
      const userAuthId = user.id;

      // Eliminar completamente de Spotify y de favoritos
      const result = await deletePlaylistCompletely(
        playlist.spotify_playlist_id,
        spotifyAccessToken,
        userAuthId
      );
      
      if (result.success) {
        // Recargar la lista
        await loadFavoritePlaylists();
      } else {
        throw new Error(result.error || 'Error al eliminar la playlist');
      }
    } catch (err) {
      await showErrorAlert(t('deleteError') + ': ' + err.message, t);
    } finally {
      setDeletingId(null);
    }
  };

  const getMoodConfig = (playlist) => {
    if (!playlist) return null;
    
    // Buscar el mood en generation_params primero (donde está el mood real)
    const moodId = playlist.generation_params?.mood || playlist.mood_id;
    if (!moodId) return null;
    
    // Buscar en los moods disponibles
    const mood = Object.values(AVAILABLE_MOODS).find(m => m.id === moodId);
    return mood;
  };

  const formatDuration = (playlist) => {
    const stats = playlistStats[playlist.id];
    if (stats?.durationMinutes) {
      return `${stats.durationMinutes}min`;
    }
    // Fallback a cálculo estimado
    if (playlist.generation_params?.track_count) {
      const minutes = Math.floor(playlist.generation_params.track_count * 3.5);
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
          <AlertTriangle className="error-icon" size={48} />
          <h2>{t('errorLoading')}</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadFavoritePlaylists}>
            <RotateCw size={18} /> {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      {playlists.length > 0 ? (
        <div className="favorites-grid">
          {playlists.map((playlist) => {
            const moodConfig = getMoodConfig(playlist);
            const stats = playlistStats[playlist.id];
            const trackCount = stats?.trackCount ?? playlist.generation_params?.track_count ?? 0;
            const isPlaying = playingPlaylistId === playlist.id;
            
            return (
              <div 
                key={playlist.id} 
                className={`favorite-card ${isPlaying ? 'playing' : ''}`}
                style={{
                  '--card-mood-color': moodConfig?.color || '#597081',
                  '--card-mood-rgb': moodConfig?.rgb || '89, 112, 129'
                }}
              >
                {isPlaying && (
                  <div className="now-playing-indicator">
                    <div className="playing-bars">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="playing-text">{t('playing') || 'Reproduciendo'}</span>
                  </div>
                )}
                <div className="favorite-cover">
                  {playlist.image_url ? (
                    <img src={playlist.image_url} alt={playlist.name} />
                  ) : (
                    <div className="cover-placeholder">
                      <span className="cover-emoji">{moodConfig?.emoji || <Music size={48} />}</span>
                    </div>
                  )}
                  <div className="cover-overlay">
                    <button 
                      className="overlay-play-btn"
                      onClick={() => handlePlayInApp(playlist)}
                      title={t('playInApp') || 'Reproducir en la app'}
                    >
                      <Play size={32} fill="white" />
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
                      <Music className="stat-icon" size={16} />
                      {trackCount} {t('songs')}
                    </span>
                    <span className="stat-divider">•</span>
                    <span className="stat-item">
                      <Clock className="stat-icon" size={16} />
                      {formatDuration(playlist)}
                    </span>
                  </div>

                  <p className="favorite-date">
                    {t('saved')}: {formatDate(playlist.created_at)}
                  </p>
                </div>

                <div className="favorite-actions">
                  <div className="actions-row">
                    <button 
                      className="action-btn play-in-app-btn"
                      onClick={() => handlePlayInApp(playlist)}
                      title={t('playInApp') || 'Reproducir aquí'}
                    >
                      <Play className="btn-icon" size={18} />
                      {t('playInApp') || 'Reproducir Aquí'}
                    </button>
                    <button 
                      className="action-btn spotify-btn"
                      onClick={() => handleOpenInSpotify(playlist)}
                      title={t('openInSpotify')}
                    >
                      <Music className="btn-icon" size={18} />
                      {t('openInSpotify') || 'Abrir en Spotify'}
                    </button>
                  </div>
                  <button 
                    className="action-btn view-tracks-btn centered"
                    onClick={() => handleViewTracks(playlist)}
                    title={t('viewSongs') || 'Ver canciones'}
                  >
                    <Eye className="btn-icon" size={18} />
                    {t('viewSongs') || 'Ver Canciones'}
                  </button>
                  <button 
                    className="action-btn add-songs-btn centered"
                    onClick={() => handleAddSongs(playlist)}
                    title={t('addSongs') || 'Agregar canciones'}
                  >
                    <Plus className="btn-icon" size={18} />
                    {t('addSongs') || 'Agregar'}
                  </button>
                  <button 
                    className="action-btn remove-btn centered"
                    onClick={() => handleRemoveFromFavorites(playlist)}
                    disabled={deletingId === playlist.id}
                    title={t('deletePlaylist')}
                  >
                    <Trash2 className="btn-icon" size={18} />
                    {deletingId === playlist.id ? t('deleting2') : t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Music className="empty-icon" size={64} />
          <h2>{t('emptyPlaylists')}</h2>
          <p>{t('emptyPlaylistsDesc')}</p>
          <button 
            className="create-playlist-btn"
            onClick={() => navigate('/home')}
          >
            <Sparkles size={20} />
            {t('createFirst')}
          </button>
        </div>
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
        onTracksUpdated={handleTracksUpdated}
      />
    </div>
  );
}
