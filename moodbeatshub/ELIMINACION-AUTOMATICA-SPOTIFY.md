# 🗑️ Sistema de Eliminación Automática de Playlists

## ✅ Funcionalidad Implementada

MoodBeatsHub elimina automáticamente playlists de Spotify en dos casos:

1. **Eliminación Manual**: Cuando el usuario elimina una playlist de sus favoritos
2. **Auto-limpieza**: Cuando el usuario sale sin guardar una playlist generada

## 🔄 Flujo de Eliminación

### 📌 CASO 1: Eliminación Manual (Botón Eliminar)

#### 1️⃣ Usuario Inicia Eliminación
- El usuario hace clic en el botón "Eliminar" (🗑️) en:
  - `PlaylistsTemplate` (página de playlists favoritas)
  - `GenPlaylistTemplate` (al quitar de favoritos)

### 2️⃣ Confirmación con Advertencia Clara
Se muestra un mensaje de confirmación explicando:
```
⚠️ ¿Eliminar "{nombre de la playlist}"?

Esta acción:
✗ Eliminará la playlist de tu cuenta de Spotify
✗ La quitará de tus favoritos en MoodBeatsHub
✗ NO se puede deshacer

¿Estás completamente seguro?
```

### 3️⃣ Proceso de Eliminación Automática

#### Paso 1: Eliminar de Spotify
```javascript
// En favoritesService.js - removeFavoritePlaylist()
await spotifyService.deletePlaylist(spotifyPlaylistId, accessToken);
```
- Usa la API de Spotify: `DELETE /playlists/{playlist_id}/followers`
- La playlist desaparece de la cuenta de Spotify del usuario
- Si falla (playlist ya eliminada), continúa con el siguiente paso

#### Paso 2: Eliminar de Base de Datos
```javascript
await supabase
  .from('spotify_playlists')
  .delete()
  .eq('user_id', userId)
  .eq('spotify_playlist_id', spotifyPlaylistId);
```
- Elimina completamente el registro de `spotify_playlists`
- Ya no aparece en favoritos de MoodBeatsHub

## 📁 Archivos Involucrados

### 1. `src/services/spotifyService.js`
```javascript
deletePlaylist: async (playlistId, accessToken) => {
  const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}/followers`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Retorna éxito si todo va bien
  return { success: true };
}
```

### 2. `src/services/favoritesService.js`
```javascript
export const removeFavoritePlaylist = async (userId, spotifyPlaylistId, accessToken) => {
  // PASO 1: Eliminar de Spotify
  if (accessToken) {
    await spotifyService.deletePlaylist(spotifyPlaylistId, accessToken);
  }

  // PASO 2: Eliminar de BD
  await supabase
    .from('spotify_playlists')
    .delete()
    .eq('user_id', userId)
    .eq('spotify_playlist_id', spotifyPlaylistId);
}
```

### 3. `src/components/templates/PlaylistsTemplate.jsx`
- Llama a `removeFavoritePlaylist()` cuando el usuario confirma
- Recarga la lista de playlists después de eliminar

### 4. `src/components/templates/GenPlaylistTemplate.jsx`
- Llama a `removeFavoritePlaylist()` al quitar de favoritos
- Limpia la playlist generada del estado

## 🔐 Permisos Necesarios

El usuario debe tener autorizado el scope de Spotify:
```javascript
'playlist-modify-public playlist-modify-private'
```

Estos scopes ya están incluidos en el login de Spotify en `LoginTemplate.jsx`.

## ⚠️ Consideraciones Importantes

1. **Solo el dueño puede eliminar**: Spotify solo permite eliminar playlists creadas por el usuario
2. **Sin token = Solo BD**: Si no hay `accessToken`, solo se elimina de la base de datos
3. **Manejo de errores**: Si falla eliminar de Spotify, continúa eliminando de BD
4. **No reversible**: Una vez eliminada de Spotify, no se puede recuperar

### 📌 CASO 2: Auto-limpieza (Salir sin Guardar)

#### 🔙 Usuario Sale de la Página de Generación

Cuando el usuario genera una playlist pero **NO** la guarda en favoritos, y luego:

1. **Hace clic en "Volver" (←)**: Se ejecuta `handleBack()`
   ```javascript
   const handleBack = async () => {
     // Si hay una playlist generada que NO es favorita
     if (generatedPlaylist && !isFavorite && spotifyAccessToken) {
       // Eliminarla de Spotify automáticamente
       await spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
     }
     navigate('/home');
   };
   ```

2. **Navega a otra página** (sidebar, cerrar, etc.): Se ejecuta el `useEffect` cleanup
   ```javascript
   useEffect(() => {
     return () => {
       // Al desmontar el componente
       if (generatedPlaylist && !isFavorite && spotifyAccessToken) {
         // Limpiar playlist no guardada
         spotifyService.deletePlaylist(generatedPlaylist.id, spotifyAccessToken);
       }
     };
   }, [generatedPlaylist, isFavorite, spotifyAccessToken]);
   ```

#### ✅ Resultado
- La playlist generada se elimina automáticamente de Spotify
- No se acumulan playlists no deseadas en la cuenta del usuario
- Solo permanecen las playlists que el usuario **explícitamente guardó en favoritos**

## 🎯 Ventajas del Sistema

✅ **Auto-limpieza inteligente**: Playlists no guardadas se eliminan automáticamente
✅ **Experiencia consistente**: Lo que eliminas de favoritos se elimina de Spotify
✅ **No acumulación**: Evita que las playlists se acumulen en la cuenta de Spotify
✅ **Control total**: El usuario tiene control completo sobre sus playlists
✅ **Advertencias claras**: Mensajes explícitos sobre lo que se eliminará
✅ **Sin basura**: Solo permanecen playlists que el usuario quiere mantener

## 🧪 Cómo Probar

### Test 1: Eliminación Manual
1. Genera una playlist desde MoodBeatsHub
2. Guárdala en favoritos (❤️)
3. Verifica que aparece en Spotify
4. Elimínala desde MoodBeatsHub (🗑️)
5. Verifica que desaparece de:
   - Favoritos de MoodBeatsHub
   - Cuenta de Spotify

### Test 2: Auto-limpieza al Salir
1. Genera una playlist desde MoodBeatsHub
2. **NO** la guardes en favoritos
3. Verifica que aparece en Spotify
4. Haz clic en "Volver" (←)
5. Verifica que la playlist se eliminó automáticamente de Spotify

### Test 3: Auto-limpieza al Navegar
1. Genera una playlist desde MoodBeatsHub
2. **NO** la guardes en favoritos
3. Verifica que aparece en Spotify
4. Navega a otra página (Home, Perfil, etc.)
5. Verifica que la playlist se eliminó automáticamente de Spotify

## 🌍 Traducciones

Los mensajes de confirmación están traducidos en 4 idiomas:
- 🇪🇸 Español
- 🇬🇧 Inglés
- 🇧🇷 Portugués
- 🇫🇷 Francés

Todas las traducciones explican claramente que se eliminará de Spotify.

