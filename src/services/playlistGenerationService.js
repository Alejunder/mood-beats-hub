import { spotifyService } from './spotifyService';
import { insertPlaylist, executeCustomQuery } from './databaseService';
import { processQuizAnswers } from './playlistQuizService';

/**
 * 🎵 PARÁMETROS DE GENERACIÓN POR MOOD
 * Cada mood tiene valores específicos de características de audio
 */
const MOOD_GENERATION_PARAMS = {
  feliz: {
    target_valence: 0.8,      // Alta positividad
    target_energy: 0.7,        // Energía moderada-alta
    target_danceability: 0.7,  // Bailable
    limit: 30
  },
  triste: {
    target_valence: 0.3,       // Baja positividad
    target_acousticness: 0.7,  // Alta acústica
    target_energy: 0.4,        // Baja energía
    limit: 30
  },
  motivado: {
    target_energy: 0.9,        // Energía muy alta
    target_tempo: 140,         // Tempo rápido (BPM)
    target_valence: 0.7,       // Positividad alta
    limit: 30
  },
  relajado: {
    target_valence: 0.5,       // Positividad neutra
    target_acousticness: 0.8,  // Muy acústico
    target_energy: 0.3,        // Energía baja
    target_instrumentalness: 0.5, // Preferencia por instrumental
    limit: 30
  }
};

/**
 * 🎸 MAPEO DE GÉNEROS GENERALES Y SUS SUBGÉNEROS
 * Cuando el usuario selecciona un género general (ej: 'rock'),
 * se incluyen TODOS sus subgéneros automáticamente
 */
const GENRE_FAMILY_MAP = {
  // Rock y derivados
  'rock': ['rock', 'hard-rock', 'soft-rock', 'classic-rock', 'alternhedeliative-rock', 'indie-rock', 
           'progressive-rock', 'punk-rock', 'garage-rock', 'folk-rock', 'psycc-rock',
           'grunge', 'alternative', 'indie', 'punk', 'emo', 'post-punk', 'new-wave'],
  
  // Metal y derivados
  'metal': ['metal', 'heavy-metal', 'death-metal', 'black-metal', 'thrash-metal', 'doom-metal',
            'power-metal', 'progressive-metal', 'metalcore', 'deathcore', 'nu-metal', 'industrial-metal'],
  
  // Pop y derivados
  'pop': ['pop', 'dance-pop', 'synth-pop', 'electro-pop', 'indie-pop', 'art-pop', 'chamber-pop',
          'k-pop', 'j-pop', 'c-pop', 'europop', 'latin-pop', 'pop-rock', 'power-pop'],
  
  // Hip-Hop y derivados
  'hip-hop': ['hip-hop', 'rap', 'trap', 'gangsta-rap', 'conscious-hip-hop', 'alternative-hip-hop',
              'east-coast-hip-hop', 'west-coast-hip-hop', 'southern-hip-hop', 'boom-bap'],
  
  // Electronic y derivados
  'electronic': ['electronic', 'edm', 'house', 'techno', 'trance', 'dubstep', 'drum-and-bass',
                 'electro', 'ambient', 'downtempo', 'IDM', 'breakbeat', 'jungle', 'garage'],
  
  // R&B y Soul
  'r-n-b': ['r-n-b', 'rnb', 'soul', 'neo-soul', 'funk', 'motown', 'contemporary-r-n-b'],
  
  // Jazz y derivados
  'jazz': ['jazz', 'smooth-jazz', 'jazz-fusion', 'bebop', 'swing', 'cool-jazz', 'free-jazz',
           'latin-jazz', 'vocal-jazz', 'contemporary-jazz', 'bossa-nova'],
  
  // Latin y derivados
  'latin': ['latin', 'reggaeton', 'salsa', 'bachata', 'merengue', 'cumbia', 'banda', 'corridos',
            'mariachi', 'duranguense', 'regional-mexican', 'latin-pop', 'latin-urban'],
  
  // Country y Folk
  'country': ['country', 'alt-country', 'country-rock', 'bluegrass', 'honky-tonk', 'nashville-sound'],
  'folk': ['folk', 'folk-rock', 'indie-folk', 'contemporary-folk', 'americana', 'singer-songwriter'],
  
  // Reggae y derivados
  'reggae': ['reggae', 'dancehall', 'dub', 'ska', 'rocksteady', 'reggae-fusion'],
  
  // Blues y derivados
  'blues': ['blues', 'electric-blues', 'chicago-blues', 'delta-blues', 'blues-rock'],
  
  // Classical y derivados
  'classical': ['classical', 'baroque', 'romantic', 'opera', 'symphony', 'chamber', 'piano',
                'orchestral', 'contemporary-classical'],
  
  // Ambient y Chill
  'ambient': ['ambient', 'chillout', 'downtempo', 'lofi', 'chillwave', 'vaporwave'],
  
  // Indie general
  'indie': ['indie', 'indie-rock', 'indie-pop', 'indie-folk', 'alternative']
};

/**
 * 🔍 FUNCIÓN: EXPANDIR GÉNEROS A SUS FAMILIAS
 * Toma un género general y retorna todos sus subgéneros relacionados
 */
const expandGenreToFamily = (selectedGenre) => {
  const genreLower = selectedGenre.toLowerCase().trim();
  
  // Si el género está en el mapa, devolver toda su familia
  if (GENRE_FAMILY_MAP[genreLower]) {
    return GENRE_FAMILY_MAP[genreLower];
  }
  
  // Si no está en el mapa, buscar si es un subgénero
  for (const [parentGenre, subgenres] of Object.entries(GENRE_FAMILY_MAP)) {
    if (subgenres.includes(genreLower)) {
      // Si encuentra el subgénero, devolver toda la familia del padre
      return subgenres;
    }
  }
  
  // Si no encuentra nada, devolver el género original
  return [genreLower];
};

/**
 * ✅ FUNCIÓN: VERIFICAR SI UN GÉNERO COINCIDE (MODO FLEXIBLE)
 * Compara considerando familias de géneros completas
 */
const matchGenreFlexible = (trackGenre, selectedGenres) => {
  const trackGenreLower = trackGenre.toLowerCase().trim();
  
  // Expandir todos los géneros seleccionados a sus familias
  const expandedSelectedGenres = selectedGenres.flatMap(g => expandGenreToFamily(g));
  
  // Verificar si el género del track está en la familia expandida
  return expandedSelectedGenres.some(selectedGenre => {
    // Coincidencia exacta
    if (trackGenreLower === selectedGenre.toLowerCase()) return true;
    
    // Coincidencia parcial (el track contiene el género)
    if (trackGenreLower.includes(selectedGenre.toLowerCase())) return true;
    
    // Coincidencia inversa (el género contiene el track)
    if (selectedGenre.toLowerCase().includes(trackGenreLower)) return true;
    
    return false;
  });
};

/**
 * 🎨 NOMBRES Y DESCRIPCIONES POR MOOD
 */
const MOOD_PLAYLIST_INFO = {
  feliz: {
    namePrefix: '😊 Vibes Felices',
    description: 'Música alegre y positiva generada especialmente para levantar tu ánimo. ¡Disfruta!'
  },
  triste: {
    namePrefix: '💙 Momentos Reflexivos',
    description: 'Canciones emotivas y melancólicas para acompañarte en tus momentos de introspección.'
  },
  motivado: {
    namePrefix: '🔥 Energía Pura',
    description: 'Música energética y motivadora para darlo todo. ¡A por ello!'
  },
  relajado: {
    namePrefix: '🌙 Relax Total',
    description: 'Música tranquila y relajante para desconectar y encontrar tu paz interior.'
  }
};

/**
 * 🎯 GENERAR PLAYLIST PERSONALIZADA POR MOOD
 * 
 * Crea una playlist en Spotify 100% BASADA EN EL CUESTIONARIO
 * SIN usar keywords. Solo usa:
 * - Géneros seleccionados en el quiz
 * - Artistas seleccionados en el quiz  
 * - Intensidad del mood
 * - Características de audio del mood
 * 
 * @param {string} mood - Estado de ánimo ('feliz', 'triste', 'motivado', 'relajado')
 * @param {string} accessToken - Token de acceso de Spotify
 * @param {string} userId - ID del usuario en Supabase
 * @param {string} moodId - ID del mood en la base de datos
 * @param {object} quizAnswers - OBLIGATORIO: Respuestas del cuestionario
 * @returns {Promise<object>} Playlist creada con información completa
 */
export const generatePlaylistByMood = async (mood, accessToken, userId, moodId, quizAnswers) => {
  try {
    const moodLower = mood.toLowerCase();
    
    // Validar que el mood existe
    if (!MOOD_GENERATION_PARAMS[moodLower]) {
      throw new Error(`Mood "${mood}" no es válido. Usa: feliz, triste, motivado o relajado`);
    }

    // Validar que el quiz es obligatorio
    if (!quizAnswers || typeof quizAnswers !== 'object') {
      throw new Error('El cuestionario es obligatorio para generar la playlist');
    }

    // PASO 1: Obtener perfil y datos del usuario

    const [userProfile, topTracks, topArtists] = await Promise.all([
      spotifyService.getUserProfile(accessToken),
      spotifyService.getUserTopTracks(accessToken, 5, 'short_term').catch(err => {

        return { items: [] };
      }),
      spotifyService.getUserTopArtists(accessToken, 5, 'short_term').catch(err => {

        return { items: [] };
      })
    ]);


    // 📝 Procesar respuestas del cuestionario si se proporcionaron (DESPUÉS de obtener top artists)
    let quizParams = null;
    if (quizAnswers) {

      // Obtener nombres de top artistas para el quiz
      const userTopArtistNames = (topArtists.items || []).map(a => a.name);
      quizParams = processQuizAnswers(quizAnswers, userTopArtistNames);
    }

    // PASO 2: Extraer seeds (semillas) para las recomendaciones
    const seedTracks = topTracks.items.slice(0, 2).map(track => track.id).filter(id => id);
    const seedArtists = topArtists.items.slice(0, 2).map(artist => artist.id).filter(id => id);

    // Validar que las seeds no estén vacías y sean válidas
    const validSeedTracks = seedTracks.filter(id => id && typeof id === 'string' && id.length > 0);
    const validSeedArtists = seedArtists.filter(id => id && typeof id === 'string' && id.length > 0);

    // 🔍 VALIDAR SEEDS: Verificar que los IDs existan en Spotify
    // A veces los IDs pueden ser inválidos o no estar disponibles en todas las regiones
    const verifiedTracks = [];
    const verifiedArtists = [];

    try {
      // Verificar tracks (obtener información de cada track)
      if (validSeedTracks.length > 0) {

        const tracksInfo = await spotifyService.getTracksInfo(validSeedTracks, accessToken);
        
        for (const track of tracksInfo.tracks) {
          if (track && track.id && !track.is_local) {
            verifiedTracks.push(track.id);

          } else {

          }
        }
      }

      // Verificar artistas (obtener información de cada artista)
      if (validSeedArtists.length > 0) {

        const artistsInfo = await spotifyService.getArtistsInfo(validSeedArtists, accessToken);
        
        for (const artist of artistsInfo.artists) {
          if (artist && artist.id) {
            verifiedArtists.push(artist.id);

          } else {

          }
        }
      }
    } catch (error) {

      // Continuar con las seeds originales si falla la verificación
      verifiedTracks.push(...validSeedTracks);
      verifiedArtists.push(...validSeedArtists);
    }


    // Combinar seeds (máximo 5 total)
    const recommendationParams = {
      ...MOOD_GENERATION_PARAMS[moodLower]
    };

    // Agregar seeds solo si son válidas y verificadas
    if (verifiedTracks.length > 0) {
      recommendationParams.seed_tracks = verifiedTracks;
    }
    if (verifiedArtists.length > 0) {
      recommendationParams.seed_artists = verifiedArtists;
    }

    // Si no hay seeds del usuario, usar géneros populares
    if (!recommendationParams.seed_tracks && !recommendationParams.seed_artists) {

      const defaultGenres = {
        feliz: ['pop', 'dance'],
        triste: ['acoustic', 'indie'],
        motivado: ['rock', 'workout'],
        relajado: ['ambient', 'chill']
      };
      recommendationParams.seed_genres = defaultGenres[moodLower];

    }

    // Validar que haya al menos 1 seed
    const totalSeeds = (recommendationParams.seed_tracks?.length || 0) +
                      (recommendationParams.seed_artists?.length || 0) +
                      (recommendationParams.seed_genres?.length || 0);

    if (totalSeeds === 0) {
      throw new Error('No se pudieron obtener seeds para generar recomendaciones. Por favor, escucha más música en Spotify primero.');
    }

    // ========================================
    // ALGORITMO 100% BASADO EN QUIZ (SIN KEYWORDS)
    // ========================================

    // PASO 3A: Solo géneros del mood como fallback
    const searchQueries = [];
    
    // Géneros por mood (SOLO como fallback si no hay géneros del usuario)
    const moodGenresFallback = {
      feliz: ['pop', 'dance', 'latin', 'reggaeton', 'disco', 'funk'],
      triste: ['indie', 'alternative', 'acoustic', 'ballad', 'soul'],
      motivado: ['rock', 'hip-hop', 'electronic', 'metal', 'edm', 'trap'],
      relajado: ['jazz', 'acoustic', 'ambient', 'lofi', 'classical', 'chill']
    };

    // 🎯 PARÁMETROS DEL CUESTIONARIO (OBLIGATORIOS)
    let targetGenres = Array.isArray(quizParams?.genres) ? quizParams.genres : [];
    let targetArtists = Array.isArray(quizParams?.artists) ? quizParams.artists : [];
    let intensityMultiplier = quizParams?.intensity?.multiplier || quizParams?.intensityMultiplier || 1.0;
    let useRandomArtistsFromQuiz = quizParams?.useRandomArtists || false; // Flag de artistas aleatorios

    // 🎸 EXPANDIR GÉNEROS A SUS FAMILIAS COMPLETAS
    if (targetGenres.length > 0) {
      const expandedGenres = targetGenres.flatMap(g => expandGenreToFamily(g));
      const uniqueExpanded = [...new Set(expandedGenres)];

    }

    // Obtener géneros de los top artistas (si no hay géneros del quiz)
    let userGenres = [];
    if (topArtists.items && Array.isArray(topArtists.items) && topArtists.items.length > 0) {
      const allGenres = topArtists.items.flatMap(artist => artist.genres || []);
      userGenres = [...new Set(allGenres)].slice(0, 5);

    }
    
    // 🎯 DECISIÓN: GÉNEROS INDEPENDIENTES DEL MOOD
    // - Si seleccionó géneros específicos → SOLO esos géneros
    // - Si seleccionó "aleatorio" → usar géneros del usuario
    // - EXCEPCIÓN: Si AMBOS (géneros Y artistas) son aleatorios → usar géneros del mood
    // - El MOOD solo afecta los parámetros de audio (valence, energy, etc.)
    let finalGenres;
    const useCustomGenres = targetGenres.length > 0;
    
    if (useCustomGenres) {
      // Usuario seleccionó géneros específicos
      finalGenres = targetGenres;

    } else {
      // Usuario seleccionó "aleatorio" en géneros
      // CASO ESPECIAL: Si también eligió "artistas aleatorios" → usar géneros del mood
      if (useRandomArtistsFromQuiz) {
        finalGenres = moodGenresFallback[moodLower] || [];

      } else {
        // Solo géneros aleatorios → usar géneros del usuario
        finalGenres = userGenres.length > 0 ? userGenres : [];

      }
    }
    
    // 🎯 DECISIÓN: USAR SELECCIÓN DEL USUARIO AL 100%
    // Si seleccionó artistas específicos → SOLO esos artistas
    // Si seleccionó "aleatorio" (favoritos) → usar favoritos del usuario
    // Si seleccionó "random_artists" → NO usar favoritos, buscar por géneros
    let finalArtists = [];
    let topArtistNames = []; // Solo se usa si NO hay artistas personalizados
    const useCustomArtists = targetArtists.length > 0;
    const useRandomArtists = useRandomArtistsFromQuiz || quizAnswers.artists === 'random_artists';
    
    if (useCustomArtists) {
      // Usuario eligió artistas específicos → SOLO usar esos
      finalArtists = targetArtists;

    } else if (useRandomArtists) {
      // Usuario eligió artistas aleatorios (buscar por géneros)
      finalArtists = [];
      topArtistNames = [];

    } else {
      // Usuario eligió "aleatorio" (favoritos) → obtener y usar sus favoritos
      if (topArtists.items && Array.isArray(topArtists.items) && topArtists.items.length > 0) {
        topArtistNames = topArtists.items.slice(0, 10).map(a => a.name);
        finalArtists = topArtistNames.slice(0, 5);

      } else {
        // No hay favoritos → usar artistas por defecto del mood
        const defaultArtistsByMood = {
          feliz: ['Dua Lipa', 'Bruno Mars', 'The Weeknd'],
          triste: ['Adele', 'Billie Eilish', 'Sam Smith'],
          motivado: ['Eminem', 'Imagine Dragons', 'Queen'],
          relajado: ['Norah Jones', 'Ed Sheeran', 'John Mayer']
        };
        finalArtists = defaultArtistsByMood[moodLower] || [];

      }
    }
    
    // ========================================
    // ESTRATEGIA: EXCLUSIVAMENTE LO QUE EL USUARIO ELIGIÓ
    // IMPORTANTE: Cuando hay artistas específicos + géneros específicos:
    //   - Artistas = FILTRO ESTRICTO (solo esos artistas)
    //   - Géneros = SOLO PARA SCORING (no filtran búsqueda)
    // ========================================

    const artistMode = useCustomArtists ? 'SÍ (personalizados)' : useRandomArtists ? 'ALEATORIOS (por géneros)' : 'NO (favoritos)';

    if (useCustomArtists && useCustomGenres) {


    }
    
    // ⭐ CASO 1: Usuario seleccionó ARTISTAS ESPECÍFICOS
    if (useCustomArtists && finalArtists.length > 0) {

      // SOLO buscar por los artistas seleccionados
      // NO aplicar filtro de género en la búsqueda para no restringir demasiado
      // El género se usará para el SCORING después
      finalArtists.forEach(artistName => {
        searchQueries.push({
          artists: [artistName],
          limit: 100
        });
      });
      
      // Si también seleccionó géneros específicos → El género se usa para SCORING, no para búsqueda
      if (useCustomGenres && finalGenres.length > 0) {

      }
    } 
    // ⭐ CASO 2: Usuario seleccionó "ALEATORIO" en artistas
    else if (!useCustomArtists) {

      // Si seleccionó géneros específicos → Buscar artistas POPULARES de esos géneros
      if (useCustomGenres && finalGenres.length > 0) {

        // Para cada género, buscar con múltiples estrategias para obtener los MÁS POPULARES
        finalGenres.forEach(genre => {
          // Búsqueda 1: Solo por género (Spotify devuelve los más populares primero)
          searchQueries.push({
            genres: [genre],
            limit: 50
          });
          
          // Búsqueda 2: Género + palabras clave de popularidad
          searchQueries.push({
            mood: `${genre} top hits`,
            limit: 50
          });
          
          // Búsqueda 3: Género + "popular"
          searchQueries.push({
            mood: `popular ${genre}`,
            limit: 50
          });
        });

      } 
      // Si seleccionó aleatorio en géneros también → usar favoritos
      else {

        if (finalArtists.length > 0) {
          finalArtists.slice(0, 5).forEach(artistName => {
            searchQueries.push({
              artists: [artistName],
              limit: 50
            });
          });
        }
        
        if (finalGenres.length > 0) {
          finalGenres.slice(0, 5).forEach(genre => {
            searchQueries.push({
              genres: [genre],
              limit: 50
            });
          });
        }
        
        // Combinación
        if (finalArtists.length > 0 && finalGenres.length > 0) {
          finalArtists.slice(0, 2).forEach(artist => {
            finalGenres.slice(0, 2).forEach(genre => {
              searchQueries.push({
                artists: [artist],
                genres: [genre],
                limit: 30
              });
            });
          });
        }
      }
    }
    
    if (searchQueries.length === 0) {
      throw new Error('No se pudieron crear búsquedas con la selección del usuario');
    }

    // PASO 3B: Ejecutar búsquedas y recolectar tracks
    let allCandidateTracks = [];
    
    for (const query of searchQueries) {
      try {

        const searchResult = await spotifyService.searchTracksAdvanced(
          { ...query, limit: 50 },
          accessToken
        );

        if (searchResult.tracks && searchResult.tracks.items) {
          allCandidateTracks.push(...searchResult.tracks.items);

        } else {

        }
      } catch (error) {

      }
    }
    
    // Eliminar duplicados
    const uniqueTracks = allCandidateTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    );

    if (uniqueTracks.length === 0) {
      throw new Error('No se encontraron canciones que coincidan con tu estado de ánimo. Intenta de nuevo.');
    }
    
    // PASO 3C: FILTRADO EXCLUSIVO según selección

    let selectedTracks = [...uniqueTracks];
    
    // FILTRO 1: Si seleccionó artistas específicos → SOLO esos artistas
    if (useCustomArtists && finalArtists.length > 0) {

      // Primero verificar qué artistas tienen canciones disponibles
      const artistsWithTracks = {};
      finalArtists.forEach(artist => {
        artistsWithTracks[artist.toLowerCase()] = [];
      });
      
      uniqueTracks.forEach(track => {
        track.artists.forEach(trackArtist => {
          const artistKey = trackArtist.name.toLowerCase();
          if (artistsWithTracks.hasOwnProperty(artistKey)) {
            artistsWithTracks[artistKey].push(track);
          }
        });
      });
      
      // Mostrar disponibilidad

      const artistsWithoutTracks = [];
      Object.entries(artistsWithTracks).forEach(([artist, tracks]) => {
        const uniqueArtistTracks = tracks.filter((track, index, self) =>
          index === self.findIndex(t => t.id === track.id)
        );

        if (uniqueArtistTracks.length === 0) {
          artistsWithoutTracks.push(artist);
        }
      });
      
      // Si algunos artistas no tienen canciones, dar advertencia pero continuar
      if (artistsWithoutTracks.length > 0) {

        // Si NINGÚN artista tiene canciones → error
        if (artistsWithoutTracks.length === finalArtists.length) {
          throw new Error(`No se encontraron canciones de ninguno de los artistas seleccionados: ${finalArtists.join(', ')}`);
        }
      }
      
      // Filtrar solo los tracks de artistas que SÍ tienen canciones
      selectedTracks = selectedTracks.filter(track => {
        const isFromSelectedArtist = track.artists.some(artist => 
          finalArtists.some(selectedArtist => 
            selectedArtist.toLowerCase() === artist.name.toLowerCase()
          )
        );
        return isFromSelectedArtist;
      });

      if (selectedTracks.length === 0) {
        throw new Error(`No se encontraron canciones de: ${finalArtists.join(', ')}`);
      }
    }
    
    // FILTRO 2: Si seleccionó géneros → preferir esos géneros (filtro MUY suave, solo para scoring)
    if (useCustomGenres && finalGenres.length > 0) {

      // Si también hay artistas específicos → NO filtrar por género, solo usarlo para scoring
      if (useCustomArtists) {

      } else if (useRandomArtists) {
        // Si eligió "artistas aleatorios" → La búsqueda ya trajo tracks del género correcto

      } else {
        // Solo si usó artistas favoritos → verificar géneros

        // Obtener información de géneros de los artistas
        const tracksWithGenres = selectedTracks.map(track => {
          const trackGenres = track.artists.flatMap(artist => {
            const artistData = topArtists.items.find(a => a.id === artist.id);
            return artistData?.genres || [];
          });
          return { track, genres: trackGenres };
        });
        
        // Intentar filtrar por géneros usando matching flexible
        const filteredByGenre = tracksWithGenres.filter(item => {
          const hasSelectedGenre = item.genres.some(genre => 
            matchGenreFlexible(genre, finalGenres)
          );
          return hasSelectedGenre;
        });
        
        // Si encontró canciones con ese género, usarlas
        if (filteredByGenre.length > 0) {
          selectedTracks = filteredByGenre.map(item => item.track);

        } else {
          // Si no encontró, mantener todas pero avisar

        }
      }
    }
    
    // Ordenar por popularidad y filtrar tracks de ALTA CALIDAD

    // Si eligió "artistas aleatorios" + "géneros específicos" → Solo los MÁS POPULARES
    if (useRandomArtists && useCustomGenres) {
      // Filtro estricto: solo tracks con popularidad >= 50
      const highPopularityTracks = selectedTracks.filter(track => (track.popularity || 0) >= 50);
      
      if (highPopularityTracks.length >= 30) {
        selectedTracks = highPopularityTracks
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 60);

      } else {
        // Fallback: si no hay suficientes, usar >= 40
        selectedTracks = selectedTracks
          .filter(track => (track.popularity || 0) >= 40)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 60);

      }
    } else {
      // Ordenamiento normal
      selectedTracks = selectedTracks
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 50);
    }

    if (selectedTracks.length === 0) {
      throw new Error('No se encontraron canciones que cumplan con tu selección');
    }
    
    // SCORING 100% BASADO EN QUIZ (SIN KEYWORDS)

    // NO filtramos por keywords, usamos todos los tracks
    const filteredByMood = selectedTracks;

    // Calcular score solo con quiz

    // Pesos de scoring (SIN keywords)
    let scoringWeights = {
      popularity: 0.1,       // Peso de popularidad
      quizArtist: 50,        // Artista del quiz (MÁXIMA PRIORIDAD)
      favoriteArtist: 25,    // Artista favorito
      quizGenre: 30,         // Género del quiz (ALTA PRIORIDAD)
      moodGenre: 15          // Género del mood (fallback)
    };
    
    if (intensityMultiplier !== 1.0) {

      scoringWeights.quizArtist *= intensityMultiplier;
      scoringWeights.quizGenre *= intensityMultiplier;
      scoringWeights.moodGenre *= intensityMultiplier;

    }
    
    const scoredForMood = filteredByMood.map(track => {
      let score = 0;
      const trackName = track.name.toLowerCase();
      const albumName = (track.album?.name || '').toLowerCase();
      const artistNames = track.artists.map(a => a.name.toLowerCase()).join(' ');
      const allText = `${trackName} ${albumName} ${artistNames}`;
      const scoreBreakdown = [];
      
      // FACTOR 1: Popularidad base
      const popScore = (track.popularity || 50) * scoringWeights.popularity;
      score += popScore;
      scoreBreakdown.push(`Pop:${popScore.toFixed(1)}`);
      
      // FACTOR 2A: 🎯 ARTISTA SELECCIONADO (MÁXIMA PRIORIDAD)
      let quizArtistBonus = 0;
      const isFromSelectedArtist = track.artists.some(artist => 
        finalArtists.some(selectedArtist => 
          selectedArtist.toLowerCase() === artist.name.toLowerCase()
        )
      );
      
      if (isFromSelectedArtist) {
        // Si el usuario seleccionó artistas específicos → PRIORIDAD ABSOLUTA
        if (useCustomArtists) {
          // MODO EXCLUSIVO: Dar puntos iguales a TODOS los artistas seleccionados
          // SIN favorecer al más escuchado
          quizArtistBonus = scoringWeights.quizArtist * 3; // Triple puntos para TODOS por igual
          scoreBreakdown.push(`✨Selected:+${quizArtistBonus}`);
        } else {
          // Si es "aleatorio" (favoritos) → puntos normales
          quizArtistBonus = scoringWeights.favoriteArtist;
          scoreBreakdown.push(`⭐FavArtist:+${quizArtistBonus}`);
        }
        score += quizArtistBonus;
      } else if (useCustomArtists) {
        // Si está en modo estricto y NO es del artista → ERROR (no debería pasar)

      }
      
      // FACTOR 3: ELIMINADO - Ya NO usamos keywords
      
      // FACTOR 4A: 🎸 GÉNERO SELECCIONADO (PRIORIDAD ALTA) - MODO FLEXIBLE
      let quizGenreBonus = 0;
      const trackGenres = track.artists.flatMap(artist => {
        const artistData = topArtists.items.find(a => a.id === artist.id);
        return artistData?.genres || [];
      });
      
      // Usar matching flexible que reconoce familias de géneros completas
      const selectedGenreMatches = trackGenres.filter(genre => 
        matchGenreFlexible(genre, finalGenres)
      );
      
      if (selectedGenreMatches.length > 0) {
        // Si el usuario seleccionó géneros específicos → PRIORIDAD ALTA
        if (useCustomGenres) {
          quizGenreBonus = selectedGenreMatches.length * scoringWeights.quizGenre * 1.5; // 50% más puntos
          scoreBreakdown.push(`✨SelectedGenre:+${quizGenreBonus}(x${selectedGenreMatches.length})`);
        } else {
          // Si es "aleatorio" (géneros del usuario) → puntos normales
          quizGenreBonus = selectedGenreMatches.length * scoringWeights.quizGenre;
          scoreBreakdown.push(`QuizGenre:+${quizGenreBonus}(x${selectedGenreMatches.length})`);
        }
        score += quizGenreBonus;
      }
      
      // FACTOR 4B: Género compatible con el mood (menor peso que quiz)
      // Reutilizamos trackGenres de arriba
      const moodGenreMatches = trackGenres.filter(genre => 
        moodGenresFallback[moodLower].some(moodGenre => 
          genre.toLowerCase().includes(moodGenre) || moodGenre.includes(genre.toLowerCase())
        )
      );
      
      if (moodGenreMatches.length > 0 && quizGenreBonus === 0) {
        const genreScore = moodGenreMatches.length * scoringWeights.moodGenre;
        score += genreScore;
        scoreBreakdown.push(`MoodGenre:+${genreScore}(x${moodGenreMatches.length})`);
      }
      
      // Log detallado del scoring

      return { 
        track, 
        score,
        genreMatches: moodGenreMatches.length,
        quizArtistMatch: quizArtistBonus > 0,
        quizGenreMatch: quizGenreBonus > 0
      };
    });
    
    // FILTRO 3: Descartar tracks con score bajo
    const minScore = 10; // Sin keywords, score más bajo
    const highScoringTracks = scoredForMood.filter(item => item.score >= minScore);

    if (highScoringTracks.length < 20) {

      highScoringTracks.length = 0;
      highScoringTracks.push(...scoredForMood
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
      );
    }
    
    // ORDENAR por score y tomar los mejores
    const sortedByMoodScore = highScoringTracks.sort((a, b) => b.score - a.score);
    
    // ========================================
    // 🎯 SISTEMA DE CUOTAS: GARANTIZAR TODOS LOS ARTISTAS
    // Si el usuario seleccionó artistas específicos, CADA UNO debe tener canciones
    // ========================================
    let finalSelectedTracks = [];
    const targetPlaylistSize = 30;
    
    if (useCustomArtists && finalArtists.length > 0) {


      // Calcular cuota mínima por artista (al menos 3 canciones cada uno)
      const minTracksPerArtist = Math.max(3, Math.floor(targetPlaylistSize / finalArtists.length));

      // Agrupar tracks por artista (sin duplicados)
      const tracksByArtist = {};
      const seenTrackIds = new Set(); // 🔒 Evitar duplicados globales
      
      finalArtists.forEach(artist => {
        tracksByArtist[artist.toLowerCase()] = [];
      });
      
      sortedByMoodScore.forEach(item => {
        // 🔒 ANTI-DUPLICADOS: Verificar si ya fue agregado a cualquier artista
        if (seenTrackIds.has(item.track.id)) {
          return; // Saltar si ya existe
        }
        
        const trackArtistNames = item.track.artists.map(a => a.name.toLowerCase());
        finalArtists.forEach(selectedArtist => {
          if (trackArtistNames.includes(selectedArtist.toLowerCase())) {
            tracksByArtist[selectedArtist.toLowerCase()].push(item);
            seenTrackIds.add(item.track.id); // 🔒 Marcar como usado
          }
        });
      });
      
      // Mostrar disponibilidad por artista

      const artistsWithoutTracks = [];
      Object.entries(tracksByArtist).forEach(([artist, tracks]) => {

        if (tracks.length === 0) {
          artistsWithoutTracks.push(artist);
        }
      });
      
      // Si algunos artistas no tienen canciones, excluirlos del sistema de cuotas
      let artistsForQuota = finalArtists;
      if (artistsWithoutTracks.length > 0) {

        // Si TODOS los artistas no tienen canciones → error
        if (artistsWithoutTracks.length === finalArtists.length) {
          throw new Error(`No se encontraron canciones de ninguno de los artistas seleccionados: ${finalArtists.join(', ')}. Por favor, verifica los nombres o intenta con otros artistas.`);
        }
        
        // Excluir artistas sin canciones
        artistsForQuota = finalArtists.filter(a => 
          !artistsWithoutTracks.includes(a.toLowerCase())
        );

      }
      
      // Recalcular cuota con los artistas disponibles
      const adjustedMinTracksPerArtist = Math.max(3, Math.floor(targetPlaylistSize / artistsForQuota.length));

      // FASE 1: Asegurar cuota mínima para CADA artista (solo los que tienen tracks)

      const selectedByArtist = {};
      
      artistsForQuota.forEach(artist => {
        const artistKey = artist.toLowerCase();
        const availableTracks = tracksByArtist[artistKey] || [];
        
        if (availableTracks.length > 0) {
          // Tomar las mejores canciones de este artista (por score)
          const quota = Math.min(adjustedMinTracksPerArtist, availableTracks.length);
          selectedByArtist[artistKey] = availableTracks.slice(0, quota);

        }
      });
      
      // Combinar todas las canciones seleccionadas hasta ahora
      let currentSelection = [];
      Object.values(selectedByArtist).forEach(tracks => {
        currentSelection.push(...tracks);
      });

      // FASE 2: Completar hasta 30 con las mejores canciones restantes
      if (currentSelection.length < targetPlaylistSize) {

        // Obtener IDs de tracks ya seleccionadas
        const selectedIds = new Set(currentSelection.map(item => item.track.id));
        
        // Filtrar tracks no seleccionadas
        const remainingTracks = sortedByMoodScore.filter(item => 
          !selectedIds.has(item.track.id)
        );
        
        // Completar hasta 30
        const needed = targetPlaylistSize - currentSelection.length;
        const additionalTracks = remainingTracks.slice(0, needed);

        if (additionalTracks.length > 0) {
          // Mostrar distribución de artistas en las canciones adicionales
          const additionalByArtist = {};
          additionalTracks.forEach(item => {
            const artistName = item.track.artists[0].name;
            additionalByArtist[artistName] = (additionalByArtist[artistName] || 0) + 1;
          });

          Object.entries(additionalByArtist).forEach(([artist, count]) => {

          });
          
          // 🔒 ANTI-DUPLICADOS: Verificar una vez más antes de agregar
          additionalTracks.forEach(item => {
            if (!selectedIds.has(item.track.id)) {
              currentSelection.push(item);
              selectedIds.add(item.track.id);
            } else {

            }
          });
        }
      } else {
        // Si ya llegó al target, no agregar más (prevenir duplicados por push)

      }
      
      // 🔒 VALIDACIÓN ANTI-DUPLICADOS: Asegurar que currentSelection no tenga duplicados
      const finalSelectionIds = new Set();
      const dedupedSelection = [];
      
      currentSelection.forEach(item => {
        if (!finalSelectionIds.has(item.track.id)) {
          finalSelectionIds.add(item.track.id);
          dedupedSelection.push(item);
        } else {

        }
      });
      
      if (dedupedSelection.length < currentSelection.length) {

        currentSelection = dedupedSelection;
      }
      
      // FASE 3: Ajustar si hay más de 30
      if (currentSelection.length > targetPlaylistSize) {

        currentSelection = currentSelection
          .sort((a, b) => b.score - a.score)
          .slice(0, targetPlaylistSize);
      }
      
      // Extraer solo los tracks (sin metadata de scoring)
      finalSelectedTracks = currentSelection.map(item => item.track);
      
      // MEZCLAR orden para variedad (manteniendo distribución equitativa)
      finalSelectedTracks.sort(() => Math.random() - 0.5);
      
      // Estadísticas finales por artista

      const finalDistribution = {};
      finalSelectedTracks.forEach(track => {
        const artistName = track.artists[0].name;
        finalDistribution[artistName] = (finalDistribution[artistName] || 0) + 1;
      });
      
      Object.entries(finalDistribution).forEach(([artist, count]) => {
        const percentage = (count / finalSelectedTracks.length * 100).toFixed(1);

      });
      
      // Validar que los artistas QUE TENÍAN CANCIONES estén presentes
      const artistsInPlaylist = Object.keys(finalDistribution);
      const missingArtists = artistsForQuota.filter(artist => 
        !artistsInPlaylist.some(a => a.toLowerCase() === artist.toLowerCase())
      );
      
      if (missingArtists.length > 0) {

        throw new Error(`No se pudieron incluir canciones de: ${missingArtists.join(', ')}`);
      }
      
      // Mensaje de éxito
      if (artistsWithoutTracks.length > 0) {

      } else {

      }
      
    } else {
      // Si NO hay artistas personalizados, usar selección normal por score

      const finalCount = Math.min(targetPlaylistSize, sortedByMoodScore.length);

      finalSelectedTracks = sortedByMoodScore
        .slice(0, finalCount)
        .map(item => item.track);
      
      // Mezclar orden para variedad
      finalSelectedTracks.sort(() => Math.random() - 0.5);
    }
    
    if (finalSelectedTracks.length < 30) {

    }
    
    // LOGS DETALLADOS

    // Calcular estadísticas basadas en finalSelectedTracks
    const finalTrackIds = new Set(finalSelectedTracks.map(t => t.id));
    const finalScoredTracks = sortedByMoodScore.filter(item => finalTrackIds.has(item.track.id));
    
    if (finalScoredTracks.length > 0) {
      const avgScore = finalScoredTracks.reduce((sum, t) => sum + t.score, 0) / finalScoredTracks.length;

      const tracksWithGenres = finalScoredTracks.filter(t => t.genreMatches > 0).length;

      // Estadísticas de selección del usuario
      const tracksFromSelectedArtists = finalScoredTracks.filter(t => t.quizArtistMatch).length;
      const tracksFromSelectedGenres = finalScoredTracks.filter(t => t.quizGenreMatch).length;

      if (useCustomArtists && finalArtists.length > 0) {

      } else if (finalArtists.length > 0) {

      }
      
      if (useCustomGenres && finalGenres.length > 0) {

      } else if (finalGenres.length > 0) {

      }

      finalScoredTracks
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((item, i) => {
          const indicators = [];
          if (item.genreMatches > 0) indicators.push('🎸');
          if (item.quizArtistMatch) indicators.push('✨');
          if (item.quizGenreMatch) indicators.push('🎵');
          // Solo mostrar indicador de favorito si NO hay artistas personalizados
          if (!useCustomArtists && Array.isArray(topArtistNames) && topArtistNames.length > 0 && topArtistNames.slice(0, 10).some(fav => 
            item.track.artists.some(a => a.name.toLowerCase() === fav.toLowerCase())
          )) indicators.push('⭐');

        });
    }

    // Construir objeto de recomendaciones compatible
    const recommendations = {
      tracks: finalSelectedTracks
    };

    // PASO 4: Crear playlist en Spotify
    const playlistInfo = MOOD_PLAYLIST_INFO[moodLower];
    
    // ✅ Usar el nombre personalizado del usuario o uno por defecto
    const playlistName = quizAnswers.playlistName || `${playlistInfo.namePrefix} - ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`;
    
    // ✅ Usar la descripción personalizada del usuario o una por defecto
    const playlistDescription = quizAnswers.description || playlistInfo.description;
    
    const playlistData = {
      name: playlistName,
      description: playlistDescription,
      public: false // Privada por defecto
    };

    const createdPlaylist = await spotifyService.createPlaylist(
      userProfile.id,
      playlistData,
      accessToken
    );

    // PASO 5: Agregar tracks a la playlist
    // 🔒 VALIDACIÓN FINAL: Eliminar cualquier duplicado que pudiera existir
    const uniqueTrackIds = new Set();
    const uniqueFinalTracks = [];
    
    recommendations.tracks.forEach(track => {
      if (!uniqueTrackIds.has(track.id)) {
        uniqueTrackIds.add(track.id);
        uniqueFinalTracks.push(track);
      } else {

      }
    });
    
    if (uniqueFinalTracks.length < recommendations.tracks.length) {

      recommendations.tracks = uniqueFinalTracks;
    }
    
    const trackUris = recommendations.tracks.map(track => track.uri);
    await spotifyService.addTracksToPlaylist(
      createdPlaylist.id,
      trackUris,
      accessToken
    );

    // PASO 6: Preparar información completa (NO guardar automáticamente)
    const playlistImageUrl = createdPlaylist.images?.[0]?.url || null;
    
    const generationParams = {
      mood: moodLower,
      mood_id: moodId,
      user_id: userId,
      seed_tracks: seedTracks,
      seed_artists: seedArtists,
      audio_features: {
        valence: recommendationParams.target_valence,
        energy: recommendationParams.target_energy,
        acousticness: recommendationParams.target_acousticness,
        danceability: recommendationParams.target_danceability,
        tempo: recommendationParams.target_tempo,
        instrumentalness: recommendationParams.target_instrumentalness
      },
      track_count: trackUris.length,
      generated_at: new Date().toISOString()
    };

    // PASO 7: Retornar información completa
    return {
      success: true,
      playlist: {
        id: createdPlaylist.id,
        name: createdPlaylist.name,
        description: createdPlaylist.description,
        url: createdPlaylist.external_urls.spotify,
        imageUrl: playlistImageUrl,
        trackCount: trackUris.length,
        mood: moodLower,
        userId: userId,
        moodId: moodId,
        generationParams: generationParams // ✨ Incluir para guardar después
      },
      tracks: recommendations.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url
      })),
      generationInfo: {
        basedOnTopTracks: topTracks.items.length,
        basedOnTopArtists: topArtists.items.length,
        audioFeatures: recommendationParams
      }
    };

  } catch (error) {

    throw new Error(`Error generando playlist: ${error.message}`);
  }
};

/**
 * 📊 OBTENER PLAYLISTS GENERADAS DEL USUARIO
 * 
 * @param {string} userId - ID del usuario en Supabase
 * @returns {Promise<Array>} Lista de playlists generadas
 */
export const getUserGeneratedPlaylists = async (userId) => {
  try {
    const result = await executeCustomQuery(async (supabase) => {
      return await supabase
        .from('spotify_playlists')
        .select(`
          id,
          spotify_playlist_id,
          name,
          description,
          image_url,
          spotify_url,
          is_generated,
          is_favorite,
          mood_id,
          generation_params,
          created_at,
          updated_at,
          moods (
            name,
            emoji,
            color_hex
          )
        `)
        .eq('user_id', userId)
        .eq('is_generated', true)
        .order('created_at', { ascending: false });
    });

    if (!result.success) throw new Error(result.error);

    return result.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo playlists generadas:', error);
    throw error;
  }
};

/**
 * 🗑️ ELIMINAR PLAYLIST GENERADA
 * 
 * @param {string} playlistId - ID de la playlist en Supabase
 * @param {string} userId - ID del usuario (para validación)
 */
export const deleteGeneratedPlaylist = async (playlistId, userId) => {
  try {
    // Eliminar directamente de spotify_playlists
    const result = await executeCustomQuery(async (supabase) => {
      return await supabase
        .from('spotify_playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', userId); // ✅ Validación de usuario
    });

    if (!result.success) throw new Error(result.error);

    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando playlist generada:', error);
    throw error;
  }
};
