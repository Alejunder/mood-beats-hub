import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Music, Globe, FileText, Guitar, Users, AlertTriangle, Trash2, Loader2, Star, Settings, Home } from 'lucide-react';
import { getCurrentUser, signOut } from '../../services/authService';
import { supabase } from '../../supabase/supabase.config';
import { getFavoritePlaylists } from '../../services/favoritesService';
import { CircleLoader } from '../atoms/CircleLoader';
import { useLanguage } from '../../context/LanguageContext';
import { 
  showDeleteAccountConfirmation,
  showDeleteAccountInput,
  showDeleteCancelled,
  showDeleteSuccess,
  showDeleteError
} from '../molecules/ConfirmDeleteAccountModal';
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
      const userResult = await getCurrentUser();
      if (!userResult.success || !userResult.data) {
        navigate('/login');
        return;
      }
      const authUser = userResult.data;
      setUser(authUser);

      // Usar authUser.id que es el auth.uid() requerido por RLS
      const userAuthId = authUser.id;

      // Obtener playlists creadas en la app
      const playlistsResult = await getFavoritePlaylists(userAuthId);
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

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Primer modal de confirmación
    const firstConfirmation = await showDeleteAccountConfirmation(t);
    if (!firstConfirmation) return;

    // Obtener nombre de usuario para la confirmación
    const username = spotifyProfile?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

    // Segundo modal con input del nombre de usuario
    const finalConfirmation = await showDeleteAccountInput(t, username);
    
    if (!finalConfirmation) {
      await showDeleteCancelled(t);
      return;
    }

    try {
      setDeleting(true);

      // Llamar a la función de base de datos que elimina completamente al usuario
      const { data, error } = await supabase
        .rpc('delete_user_completely', {
          user_email: user.email
        });

      if (error) {
        console.error('Error al eliminar cuenta:', error);
        await showDeleteError(
          `No se pudo eliminar la cuenta: ${error.message}`,
          t
        );
        setDeleting(false);
        return;
      }

      // Verificar el resultado de la función
      if (data && data.success) {
        // Cerrar sesión (aunque el usuario ya fue eliminado)
        await signOut();
        
        await showDeleteSuccess(t);
        navigate('/login');
      } else {
        await showDeleteError(
          `No se pudo completar la eliminación: ${data?.message || 'Error desconocido'}`,
          t
        );
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      await showDeleteError(
        'Ocurrió un error inesperado al eliminar la cuenta. Por favor, contacta con soporte.',
        t
      );
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
        <h1><User size={64} style={{ display: 'inline', marginRight: '0px' }} /></h1>
      </div>

      {/* Información del Usuario */}
      <div className="perfil-section user-info-section">
        <h2><FileText size={24} style={{ display: 'inline', marginRight: '8px' }} /> {t('accountInfo')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon"><User size={24} /></div>
            <div className="info-content">
              <span className="info-label">{t('user')}</span>
              <span className="info-value">
                {spotifyProfile?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || t('user')}
              </span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Mail size={24} /></div>
            <div className="info-content">
              <span className="info-label">{t('email')}</span>
              <span className="info-value">{user?.email}</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Music size={24} /></div>
            <div className="info-content">
              <span className="info-label">{t('accountType')}</span>
              <span className={`info-value ${stats.accountType === 'Premium' ? 'premium' : ''}`}>
                Spotify {stats.accountType}
                {stats.accountType === 'Premium' && ' ⭐'}
              </span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Globe size={24} /></div>
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
        <h2><FileText size={24} style={{ display: 'inline', marginRight: '8px' }} /> {t('yourStats')}</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FileText size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats.playlistsCreated}</div>
              <div className="stat-label">{t('playlistsCreated')}</div>
              <div className="stat-sublabel">{t('inMoodBeatsHub')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Music size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalPlaylists}</div>
              <div className="stat-label">{t('totalPlaylists')}</div>
              <div className="stat-sublabel">{t('inSpotify')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Guitar size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats.favoriteGenre}</div>
              <div className="stat-label">{t('favoriteGenre')}</div>
              <div className="stat-sublabel">{t('mostListened')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Users size={32} /></div>
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
        <h2><Music size={24} style={{ display: 'inline', marginRight: '8px', color: '#1DB954' }} /> {t('spotifyConnection')}</h2>
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
        <h2><AlertTriangle size={24} style={{ display: 'inline', marginRight: '8px' }} /> {t('dangerZone')}</h2>
        <div className="danger-card">
          <div className="danger-info">
            <h3>{t('deleteAccount')}</h3>
            <p>{t('deleteWarning')}</p>
            <p className="danger-note"><AlertTriangle size={16} style={{ display: 'inline', marginRight: '5px' }} /> {t('deleteNote')}</p>
          </div>
          <button 
            className="delete-account-btn"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="btn-spinner" size={20} />
                {t('deleting')}
              </>
            ) : (
              <>
                <Trash2 className="btn-icon" size={20} />
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
          <Star size={20} />
          {t('myPlaylists')}
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => navigate('/configuracion')}
        >
          <Settings size={20} />
          {t('settings')}
        </button>
        <button 
          className="action-btn tertiary"
          onClick={() => navigate('/home')}
        >
          <Home size={20} />
          {t('backToHome')}
        </button>
      </div>
    </div>
  );
}
