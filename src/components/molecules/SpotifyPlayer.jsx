import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import './SpotifyPlayer.css';

export function SpotifyPlayer({ 
  isReady, 
  isPaused, 
  currentTrack, 
  position, 
  duration,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange
}) {
  const { t } = useLanguage();
  const { isAutoPlayEnabled, getAudioQuality } = useAppSettings();
  const [localPosition, setLocalPosition] = useState(0);
  const [volume, setVolume] = useState(50);
  const [error, setError] = useState(null);
  const [showRestartMessage, setShowRestartMessage] = useState(false);

  // Mostrar mensaje de reinicio después de 5 segundos si sigue cargando
  useEffect(() => {
    if (!isReady) {
      console.log('⏱️ Iniciando timer de 5 segundos para mensaje de reinicio...');
      const timer = setTimeout(() => {
        console.log('⏰ 5 segundos transcurridos, mostrando mensaje de reinicio');
        setShowRestartMessage(true);
      }, 5000); // 5 segundos

      return () => {
        clearTimeout(timer);
        setShowRestartMessage(false);
      };
    } else {
      setShowRestartMessage(false);
    }
  }, [isReady]);

  // Sincronizar posición con seguridad
  useEffect(() => {
    try {
      if (typeof position === 'number' && !isNaN(position)) {
        setLocalPosition(position);
      }
    } catch (err) {
      console.error('Error actualizando posición:', err);
      setError('Error actualizando posición');
    }
  }, [position]);

  // Actualizar progreso local cuando está reproduciendo
  useEffect(() => {
    if (!isPaused && duration > 0) {
      const interval = setInterval(() => {
        setLocalPosition(prev => {
          const newPos = Math.min(prev + 1000, duration);
          return isNaN(newPos) ? prev : newPos;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, duration]);

  const formatTime = (ms) => {
    try {
      if (!ms || isNaN(ms) || ms < 0) return '0:00';
      const seconds = Math.floor(ms / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch (err) {
      console.error('Error formateando tiempo:', err);
      return '0:00';
    }
  };

  const handleSeek = (e) => {
    try {
      const value = parseFloat(e.target.value);
      if (isNaN(value) || !duration || duration <= 0) return;
      
      const newPosition = (value / 100) * duration;
      setLocalPosition(newPosition);
      
      if (onSeek && typeof onSeek === 'function') {
        onSeek(newPosition);
      } else {
        console.warn('onSeek no está disponible');
      }
      setError(null);
    } catch (err) {
      console.error('Error al buscar posición:', err);
      setError(t('errorSeek'));
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleVolumeChange = (e) => {
    try {
      const newVolume = parseFloat(e.target.value);
      if (isNaN(newVolume)) return;
      
      setVolume(newVolume);
      
      if (onVolumeChange && typeof onVolumeChange === 'function') {
        onVolumeChange(newVolume / 100);
      } else {
        console.warn('onVolumeChange no está disponible');
      }
      setError(null);
    } catch (err) {
      console.error('Error al cambiar volumen:', err);
      setError(t('errorVolume'));
      setTimeout(() => setError(null), 3000);
    }
  };

  // Funciones seguras para controles
  const safeTogglePlay = () => {
    try {
      if (onTogglePlay && typeof onTogglePlay === 'function') {
        onTogglePlay();
        setError(null);
      } else {
        console.warn('onTogglePlay no está disponible');
      }
    } catch (err) {
      console.error('Error al reproducir/pausar:', err);
      setError(t('errorPlay'));
      setTimeout(() => setError(null), 3000);
    }
  };

  const safeNext = () => {
    try {
      if (onNext && typeof onNext === 'function') {
        onNext();
        setError(null);
      } else {
        console.warn('onNext no está disponible');
      }
    } catch (err) {
      console.error('Error al siguiente:', err);
      setError('Error al cambiar canción');
      setTimeout(() => setError(null), 3000);
    }
  };

  const safePrevious = () => {
    try {
      if (onPrevious && typeof onPrevious === 'function') {
        onPrevious();
        setError(null);
      } else {
        console.warn('onPrevious no está disponible');
      }
    } catch (err) {
      console.error('Error al anterior:', err);
      setError('Error al cambiar canción');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!isReady) {
    console.log('🔄 Renderizando estado de carga, showRestartMessage:', showRestartMessage);
    return (
      <div className="spotify-player loading">
        <div className="player-loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">🎵 {t('loadingPlayer2')}</p>
          <p className="loading-note">{t('requiresPremium')}</p>
          {showRestartMessage && (
            <>
              <div className="loading-restart-message" style={{ display: 'flex' }}>
                <span className="restart-icon">⚠️</span>
                <span className="restart-text">{t('restartAppForPlayer')}</span>
              </div>
              <button 
                className="restart-button"
                onClick={() => window.location.reload()}
              >
                <span className="restart-btn-icon">🔄</span>
                <span className="restart-btn-text">{t('restartButton')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="spotify-player empty">
        <div className="empty-state">
          <span className="empty-icon">🎧</span>
          <p>{t('selectPlaylist')}</p>
        </div>
      </div>
    );
  }

  // Calcular progreso con seguridad
  let progressPercent = 0;
  try {
    if (duration && duration > 0 && localPosition >= 0) {
      progressPercent = Math.min(100, Math.max(0, (localPosition / duration) * 100));
    }
  } catch (err) {
    console.error('Error calculando progreso:', err);
  }

  return (
    <div className="spotify-player">
      {error && (
        <div className="player-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
      
      <div className="player-track-info">
        {currentTrack?.album?.images?.[0]?.url ? (
          <img 
            src={currentTrack.album.images[0].url} 
            alt={currentTrack.name || 'Track'}
            className="track-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="track-image-placeholder">🎵</div>
        )}
        <div className="track-details">
          <div className="track-name" title={currentTrack?.name || ''}>
            {currentTrack?.name || t('noTitle')}
          </div>
          <div className="track-artist" title={currentTrack?.artists?.map(a => a.name).join(', ') || ''}>
            {currentTrack?.artists?.map(artist => artist.name).join(', ') || t('unknownArtist')}
          </div>
        </div>
      </div>

      <div className="player-controls">
        <button 
          onClick={safePrevious} 
          className="control-btn control-prev" 
          title={t('previous')}
          disabled={!onPrevious}
        >
          <span className="control-icon">⏮</span>
        </button>
        <button 
          onClick={safeTogglePlay} 
          className="control-btn play-btn" 
          title={isPaused ? t('playButton') : t('pause')}
          disabled={!onTogglePlay}
        >
          <span className="play-icon">{isPaused ? '▶' : '⏸'}</span>
        </button>
        <button 
          onClick={safeNext} 
          className="control-btn control-next" 
          title={t('nextButton')}
          disabled={!onNext}
        >
          <span className="control-icon">⏭</span>
        </button>
      </div>

      <div className="player-progress">
        <span className="time-label">{formatTime(localPosition)}</span>
        <div className="progress-bar-container">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercent || 0}
            onChange={handleSeek}
            className="progress-bar"
            disabled={!duration || duration <= 0}
          />
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent || 0}%` }}
          ></div>
        </div>
        <span className="time-label">{formatTime(duration)}</span>
      </div>

      <div className="player-volume">
        <button className="volume-btn" title={t('volume')}>
          <span className="volume-icon">
            {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
          </span>
        </button>
        <div className="volume-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={volume || 0}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <div 
            className="volume-slider-fill" 
            style={{ width: `${volume || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
