/**
 * 🌍 UTILIDAD PARA TRADUCCIONES DE MOODS
 * Convierte los moods a sus traducciones correspondientes
 */

/**
 * Obtiene el nombre traducido de un mood
 * @param {string} moodId - ID del mood ('feliz', 'triste', 'motivado', 'relajado')
 * @param {function} t - Función de traducción del hook useLanguage
 * @returns {string} Nombre traducido del mood
 */
export const getMoodLabel = (moodId, t) => {
  const moodMap = {
    feliz: 'moodHappy',
    triste: 'moodSad',
    motivado: 'moodMotivated',
    relajado: 'moodRelaxed'
  };
  
  return t(moodMap[moodId] || moodId);
};

/**
 * Obtiene la descripción traducida de un mood
 * @param {string} moodId - ID del mood
 * @param {function} t - Función de traducción
 * @returns {string} Descripción traducida del mood
 */
export const getMoodDescription = (moodId, t) => {
  const descMap = {
    feliz: 'moodHappyDesc',
    triste: 'moodSadDesc',
    motivado: 'moodMotivatedDesc',
    relajado: 'moodRelaxedDesc'
  };
  
  return t(descMap[moodId] || '');
};

/**
 * Obtiene los moods con traducciones
 * @param {function} t - Función de traducción
 * @returns {Array} Array de moods con labels y descripciones traducidas
 */
export const getTranslatedMoods = (t) => {
  return [
    { 
      id: 'feliz', 
      emoji: '😊', 
      label: t('moodHappy'), 
      color: '#FFD93D',
      rgb: '255, 217, 61',
      description: t('moodHappyDesc')
    },
    { 
      id: 'triste', 
      emoji: '😢', 
      label: t('moodSad'), 
      color: '#597081',
      rgb: '89, 112, 129',
      description: t('moodSadDesc')
    },
    { 
      id: 'motivado', 
      emoji: '💪', 
      label: t('moodMotivated'), 
      color: '#9a031e',
      rgb: '154, 3, 30',
      description: t('moodMotivatedDesc')
    },
    { 
      id: 'relajado', 
      emoji: '😌', 
      label: t('moodRelaxed'), 
      color: '#d5b9b2',
      rgb: '213, 185, 178',
      description: t('moodRelaxedDesc')
    }
  ];
};

/**
 * Obtiene los AVAILABLE_MOODS con traducciones
 * @param {function} t - Función de traducción
 * @returns {Object} AVAILABLE_MOODS con labels y descripciones traducidas
 */
export const getTranslatedAvailableMoods = (t) => {
  return {
    feliz: {
      id: 'feliz',
      label: t('moodHappy'),
      emoji: '😊',
      color: '#FFD93D',
      rgb: '255, 217, 61',
      bgGradient: 'linear-gradient(145deg, #2a2000, #1a1500)',
      description: t('moodHappyDesc'),
      headerEmoji: '😊'
    },
    triste: {
      id: 'triste',
      label: t('moodSad'),
      emoji: '😢',
      color: '#597081',
      rgb: '89, 112, 129',
      bgGradient: 'linear-gradient(145deg, #0a1628, #050d18)',
      description: t('moodSadDesc'),
      headerEmoji: '💙'
    },
    motivado: {
      id: 'motivado',
      label: t('moodMotivated'),
      emoji: '💪',
      color: '#9a031e',
      rgb: '154, 3, 30',
      bgGradient: 'linear-gradient(145deg, #1a0305, #0d0102)',
      description: t('moodMotivatedDesc'),
      headerEmoji: '💪'
    },
    relajado: {
      id: 'relajado',
      label: t('moodRelaxed'),
      emoji: '😌',
      color: '#d5b9b2',
      rgb: '213, 185, 178',
      bgGradient: 'linear-gradient(145deg, #1a1412, #0d0a08)',
      description: t('moodRelaxedDesc'),
      headerEmoji: '🌿'
    }
  };
};

