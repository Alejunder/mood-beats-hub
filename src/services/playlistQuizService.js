/**
 * 🎯 SERVICIO DE CUESTIONARIO PARA GENERACIÓN DE PLAYLISTS
 * Permite al usuario personalizar la generación con preferencias específicas
 */

/**
 * � MOODS DISPONIBLES CON CONFIGURACIONES DE ESTILO
 */
export const AVAILABLE_MOODS = {
  feliz: {
    id: 'feliz',
    label: 'Feliz',
    emoji: '😊',
    color: '#FFD93D',
    rgb: '255, 217, 61',
    bgGradient: 'linear-gradient(145deg, #2a2000, #1a1500)',
    description: 'Música alegre y positiva para celebrar',
    headerEmoji: '😊'
  },
  triste: {
    id: 'triste',
    label: 'Triste',
    emoji: '😢',
    color: '#597081',
    rgb: '89, 112, 129',
    bgGradient: 'linear-gradient(145deg, #0a1628, #050d18)',
    description: 'Canciones melancólicas para reflexionar',
    headerEmoji: '💙'
  },
  motivado: {
    id: 'motivado',
    label: 'Motivado',
    emoji: '💪',
    color: '#9a031e',
    rgb: '154, 3, 30',
    bgGradient: 'linear-gradient(145deg, #1a0305, #0d0102)',
    description: 'Ritmos energéticos para conquistar el día',
    headerEmoji: '💪'
  },
  relajado: {
    id: 'relajado',
    label: 'Relajado',
    emoji: '😌',
    color: '#d5b9b2',
    rgb: '213, 185, 178',
    bgGradient: 'linear-gradient(145deg, #1a1412, #0d0a08)',
    description: 'Música tranquila para desconectar',
    headerEmoji: '🌿'
  }
};

/**
 * �🎸 GÉNEROS MUSICALES DISPONIBLES POR CATEGORÍA
 */
export const GENRE_CATEGORIES = {
  pop: ['pop', 'k-pop', 'j-pop', 'synth-pop', 'dance-pop', 'indie-pop'],
  rock: ['rock', 'alternative', 'indie', 'punk', 'grunge', 'hard-rock', 'progressive-rock'],
  electronic: ['electronic', 'edm', 'house', 'techno', 'dubstep', 'trance', 'drum-and-bass'],
  hiphop: ['hip-hop', 'rap', 'trap', 'r-n-b', 'soul'],
  latin: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'banda', 'corridos'],
  jazz: ['jazz', 'blues', 'bossa-nova', 'smooth-jazz', 'jazz-fusion'],
  classical: ['classical', 'piano', 'orchestra', 'opera', 'chamber'],
  ambient: ['ambient', 'chill', 'lofi', 'downtempo', 'chillout'],
  metal: ['metal', 'heavy-metal', 'death-metal', 'metalcore', 'progressive-metal'],
  country: ['country', 'folk', 'bluegrass', 'americana'],
  world: ['world-music', 'afrobeat', 'reggae', 'ska', 'flamenco']
};

/**
 * 🎵 GÉNEROS MÁS POPULARES (para sugerencias rápidas)
 */
export const POPULAR_GENRES = [
  'pop',
  'rock',
  'hip-hop',
  'electronic',
  'latin',
  'indie',
  'r-n-b',
  'jazz',
  'reggaeton',
  'alternative'
];

/**
 * 🎚️ NIVELES DE INTENSIDAD DEL MOOD
 */
export const MOOD_INTENSITY_LEVELS = {
  muy_bajo: {
    label: 'Muy Suave',
    multiplier: 0.5,
    description: 'Un toque ligero del mood',
    emoji: '😌'
  },
  bajo: {
    label: 'Suave',
    multiplier: 0.75,
    description: 'Mood presente pero sutil',
    emoji: '🙂'
  },
  medio: {
    label: 'Moderado',
    multiplier: 1.0,
    description: 'Balance perfecto (recomendado)',
    emoji: '😊'
  },
  alto: {
    label: 'Intenso',
    multiplier: 1.5,
    description: 'Mood muy marcado',
    emoji: '🤩'
  },
  muy_alto: {
    label: 'Extremo',
    multiplier: 2.0,
    description: 'Máxima intensidad del mood',
    emoji: '🔥'
  }
};

/**
 * 📋 VALIDAR RESPUESTAS DEL CUESTIONARIO
 */
export const validateQuizAnswers = (answers) => {
  const errors = [];

  // Validar géneros
  if (answers.genres && answers.genres !== 'random') {
    if (!Array.isArray(answers.genres) || answers.genres.length === 0) {
      errors.push('Debes seleccionar al menos un género musical');
    }
    if (answers.genres.length > 5) {
      errors.push('Puedes seleccionar máximo 5 géneros');
    }
  }

  // Validar artistas
  if (answers.artists && answers.artists !== 'random' && answers.artists !== 'random_artists') {
    if (!Array.isArray(answers.artists) || answers.artists.length === 0) {
      errors.push('Debes agregar al menos un artista');
    }
    if (answers.artists.length > 5) {
      errors.push('Puedes agregar máximo 5 artistas');
    }
  }

  // Validar intensidad
  if (!answers.intensity || !MOOD_INTENSITY_LEVELS[answers.intensity]) {
    errors.push('Debes seleccionar una intensidad válida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 🎯 ESTRUCTURA DEL CUESTIONARIO
 */
export const QUIZ_STRUCTURE = {
  step1: {
    id: 'genres',
    title: '🎸 Géneros Musicales',
    description: '¿Qué géneros quieres en tu playlist?',
    type: 'multi-select',
    options: [
      { value: 'random', label: 'Sorpréndeme (Géneros Aleatorios)', icon: '🎲' },
      { value: 'custom', label: 'Elegir mis géneros', icon: '✏️' }
    ],
    customInput: {
      type: 'genre-selector',
      placeholder: 'Selecciona hasta 5 géneros',
      categories: GENRE_CATEGORIES,
      popularGenres: POPULAR_GENRES,
      maxSelections: 5
    }
  },
  step2: {
    id: 'artists',
    title: '🎤 Artistas',
    description: '¿Qué artistas te gustaría incluir?',
    type: 'multi-select',
    options: [
      { value: 'random', label: 'Usar mis artistas favoritos', icon: '⭐' },
      { value: 'custom', label: 'Elegir artistas específicos', icon: '✏️' }
    ],
    customInput: {
      type: 'artist-search',
      placeholder: 'Busca y agrega hasta 5 artistas',
      maxSelections: 5,
      searchEnabled: true
    }
  },
  step3: {
    id: 'intensity',
    title: '🎚️ Intensidad del Mood',
    description: '¿Qué tan intenso quieres que sea el mood?',
    type: 'single-select',
    required: true,
    options: Object.entries(MOOD_INTENSITY_LEVELS).map(([key, config]) => ({
      value: key,
      label: config.label,
      description: config.description,
      emoji: config.emoji,
      recommended: key === 'medio'
    }))
  }
};

/**
 * 🔄 PROCESAR RESPUESTAS DEL CUESTIONARIO
 * Convierte las respuestas en parámetros para el algoritmo de generación
 */
export const processQuizAnswers = (answers, userTopArtists) => {
  const processed = {
    useCustomGenres: false,
    genres: [],
    useCustomArtists: false,
    artists: [],
    intensity: MOOD_INTENSITY_LEVELS[answers.intensity] || MOOD_INTENSITY_LEVELS.medio
  };

  // Procesar géneros
  if (answers.genres === 'random' || !answers.genres) {
    processed.useCustomGenres = false;
    processed.genres = []; // El algoritmo usará géneros del usuario
  } else if (Array.isArray(answers.genres) && answers.genres.length > 0) {
    processed.useCustomGenres = true;
    processed.genres = answers.genres.slice(0, 5);
  }

  // Procesar artistas
  if (answers.artists === 'random' || !answers.artists) {
    processed.useCustomArtists = false;
    processed.artists = userTopArtists.slice(0, 5); // Usar top artistas del usuario
  } else if (answers.artists === 'random_artists') {
    // Artistas aleatorios basados en géneros (NO usar favoritos)
    processed.useCustomArtists = false;
    processed.artists = []; // Vacío para indicar que se busca solo por géneros
    processed.useRandomArtists = true; // Flag especial
  } else if (Array.isArray(answers.artists) && answers.artists.length > 0) {
    processed.useCustomArtists = true;
    processed.artists = answers.artists.slice(0, 5);
  }

  return processed;
};

/**
 * 🎨 OBTENER GÉNEROS RECOMENDADOS POR MOOD
 */
export const getRecommendedGenresByMood = (mood) => {
  const recommendations = {
    feliz: ['pop', 'dance', 'latin', 'reggaeton', 'funk', 'disco'],
    triste: ['indie', 'alternative', 'acoustic', 'soul', 'r-n-b', 'blues'],
    motivado: ['rock', 'hip-hop', 'electronic', 'metal', 'edm', 'trap'],
    relajado: ['jazz', 'ambient', 'lofi', 'classical', 'bossa-nova', 'chill']
  };

  return recommendations[mood.toLowerCase()] || recommendations.feliz;
};

/**
 * 📊 AJUSTAR SCORING SEGÚN INTENSIDAD
 * Modifica los pesos del scoring según la intensidad seleccionada
 */
export const adjustScoringByIntensity = (baseScoring, intensity) => {
  const intensityConfig = MOOD_INTENSITY_LEVELS[intensity] || MOOD_INTENSITY_LEVELS.medio;
  const multiplier = intensityConfig.multiplier;

  return {
    ...baseScoring,
    keywordWeight: baseScoring.keywordWeight * multiplier,
    genreWeight: baseScoring.genreWeight * multiplier,
    minScore: baseScoring.minScore * (multiplier * 0.8), // Ajustar mínimo también
    highRelevancePercentage: Math.min(0.95, baseScoring.highRelevancePercentage + (multiplier - 1) * 0.1)
  };
};
