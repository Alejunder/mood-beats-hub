import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import './styles/AddSongsModal.css';

export function AddSongsModal({ isOpen, onClose, onAddSongs, spotifyAccessToken, playlistId }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [adding, setAdding] = useState(false);

  // Validar que tenemos los datos necesarios
  useEffect(() => {
    if (isOpen && (!spotifyAccessToken || !playlistId)) {
      console.error('❌ Faltan datos necesarios:', { 
        hasToken: !!spotifyAccessToken, 
        hasPlaylistId: !!playlistId 
      });
    }
  }, [isOpen, spotifyAccessToken, playlistId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSongs([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !spotifyAccessToken) return;

    try {
      setSearching(true);
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Error en la búsqueda');

      const data = await response.json();
      setSearchResults(data.tracks?.items || []);
    } catch (error) {
      console.error('Error buscando canciones:', error);
      alert(t('searchError') || 'Error al buscar canciones');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSongSelection = (track) => {
    setSelectedSongs(prev => {
      const isSelected = prev.find(s => s.id === track.id);
      if (isSelected) {
        return prev.filter(s => s.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const handleAddToPlaylist = async () => {
    if (selectedSongs.length === 0) return;

    try {
      setAdding(true);
      const uris = selectedSongs.map(song => song.uri);

      console.log('🎵 Agregando canciones a la playlist:', {
        playlistId,
        songsCount: selectedSongs.length,
        uris
      });

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris })
        }
      );

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('❌ Error de Spotify:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
        throw new Error(responseData.error?.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Canciones agregadas exitosamente:', responseData);
      alert(t('songsAddedSuccess') || `✅ ${selectedSongs.length} canciones agregadas exitosamente`);
      onAddSongs();
      onClose();
    } catch (error) {
      console.error('❌ Error agregando canciones:', error);
      alert(`${t('addSongsError') || 'Error al agregar canciones'}: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-songs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎵 {t('addSongsToPlaylist') || 'Agregar Canciones a la Playlist'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Buscador */}
          <div className="search-section">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder={t('searchSongs') || 'Buscar canciones, artistas, álbumes...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <button 
                className="search-btn"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? '⏳' : '🔍'} {searching ? t('searching2') : t('search')}
              </button>
            </div>
          </div>

          {/* Canciones seleccionadas */}
          {selectedSongs.length > 0 && (
            <div className="selected-songs-section">
              <h3>✅ {t('selectedSongs') || 'Canciones Seleccionadas'} ({selectedSongs.length})</h3>
              <div className="selected-songs-list">
                {selectedSongs.map(song => (
                  <div key={song.id} className="selected-song-chip">
                    <span>{song.name} - {song.artists[0]?.name}</span>
                    <button onClick={() => toggleSongSelection(song)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          <div className="search-results">
            {searchResults.length > 0 ? (
              <div className="results-list">
                {searchResults.map(track => {
                  const isSelected = selectedSongs.find(s => s.id === track.id);
                  return (
                    <div 
                      key={track.id} 
                      className={`result-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSongSelection(track)}
                    >
                      <div className="result-cover">
                        {track.album?.images?.[2]?.url ? (
                          <img src={track.album.images[2].url} alt={track.name} />
                        ) : (
                          <div className="cover-placeholder-small">🎵</div>
                        )}
                      </div>
                      <div className="result-info">
                        <div className="result-name">{track.name}</div>
                        <div className="result-artist">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                        <div className="result-album">{track.album?.name}</div>
                      </div>
                      <div className="result-check">
                        {isSelected ? '✅' : '⭕'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-results">
                <span className="empty-icon">🔍</span>
                <p>{t('searchSongsPrompt') || 'Busca canciones para agregar a tu playlist'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn cancel-btn" onClick={onClose}>
            {t('cancel') || 'Cancelar'}
          </button>
          <button 
            className="modal-btn add-btn"
            onClick={handleAddToPlaylist}
            disabled={selectedSongs.length === 0 || adding}
          >
            {adding ? '⏳' : '➕'} {adding ? t('adding') : t('addSelected') || `Agregar (${selectedSongs.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

