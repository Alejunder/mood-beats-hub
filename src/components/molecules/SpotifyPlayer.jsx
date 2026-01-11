import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertTriangle, RotateCw, Music, Play, Pause, SkipBack, SkipForward, ChevronUp, X, Volume2, Volume1, VolumeX } from 'lucide-react';
import spotifyPlayerService from '../../services/spotifyPlayerService';
import { useLanguage } from '../../context/LanguageContext';
import './SpotifyPlayer.css';

export function SpotifyPlayer({ spotifyAccessToken, playlistUri, playlistName, onClose, isMinimized = false, onMaximize }) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const progressInterval = useRef(null);
  const hasInitialized = useRef(false);
  const currentPlaylistUri = useRef(null);
  const lastUpdateTime = useRef(Date.now());

  // Definir funciones antes de usarlas en useEffect
  const playNewPlaylist = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Reproducir la nueva playlist
      await spotifyPlayerService.playPlaylist(playlistUri, spotifyAccessToken);

      setIsInitializing(false);
    } catch (err) {
      console.error('❌ Error cambiando de playlist:', err);
      setError(err.message);
      setIsInitializing(false);
    }
  }, [playlistUri, spotifyAccessToken]);

  const initializePlayer = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Inicializar el reproductor
      await spotifyPlayerService.initialize(spotifyAccessToken);

      // Suscribirse a los cambios de estado
      const unsubscribe = spotifyPlayerService.subscribe((state) => {
        if (state.track) {
          setCurrentTrack(state.track);
          const newIsPlaying = !state.isPaused;
          setIsPlaying(newIsPlaying);
          
          if (!isDragging) {
            setProgress(state.position || 0);
          }
          
          lastUpdateTime.current = Date.now();
          setDuration(state.duration || 0);
        }
      });

      // Reproducir la playlist
      await spotifyPlayerService.playPlaylist(playlistUri, spotifyAccessToken);

      setIsInitializing(false);

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error inicializando player:', err);
      setError(err.message);
      setIsInitializing(false);
    }
  }, [playlistUri, spotifyAccessToken, isDragging]);

  // useEffect para inicialización
  useEffect(() => {
    if (!spotifyAccessToken || !playlistUri) return;

    // Inicializar si no se ha hecho antes O si cambió la playlist
    const playlistChanged = currentPlaylistUri.current !== null && currentPlaylistUri.current !== playlistUri;
    
    if (!hasInitialized.current || playlistChanged) {
      if (playlistChanged) {
        // Si cambió la playlist, reproducir la nueva directamente
        playNewPlaylist();
      } else {
        // Primera vez, inicializar completamente
        initializePlayer();
      }
      hasInitialized.current = true;
      currentPlaylistUri.current = playlistUri;
    }

    return () => {
      // Limpiar al desmontar
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [spotifyAccessToken, playlistUri, initializePlayer, playNewPlaylist]);

  // Actualizar progreso en tiempo real
  useEffect(() => {
    if (isPlaying && !isDragging && duration > 0) {
      // Limpiar intervalo previo si existe
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      // Obtener posición inicial del SDK
      spotifyPlayerService.getCurrentPosition().then(pos => {
        setProgress(pos);
        lastUpdateTime.current = Date.now();
      });

      // Actualizar progreso cada 200ms
      progressInterval.current = setInterval(async () => {
        // Obtener posición real del SDK cada segundo
        const now = Date.now();
        const elapsed = now - lastUpdateTime.current;
        
        if (elapsed >= 1000) {
          // Cada segundo, sincronizar con el SDK
          const realPosition = await spotifyPlayerService.getCurrentPosition();
          setProgress(realPosition);
          lastUpdateTime.current = now;
        } else {
          // Entre sincronizaciones, incrementar localmente
          setProgress(prev => Math.min(prev + 200, duration));
        }
      }, 200);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isPlaying, isDragging, duration]);

  const handlePlayPause = async () => {
    try {
      await spotifyPlayerService.togglePlay();
    } catch (err) {
      console.error('❌ Error al pausar/reproducir:', err);
    }
  };

  const handleNext = async () => {
    try {
      await spotifyPlayerService.nextTrack();
    } catch (err) {
      console.error('❌ Error al siguiente:', err);
    }
  };

  const handlePrevious = async () => {
    try {
      await spotifyPlayerService.previousTrack();
    } catch (err) {
      console.error('❌ Error al anterior:', err);
    }
  };

  const handleVolumeChange = async (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    await spotifyPlayerService.setVolume(newVolume / 100);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = useCallback(async (e) => {
    if (duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
    const newPosition = Math.floor(percentage * duration);
    
    setProgress(newPosition);
    await spotifyPlayerService.seek(newPosition);
    lastUpdateTime.current = Date.now();
  }, [duration]);

  const handleProgressDrag = useCallback((e, progressBarElement) => {
    if (duration === 0) return;
    const rect = progressBarElement.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const newPosition = Math.floor(percentage * duration);
    setProgress(newPosition);
  }, [duration]);

  const handleProgressMouseDown = useCallback((e) => {
    if (duration === 0) return;
    
    e.stopPropagation();
    
    setIsDragging(true);
    
    const progressBar = e.currentTarget;
    handleProgressDrag(e, progressBar);
    
    const progressBarRef = progressBar;

    const handleMouseMove = (moveEvent) => {
      handleProgressDrag(moveEvent, progressBarRef);
    };

    const handleMouseUp = async (upEvent) => {
      const rect = progressBarRef.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(upEvent.clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      const newPosition = Math.floor(percentage * duration);
      
      setProgress(newPosition);
      await spotifyPlayerService.seek(newPosition);
      lastUpdateTime.current = Date.now();
      setIsDragging(false);
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [duration, handleProgressDrag]);

  if (isInitializing) {
    return (
      <div className={`spotify-player ${isMinimized ? 'minimized' : ''}`}>
        <div className="player-loading">
          <Loader2 className="loader-spinner" size={40} />
          <p>{t('initializingPlayer') || 'Inicializando reproductor...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`spotify-player ${isMinimized ? 'minimized' : ''}`}>
        <div className="player-error">
          <AlertTriangle className="error-icon" size={24} />
          <p>{error}</p>
          <button onClick={initializePlayer} className="retry-btn">
            <RotateCw size={16} /> {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  // Versión minimizada
  if (isMinimized) {
    return (
      <div className="spotify-player minimized">
        <div className="minimized-content">
          {currentTrack && (
            <>
              <div className="minimized-track-info" onClick={onMaximize}>
                {currentTrack.album?.images?.[0]?.url ? (
                  <img src={currentTrack.album.images[0].url} alt={currentTrack.name} className="minimized-artwork" />
                ) : (
                  <div className="minimized-artwork-placeholder"><Music size={20} /></div>
                )}
                <div className="minimized-details">
                  <div className="minimized-track-name">{currentTrack.name}</div>
                  <div className="minimized-track-artist">
                    {currentTrack.artists?.map(artist => artist.name).join(', ')}
                  </div>
                </div>
              </div>
              
              <div className="minimized-controls">
                <button 
                  className="minimized-control-btn" 
                  onClick={handlePrevious}
                  title={t('previous') || 'Anterior'}
                >
                  <SkipBack size={18} />
                </button>
                <button 
                  className="minimized-control-btn minimized-play-btn" 
                  onClick={handlePlayPause}
                  title={isPlaying ? t('pause') : t('play')}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button 
                  className="minimized-control-btn" 
                  onClick={handleNext}
                  title={t('next') || 'Siguiente'}
                >
                  <SkipForward size={18} />
                </button>
                <button 
                  className="minimized-control-btn expand-btn" 
                  onClick={onMaximize}
                  title={t('expand') || 'Expandir'}
                >
                  <ChevronUp size={18} />
                </button>
                <button 
                  className="minimized-control-btn close-btn" 
                  onClick={onClose}
                  title={t('close')}
                >
                  <X size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Versión completa
  return (
    <div className="spotify-player">
      <div className="player-header">
        <div className="player-info">
          <Music className="playlist-icon" size={24} />
          <div>
            <h4>{playlistName || t('playlist')}</h4>
            <p className="player-subtitle">{t('playing') || 'Reproduciendo'} MoodBeatsHub</p>
          </div>
        </div>
        {onClose && (
          <button className="close-player-btn" onClick={onClose} title={t('close')}>
            <X size={20} />
          </button>
        )}
      </div>

      {currentTrack && (
        <div className="player-track-info">
          <div className="track-artwork">
            {currentTrack.album?.images?.[0]?.url ? (
              <img src={currentTrack.album.images[0].url} alt={currentTrack.name} />
            ) : (
              <div className="artwork-placeholder"><Music size={48} /></div>
            )}
          </div>
          <div className="track-details">
            <h3 className="track-name">{currentTrack.name}</h3>
            <p className="track-artist">
              {currentTrack.artists?.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="player-progress">
        <span className="time-label">{formatTime(progress)}</span>
        <div 
          className="progress-bar" 
          onMouseDown={handleProgressMouseDown}
          onClick={handleProgressClick}
          style={{ 
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div 
            className="progress-fill" 
            style={{ 
              width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
              pointerEvents: 'none'
            }}
          ></div>
        </div>
        <span className="time-label">{formatTime(duration)}</span>
      </div>

      {/* Controles de reproducción */}
      <div className="player-controls">
        <button 
          className="control-btn" 
          onClick={handlePrevious}
          title={t('previous') || 'Anterior'}
        >
          <SkipBack size={24} />
        </button>
        <button 
          className="control-btn play-btn" 
          onClick={handlePlayPause}
          title={isPlaying ? t('pause') : t('play')}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button 
          className="control-btn" 
          onClick={handleNext}
          title={t('next') || 'Siguiente'}
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* Control de volumen */}
      <div className="player-volume">
        {volume === 0 ? <VolumeX className="volume-icon" size={20} /> : volume < 50 ? <Volume1 className="volume-icon" size={20} /> : <Volume2 className="volume-icon" size={20} />}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-label">{volume}%</span>
      </div>
    </div>
  );
}
