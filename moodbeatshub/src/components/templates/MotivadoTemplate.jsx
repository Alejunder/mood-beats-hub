import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getPlaylistsByMood } from '../../services/spotifyService';
import { generatePlaylistByMood } from '../../services/playlistGenerationService';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/MotivadoTemplate.css';

export function MotivadoTemplate({ spotifyAccessToken, tokensLoading }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const loadSpotifyPlaylists = async () => {
      if (!spotifyAccessToken) {
        loadFallbackPlaylists();
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPlaylistsByMood(spotifyAccessToken, 'motivado');
        
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
  }, [spotifyAccessToken, tokensLoading]);

  const loadFallbackPlaylists = () => {
    const motivatedPlaylists = [
      {
        id: 1,
        title: 'Energía Máxima',
        description: 'Impulso para alcanzar tus metas',
        emoji: '⚡',
        tracks: 50,
        duration: '3h 15min'
      },
      {
        id: 2,
        title: 'Fuerza Imparable',
        description: 'Nada puede detenerte ahora',
        emoji: '🔥',
        tracks: 45,
        duration: '2h 50min'
      },
      {
        id: 3,
        title: 'Workout Beast',
        description: 'Perfecta para el gimnasio',
        emoji: '💪',
        tracks: 55,
        duration: '3h 20min'
      },
      {
        id: 4,
        title: 'Actitud de Campeón',
        description: 'Mentalidad ganadora en cada beat',
        emoji: '🏆',
        tracks: 42,
        duration: '2h 40min'
      },
      {
        id: 5,
        title: 'Poder Interior',
        description: 'Despierta tu mejor versión',
        emoji: '🚀',
        tracks: 48,
        duration: '3h 5min'
      },
      {
        id: 6,
        title: 'Sin Límites',
        description: 'Rompe todas las barreras',
        emoji: '⚔️',
        tracks: 52,
        duration: '3h 10min'
      }
    ];
    setPlaylists(motivatedPlaylists);
  };

  const handleBack = () => {
    navigate('/home');
  };

  const handlePlaylist = (playlist) => {
    console.log('Reproduciendo playlist:', playlist);
    if (playlist.previewUrl) {
      window.open(playlist.previewUrl, '_blank');
    }
  };

  const handleGeneratePlaylist = async () => {
    if (!spotifyAccessToken) {
      setError('No hay token de Spotify disponible');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎵 Generando playlist personalizada para mood: Motivado...');
      
      // Obtener usuario actual de Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener ID del usuario en la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) {
        throw new Error('No se pudo obtener información del usuario');
      }

      // Obtener ID del mood "Motivado" desde Supabase
      const { data: moodData, error: moodError } = await supabase
        .from('moods')
        .select('id, name')
        .eq('name', 'Motivado')
        .single();

      if (moodError || !moodData) {
        console.error('Error obteniendo mood:', moodError);
        throw new Error('No se pudo obtener información del mood Motivado');
      }

      console.log('🎭 Mood obtenido:', moodData);

      // 🚀 GENERAR PLAYLIST REAL CON SPOTIFY
      const result = await generatePlaylistByMood(
        'motivado',
        spotifyAccessToken,
        userData.id,
        moodData.id
      );

      if (!result || !result.playlist) {
        throw new Error('No se pudo generar la playlist');
      }

      // Formatear para la UI
      const formattedPlaylist = {
        id: result.playlist.id,
        name: result.playlist.name,
        description: result.playlist.description,
        spotifyUrl: result.playlist.url,
        imageUrl: result.playlist.imageUrl,
        tracks: result.playlist.trackCount,
        duration: `${Math.floor(result.playlist.trackCount * 3.5)}min`,
        createdAt: new Date().toISOString()
      };

      setGeneratedPlaylist(formattedPlaylist);
      console.log('✅ Playlist generada exitosamente:', formattedPlaylist);
      
    } catch (err) {
      console.error('❌ Error generando playlist:', err);
      setError('Error al generar playlist: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || tokensLoading) {
    return (
      <div className="motivado-container">
        <CircleLoader />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          {tokensLoading ? 'Cargando tokens...' : 'Cargando playlists...'}
        </p>
      </div>
    );
  }

  return (
    <div className="motivado-container">
      <div className="motivado-header">
        <button className="back-button" onClick={handleBack}>
          ← Volver
        </button>
        <div className="mood-info">
          <span className="mood-emoji">💪</span>
          <div className="mood-text">
            <h1>Estado: Motivado</h1>
            <p>Ritmos energéticos para conquistar el día</p>
          </div>
        </div>
        <div className="user-badge">
          <span>{user?.user_metadata?.name || user?.email || 'Usuario'}</span>
        </div>
      </div>

      <main className="motivado-main">
        <div className="welcome-card">
          <h2>¡A por todas! 🔥</h2>
          <p>
            {spotifyAccessToken 
              ? 'Música poderosa de Spotify para mantenerte enfocado y lleno de energía'
              : 'Conecta Spotify para obtener recomendaciones personalizadas'
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
                <h3>Genera Tu Playlist Personalizada</h3>
                <p>Crea una playlist única basada en tus gustos y el mood motivado</p>
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
                  Generando...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Generar Playlist Motivada
                </>
              )}
            </button>
          </div>

          {generatedPlaylist && (
            <div className="generated-playlist-card">
              <div className="generated-header">
                <span className="success-badge">✅ Generada</span>
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
                    <span>{generatedPlaylist.tracks} canciones</span>
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
                >
                  <span>▶</span>
                  Abrir en Spotify
                </a>
                <button 
                  className="regenerate-button"
                  onClick={handleGeneratePlaylist}
                  disabled={isGenerating}
                >
                  🔄 Regenerar
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

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-info">
              <span className="stat-number">292</span>
              <span className="stat-label">Canciones</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-number">18h</span>
              <span className="stat-label">Duración Total</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💪</div>
            <div className="stat-info">
              <span className="stat-number">35</span>
              <span className="stat-label">Sesiones Épicas</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
