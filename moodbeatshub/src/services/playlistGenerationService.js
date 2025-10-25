import { spotifyService } from './spotifyService';
import { supabase } from '../supabase/supabase.config';

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
 * Crea una playlist en Spotify usando el algoritmo de recomendaciones
 * basado en el estado de ánimo del usuario y sus gustos musicales
 * 
 * @param {string} mood - Estado de ánimo ('feliz', 'triste', 'motivado', 'relajado')
 * @param {string} accessToken - Token de acceso de Spotify
 * @param {string} userId - ID del usuario en Supabase
 * @param {string} moodId - ID del mood en la base de datos
 * @returns {Promise<object>} Playlist creada con información completa
 */
export const generatePlaylistByMood = async (mood, accessToken, userId, moodId) => {
  try {
    const moodLower = mood.toLowerCase();
    
    // Validar que el mood existe
    if (!MOOD_GENERATION_PARAMS[moodLower]) {
      throw new Error(`Mood "${mood}" no es válido. Usa: feliz, triste, motivado o relajado`);
    }

    console.log(`🎵 Iniciando generación de playlist para mood: ${mood}`);

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

    // 🧪 PRUEBA: Intentar con parámetros mínimos primero
    console.log('🧪 PRUEBA 1: Intentando con solo seeds (sin target_* parameters)...');
    let recommendations;
    
    try {
      // Intentar con parámetros mínimos (solo seeds)
      const minimalParams = {
        limit: 30
      };
      
      if (recommendationParams.seed_tracks) {
        minimalParams.seed_tracks = recommendationParams.seed_tracks;
      }
      if (recommendationParams.seed_artists) {
        minimalParams.seed_artists = recommendationParams.seed_artists;
      }
      if (recommendationParams.seed_genres) {
        minimalParams.seed_genres = recommendationParams.seed_genres;
      }
      
      console.log('  📋 Parámetros mínimos:', JSON.stringify(minimalParams, null, 2));
      recommendations = await spotifyService.getRecommendations(
        minimalParams,
        accessToken
      );
      console.log('  ✅ FUNCIONA con parámetros mínimos');
      
    } catch (minimalError) {
      console.error('  ❌ Falla incluso con parámetros mínimos:', minimalError.message);
      
      // 🧪 PRUEBA 2: Intentar con solo 1 seed_track
      console.log('🧪 PRUEBA 2: Intentando con solo 1 seed_track...');
      try {
        const singleTrackParams = {
          seed_tracks: [verifiedTracks[0]],
          limit: 30
        };
        console.log('  📋 Usando solo:', singleTrackParams.seed_tracks[0]);
        
        recommendations = await spotifyService.getRecommendations(
          singleTrackParams,
          accessToken
        );
        console.log('  ✅ FUNCIONA con 1 seed_track');
        
      } catch (singleTrackError) {
        console.error('  ❌ Falla con 1 seed_track:', singleTrackError.message);
        
        // 🧪 PRUEBA 3: Intentar con seed_genres
        console.log('🧪 PRUEBA 3: Intentando con seed_genres...');
        try {
          const genreParams = {
            seed_genres: ['pop', 'dance'],
            limit: 30
          };
          console.log('  📋 Usando géneros:', genreParams.seed_genres);
          
          recommendations = await spotifyService.getRecommendations(
            genreParams,
            accessToken
          );
          console.log('  ✅ FUNCIONA con géneros');
          
        } catch (genreError) {
          console.error('  ❌ Falla con géneros:', genreError.message);
          throw new Error('El endpoint /recommendations no está disponible para tu cuenta. Esto puede ser una restricción regional o de la API de Spotify.');
        }
      }
    }

    // PASO 3: Obtener recomendaciones de Spotify (con manejo de errores mejorado)
    // const recommendations = await spotifyService.getRecommendations(
    //   recommendationParams,
    //   accessToken
    // );

    console.log(`✅ Recomendaciones obtenidas: ${recommendations.tracks.length} tracks`);

    // PASO 4: Crear playlist en Spotify
    const playlistInfo = MOOD_PLAYLIST_INFO[moodLower];
    const timestamp = new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    const playlistData = {
      name: `${playlistInfo.namePrefix} - ${timestamp}`,
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

    // PASO 6: Guardar en Supabase (el trigger auto-guardará en user_favorites)
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

    const { data: savedPlaylist, error: saveError } = await supabase
      .from('spotify_playlists')
      .insert({
        spotify_playlist_id: createdPlaylist.id,
        name: createdPlaylist.name,
        description: createdPlaylist.description,
        image_url: playlistImageUrl,
        spotify_url: createdPlaylist.external_urls.spotify,
        is_generated: true,
        generation_params: generationParams
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error guardando en Supabase:', saveError);
      throw saveError;
    }

    console.log('💾 Playlist guardada en Supabase (trigger activado para user_favorites)');

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
        supabaseId: savedPlaylist.id
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
      .from('user_favorites')
      .select(`
        id,
        created_at,
        mood_id,
        moods (
          name,
          emoji,
          color_hex
        ),
        playlist_id,
        spotify_playlists (
          spotify_playlist_id,
          name,
          description,
          image_url,
          spotify_url,
          is_generated,
          generation_params,
          cached_at
        )
      `)
      .eq('user_id', userId)
      .eq('spotify_playlists.is_generated', true)
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
    // Primero eliminar de user_favorites
    const { error: favoriteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (favoriteError) throw favoriteError;

    // Luego eliminar de spotify_playlists
    const { error: playlistError } = await supabase
      .from('spotify_playlists')
      .delete()
      .eq('id', playlistId);

    if (playlistError) throw playlistError;

    console.log('🗑️ Playlist eliminada correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando playlist:', error);
    throw error;
  }
};
