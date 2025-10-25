import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { getPlaylistsByMood } from '../../services/spotifyService';
import { generatePlaylistByMood } from '../../services/playlistGenerationService';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/TristeTemplate.css';

export function TristeTemplate({ spotifyAccessToken, tokensLoading }) {
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
        console.warn('⏳ Esperando token de Spotify...');
        loadFallbackPlaylists();
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🎵 Cargando playlists de Spotify para mood: Triste');
        
        const data = await getPlaylistsByMood(spotifyAccessToken, 'triste');
        
        const formattedPlaylists = data.tracks?.map((track, index) => ({
          id: track.id || index,
          title: track.name,
          description: track.artists?.map(a => a.name).join(', ') || 'Artista desconocido',
          emoji: ['🌧️', '💙', '🌙', '🍂', '🕊️', '☔'][index % 6],
          tracks: 1,
          duration: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`,
          spotifyUri: track.uri,
          previewUrl: track.preview_url,
        })) || [];

        setPlaylists(formattedPlaylists.slice(0, 6));
        setError(null);
      } catch (err) {
        console.error('❌ Error al cargar playlists:', err);
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
    const sadPlaylists = [
      {
        id: 1,
        title: 'Melancolía Serena',
        description: 'Melodías suaves para momentos de reflexión',
        emoji: '🌧️',
        tracks: 32,
        duration: '2h 10min'
      },
      {
        id: 2,
        title: 'Lágrimas Silenciosas',
        description: 'Música que comprende tu dolor',
        emoji: '💙',
        tracks: 28,
        duration: '1h 55min'
      },
      {
        id: 3,
        title: 'Soledad Compartida',
        description: 'No estás solo en este sentimiento',
        emoji: '🌙',
        tracks: 35,
        duration: '2h 20min'
      },
      {
        id: 4,
        title: 'Nostalgia',
        description: 'Recuerdos en cada nota',
        emoji: '🍂',
        tracks: 40,
        duration: '2h 35min'
      },
      {
        id: 5,
        title: 'Consuelo Suave',
        description: 'Canciones para sanar el alma',
        emoji: '🕊️',
        tracks: 30,
        duration: '2h 5min'
      },
      {
        id: 6,
        title: 'Lluvias del Corazón',
        description: 'Deja que fluyan las emociones',
        emoji: '☔',
        tracks: 38,
        duration: '2h 25min'
      }
    ];
    setPlaylists(sadPlaylists);
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
      console.log('🎵 Generando playlist personalizada para mood: Triste...');
      
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

      // Obtener ID del mood "Triste" desde Supabase
      const { data: moodData, error: moodError } = await supabase
        .from('moods')
        .select('id, name')
        .eq('name', 'Triste')
        .single();

      if (moodError || !moodData) {
        console.error('Error obteniendo mood:', moodError);
        throw new Error('No se pudo obtener información del mood Triste');
      }

      console.log('🎭 Mood obtenido:', moodData);

      // 🚀 GENERAR PLAYLIST REAL CON SPOTIFY
      const result = await generatePlaylistByMood(
        'triste',
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
      <div className="triste-container">
        <CircleLoader />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          {tokensLoading ? 'Cargando tokens de Spotify...' : 'Cargando playlists...'}
        </p>
      </div>
    );
  }

  return (
    <div className="triste-container">
      <div className="triste-header">
        <button className="back-button" onClick={handleBack}>
          ← Volver
        </button>
        <div className="mood-info">
          <span className="mood-emoji">😢</span>
          <div className="mood-text">
            <h1>Estado: Triste</h1>
            <p>Melodías melancólicas que te acompañan</p>
          </div>
        </div>
        <div className="user-badge">
          <span>{user?.user_metadata?.name || user?.email || 'Usuario'}</span>
        </div>
      </div>

      <main className="triste-main">
        <div className="welcome-card">
          <h2>Está bien sentirse así 💙</h2>
          <p>
            {spotifyAccessToken 
              ? 'La música de Spotify puede ser tu compañera en estos momentos difíciles'
              : 'Conecta tu cuenta de Spotify para obtener recomendaciones personalizadas'
            }
          </p>
          {error && (
            <p style={{ color: '#ff6b6b', fontSize: '0.9em', marginTop: '10px' }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* 🎵 SECCIÓN DE GENERACIÓN DE PLAYLIST */}
        <div className="generate-section">
          <div className="generate-card">
            <div className="generate-header">
              <div className="generate-icon">🎵</div>
              <div className="generate-text">
                <h3>Genera Tu Playlist Personalizada</h3>
                <p>Crea una playlist única basada en tus gustos y el mood triste</p>
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
                  <span>💙</span>
                  Generar Playlist Triste
                </>
              )}
            </button>
          </div>

          {/* Mostrar playlist generada */}
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
              <span className="stat-number">203</span>
              <span className="stat-label">Canciones</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-number">13h</span>
              <span className="stat-label">Duración Total</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💙</div>
            <div className="stat-info">
              <span className="stat-number">12</span>
              <span className="stat-label">Momentos de Paz</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
