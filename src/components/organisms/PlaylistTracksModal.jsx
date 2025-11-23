import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import './styles/PlaylistTracksModal.css';

export function PlaylistTracksModal({ isOpen, onClose, playlist, spotifyAccessToken }) {
  const { t } = useLanguage();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingTrackUri, setDeletingTrackUri] = useState(null);

  useEffect(() => {
    if (isOpen && playlist && spotifyAccessToken) {
      loadTracks();
    }
  }, [isOpen, playlist, spotifyAccessToken]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.spotify_playlist_id}/tracks`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTracks(data.items || []);
      console.log('✅ Canciones cargadas:', data.items?.length);
    } catch (err) {
      console.error('❌ Error cargando canciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openInSpotify = (uri) => {
    const url = uri.replace('spotify:track:', 'https://open.spotify.com/track/');
    window.open(url, '_blank');
  };

  const handleDeleteTrack = async (track, index) => {
    const confirmDelete = window.confirm(
      `${t('deleteTrackConfirm') || '¿Eliminar esta canción de la playlist?'}\n\n` +
      `🎵 ${track.name}\n` +
      `👤 ${track.artists.map(a => a.name).join(', ')}\n\n` +
      `⚠️ Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingTrackUri(track.uri);

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.spotify_playlist_id}/tracks`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tracks: [{ uri: track.uri }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error ${response.status}`);
      }

      console.log('✅ Canción eliminada de la playlist');
      
      // Actualizar la lista localmente (eliminar de la vista)
      setTracks(prevTracks => prevTracks.filter((_, i) => i !== index));

    } catch (err) {
      console.error('❌ Error eliminando canción:', err);
      alert(`${t('deleteTrackError') || 'Error al eliminar la canción'}: ${err.message}`);
    } finally {
      setDeletingTrackUri(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="tracks-modal-overlay" onClick={onClose}>
      <div className="tracks-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tracks-modal-header">
          <div className="tracks-header-info">
            {playlist.image_url && (
              <img 
                src={playlist.image_url} 
                alt={playlist.name}
                className="tracks-playlist-cover"
              />
            )}
            <div className="tracks-playlist-details">
              <h2>{playlist.name}</h2>
              <p className="tracks-playlist-desc">{playlist.description || t('customPlaylist')}</p>
              <p className="tracks-playlist-count">
                {tracks.length} {t('songs')}
              </p>
            </div>
          </div>
          <button className="tracks-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="tracks-modal-body">
          {loading ? (
            <div className="tracks-loading">
              <div className="tracks-spinner"></div>
              <p>{t('loadingSongs') || 'Cargando canciones...'}</p>
            </div>
          ) : error ? (
            <div className="tracks-error">
              <span className="error-icon">⚠️</span>
              <h3>{t('errorLoadingSongs') || 'Error cargando canciones'}</h3>
              <p>{error}</p>
              <button className="tracks-retry-btn" onClick={loadTracks}>
                🔄 {t('retry')}
              </button>
            </div>
          ) : tracks.length === 0 ? (
            <div className="tracks-empty">
              <span className="empty-icon">🎵</span>
              <p>{t('noSongs') || 'No hay canciones en esta playlist'}</p>
            </div>
          ) : (
            <div className="tracks-list">
              {/* Header de la tabla */}
              <div className="tracks-list-header">
                <div className="track-number">#</div>
                <div className="track-info-header">{t('title') || 'Título'}</div>
                <div className="track-album-header">{t('album') || 'Álbum'}</div>
                <div className="track-date-header">{t('dateAdded') || 'Fecha agregada'}</div>
                <div className="track-duration-header">⏱️</div>
                <div className="track-actions-header"></div>
              </div>

              {/* Lista de canciones */}
              {tracks.map((item, index) => {
                const track = item.track;
                if (!track) return null;

                return (
                  <div 
                    key={`${track.id}-${index}`} 
                    className="track-item"
                  >
                    <div className="track-number">{index + 1}</div>
                    
                    <div 
                      className="track-info"
                      onClick={() => openInSpotify(track.uri)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="track-cover">
                        {track.album?.images?.[2]?.url ? (
                          <img src={track.album.images[2].url} alt={track.name} />
                        ) : (
                          <div className="track-cover-placeholder">🎵</div>
                        )}
                      </div>
                      <div className="track-details">
                        <div className="track-name">{track.name}</div>
                        <div className="track-artists">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div 
                      className="track-album"
                      onClick={() => openInSpotify(track.uri)}
                      style={{ cursor: 'pointer' }}
                    >
                      {track.album?.name || '-'}
                    </div>

                    <div 
                      className="track-date"
                      onClick={() => openInSpotify(track.uri)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.added_at ? formatDate(item.added_at) : '-'}
                    </div>

                    <div 
                      className="track-duration"
                      onClick={() => openInSpotify(track.uri)}
                      style={{ cursor: 'pointer' }}
                    >
                      {formatDuration(track.duration_ms)}
                    </div>

                    <div className="track-actions">
                      <button 
                        className="track-action-btn spotify-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInSpotify(track.uri);
                        }}
                        title={t('openInSpotify')}
                      >
                        🔗
                      </button>
                      <button 
                        className="track-action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrack(track, index);
                        }}
                        disabled={deletingTrackUri === track.uri}
                        title={t('deleteTrack') || 'Eliminar canción'}
                      >
                        {deletingTrackUri === track.uri ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && tracks.length > 0 && (
          <div className="tracks-modal-footer">
            <div className="tracks-stats">
              <span>🎵 {tracks.length} {t('songs')}</span>
              <span>⏱️ {Math.floor(tracks.reduce((acc, item) => acc + (item.track?.duration_ms || 0), 0) / 60000)} min</span>
            </div>
            <button className="tracks-open-spotify-btn" onClick={() => window.open(playlist.spotify_url, '_blank')}>
              <span>🔗</span>
              {t('openInSpotify')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

