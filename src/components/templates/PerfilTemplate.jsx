import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getFavoritePlaylists } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { useLanguage } from '../../context/LanguageContext';
import './styles/PerfilTemplate.css';

export function PerfilTemplate({ spotifyAccessToken, tokensLoading }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [stats, setStats] = useState({
    playlistsCreated: 0,
    totalPlaylists: 0,
    favoriteGenre: 'Cargando...',
    accountType: 'Free'
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [spotifyAccessToken]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Obtener usuario autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      setUser(authUser);

      // Obtener usuario de la BD
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError) {
        console.error('Error obteniendo usuario:', userError);
      }

      // Obtener playlists creadas en la app
      if (userData) {
        const playlistsResult = await getFavoritePlaylists(userData.id);
        const playlistsCount = playlistsResult.success ? playlistsResult.data.length : 0;

        // Obtener perfil de Spotify si hay token
        let spotifyData = null;
        let totalPlaylists = 0;
        let accountType = 'Free';
        
        if (spotifyAccessToken) {
          try {
            // Obtener perfil de Spotify
            const profileResponse = await fetch('https://api.spotify.com/v1/me', {
              headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
              }
            });

            if (profileResponse.ok) {
              spotifyData = await profileResponse.json();
              accountType = spotifyData.product === 'premium' ? 'Premium' : 'Free';
              setSpotifyProfile(spotifyData);
            }

            // Obtener playlists de Spotify
            const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
              headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
              }
            });

            if (playlistsResponse.ok) {
              const playlistsData = await playlistsResponse.json();
              totalPlaylists = playlistsData.total || playlistsData.items?.length || 0;
            }

            // Obtener top artistas para género favorito
            const topArtistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
              headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
              }
            });

            if (topArtistsResponse.ok) {
              const topArtistsData = await topArtistsResponse.json();
              if (topArtistsData.items && topArtistsData.items.length > 0) {
                // Extraer géneros y encontrar el más común
                const genres = topArtistsData.items
                  .flatMap(artist => artist.genres || [])
                  .filter(g => g);
                
                if (genres.length > 0) {
                  const genreCount = {};
                  genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                  });
                  
                  const favoriteGenre = Object.entries(genreCount)
                    .sort((a, b) => b[1] - a[1])[0][0];
                  
                  setStats(prev => ({
                    ...prev,
                    favoriteGenre: favoriteGenre.charAt(0).toUpperCase() + favoriteGenre.slice(1)
                  }));
                }
              }
            }
          } catch (spotifyError) {
            console.error('Error obteniendo datos de Spotify:', spotifyError);
          }
        }

        setStats(prev => ({
          ...prev,
          playlistsCreated: playlistsCount,
          totalPlaylists: totalPlaylists,
          accountType: accountType
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      `⚠️ ${t('profile.dangerZone').toUpperCase()}\n\n` +
      `${t('profile.deleteWarning')}\n\n` +
      `${t('profile.deleteNote')}\n\n` +
      `¿${t('common.confirm')}?\n\n` +
      'Escribe "ELIMINAR" para confirmar:'
    );

    if (!confirmDelete) return;

    const finalConfirmation = prompt('Escribe "ELIMINAR" para confirmar (en mayúsculas):');
    
    if (finalConfirmation !== 'ELIMINAR') {
      alert('Cancelado. Tu cuenta está a salvo.');
      return;
    }

    try {
      setDeleting(true);

      // Obtener usuario de BD
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userData) {
        // Eliminar playlists del usuario
        await supabase
          .from('spotify_playlists')
          .delete()
          .eq('user_id', userData.id);

        // Eliminar usuario de la tabla users
        await supabase
          .from('users')
          .delete()
          .eq('id', userData.id);
      }

      // Cerrar sesión de auth
      await supabase.auth.signOut();

      alert('Tu cuenta ha sido eliminada correctamente.');
      navigate('/login');
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      alert('Error al eliminar la cuenta. Por favor, contacta a soporte.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="perfil-container">
        <CircleLoader />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#d5b9b2' }}>
          {t('loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>👤 {t('myProfile')}</h1>
      </div>

      {/* Información del Usuario */}
      <div className="perfil-section user-info-section">
        <h2>📋 {t('accountInfo')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">👤</div>
            <div className="info-content">
              <span className="info-label">{t('user')}</span>
              <span className="info-value">
                {spotifyProfile?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || t('user')}
              </span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">📧</div>
            <div className="info-content">
              <span className="info-label">{t('email')}</span>
              <span className="info-value">{user?.email}</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🎵</div>
            <div className="info-content">
              <span className="info-label">{t('accountType')}</span>
              <span className={`info-value ${stats.accountType === 'Premium' ? 'premium' : ''}`}>
                Spotify {stats.accountType}
                {stats.accountType === 'Premium' && ' ⭐'}
              </span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🌍</div>
            <div className="info-content">
              <span className="info-label">{t('country')}</span>
              <span className="info-value">
                {spotifyProfile?.country || t('notAvailable')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="perfil-section stats-section">
        <h2>📊 {t('stats')}</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.playlistsCreated}</div>
              <div className="stat-label">{t('playlistsCreated')}</div>
              <div className="stat-sublabel">{t('inMoodBeatsHub')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalPlaylists}</div>
              <div className="stat-label">{t('totalPlaylists')}</div>
              <div className="stat-sublabel">{t('inSpotify')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎸</div>
            <div className="stat-content">
              <div className="stat-value">{stats.favoriteGenre}</div>
              <div className="stat-label">{t('favoriteGenre')}</div>
              <div className="stat-sublabel">{t('mostListened')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{spotifyProfile?.followers?.total || 0}</div>
              <div className="stat-label">{t('followers')}</div>
              <div className="stat-sublabel">{t('inSpotify')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conexión Spotify */}
      <div className="perfil-section spotify-section">
        <h2>🟢 {t('spotifyConnection')}</h2>
        <div className="spotify-status-card">
          <div className="spotify-status-info">
            <div className="status-indicator connected"></div>
            <div className="status-text">
              <span className="status-title">{t('connected')}</span>
              <span className="status-subtitle">{t('connectedSubtitle')}</span>
            </div>
          </div>
          {spotifyProfile?.images?.[0]?.url && (
            <img 
              src={spotifyProfile.images[0].url} 
              alt="Avatar" 
              className="spotify-avatar"
            />
          )}
        </div>
      </div>

      {/* Zona de Peligro */}
      <div className="perfil-section danger-section">
        <h2>⚠️ {t('dangerZone')}</h2>
        <div className="danger-card">
          <div className="danger-info">
            <h3>{t('deleteAccount')}</h3>
            <p>{t('deleteWarning')}</p>
            <p className="danger-note">⚠️ {t('deleteNote')}</p>
          </div>
          <button 
            className="delete-account-btn"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="btn-spinner">⏳</span>
                {t('deleting')}
              </>
            ) : (
              <>
                <span className="btn-icon">🗑️</span>
                {t('deleteAccount')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => navigate('/playlists-favoritas')}
        >
          <span>⭐</span>
          {t('myPlaylists')}
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/configuracion')}
        >
          <span>⚙️</span>
          {t('settings')}
        </button>
        <button 
          className="action-btn tertiary"
          onClick={() => navigate('/home')}
        >
          <span>🏠</span>
          {t('backToHome')}
        </button>
      </div>
    </div>
  );
}
