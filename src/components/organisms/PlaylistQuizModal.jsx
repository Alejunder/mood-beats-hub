import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  POPULAR_GENRES, 
  validateQuizAnswers,
  MOOD_INTENSITY_LEVELS,
  AVAILABLE_MOODS
} from '../../services/playlistQuizService';
import { spotifyService } from '../../services/spotifyService';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslatedAvailableMoods } from '../../utils/moodTranslations';
import './styles/PlaylistQuizModal.css';

export function PlaylistQuizModal({ onClose, onSubmit, spotifyAccessToken }) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    mood: null,
    genres: 'random',
    customGenres: [],
    artists: 'random',
    customArtists: [],
    intensity: 'medio',
    playlistName: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState([]);
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debug removido para performance

  const handleGenreSelection = (genreType) => {
    if (genreType === 'random') {
      setAnswers(prev => ({ ...prev, genres: 'random', customGenres: [] }));
    } else {
      setAnswers(prev => ({ ...prev, genres: 'custom' }));
    }
  };

  const toggleGenre = (genre) => {
    setAnswers(prev => {
      const current = prev.customGenres || [];
      const isSelected = current.includes(genre);
      
      if (isSelected) {
        return { ...prev, customGenres: current.filter(g => g !== genre) };
      } else if (current.length < 5) {
        return { ...prev, customGenres: [...current, genre] };
      }
      return prev;
    });
  };

  const handleArtistSelection = (artistType) => {
    if (artistType === 'random' || artistType === 'random_artists') {
      setAnswers(prev => ({ ...prev, artists: artistType, customArtists: [] }));
    } else {
      setAnswers(prev => ({ ...prev, artists: 'custom' }));
    }
  };

  // Buscar artistas con debounce
  useEffect(() => {
    if (searchTerm.trim().length >= 2 && spotifyAccessToken) {
      setLoadingSuggestions(true);
      
      // Limpiar timeout anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Buscar después de 500ms de inactividad
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await spotifyService.searchArtists(searchTerm, spotifyAccessToken, 10);
          setArtistSuggestions(results.artists?.items || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error buscando artistas:', error);
          setArtistSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 500);
    } else {
      setArtistSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, spotifyAccessToken]);

  const addCustomArtist = (artistName = null) => {
    const nameToAdd = artistName || searchTerm.trim();
    if (nameToAdd && (answers.customArtists?.length || 0) < 5) {
      // Evitar duplicados
      if (!answers.customArtists.some(a => a.toLowerCase() === nameToAdd.toLowerCase())) {
        setAnswers(prev => ({
          ...prev,
          customArtists: [...(prev.customArtists || []), nameToAdd]
        }));
      }
      setSearchTerm('');
      setShowSuggestions(false);
      setArtistSuggestions([]);
    }
  };

  const selectSuggestion = (artist) => {
    addCustomArtist(artist.name);
  };

  const removeArtist = (index) => {
    setAnswers(prev => ({
      ...prev,
      customArtists: prev.customArtists.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!answers.mood) {
      setErrors([t('selectMoodError')]);
      return;
    }

    if (!answers.playlistName.trim()) {
      setErrors([t('nameRequiredError')]);
      return;
    }

    const finalAnswers = {
      mood: answers.mood,
      genres: answers.genres === 'random' ? 'random' : answers.customGenres,
      artists: answers.artists === 'random' ? 'random' : answers.artists === 'random_artists' ? 'random_artists' : answers.customArtists,
      intensity: answers.intensity,
      playlistName: answers.playlistName.trim(),
      description: answers.description.trim()
    };

    const validation = validateQuizAnswers(finalAnswers);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(finalAnswers);
  };

  // Obtener configuración del mood seleccionado con traducciones
  const selectedMoodConfig = answers.mood ? getTranslatedAvailableMoods(t)[answers.mood] : null;

  const renderStep0 = () => {
    // Obtener moods traducidos
    const translatedMoods = getTranslatedAvailableMoods(t);
    
    return (
      <div className="quiz-step">
        <h3>🎭 {t('moodTitle')}</h3>
        <p className="quiz-description">{t('moodDesc')}</p>

        <div className="mood-selection-grid">
          {Object.values(translatedMoods).map((mood) => (
          <button
            key={mood.id}
            type="button"
            className={`mood-selection-card ${answers.mood === mood.id ? 'selected' : ''}`}
            onClick={() => setAnswers(prev => ({ ...prev, mood: mood.id }))}
            style={{
              '--mood-color': mood.color,
              '--mood-rgb': mood.rgb
            }}
          >
            <div className="mood-emoji-large">{mood.emoji}</div>
            <h4>{mood.label}</h4>
            <p>{mood.description}</p>
          </button>
        ))}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="quiz-step">
      <h3>🎸 {t('genresTitle')}</h3>
      <p className="quiz-description">{t('genresDesc')}</p>

      <div className="quiz-options">
        <button
          type="button"
          className={`quiz-option-btn ${answers.genres === 'random' ? 'selected' : ''}`}
          onClick={() => handleGenreSelection('random')}
        >
          <span className="option-icon">🎲</span>
          <span>{t('surpriseMe')}</span>
        </button>

        <button
          type="button"
          className={`quiz-option-btn ${answers.genres === 'custom' ? 'selected' : ''}`}
          onClick={() => handleGenreSelection('custom')}
        >
          <span className="option-icon">✏️</span>
          <span>{t('chooseGenres')}</span>
        </button>
      </div>

      {answers.genres === 'custom' && (
        <div className="custom-genres-selector">
          <p className="helper-text">{t('selectUpTo').replace('{max}', '5').replace('{current}', answers.customGenres.length)}</p>
          <div className="genre-grid">
            {POPULAR_GENRES.map(genre => (
              <button
                key={genre}
                type="button"
                className={`genre-chip ${answers.customGenres.includes(genre) ? 'selected' : ''}`}
                onClick={() => toggleGenre(genre)}
                disabled={!answers.customGenres.includes(genre) && answers.customGenres.length >= 5}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="quiz-step">
      <h3>🎤 {t('artistsTitle')}</h3>
      <p className="quiz-description">{t('artistsDesc')}</p>

      <div className="quiz-options">
        <button
          type="button"
          className={`quiz-option-btn ${answers.artists === 'random' ? 'selected' : ''}`}
          onClick={() => handleArtistSelection('random')}
        >
          <span className="option-icon">⭐</span>
          <span>{t('useFavorites')}</span>
        </button>

        <button
          type="button"
          className={`quiz-option-btn ${answers.artists === 'random_artists' ? 'selected' : ''}`}
          onClick={() => handleArtistSelection('random_artists')}
        >
          <span className="option-icon">🎲</span>
          <span>{t('randomArtists')}</span>
        </button>

        <button
          type="button"
          className={`quiz-option-btn ${answers.artists === 'custom' ? 'selected' : ''}`}
          onClick={() => handleArtistSelection('custom')}
        >
          <span className="option-icon">✏️</span>
          <span>{t('chooseArtists')}</span>
        </button>
      </div>

      {answers.artists === 'custom' && (
        <div className="custom-artists-input">
          <p className="helper-text">{t('addUpTo').replace('{max}', '5').replace('{current}', answers.customArtists.length)}</p>
          
          <div className="artist-search-wrapper">
            <div className="artist-input-group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArtist();
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('searchArtist')}
                disabled={answers.customArtists.length >= 5}
                autoComplete="off"
              />
              <button 
                type="button"
                onClick={() => addCustomArtist()}
                disabled={!searchTerm.trim() || answers.customArtists.length >= 5}
                className="add-btn"
              >
                {loadingSuggestions ? '...' : t('add')}
              </button>
            </div>

            {/* Sugerencias de artistas */}
            {showSuggestions && searchTerm.trim().length >= 2 && (
              <div className="artist-suggestions">
                {loadingSuggestions ? (
                  <div className="suggestions-loading">
                    <span>🔍</span>
                    <p>{t('searching')}</p>
                  </div>
                ) : artistSuggestions.length > 0 ? (
                  <>
                    <p className="suggestions-header">{t('suggestions')}</p>
                    {artistSuggestions.map((artist) => (
                      <button
                        key={artist.id}
                        type="button"
                        className="suggestion-item"
                        onClick={() => selectSuggestion(artist)}
                        disabled={answers.customArtists.length >= 5}
                      >
                        {artist.images && artist.images[0] ? (
                          <img 
                            src={artist.images[artist.images.length - 1]?.url} 
                            alt={artist.name}
                            className="suggestion-avatar"
                          />
                        ) : (
                          <div className="suggestion-avatar-placeholder">🎤</div>
                        )}
                        <div className="suggestion-info">
                          <span className="suggestion-name">{artist.name}</span>
                          {artist.genres && artist.genres.length > 0 && (
                            <span className="suggestion-genre">
                              {artist.genres.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                        {artist.followers && (
                          <span className="suggestion-followers">
                            {(artist.followers.total / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="suggestions-empty">
                    <span>🤷‍♂️</span>
                    <p>{t('noResults')}</p>
                    <small>{t('addManually')}</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {answers.customArtists.length > 0 && (
            <div className="selected-artists">
              {answers.customArtists.map((artist, index) => (
                <div key={index} className="artist-chip">
                  <span>{artist}</span>
                  <button 
                    type="button"
                    onClick={() => removeArtist(index)}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="quiz-step">
      <h3>🎚️ {t('intensityTitle')}</h3>
      <p className="quiz-description">{t('intensityDesc').replace('{mood}', selectedMoodConfig?.label || '')}</p>

      <div className="intensity-options">
        {Object.entries(MOOD_INTENSITY_LEVELS).map(([key, config]) => (
          <button
            key={key}
            type="button"
            className={`intensity-option ${answers.intensity === key ? 'selected' : ''} ${config.recommended ? 'recommended' : ''}`}
            onClick={() => setAnswers(prev => ({ ...prev, intensity: key }))}
          >
            <span className="intensity-emoji">{config.emoji}</span>
            <div className="intensity-info">
              <strong>{config.label}</strong>
              {config.recommended && <span className="badge">{t('recommended')}</span>}
              <p>{config.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="quiz-step">
      <h3>✏️ {t('nameTitle')}</h3>
      <p className="quiz-description">{t('nameDesc')}</p>

      <div className="playlist-name-input">
        <input
          type="text"
          value={answers.playlistName}
          onChange={(e) => setAnswers(prev => ({ ...prev, playlistName: e.target.value }))}
          placeholder={t('namePlaceholder').replace('{mood}', selectedMoodConfig?.label || 'Personalizada')}
          maxLength={50}
          className="playlist-name-field"
          autoFocus
        />
        <p className="helper-text">{t('characters').replace('{current}', answers.playlistName.length).replace('{max}', '50')}</p>
        
        <div className="playlist-description-field">
          <label htmlFor="playlist-description">{t('descriptionLabel')}</label>
          <textarea
            id="playlist-description"
            value={answers.description}
            onChange={(e) => setAnswers(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('descriptionPlaceholder')}
            maxLength={300}
            rows={3}
            className="playlist-description-textarea"
          />
          <p className="helper-text">{t('characters').replace('{current}', answers.description.length).replace('{max}', '300')}</p>
          <p className="helper-text description-hint">{t('descriptionHelper')}</p>
        </div>
        
        {selectedMoodConfig && (
          <div className="playlist-preview">
            <div className="preview-icon">{selectedMoodConfig.emoji}</div>
            <div className="preview-info">
              <h4>{answers.playlistName || t('namePlaceholder').replace('{mood}', selectedMoodConfig.label)}</h4>
              <p>{t('preview')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const modalContent = (
    <div 
      className="quiz-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="quiz-modal" 
        onClick={(e) => e.stopPropagation()}
        style={selectedMoodConfig ? {
          '--dynamic-mood-color': selectedMoodConfig.color,
          '--dynamic-mood-rgb': selectedMoodConfig.rgb
        } : {}}
      >
        <button 
          type="button"
          className="quiz-close-btn" 
          onClick={onClose}
        >×</button>
        
        <div className="quiz-header">
          <h2>{t('customizePlaylist')}</h2>
          <div className="quiz-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
              />
            </div>
            <span className="progress-text">{t('step').replace('{current}', currentStep + 1).replace('{total}', '5')}</span>
          </div>
        </div>

        <div className="quiz-content">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {errors.length > 0 && (
            <div className="quiz-errors">
              {errors.map((error, i) => (
                <p key={i} className="error-message">{error}</p>
              ))}
            </div>
          )}
        </div>

        <div className="quiz-actions">
          {currentStep > 0 && (
            <button 
              type="button"
              onClick={handleBack}
              className="btn-secondary"
            >
              ← {t('back2')}
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="btn-primary"
              disabled={currentStep === 0 && !answers.mood}
            >
              {t('next')} →
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit}
              className="btn-primary btn-generate"
              disabled={!answers.playlistName.trim()}
            >
              🎵 {t('generate')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
