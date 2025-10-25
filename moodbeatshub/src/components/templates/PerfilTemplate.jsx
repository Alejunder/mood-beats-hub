import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase.config';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/PerfilTemplate.css';

export function PerfilTemplate() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    playlistsCreated: 0,
    songsPlayed: 0,
    hoursListened: 0,
    favoriteGenre: 'Pop'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Datos de ejemplo - aquí irían las estadísticas reales
      setStats({
        playlistsCreated: 12,
        songsPlayed: 1453,
        hoursListened: 127,
        favoriteGenre: 'Pop Rock'
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="perfil-container">
        <CircleLoader />
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="profile-avatar">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{user?.user_metadata?.name || 'Usuario'}</h1>
          <p className="profile-email">{user?.email}</p>
          <span className="profile-badge">🎵 Usuario Premium</span>
        </div>
      </div>

      <div className="stats-section">
        <h2>Tus Estadísticas</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.playlistsCreated}</div>
            <div className="stat-label">Playlists Creadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-value">{stats.songsPlayed}</div>
            <div className="stat-label">Canciones Reproducidas</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{stats.hoursListened}h</div>
            <div className="stat-label">Horas Escuchadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎸</div>
            <div className="stat-value">{stats.favoriteGenre}</div>
            <div className="stat-label">Género Favorito</div>
          </div>
        </div>
      </div>

      <div className="spotify-section">
        <h2>Cuenta de Spotify</h2>
        <div className="spotify-info">
          <div className="spotify-status">
            <span className="status-indicator connected"></span>
            <span>Conectado con Spotify</span>
          </div>
          <button className="disconnect-btn">Desconectar</button>
        </div>
      </div>

      <div className="preferences-section">
        <h2>Estados de Ánimo Favoritos</h2>
        <div className="mood-tags">
          <span className="mood-tag">😊 Feliz</span>
          <span className="mood-tag">⚡ Enérgico</span>
          <span className="mood-tag">😌 Relajado</span>
          <span className="mood-tag">💪 Motivado</span>
        </div>
      </div>

      <div className="actions-section">
        <button className="edit-profile-btn">✏️ Editar Perfil</button>
        <button className="export-data-btn">📊 Exportar mis datos</button>
      </div>
    </div>
  );
}
