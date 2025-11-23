import { spotifyService } from './spotifyService';
import { supabase } from '../supabase/supabase.config';
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

    console.log(`🎵 Iniciando generación 100% BASADA EN QUIZ para mood: ${mood}`);

    // PASO 1: Obtener perfil y datos del usuario
    console.log('📊 Obteniendo datos del usuario de Spotify...');
    
    const [userProfile, topTracks, topArtists] = await Promise.all([
      spotifyService.getUserProfile(accessToken),
      spotifyService.getUserTopTracks(accessToken, 5, 'short_term').catch(err => {
        console.warn('⚠️ No se pudieron obtener top tracks:', err.message);
        return { items: [] };
      }),
      spotifyService.getUserTopArtists(accessToken, 5, 'short_term').catch(err => {
        console.warn('⚠️ No se pudieron obtener top artists:', err.message);
        return { items: [] };
      })
    ]);

    console.log(`👤 Usuario: ${userProfile.display_name}`);
    console.log(`🎵 Top tracks obtenidos: ${topTracks.items.length}`);
    console.log(`🎤 Top artistas obtenidos: ${topArtists.items.length}`);

    // 📝 Procesar respuestas del cuestionario si se proporcionaron (DESPUÉS de obtener top artists)
    let quizParams = null;
    if (quizAnswers) {
      console.log('📝 Procesando respuestas del cuestionario...');
      // Obtener nombres de top artistas para el quiz
      const userTopArtistNames = (topArtists.items || []).map(a => a.name);
      quizParams = processQuizAnswers(quizAnswers, userTopArtistNames);
      console.log('🎯 Parámetros del quiz:', quizParams);
    }

    // PASO 2: Extraer seeds (semillas) para las recomendaciones
    const seedTracks = topTracks.items.slice(0, 2).map(track => track.id).filter(id => id);
    const seedArtists = topArtists.items.slice(0, 2).map(artist => artist.id).filter(id => id);

    console.log('🌱 Seeds extraídas:');
    console.log('  - Tracks:', seedTracks);
    console.log('  - Artists:', seedArtists);

    // Validar que las seeds no estén vacías y sean válidas
    const validSeedTracks = seedTracks.filter(id => id && typeof id === 'string' && id.length > 0);
    const validSeedArtists = seedArtists.filter(id => id && typeof id === 'string' && id.length > 0);

    console.log('✅ Seeds válidas:');
    console.log('  - Valid Tracks:', validSeedTracks.length, validSeedTracks);
    console.log('  - Valid Artists:', validSeedArtists.length, validSeedArtists);

    // 🔍 VALIDAR SEEDS: Verificar que los IDs existan en Spotify
    // A veces los IDs pueden ser inválidos o no estar disponibles en todas las regiones
    const verifiedTracks = [];
    const verifiedArtists = [];

    try {
      // Verificar tracks (obtener información de cada track)
      if (validSeedTracks.length > 0) {
        console.log('🔍 Verificando tracks...');
        const tracksInfo = await spotifyService.getTracksInfo(validSeedTracks, accessToken);
        
        for (const track of tracksInfo.tracks) {
          if (track && track.id && !track.is_local) {
            verifiedTracks.push(track.id);
            console.log(`  ✅ Track válido: ${track.name} - ${track.artists[0].name}`);
          } else {
            console.warn(`  ⚠️ Track inválido o local: ${track?.id || 'unknown'}`);
          }
        }
      }

      // Verificar artistas (obtener información de cada artista)
      if (validSeedArtists.length > 0) {
        console.log('🔍 Verificando artistas...');
        const artistsInfo = await spotifyService.getArtistsInfo(validSeedArtists, accessToken);
        
        for (const artist of artistsInfo.artists) {
          if (artist && artist.id) {
            verifiedArtists.push(artist.id);
            console.log(`  ✅ Artista válido: ${artist.name}`);
          } else {
            console.warn(`  ⚠️ Artista inválido: ${artist?.id || 'unknown'}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error verificando seeds:', error.message);
      // Continuar con las seeds originales si falla la verificación
      verifiedTracks.push(...validSeedTracks);
      verifiedArtists.push(...validSeedArtists);
    }

    console.log('🎯 Seeds verificadas finales:');
    console.log('  - Tracks:', verifiedTracks);
    console.log('  - Artists:', verifiedArtists);

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
      console.warn('⚠️ Usuario sin historial suficiente, usando géneros por defecto');
      const defaultGenres = {
        feliz: ['pop', 'dance'],
        triste: ['acoustic', 'indie'],
        motivado: ['rock', 'workout'],
        relajado: ['ambient', 'chill']
      };
      recommendationParams.seed_genres = defaultGenres[moodLower];
      console.log('🎭 Géneros por defecto:', recommendationParams.seed_genres);
    }

    // Validar que haya al menos 1 seed
    const totalSeeds = (recommendationParams.seed_tracks?.length || 0) +
                      (recommendationParams.seed_artists?.length || 0) +
                      (recommendationParams.seed_genres?.length || 0);

    if (totalSeeds === 0) {
      throw new Error('No se pudieron obtener seeds para generar recomendaciones. Por favor, escucha más música en Spotify primero.');
    }

    console.log(`🎯 Total de seeds: ${totalSeeds}`);
    console.log('🎯 Parámetros de recomendación:', JSON.stringify(recommendationParams, null, 2));

    // ========================================
    // ALGORITMO 100% BASADO EN QUIZ (SIN KEYWORDS)
    // ========================================
    
    console.log('🔄 Usando algoritmo 100% basado en CUESTIONARIO (SIN keywords)');
    
    // PASO 3A: Solo géneros del mood como fallback
    const searchQueries = [];
    
    // Géneros por mood (SOLO como fallback si no hay géneros del usuario)
    const moodGenresFallback = {
      feliz: ['pop', 'dance', 'latin', 'reggaeton', 'disco', 'funk'],
      triste: ['indie', 'alternative', 'acoustic', 'ballad', 'soul'],
      motivado: ['rock', 'hip-hop', 'electronic', 'metal', 'edm', 'trap'],
      relajado: ['jazz', 'acoustic', 'ambient', 'lofi', 'classical', 'chill']
    };
    
    console.log(`🎯 Géneros fallback para mood "${moodLower}":`, moodGenresFallback[moodLower]);
    
    // 🎯 PARÁMETROS DEL CUESTIONARIO (OBLIGATORIOS)
    let targetGenres = Array.isArray(quizParams?.genres) ? quizParams.genres : [];
    let targetArtists = Array.isArray(quizParams?.artists) ? quizParams.artists : [];
    let intensityMultiplier = quizParams?.intensity?.multiplier || quizParams?.intensityMultiplier || 1.0;
    
    console.log('✨ Configuración del QUIZ:');
    console.log('  📊 Géneros:', targetGenres.length > 0 ? targetGenres : 'Del usuario');
    console.log('  🎤 Artistas:', targetArtists.length > 0 ? targetArtists : 'Favoritos');
    console.log('  🔥 Intensidad:', intensityMultiplier + 'x');
    
    // Obtener géneros de los top artistas (si no hay géneros del quiz)
    let userGenres = [];
    if (topArtists.items && Array.isArray(topArtists.items) && topArtists.items.length > 0) {
      const allGenres = topArtists.items.flatMap(artist => artist.genres || []);
      userGenres = [...new Set(allGenres)].slice(0, 5);
      console.log('🎭 Géneros del usuario:', userGenres);
    }
    
    // 🎯 DECISIÓN: USAR SELECCIÓN DEL USUARIO AL 100%
    // Si seleccionó géneros específicos → SOLO esos géneros
    // Si seleccionó "aleatorio" → usar géneros del usuario o fallback
    const finalGenres = targetGenres.length > 0 ? targetGenres : userGenres;
    const useCustomGenres = targetGenres.length > 0;
    
    // Obtener top artistas (solo si NO seleccionó artistas específicos)
    let topArtistNames = [];
    if (topArtists.items && Array.isArray(topArtists.items) && topArtists.items.length > 0) {
      topArtistNames = topArtists.items.slice(0, 10).map(a => a.name);
      console.log('🎤 Top artistas del usuario:', topArtistNames.slice(0, 5), '...');
    }
    
    // 🎯 DECISIÓN: USAR SELECCIÓN DEL USUARIO AL 100%
    // Si seleccionó artistas específicos → SOLO esos artistas
    // Si seleccionó "aleatorio" → usar favoritos del usuario
    let finalArtists = [];
    const useCustomArtists = targetArtists.length > 0;
    
    if (useCustomArtists) {
      // Usuario eligió artistas específicos → SOLO usar esos
      finalArtists = targetArtists;
      console.log('✨ Usando SOLO artistas seleccionados por el usuario (100%):', finalArtists);
    } else if (topArtistNames.length > 0) {
      // Usuario eligió "aleatorio" → usar sus favoritos
      finalArtists = topArtistNames.slice(0, 5);
      console.log('🎲 Usuario seleccionó aleatorio, usando favoritos:', finalArtists.slice(0, 3), '...');
    } else {
      // No hay favoritos → usar artistas por defecto del mood
      const defaultArtistsByMood = {
        feliz: ['Dua Lipa', 'Bruno Mars', 'The Weeknd'],
        triste: ['Adele', 'Billie Eilish', 'Sam Smith'],
        motivado: ['Eminem', 'Imagine Dragons', 'Queen'],
        relajado: ['Norah Jones', 'Ed Sheeran', 'John Mayer']
      };
      finalArtists = defaultArtistsByMood[moodLower] || [];
      console.warn('⚠️ Sin artistas, usando fallback del mood:', finalArtists);
    }
    
    // ========================================
    // ESTRATEGIA: EXCLUSIVAMENTE LO QUE EL USUARIO ELIGIÓ
    // SIN FALLBACKS, SIN MEZCLAS, SIN EXCEPCIONES
    // ========================================
    
    console.log('\n🎯 MODO EXCLUSIVO: SOLO LO QUE EL USUARIO ELIGIÓ');
    console.log(`   Artistas personalizados: ${useCustomArtists ? 'SÍ' : 'NO (favoritos)'}`);
    console.log(`   Géneros personalizados: ${useCustomGenres ? 'SÍ' : 'NO (del usuario)'}`);
    
    // ⭐ CASO 1: Usuario seleccionó ARTISTAS ESPECÍFICOS
    if (useCustomArtists && finalArtists.length > 0) {
      console.log('🎯 EXCLUSIVAMENTE estos artistas:', finalArtists);
      console.log('   ⚠️ Sin mezclas, sin fallbacks, sin otros artistas');
      
      // SOLO buscar por los artistas seleccionados
      finalArtists.forEach(artistName => {
        searchQueries.push({
          artists: [artistName],
          limit: 100
        });
      });
      
      // Si también seleccionó géneros específicos → combinar
      if (useCustomGenres && finalGenres.length > 0) {
        console.log('   Y EXCLUSIVAMENTE estos géneros:', finalGenres);
        finalArtists.forEach(artist => {
          finalGenres.forEach(genre => {
            searchQueries.push({
              artists: [artist],
              genres: [genre],
              limit: 50
            });
          });
        });
      }
    } 
    // ⭐ CASO 2: Usuario seleccionó "ALEATORIO" en artistas
    else if (!useCustomArtists) {
      console.log('🎲 Modo aleatorio en artistas');
      
      // Si seleccionó géneros específicos → SOLO esos géneros
      if (useCustomGenres && finalGenres.length > 0) {
        console.log('🎯 EXCLUSIVAMENTE estos géneros:', finalGenres);
        finalGenres.forEach(genre => {
          searchQueries.push({
            genres: [genre],
            limit: 100
          });
        });
      } 
      // Si seleccionó aleatorio en géneros también → usar favoritos
      else {
        console.log('🎲 Usando artistas favoritos');
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
    
    console.log(`🔍 Total de búsquedas a ejecutar: ${searchQueries.length}`);
    
    // PASO 3B: Ejecutar búsquedas y recolectar tracks
    let allCandidateTracks = [];
    
    for (const query of searchQueries) {
      try {
        console.log(`  🔍 Buscando con query:`, query);
        const searchResult = await spotifyService.searchTracksAdvanced(
          { ...query, limit: 50 },
          accessToken
        );
        
        console.log(`  📦 Resultado de búsqueda:`, searchResult);
        
        if (searchResult.tracks && searchResult.tracks.items) {
          allCandidateTracks.push(...searchResult.tracks.items);
          console.log(`  ✅ Encontrados ${searchResult.tracks.items.length} tracks para "${query.mood}"`);
        } else {
          console.warn(`  ⚠️ Sin tracks en resultado para "${query.mood}"`);
        }
      } catch (error) {
        console.error(`  ❌ Error en búsqueda "${query.mood}":`, error.message);
      }
    }
    
    // Eliminar duplicados
    const uniqueTracks = allCandidateTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    );
    
    console.log(`📊 Total de tracks candidatos únicos: ${uniqueTracks.length}`);
    
    if (uniqueTracks.length === 0) {
      throw new Error('No se encontraron canciones que coincidan con tu estado de ánimo. Intenta de nuevo.');
    }
    
    // PASO 3C: FILTRADO EXCLUSIVO según selección
    console.log('📊 Aplicando filtros EXCLUSIVOS...');
    
    let selectedTracks = [...uniqueTracks];
    
    // FILTRO 1: Si seleccionó artistas específicos → SOLO esos artistas
    if (useCustomArtists && finalArtists.length > 0) {
      console.log('🎯 FILTRO: SOLO artistas seleccionados');
      selectedTracks = selectedTracks.filter(track => {
        const isFromSelectedArtist = track.artists.some(artist => 
          finalArtists.some(selectedArtist => 
            selectedArtist.toLowerCase() === artist.name.toLowerCase()
          )
        );
        return isFromSelectedArtist;
      });
      
      console.log(`   Después del filtro: ${selectedTracks.length} tracks`);
      console.log(`   EXCLUSIVAMENTE de: ${finalArtists.join(', ')}`);
      
      if (selectedTracks.length === 0) {
        throw new Error(`No se encontraron canciones de: ${finalArtists.join(', ')}`);
      }
    }
    
    // FILTRO 2: Si seleccionó géneros → preferir esos géneros (filtro suave)
    if (useCustomGenres && finalGenres.length > 0) {
      console.log('🎯 PRIORIZACIÓN: Géneros seleccionados');
      console.log(`   Buscando géneros: ${finalGenres.join(', ')}`);
      
      // Obtener información de géneros de los artistas
      const tracksWithGenres = selectedTracks.map(track => {
        const trackGenres = track.artists.flatMap(artist => {
          const artistData = topArtists.items.find(a => a.id === artist.id);
          return artistData?.genres || [];
        });
        return { track, genres: trackGenres };
      });
      
      // Intentar filtrar por géneros
      const filteredByGenre = tracksWithGenres.filter(item => {
        const hasSelectedGenre = item.genres.some(genre => 
          finalGenres.some(selectedGenre => 
            genre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
            selectedGenre.toLowerCase().includes(genre.toLowerCase())
          )
        );
        return hasSelectedGenre;
      });
      
      // Si encontró canciones con ese género, usarlas
      if (filteredByGenre.length > 0) {
        selectedTracks = filteredByGenre.map(item => item.track);
        console.log(`   ✅ ${selectedTracks.length} tracks del género seleccionado`);
      } else {
        // Si no encontró, mantener todas pero avisar
        console.log(`   ⚠️ No se encontraron tracks con información de género`);
        console.log(`   📌 Usando todas las canciones encontradas (${selectedTracks.length})`);
      }
    }
    
    // Ordenar por popularidad
    selectedTracks = selectedTracks
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 50); // Máximo 50 para el scoring
    
    console.log(`✅ Tracks después de filtros EXCLUSIVOS: ${selectedTracks.length}`);
    
    if (selectedTracks.length === 0) {
      throw new Error('No se encontraron canciones que cumplan con tu selección');
    }
    
    // SCORING 100% BASADO EN QUIZ (SIN KEYWORDS)
    console.log('🎯 Aplicando scoring basado SOLO en QUIZ...');
    
    // NO filtramos por keywords, usamos todos los tracks
    const filteredByMood = selectedTracks;
    console.log(`  ✅ Tracks para scoring: ${filteredByMood.length}`);
    
    // Calcular score solo con quiz
    console.log('  📊 Calculando score (SIN keywords)...');
    
    // Pesos de scoring (SIN keywords)
    let scoringWeights = {
      popularity: 0.1,       // Peso de popularidad
      quizArtist: 50,        // Artista del quiz (MÁXIMA PRIORIDAD)
      favoriteArtist: 25,    // Artista favorito
      quizGenre: 30,         // Género del quiz (ALTA PRIORIDAD)
      moodGenre: 15          // Género del mood (fallback)
    };
    
    if (intensityMultiplier !== 1.0) {
      console.log(`  🔥 Ajustando por intensidad (${intensityMultiplier}x)...`);
      scoringWeights.quizArtist *= intensityMultiplier;
      scoringWeights.quizGenre *= intensityMultiplier;
      scoringWeights.moodGenre *= intensityMultiplier;
      console.log('  📊 Pesos ajustados:', scoringWeights);
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
          // En modo estricto, TODOS los tracks son del artista, así que damos puntos base altos
          quizArtistBonus = scoringWeights.quizArtist * 3; // Triple puntos
          scoreBreakdown.push(`✨✨✨Selected:+${quizArtistBonus}`);
        } else {
          // Si es "aleatorio" (favoritos) → puntos normales
          quizArtistBonus = scoringWeights.favoriteArtist;
          scoreBreakdown.push(`⭐FavArtist:+${quizArtistBonus}`);
        }
        score += quizArtistBonus;
      } else if (useCustomArtists) {
        // Si está en modo estricto y NO es del artista → ERROR (no debería pasar)
        console.warn(`⚠️ Track NO es del artista seleccionado: ${track.artists[0].name} - ${track.name}`);
      }
      
      // FACTOR 3: ELIMINADO - Ya NO usamos keywords
      
      // FACTOR 4A: 🎸 GÉNERO SELECCIONADO (PRIORIDAD ALTA)
      let quizGenreBonus = 0;
      const trackGenres = track.artists.flatMap(artist => {
        const artistData = topArtists.items.find(a => a.id === artist.id);
        return artistData?.genres || [];
      });
      
      const selectedGenreMatches = trackGenres.filter(genre => 
        finalGenres.some(selectedGenre => 
          genre.toLowerCase().includes(selectedGenre.toLowerCase()) || 
          selectedGenre.toLowerCase().includes(genre.toLowerCase())
        )
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
      console.log(`    📊 ${score.toFixed(1)} pts: ${track.artists[0].name} - ${track.name}`);
      console.log(`       [${scoreBreakdown.join(' | ')}]`);
      
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
    
    console.log(`  ⚖️ Filtro: score >= ${minScore}`);
    console.log(`    ✅ Tracks válidos: ${highScoringTracks.length}/${scoredForMood.length}`);
    
    if (highScoringTracks.length < 20) {
      console.warn('  ⚠️ Pocos tracks, tomando todos...');
      highScoringTracks.length = 0;
      highScoringTracks.push(...scoredForMood
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
      );
    }
    
    // ORDENAR por score y tomar los mejores
    const sortedByMoodScore = highScoringTracks.sort((a, b) => b.score - a.score);
    
    // SELECCIÓN FINAL: Tomar lo que haya disponible (puede ser menos de 30)
    const finalCount = Math.min(30, sortedByMoodScore.length);
    
    console.log(`  📊 Tracks disponibles después de filtros: ${sortedByMoodScore.length}`);
    console.log(`  📊 Seleccionando: ${finalCount} tracks (puede ser menos de 30)`);
    
    // Tomar los mejores por score
    let finalSelectedTracks = sortedByMoodScore
      .slice(0, finalCount)
      .map(item => item.track);
    
    // Mezclar orden para variedad
    finalSelectedTracks.sort(() => Math.random() - 0.5);
    
    if (finalSelectedTracks.length < 30) {
      console.warn(`⚠️ ADVERTENCIA: Playlist con solo ${finalSelectedTracks.length} canciones`);
      console.warn(`   Esto es normal cuando se seleccionan artistas/géneros muy específicos`);
    }
    
    // LOGS DETALLADOS
    console.log('\n📊 === ANÁLISIS FINAL (EXCLUSIVO) ===');
    console.log(`✅ Tracks en la playlist: ${finalSelectedTracks.length}`);
    console.log(`   Seleccionados por score y filtros exclusivos`);
    
    const avgScore = sortedByMoodScore.slice(0, finalCount).reduce((sum, t) => sum + t.score, 0) / finalCount;
    console.log(`   - Score promedio: ${avgScore.toFixed(1)}`);
    
    const tracksWithGenres = sortedByMoodScore.slice(0, finalCount).filter(t => t.genreMatches > 0).length;
    console.log(`   - Con género del mood: ${tracksWithGenres}/${finalCount} (${(tracksWithGenres/finalCount*100).toFixed(0)}%)`);
    
    // Estadísticas de selección del usuario
    const tracksFromSelectedArtists = sortedByMoodScore.slice(0, finalCount).filter(t => t.quizArtistMatch).length;
    const tracksFromSelectedGenres = sortedByMoodScore.slice(0, finalCount).filter(t => t.quizGenreMatch).length;
    
    console.log('\n✨ === ESTADÍSTICAS DE SELECCIÓN ===');
    if (useCustomArtists && finalArtists.length > 0) {
      console.log(`   🎤 Artistas SELECCIONADOS: ${tracksFromSelectedArtists}/${finalCount} (${(tracksFromSelectedArtists/finalCount*100).toFixed(0)}%)`);
      console.log(`      ${finalArtists.join(', ')}`);
    } else if (finalArtists.length > 0) {
      console.log(`   🎤 Artistas FAVORITOS (aleatorio): ${tracksFromSelectedArtists}/${finalCount} (${(tracksFromSelectedArtists/finalCount*100).toFixed(0)}%)`);
      console.log(`      ${finalArtists.slice(0, 3).join(', ')}...`);
    }
    
    if (useCustomGenres && finalGenres.length > 0) {
      console.log(`   🎸 Géneros SELECCIONADOS: ${tracksFromSelectedGenres}/${finalCount} (${(tracksFromSelectedGenres/finalCount*100).toFixed(0)}%)`);
      console.log(`      ${finalGenres.join(', ')}`);
    } else if (finalGenres.length > 0) {
      console.log(`   🎸 Géneros DEL USUARIO (aleatorio): ${tracksFromSelectedGenres}/${finalCount} (${(tracksFromSelectedGenres/finalCount*100).toFixed(0)}%)`);
      console.log(`      ${finalGenres.slice(0, 3).join(', ')}...`);
    }
    
    console.log(`   🔥 Intensidad: ${intensityMultiplier}x`);
    
    console.log('\n🏆 TOP 10 TRACKS:');
    sortedByMoodScore.slice(0, 10).forEach((item, i) => {
      const indicators = [];
      if (item.genreMatches > 0) indicators.push(`🎸x${item.genreMatches}`);
      if (item.quizArtistMatch) indicators.push('✨Quiz');
      if (item.quizGenreMatch) indicators.push('✨Genre');
      if (Array.isArray(topArtistNames) && topArtistNames.length > 0 && topArtistNames.slice(0, 10).some(fav => 
        item.track.artists.some(a => a.name.toLowerCase() === fav.toLowerCase())
      )) indicators.push('⭐Fav');
      
      console.log(`  ${i + 1}. [${item.score.toFixed(0)}] ${indicators.join(' ')} ${item.track.artists[0].name} - ${item.track.name}`);
    });
    console.log('===================================\n');
    
    // Construir objeto de recomendaciones compatible
    const recommendations = {
      tracks: finalSelectedTracks
    };

    console.log(`✅ Recomendaciones obtenidas: ${recommendations.tracks.length} tracks`);

    // PASO 4: Crear playlist en Spotify
    const playlistInfo = MOOD_PLAYLIST_INFO[moodLower];
    
    // ✅ Usar el nombre personalizado del usuario o uno por defecto
    const playlistName = quizAnswers.playlistName || `${playlistInfo.namePrefix} - ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`;
    
    const playlistData = {
      name: playlistName,
      description: playlistInfo.description,
      public: false // Privada por defecto
    };

    const createdPlaylist = await spotifyService.createPlaylist(
      userProfile.id,
      playlistData,
      accessToken
    );

    console.log(`🎉 Playlist creada en Spotify: ${createdPlaylist.name}`);
    console.log(`🔗 URL: ${createdPlaylist.external_urls.spotify}`);

    // PASO 5: Agregar tracks a la playlist
    const trackUris = recommendations.tracks.map(track => track.uri);
    await spotifyService.addTracksToPlaylist(
      createdPlaylist.id,
      trackUris,
      accessToken
    );

    console.log(`🎶 ${trackUris.length} tracks agregados a la playlist`);

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

    console.log('✅ Playlist creada en Spotify (NO guardada en BD aún - se guardará al marcar como favorita)');

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
    console.error('❌ Error generando playlist:', error);
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
    const { data, error } = await supabase
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

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo playlists generadas:', error);
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
    const { error: playlistError } = await supabase
      .from('spotify_playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId); // ✅ Validación de usuario

    if (playlistError) throw playlistError;

    console.log('🗑️ Playlist eliminada correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando playlist:', error);
    throw error;
  }
};
