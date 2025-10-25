# 🎵 Sistema de Generación de Playlists por Mood

## ✅ Implementación Completa

### 📋 Resumen del Sistema

El sistema de generación automática de playlists está **completamente implementado** y funcional. Incluye:

1. **Base de datos en Supabase** con trigger automático
2. **Servicio de generación** con algoritmo de recomendaciones de Spotify
3. **Hook personalizado** para React
4. **Componente de ejemplo** listo para usar

---

## 🗄️ Estructura de Base de Datos

### Tablas Modificadas

#### `spotify_playlists`
```sql
-- Nuevas columnas agregadas:
is_generated BOOLEAN DEFAULT FALSE
generation_params JSONB
```

### Trigger Automático

Se creó un **trigger** que automáticamente guarda las playlists generadas en `user_favorites`:

```sql
CREATE TRIGGER trigger_auto_save_generated_playlist
  AFTER INSERT ON spotify_playlists
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_generated_playlist();
```

**Funcionamiento:**
- Cuando se inserta una playlist con `is_generated = TRUE`
- El trigger extrae `user_id` y `mood_id` de `generation_params`
- Automáticamente crea un registro en `user_favorites`

---

## 🎯 Parámetros de Generación por Mood

### Feliz 😊
```javascript
{
  target_valence: 0.8,      // Alta positividad
  target_energy: 0.7,        // Energía moderada-alta
  target_danceability: 0.7,  // Muy bailable
  limit: 30
}
```

### Triste 💙
```javascript
{
  target_valence: 0.3,       // Baja positividad
  target_acousticness: 0.7,  // Sonido acústico
  target_energy: 0.4,        // Baja energía
  limit: 30
}
```

### Motivado 🔥
```javascript
{
  target_energy: 0.9,        // Energía muy alta
  target_tempo: 140,         // 140 BPM (rápido)
  target_valence: 0.7,       // Positividad alta
  limit: 30
}
```

### Relajado 🌙
```javascript
{
  target_valence: 0.5,       // Positividad neutra
  target_acousticness: 0.8,  // Muy acústico
  target_energy: 0.3,        // Muy tranquilo
  target_instrumentalness: 0.5, // Preferencia instrumental
  limit: 30
}
```

---

## 🚀 Cómo Usar el Sistema

### 1. Usar el Hook Directamente

```javascript
import { usePlaylistGeneration } from '../hooks/usePlaylistGeneration';

function MyComponent() {
  const { generatePlaylist, loading, error, generatedPlaylist } = usePlaylistGeneration();

  const handleGenerate = async () => {
    const result = await generatePlaylist(
      'feliz',      // mood
      userId,       // ID del usuario en Supabase
      moodId        // ID del mood en la BD
    );

    if (result) {
      console.log('Playlist creada:', result.playlist);
      console.log('URL Spotify:', result.playlist.url);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Generando...' : 'Generar Playlist'}
    </button>
  );
}
```

### 2. Usar el Componente de Ejemplo

```javascript
import GeneratePlaylistButton from '../components/molecules/GeneratePlaylistButton';

function MoodPage() {
  const handlePlaylistCreated = (result) => {
    console.log('Nueva playlist:', result.playlist.name);
    // Actualizar UI, mostrar notificación, etc.
  };

  return (
    <GeneratePlaylistButton
      mood="feliz"
      onPlaylistGenerated={handlePlaylistCreated}
    />
  );
}
```

### 3. Llamar al Servicio Directamente

```javascript
import { generatePlaylistByMood } from '../services/playlistGenerationService';

const result = await generatePlaylistByMood(
  'motivado',     // mood
  accessToken,    // Token de Spotify
  userId,         // ID usuario Supabase
  moodId          // ID mood en BD
);

console.log(result.playlist);
console.log(result.tracks);
console.log(result.generationInfo);
```

---

## 📊 Estructura de Respuesta

### `result.playlist`
```javascript
{
  id: "spotify_playlist_id",
  name: "😊 Vibes Felices - 25/10/2025",
  description: "Música alegre y positiva...",
  url: "https://open.spotify.com/playlist/...",
  imageUrl: "https://...",
  trackCount: 30,
  mood: "feliz",
  supabaseId: "uuid"
}
```

### `result.tracks`
```javascript
[
  {
    id: "track_id",
    name: "Happy Song",
    artists: "Artist Name",
    album: "Album Name",
    duration_ms: 180000,
    preview_url: "https://..."
  },
  // ... más tracks
]
```

### `result.generationInfo`
```javascript
{
  basedOnTopTracks: 5,
  basedOnTopArtists: 5,
  audioFeatures: {
    valence: 0.8,
    energy: 0.7,
    // ... otros parámetros usados
  }
}
```

---

## 🔧 Funciones Adicionales

### Obtener Playlists Generadas del Usuario

```javascript
import { getUserGeneratedPlaylists } from '../services/playlistGenerationService';

const playlists = await getUserGeneratedPlaylists(userId);
console.log(playlists);
```

### Eliminar Playlist

```javascript
import { deleteGeneratedPlaylist } from '../services/playlistGenerationService';

await deleteGeneratedPlaylist(playlistId, userId);
```

---

## 🎨 Integración en Templates

### Ejemplo: FelizTemplate.jsx

```javascript
import GeneratePlaylistButton from '../components/molecules/GeneratePlaylistButton';

function FelizTemplate() {
  const handlePlaylistGenerated = (result) => {
    // Mostrar notificación
    alert(`¡Playlist "${result.playlist.name}" creada con ${result.playlist.trackCount} canciones!`);
    
    // Opcional: Redirigir a Spotify
    window.open(result.playlist.url, '_blank');
  };

  return (
    <div className="feliz-template">
      <h1>😊 Mood: Feliz</h1>
      
      <GeneratePlaylistButton
        mood="feliz"
        onPlaylistGenerated={handlePlaylistGenerated}
      />
      
      {/* Resto del contenido... */}
    </div>
  );
}
```

---

## 🔐 Permisos Requeridos de Spotify

El sistema requiere los siguientes scopes en la autenticación OAuth:

```javascript
const REQUIRED_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',              // Para obtener top tracks/artists
  'playlist-modify-public',      // Para crear playlists públicas
  'playlist-modify-private',     // Para crear playlists privadas
  'user-read-recently-played'    // Para mejor personalización
];
```

---

## 🧪 Testing del Sistema

### Test Manual

1. **Verificar autenticación:**
   ```javascript
   const { accessToken } = useSpotifyTokens();
   console.log('Token:', accessToken ? '✅' : '❌');
   ```

2. **Generar playlist de prueba:**
   ```javascript
   await generatePlaylist('feliz', userId, moodId);
   ```

3. **Verificar en Supabase:**
   - Revisar tabla `spotify_playlists` (debe tener `is_generated = TRUE`)
   - Revisar tabla `user_favorites` (debe existir el registro automático)

4. **Verificar en Spotify:**
   - Abrir la app de Spotify
   - Buscar la playlist recién creada
   - Verificar que tiene ~30 canciones

---

## 📝 Logs del Sistema

El servicio genera logs detallados:

```
🎵 Iniciando generación de playlist para mood: feliz
👤 Usuario: John Doe
🎵 Top tracks obtenidos: 5
🎤 Top artistas obtenidos: 5
🎯 Parámetros de recomendación: { ... }
✅ Recomendaciones obtenidas: 30 tracks
🎉 Playlist creada en Spotify: 😊 Vibes Felices - 25/10/2025
🔗 URL: https://open.spotify.com/playlist/...
🎶 30 tracks agregados a la playlist
💾 Playlist guardada en Supabase (trigger activado para user_favorites)
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

1. **Token expirado:**
   ```javascript
   Error: Spotify API error: 401
   ```
   **Solución:** Renovar el token con `useSpotifyTokens`

2. **Usuario sin historial:**
   ```javascript
   // El sistema usa géneros por defecto si no hay top tracks/artists
   seed_genres: ['pop', 'dance'] // Para mood feliz
   ```

3. **Mood inválido:**
   ```javascript
   Error: Mood "random" no es válido
   ```
   **Solución:** Usar: 'feliz', 'triste', 'motivado' o 'relajado'

---

## 🎯 Próximos Pasos Sugeridos

1. **Agregar el botón en cada template de mood** (Feliz, Triste, Motivado, Relajado)
2. **Crear una vista de "Mis Playlists Generadas"** usando `getUserGeneratedPlaylists`
3. **Implementar notificaciones toast** para mejor UX
4. **Agregar animaciones** durante la generación
5. **Permitir regenerar** si al usuario no le gusta el resultado

---

## 📚 Archivos Creados

```
src/
├── services/
│   ├── playlistGenerationService.js  ✅ Servicio completo
│   └── spotifyService.js             ✅ Ya existía (APIs de Spotify)
├── hooks/
│   └── usePlaylistGeneration.js      ✅ Hook personalizado
└── components/
    └── molecules/
        ├── GeneratePlaylistButton.jsx ✅ Componente de ejemplo
        └── GeneratePlaylistButton.css ✅ Estilos
```

---

## ✨ Resultado Final

El sistema está **100% funcional** y listo para usar. Cuando un usuario:

1. Hace clic en "Generar Playlist"
2. El sistema analiza sus gustos musicales
3. Genera recomendaciones personalizadas según el mood
4. Crea la playlist en Spotify
5. La guarda automáticamente en Supabase
6. El trigger inserta en `user_favorites`
7. El usuario puede ver y reproducir su playlist

**¡Todo automático!** 🎉
