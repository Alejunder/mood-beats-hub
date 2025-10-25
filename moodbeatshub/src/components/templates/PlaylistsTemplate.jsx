import { useState, useEffect } from 'react';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/PlaylistsTemplate.css';

export function PlaylistsTemplate() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Datos temporales de ejemplo
    const mockPlaylists = [
      {
        id: 1,
        name: 'Playlist Feliz',
        mood: 'Feliz',
        emoji: '😊',
        songs: 25,
        duration: '1h 32min',
        lastPlayed: '2 días atrás'
      },
      {
        id: 2,
        name: 'Energía Máxima',
        mood: 'Enérgico',
        emoji: '⚡',
        songs: 30,
        duration: '2h 15min',
        lastPlayed: '5 días atrás'
      },
      {
        id: 3,
        name: 'Modo Relajado',
        mood: 'Relajado',
        emoji: '😌',
        songs: 20,
        duration: '1h 20min',
        lastPlayed: '1 semana atrás'
      },
      {
        id: 4,
        name: 'Romántico',
        mood: 'Romántico',
        emoji: '💕',
        songs: 18,
        duration: '58min',
        lastPlayed: '3 días atrás'
      }
    ];

    // Simular carga de datos
    setTimeout(() => {
      setPlaylists(mockPlaylists);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="playlists-container">
        <CircleLoader />
      </div>
    );
  }

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h1>Mis Playlists Favoritas</h1>
        <p>Tus playlists generadas por estado de ánimo</p>
      </div>

      <div className="playlists-grid">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-card">
            <div className="playlist-cover">
              <span className="playlist-emoji">{playlist.emoji}</span>
            </div>
            <div className="playlist-info">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-mood">{playlist.mood}</p>
              <div className="playlist-stats">
                <span>🎵 {playlist.songs} canciones</span>
                <span>⏱️ {playlist.duration}</span>
              </div>
              <p className="playlist-last-played">
                Última reproducción: {playlist.lastPlayed}
              </p>
            </div>
            <div className="playlist-actions">
              <button className="play-btn">▶️ Reproducir</button>
              <button className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="empty-state">
          <p>No tienes playlists favoritas aún</p>
          <button className="create-playlist-btn">Crear tu primera playlist</button>
        </div>
      )}
    </div>
  );
}
